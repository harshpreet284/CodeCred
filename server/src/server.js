import { config } from './config/env.js';
import app from './app.js';

app.listen(config.port, () => {
  console.log(`Server is running in ${config.nodeEnv} mode on port ${config.port}`);
});
