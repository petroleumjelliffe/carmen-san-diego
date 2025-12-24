import { Award } from 'lucide-react';
import { getRank } from '../utils/helpers';

export function Menu({ solvedCases, ranks, onStartNewCase }) {
  const rank = getRank(ranks, solvedCases);

  return (
    <div className="min-h-screen bg-gradient-to-b from-red-900 to-red-950 flex items-center justify-center p-4">
      <div className="text-center">
        <div className="mb-8">
          <h1 className="text-6xl font-bold text-yellow-400 mb-2" style={{ fontFamily: 'serif' }}>
            WHERE IN THE WORLD IS
          </h1>
          <h2 className="text-4xl font-bold text-yellow-200" style={{ fontFamily: 'serif' }}>
            THE SHADOW SYNDICATE?
          </h2>
        </div>

        <div className="bg-red-800/50 rounded-lg p-6 mb-8 inline-block">
          <div className="flex items-center gap-3 text-yellow-100 mb-2">
            <Award size={24} />
            <span className="text-xl">Rank: {rank.label}</span>
          </div>
          <div className="text-yellow-200/70">Cases Solved: {solvedCases}</div>
        </div>

        <div>
          <button
            onClick={onStartNewCase}
            className="bg-yellow-400 hover:bg-yellow-300 text-red-900 font-bold text-2xl px-12 py-4 rounded-lg transition-all transform hover:scale-105 shadow-lg"
          >
            NEW CASE
          </button>
        </div>
      </div>
    </div>
  );
}

export default Menu;
