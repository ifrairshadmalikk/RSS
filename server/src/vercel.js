import dotenv from 'dotenv';

dotenv.config();

const { default: app } = await import('./server.js');

export default app;
