import { useMemo } from 'react';
import { loadGameData } from './utils/loadGameData';
import { Game } from './components/Game';
import { PWAUpdatePrompt } from './components/PWAUpdatePrompt';

function App() {
  // Load game data once at startup
  const gameData = useMemo(() => loadGameData(), []);

  return (
    <>
      <Game gameData={gameData} />
      <PWAUpdatePrompt />
    </>
  );
}

export default App;
