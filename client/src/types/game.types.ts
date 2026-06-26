// ─── Player ─────────────────────────────────────────────
export interface Player {
  id: string;
  socketId: string;
  displayName: string;
  seatOrder: number;
  isConnected: boolean;
}

// ─── Feed Entry ─────────────────────────────────────────
export interface FeedEntry {
  playerId: string;
  displayName: string;
  word: string;
  turnIndex: number;
}

// ─── Game Results ───────────────────────────────────────
export interface GameResults {
  winnerSide: 'civilians' | 'odd_one';
  oddOneId: string;
  oddOnePlayer: Player;
  eliminatedId: string;
  wordPair: { wordA: string; wordB: string };
  votes: Record<string, number>; // playerId → vote count
  scores: Array<{ playerId: string; displayName: string; score: number }>;
  matchId: string;
}

export type GamePhase = 'idle' | 'lobby' | 'playing' | 'results';

export interface CoreState {
  roomCode: string | null;
  playerId: string | null;
  displayName: string | null;
  players: Player[];
  isHost: boolean;
  phase: GamePhase;
  gameType: string;
  isConnected: boolean;
  error: string | null;
  roomSettings: { rounds: number };
}

import type { OddOneState } from '@/games/OddOne/oddOne.types';

export interface RootState {
  core: CoreState;
  gameData: OddOneState; // For now, specifically typing as OddOneState
}

export type CoreAction =
  | { type: 'SET_PLAYER_INFO'; payload: { playerId: string; displayName: string } }
  | {
      type: 'ROOM_CREATED';
      payload: { roomCode: string; roomId: string; hostId: string; players: Player[] };
    }
  | { type: 'ROOM_JOINED'; payload: { roomCode: string; players: Player[] } }
  | { type: 'PLAYER_JOINED'; payload: { player: Player; players: Player[] } }
  | { type: 'PLAYER_LEFT'; payload: { playerId: string; players: Player[]; newHostId?: string } }
  | { type: 'SETTINGS_UPDATED'; payload: { settings: { rounds?: number } } }
  | { type: 'CONNECTED' }
  | { type: 'DISCONNECTED' }
  | { type: 'ERROR'; payload: { message: string } }
  | { type: 'CLEAR_ERROR' }
  | { type: 'RESET' };

export type GameAction = CoreAction | { type: string; payload?: any };

// ─── Socket Event Payloads ──────────────────────────────
export interface RoomCreatedPayload {
  roomCode: string;
  roomId: string;
  hostId: string;
  players: Player[];
}

export interface RoomJoinedPayload {
  roomCode: string;
  roomId: string;
  hostId: string;
  players: Player[];
}

export interface RoomErrorPayload {
  code: string;
  message: string;
}

export interface PlayerJoinedPayload {
  player: Player;
  players: Player[];
}

export interface PlayerLeftPayload {
  playerId: string;
  players: Player[];
  newHostId?: string;
}

export interface GameStartedPayload {
  phase: GamePhase;
  turnOrder: string[];
  currentTurnPlayerId: string;
  gameType: string;
  totalRounds: number;
  currentRound: number;
}

export interface WordAssignedPayload {
  word: string;
  role: 'civilian' | 'odd_one';
}

export interface TurnNextPayload {
  currentTurnPlayerId: string;
  turnIndex: number;
  remainingPlayers: number;
  currentRound: number;
}

export interface WordSubmittedPayload {
  playerId: string;
  displayName: string;
  word: string;
  turnIndex: number;
}

export interface VoteSubmittedPayload {
  voterId: string;
  totalVotesCast: number;
  totalVotesNeeded: number;
}
