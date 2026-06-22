import mongoose from 'mongoose';

export async function connectDatabase() {
  const uri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/global-trend-monitor';
  if (uri.includes('<db_password>')) {
    throw new Error('MONGODB_URI still contains <db_password>. Replace it in server/.env with the real MongoDB Atlas database user password.');
  }

  mongoose.set('strictQuery', true);
  try {
    await mongoose.connect(uri);
  } catch (error) {
    if (error.code === 8000 || error.codeName === 'AtlasError') {
      throw new Error('MongoDB Atlas authentication failed. Check the username/password in MONGODB_URI and URL-encode special characters in the password.');
    }
    throw error;
  }
  console.log('MongoDB connected');
}
