import dotenv from 'dotenv';

dotenv.config();

export const config = {
  port: process.env.PORT || 5000,
  nodeEnv: process.env.NODE_ENV || 'development',
  githubToken: process.env.GITHUB_TOKEN || null,
  mongoUri: process.env.MONGODB_URI,
  retrievalLimits: {
    maxFilesToFetch: 50,
    maxFileSize: 500 * 1024, // 500 KB
    maxTotalContentSize: 5 * 1024 * 1024 // 5 MB
  }
};

if (!config.mongoUri) {
  throw new Error('MONGODB_URI environment variable is required.');
}
