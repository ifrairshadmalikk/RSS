import mongoose from 'mongoose';

function getMongoUri() {
  const uri = process.env.MONGODB_URI;
  if (uri) {
    return uri;
  }

  if (process.env.VERCEL || process.env.NODE_ENV === 'production') {
    throw new Error(
      'MONGODB_URI is not configured. Add it in your Vercel project Settings > Environment Variables.'
    );
  }

  return 'mongodb://127.0.0.1:27017/global-trend-monitor';
}

export async function connectDatabase() {
  const uri = getMongoUri();

  if (uri.includes('<db_password>')) {
    throw new Error(
      'MONGODB_URI still contains <db_password>. Replace it with the real MongoDB Atlas database user password.'
    );
  }

  mongoose.set('strictQuery', true);

  const cached = globalThis.__mongooseCache ?? { conn: null, promise: null };
  globalThis.__mongooseCache = cached;

  if (cached.conn) {
    return cached.conn;
  }

  if (!cached.promise) {
    cached.promise = mongoose
      .connect(uri, {
        bufferCommands: false,
        maxPoolSize: process.env.VERCEL ? 1 : 10,
        serverSelectionTimeoutMS: 10000
      })
      .then((connection) => {
        console.log('MongoDB connected');
        return connection;
      })
      .catch((error) => {
        cached.promise = null;

        if (error.code === 8000 || error.codeName === 'AtlasError') {
          throw new Error(
            'MongoDB Atlas authentication failed. Check the username/password in MONGODB_URI and URL-encode special characters in the password.'
          );
        }

        throw error;
      });
  }

  cached.conn = await cached.promise;
  return cached.conn;
}
