import type { Server as SocketServer } from 'socket.io';
import type { RoomState } from '../store/MemoryStore.js';

export abstract class GameEngine {
  protected io: SocketServer;

  constructor(io: SocketServer) {
    this.io = io;
  }

  /**
   * Called when a game starts.
   */
  abstract onStart(room: RoomState): Promise<void>;

  /**
   * Called when a player performs an action during the game.
   */
  abstract onPlayerAction(
    room: RoomState,
    playerId: string,
    action: string,
    payload: any,
  ): Promise<void>;

  /**
   * Called when a player disconnects from the socket.
   */
  abstract onPlayerDisconnect(room: RoomState, playerId: string): Promise<void>;

  /**
   * Called when a player reconnects to the socket.
   */
  abstract onPlayerReconnect(room: RoomState, playerId: string, socketId: string): Promise<void>;

  /**
   * Called when the host requests to play again after a game ends.
   */
  abstract onPlayAgain(room: RoomState): Promise<void>;

  /**
   * Called to clean up timers or resources when room is destroyed or reset.
   */
  abstract cleanUp(room: RoomState): void;
}
