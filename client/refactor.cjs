const fs = require('fs');
const path = 'c:/Users/phaml/.gemini/antigravity-ide/scratch/SquadPlay/client/src/pages/GamePage.tsx';
let content = fs.readFileSync(path, 'utf-8');

// game types
content = content.replace(/import type \{ GameState \}/g, "import type { RootState }");
content = content.replace(/state: GameState/g, "state: RootState");

// AnimatePresence conditions
content = content.replace(/state\.phase === 'input'/g, "state.gameData.phase === 'input'");
content = content.replace(/state\.phase === 'voting'/g, "state.gameData.phase === 'voting'");
content = content.replace(/state\.phase === 'results'/g, "state.gameData.phase === 'results'");

// Header remaining phase
content = content.replace(/state\.phase/g, 'state.core.phase');

// General core properties
content = content.replace(/state\.roomCode/g, 'state.core.roomCode');
content = content.replace(/state\.players/g, 'state.core.players');
content = content.replace(/state\.playerId/g, 'state.core.playerId');
content = content.replace(/state\.isHost/g, 'state.core.isHost');

// General gameData properties
content = content.replace(/state\.isMyTurn/g, 'state.gameData.isMyTurn');
content = content.replace(/state\.currentTurnPlayerId/g, 'state.gameData.currentTurnPlayerId');
content = content.replace(/state\.myWord/g, 'state.gameData.myWord');
content = content.replace(/state\.myRole/g, 'state.gameData.myRole');
content = content.replace(/state\.turnTimeRemaining/g, 'state.gameData.turnTimeRemaining');
content = content.replace(/state\.feed/g, 'state.gameData.feed');
content = content.replace(/state\.myVote/g, 'state.gameData.myVote');
content = content.replace(/state\.votesCast/g, 'state.gameData.votesCast');
content = content.replace(/state\.votesNeeded/g, 'state.gameData.votesNeeded');
content = content.replace(/state\.results/g, 'state.gameData.results');

fs.writeFileSync(path, content);
console.log('Done refactoring GamePage.tsx');
