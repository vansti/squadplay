import { useEffect, useRef, useCallback } from 'react';
import type { Socket } from 'socket.io-client';
import { connectSocket, disconnectSocket } from '@/lib/socket';
import type {
  GameAction,
  RoomCreatedPayload,
  RoomJoinedPayload,
  RoomErrorPayload,
  PlayerJoinedPayload,
  PlayerLeftPayload,
  GameStartedPayload,
  WordAssignedPayload,
  TurnNextPayload,
  WordSubmittedPayload,
  VoteSubmittedPayload,
  GameResults,
} from '@/types/game.types';

interface UseSocketOptions {
  displayName: string;
  dispatch: React.Dispatch<GameAction>;
}

export function useSocket({ displayName, dispatch }: UseSocketOptions) {
  const socketRef = useRef<Socket | null>(null);

  useEffect(() => {
    if (!displayName) return;

    const socket = connectSocket(displayName);
    socketRef.current = socket;

    // ─── Connection Events ─────────────────────────────
    socket.on('connect', () => {
      dispatch({ type: 'CONNECTED' });
      const auth = typeof socket.auth === 'object' ? socket.auth : {};
      dispatch({
        type: 'SET_PLAYER_INFO',
        payload: {
          playerId:
            ('sessionToken' in auth ? (auth.sessionToken as string) : '') || socket.id || '',
          displayName,
        },
      });
    });

    socket.on('disconnect', () => {
      dispatch({ type: 'DISCONNECTED' });
    });

    socket.on('connect_error', (err) => {
      dispatch({ type: 'ERROR', payload: { message: err.message } });
    });

    // ─── Room Events ───────────────────────────────────
    socket.on('room:created', (data: RoomCreatedPayload) => {
      dispatch({ type: 'ROOM_CREATED', payload: data });
    });

    socket.on('room:joined', (data: RoomJoinedPayload) => {
      dispatch({ type: 'ROOM_JOINED', payload: data });
    });

    socket.on('room:player-joined', (data: PlayerJoinedPayload) => {
      dispatch({ type: 'PLAYER_JOINED', payload: data });
    });

    socket.on('room:player-left', (data: PlayerLeftPayload) => {
      dispatch({ type: 'PLAYER_LEFT', payload: data });
    });

    socket.on('room:error', (data: RoomErrorPayload) => {
      dispatch({ type: 'ERROR', payload: { message: data.message } });
    });

    socket.on('room:settings-updated', (data: { settings: { rounds?: number } }) => {
      dispatch({ type: 'SETTINGS_UPDATED', payload: { settings: data.settings } });
    });

    // ─── Game Events ───────────────────────────────────
    socket.on('game:started', (data: GameStartedPayload) => {
      dispatch({ type: 'GAME_STARTED', payload: data });
    });

    socket.on('game:your-word', (data: WordAssignedPayload) => {
      dispatch({ type: 'WORD_ASSIGNED', payload: data });
    });

    socket.on('game:error', (data: RoomErrorPayload) => {
      dispatch({ type: 'ERROR', payload: { message: data.message } });
    });

    // ─── Turn Events ───────────────────────────────────
    socket.on('turn:next', (data: TurnNextPayload) => {
      dispatch({ type: 'TURN_NEXT', payload: data });
    });

    socket.on('turn:word-submitted', (data: WordSubmittedPayload) => {
      dispatch({ type: 'WORD_SUBMITTED', payload: data });
    });

    socket.on('turn:timer-tick', (data: { secondsRemaining: number }) => {
      dispatch({ type: 'TURN_TIMER_TICK', payload: data });
    });

    socket.on('turn:all-complete', () => {
      dispatch({ type: 'PHASE_CHANGED', payload: { phase: 'voting' } });
    });

    // ─── Vote Events ───────────────────────────────────
    socket.on('vote:submitted', (data: VoteSubmittedPayload) => {
      dispatch({
        type: 'VOTE_SUBMITTED',
        payload: { totalCast: data.totalVotesCast, totalNeeded: data.totalVotesNeeded },
      });
    });

    socket.on('vote:results', (data: GameResults) => {
      dispatch({ type: 'VOTE_RESULTS', payload: data });
    });

    socket.on('game:end', (data: GameResults) => {
      dispatch({ type: 'GAME_ENDED', payload: data });
    });

    // ─── Cleanup ───────────────────────────────────────
    return () => {
      socket.removeAllListeners();
    };
  }, [displayName, dispatch]);

  // ─── Emit Helpers ──────────────────────────────────────
  const createRoom = useCallback((name: string, gameType = 'the-odd-one') => {
    socketRef.current?.emit('room:create', { gameType, displayName: name });
  }, []);

  const updateSettings = useCallback((roomCode: string, settings: Record<string, unknown>) => {
    socketRef.current?.emit('room:update-settings', { roomCode, settings });
  }, []);

  const joinRoom = useCallback((name: string, roomCode: string) => {
    socketRef.current?.emit('room:join', { roomCode: roomCode.toUpperCase(), displayName: name });
  }, []);

  const leaveRoom = useCallback(() => {
    socketRef.current?.emit('room:leave');
    dispatch({ type: 'RESET' });
  }, [dispatch]);

  const startGame = useCallback((roomCode: string) => {
    socketRef.current?.emit('game:start', { roomCode });
  }, []);

  const submitWord = useCallback((roomCode: string, word: string) => {
    socketRef.current?.emit('turn:submit-word', { roomCode, word });
  }, []);

  const submitVote = useCallback(
    (roomCode: string, votedForPlayerId: string) => {
      socketRef.current?.emit('vote:submit', { roomCode, votedForPlayerId });
      dispatch({ type: 'MY_VOTE_CAST', payload: { votedForPlayerId } });
    },
    [dispatch],
  );

  const playAgain = useCallback((roomCode: string) => {
    socketRef.current?.emit('game:play-again', { roomCode });
  }, []);

  const disconnect = useCallback(() => {
    disconnectSocket();
    dispatch({ type: 'RESET' });
  }, [dispatch]);

  return {
    socket: socketRef.current,
    createRoom,
    updateSettings,
    joinRoom,
    leaveRoom,
    startGame,
    submitWord,
    submitVote,
    playAgain,
    disconnect,
  };
}
