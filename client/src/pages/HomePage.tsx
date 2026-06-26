import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface HomePageProps {
  displayName: string;
  onDisplayNameChange: (name: string) => void;
  onCreateRoom: (name: string, gameType?: string) => void;
  onJoinRoom: (name: string, roomCode: string) => void;
  error: string | null;
  onClearError: () => void;
  isConnected: boolean;
}

export function HomePage({
  displayName,
  onDisplayNameChange,
  onCreateRoom,
  onJoinRoom,
  error,
  onClearError,
  isConnected,
}: HomePageProps) {
  const [roomCode, setRoomCode] = useState('');
  const [mode, setMode] = useState<'home' | 'join'>('home');
  const [localName, setLocalName] = useState(displayName);

  const canProceed = localName.trim().length >= 2;

  const handleCreateRoom = () => {
    if (canProceed) {
      const finalName = localName.trim();
      onDisplayNameChange(finalName);
      onCreateRoom(finalName, 'the-odd-one');
    }
  };

  const handleJoinRoom = () => {
    if (canProceed && roomCode.trim().length === 6) {
      const finalName = localName.trim();
      onDisplayNameChange(finalName);
      onJoinRoom(finalName, roomCode.trim());
    }
  };

  return (
    <div className="min-h-dvh flex flex-col items-center justify-center px-4 py-8">
      {/* Logo & Title */}
      <motion.div
        initial={{ opacity: 0, y: -30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: 'easeOut' }}
        className="text-center mb-10"
      >
        <div className="inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-gradient-to-br from-brand-500 to-accent-500 mb-4 shadow-lg shadow-brand-500/30">
          <span className="text-3xl">🎮</span>
        </div>
        <h1 className="text-5xl md:text-6xl font-bold font-[family-name:var(--font-display)] gradient-text mb-2">
          SquadPlay
        </h1>
        <p className="text-text-secondary text-lg">Real-time party games with friends</p>
      </motion.div>

      {/* Main Card */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.2 }}
        className="glass-card w-full max-w-md p-8"
      >
        {/* Display Name Input */}
        <div className="mb-6">
          <label
            htmlFor="display-name"
            className="block text-sm font-medium text-text-secondary mb-2"
          >
            Your Name
          </label>
          <input
            id="display-name"
            type="text"
            value={localName}
            onChange={(e) => setLocalName(e.target.value.substring(0, 20))}
            onBlur={() => onDisplayNameChange(localName.trim())}
            placeholder="Enter your display name..."
            className="w-full px-4 py-3 bg-surface-800 border-2 border-surface-600 rounded-lg text-text-primary placeholder-text-muted focus:outline-none focus:border-brand-500 transition-colors text-lg"
            maxLength={20}
            autoComplete="off"
          />
        </div>

        <AnimatePresence mode="wait">
          {mode === 'home' ? (
            <motion.div
              key="home"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="space-y-3"
            >
              {/* Create Room Button */}
              <button
                id="btn-create-room"
                onClick={handleCreateRoom}
                disabled={!canProceed}
                className="btn-gradient w-full py-4 text-lg rounded-xl disabled:opacity-40 disabled:cursor-not-allowed disabled:transform-none"
              >
                <span className="flex items-center justify-center gap-2">✨ Create Room</span>
              </button>

              {/* Join Room Button */}
              <button
                id="btn-join-room"
                onClick={() => setMode('join')}
                disabled={!canProceed}
                className="w-full py-4 text-lg rounded-xl border-2 border-surface-600 text-text-primary hover:border-brand-500 hover:bg-surface-800 transition-all disabled:opacity-40 disabled:cursor-not-allowed"
              >
                🔗 Join Room
              </button>
            </motion.div>
          ) : (
            <motion.div
              key="join"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="space-y-4"
            >
              {/* Room Code Input */}
              <div>
                <label
                  htmlFor="room-code"
                  className="block text-sm font-medium text-text-secondary mb-2"
                >
                  Room Code
                </label>
                <input
                  id="room-code"
                  type="text"
                  value={roomCode}
                  onChange={(e) => {
                    onClearError();
                    setRoomCode(
                      e.target.value
                        .toUpperCase()
                        .replace(/[^A-Z0-9]/g, '')
                        .substring(0, 6),
                    );
                  }}
                  placeholder="ABCDEF"
                  className="room-code-input"
                  maxLength={6}
                  autoComplete="off"
                  autoFocus
                />
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => setMode('home')}
                  className="flex-1 py-3 rounded-xl border-2 border-surface-600 text-text-secondary hover:border-surface-500 transition-all"
                >
                  ← Back
                </button>
                <button
                  id="btn-submit-join"
                  onClick={handleJoinRoom}
                  disabled={roomCode.trim().length !== 6}
                  className="btn-gradient flex-1 py-3 rounded-xl disabled:opacity-40 disabled:cursor-not-allowed disabled:transform-none"
                >
                  <span>Join →</span>
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Error Message */}
        <AnimatePresence>
          {error ? (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="mt-4 p-3 rounded-lg bg-danger-500/10 border border-danger-500/30 text-danger-500 text-sm"
            >
              ⚠️ {error}
            </motion.div>
          ) : null}
        </AnimatePresence>

        {/* Connection Status */}
        <div className="mt-6 flex items-center justify-center gap-2 text-xs text-text-muted">
          <div
            className={`w-2 h-2 rounded-full ${isConnected ? 'bg-success-500' : 'bg-danger-500'}`}
          />
          {isConnected ? 'Connected' : 'Connecting...'}
        </div>
      </motion.div>

      {/* Footer */}
      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.5 }}
        className="mt-8 text-text-muted text-sm"
      >
        Play on any device • No downloads required
      </motion.p>
    </div>
  );
}
