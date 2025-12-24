import { User, ChevronRight } from 'lucide-react';

export function DossierTab({
  collectedClues,
  suspects,
  selectedWarrant,
  isFinalCity,
  onSelectWarrant,
  onIssueWarrant,
}) {
  return (
    <div className="space-y-6">
      {/* Suspect Clues */}
      <div className="bg-red-800/50 p-4 rounded-lg">
        <h3 className="text-yellow-400 font-bold mb-3 flex items-center gap-2">
          <User size={20} />
          Suspect Description
        </h3>
        {collectedClues.suspect.length === 0 ? (
          <p className="text-yellow-200/50 italic">No suspect information gathered yet</p>
        ) : (
          <ul className="space-y-2">
            {collectedClues.suspect.map((clue, i) => (
              <li key={i} className="text-yellow-100 flex items-center gap-2">
                <ChevronRight size={16} className="text-yellow-400" />
                {clue}
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* Warrant Section */}
      <div className="bg-red-800/50 p-4 rounded-lg">
        <h3 className="text-yellow-400 font-bold mb-3">Issue Warrant</h3>
        <div className="grid grid-cols-2 gap-2 mb-4">
          {suspects.map(suspect => (
            <button
              key={suspect.id}
              onClick={() => onSelectWarrant(suspect)}
              className={`p-3 rounded text-left transition-all ${
                selectedWarrant?.id === suspect.id
                  ? 'bg-yellow-400 text-red-900'
                  : 'bg-red-900 text-yellow-100 hover:bg-red-800'
              }`}
            >
              <div className="font-bold">{suspect.name}</div>
              <div className="text-xs opacity-70">
                {suspect.gender}, {suspect.hair} hair, {suspect.hobby}
              </div>
            </button>
          ))}
        </div>

        <button
          onClick={onIssueWarrant}
          disabled={!selectedWarrant || !isFinalCity}
          className="w-full bg-yellow-400 hover:bg-yellow-300 disabled:bg-gray-600 disabled:text-gray-400 text-red-900 font-bold py-3 rounded-lg transition-all"
        >
          {!isFinalCity
            ? "Must reach final destination first"
            : selectedWarrant
            ? `Issue Warrant for ${selectedWarrant.name}`
            : "Select a Suspect"}
        </button>
      </div>

      {/* Investigation Log */}
      <div className="bg-red-800/50 p-4 rounded-lg">
        <h3 className="text-yellow-400 font-bold mb-3">Investigation Log</h3>
        {collectedClues.city.length === 0 ? (
          <p className="text-yellow-200/50 italic">No investigation notes yet</p>
        ) : (
          <ul className="space-y-2 max-h-48 overflow-y-auto">
            {collectedClues.city.map((clue, i) => (
              <li key={i} className="text-yellow-100 text-sm border-b border-red-700/50 pb-2">
                {clue}
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

export default DossierTab;
