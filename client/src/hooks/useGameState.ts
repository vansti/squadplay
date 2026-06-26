import { useReducer, useCallback } from 'react';
import type { RootState, CoreState, CoreAction, GameAction } from '@/types/game.types';
import { oddOneReducer, initialOddOneState } from '@/games/OddOne/oddOne.reducer';
import type { OddOneAction } from '@/games/OddOne/oddOne.types';

// ─── Initial State ──────────────────────────────────────
const initialCoreState: CoreState = {
  roomCode: null,
  playerId: null,
  displayName: null,
  players: [],
  isHost: false,
  phase: 'idle',
  gameType: 'the-odd-one',
  isConnected: false,
  error: null,
  roomSettings: { rounds: 1 },
};

export const initialGameState: RootState = {
  core: initialCoreState,
  gameData: initialOddOneState, // Defaults to the odd one state
};

// ─── Core Reducer ───────────────────────────────────────
function coreReducer(state: CoreState, action: CoreAction): CoreState {
  switch (action.type) {
    case 'SET_PLAYER_INFO':
      return {
        ...state,
        playerId: action.payload.playerId,
        displayName: action.payload.displayName,
      };

    case 'ROOM_CREATED':
      return {
        ...state,
        roomCode: action.payload.roomCode,
        players: action.payload.players,
        isHost: action.payload.hostId === state.playerId,
        phase: 'lobby',
        error: null,
      };

    case 'ROOM_JOINED':
      return {
        ...state,
        roomCode: action.payload.roomCode,
        players: action.payload.players,
        isHost: false,
        phase: 'lobby',
        error: null,
      };

    case 'PLAYER_JOINED':
      return {
        ...state,
        players: action.payload.players,
      };

    case 'PLAYER_LEFT': {
      const newIsHost = action.payload.newHostId === state.playerId;
      return {
        ...state,
        players: action.payload.players,
        isHost: newIsHost || state.isHost,
      };
    }

    case 'CONNECTED':
      return { ...state, isConnected: true };

    case 'DISCONNECTED':
      return { ...state, isConnected: false };

    case 'ERROR':
      return { ...state, error: action.payload.message };

    case 'CLEAR_ERROR':
      return { ...state, error: null };

    case 'SETTINGS_UPDATED':
      return {
        ...state,
        roomSettings: {
          ...state.roomSettings,
          rounds: action.payload.settings.rounds ?? state.roomSettings.rounds,
        },
      };

    case 'RESET':
      return {
        ...initialCoreState,
        playerId: state.playerId,
        displayName: state.displayName,
        isConnected: state.isConnected,
      };

    default:
      return state;
  }
}

// ─── Root Reducer (Adapter Seam) ────────────────────────
function rootReducer(state: RootState, action: GameAction): RootState {
  // 1. Run core reducer
  const nextCore = coreReducer(state.core, action as CoreAction);

  // 2. Delegate game-specific actions to the active game's reducer
  let nextGameData = state.gameData;
  if (nextCore.gameType === 'the-odd-one') {
    nextGameData = oddOneReducer(state.gameData, action as OddOneAction, nextCore.playerId);
  }

  // Handle special game lifecycle events that affect core state
  if (action.type === 'GAME_STARTED') {
    nextCore.phase = 'playing'; // Using 'playing' as the generic active game phase
  } else if (action.type === 'VOTE_RESULTS' || action.type === 'GAME_ENDED') {
    nextCore.phase = 'results';
  }

  // If action was RESET, reset game data too
  if (action.type === 'RESET') {
    nextGameData = initialOddOneState;
  }

  // Return new state if anything changed
  if (nextCore !== state.core || nextGameData !== state.gameData) {
    return { core: nextCore, gameData: nextGameData };
  }
  return state;
}

// ─── Hook ───────────────────────────────────────────────
export function useGameState() {
  const [state, dispatch] = useReducer(rootReducer, initialGameState);

  const resetGame = useCallback(() => {
    dispatch({ type: 'RESET' });
  }, []);

  const clearError = useCallback(() => {
    dispatch({ type: 'CLEAR_ERROR' });
  }, []);

  return { state, dispatch, resetGame, clearError };
}
