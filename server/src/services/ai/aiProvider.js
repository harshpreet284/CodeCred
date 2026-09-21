import { config } from '../../config/env.js';
import * as geminiService from './geminiService.js';
import * as groqService from './groqService.js';

export const generateText = async (promptString, generationConfig = {}) => {
  if (config.aiProvider === 'groq') {
    return groqService.generateText(promptString, generationConfig);
  }
  return geminiService.generateText(promptString, generationConfig);
};

export const setClient_forTesting = (mockClient, provider = config.aiProvider) => {
  if (provider === 'groq') {
    groqService.setClient_forTesting(mockClient);
  } else {
    geminiService.setClient_forTesting(mockClient);
  }
};

export const resetClient_forTesting = (provider = config.aiProvider) => {
  if (provider === 'groq') {
    groqService.resetClient_forTesting();
  } else {
    geminiService.resetClient_forTesting();
  }
};
