import test from 'node:test';
import assert from 'node:assert';
import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import { evaluateSessionAnswers } from '../src/services/ai/answerEvaluator.js';
import { setClient_forTesting, resetClient_forTesting } from '../src/services/ai/aiProvider.js';
import '../src/models/ProjectAnalysis.js'; 

let mongoServer;
let aiCallCount = 0;

const runTestWithMock = (mockResponseObject) => {
  aiCallCount = 0;
  const generateFn = async (args) => {
    aiCallCount++;
    if (mockResponseObject instanceof Error) throw mockResponseObject;
    if (typeof mockResponseObject === 'function') {
      const contentStr = args?.messages ? args.messages[args.messages.length - 1].content : args.contents;
      return { text: mockResponseObject(contentStr) };
    }
    if (typeof mockResponseObject === 'string') return { text: mockResponseObject };
    return { text: JSON.stringify(mockResponseObject) };
  };

  setClient_forTesting({
    models: { generateContent: generateFn },
    chat: {
      completions: {
        create: async (args) => {
          const res = await generateFn(args);
          return { choices: [{ message: { content: res.text } }] };
        }
      }
    }
  });
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

test('Answer Evaluation Service (AI Logic)', async (t) => {
  let doc;

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

    const Model = mongoose.model('ProjectAnalysis');
    await Model.deleteMany({});
    
    doc = await Model.create({
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
  });

  t.afterEach(() => {
    resetClient_forTesting();
  });

  await t.test('E. Missing question -> 400', async () => {
    try {
      await evaluateSessionAnswers(doc, [{ answer: 'test' }]);
      assert.fail('Should have thrown');
    } catch (err) {
      assert.strictEqual(err.statusCode, 400);
    }
  });

  await t.test('F/G. Missing or whitespace answer -> 400', async () => {
    try {
      await evaluateSessionAnswers(doc, [{ question: validSessionData[0].question, answer: '   ' }]);
      assert.fail('Should have thrown');
    } catch (err) {
      assert.strictEqual(err.statusCode, 400);
    }
  });

  await t.test('H. Short non-empty answer reaches evaluation', async () => {
    runTestWithMock({
      evaluations: [{ questionId: 'q_001', isCorrect: true, completeness: 'complete', feedback: 'ok', unsupportedClaims: [] }],
      knowledgeGaps: []
    });
    const result = await evaluateSessionAnswers(doc, [{ question: validSessionData[0].question, answer: 'Exp' }]);
    assert.strictEqual(result.evaluations[0].questionId, 'q_001');
  });

  await t.test('I. Invalid evidence reference -> reject before AI provider', async () => {
    runTestWithMock({}); // should not be called
    try {
      await evaluateSessionAnswers(doc, [{ question: { ...validSessionData[0].question, targetEvidenceRefs: ['invalid_id'] }, answer: 'Exp' }]);
      assert.fail('Should have thrown');
    } catch (err) {
      assert.strictEqual(err.statusCode, 400);
      assert.strictEqual(aiCallCount, 0);
    }
  });

  await t.test('A/L/M/Y. Valid single evaluation mapping & order reconstruction', async () => {
    runTestWithMock({
      evaluations: [
        { questionId: 'q_002', isCorrect: false, completeness: 'incomplete', feedback: 'bad', unsupportedClaims: [] },
        { questionId: 'q_001', isCorrect: true, completeness: 'complete', feedback: 'ok', unsupportedClaims: [] }
      ],
      knowledgeGaps: []
    });
    
    const result = await evaluateSessionAnswers(doc, [
        validSessionData[0],
        { question: { id: 'q_002', text: 'Q2', targetEvidenceRefs: ['ev_001'] }, answer: 'A2' }
    ]);
    
    assert.strictEqual(result.evaluations[0].questionId, 'q_001');
    assert.strictEqual(result.evaluations[1].questionId, 'q_002');
  });

  await t.test('J/K/L. Unknown, Omitted, Duplicate questionId -> reject with 0 retries', async () => {
    const cases = [
      { evaluations: [{ questionId: 'q_unknown', isCorrect: true, completeness: 'complete', feedback: 'ok', unsupportedClaims: [] }], knowledgeGaps: [] },
      { evaluations: [], knowledgeGaps: [] }, // omitted
      {
        evaluations: [
          { questionId: 'q_001', isCorrect: true, completeness: 'complete', feedback: 'ok', unsupportedClaims: [] },
          { questionId: 'q_001', isCorrect: true, completeness: 'complete', feedback: 'ok', unsupportedClaims: [] }
        ],
        knowledgeGaps: []
      }
    ];

    for (const invalidOutput of cases) {
      runTestWithMock(invalidOutput);
      try {
        await evaluateSessionAnswers(doc, validSessionData);
        assert.fail('Should have thrown');
      } catch (err) {
        assert.strictEqual(err.statusCode, 502);
        assert.strictEqual(err.code, 'AI_GROUNDING_FAILED');
      }
    }
  });

  await t.test('N/O/P. Transient/Malformed failure retries exactly once', async () => {
    let calls = 0;
    runTestWithMock(() => {
      calls++;
      if (calls === 1) throw new Error('Transient 500');
      return '{ malformed json';
    });

    try {
      await evaluateSessionAnswers(doc, validSessionData);
      assert.fail('Should have thrown');
    } catch (err) {
      assert.strictEqual(calls, 2);
      assert.strictEqual(err.code, 'AI_GENERATION_FAILED');
    }
  });

  await t.test('U/V/W. Raw MongoDB/Github/Source never reaches AI provider', async () => {
    runTestWithMock((prompt) => {
      assert.ok(!prompt.includes(doc._id.toString()));
      assert.ok(!prompt.includes('__v'));
      return JSON.stringify({
        evaluations: [{ questionId: 'q_001', isCorrect: true, completeness: 'complete', feedback: 'ok', unsupportedClaims: [] }],
        knowledgeGaps: []
      });
    });

    const result = await evaluateSessionAnswers(doc, validSessionData);
    assert.ok(result);
  });

  await t.test('Knowledge Gaps Validation (A-I)', async () => {
    runTestWithMock({
      evaluations: [{ questionId: 'q_001', isCorrect: true, completeness: 'complete', feedback: 'ok', unsupportedClaims: [] }],
      knowledgeGaps: [{ topic: 'A', gap: 'B', recommendation: 'C' }]
    });
    const result1 = await evaluateSessionAnswers(doc, validSessionData);
    assert.strictEqual(result1.knowledgeGaps.length, 1);

    const failCases = [
      { evaluations: [{ questionId: 'q_001', isCorrect: true, completeness: 'complete', feedback: 'ok', unsupportedClaims: [] }] }, // missing
      { evaluations: [{ questionId: 'q_001', isCorrect: true, completeness: 'complete', feedback: 'ok', unsupportedClaims: [] }], knowledgeGaps: "not-an-array" }, // not array
      { evaluations: [{ questionId: 'q_001', isCorrect: true, completeness: 'complete', feedback: 'ok', unsupportedClaims: [] }], knowledgeGaps: [{ gap: 'B', recommendation: 'C' }] }, // missing topic
      { evaluations: [{ questionId: 'q_001', isCorrect: true, completeness: 'complete', feedback: 'ok', unsupportedClaims: [] }], knowledgeGaps: [{ topic: 'A', recommendation: 'C' }] }, // missing gap
      { evaluations: [{ questionId: 'q_001', isCorrect: true, completeness: 'complete', feedback: 'ok', unsupportedClaims: [] }], knowledgeGaps: [{ topic: 'A', gap: 'B' }] }, // missing recommendation
      { evaluations: [{ questionId: 'q_001', isCorrect: true, completeness: 'complete', feedback: 'ok', unsupportedClaims: [] }], knowledgeGaps: [{ topic: 123, gap: 'B', recommendation: 'C' }] }, // not strings
      { evaluations: [{ questionId: 'q_001', isCorrect: true, completeness: 'complete', feedback: 'ok', unsupportedClaims: [] }], knowledgeGaps: [{ topic: '  ', gap: 'B', recommendation: 'C' }] } // empty whitespace
    ];

    for (const failCase of failCases) {
      runTestWithMock(failCase);
      try {
        await evaluateSessionAnswers(doc, validSessionData);
        assert.fail('Should have thrown');
      } catch (err) {
        assert.strictEqual(err.statusCode, 502);
      }
    }
  });
});
