import test, { describe } from 'node:test';
import assert from 'node:assert';
import { config } from '../src/config/env.js';
import { AppError } from '../src/utils/AppError.js';
import { generateText, setClient_forTesting, resetClient_forTesting } from '../src/services/ai/geminiService.js';

describe('Gemini Service Boundary', () => {
  let originalKey;
  let originalModel;

  test.beforeEach(() => {
    originalKey = config.geminiApiKey;
    originalModel = config.geminiModel;
    resetClient_forTesting();
  });

  test.afterEach(() => {
    config.geminiApiKey = originalKey;
    config.geminiModel = originalModel;
    resetClient_forTesting();
  });

  test('should throw controlled AppError when API key is missing', async () => {
    config.geminiApiKey = null;
    
    await assert.rejects(
      async () => await generateText('Hello'),
      (err) => {
        assert.strictEqual(err instanceof AppError, true);
        assert.strictEqual(err.statusCode, 500);
        assert.strictEqual(err.code, 'GEMINI_CONFIG_ERROR');
        assert.strictEqual(err.message.includes('API key is not configured'), true);
        return true;
      }
    );
  });

  test('should initialize SDK and call API when key is present', async () => {
    config.geminiApiKey = 'test-key';
    config.geminiModel = 'test-model';

    let callArgs = null;
    const mockClient = {
      models: {
        generateContent: async (args) => {
          callArgs = args;
          return { text: 'mocked response' };
        }
      }
    };
    
    setClient_forTesting(mockClient);

    const result = await generateText('Hello test', { temperature: 0.7 });
    
    assert.strictEqual(result, 'mocked response');
    assert.deepStrictEqual(callArgs, {
      model: 'test-model',
      contents: 'Hello test',
      config: { temperature: 0.7 }
    });
  });

  test('should normalize SDK/provider errors into AppError without exposing internals', async () => {
    config.geminiApiKey = 'test-key';

    const mockClient = {
      models: {
        generateContent: async () => {
          throw new Error('Raw SDK failure containing sensitive details like key xyz123');
        }
      }
    };
    
    setClient_forTesting(mockClient);

    await assert.rejects(
      async () => await generateText('Hello test'),
      (err) => {
        assert.strictEqual(err instanceof AppError, true);
        assert.strictEqual(err.statusCode, 502);
        assert.strictEqual(err.code, 'GEMINI_API_ERROR');
        assert.strictEqual(err.message, 'AI provider generation failed');
        assert.strictEqual(err.message.includes('xyz123'), false); // No secret exposure
        return true;
      }
    );
  });
});
