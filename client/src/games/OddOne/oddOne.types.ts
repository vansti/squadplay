import type { FeedEntry, GameResults } from '@/types/game.types';

export interface OddOneState {
  phase: 'idle' | 'input' | 'voting' | 'results';
  myWord: string | null;
  myRole: 'civilian' | 'odd_one' | null;
  currentTurnPlayerId: string | null;
  isMyTurn: boolean;
  turnOrder: string[];
  turnIndex: number;
  feed: FeedEntry[];
  turnTimeRemaining: number;
  myVote: string | null;
  votesCast: number;
  votesNeeded: number;
  results: GameResults | null;
  totalRounds: number;
  currentRound: number;
}

export type OddOneAction =
  | { type: 'GAME_STARTED'; payload: { phase: 'playing' | 'input'; turnOrder: string[]; currentTurnPlayerId: string; totalRounds: number; currentRound: number } }
  | { type: 'WORD_ASSIGNED'; payload: { word: string; role: 'civilian' | 'odd_one' } }
  | { type: 'TURN_NEXT'; payload: { currentTurnPlayerId: string; turnIndex: number; currentRound: number } }
  | { type: 'WORD_SUBMITTED'; payload: FeedEntry }
  | { type: 'TURN_TIMER_TICK'; payload: { secondsRemaining: number } }
  | { type: 'PHASE_CHANGED'; payload: { phase: 'input' | 'voting' | 'results' } }
  | { type: 'VOTE_SUBMITTED'; payload: { totalCast: number; totalNeeded: number } }
  | { type: 'MY_VOTE_CAST'; payload: { votedForPlayerId: string } }
  | { type: 'VOTE_RESULTS'; payload: GameResults }
  | { type: 'GAME_ENDED'; payload: GameResults };
