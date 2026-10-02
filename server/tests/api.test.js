import test from 'node:test';
import assert from 'node:assert';
import mongoose from 'mongoose';
import request from 'supertest';
import { MongoMemoryServer } from 'mongodb-memory-server';
import app from '../src/app.js';
import { setClient_forTesting, resetClient_forTesting } from '../src/services/ai/aiProvider.js';
import { ProjectAnalysis } from '../src/models/ProjectAnalysis.js';
import { InterviewSession } from '../src/models/InterviewSession.js';

let mongoServer;
let analysisId;
let sessionId;

const setupMockAI = (mockResponseObject) => {
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

test('API Integration (Supertest)', async (t) => {
  t.before(async () => {
    mongoServer = await MongoMemoryServer.create();
    await mongoose.connect(mongoServer.getUri());
  });

  t.after(async () => {
    await mongoose.disconnect();
    await mongoServer.stop();
  });

  t.beforeEach(() => {
    global.fetch = t.mock.fn(async (url) => {
      if (url.includes('/git/trees/')) {
        return {
          ok: true,
          json: async () => ({
            tree: [{ path: 'package.json', type: 'blob' }],
            truncated: false
          })
        };
      }
      if (url.includes('/contents/package.json')) {
        return {
          ok: true,
          json: async () => ({
            encoding: 'base64',
            content: Buffer.from(JSON.stringify({ dependencies: { express: '4.17.1' } })).toString('base64')
          })
        };
      }
      if (url.includes('api.github.com/repos/')) {
         return {
           ok: true,
           json: async () => ({ 
             default_branch: 'main',
             owner: { login: 'test' },
             name: 'repo',
             full_name: 'test/repo'
           })
         };
      }
      return { ok: true, json: async () => ({}) };
    });
  });

  t.afterEach(() => {
    t.mock.restoreAll();
    resetClient_forTesting();
  });

  await t.test('1. PROJECT ANALYSIS SUCCESS', async () => {
    const res = await request(app)
      .post('/api/projects/analyze')
      .send({ repositoryUrl: 'https://github.com/test/repo' });
      
    if (res.status !== 201) console.error('Analyze Error:', res.body);
    
    assert.strictEqual(res.status, 201);
    
    const dbDoc = await ProjectAnalysis.findById(res.body.data.analysisId);
    
    assert.strictEqual(res.body.success, true);
    assert.ok(res.body.data.analysisId);
    assert.strictEqual(res.body.data.repository.owner, 'test');
    assert.strictEqual(res.body.data.repository.name, 'repo');
    
    // Ensure raw source / tokens are NOT exposed
    assert.strictEqual(res.body.data.rawSource, undefined);
    assert.strictEqual(res.body.data.GITHUB_TOKEN, undefined);
    
    analysisId = res.body.data.analysisId;
  });

  await t.test('2. PROJECT ANALYSIS VALIDATION FAILURE', async () => {
    const res = await request(app)
      .post('/api/projects/analyze')
      .send({ repositoryUrl: 'not-a-url' })
      .expect(400);

    assert.strictEqual(res.body.success, false);
    assert.ok(res.body.error.message.includes('Invalid URL format'));
    assert.strictEqual(res.body.error.stack, undefined);
  });

  await t.test('3. INTERVIEW SESSION CREATION', async () => {
    setupMockAI({
      questions: [
        {
          text: "How does Express work here?",
          targetEvidenceRefs: ["ev_001"],
          evidenceReasoning: "Uses Express.",
          category: "architecture",
          difficulty: "beginner"
        },
        {
          text: "Why did you choose Express?",
          targetEvidenceRefs: ["ev_001"],
          evidenceReasoning: "Uses Express.",
          category: "architecture",
          difficulty: "beginner"
        },
        {
          text: "Is Express used effectively?",
          targetEvidenceRefs: ["ev_001"],
          evidenceReasoning: "Uses Express.",
          category: "architecture",
          difficulty: "beginner"
        }
      ]
    });

    const res = await request(app)
      .post(`/api/projects/${analysisId}/interviews`);

    assert.strictEqual(res.status, 201);

    assert.strictEqual(res.body.success, true);
    assert.strictEqual(res.body.data.status, 'in_progress');
    assert.strictEqual(res.body.data.questions.length, 3);
    
    sessionId = res.body.data.id;
    assert.ok(sessionId);

    // Assert targetEvidenceRefs and technical_evidence are stripped
    assert.strictEqual(res.body.data.questions[0].targetEvidenceRefs, undefined);
    assert.strictEqual(res.body.data.technical_evidence, undefined);
  });

  await t.test('4. INTERVIEW SESSION RETRIEVAL', async () => {
    const res = await request(app)
      .get(`/api/projects/${analysisId}/interviews/${sessionId}`)
      .expect(200);

    assert.strictEqual(res.body.success, true);
    assert.strictEqual(res.body.data.id, sessionId);
    assert.strictEqual(res.body.data.status, 'in_progress');
    assert.strictEqual(res.body.data.questions.length, 3);
    assert.strictEqual(res.body.data.questions[0].targetEvidenceRefs, undefined);
  });

  await t.test('5. EVALUATION SUCCESS', async () => {
    const sessionRes = await request(app).get(`/api/projects/${analysisId}/interviews/${sessionId}`);
    const qId = sessionRes.body.data.questions[0].id;
    const currentQuestion = sessionRes.body.data.questions[0];

    setupMockAI({
      evaluations: [
        {
          questionId: qId,
          isCorrect: true,
          completeness: "complete",
          feedback: "Good",
          unsupportedClaims: []
        }
      ],
      knowledgeGaps: [
        { topic: "Express", gap: "None", recommendation: "Keep it up" }
      ]
    });

    const res = await request(app)
      .post(`/api/projects/${analysisId}/interviews/${sessionId}/evaluate`)
      .send({
        sessionData: [
          { question: currentQuestion, answer: "It is a framework" }
        ]
      });

    assert.strictEqual(res.status, 200);

    assert.strictEqual(res.body.success, true);
    assert.strictEqual(res.body.data.status, 'completed');
    assert.strictEqual(res.body.data.evaluations.length, 1);
    assert.strictEqual(res.body.data.knowledgeGaps.length, 1);
    
    // Ensure raw evidence/provider info remains hidden
    assert.strictEqual(res.body.data.rawEvidence, undefined);
    assert.strictEqual(res.body.data.provider, undefined);
    
    // Verify DB reflects completed status
    const dbSession = await InterviewSession.findById(sessionId);
    assert.strictEqual(dbSession.status, 'completed');
  });

  await t.test('6. COMPLETED SESSION PROTECTION', async () => {
    const sessionRes = await request(app).get(`/api/projects/${analysisId}/interviews/${sessionId}`);
    
    const res = await request(app)
      .post(`/api/projects/${analysisId}/interviews/${sessionId}/evaluate`)
      .send({
        sessionData: [
          { question: sessionRes.body.data.questions[0], answer: "Trying to overwrite" }
        ]
      })
      .expect(400);

    assert.strictEqual(res.body.success, false);
    assert.ok(res.body.error.message.includes('completed'));
  });

  await t.test('7. MISSING ANALYSIS', async () => {
    const fakeId = new mongoose.Types.ObjectId().toString();
    const res = await request(app)
      .get(`/api/projects/${fakeId}/interviews/${sessionId}`)
      .expect(404);

    assert.strictEqual(res.body.success, false);
    assert.ok(res.body.error.message.includes('not found'));
  });

  await t.test('8. MISSING SESSION', async () => {
    const fakeId = new mongoose.Types.ObjectId().toString();
    const res = await request(app)
      .get(`/api/projects/${analysisId}/interviews/${fakeId}`)
      .expect(404);

    assert.strictEqual(res.body.success, false);
    assert.ok(res.body.error.message.includes('not found'));
  });

  await t.test('9. ANALYSIS/SESSION MISMATCH', async () => {
    const res2 = await request(app)
      .post('/api/projects/analyze')
      .send({ repositoryUrl: 'https://github.com/test/repo2' })
      .expect(201);
    const analysisId2 = res2.body.data.analysisId;

    const res = await request(app)
      .get(`/api/projects/${analysisId2}/interviews/${sessionId}`)
      .expect(404);

    assert.strictEqual(res.body.success, false);
    assert.ok(res.body.error.message.includes('mismatch') || res.body.error.message.includes('not found'));
  });
});
