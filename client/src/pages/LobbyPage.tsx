import { motion } from 'framer-motion';
import type { RootState } from '@/types/game.types';

// Avatar color palette
const AVATAR_COLORS = [
  'bg-gradient-to-br from-brand-400 to-brand-600',
  'bg-gradient-to-br from-accent-400 to-accent-600',
  'bg-gradient-to-br from-success-500 to-success-600',
  'bg-gradient-to-br from-warning-500 to-warning-600',
  'bg-gradient-to-br from-danger-500 to-danger-600',
  'bg-gradient-to-br from-brand-500 to-accent-500',
  'bg-gradient-to-br from-pink-400 to-rose-600',
  'bg-gradient-to-br from-cyan-400 to-blue-600',
];

interface LobbyPageProps {
  state: RootState;
  onStartGame: () => void;
  onLeaveRoom: () => void;
  onUpdateSettings: (settings: Record<string, unknown>) => void;
}

const ROUND_OPTIONS = [1, 2, 3, 4, 5];

export function LobbyPage({ state: rootState, onStartGame, onLeaveRoom, onUpdateSettings }: LobbyPageProps) {
  const state = rootState.core;
  const copyRoomCode = async () => {
    if (state.roomCode) {
      try {
        await navigator.clipboard.writeText(state.roomCode);
      } catch {
        // Fallback: select the text
      }
    }
  };

  const minPlayers = 3;
  const canStart = state.isHost && state.players.length >= minPlayers;

  return (
    <div className="min-h-dvh flex flex-col items-center px-4 py-8">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center mb-8"
      >
        <h2 className="text-2xl font-bold font-[family-name:var(--font-display)] text-text-primary mb-1">
          Game Lobby
        </h2>
        <p className="text-text-secondary text-sm">Waiting for players to join...</p>
      </motion.div>

      {/* Room Code Card */}
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.1 }}
        className="glass-card p-6 mb-6 text-center w-full max-w-md"
      >
        <p className="text-text-secondary text-sm mb-2 uppercase tracking-wider font-medium">
          Room Code
        </p>
        <button
          id="btn-copy-code"
          onClick={copyRoomCode}
          className="group relative"
          title="Click to copy"
        >
          <p className="text-4xl md:text-5xl font-bold font-[family-name:var(--font-mono)] tracking-[0.3em] gradient-text">
            {state.roomCode}
          </p>
          <span className="absolute -bottom-5 left-1/2 -translate-x-1/2 text-xs text-text-muted opacity-0 group-hover:opacity-100 transition-opacity">
            Click to copy
          </span>
        </button>
        <p className="text-text-muted text-xs mt-6">Share this code with your friends to join</p>
      </motion.div>

      {/* Players List */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="glass-card p-6 w-full max-w-md mb-6"
      >
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-text-primary">Players</h3>
          <span className="text-sm text-text-muted px-3 py-1 rounded-full bg-surface-700">
            {state.players.length} / 10
          </span>
        </div>

        <div className="space-y-3">
          {state.players.map((player, index) => (
            <motion.div
              key={player.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.1 * index }}
              className="flex items-center gap-3 p-3 rounded-xl bg-surface-800/50 border border-surface-700/50"
            >
              {/* Avatar */}
              <div className={`player-avatar ${AVATAR_COLORS[index % AVATAR_COLORS.length]}`}>
                {player.displayName.charAt(0).toUpperCase()}
              </div>

              {/* Name */}
              <div className="flex-1 min-w-0">
                <p className="text-text-primary font-medium truncate">{player.displayName}</p>
                <p className="text-text-muted text-xs">
                  {player.id === state.playerId ? 'You' : ''}
                  {player.id === state.players[0]?.id ? ' 👑 Host' : ''}
                </p>
              </div>

              {/* Connection indicator */}
              <div
                className={`w-2.5 h-2.5 rounded-full ${player.isConnected ? 'bg-success-500' : 'bg-danger-500'}`}
              />
            </motion.div>
          ))}
        </div>

        {state.players.length < minPlayers ? (
          <p className="mt-4 text-center text-text-muted text-sm">
            Need {minPlayers - state.players.length} more player
            {minPlayers - state.players.length > 1 ? 's' : ''} to start
          </p>
        ) : null}
      </motion.div>

      {/* Game Settings */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.25 }}
        className="glass-card p-6 w-full max-w-md mb-6"
      >
        <h3 className="text-lg font-semibold text-text-primary mb-4">⚙️ Game Settings</h3>

        {/* Rounds Selector */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-3">
            <label className="text-sm font-medium text-text-secondary">Rounds per Player</label>
            <span className="text-xs text-text-muted">
              {state.roomSettings.rounds === 1
                ? 'Each player says 1 word'
                : `Each player says ${state.roomSettings.rounds} words`}
            </span>
          </div>
          <div className="flex gap-2">
            {ROUND_OPTIONS.map((n) => (
              <button
                key={n}
                id={`btn-rounds-${n}`}
                onClick={() => state.isHost && onUpdateSettings({ rounds: n })}
                disabled={!state.isHost}
                className={`flex-1 py-2.5 rounded-lg text-sm font-semibold transition-all ${
                  state.roomSettings.rounds === n
                    ? 'bg-gradient-to-br from-brand-500 to-accent-500 text-white shadow-lg shadow-brand-500/30'
                    : state.isHost
                      ? 'bg-surface-800 text-text-secondary border border-surface-600 hover:border-brand-500 hover:text-text-primary cursor-pointer'
                      : 'bg-surface-800 text-text-muted border border-surface-700 cursor-not-allowed'
                }`}
              >
                {n}
              </button>
            ))}
          </div>
        </div>

        {/* Custom Topic */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <label className="text-sm font-medium text-text-secondary">Custom Topic (Optional)</label>
            <span className="text-xs text-text-muted">AI generated words</span>
          </div>
          <input
            type="text"
            id="input-custom-topic"
            placeholder="e.g. 90s Action Movies..."
            value={state.roomSettings.customTopic || ''}
            onChange={(e) => state.isHost && onUpdateSettings({ customTopic: e.target.value })}
            disabled={!state.isHost}
            className="w-full px-4 py-3 rounded-xl bg-surface-800 border border-surface-600 text-text-primary placeholder:text-text-muted focus:outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          />
        </div>
      </motion.div>

      {/* Actions */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="w-full max-w-md space-y-3"
      >
        {state.isHost ? (
          <button
            id="btn-start-game"
            onClick={onStartGame}
            disabled={!canStart}
            className={`btn-gradient w-full py-4 text-lg rounded-xl disabled:opacity-40 disabled:cursor-not-allowed disabled:transform-none ${canStart ? 'pulse-glow' : ''}`}
          >
            <span className="flex items-center justify-center gap-2">🚀 Start Game</span>
          </button>
        ) : null}

        {!state.isHost ? (
          <div className="text-center p-4 rounded-xl border-2 border-dashed border-surface-600 text-text-secondary">
            Waiting for host to start the game...
          </div>
        ) : null}

        <button
          id="btn-leave-room"
          onClick={onLeaveRoom}
          className="w-full py-3 text-sm rounded-xl text-text-muted hover:text-danger-500 hover:bg-danger-500/10 transition-all"
        >
          Leave Room
        </button>
      </motion.div>
    </div>
  );
}
