import { config } from './config/env.js';
import { connectDB } from './config/db.js';
import app from './app.js';

const startServer = async () => {
  await connectDB();
  
  app.listen(config.port, () => {
    console.log(`Server is running in ${config.nodeEnv} mode on port ${config.port}`);
  });
};

startServer();
