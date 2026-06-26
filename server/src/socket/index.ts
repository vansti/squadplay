import { Server as HttpServer } from 'http';
import { Server as SocketServer } from 'socket.io';
import { config } from '../config.js';
import { registerRoomHandlers } from './roomHandlers.js';
import { registerGameHandlers } from './gameHandlers.js';
import { initGameRegistry } from '../games/registry.js';

let io: SocketServer;

export function initSocketServer(httpServer: HttpServer): SocketServer {
  io = new SocketServer(httpServer, {
    cors: {
      origin: config.clientUrl,
      methods: ['GET', 'POST'],
      credentials: true,
    },
    pingTimeout: 60000,
    pingInterval: 25000,
  });

  // Initialize game engine registry
  initGameRegistry(io);

  // ─── Connection Middleware (Auth) ─────────────────────
  io.use((socket, next) => {
    const { displayName, sessionToken } = socket.handshake.auth;

    if (!displayName || typeof displayName !== 'string' || displayName.trim().length === 0) {
      return next(new Error('Display name is required'));
    }

    // Attach player info to the socket
    socket.data.displayName = displayName.trim().substring(0, 30);
    socket.data.sessionToken = sessionToken;
    socket.data.playerId = sessionToken || socket.id; // Use session token as player ID, fallback to socket.id

    console.log(`🔌 Player connected: ${socket.data.displayName} (${socket.id})`);
    next();
  });

  // ─── Connection Handler ───────────────────────────────
  io.on('connection', (socket) => {
    // Register event handlers
    registerRoomHandlers(io, socket);
    registerGameHandlers(io, socket);

    // ─── Disconnect ───────────────────────────────────────
    socket.on('disconnect', (reason) => {
      console.log(`🔌 Player disconnected: ${socket.data.displayName} (${reason})`);
      // TODO: Handle room cleanup and notify other players
    });
  });

  console.log('✅ Socket.io server initialized');
  return io;
}

export function getIO(): SocketServer {
  if (!io) {
    throw new Error('Socket.io server not initialized');
  }
  return io;
}
