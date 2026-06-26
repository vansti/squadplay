import type { OddOneState, OddOneAction } from './oddOne.types';

export const initialOddOneState: OddOneState = {
  phase: 'idle',
  myWord: null,
  myRole: null,
  currentTurnPlayerId: null,
  isMyTurn: false,
  turnOrder: [],
  turnIndex: 0,
  feed: [],
  turnTimeRemaining: 30,
  myVote: null,
  votesCast: 0,
  votesNeeded: 0,
  results: null,
  totalRounds: 1,
  currentRound: 1,
};

export function oddOneReducer(
  state: OddOneState = initialOddOneState,
  action: OddOneAction,
  playerId: string | null
): OddOneState {
  switch (action.type) {
    case 'GAME_STARTED':
      return {
        ...state,
        phase: action.payload.phase === 'playing' ? 'input' : action.payload.phase,
        turnOrder: action.payload.turnOrder,
        currentTurnPlayerId: action.payload.currentTurnPlayerId,
        isMyTurn: action.payload.currentTurnPlayerId === playerId,
        feed: [],
        turnIndex: 0,
        turnTimeRemaining: 30,
        results: null,
        myVote: null,
        totalRounds: action.payload.totalRounds || 1,
        currentRound: action.payload.currentRound || 1,
      };

    case 'WORD_ASSIGNED':
      return {
        ...state,
        myWord: action.payload.word,
        myRole: action.payload.role,
      };

    case 'TURN_NEXT':
      return {
        ...state,
        currentTurnPlayerId: action.payload.currentTurnPlayerId,
        isMyTurn: action.payload.currentTurnPlayerId === playerId,
        turnIndex: action.payload.turnIndex,
        turnTimeRemaining: 30,
        currentRound: action.payload.currentRound || state.currentRound,
      };

    case 'WORD_SUBMITTED':
      return {
        ...state,
        feed: [...state.feed, action.payload],
      };

    case 'TURN_TIMER_TICK':
      return {
        ...state,
        turnTimeRemaining: action.payload.secondsRemaining,
      };

    case 'PHASE_CHANGED':
      return {
        ...state,
        phase: action.payload.phase,
      };

    case 'VOTE_SUBMITTED':
      return {
        ...state,
        votesCast: action.payload.totalCast,
        votesNeeded: action.payload.totalNeeded,
      };

    case 'MY_VOTE_CAST':
      return {
        ...state,
        myVote: action.payload.votedForPlayerId,
      };

    case 'VOTE_RESULTS':
    case 'GAME_ENDED':
      return {
        ...state,
        phase: 'results',
        results: action.payload,
      };

    default:
      return state;
  }
}
