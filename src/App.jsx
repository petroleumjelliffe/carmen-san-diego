import { useMemo } from 'react';
import { loadGameData } from './utils/loadGameData';
import { Game } from './components/Game';
import { PWAUpdatePrompt } from './components/PWAUpdatePrompt';
import { GameMachineProvider } from './hooks/useGameMachine.jsx';
import { StateMachineDebug } from './components/StateMachineDebug.jsx';

function App() {
  // Load game data once at startup
  const gameData = useMemo(() => loadGameData(), []);

  return (
    <GameMachineProvider>
      <Game gameData={gameData} />
      <PWAUpdatePrompt />
      <StateMachineDebug />
    </GameMachineProvider>
  );
}

export default App;
