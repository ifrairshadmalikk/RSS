const configErrorPatterns = [
  'MONGODB_URI is not configured',
  'MONGODB_URI still contains <db_password>',
  'MongoDB Atlas authentication failed'
];

export function errorHandler(error, _req, res, _next) {
  console.error(error);
  if (configErrorPatterns.some((pattern) => error.message?.includes(pattern))) {
    return res.status(503).json({ message: error.message });
  }
  if (error.code === 11000) {
    const field = Object.keys(error.keyPattern || {})[0];
    const message = field === 'email'
      ? 'An account with this email already exists.'
      : 'This source URL already exists.';
    return res.status(409).json({ message });
  }
  if (error.name === 'ZodError') {
    return res.status(400).json({ message: error.errors?.[0]?.message || 'Invalid request data' });
  }
  const status = error.status || 500;
  res.status(status).json({
    message: status === 500 ? 'Internal server error' : error.message,
    details: process.env.NODE_ENV === 'production' ? undefined : error.message
  });
}
