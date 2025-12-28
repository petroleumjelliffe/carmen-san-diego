import { useState, useEffect } from 'react';
import { GameLayout } from './GameLayout';
import { TopPanel } from './TopPanel';
import { Scale, Gavel, CheckCircle, XCircle } from 'lucide-react';

// Wooden panel styling for courtroom feel
function WoodPanel({ children, className = '' }) {
  return (
    <div
      className={`rounded-lg shadow-xl ${className}`}
      style={{
        background: 'linear-gradient(180deg, #5c4033 0%, #4a3728 50%, #3d2d1f 100%)',
        boxShadow: 'inset 0 2px 4px rgba(255,255,255,0.1), inset 0 -2px 4px rgba(0,0,0,0.3), 0 8px 16px rgba(0,0,0,0.4)',
      }}
    >
      {children}
    </div>
  );
}

// Verdict stamp that appears dramatically
function VerdictStamp({ isGuilty }) {
  return (
    <div
      className={`inline-block px-8 py-4 border-4 rounded transform -rotate-6 ${
        isGuilty
          ? 'border-green-500 text-green-400'
          : 'border-red-500 text-red-400'
      }`}
      style={{
        fontFamily: 'Impact, sans-serif',
        textShadow: '2px 2px 4px rgba(0,0,0,0.5)',
      }}
    >
      <div className="text-4xl font-bold tracking-wider">
        {isGuilty ? 'GUILTY' : 'NOT GUILTY'}
      </div>
    </div>
  );
}

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
            className={`w-full font-bold py-4 px-6 rounded-lg text-lg transition-all shadow-lg hover:shadow-xl active:scale-[0.98] ${
              isCorrect
                ? 'bg-green-600 hover:bg-green-500 text-white'
                : 'bg-red-600 hover:bg-red-500 text-white'
            }`}
          >
            CONTINUE TO DEBRIEF
          </button>
        ) : (
          <div className="text-center text-yellow-200/70 py-4 italic">
            The jury is deliberating...
          </div>
        )
      }
    >
      <div className="max-w-2xl mx-auto">
        {/* Judge's Bench Header */}
        <WoodPanel className="p-6 mb-4">
          <div className="flex items-center justify-center gap-4 mb-4">
            <Scale size={32} className="text-yellow-500" />
            <h1 className="text-2xl font-bold text-yellow-100" style={{ fontFamily: 'Georgia, serif' }}>
              DISTRICT COURT
            </h1>
            <Scale size={32} className="text-yellow-500" />
          </div>

          <div className="text-center border-t border-amber-700 pt-4">
            <p className="text-amber-300 text-sm mb-1">CASE NO. {currentCase.stolenItem?.name?.length || 42}-CR-{new Date().getFullYear()}</p>
            <p className="text-xl text-amber-100">The People vs. <span className="font-bold">{selectedWarrant.name}</span></p>
          </div>
        </WoodPanel>

        {/* Main Court Area */}
        <div
          className="rounded-lg p-6 text-white"
          style={{
            background: 'linear-gradient(180deg, #1a1a2e 0%, #16213e 100%)',
            boxShadow: 'inset 0 0 30px rgba(0,0,0,0.5)',
          }}
        >
          {!verdictRevealed ? (
            /* Suspenseful countdown */
            <div className="text-center py-8">
              <Gavel size={48} className="text-yellow-400 mx-auto mb-4 animate-bounce" />
              <p className="text-2xl text-amber-100 mb-6 italic" style={{ fontFamily: 'Georgia, serif' }}>
                "We, the jury, find the defendant..."
              </p>
              <div
                className="text-7xl font-bold text-yellow-400 mb-4"
                style={{
                  fontFamily: 'Georgia, serif',
                  textShadow: '0 0 20px rgba(234, 179, 8, 0.5)'
                }}
              >
                {countdown}
              </div>
              <div className="flex justify-center gap-2 text-gray-400">
                <span className="inline-block w-2 h-2 bg-yellow-400 rounded-full animate-pulse" />
                <span className="inline-block w-2 h-2 bg-yellow-400 rounded-full animate-pulse" style={{ animationDelay: '0.2s' }} />
                <span className="inline-block w-2 h-2 bg-yellow-400 rounded-full animate-pulse" style={{ animationDelay: '0.4s' }} />
              </div>
            </div>
          ) : isCorrect ? (
            /* Correct Verdict */
            <div className="space-y-6">
              <div className="text-center py-4">
                <VerdictStamp isGuilty={true} />
              </div>

              <div className="p-4 bg-green-900/40 rounded-lg border border-green-600">
                <div className="flex items-center gap-2 mb-3 text-green-300">
                  <CheckCircle size={20} />
                  <h2 className="font-bold">Evidence Presented</h2>
                </div>
                <ul className="space-y-2 text-green-200 text-sm">
                  <li className="flex items-center gap-2">
                    <span className="text-green-400">✓</span> Matching physical description confirmed
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="text-green-400">✓</span> Witnessed fleeing crime scenes
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="text-green-400">✓</span> Stolen goods recovered in possession
                  </li>
                </ul>
              </div>

              <div className="text-center p-4 bg-green-600/20 rounded-lg border-2 border-green-500">
                <p className="text-green-200">
                  The defendant has been <span className="font-bold text-green-300">convicted</span> and
                  sentenced to 25 years in federal prison.
                </p>
              </div>
            </div>
          ) : (
            /* Wrong Verdict */
            <div className="space-y-6">
              <div className="text-center py-4">
                <VerdictStamp isGuilty={false} />
              </div>

              <div className="p-4 bg-red-900/40 rounded-lg border border-red-600">
                <div className="flex items-center gap-2 mb-3 text-red-300">
                  <XCircle size={20} />
                  <h2 className="font-bold">Defense Arguments</h2>
                </div>
                <ul className="space-y-2 text-red-200 text-sm">
                  <li className="flex items-center gap-2">
                    <span className="text-red-400">✗</span> Alibi confirmed by multiple witnesses
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="text-red-400">✗</span> Physical description does not match
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="text-red-400">✗</span> No connection to the crime established
                  </li>
                </ul>
              </div>

              <div className="text-center p-4 bg-red-600/20 rounded-lg border-2 border-red-500">
                <p className="text-red-200 mb-3">
                  The defendant has been <span className="font-bold text-red-300">acquitted</span>.
                  Case dismissed with prejudice.
                </p>
                <div className="border-t border-red-500/50 pt-3 mt-3">
                  <p className="text-yellow-300 text-sm">
                    Intelligence reports the real culprit was:
                    <span className="font-bold ml-1">{currentCase.suspect.name}</span>
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </GameLayout>
  );
}
