import dotenv from 'dotenv';

dotenv.config();

export const config = {
  port: process.env.PORT || 5000,
  nodeEnv: process.env.NODE_ENV || 'development',
  clientUrl: process.env.CLIENT_URL || 'http://localhost:5173',
  githubToken: process.env.GITHUB_TOKEN,
  geminiApiKey: process.env.GEMINI_API_KEY,
  geminiModel: process.env.GEMINI_MODEL || 'gemini-3.6-flash',
  groqApiKey: process.env.GROQ_API_KEY,
  aiProvider: process.env.AI_PROVIDER || 'groq',
  aiModel: process.env.AI_MODEL || 'openai/gpt-oss-120b',
  mongoUri: process.env.MONGODB_URI,
  retrievalLimits: {
    maxFilesToFetch: 50,
    maxFileSize: 500 * 1024, // 500 KB
    maxTotalContentSize: 5 * 1024 * 1024 // 5 MB
  },
  rateLimits: {
    api: {
      windowMs: parseInt(process.env.API_RATE_LIMIT_WINDOW_MS, 10) || 15 * 60 * 1000,
      max: parseInt(process.env.API_RATE_LIMIT_MAX, 10) || 100,
    },
    ai: {
      windowMs: parseInt(process.env.AI_RATE_LIMIT_WINDOW_MS, 10) || 15 * 60 * 1000,
      max: parseInt(process.env.AI_RATE_LIMIT_MAX, 10) || 10,
    }
  }
};

if (!config.mongoUri) {
  throw new Error('MONGODB_URI environment variable is required.');
}
