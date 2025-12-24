import { Award } from 'lucide-react';
import { getRank } from '../utils/helpers';

export function GameOver({ gameState, message, solvedCases, ranks, onStartNewCase, onReturnToMenu }) {
  const rank = getRank(ranks, solvedCases);
  const isWon = gameState === 'won';

  return (
    <div className="min-h-screen bg-gradient-to-b from-red-900 to-red-950 flex items-center justify-center p-4">
      <div className="text-center">
        <div className={`text-6xl mb-4 ${isWon ? 'text-yellow-400' : 'text-red-400'}`}>
          {isWon ? String.fromCodePoint(0x1F389) : String.fromCodePoint(0x1F480)}
        </div>
        <h1 className={`text-4xl font-bold mb-4 ${isWon ? 'text-yellow-400' : 'text-red-400'}`}>
          {isWon ? 'CASE CLOSED!' : 'CASE FAILED'}
        </h1>
        <p className="text-xl text-yellow-100 mb-8">{message}</p>

        <div className="bg-red-800/50 rounded-lg p-6 mb-8 inline-block">
          <div className="flex items-center gap-3 text-yellow-100 mb-2">
            <Award size={24} />
            <span className="text-xl">Rank: {rank.label}</span>
          </div>
          <div className="text-yellow-200/70">Cases Solved: {solvedCases}</div>
        </div>

        <div className="space-x-4">
          <button
            onClick={onStartNewCase}
            className="bg-yellow-400 hover:bg-yellow-300 text-red-900 font-bold text-xl px-8 py-3 rounded-lg transition-all"
          >
            NEW CASE
          </button>
          <button
            onClick={onReturnToMenu}
            className="bg-red-700 hover:bg-red-600 text-yellow-100 font-bold text-xl px-8 py-3 rounded-lg transition-all"
          >
            MAIN MENU
          </button>
        </div>
      </div>
    </div>
  );
}

export default GameOver;
