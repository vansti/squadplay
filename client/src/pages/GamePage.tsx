import { useState, memo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import type { RootState } from '@/types/game.types';

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

interface GamePageProps {
  state: RootState;
  onSubmitWord: (word: string) => void;
  onSubmitVote: (playerId: string) => void;
  onPlayAgain: () => void;
  onLeaveRoom: () => void;
}

export function GamePage({
  state,
  onSubmitWord,
  onSubmitVote,
  onPlayAgain,
  onLeaveRoom,
}: GamePageProps) {
  return (
    <div className="min-h-dvh flex flex-col items-center px-4 py-6">
      {/* Header */}
      <div className="w-full max-w-lg mb-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold font-[family-name:var(--font-display)] text-text-primary">
              The Odd One
            </h2>
            <p className="text-text-muted text-xs">Room: {state.core.roomCode}</p>
          </div>
          <div className="flex items-center gap-2 text-sm text-text-secondary">
            {state.gameData.totalRounds > 1 ? (
              <span className="px-3 py-1 rounded-full bg-surface-700 text-xs font-medium tracking-wider text-brand-400">
                Round {state.gameData.currentRound}/{state.gameData.totalRounds}
              </span>
            ) : null}
            <span className="px-3 py-1 rounded-full bg-surface-700 text-xs font-medium uppercase tracking-wider">
              {state.core.phase}
            </span>
          </div>
        </div>
      </div>

      {/* Phase Content */}
      <AnimatePresence mode="wait">
        {state.gameData.phase === 'input' ? (
          <InputPhaseView key="input" state={state} onSubmitWord={onSubmitWord} />
        ) : null}
        {state.gameData.phase === 'voting' ? (
          <VotingPhaseView key="voting" state={state} onSubmitVote={onSubmitVote} />
        ) : null}
        {state.gameData.phase === 'results' ? (
          <ResultsPhaseView
            key="results"
            state={state}
            onPlayAgain={onPlayAgain}
            onLeaveRoom={onLeaveRoom}
          />
        ) : null}
      </AnimatePresence>
    </div>
  );
}

// ─── Input Phase ──────────────────────────────────────────
const InputPhaseView = memo(function InputPhaseView({
  state,
  onSubmitWord,
}: {
  state: RootState;
  onSubmitWord: (word: string) => void;
}) {
  const [wordInput, setWordInput] = useState('');

  const handleSubmit = () => {
    if (wordInput.trim() && state.gameData.isMyTurn) {
      onSubmitWord(wordInput.trim());
      setWordInput('');
    }
  };

  const currentPlayer = state.core.players.find((p) => p.id === state.gameData.currentTurnPlayerId);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="w-full max-w-lg flex-1 flex flex-col"
    >
      {/* Your Word Card */}
      {state.gameData.myWord ? (
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="glass-card p-5 mb-4 text-center"
        >
          <p className="text-text-muted text-xs uppercase tracking-wider mb-1">Your Secret Word</p>
          <p className="text-3xl font-bold gradient-text font-[family-name:var(--font-display)]">
            {state.gameData.myWord}
          </p>
          <p className="text-text-muted text-xs mt-2">
            {state.gameData.myRole === 'odd_one'
              ? "🎭 You're The Odd One! Blend in."
              : '👥 Find The Odd One!'}
          </p>
        </motion.div>
      ) : null}

      {/* Turn Indicator */}
      <div className="glass-card p-4 mb-4 text-center">
        {state.gameData.isMyTurn ? (
          <motion.div
            initial={{ scale: 0.9 }}
            animate={{ scale: 1 }}
            className="text-brand-400 font-bold text-lg"
          >
            ✨ Your Turn! Type a related word.
          </motion.div>
        ) : (
          <p className="text-text-secondary">
            Waiting for{' '}
            <span className="text-text-primary font-medium">
              {currentPlayer?.displayName || '...'}
            </span>
          </p>
        )}

        {/* Timer */}
        <div className="mt-2 flex items-center justify-center gap-2">
          <div className="w-full max-w-48 h-1.5 bg-surface-700 rounded-full overflow-hidden">
            <motion.div
              className="h-full rounded-full bg-gradient-to-r from-brand-500 to-accent-500"
              initial={{ width: '100%' }}
              animate={{ width: `${(state.gameData.turnTimeRemaining / 30) * 100}%` }}
              transition={{ duration: 1, ease: 'linear' }}
            />
          </div>
          <span className="text-xs text-text-muted font-mono w-8">{state.gameData.turnTimeRemaining}s</span>
        </div>
      </div>

      {/* Game Feed */}
      <div className="glass-card p-4 mb-4 flex-1 min-h-48 max-h-64 overflow-y-auto">
        <h3 className="text-sm font-medium text-text-secondary mb-3 uppercase tracking-wider">
          Game Feed
        </h3>
        {state.gameData.feed.length === 0 ? (
          <p className="text-text-muted text-sm text-center py-8">No words submitted yet...</p>
        ) : (
          <div className="space-y-2">
            {state.gameData.feed.map((entry, index) => (
              <motion.div
                key={`${entry.playerId}-${index}`}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                className="flex items-center gap-3 p-2 rounded-lg bg-surface-800/50"
              >
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold text-white ${AVATAR_COLORS[index % AVATAR_COLORS.length]}`}
                >
                  {entry.displayName.charAt(0).toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <span className="text-text-muted text-xs">{entry.displayName}</span>
                  <p className="text-text-primary font-medium">{entry.word}</p>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>

      {/* Word Input */}
      <div className="glass-card p-4">
        <div className="flex gap-3">
          <input
            id="word-input"
            type="text"
            value={wordInput}
            onChange={(e) => setWordInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSubmit()}
            placeholder={state.gameData.isMyTurn ? 'Type your word...' : 'Wait for your turn...'}
            disabled={!state.gameData.isMyTurn}
            className="flex-1 px-4 py-3 bg-surface-800 border-2 border-surface-600 rounded-lg text-text-primary placeholder-text-muted focus:outline-none focus:border-brand-500 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
            maxLength={50}
            autoComplete="off"
          />
          <button
            id="btn-submit-word"
            onClick={handleSubmit}
            disabled={!state.gameData.isMyTurn || !wordInput.trim()}
            className="btn-gradient px-6 py-3 rounded-lg disabled:opacity-40 disabled:cursor-not-allowed disabled:transform-none"
          >
            <span>Send</span>
          </button>
        </div>
      </div>
    </motion.div>
  );
});

// ─── Voting Phase ─────────────────────────────────────────
const VotingPhaseView = memo(function VotingPhaseView({
  state,
  onSubmitVote,
}: {
  state: RootState;
  onSubmitVote: (playerId: string) => void;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="w-full max-w-lg"
    >
      {/* Vote Header */}
      <div className="glass-card p-5 mb-4 text-center">
        <h3 className="text-xl font-bold text-text-primary mb-1">🗳️ Time to Vote!</h3>
        <p className="text-text-secondary text-sm">Who do you think is The Odd One?</p>
        {state.gameData.myVote ? <p className="text-brand-400 text-sm mt-2">✓ You've cast your vote</p> : null}
        <p className="text-text-muted text-xs mt-2">
          Votes: {state.gameData.votesCast} / {state.gameData.votesNeeded}
        </p>
      </div>

      {/* Player Vote Cards */}
      <div className="space-y-3">
        {state.core.players
          .filter((p) => p.id !== state.core.playerId) // Can't vote for yourself
          .map((player, index) => (
            <motion.button
              key={player.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.1 }}
              onClick={() => !state.gameData.myVote && onSubmitVote(player.id)}
              disabled={!!state.gameData.myVote}
              className={`w-full flex items-center gap-4 p-4 rounded-xl transition-all ${
                state.gameData.myVote === player.id
                  ? 'glass-card border-brand-500 ring-2 ring-brand-500/30'
                  : state.gameData.myVote
                    ? 'glass-card opacity-50 cursor-not-allowed'
                    : 'glass-card glass-card-hover cursor-pointer'
              }`}
            >
              <div className={`player-avatar ${AVATAR_COLORS[index % AVATAR_COLORS.length]}`}>
                {player.displayName.charAt(0).toUpperCase()}
              </div>
              <span className="text-text-primary font-medium text-lg">{player.displayName}</span>
              {state.gameData.myVote === player.id ? (
                <span className="ml-auto text-brand-400 text-lg">✓</span>
              ) : null}
            </motion.button>
          ))}
      </div>
    </motion.div>
  );
});

// ─── Results Phase ────────────────────────────────────────
const ResultsPhaseView = memo(function ResultsPhaseView({
  state,
  onPlayAgain,
  onLeaveRoom,
}: {
  state: RootState;
  onPlayAgain: () => void;
  onLeaveRoom: () => void;
}) {
  const results = state.gameData.results;

  if (!results) {
    return (
      <div className="glass-card p-8 text-center">
        <p className="text-text-secondary">Loading results...</p>
      </div>
    );
  }

  const iWasOddOne = results.oddOneId === state.core.playerId;
  const civilianWon = results.winnerSide === 'civilians';
  const iWon = iWasOddOne ? !civilianWon : civilianWon;

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0 }}
      className="w-full max-w-lg space-y-4"
    >
      {/* Result Banner */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="glass-card p-8 text-center"
      >
        <div className="text-5xl mb-4">{iWon ? '🎉' : '😢'}</div>
        <h3 className="text-3xl font-bold font-[family-name:var(--font-display)] mb-2">
          {iWon ? (
            <span className="gradient-text">You Win!</span>
          ) : (
            <span className="text-danger-500">You Lose!</span>
          )}
        </h3>
        <p className="text-text-secondary">
          {civilianWon ? 'The Civilians found The Odd One!' : 'The Odd One fooled everyone!'}
        </p>
      </motion.div>

      {/* The Odd One Reveal */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
        className="glass-card p-6 text-center"
      >
        <p className="text-text-muted text-sm uppercase tracking-wider mb-2">The Odd One Was</p>
        <p className="text-2xl font-bold text-text-primary">
          🎭 {results.oddOnePlayer?.displayName || 'Unknown'}
        </p>
      </motion.div>

      {/* Word Reveal */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.7 }}
        className="glass-card p-6"
      >
        <p className="text-text-muted text-sm uppercase tracking-wider mb-3 text-center">
          The Words Were
        </p>
        <div className="flex gap-4">
          <div className="flex-1 text-center p-3 rounded-xl bg-surface-800">
            <p className="text-text-muted text-xs mb-1">Civilians</p>
            <p className="text-xl font-bold text-brand-400">{results.wordPair.wordA}</p>
          </div>
          <div className="flex-1 text-center p-3 rounded-xl bg-surface-800">
            <p className="text-text-muted text-xs mb-1">Odd One</p>
            <p className="text-xl font-bold text-danger-500">{results.wordPair.wordB}</p>
          </div>
        </div>
      </motion.div>

      {/* Actions */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.9 }}
        className="space-y-3"
      >
        {state.core.isHost ? (
          <button
            id="btn-play-again"
            onClick={onPlayAgain}
            className="btn-gradient w-full py-4 text-lg rounded-xl"
          >
            <span>🔄 Play Again</span>
          </button>
        ) : null}
        <button
          id="btn-leave-game"
          onClick={onLeaveRoom}
          className="w-full py-3 text-sm rounded-xl text-text-muted hover:text-danger-500 hover:bg-danger-500/10 transition-all"
        >
          Leave Game
        </button>
      </motion.div>
    </motion.div>
  );
});
