import type { Server as SocketServer } from 'socket.io';
import type { GameEngine } from './GameEngine.js';
import { OddOneEngine } from './the-odd-one/OddOneEngine.js';

let registry: Record<string, GameEngine> = {};

/**
 * Initialize game registry with available game engines
 */
export function initGameRegistry(io: SocketServer): void {
  registry = {
    'the-odd-one': new OddOneEngine(io),
  };
}

/**
 * Get game engine instance by game type name
 */
export function getGameEngine(gameType: string): GameEngine | undefined {
  return registry[gameType];
}
