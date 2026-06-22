import dotenv from 'dotenv';
import { app } from './server.js';
import { bootstrapAdminFromEnv, bootstrapDefaultContent } from './config/bootstrap.js';
import { connectDatabase } from './config/database.js';
import { startSchedulers } from './jobs/scheduler.js';

dotenv.config();

const port = process.env.PORT || 5000;

try {
  await connectDatabase();
  await bootstrapAdminFromEnv();
  await bootstrapDefaultContent();
  startSchedulers();
} catch (error) {
  console.error(error.message || error);
  process.exit(1);
}

const server = app.listen(port, () => {
  console.log(`Trend Monitor API running on http://localhost:${port}`);
});

server.on('error', (error) => {
  if (error.code === 'EADDRINUSE') {
    console.error(`Port ${port} is already in use. Stop the other backend process or set PORT to a free port.`);
    process.exit(1);
  }
  throw error;
});
