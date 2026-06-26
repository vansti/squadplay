import type { Server as SocketServer, Socket } from 'socket.io';
import { gameStateStore } from '../store/MemoryStore.js';
import { config } from '../config.js';
import { v4 as uuidv4 } from 'uuid';
import { getGameEngine } from '../games/registry.js';

/**
 * Generate a 6-character room code (uppercase alphanumeric, no ambiguous chars)
 */
function generateRoomCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // No 0/O, 1/I/L
  let code = '';
  for (let i = 0; i < 6; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}

/**
 * Generate a unique room code not already in use
 */
function generateUniqueRoomCode(): string {
  let code: string;
  let attempts = 0;
  do {
    code = generateRoomCode();
    attempts++;
    if (attempts > 100) {
      throw new Error('Failed to generate unique room code');
    }
  } while (gameStateStore.has(code));
  return code;
}

export function registerRoomHandlers(io: SocketServer, socket: Socket) {
  socket.on(
    'room:create',
    (data: { gameType?: string; displayName?: string; settings?: Record<string, unknown> }) => {
      try {
        const roomCode = generateUniqueRoomCode();
        const playerId = socket.data.playerId;
        const displayName = data.displayName || socket.data.displayName;
        socket.data.displayName = displayName;

        const roomState = {
          roomCode,
          roomId: uuidv4(),
          hostId: playerId,
          gameType: data.gameType || 'the-odd-one',
          status: 'waiting' as const,
          settings: data.settings || {},
          players: [
            {
              id: playerId,
              socketId: socket.id,
              displayName,
              seatOrder: 0,
              isConnected: true,
              score: 0,
            },
          ],
          createdAt: new Date(),
        };

        gameStateStore.set(roomCode, roomState);
        socket.join(`room:${roomCode}`);
        socket.data.roomCode = roomCode;

        socket.emit('room:created', {
          roomCode,
          roomId: roomState.roomId,
          hostId: playerId,
          players: roomState.players,
        });

        console.log(`🏠 Room created: ${roomCode} by ${displayName}`);
      } catch (error) {
        console.error('❌ Error creating room:', error);
        socket.emit('room:error', {
          code: 'CREATE_FAILED',
          message: 'Failed to create room. Please try again.',
        });
      }
    },
  );

  socket.on('room:join', (data: { roomCode: string; displayName?: string }) => {
    try {
      const roomCode = data.roomCode?.toUpperCase();
      const room = gameStateStore.get(roomCode);

      const displayName = data.displayName || socket.data.displayName;
      socket.data.displayName = displayName;

      if (!room) {
        return socket.emit('room:error', {
          code: 'ROOM_NOT_FOUND',
          message: 'Room not found. Check the code and try again.',
        });
      }

      if (room.status !== 'waiting') {
        return socket.emit('room:error', {
          code: 'GAME_IN_PROGRESS',
          message: 'This game is already in progress.',
        });
      }

      if (room.players.length >= config.maxPlayersPerRoom) {
        return socket.emit('room:error', {
          code: 'ROOM_FULL',
          message: `Room is full (max ${config.maxPlayersPerRoom} players).`,
        });
      }

      // Check if player already in room (reconnection)
      const existingPlayer = room.players.find((p) => p.id === socket.data.playerId);
      if (existingPlayer) {
        existingPlayer.socketId = socket.id;
        existingPlayer.isConnected = true;

        // Notify game engine on reconnect
        if (room.status !== 'waiting') {
          const engine = getGameEngine(room.gameType);
          if (engine) {
            engine.onPlayerReconnect(room, existingPlayer.id, socket.id).catch((err) => {
              console.error('❌ Reconnect hook failed:', err);
            });
          }
        }
      } else {
        room.players.push({
          id: socket.data.playerId,
          socketId: socket.id,
          displayName: socket.data.displayName,
          seatOrder: room.players.length,
          isConnected: true,
          score: 0,
        });
      }

      socket.join(`room:${roomCode}`);
      socket.data.roomCode = roomCode;

      const newPlayer = room.players.find((p) => p.id === socket.data.playerId)!;

      // Notify the player who just joined
      socket.emit('room:joined', {
        roomCode,
        roomId: room.roomId,
        hostId: room.hostId,
        players: room.players,
      });

      // Notify all OTHER players in the room
      socket.to(`room:${roomCode}`).emit('room:player-joined', {
        player: newPlayer,
        players: room.players,
      });

      console.log(`👤 ${socket.data.displayName} joined room ${roomCode}`);
    } catch (error) {
      console.error('❌ Error joining room:', error);
      socket.emit('room:error', {
        code: 'JOIN_FAILED',
        message: 'Failed to join room. Please try again.',
      });
    }
  });

  // ─── Update Settings ──────────────────────────────────
  socket.on(
    'room:update-settings',
    (data: { roomCode: string; settings: Record<string, unknown> }) => {
      try {
        const room = gameStateStore.get(data.roomCode);
        if (!room) {
          return socket.emit('room:error', {
            code: 'ROOM_NOT_FOUND',
            message: 'Room not found.',
          });
        }

        if (socket.data.playerId !== room.hostId) {
          return socket.emit('room:error', {
            code: 'NOT_HOST',
            message: 'Only the host can change settings.',
          });
        }

        if (room.status !== 'waiting') {
          return socket.emit('room:error', {
            code: 'GAME_IN_PROGRESS',
            message: 'Cannot change settings while a game is in progress.',
          });
        }

        // Merge new settings
        room.settings = { ...room.settings, ...data.settings };

        // Broadcast to all players in the room
        io.to(`room:${room.roomCode}`).emit('room:settings-updated', {
          settings: room.settings,
        });

        console.log(`⚙️ Settings updated in room ${room.roomCode}:`, room.settings);
      } catch (error) {
        console.error('❌ Error updating settings:', error);
        socket.emit('room:error', {
          code: 'SETTINGS_FAILED',
          message: 'Failed to update settings.',
        });
      }
    },
  );

  // ─── Leave Room ───────────────────────────────────────
  socket.on('room:leave', () => {
    handlePlayerLeave(io, socket);
  });

  // ─── Disconnect Cleanup ───────────────────────────────
  socket.on('disconnect', () => {
    handlePlayerLeave(io, socket);
  });
}

