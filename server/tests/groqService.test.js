import { describe, it, mock, beforeEach } from 'node:test';
import assert from 'node:assert';
import { generateText, setClient_forTesting, resetClient_forTesting } from '../src/services/ai/groqService.js';
import { config } from '../src/config/env.js';
import { AppError } from '../src/utils/AppError.js';

describe('groqService', () => {
  const originalKey = config.groqApiKey;

  beforeEach(() => {
    config.groqApiKey = 'test-key';
    resetClient_forTesting();
  });

  it('should throw AppError if GROQ_API_KEY is missing', async () => {
    config.groqApiKey = null;
    await assert.rejects(
      generateText('Hello'),
      (err) => err instanceof AppError && err.code === 'GROQ_CONFIG_ERROR'
    );
    config.groqApiKey = originalKey; // restore immediately
  });

  it('should generate text successfully with basic prompt', async () => {
    const mockClient = {
      chat: {
        completions: {
          create: mock.fn(async () => ({
            choices: [{ message: { content: 'Mock response' } }]
          }))
        }
      }
    };
    setClient_forTesting(mockClient);

    const result = await generateText('Hello');
    assert.strictEqual(result, 'Mock response');

    const callArgs = mockClient.chat.completions.create.mock.calls[0].arguments[0];
    assert.deepStrictEqual(callArgs.messages, [
      { role: 'user', content: 'Hello' }
    ]);
  });

  it('should format strict JSON Schema request correctly', async () => {
    const mockClient = {
      chat: {
        completions: {
          create: mock.fn(async () => ({
            choices: [{ message: { content: '{}' } }]
          }))
        }
      }
    };
    setClient_forTesting(mockClient);

    const schema = { type: 'object', properties: { id: { type: 'string' } }, required: ['id'], additionalProperties: false };
    await generateText('Hello', {
      systemInstruction: 'System msg',
      schema
    });

    const callArgs = mockClient.chat.completions.create.mock.calls[0].arguments[0];
    assert.strictEqual(callArgs.messages[0].role, 'system');
    assert.strictEqual(callArgs.messages[0].content, 'System msg');
    assert.strictEqual(callArgs.messages[1].role, 'user');
    assert.deepStrictEqual(callArgs.response_format, {
      type: 'json_schema',
      json_schema: {
        name: 'structured_output',
        strict: true,
        schema: schema
      }
    });
    // Check model selection
    assert.strictEqual(callArgs.model, config.aiModel || 'openai/gpt-oss-120b');
  });

  it('should normalize 429 provider error to AppError with AI_QUOTA_EXCEEDED', async () => {
    const error429 = new Error('Rate limit');
    error429.status = 429;

    const mockClient = {
      chat: {
        completions: {
          create: mock.fn(async () => { throw error429; })
        }
      }
    };
    setClient_forTesting(mockClient);

    await assert.rejects(
      generateText('Hello'),
      (err) => err instanceof AppError && err.code === 'AI_QUOTA_EXCEEDED' && err.message === 'AI provider quota exceeded'
    );
  });

  it('should normalize 500 provider error to AppError with AI_GENERATION_FAILED', async () => {
    const error500 = new Error('Server error');
    error500.status = 500;

    const mockClient = {
      chat: {
        completions: {
          create: mock.fn(async () => { throw error500; })
        }
      }
    };
    setClient_forTesting(mockClient);

    await assert.rejects(
      generateText('Hello'),
      (err) => err instanceof AppError && err.code === 'AI_GENERATION_FAILED' && err.message === 'AI provider generation failed'
    );
  });

  it('should not leak api key in normalized error', async () => {
    const secretError = new Error('Failed to authorize token gsk_SECRET');
    const mockClient = {
      chat: {
        completions: {
          create: mock.fn(async () => { throw secretError; })
        }
      }
    };
    setClient_forTesting(mockClient);

    await assert.rejects(
      generateText('Hello'),
      (err) => {
        return err.message === 'AI provider generation failed' && !err.message.includes('gsk_SECRET');
      }
    );
  });

  it('should fall back to JSON object if schema is missing but mimeType is JSON', async () => {
    const mockClient = {
      chat: {
        completions: {
          create: mock.fn(async () => ({
            choices: [{ message: { content: '{}' } }]
          }))
        }
      }
    };
    setClient_forTesting(mockClient);

    await generateText('Hello', { responseMimeType: 'application/json' });
    const callArgs = mockClient.chat.completions.create.mock.calls[0].arguments[0];
    assert.deepStrictEqual(callArgs.response_format, { type: 'json_object' });
  });
});
