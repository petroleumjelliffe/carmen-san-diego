/**
 * ClueDialog - Displays witness clue after investigation
 *
 * Only renders when state.matches('playing.witnessClue')
 * Shows the clue found and provides button to continue
 */
import { useGameMachine } from '../hooks/useGameMachine.jsx';
import { useState, useEffect } from 'react';

function ClueDialog() {
  const { context, continueFromClue } = useGameMachine();
  const [displayedText, setDisplayedText] = useState('');
  const [isComplete, setIsComplete] = useState(false);

  // Get clue text from context
  const clueText = context.lastFoundClue?.city || context.lastFoundClue?.suspect || 'The witness had nothing useful to say.';

  // Stream text word by word
  useEffect(() => {
    setDisplayedText('');
    setIsComplete(false);

    const words = clueText.split(' ');
    let currentIndex = 0;
    let timeoutId;

    function streamNextWord() {
      if (currentIndex < words.length) {
        setDisplayedText(prev => prev + (currentIndex > 0 ? ' ' : '') + words[currentIndex]);
        currentIndex++;
        timeoutId = setTimeout(streamNextWord, 150); // ~7 words per second
      } else {
        setIsComplete(true);
      }
    }

    streamNextWord();

    return () => clearTimeout(timeoutId);
  }, [clueText]);

  const handleContinue = () => {
    continueFromClue();
  };

  const handleSkip = () => {
    setDisplayedText(clueText);
    setIsComplete(true);
  };

  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
      <div className="bg-gray-900 border border-gray-700 rounded-lg p-6 max-w-2xl w-full">
        <h2 className="text-2xl font-bold text-amber-400 mb-4">🔍 Witness Statement</h2>

        <div className="bg-gray-800 p-4 rounded mb-6 min-h-[100px]">
          <p className="text-gray-100 text-lg italic">
            "{displayedText}"
          </p>
        </div>

        <div className="flex gap-3 justify-end">
          {!isComplete && (
            <button
              onClick={handleSkip}
              className="px-4 py-2 bg-gray-700 text-gray-300 rounded hover:bg-gray-600 transition-colors"
            >
              Skip
            </button>
          )}
          <button
            onClick={handleContinue}
            disabled={!isComplete}
            className={`px-6 py-2 rounded font-semibold transition-colors ${
              isComplete
                ? 'bg-amber-500 text-gray-900 hover:bg-amber-400'
                : 'bg-gray-700 text-gray-500 cursor-not-allowed'
            }`}
          >
            Continue
          </button>
        </div>
      </div>
    </div>
  );
}

export default ClueDialog;
