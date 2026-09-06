import { GoogleGenAI } from '@google/genai';
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
  
  if (!config.geminiApiKey) {
    throw new AppError('Gemini API key is not configured', 500, 'GEMINI_CONFIG_ERROR');
  }
  
  aiClient = new GoogleGenAI({ apiKey: config.geminiApiKey });
  return aiClient;
};

/**
 * Generates text content using the Gemini API.
 * 
 * @param {string|object} contents - The prompt or structured contents
 * @param {object} [generationConfig] - Optional config for the generation (e.g., systemInstruction, schema)
 * @returns {Promise<string>} The generated response text
 */
export const generateText = async (contents, generationConfig = {}) => {
  try {
    const client = getClient();
    const response = await client.models.generateContent({
      model: config.geminiModel,
      contents,
      config: generationConfig,
    });
    return response.text;
  } catch (error) {
    // Re-throw operational app errors (like config missing)
    if (error instanceof AppError) {
      throw error;
    }
    // Normalize SDK provider errors to prevent leaking raw details/secrets
    throw new AppError('AI provider generation failed', 502, 'GEMINI_API_ERROR');
  }
};
