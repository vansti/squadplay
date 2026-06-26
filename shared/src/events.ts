/**
 * Shared Socket.io event name constants
 * Used by both client and server to prevent typos
 */

// Room events
export const ROOM_CREATE = 'room:create' as const;
export const ROOM_CREATED = 'room:created' as const;
export const ROOM_JOIN = 'room:join' as const;
export const ROOM_PLAYER_JOINED = 'room:player-joined' as const;
export const ROOM_PLAYER_LEFT = 'room:player-left' as const;
export const ROOM_LEAVE = 'room:leave' as const;
export const ROOM_ERROR = 'room:error' as const;
export const ROOM_SETTINGS = 'room:settings' as const;
export const ROOM_KICK = 'room:kick' as const;

// Game events
export const GAME_START = 'game:start' as const;
export const GAME_STARTED = 'game:started' as const;
export const GAME_YOUR_WORD = 'game:your-word' as const;
export const GAME_STATE_SYNC = 'game:state-sync' as const;
export const GAME_ERROR = 'game:error' as const;
export const GAME_END = 'game:end' as const;
export const GAME_PLAY_AGAIN = 'game:play-again' as const;

// Turn events
export const TURN_SUBMIT_WORD = 'turn:submit-word' as const;
export const TURN_WORD_SUBMITTED = 'turn:word-submitted' as const;
export const TURN_NEXT = 'turn:next' as const;
export const TURN_TIMER_TICK = 'turn:timer-tick' as const;
export const TURN_TIMEOUT = 'turn:timeout' as const;
export const TURN_ALL_COMPLETE = 'turn:all-complete' as const;

// Vote events
export const VOTE_SUBMIT = 'vote:submit' as const;
export const VOTE_SUBMITTED = 'vote:submitted' as const;
export const VOTE_RESULTS = 'vote:results' as const;
