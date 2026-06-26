import type { Server as SocketServer, Socket } from 'socket.io';
import { gameStateStore } from '../store/MemoryStore.js';
import { config } from '../config.js';
import { getGameEngine } from '../games/registry.js';

export function registerGameHandlers(io: SocketServer, socket: Socket) {
  // ─── Start Game ──────────────────────────────────────
  socket.on('game:start', async (data: { roomCode: string }) => {
    try {
      const roomCode = data.roomCode;
      const room = gameStateStore.get(roomCode);

      if (!room) {
        return socket.emit('game:error', { code: 'ROOM_NOT_FOUND', message: 'Room not found.' });
      }

      if (socket.data.playerId !== room.hostId) {
        return socket.emit('game:error', {
          code: 'NOT_HOST',
          message: 'Only the host can start the game.',
        });
      }

      if (room.players.length < config.minPlayersToStart) {
        return socket.emit('game:error', {
          code: 'NOT_ENOUGH_PLAYERS',
          message: `Need at least ${config.minPlayersToStart} players to start.`,
        });
      }

      const engine = getGameEngine(room.gameType);
      if (!engine) {
        return socket.emit('game:error', {
          code: 'ENGINE_NOT_FOUND',
          message: `No game engine found for type "${room.gameType}".`,
        });
      }

      await engine.onStart(room);
    } catch (error) {
      console.error('❌ Failed to start game:', error);
      socket.emit('game:error', { code: 'START_FAILED', message: 'Failed to start game.' });
    }
  });

  // ─── Submit Word (Input Phase) ─────────────────────────
  socket.on('turn:submit-word', async (data: { roomCode: string; word: string }) => {
    try {
      const room = gameStateStore.get(data.roomCode);
      if (!room || room.status !== 'in_progress') return;

      const engine = getGameEngine(room.gameType);
      if (!engine) return;

      await engine.onPlayerAction(room, socket.data.playerId, 'submit-word', { word: data.word });
    } catch (error) {
      console.error('❌ Failed to submit word:', error);
    }
  });

  // ─── Submit Vote ───────────────────────────────────────
  socket.on('vote:submit', async (data: { roomCode: string; votedForPlayerId: string }) => {
    try {
      const room = gameStateStore.get(data.roomCode);
      if (!room || room.status !== 'in_progress') return;

      const engine = getGameEngine(room.gameType);
      if (!engine) return;

      await engine.onPlayerAction(room, socket.data.playerId, 'submit-vote', {
        votedForPlayerId: data.votedForPlayerId,
      });
    } catch (error) {
      console.error('❌ Failed to submit vote:', error);
    }
  });

  // ─── Play Again ────────────────────────────────────────
  socket.on('game:play-again', async (data: { roomCode: string }) => {
    try {
      const room = gameStateStore.get(data.roomCode);
      if (!room || room.status !== 'finished') return;

      if (socket.data.playerId !== room.hostId) {
        return socket.emit('game:error', {
          code: 'NOT_HOST',
          message: 'Only the host can restart the game.',
        });
      }

      const engine = getGameEngine(room.gameType);
      if (!engine) return;

      await engine.onPlayAgain(room);
    } catch (error) {
      console.error('❌ Failed to restart game:', error);
    }
  });
}
