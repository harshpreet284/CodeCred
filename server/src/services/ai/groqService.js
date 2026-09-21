import Groq from 'groq-sdk';
import { config } from '../../config/env.js';
import { AppError } from '../../utils/AppError.js';

let aiClient = null;

// Allow dependency injection for testing
export const setClient_forTesting = (mockClient) => {
  aiClient = mockClient;
};

export const resetClient_forTesting = () => {
  aiClient = null;
};

const getClient = () => {
  if (aiClient) return aiClient;
  
  if (!config.groqApiKey) {
    throw new AppError('Groq API key is not configured', 500, 'GROQ_CONFIG_ERROR');
  }
  
  aiClient = new Groq({ apiKey: config.groqApiKey });
  return aiClient;
};

/**
 * Generates text content using the Groq API.
 * 
 * @param {string|object} contents - The prompt or structured contents
 * @param {object} [generationConfig] - Optional config for the generation (e.g., systemInstruction, schema)
 * @returns {Promise<string>} The generated response text
 */
export const generateText = async (contents, generationConfig = {}) => {
  try {
    const client = getClient();
    
    const messages = [];
    if (generationConfig.systemInstruction) {
      messages.push({ role: 'system', content: generationConfig.systemInstruction });
    }
    messages.push({ role: 'user', content: contents });

    const requestOptions = {
      model: config.aiModel || 'openai/gpt-oss-120b',
      messages,
    };

    if (generationConfig.schema) {
      requestOptions.response_format = {
        type: 'json_schema',
        json_schema: {
          name: 'structured_output',
          strict: true,
          schema: generationConfig.schema
        }
      };
    } else if (generationConfig.responseMimeType === 'application/json') {
      requestOptions.response_format = { type: 'json_object' };
    }

    const response = await client.chat.completions.create(requestOptions);
    return response.choices[0]?.message?.content || '';
  } catch (error) {
    // Re-throw operational app errors (like config missing)
    if (error instanceof AppError) {
      throw error;
    }
    // Normalize SDK provider errors to prevent leaking raw details/secrets
    // If it's a known Groq API error, we can check status
    const status = error.status || error.response?.status;
    if (status === 429) {
      throw new AppError('AI provider quota exceeded', 429, 'AI_QUOTA_EXCEEDED');
    }
    throw new AppError('AI provider generation failed', 502, 'AI_GENERATION_FAILED');
  }
};
