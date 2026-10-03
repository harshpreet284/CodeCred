import { test, describe } from 'node:test';
import assert from 'node:assert';
import { generateInterviewQuestions } from '../src/services/ai/questionGenerator.js';
import { setClient_forTesting } from '../src/services/ai/aiProvider.js';

describe('Task 10.3 Adversarial Grounding Tests (Simplified)', () => {
  const createMockAnalysis = () => ({
    _id: 'mock_id_123',
    repository: { fullName: 'test/repo', defaultBranch: 'main' },
    summary: {
      languages: [{ name: 'javascript', type: 'language' }]
    }
  });

  const runTestWithMock = async (mockResponseObject, customAnalysis = null) => {
    let callCount = 0;
    const generateFn = async (args) => {
      callCount++;
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
    const uniquePads = ['alpha', 'bravo', 'charlie', 'delta', 'echo'];
    while (qList.length < 3) {
      qList.push({
        category: 'ecosystem',
        difficulty: 'beginner',
        text: `Padding question ${uniquePads[qList.length]} about javascript`
      });
    }
    return { questions: qList };
  };

  test('Valid 3-5 question response succeeds and assigns IDs deterministically', async () => {
    const { result } = await runTestWithMock(wrapQuestions([{
      category: 'implementation', difficulty: 'beginner',
      text: 'How does express route normal traffic?'
    }]));
    assert.strictEqual(result.length, 3);
    assert.strictEqual(result[0].id, 'q_001');
    assert.strictEqual(result[1].id, 'q_002');
    assert.strictEqual(result[2].id, 'q_003');
    assert.strictEqual(result[0].category, 'implementation');
    assert.strictEqual(result[0].difficulty, 'beginner');
    assert.strictEqual(result[0].text, 'How does express route normal traffic?');
  });

  test('Questions with unsupported entities are NOT rejected (brittle grounding removed)', async () => {
    const { result } = await runTestWithMock(wrapQuestions([{
      category: 'implementation', difficulty: 'beginner',
      text: 'How does Express work with Redis and SuperCoolTech?'
    }]));
    assert.strictEqual(result.length, 3);
    assert.strictEqual(result[0].text, 'How does Express work with Redis and SuperCoolTech?');
  });

  test('Malformed responses are rejected (Missing text)', async () => {
    await assert.rejects(
      runTestWithMock(wrapQuestions([{
        category: 'implementation', difficulty: 'beginner'
      }])),
      (err) => /Missing question text/.test(err.message)
    );
  });

  test('Malformed responses are rejected (Invalid category)', async () => {
    await assert.rejects(
      runTestWithMock(wrapQuestions([{
        category: 'invalid_cat', difficulty: 'beginner', text: 'question?'
      }])),
      (err) => /Invalid category: invalid_cat/.test(err.message)
    );
  });

  test('Duplicate/near-duplicate questions are filtered out', async () => {
    const { result } = await runTestWithMock({
      questions: [
        { category: 'ecosystem', difficulty: 'beginner', text: 'Why use javascript?' },
        { category: 'ecosystem', difficulty: 'beginner', text: 'Why use javascript?' },
        { category: 'ecosystem', difficulty: 'beginner', text: 'Why use javascript?' },
        { category: 'architecture', difficulty: 'intermediate', text: 'How to use express server?' },
        { category: 'database', difficulty: 'advanced', text: 'How to use mongodb?' }
      ]
    });
    // Filtered duplicates leaves exactly 3 distinct questions
    assert.strictEqual(result.length, 3);
  });

  test('Wrong question count is rejected (Deduplication leaves fewer than 3)', async () => {
    await assert.rejects(
      runTestWithMock({
        questions: [
          { category: 'ecosystem', difficulty: 'beginner', text: 'Why use javascript?' },
          { category: 'ecosystem', difficulty: 'beginner', text: 'Why use javascript?' },
          { category: 'architecture', difficulty: 'intermediate', text: 'How to use express?' }
        ]
      }),
      (err) => /Batch filtered below 3 valid questions due to duplicates/.test(err.message)
    );
  });

  test('Transient AI provider failure -> exactly one retry', async () => {
    let callCount = 0;
    const generateFn = async () => {
      callCount++;
      if (callCount === 1) throw new Error('Network error');
      return { text: JSON.stringify(wrapQuestions([{
        category: 'implementation', difficulty: 'beginner',
        text: 'How does express work?'
      }])) };
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

    const analysis = createMockAnalysis();
    const res = await generateInterviewQuestions(analysis);
    assert.strictEqual(callCount, 2); // retried once
    assert.strictEqual(res.length, 3);
  });

  test('Malformed structured output -> exactly one retry', async () => {
    let callCount = 0;
    const generateFn = async () => {
      callCount++;
      if (callCount === 1) return { text: 'INVALID JSON' };
      return { text: JSON.stringify(wrapQuestions([{
        category: 'implementation', difficulty: 'beginner',
        text: 'How does express work?'
      }])) };
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

    const analysis = createMockAnalysis();
    const res = await generateInterviewQuestions(analysis);
    assert.strictEqual(callCount, 2);
    assert.strictEqual(res.length, 3);
  });
});

