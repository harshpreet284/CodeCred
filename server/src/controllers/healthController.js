import { sendSuccess } from '../utils/apiResponse.js';

export const checkHealth = (req, res) => {
  const data = {
    status: 'ok',
    timestamp: new Date().toISOString()
  };
  
  sendSuccess(res, data, 'CodeCred API is running');
};
