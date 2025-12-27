import { Clock, Zap, AlertTriangle } from 'lucide-react';

function ClueButton({ spot, onInvestigate, disabled, investigated, index }) {
  return (
    <button
      onClick={() => onInvestigate(index)}
      disabled={disabled || investigated}
      className={`w-full p-4 text-left rounded-lg transition-all ${
        investigated
          ? 'bg-gray-700 text-gray-400 cursor-not-allowed'
          : disabled
          ? 'bg-gray-800 text-gray-500 cursor-not-allowed'
          : 'bg-red-900 hover:bg-red-800 text-yellow-100 cursor-pointer'
      }`}
    >
      <div className="flex justify-between items-center">
        <span>{investigated ? `✓ ${spot.name}` : spot.name}</span>
        <span className="flex items-center gap-1 text-sm">
          <Clock size={14} />
          {spot.time_cost}h
        </span>
      </div>
    </button>
  );
}

function RogueActionButton({ rogueAction, spot, onRogueAction, disabled, investigated, index, notoriety }) {
  const timeSaved = spot.time_cost - rogueAction.time_saved;
  const effectiveTime = Math.max(1, timeSaved);

  return (
    <button
      onClick={() => onRogueAction(index, rogueAction)}
      disabled={disabled || investigated}
      className={`w-full p-4 text-left rounded-lg transition-all border-2 ${
        investigated
          ? 'bg-gray-700 text-gray-400 cursor-not-allowed border-gray-600'
          : disabled
          ? 'bg-gray-800 text-gray-500 cursor-not-allowed border-gray-700'
          : 'bg-orange-900 hover:bg-orange-800 text-yellow-100 cursor-pointer border-orange-500'
      }`}
    >
      <div className="flex justify-between items-start">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            <Zap size={16} className="text-orange-400" />
            <span className="font-bold">{rogueAction.name}</span>
          </div>
          <p className="text-xs text-yellow-200/70 mb-2">{rogueAction.choice_text}</p>
          <div className="flex items-center gap-2 text-xs">
            <AlertTriangle size={12} className="text-red-400" />
            <span className="text-red-300">+{rogueAction.notoriety_gain} Notoriety</span>
          </div>
        </div>
        <span className="flex items-center gap-1 text-sm ml-3">
          <Clock size={14} />
          {effectiveTime}h
        </span>
      </div>
    </button>
  );
}

export function InvestigateTab({
  isFinalCity,
  wrongCity,
  cityClues,
  investigatedLocations,
  timeRemaining,
  collectedClues,
  lastFoundClue,
  lastRogueAction,
  onInvestigate,
  rogueActions,
  onRogueAction,
  notoriety,
}) {
  if (!cityClues) return null;

  // Helper to find matching rogue action for a spot
  const findRogueAction = (spot) => {
    if (!rogueActions) return null;
    return rogueActions.find(action =>
      action.replaces_spot === spot.type || action.replaces_spot === 'any'
    );
  };

  return (
    <div className="space-y-4">
      <h2 className="text-xl font-bold text-yellow-400 mb-2">
        {isFinalCity && !wrongCity
          ? "FINAL DESTINATION - Issue Warrant to Capture!"
          : wrongCity
          ? "Dead End - Wrong Location"
          : "Gather Intel"}
      </h2>

      {!isFinalCity && !wrongCity && (
        <div className="text-sm text-yellow-200/70 mb-4">
          Suspect clues collected: {collectedClues.suspect.length} / 3
          {collectedClues.suspect.length < 3 && " (check the Local Informant for suspect info)"}
        </div>
      )}

      {wrongCity && (
        <div className="bg-red-800/50 p-4 rounded-lg text-center mb-4">
          <p className="text-yellow-200/70">
            The trail seems cold here... but you can still ask around.
          </p>
        </div>
      )}

      {cityClues.map((clue, i) => {
        const rogueAction = findRogueAction(clue.spot);
        const investigated = investigatedLocations.includes(clue.spot.id);

        return (
          <div key={clue.spot.id} className="space-y-2">
            <ClueButton
              spot={clue.spot}
              index={i}
              onInvestigate={onInvestigate}
              disabled={timeRemaining < clue.spot.time_cost}
              investigated={investigated}
            />
            {rogueAction && onRogueAction && (
              <RogueActionButton
                rogueAction={rogueAction}
                spot={clue.spot}
                index={i}
                onRogueAction={onRogueAction}
                disabled={timeRemaining < Math.max(1, clue.spot.time_cost - rogueAction.time_saved)}
                investigated={investigated}
                notoriety={notoriety}
              />
            )}
          </div>
        );
      })}

      {lastFoundClue.city && (
        <div className="mt-6 bg-red-950/50 p-4 rounded-lg border border-yellow-400/30">
          <h3 className="text-yellow-400 font-bold mb-3">Latest Intel:</h3>

          {lastRogueAction && (
            <div className="bg-orange-900/50 border border-orange-500 p-3 rounded mb-3">
              <div className="flex items-center gap-2 mb-2">
                <Zap size={16} className="text-orange-400" />
                <p className="text-orange-300 font-bold">{lastRogueAction.name}</p>
              </div>
              <p className="text-orange-200 text-sm italic">
                {lastRogueAction.success_text}
              </p>
              <p className="text-red-300 text-xs mt-2">
                <AlertTriangle size={12} className="inline mr-1" />
                Notoriety increased by {lastRogueAction.notoriety_gain}
              </p>
            </div>
          )}

          <p className="text-yellow-100 mb-3">
            {String.fromCodePoint(0x1F4CD)} {lastFoundClue.city}
          </p>
          {lastFoundClue.suspect && (
            <div className="bg-green-900/50 border border-green-500 p-3 rounded mt-2">
              <p className="text-green-400 font-bold">
                {String.fromCodePoint(0x1F50D)} SUSPECT DESCRIPTION FOUND!
              </p>
              <p className="text-green-300 mt-1">
                {lastFoundClue.suspect}
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default InvestigateTab;
