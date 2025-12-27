import { useState, useEffect } from 'react';
import { GameLayout } from './GameLayout';
import { TopPanel } from './TopPanel';

/**
 * Trial - Shows verdict after warrant is issued with dramatic reveal
 */
export function Trial({ currentCase, selectedWarrant, timeRemaining, onContinue }) {
  const [verdictRevealed, setVerdictRevealed] = useState(false);
  const [countdown, setCountdown] = useState(5);

  useEffect(() => {
    if (verdictRevealed) return;

    const timer = setInterval(() => {
      setCountdown(prev => {
        if (prev <= 1) {
          clearInterval(timer);
          setVerdictRevealed(true);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [verdictRevealed]);

  if (!currentCase || !selectedWarrant) return null;

  const isCorrect = selectedWarrant.id === currentCase.suspect.id;

  return (
    <GameLayout
      topPanel={<TopPanel location="Courthouse" timeRemaining={timeRemaining} />}
      bottomPanel={
        verdictRevealed ? (
          <button
            onClick={onContinue}
            className={`w-full font-bold py-3 px-6 rounded text-lg transition-colors ${
              isCorrect
                ? 'bg-green-600 hover:bg-green-700 text-white'
                : 'bg-red-600 hover:bg-red-700 text-white'
            }`}
          >
            CONTINUE
          </button>
        ) : (
          <div className="text-center text-yellow-200/70 py-3">
            Awaiting verdict...
          </div>
        )
      }
    >
      <div className="bg-black bg-opacity-70 rounded-lg p-8 text-white max-w-2xl mx-auto">
        <div className="text-6xl mb-6 text-center">⚖️</div>

        <h1 className="text-3xl font-bold text-yellow-400 mb-6 text-center">
          TRIAL VERDICT
        </h1>

        <div className="mb-6 text-center">
          <p className="text-xl text-gray-300 mb-2">The People vs.</p>
          <p className="text-2xl font-bold">{selectedWarrant.name}</p>
        </div>

        {!verdictRevealed ? (
          /* Suspenseful countdown */
          <div className="text-center py-8">
            <p className="text-2xl text-yellow-100 mb-4 animate-pulse">
              "We find the defendant..."
            </p>
            <div className="text-6xl font-bold text-yellow-400 mb-4">
              {countdown}
            </div>
            <p className="text-gray-400">The jury is deliberating...</p>
          </div>
        ) : isCorrect ? (
          /* Correct Verdict */
          <div className="space-y-4">
            <div className="p-4 bg-green-900 bg-opacity-50 rounded border border-green-400">
              <h2 className="text-xl font-bold text-green-300 mb-3">Evidence Presented:</h2>
              <ul className="space-y-1 text-green-200">
                <li>✓ Matching physical description</li>
                <li>✓ Witnessed at crime scenes</li>
                <li>✓ Recovered stolen goods</li>
              </ul>
            </div>

            <div className="text-center p-6 bg-green-600 bg-opacity-30 rounded-lg border-2 border-green-400">
              <p className="text-3xl font-bold text-green-300 mb-2">GUILTY!</p>
              <p className="text-green-200">The suspect has been convicted!</p>
            </div>
          </div>
        ) : (
          /* Wrong Verdict */
          <div className="space-y-4">
            <div className="p-4 bg-red-900 bg-opacity-50 rounded border border-red-400">
              <h2 className="text-xl font-bold text-red-300 mb-3">Defense Argues:</h2>
              <ul className="space-y-1 text-red-200">
                <li>✗ Alibi confirmed</li>
                <li>✗ Wrong physical description</li>
                <li>✗ No connection to crime</li>
              </ul>
            </div>

            <div className="text-center p-6 bg-red-600 bg-opacity-30 rounded-lg border-2 border-red-400">
              <p className="text-3xl font-bold text-red-300 mb-2">NOT GUILTY!</p>
              <p className="text-red-200 mb-4">The defendant is acquitted.</p>
              <p className="text-yellow-200">
                The real culprit was: <span className="font-bold">{currentCase.suspect.name}</span>
              </p>
            </div>
          </div>
        )}
      </div>
    </GameLayout>
  );
}
