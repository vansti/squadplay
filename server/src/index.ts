import express from 'express';
import { createServer } from 'http';
import cors from 'cors';
import { config } from './config.js';
import { initSocketServer } from './socket/index.js';
import { initDatabase } from './models/db.js';

const app = express();
const httpServer = createServer(app);

// ─── Middleware ─────────────────────────────────────────
app.use(cors({ origin: config.clientUrl, credentials: true }));
app.use(express.json());

// ─── Health Check ───────────────────────────────────────
app.get('/health', (_req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
  });
});

// ─── REST API Routes ────────────────────────────────────
// TODO: Phase 1 — auth, rooms, wordpacks, history routes

// ─── Socket.io Server ───────────────────────────────────
initSocketServer(httpServer);

// ─── Start ──────────────────────────────────────────────
async function start() {
  try {
    await initDatabase();
    httpServer.listen(config.port, () => {
      console.log(`\n🚀 SquadPlay server running on port ${config.port}`);
      console.log(`   Environment: ${config.nodeEnv}`);
      console.log(`   Client URL:  ${config.clientUrl}`);
      console.log(`   Health:      http://localhost:${config.port}/health\n`);
    });
  } catch (error) {
    console.error('❌ Failed to start server:', error);
    process.exit(1);
  }
}

start();
