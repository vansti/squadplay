import { io, Socket } from 'socket.io-client';

const SOCKET_URL = import.meta.env.VITE_WS_URL || 'http://localhost:3001';

let socket: Socket | null = null;

/**
 * Get or create the Socket.io client singleton.
 * Connects with the player's display name for auth.
 */
export function getSocket(displayName?: string): Socket {
  if (socket && socket.connected) {
    return socket;
  }

  socket = io(SOCKET_URL, {
    autoConnect: false,
    reconnection: true,
    reconnectionAttempts: 5,
    reconnectionDelay: 1000,
    timeout: 10000,
    auth: {
      displayName: displayName || 'Anonymous',
      sessionToken: getOrCreateSessionToken(),
    },
  });

  return socket;
}

/**
 * Connect the socket (must call getSocket first)
 */
export function connectSocket(displayName: string): Socket {
  const s = getSocket(displayName);

  const currentAuth = s.auth as Record<string, any>;
  if (currentAuth && currentAuth.displayName !== displayName) {
    currentAuth.displayName = displayName;
    if (s.connected) {
      s.disconnect().connect();
    }
  }

  if (!s.connected) {
    s.auth = {
      displayName,
      sessionToken: getOrCreateSessionToken(),
    };
    s.connect();
  }
  return s;
}

/**
 * Disconnect and clean up
 */
export function disconnectSocket(): void {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
}

/**
 * Get or create a persistent session token (survives page reload)
 */
const SESSION_KEY = 'squadplay_session_v1';

function getOrCreateSessionToken(): string {
  let token = sessionStorage.getItem(SESSION_KEY);
  if (!token) {
    token = crypto.randomUUID();
    sessionStorage.setItem(SESSION_KEY, token);
  }
  return token;
}
