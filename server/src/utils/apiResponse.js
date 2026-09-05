export const sendSuccess = (res, data = {}, message = null, statusCode = 200) => {
  const response = {
    success: true,
    data,
  };
  
  if (message) {
    response.message = message;
  }

  return res.status(statusCode).json(response);
};

export const sendError = (res, message, code = 'INTERNAL_ERROR', statusCode = 500) => {
  return res.status(statusCode).json({
    success: false,
    error: {
      code,
      message,
    },
  });
};
