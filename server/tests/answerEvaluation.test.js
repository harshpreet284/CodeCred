import test from 'node:test';
import assert from 'node:assert';
import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import { evaluateAnswers } from '../src/controllers/projectController.js';
import { setClient_forTesting, resetClient_forTesting } from '../src/services/ai/aiProvider.js';
// We must import the model to create data for the dynamic import in controller
import '../src/models/ProjectAnalysis.js'; 

let mongoServer;
let aiCallCount = 0;

const runTestWithMock = (mockResponseObject) => {
  aiCallCount = 0;
  setClient_forTesting({
    models: {
      generateContent: async (args) => {
        aiCallCount++;
        if (mockResponseObject instanceof Error) throw mockResponseObject;
        if (typeof mockResponseObject === 'function') return { text: mockResponseObject(args.contents) };
        if (typeof mockResponseObject === 'string') return { text: mockResponseObject };
        return { text: JSON.stringify(mockResponseObject) };
      }
    }
  });
};

const mockReq = (body, analysisId) => ({
  params: { analysisId: analysisId || 'fake-id' },
  body
});

const mockRes = () => {
  const res = {
    status: function (code) {
      this.statusCode = code;
      return this;
    },
    json: function (data) {
      this.data = data;
      return this;
    }
  };
  return res;
};

const mockNext = () => {
  let error = null;
  const nextFn = (err) => { error = err; };
  return { nextFn, getError: () => error };
};

const validSessionData = [
  {
    question: {
      id: 'q_001',
      text: 'How does Express route traffic?',
      targetEvidenceRefs: ['ev_001']
    },
    answer: 'Using routers.'
  }
];

