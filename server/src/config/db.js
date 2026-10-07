import mongoose from 'mongoose';

const { MONGO_URI } = process.env;

let connected = false;

export function isDbConnected() {
  return connected;
}

export async function connectDb() {
  if (!MONGO_URI) {
    console.warn('[db] MONGO_URI is not set. Starting without a database connection.');
    return;
  }

  try {
    await mongoose.connect(MONGO_URI);
    connected = true;
    console.log('[db] Connected to MongoDB');
  } catch (error) {
    connected = false;
    console.error('[db] Failed to connect to MongoDB:', error.message);
    console.error('[db] The server will keep running so /health still responds.');
  }
}

mongoose.connection.on('disconnected', () => {
  connected = false;
});

mongoose.connection.on('reconnected', () => {
  connected = true;
});

//mongodb+srv://brothersp143_db_user:AhdtV2ysXAZhiw2G@cluster0.xw9zhmq.mongodb.net/?appName=Cluster0