import 'dotenv/config';
import app from './app.js';
import { connectDb } from './config/db.js';

const PORT = process.env.PORT || 5000;

await connectDb();

app.listen(PORT, () => {
  console.log(`[server] Listening on http://localhost:${PORT}`);
  console.log(`[server] Health check: http://localhost:${PORT}/health`);
});