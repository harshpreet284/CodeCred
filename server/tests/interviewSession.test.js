import test from 'node:test';
import assert from 'node:assert';
import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import { createInterviewSession, getInterviewSession, evaluateInterviewSession } from '../src/services/interviewSessionService.js';
import { setClient_forTesting, resetClient_forTesting } from '../src/services/ai/aiProvider.js';
import { InterviewSession } from '../src/models/InterviewSession.js';
import '../src/models/ProjectAnalysis.js';

let mongoServer;
let fakeAnalysisId;

const runTestWithMock = (mockResponseObject) => {
  const generateFn = async (args) => {
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

test('Interview Session Persistence', async (t) => {
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

    const Model = mongoose.model('ProjectAnalysis');
    await Model.deleteMany({});
    await InterviewSession.deleteMany({});
    
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
    fakeAnalysisId = doc._id.toString();
  });

  t.afterEach(async () => {
    resetClient_forTesting();
  });

  await t.test('createInterviewSession creates a session with questions and in_progress status', async (t) => {
    runTestWithMock({
      questions: [
        { category: 'architecture', difficulty: 'beginner', text: 'How does Express work?' },
        { category: 'architecture', difficulty: 'beginner', text: 'Why use Express?' },
        { category: 'architecture', difficulty: 'beginner', text: 'What is Express routing?' }
      ]
    });
    
    const sessionDTO = await createInterviewSession(fakeAnalysisId);
    
    assert.strictEqual(sessionDTO.status, 'in_progress');
    assert.strictEqual(sessionDTO.analysisId.toString(), fakeAnalysisId);
    assert.strictEqual(sessionDTO.questions.length, 3);
    assert.ok(sessionDTO.questions[0].id.startsWith('q_'));
    assert.ok(sessionDTO.id);

    const dbSession = await InterviewSession.findById(sessionDTO.id);
    assert.ok(dbSession);
    assert.strictEqual(dbSession.status, 'in_progress');
    assert.strictEqual(dbSession.questions.length, 3);
  });

  await t.test('createInterviewSession throws 404 for unknown analysis', async (t) => {
    try {
      await createInterviewSession(new mongoose.Types.ObjectId().toString());
      assert.fail('Should have thrown');
    } catch (err) {
      assert.strictEqual(err.statusCode, 404);
    }
  });

  await t.test('getInterviewSession retrieves exactly the persisted session', async (t) => {
    runTestWithMock({
      questions: [
        { category: 'architecture', difficulty: 'beginner', text: 'How does Express work?' },
        { category: 'architecture', difficulty: 'beginner', text: 'Why use Express?' },
        { category: 'architecture', difficulty: 'beginner', text: 'What is Express routing?' }
      ]
    });
    const created = await createInterviewSession(fakeAnalysisId);
    
    const retrieved = await getInterviewSession(fakeAnalysisId, created.id);
    
    assert.strictEqual(retrieved.id.toString(), created.id.toString());
    assert.strictEqual(retrieved.status, 'in_progress');
    assert.strictEqual(retrieved.questions[0].id, created.questions[0].id);
  });

  await t.test('getInterviewSession rejects missing/invalid session', async (t) => {
    try {
      await getInterviewSession(fakeAnalysisId, new mongoose.Types.ObjectId().toString());
      assert.fail('Should have thrown');
    } catch (err) {
      assert.strictEqual(err.statusCode, 404);
    }
  });

  await t.test('evaluateInterviewSession persists answers, evaluations, and gaps, and changes status to completed', async (t) => {
    runTestWithMock({
      questions: [
        { category: 'architecture', difficulty: 'beginner', text: 'How does Express work?' },
        { category: 'architecture', difficulty: 'beginner', text: 'Why use Express?' },
        { category: 'architecture', difficulty: 'beginner', text: 'What is Express routing?' }
      ]
    });
    const created = await createInterviewSession(fakeAnalysisId);
    
    runTestWithMock({
      evaluations: [
        { questionId: created.questions[0].id, isCorrect: true, completeness: 'complete', feedback: 'Good', unsupportedClaims: [] }
      ],
      knowledgeGaps: [
        { topic: 'T1', gap: 'G1', recommendation: 'R1' }
      ]
    });

    const sessionData = [
      { question: created.questions[0], answer: 'My answer' }
    ];

    const result = await evaluateInterviewSession(fakeAnalysisId, created.id, sessionData);

    assert.strictEqual(result.status, 'completed');
    assert.strictEqual(result.evaluations.length, 1);
    assert.strictEqual(result.evaluations[0].isCorrect, true);
    assert.strictEqual(result.knowledgeGaps.length, 1);
    assert.strictEqual(result.knowledgeGaps[0].topic, 'T1');
    assert.strictEqual(result.answers.length, 1);
    assert.strictEqual(result.answers[0].answer, 'My answer');

    const dbSession = await InterviewSession.findById(created.id);
    assert.strictEqual(dbSession.status, 'completed');
    assert.strictEqual(dbSession.evaluations.length, 1);
    assert.strictEqual(dbSession.knowledgeGaps.length, 1);
  });

  await t.test('evaluateInterviewSession rejects evaluating a completed session', async (t) => {
    runTestWithMock({
      questions: [
        { category: 'architecture', difficulty: 'beginner', text: 'How does Express work?' },
        { category: 'architecture', difficulty: 'beginner', text: 'Why use Express?' },
        { category: 'architecture', difficulty: 'beginner', text: 'What is Express routing?' }
      ]
    });
    const created = await createInterviewSession(fakeAnalysisId);
    
    runTestWithMock({
      evaluations: [
        { questionId: created.questions[0].id, isCorrect: true, completeness: 'complete', feedback: 'Good', unsupportedClaims: [] }
      ],
      knowledgeGaps: []
    });

    const sessionData = [
      { question: created.questions[0], answer: 'My answer' }
    ];

    await evaluateInterviewSession(fakeAnalysisId, created.id, sessionData);

    try {
      await evaluateInterviewSession(fakeAnalysisId, created.id, sessionData);
      assert.fail('Should have thrown');
    } catch (err) {
      assert.strictEqual(err.statusCode, 400);
      assert.strictEqual(err.code, 'INVALID_STATE');
    }
  });

  await t.test('evaluateInterviewSession rejects malformed sessionData', async (t) => {
    runTestWithMock({
      questions: [
        { category: 'architecture', difficulty: 'beginner', text: 'How does Express work?' },
        { category: 'architecture', difficulty: 'beginner', text: 'Why use Express?' },
        { category: 'architecture', difficulty: 'beginner', text: 'What is Express routing?' }
      ]
    });
    const created = await createInterviewSession(fakeAnalysisId);
    
    try {
      await evaluateInterviewSession(fakeAnalysisId, created.id, [{ missing_question: true }]);
      assert.fail('Should have thrown');
    } catch (err) {
      assert.strictEqual(err.statusCode, 400);
      assert.strictEqual(err.code, 'INVALID_INPUT');
    }
  });

  await t.test('evaluateInterviewSession rejects questionIds that do not belong to the session', async (t) => {
    runTestWithMock({
      questions: [
        { category: 'architecture', difficulty: 'beginner', text: 'How does Express work?' },
        { category: 'architecture', difficulty: 'beginner', text: 'Why use Express?' },
        { category: 'architecture', difficulty: 'beginner', text: 'What is Express routing?' }
      ]
    });
    const created = await createInterviewSession(fakeAnalysisId);
    
    try {
      await evaluateInterviewSession(fakeAnalysisId, created.id, [{ question: { id: 'q_INVALID' }, answer: 'ans' }]);
      assert.fail('Should have thrown');
    } catch (err) {
      assert.strictEqual(err.statusCode, 400);
      assert.strictEqual(err.code, 'INVALID_INPUT');
    }
  });

  await t.test('evaluateInterviewSession does not mark session completed if AI throws', async (t) => {
    runTestWithMock({
      questions: [
        { category: 'architecture', difficulty: 'beginner', text: 'How does Express work?' },
        { category: 'architecture', difficulty: 'beginner', text: 'Why use Express?' },
        { category: 'architecture', difficulty: 'beginner', text: 'What is Express routing?' }
      ]
    });
    const created = await createInterviewSession(fakeAnalysisId);
    
    // Malformed AI output to trigger failure
    runTestWithMock('invalid json');

    const sessionData = [
      { question: created.questions[0], answer: 'wrong' }
    ];

    try {
      await evaluateInterviewSession(fakeAnalysisId, created.id, sessionData);
      assert.fail('Should have thrown');
    } catch (err) {
      assert.strictEqual(err.code, 'AI_GENERATION_FAILED');
    }

    const dbSession = await InterviewSession.findById(created.id);
    assert.strictEqual(dbSession.status, 'in_progress');
  });

});
