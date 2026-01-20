/**
 * EncounterDialog - Displays encounters (henchman, assassination, good deed, etc.)
 *
 * Only renders when state.matches('playing.investigate.encountering')
 * Handles different encounter types and user choices
 */
import { useGameMachine } from '../hooks/useGameMachine.jsx';

function EncounterDialog() {
  const {
    context,
    state,
    chooseGadget,
    chooseEndure,
    helpNpc,
    ignoreNpc,
    resolveEncounter,
  } = useGameMachine();

  const { encounterType, encounterMessage, encounterChoice, availableGadgets } = context;

  const isChoosingAction = state.matches('playing.investigate.encountering.choosingAction');
  const isChoosingGoodDeed = state.matches('playing.investigate.encountering.choosingGoodDeed');
  const isResolving = state.matches('playing.investigate.encountering.resolving');

  const handleGadgetChoice = (gadgetId) => {
    chooseGadget(gadgetId);
  };

  const handleEndure = () => {
    chooseEndure();
  };

  const handleHelp = () => {
    helpNpc();
  };

  const handleIgnore = () => {
    ignoreNpc();
  };

  const handleResolve = () => {
    resolveEncounter();
  };

  // Get encounter title
  const getTitle = () => {
    switch (encounterType) {
      case 'henchman':
        return '⚔️ Henchman Encounter!';
      case 'assassination':
        return '🎯 Assassination Attempt!';
      case 'goodDeed':
        return '💝 Someone Needs Help';
      case 'apprehension':
        return '🚓 Apprehension!';
      case 'timeOut':
        return '⏰ Time Expired!';
      case 'rogueAction':
        return '🎭 Rogue Action';
      default:
        return '📋 Encounter';
    }
  };

  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
      <div className="bg-gray-900 border border-gray-700 rounded-lg p-6 max-w-2xl w-full">
        <h2 className="text-2xl font-bold text-red-400 mb-4">{getTitle()}</h2>

        <div className="bg-gray-800 p-4 rounded mb-6">
          <p className="text-gray-100 text-lg">
            {encounterMessage || 'An encounter has occurred!'}
          </p>
        </div>

        {/* Choosing gadget or endure */}
        {isChoosingAction && (
          <div className="space-y-3">
            <p className="text-gray-300 mb-3">Choose how to respond:</p>

            {/* Show available gadgets */}
            {availableGadgets && availableGadgets.length > 0 && (
              <div className="space-y-2">
                <p className="text-sm text-gray-400">Use a gadget:</p>
                {availableGadgets.map((gadget) => (
                  <button
                    key={gadget.id}
                    onClick={() => handleGadgetChoice(gadget.id)}
                    className="w-full px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-500 transition-colors text-left"
                  >
                    {gadget.icon} {gadget.name}
                  </button>
                ))}
              </div>
            )}

            {/* Endure option */}
            <button
              onClick={handleEndure}
              className="w-full px-4 py-2 bg-red-700 text-white rounded hover:bg-red-600 transition-colors"
            >
              Endure (-3 hours, injury possible)
            </button>
          </div>
        )}

        {/* Choosing good deed response */}
        {isChoosingGoodDeed && (
          <div className="space-y-3">
            <p className="text-gray-300 mb-3">How do you respond?</p>
            <button
              onClick={handleHelp}
              className="w-full px-4 py-2 bg-green-600 text-white rounded hover:bg-green-500 transition-colors"
            >
              💚 Help Them (+Karma)
            </button>
            <button
              onClick={handleIgnore}
              className="w-full px-4 py-2 bg-gray-700 text-gray-300 rounded hover:bg-gray-600 transition-colors"
            >
              Ignore and Continue
            </button>
          </div>
        )}

        {/* Resolving - show outcome and continue button */}
        {isResolving && (
          <div className="space-y-3">
            {encounterChoice && (
              <div className="bg-gray-800 p-3 rounded mb-3">
                <p className="text-gray-300">
                  <strong>Your choice:</strong> {encounterChoice}
                </p>
              </div>
            )}

            <button
              onClick={handleResolve}
              className="w-full px-6 py-2 bg-amber-500 text-gray-900 rounded font-semibold hover:bg-amber-400 transition-colors"
            >
              Continue
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

export default EncounterDialog;
