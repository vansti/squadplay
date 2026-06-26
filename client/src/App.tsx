import { useState } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { useGameState } from '@/hooks/useGameState';
import { useSocket } from '@/hooks/useSocket';
import { HomePage } from '@/pages/HomePage';
import { LobbyPage } from '@/pages/LobbyPage';
import { GamePage } from '@/pages/GamePage';
import './index.css';

function AppContent() {
  const { state, dispatch, clearError } = useGameState();
  const [displayName, setDisplayName] = useState('');

  const { createRoom, updateSettings, joinRoom, leaveRoom, startGame, submitWord, submitVote, playAgain } =
    useSocket({ displayName, dispatch });

  // Route based on game phase
  const renderPhase = () => {
    switch (state.core.phase) {
      case 'idle':
        return (
          <HomePage
            displayName={displayName}
            onDisplayNameChange={setDisplayName}
            onCreateRoom={createRoom}
            onJoinRoom={joinRoom}
            error={state.core.error}
            onClearError={clearError}
            isConnected={state.core.isConnected}
          />
        );
      case 'lobby':
        return (
          <LobbyPage
            state={state}
            onStartGame={() => state.core.roomCode && startGame(state.core.roomCode)}
            onLeaveRoom={leaveRoom}
            onUpdateSettings={(settings) =>
              state.core.roomCode && updateSettings(state.core.roomCode, settings)
            }
          />
        );
      case 'playing':
      case 'results':
        return (
          <GamePage
            state={state}
            onSubmitWord={(word) => state.core.roomCode && submitWord(state.core.roomCode, word)}
            onSubmitVote={(playerId) => state.core.roomCode && submitVote(state.core.roomCode, playerId)}
            onPlayAgain={() => state.core.roomCode && playAgain(state.core.roomCode)}
            onLeaveRoom={leaveRoom}
          />
        );
      default:
        return (
          <HomePage
            displayName={displayName}
            onDisplayNameChange={setDisplayName}
            onCreateRoom={createRoom}
            onJoinRoom={joinRoom}
            error={state.core.error}
            onClearError={clearError}
            isConnected={state.core.isConnected}
          />
        );
    }
  };

  return (
    <>
      <div className="bg-animated" />
      <div className="min-h-dvh safe-top safe-bottom">{renderPhase()}</div>
    </>
  );
}

function App() {
  return (
    <Router>
      <Routes>
        <Route path="*" element={<AppContent />} />
      </Routes>
    </Router>
  );
}

export default App;
