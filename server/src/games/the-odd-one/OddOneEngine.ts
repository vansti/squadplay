import type { Server as SocketServer } from 'socket.io';
import { v4 as uuidv4 } from 'uuid';
import { GameEngine } from '../GameEngine.js';
import type { RoomState } from '../../store/MemoryStore.js';
import { getRandomWordPair } from './wordPairService.js';
import { config } from '../../config.js';
import { query } from '../../models/db.js';

export class OddOneEngine extends GameEngine {
  constructor(io: SocketServer) {
    super(io);
  }

  /**
   * Shuffles an array in place (Fisher-Yates)
   */
  private shuffle<T>(array: T[]): T[] {
    const arr = [...array];
    for (let i = arr.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
  }

  /**
   * Start a new game of The Odd One
   */
  async onStart(room: RoomState): Promise<void> {
    try {
      console.log(`🎮 OddOneEngine: Starting game in room ${room.roomCode}`);

      // 1. Fetch random word pair
      const wordPair = await getRandomWordPair();

      // 2. Select a random player to be The Odd One
      const players = room.players.filter((p) => p.isConnected);
      if (players.length === 0) {
        throw new Error('No connected players in room');
      }
      const randomOddOneIndex = Math.floor(Math.random() * players.length);
      const oddOneId = players[randomOddOneIndex].id;

      // 3. Shuffle turn order and repeat for multiple rounds
      const totalRounds = Math.min(Math.max(Number(room.settings.rounds) || 1, 1), 5);
      const singleRoundOrder = this.shuffle(players.map((p) => p.id));
      const turnOrder: string[] = [];
      for (let r = 0; r < totalRounds; r++) {
        turnOrder.push(...singleRoundOrder);
      }

      // 4. Initialize game state
      room.game = {
        phase: 'input',
        wordPair,
        oddOneId,
        turnOrder,
        currentTurnIndex: 0,
        feed: [],
        votes: new Map(),
        totalRounds,
        currentRound: 1,
      };
      room.status = 'in_progress';

      // 5. Emit private secret words to each player
      for (const player of room.players) {
        const isOddOne = player.id === oddOneId;
        const secretWord = isOddOne ? wordPair.wordB : wordPair.wordA;
        const role = isOddOne ? 'odd_one' : 'civilian';

        this.io.to(player.socketId).emit('game:your-word', {
          word: secretWord,
          role,
        });
      }

      // 6. Broadcast game:started to the entire room
      this.io.to(`room:${room.roomCode}`).emit('game:started', {
        phase: 'input',
        turnOrder,
        currentTurnPlayerId: turnOrder[0],
        gameType: room.gameType,
        totalRounds,
        currentRound: 1,
      });

      // 7. Start turn timer for the first player
      this.startTurnTimer(room);
    } catch (error) {
      console.error('❌ Failed to start game in OddOneEngine:', error);
      this.io.to(`room:${room.roomCode}`).emit('game:error', {
        code: 'START_FAILED',
        message: 'Failed to initialize the game. Please try again.',
      });
    }
  }

  /**
   * Start the turn countdown timer (30s)
   */
  private startTurnTimer(room: RoomState): void {
    if (!room.game || room.game.phase !== 'input') return;

    if (room.game.turnTimer) {
      clearInterval(room.game.turnTimer);
    }

    let secondsRemaining = config.turnTimerSeconds;
    this.io.to(`room:${room.roomCode}`).emit('turn:timer-tick', { secondsRemaining });

    const timerId = setInterval(() => {
      secondsRemaining--;
      if (secondsRemaining <= 0) {
        clearInterval(timerId);
        this.handleTurnTimeout(room);
      } else {
        this.io.to(`room:${room.roomCode}`).emit('turn:timer-tick', { secondsRemaining });
      }
    }, 1000);

    room.game.turnTimer = timerId;
  }

  /**
   * Handle when a player's turn timer runs out
   */
  private handleTurnTimeout(room: RoomState): void {
    if (
      !room.game ||
      room.game.phase !== 'input' ||
      room.game.currentTurnIndex === undefined ||
      !room.game.turnOrder
    )
      return;

    const currentPlayerId = room.game.turnOrder[room.game.currentTurnIndex];
    console.log(`⏱️ Turn timeout for player ${currentPlayerId} in room ${room.roomCode}`);

    // Auto-submit "(skipped)"
    this.submitWord(room, currentPlayerId, '(skipped)');
  }

  /**
   * Submit a word for the current turn
   */
  private submitWord(room: RoomState, playerId: string, word: string): void {
    if (
      !room.game ||
      room.game.phase !== 'input' ||
      room.game.currentTurnIndex === undefined ||
      !room.game.turnOrder ||
      !room.game.feed
    )
      return;

    const currentPlayerId = room.game.turnOrder[room.game.currentTurnIndex];
    if (playerId !== currentPlayerId) {
      const playerSocket = room.players.find((p) => p.id === playerId)?.socketId;
      if (playerSocket) {
        this.io.to(playerSocket).emit('game:error', {
          code: 'NOT_YOUR_TURN',
          message: 'It is not your turn to submit a word.',
        });
      }
      return;
    }

    // Validate word (trim & limit length)
    const sanitizedWord = word.trim().substring(0, 50);
    if (!sanitizedWord) {
      const playerSocket = room.players.find((p) => p.id === playerId)?.socketId;
      if (playerSocket) {
        this.io.to(playerSocket).emit('game:error', {
          code: 'INVALID_WORD',
          message: 'Word cannot be empty.',
        });
      }
      return;
    }

    const player = room.players.find((p) => p.id === playerId);
    if (!player) return;

    // Add to feed
    const feedEntry = {
      playerId,
      displayName: player.displayName,
      word: sanitizedWord,
      turnIndex: room.game.currentTurnIndex,
    };
    room.game.feed.push(feedEntry);

    // Broadcast submission
    this.io.to(`room:${room.roomCode}`).emit('turn:word-submitted', feedEntry);

    // Stop active timer
    if (room.game.turnTimer) {
      clearInterval(room.game.turnTimer);
      room.game.turnTimer = undefined;
    }

    // Advance to next turn
    room.game.currentTurnIndex++;

    if (room.game.currentTurnIndex >= room.game.turnOrder.length) {
      // Transition to Voting Phase
      room.game.phase = 'voting';
      this.io.to(`room:${room.roomCode}`).emit('turn:all-complete');
      this.startVotingTimer(room);
    } else {
      // Calculate the current round based on turn index and number of players per round
      const playersPerRound = room.game.turnOrder.length / (room.game.totalRounds || 1);
      const currentRound = Math.floor(room.game.currentTurnIndex / playersPerRound) + 1;
      room.game.currentRound = currentRound;

      // Move to next player
      const nextPlayerId = room.game.turnOrder[room.game.currentTurnIndex];
      this.io.to(`room:${room.roomCode}`).emit('turn:next', {
        currentTurnPlayerId: nextPlayerId,
        turnIndex: room.game.currentTurnIndex,
        remainingPlayers: room.game.turnOrder.length - room.game.currentTurnIndex,
        currentRound,
      });
      this.startTurnTimer(room);
    }
  }

  /**
   * Start a countdown timer for the voting phase (60s)
   */
  private startVotingTimer(room: RoomState): void {
    if (!room.game || room.game.phase !== 'voting') return;

    if (room.game.turnTimer) {
      clearInterval(room.game.turnTimer);
    }

    let secondsRemaining = config.voteTimerSeconds;

    const timerId = setInterval(() => {
      secondsRemaining--;
      if (secondsRemaining <= 0) {
        clearInterval(timerId);
        this.handleVotingTimeout(room);
      }
    }, 1000);

    room.game.turnTimer = timerId;
  }

  /**
   * Handle when voting timer runs out (force resolve with whatever votes are cast)
   */
  private handleVotingTimeout(room: RoomState): void {
    if (!room.game || room.game.phase !== 'voting') return;
    console.log(`⏱️ Voting timeout in room ${room.roomCode}. Resolving game.`);
    this.resolveGame(room);
  }

  /**
   * Submit a vote for a player
   */
  private submitVote(room: RoomState, voterId: string, votedForPlayerId: string): void {
    if (!room.game || room.game.phase !== 'voting' || !room.game.votes) return;

    const voter = room.players.find((p) => p.id === voterId);
    if (!voter) return;

    // Check duplicate vote
    if (room.game.votes.has(voterId)) {
      this.io.to(voter.socketId).emit('game:error', {
        code: 'ALREADY_VOTED',
        message: 'You have already voted.',
      });
      return;
    }

    // Check self vote
    if (voterId === votedForPlayerId) {
      this.io.to(voter.socketId).emit('game:error', {
        code: 'CANNOT_VOTE_SELF',
        message: 'You cannot vote for yourself.',
      });
      return;
    }

    // Check target exists
    const targetPlayer = room.players.find((p) => p.id === votedForPlayerId);
    if (!targetPlayer) {
      this.io.to(voter.socketId).emit('game:error', {
        code: 'INVALID_TARGET',
        message: 'The player you voted for does not exist in this room.',
      });
      return;
    }

    // Register vote
    room.game.votes.set(voterId, votedForPlayerId);

    // Broadcast vote submission progress
    this.io.to(`room:${room.roomCode}`).emit('vote:submitted', {
      voterId,
      totalVotesCast: room.game.votes.size,
      totalVotesNeeded: room.players.filter((p) => p.isConnected).length,
    });

    // Check if all connected players voted
    const connectedPlayersCount = room.players.filter((p) => p.isConnected).length;
    if (room.game.votes.size >= connectedPlayersCount) {
      if (room.game.turnTimer) {
        clearInterval(room.game.turnTimer);
        room.game.turnTimer = undefined;
      }
      this.resolveGame(room);
    }
  }

  /**
   * Tally votes, distribute scores, persist match, and broadcast results
   */
  private async resolveGame(room: RoomState): Promise<void> {
    if (!room.game || !room.game.votes || !room.game.wordPair || !room.game.oddOneId) return;

    room.game.phase = 'results';
    room.status = 'finished';

    // 1. Tally votes
    const voteTallies: Record<string, number> = {};
    for (const player of room.players) {
      voteTallies[player.id] = 0;
    }

    for (const [_, votedForId] of room.game.votes.entries()) {
      voteTallies[votedForId] = (voteTallies[votedForId] || 0) + 1;
    }

    // Find highest voted player(s)
    let maxVotes = -1;
    let candidates: string[] = [];

    for (const [playerId, count] of Object.entries(voteTallies)) {
      if (count > maxVotes) {
        maxVotes = count;
        candidates = [playerId];
      } else if (count === maxVotes) {
        candidates.push(playerId);
      }
    }

    // Tie-breaking: choose random candidate
    const eliminatedId = candidates[Math.floor(Math.random() * candidates.length)];
    const oddOneId = room.game.oddOneId;
    const isOddOneEliminated = eliminatedId === oddOneId;

    // Determine winner side
    const winnerSide = isOddOneEliminated ? 'civilians' : 'odd_one';

    // 2. Score calculations
    for (const player of room.players) {
      if (winnerSide === 'civilians') {
        if (player.id !== oddOneId) {
          player.score += 10;
        }
      } else {
        if (player.id === oddOneId) {
          player.score += 20;
        }
      }
    }

    // Build results object
    const matchId = uuidv4();
    const oddOnePlayer = room.players.find((p) => p.id === oddOneId);

    const results = {
      winnerSide,
      oddOneId,
      oddOnePlayer,
      eliminatedId,
      wordPair: room.game.wordPair,
      votes: voteTallies,
      scores: room.players.map((p) => ({
        playerId: p.id,
        displayName: p.displayName,
        score: p.score,
      })),
      matchId,
    };

    // Broadcast results & end game
    this.io.to(`room:${room.roomCode}`).emit('vote:results', results);
    this.io.to(`room:${room.roomCode}`).emit('game:end', results);

    // 3. Persist match details to Postgres asynchronously
    this.persistMatchToDB(room, results).catch((err) => {
      console.error('❌ database persistence failed:', err);
    });
  }

  /**
   * Handle PostgreSQL persistence for users, rooms, match, and match_players
   */
  private async persistMatchToDB(room: RoomState, results: any): Promise<void> {
    try {
      console.log(`💾 Persisting match ${results.matchId} to DB...`);

      // 1. Ensure all players exist in users table
      for (const player of room.players) {
        await query(
          `INSERT INTO users (id, username, display_name)
           VALUES ($1, $2, $3)
           ON CONFLICT (id) DO UPDATE SET display_name = $3`,
          [player.id, player.id, player.displayName],
        );
      }

      // 2. Ensure room exists in rooms table
      await query(
        `INSERT INTO rooms (id, code, host_id, game_type, status, settings)
         VALUES ($1, $2, $3, $4, $5, $6)
         ON CONFLICT (id) DO UPDATE SET status = $5`,
        [
          room.roomId,
          room.roomCode,
          room.hostId,
          room.gameType,
          room.status,
          JSON.stringify(room.settings),
        ],
      );

      // 3. Insert into matches
      await query(
        `INSERT INTO matches (id, room_id, game_type, odd_one_id, winner_side, round_data, round_number)
         VALUES ($1, $2, $3, $4, $5, $6, 1)`,
        [
          results.matchId,
          room.roomId,
          room.gameType,
          results.oddOneId,
          results.winnerSide,
          JSON.stringify({
            feed: room.game?.feed || [],
            votes: results.votes,
          }),
        ],
      );

      // 4. Insert into match_players
      for (const player of room.players) {
        const role = player.id === results.oddOneId ? 'odd_one' : 'civilian';
        const submittedWord = room.game?.feed?.find((f) => f.playerId === player.id)?.word || null;
        const votedFor = room.game?.votes?.get(player.id) || null;
        const survived = player.id !== results.eliminatedId;
        const scoreEarned =
          results.winnerSide === 'civilians' && role === 'civilian'
            ? 10
            : results.winnerSide === 'odd_one' && role === 'odd_one'
              ? 20
              : 0;

        await query(
          `INSERT INTO match_players (match_id, user_id, role, submitted_word, voted_for, survived, score_earned)
           VALUES ($1, $2, $3, $4, $5, $6, $7)`,
          [results.matchId, player.id, role, submittedWord, votedFor, survived, scoreEarned],
        );
      }

      console.log(`✅ Match ${results.matchId} successfully persisted in PostgreSQL`);
    } catch (error) {
      console.error('❌ Failed to persist match in PostgreSQL:', error);
    }
  }

  /**
   * Handle player actions routed from socket events
   */
  async onPlayerAction(
    room: RoomState,
    playerId: string,
    action: string,
    payload: any,
  ): Promise<void> {
    if (action === 'submit-word') {
      this.submitWord(room, playerId, payload.word);
    } else if (action === 'submit-vote') {
      this.submitVote(room, playerId, payload.votedForPlayerId);
    } else {
      console.warn(`⚠️ Unknown action "${action}" received in OddOneEngine`);
    }
  }

  /**
   * Handle when a player disconnects mid-game
   */
  async onPlayerDisconnect(room: RoomState, playerId: string): Promise<void> {
    console.log(`🔌 Player ${playerId} disconnected mid-game from room ${room.roomCode}`);

    // If it was their turn, auto-skip it to avoid game freezing
    if (
      room.game &&
      room.game.phase === 'input' &&
      room.game.turnOrder &&
      room.game.currentTurnIndex !== undefined
    ) {
      const currentPlayerId = room.game.turnOrder[room.game.currentTurnIndex];
      if (currentPlayerId === playerId) {
        console.log(`🔌 Current turn player disconnected. Skipping turn.`);
        this.handleTurnTimeout(room);
      }
    }
  }

  /**
   * Handle when a player reconnects mid-game
   */
  async onPlayerReconnect(room: RoomState, playerId: string, socketId: string): Promise<void> {
    console.log(`🔌 Player ${playerId} reconnected to room ${room.roomCode}`);
    const player = room.players.find((p) => p.id === playerId);
    if (!player || !room.game || !room.game.wordPair) return;

    // Resend their private secret word
    const isOddOne = playerId === room.game.oddOneId;
    const secretWord = isOddOne ? room.game.wordPair.wordB : room.game.wordPair.wordA;
    const role = isOddOne ? 'odd_one' : 'civilian';

    this.io.to(socketId).emit('game:your-word', {
      word: secretWord,
      role,
    });

    // Send state sync
    const currentTurnPlayerId =
      room.game.turnOrder && room.game.currentTurnIndex !== undefined
        ? room.game.turnOrder[room.game.currentTurnIndex]
        : null;

    this.io.to(socketId).emit('game:state-sync', {
      phase: room.game.phase,
      currentTurnPlayerId,
      turnOrder: room.game.turnOrder,
      feed: room.game.feed,
      players: room.players,
    });
  }

  /**
   * Handle Play Again request (resets game state and triggers start)
   */
  async onPlayAgain(room: RoomState): Promise<void> {
    console.log(`🔄 Play again requested in room ${room.roomCode}`);
    this.cleanUp(room);
    await this.onStart(room);
  }

  /**
   * Clear all active timers
   */
  cleanUp(room: RoomState): void {
    if (room.game?.turnTimer) {
      clearInterval(room.game.turnTimer);
      room.game.turnTimer = undefined;
    }
  }
}