function handlePlayerLeave(io: SocketServer, socket: Socket) {
  const roomCode = socket.data.roomCode;
  if (!roomCode) return;

  const room = gameStateStore.get(roomCode);
  if (!room) return;

  const playerIndex = room.players.findIndex((p) => p.id === socket.data.playerId);
  if (playerIndex === -1) return;

  const leavingPlayer = room.players[playerIndex];

  // If game is in progress, mark as disconnected instead of removing
  if (room.status !== 'waiting') {
    leavingPlayer.isConnected = false;

    // Notify game engine on disconnect
    const engine = getGameEngine(room.gameType);
    if (engine) {
      engine.onPlayerDisconnect(room, leavingPlayer.id).catch((err) => {
        console.error('❌ Disconnect hook failed:', err);
      });
    }
  } else {
    room.players.splice(playerIndex, 1);
  }

  socket.leave(`room:${roomCode}`);
  socket.data.roomCode = undefined;

  // If room is empty, delete it
  if (room.players.filter((p) => p.isConnected).length === 0) {
    gameStateStore.delete(roomCode);
    console.log(`🏠 Room ${roomCode} deleted (empty)`);
    return;
  }

  // If host left, transfer host to next connected player
  if (leavingPlayer.id === room.hostId) {
    const newHost = room.players.find((p) => p.isConnected);
    if (newHost) {
      room.hostId = newHost.id;
    }
  }

  io.to(`room:${roomCode}`).emit('room:player-left', {
    playerId: leavingPlayer.id,
    players: room.players.filter((p) => p.isConnected),
    newHostId: room.hostId,
  });

  console.log(`👤 ${leavingPlayer.displayName} left room ${roomCode}`);
}
