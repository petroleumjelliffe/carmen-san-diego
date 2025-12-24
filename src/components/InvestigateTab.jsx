import { Clock } from 'lucide-react';

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

export function InvestigateTab({
  isFinalCity,
  wrongCity,
  cityClues,
  investigatedLocations,
  timeRemaining,
  collectedClues,
  lastFoundClue,
  onInvestigate,
}) {
  if (!cityClues) return null;

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

      {cityClues.map((clue, i) => (
        <ClueButton
          key={clue.spot.id}
          spot={clue.spot}
          index={i}
          onInvestigate={onInvestigate}
          disabled={timeRemaining < clue.spot.time_cost}
          investigated={investigatedLocations.includes(clue.spot.id)}
        />
      ))}

      {lastFoundClue.city && (
        <div className="mt-6 bg-red-950/50 p-4 rounded-lg border border-yellow-400/30">
          <h3 className="text-yellow-400 font-bold mb-3">Latest Intel:</h3>
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
