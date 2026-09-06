import { test, describe } from 'node:test';
import assert from 'node:assert';
import { generateInterviewQuestions } from '../src/services/ai/questionGenerator.js';
import { setClient_forTesting } from '../src/services/ai/geminiService.js';

describe('Task 10.3 Adversarial Grounding Tests', () => {
  const createMockAnalysis = () => ({
    _id: 'mock_id_123',
    repository: { fullName: 'test/repo', defaultBranch: 'main' },
    analysisMetadata: {
      status: 'completed',
      retrieval: {
        limitations: {
          truncatedFiles: false,
          missingFiles: [],
          maxDepthReached: false
        }
      }
    },
    summary: {
      languages: [{ name: 'javascript', type: 'language', provenance: [{ path: 'package.json', field: 'dependencies', detail: 'test' }] }]
    },
    dependencies: {
      packages: [
        { name: 'express', type: 'dependency', provenance: [{ path: 'package.json', field: 'dependencies.express', detail: 'deps' }] },
        { name: 'mongodb', type: 'dependency', provenance: [{ path: 'package.json', field: 'dependencies.mongodb', detail: 'deps' }] },
        { name: 'sql', type: 'dependency', provenance: [{ path: 'package.json', field: 'dependencies.sql', detail: 'deps' }] },
      ]
    },
    database: {
      indicators: [
        { type: 'mongodb_uri', path: '.env.example', detail: 'Mongo URI found' }
      ]
    },
    testing: {
      indicators: [
        { type: 'jest', path: 'package.json', detail: 'jest' }
      ]
    }
  });

  // A helper to quickly mock the Gemini response for tests
  const runTestWithMock = async (mockResponseObject, customAnalysis = null) => {
    let callCount = 0;
    setClient_forTesting({
      models: {
        generateContent: async () => {
          callCount++;
          if (mockResponseObject instanceof Error) throw mockResponseObject;
          if (typeof mockResponseObject === 'string') return { text: mockResponseObject };
          return { text: JSON.stringify(mockResponseObject) };
        }
      }
    });

    const analysis = customAnalysis || createMockAnalysis();
    try {
      const res = await generateInterviewQuestions(analysis);
      return { result: res, calls: callCount };
    } catch (err) {
      err.calls = callCount;
      throw err;
    }
  };

  const wrapQuestions = (qList) => {
    // Pad to 3 to pass the minimum count requirement if not enough are provided
    const uniquePads = ['alpha', 'bravo', 'charlie', 'delta', 'echo'];
    while (qList.length < 3) {
      qList.push({
        category: 'ecosystem', difficulty: 'beginner',
        text: `Padding question ${uniquePads[qList.length]} about javascript`,
        technicalEntities: ['javascript'],
        targetEvidenceRefs: ['ev_001']
      });
    }
    return { questions: qList };
  };

  test('CASE A: Express + Redis declared, Express refs only -> REJECT', async () => {
    await assert.rejects(
      runTestWithMock(wrapQuestions([{
        category: 'implementation', difficulty: 'beginner',
        text: 'How does Express work with Redis?',
        technicalEntities: ['express', 'redis'],
        targetEvidenceRefs: ['ev_002'] // ev_002 is express
      }])),
      (err) => /Declared entity not supported by references: redis/.test(err.message)
    );
  });

  test('CASE B: Express + MongoDB declared, Express refs only -> REJECT', async () => {
    await assert.rejects(
      runTestWithMock(wrapQuestions([{
        category: 'implementation', difficulty: 'beginner',
        text: 'How does Express work with MongoDB?',
        technicalEntities: ['express', 'mongodb'],
        targetEvidenceRefs: ['ev_002'] // ev_002 is express
      }])),
      (err) => /Declared entity not supported by references: mongodb/.test(err.message)
    );
  });

  test('CASE C: Express + MongoDB declared, both refs -> ACCEPT', async () => {
    const { result } = await runTestWithMock(wrapQuestions([{
      category: 'implementation', difficulty: 'beginner',
      text: 'How does Express work with MongoDB?',
      technicalEntities: ['express', 'mongodb'],
      targetEvidenceRefs: ['ev_002', 'ev_003'] // express and mongodb
    }]));
    assert.strictEqual(result.length, 3);
  });

  test('CASE D: Express only, ordinary wording -> ACCEPT', async () => {
    const { result } = await runTestWithMock(wrapQuestions([{
      category: 'implementation', difficulty: 'beginner',
      text: 'How does express route normal traffic?',
      technicalEntities: ['express'],
      targetEvidenceRefs: ['ev_002']
    }]));
    assert.strictEqual(result.length, 3);
  });

  test('CASE E: Unsupported arbitrary technical name confidently identified (CamelCase) -> REJECT', async () => {
    await assert.rejects(
      runTestWithMock(wrapQuestions([{
        category: 'implementation', difficulty: 'beginner',
        text: 'How does express use SuperCoolTech?',
        technicalEntities: ['express'], // Omitted maliciously by Gemini
        targetEvidenceRefs: ['ev_002']
      }])),
      (err) => /Sanity detector flagged unsupported technical entity: supercooltech/.test(err.message)
    );
  });

  test('CASE F: Unknown lowercase unsupported technology omitted -> ACCEPT (Known V1 Limitation)', async () => {
    const { result } = await runTestWithMock(wrapQuestions([{
      category: 'implementation', difficulty: 'beginner',
      text: 'How does express work with redis?', // Lowercase, no backticks, omitted from entities
      technicalEntities: ['express'],
      targetEvidenceRefs: ['ev_002']
    }]));
    assert.strictEqual(result.length, 3);
  });

  test('CASE G: Declared entity not present in question text -> REJECT', async () => {
    await assert.rejects(
      runTestWithMock(wrapQuestions([{
        category: 'implementation', difficulty: 'beginner',
        text: 'How does express work?',
        technicalEntities: ['express', 'mongodb'], // Declared but missing from text
        targetEvidenceRefs: ['ev_002', 'ev_003']
      }])),
      (err) => /Declared entity missing from text: mongodb/.test(err.message)
    );
  });

  test('CASE H: SQL declared but question contains only SQLAlchemy -> REJECT', async () => {
    await assert.rejects(
      runTestWithMock(wrapQuestions([{
        category: 'implementation', difficulty: 'beginner',
        text: 'How does SQLAlchemy perform queries?',
        technicalEntities: ['sql'], 
        targetEvidenceRefs: ['ev_004'] // SQL evidence
      }])),
      (err) => /Declared entity missing from text: sql/.test(err.message)
    );
  });

  test('CASE I: Generic question with [] entities and valid topic overlap -> ACCEPT', async () => {
    const { result } = await runTestWithMock(wrapQuestions([{
      category: 'implementation', difficulty: 'beginner',
      text: 'How do you run the jest tests here?', // 'jest' overlaps with ev_006
      technicalEntities: [],
      targetEvidenceRefs: ['ev_006']
    }]));
    assert.strictEqual(result.length, 3);
  });

  test('CASE J: Missing or invalid technicalEntities -> REJECT', async () => {
    await assert.rejects(
      runTestWithMock(wrapQuestions([{
        category: 'implementation', difficulty: 'beginner',
        text: 'How does express work?',
        // missing technicalEntities
        targetEvidenceRefs: ['ev_002']
      }])),
      (err) => /Missing or invalid technicalEntities/.test(err.message)
    );
  });

  test('CASE K: Duplicate questions above Jaccard threshold -> FILTER', async () => {
    const { result } = await runTestWithMock({
      questions: [
        { category: 'ecosystem', difficulty: 'beginner', text: 'Why use javascript?', technicalEntities: ['javascript'], targetEvidenceRefs: ['ev_001'] },
        { category: 'ecosystem', difficulty: 'beginner', text: 'Why use javascript?', technicalEntities: ['javascript'], targetEvidenceRefs: ['ev_001'] },
        { category: 'ecosystem', difficulty: 'beginner', text: 'Why use javascript?', technicalEntities: ['javascript'], targetEvidenceRefs: ['ev_001'] },
        { category: 'architecture', difficulty: 'intermediate', text: 'How to use express server?', technicalEntities: ['express'], targetEvidenceRefs: ['ev_002'] },
        { category: 'database', difficulty: 'advanced', text: 'How to use mongodb?', technicalEntities: ['mongodb'], targetEvidenceRefs: ['ev_003'] }
      ]
    });
    // Filtered duplicates leaves exactly 3 distinct questions
    assert.strictEqual(result.length, 3);
  });

  test('CASE L: Deduplication leaves fewer than 3 -> REJECT', async () => {
    await assert.rejects(
      runTestWithMock({
        questions: [
          { category: 'ecosystem', difficulty: 'beginner', text: 'Why use javascript?', technicalEntities: ['javascript'], targetEvidenceRefs: ['ev_001'] },
          { category: 'ecosystem', difficulty: 'beginner', text: 'Why use javascript?', technicalEntities: ['javascript'], targetEvidenceRefs: ['ev_001'] },
          { category: 'architecture', difficulty: 'intermediate', text: 'How to use express?', technicalEntities: ['express'], targetEvidenceRefs: ['ev_002'] }
        ]
      }),
      (err) => /Batch filtered below 3 valid questions due to duplicates/.test(err.message)
    );
  });

  test('CASE M: Invalid evidence reference -> REJECT', async () => {
    await assert.rejects(
      runTestWithMock(wrapQuestions([{
        category: 'implementation', difficulty: 'beginner',
        text: 'How does express work?',
        technicalEntities: ['express'],
        targetEvidenceRefs: ['ev_999'] // invalid
      }])),
      (err) => /Evidence reference not found: ev_999/.test(err.message)
    );
  });

  test('CASE N: Entity exists globally but unsupported by THIS question refs -> REJECT', async () => {
    await assert.rejects(
      runTestWithMock(wrapQuestions([{
        category: 'implementation', difficulty: 'beginner',
        text: 'How does express work with `mongodb`?', // backticks caught by sanity detector
        technicalEntities: ['express'], // Omitted mongodb
        targetEvidenceRefs: ['ev_002'] // Only express ref
      }])),
      (err) => /Sanity detector flagged unsupported technical entity: mongodb/.test(err.message)
    );
  });

  test('CASE O: Transient Gemini failure -> exactly one retry', async () => {
    let callCount = 0;
    setClient_forTesting({
      models: {
        generateContent: async () => {
          callCount++;
          if (callCount === 1) throw new Error('Network error');
          return { text: JSON.stringify(wrapQuestions([{
            category: 'implementation', difficulty: 'beginner',
            text: 'How does express work?',
            technicalEntities: ['express'], targetEvidenceRefs: ['ev_002']
          }])) };
        }
      }
    });

    const analysis = createMockAnalysis();
    const res = await generateInterviewQuestions(analysis);
    assert.strictEqual(callCount, 2); // retried once
    assert.strictEqual(res.length, 3);
  });

  test('CASE P: Malformed Gemini output -> exactly one retry', async () => {
    let callCount = 0;
    setClient_forTesting({
      models: {
        generateContent: async () => {
          callCount++;
          if (callCount === 1) return { text: 'INVALID JSON' };
          return { text: JSON.stringify(wrapQuestions([{
            category: 'implementation', difficulty: 'beginner',
            text: 'How does express work?',
            technicalEntities: ['express'], targetEvidenceRefs: ['ev_002']
          }])) };
        }
      }
    });

    const analysis = createMockAnalysis();
    const res = await generateInterviewQuestions(analysis);
    assert.strictEqual(callCount, 2);
    assert.strictEqual(res.length, 3);
  });

  test('CASE Q: Grounding failure -> zero retries', async () => {
    let callCount = 0;
    setClient_forTesting({
      models: {
        generateContent: async () => {
          callCount++;
          return { text: JSON.stringify(wrapQuestions([{
            category: 'implementation', difficulty: 'beginner',
            text: 'How does express work with redis?',
            technicalEntities: ['express', 'redis'], targetEvidenceRefs: ['ev_002']
          }])) };
        }
      }
    });

    const analysis = createMockAnalysis();
    try {
      await generateInterviewQuestions(analysis);
      assert.fail('Should have rejected');
    } catch (err) {
      assert.strictEqual(callCount, 1, 'Should not retry grounding failures');
      assert.match(err.message, /Declared entity not supported by references/);
    }
  });

  test('CASE R: Backend IDs assigned deterministically', async () => {
    const { result } = await runTestWithMock(wrapQuestions([{
      category: 'implementation', difficulty: 'beginner',
      text: 'How does express work?',
      technicalEntities: ['express'],
      targetEvidenceRefs: ['ev_002']
    }]));
    assert.strictEqual(result[0].id, 'q_001');
    assert.strictEqual(result[1].id, 'q_002');
    assert.strictEqual(result[2].id, 'q_003');
  });

  test('CASE T: Entity boundary cases (Node.js, C++, React Native)', async () => {
    const mock = createMockAnalysis();
    // Inject complex entities into the mock context
    mock.dependencies.packages.push(
      { name: 'Node.js', type: 'dependency', provenance: [{ path: 'x', field: 'y', detail: 'z' }] },
      { name: 'C++', type: 'dependency', provenance: [{ path: 'x', field: 'y', detail: 'z' }] },
      { name: 'React Native', type: 'dependency', provenance: [{ path: 'x', field: 'y', detail: 'z' }] }
    );
    // Since we appended, ev_005 = node.js, ev_006 = c++, ev_007 = react native (Wait, we had 4 packages, so ev_005, 006, 007)
    // Actually, ev_001 = js, ev_002 = express, ev_003 = mongo, ev_004 = sql, ev_005 = node.js, ev_006 = c++, ev_007 = react native.

    const { result } = await runTestWithMock(wrapQuestions([{
      category: 'implementation', difficulty: 'beginner',
      text: 'How do Node.js, C++, and React Native work together?',
      technicalEntities: ['Node.js', 'C++', 'React Native'],
      targetEvidenceRefs: ['ev_005', 'ev_006', 'ev_007']
    }]), mock);
    assert.strictEqual(result.length, 3);
  });
});
