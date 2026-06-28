/**
 * In-Memory Game State Store
 *
 * Stores active room/game state in a Map for fast read/write.
 * This is the "volatile" store — data here is lost on server restart.
 * Only final match results are persisted to PostgreSQL.
 *
 * To scale horizontally, swap this implementation with a Redis-backed store
 * that implements the same interface.
 */

export interface RoomPlayer {
  id: string;
  socketId: string;
  displayName: string;
  seatOrder: number;
  isConnected: boolean;
  score: number;
}

export interface GameState {
  // The Odd One specific state
  phase: 'waiting' | 'input' | 'voting' | 'results';
  wordPair?: { wordA: string; wordB: string };
  oddOneId?: string;
  turnOrder?: string[];
  currentTurnIndex?: number;
  feed?: Array<{ playerId: string; displayName: string; word: string; turnIndex: number }>;
  votes?: Map<string, string>; // voterId → votedForId
  turnTimer?: NodeJS.Timeout;
  totalRounds?: number;
  currentRound?: number;
}

export interface RoomState {
  roomCode: string;
  roomId: string;
  hostId: string;
  gameType: string;
  status: 'waiting' | 'in_progress' | 'finished';
  settings: { rounds?: number; customTopic?: string; [key: string]: unknown };
  players: RoomPlayer[];
  createdAt: Date;
  game?: GameState;
}

class MemoryStore {
  private rooms: Map<string, RoomState> = new Map();

  get(roomCode: string): RoomState | undefined {
    return this.rooms.get(roomCode);
  }

  set(roomCode: string, state: RoomState): void {
    this.rooms.set(roomCode, state);
  }

  has(roomCode: string): boolean {
    return this.rooms.has(roomCode);
  }

  delete(roomCode: string): boolean {
    const room = this.rooms.get(roomCode);
    if (room?.game?.turnTimer) {
      clearTimeout(room.game.turnTimer);
    }
    return this.rooms.delete(roomCode);
  }

  getActiveRoomCount(): number {
    return this.rooms.size;
  }

  getPlayerRoomCode(playerId: string): string | undefined {
    for (const [code, room] of this.rooms) {
      if (room.players.some((p) => p.id === playerId)) {
        return code;
      }
    }
    return undefined;
  }
}

export const gameStateStore = new MemoryStore();
