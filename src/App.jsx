import { useMemo } from 'react';
import { loadGameData } from './utils/loadGameData';
import { Game } from './components/Game';

function App() {
  // Load game data once at startup
  const gameData = useMemo(() => loadGameData(), []);

  return <Game gameData={gameData} />;
}

export default App;
