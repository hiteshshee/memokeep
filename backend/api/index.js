// Vercel serverless entry point for the Express app.
//
// Vercel does not run a long-lived `app.listen()` server (see src/server.js,
// which is used for local dev). Instead each request invokes this handler.
// We ensure the database is connected (connectDB caches the connection across
// warm invocations) and then hand the request off to the Express app, which is
// itself a standard (req, res) handler.
import app from '../src/app.js';
import { connectDB } from '../src/config/db.js';

export default async function handler(req, res) {
  await connectDB();
  return app(req, res);
}