test('Answer Evaluation Integration', async (t) => {
  let validAnalysisId;

  t.before(async () => {
    mongoServer = await MongoMemoryServer.create();
    const uri = mongoServer.getUri();
    await mongoose.connect(uri);
  });

  t.after(async () => {
    await mongoose.disconnect();
    await mongoServer.stop();
  });

  t.beforeEach(async () => {
    resetClient_forTesting();
    aiCallCount = 0;

    // Create a fresh analysis doc for each test
    const Model = mongoose.model('ProjectAnalysis');
    await Model.deleteMany({});
    
    // We create a doc that will yield 'ev_001' for 'Express'
    const doc = await Model.create({
      repository: { owner: 'owner', name: 'repo', fullName: 'owner/repo', defaultBranch: 'main' },
      summary: { 
        languages: [], 
        frameworks: [{ name: 'Express', type: 'framework', provenance: [{ path: 'package.json', field: 'dependencies', detail: '' }] }], 
        libraries: [] 
      },
      structure: { directories: [], importantFiles: [], entryPoints: [] },
      dependencies: { manifests: [], packages: [] },
      api: { indicators: [] },
      database: { indicators: [] },
      authentication: { indicators: [] },
      testing: { indicators: [] },
      documentation: { indicators: [] },
      deployment: { indicators: [] },
      analysisMetadata: { analysisVersion: '1.0.0', limitations: [] }
    });
    validAnalysisId = doc._id.toString();
  });

  t.afterEach(() => {
    resetClient_forTesting();
  });

  await t.test('C/D. Missing/Malformed sessionData -> 400', async () => {
    const { nextFn, getError } = mockNext();
    await evaluateAnswers(mockReq({}, validAnalysisId), mockRes(), nextFn);
    assert.strictEqual(getError().statusCode, 400);

    const { nextFn: nextFn2, getError: getError2 } = mockNext();
    await evaluateAnswers(mockReq({ sessionData: "not array" }, validAnalysisId), mockRes(), nextFn2);
    assert.strictEqual(getError2().statusCode, 400);
  });

  await t.test('E. Missing question -> 400', async () => {
    const { nextFn, getError } = mockNext();
    await evaluateAnswers(mockReq({ sessionData: [{ answer: 'test' }] }, validAnalysisId), mockRes(), nextFn);
    assert.strictEqual(getError().statusCode, 400);
  });

  await t.test('F/G. Missing or whitespace answer -> 400', async () => {
    const { nextFn, getError } = mockNext();
    await evaluateAnswers(mockReq({
      sessionData: [{ question: validSessionData[0].question, answer: '   ' }]
    }, validAnalysisId), mockRes(), nextFn);
    assert.strictEqual(getError().statusCode, 400);
  });

  await t.test('H. Short non-empty answer reaches evaluation', async () => {
    runTestWithMock({
      evaluations: [{ questionId: 'q_001', isCorrect: true, completeness: 'complete', feedback: 'ok', unsupportedClaims: [] }]
    });
    const res = mockRes();
    const { nextFn } = mockNext();
    await evaluateAnswers(mockReq({
      sessionData: [{ question: validSessionData[0].question, answer: 'Exp' }]
    }, validAnalysisId), res, nextFn);
    assert.strictEqual(res.statusCode, 200);
  });

  await t.test('I. Invalid evidence reference -> reject before Gemini', async () => {
    runTestWithMock({}); // should not be called
    const { nextFn, getError } = mockNext();
    await evaluateAnswers(mockReq({
      sessionData: [{ question: { ...validSessionData[0].question, targetEvidenceRefs: ['invalid_id'] }, answer: 'Exp' }]
    }, validAnalysisId), mockRes(), nextFn);
    assert.strictEqual(getError().statusCode, 400);
    assert.strictEqual(aiCallCount, 0);
  });

  await t.test('A/L/M/Y. Valid single evaluation mapping & order reconstruction', async () => {
    runTestWithMock({
      evaluations: [
        { questionId: 'q_002', isCorrect: false, completeness: 'incomplete', feedback: 'bad', unsupportedClaims: [] },
        { questionId: 'q_001', isCorrect: true, completeness: 'complete', feedback: 'ok', unsupportedClaims: [] }
      ]
    });
    
    // Simulate multi-question request. Note: Context provides ev_001 for both for simplicity.
    const req = mockReq({
      sessionData: [
        validSessionData[0],
        { question: { id: 'q_002', text: 'Q2', targetEvidenceRefs: ['ev_001'] }, answer: 'A2' }
      ]
    }, validAnalysisId);
    const res = mockRes();
    await evaluateAnswers(req, res, mockNext().nextFn);
    
    assert.strictEqual(res.statusCode, 200);
    assert.strictEqual(res.data.data.evaluations[0].questionId, 'q_001');
    assert.strictEqual(res.data.data.evaluations[1].questionId, 'q_002');
  });

  await t.test('J/K/L. Unknown, Omitted, Duplicate questionId -> reject with 0 retries', async () => {
    const cases = [
      [{ questionId: 'q_unknown', isCorrect: true, completeness: 'complete', feedback: 'ok', unsupportedClaims: [] }],
      [], // omitted
      [
        { questionId: 'q_001', isCorrect: true, completeness: 'complete', feedback: 'ok', unsupportedClaims: [] },
        { questionId: 'q_001', isCorrect: true, completeness: 'complete', feedback: 'ok', unsupportedClaims: [] }
      ]
    ];

    for (const invalidOutput of cases) {
      runTestWithMock({ evaluations: invalidOutput });
      const { nextFn, getError } = mockNext();
      await evaluateAnswers(mockReq({ sessionData: validSessionData }, validAnalysisId), mockRes(), nextFn);
      
      assert.strictEqual(getError().statusCode, 502);
      assert.strictEqual(getError().code, 'AI_GROUNDING_FAILED');
    }
  });

  await t.test('N/O/P. Transient/Malformed failure retries exactly once', async () => {
    let calls = 0;
    runTestWithMock(() => {
      calls++;
      if (calls === 1) throw new Error('Transient 500');
      return '{ malformed json';
    });

    const { nextFn, getError } = mockNext();
    await evaluateAnswers(mockReq({ sessionData: validSessionData }, validAnalysisId), mockRes(), nextFn);
    
    assert.strictEqual(calls, 2);
    assert.strictEqual(getError().code, 'AI_GENERATION_FAILED');
  });

  await t.test('U/V/W. Raw MongoDB/Github/Source never reaches Gemini', async () => {
    runTestWithMock((prompt) => {
      assert.ok(!prompt.includes(validAnalysisId));
      assert.ok(!prompt.includes('__v'));
      return JSON.stringify({
        evaluations: [{ questionId: 'q_001', isCorrect: true, completeness: 'complete', feedback: 'ok', unsupportedClaims: [] }]
      });
    });

    const res = mockRes();
    await evaluateAnswers(mockReq({ sessionData: validSessionData }, validAnalysisId), res, mockNext().nextFn);
    assert.strictEqual(res.statusCode, 200);
  });
});
