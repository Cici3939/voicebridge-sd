// Loads .env.local (and .env as fallback) for tsx scripts.
// Next.js loads .env.local itself for `next dev`, but `tsx scripts/*.ts`
// does not, so scripts must import this file FIRST, before any module
// that reads process.env at import time (lib/voicebridge.ts does).
import dotenv from "dotenv";
dotenv.config({ path: ".env.local" });
dotenv.config();
