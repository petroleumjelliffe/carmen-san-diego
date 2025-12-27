import { User, ChevronRight, X } from 'lucide-react';
import { useState, useMemo } from 'react';

export function DossierTab({
  collectedClues,
  suspects,
  selectedWarrant,
  isFinalCity,
  onSelectWarrant,
  onIssueWarrant,
}) {
  // Track manually eliminated suspects
  const [manuallyEliminated, setManuallyEliminated] = useState([]);

  // Parse clues to determine known traits
  const knownTraits = useMemo(() => {
    const traits = { gender: null, hair: null, hobby: null };

    collectedClues.suspect.forEach(clue => {
      const lowerClue = clue.toLowerCase();

      // Gender
      if (lowerClue.includes('male') && !lowerClue.includes('female')) {
        traits.gender = 'male';
      } else if (lowerClue.includes('female')) {
        traits.gender = 'female';
      }

      // Hair
      if (lowerClue.includes('dark')) {
        traits.hair = 'dark';
      } else if (lowerClue.includes('light') || lowerClue.includes('blonde')) {
        traits.hair = 'light';
      }

      // Hobby
      if (lowerClue.includes('intellectual') || lowerClue.includes('chess') || lowerClue.includes('book')) {
        traits.hobby = 'intellectual';
      } else if (lowerClue.includes('athletic') || lowerClue.includes('physical') || lowerClue.includes('fencing') || lowerClue.includes('hunting')) {
        traits.hobby = 'physical';
      }
    });

    return traits;
  }, [collectedClues.suspect]);

  // Auto-eliminate suspects based on clues
  const autoEliminated = useMemo(() => {
    return suspects
      .filter(suspect => {
        if (knownTraits.gender && suspect.gender !== knownTraits.gender) return true;
        if (knownTraits.hair && suspect.hair !== knownTraits.hair) return true;
        if (knownTraits.hobby && suspect.hobby !== knownTraits.hobby) return true;
        return false;
      })
      .map(s => s.id);
  }, [suspects, knownTraits]);

  const toggleManualElimination = (suspectId) => {
    setManuallyEliminated(prev =>
      prev.includes(suspectId)
        ? prev.filter(id => id !== suspectId)
        : [...prev, suspectId]
    );
  };

  const isEliminated = (suspectId) => {
    return autoEliminated.includes(suspectId) || manuallyEliminated.includes(suspectId);
  };

  const remainingCount = suspects.filter(s => !isEliminated(s.id)).length;

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
          <>
            <div className="grid grid-cols-3 gap-2 mb-3 text-sm">
              <div className={`p-2 rounded text-center ${knownTraits.gender ? 'bg-green-900/50 text-green-300' : 'bg-gray-800 text-gray-500'}`}>
                Gender: {knownTraits.gender || '?'}
              </div>
              <div className={`p-2 rounded text-center ${knownTraits.hair ? 'bg-green-900/50 text-green-300' : 'bg-gray-800 text-gray-500'}`}>
                Hair: {knownTraits.hair || '?'}
              </div>
              <div className={`p-2 rounded text-center ${knownTraits.hobby ? 'bg-green-900/50 text-green-300' : 'bg-gray-800 text-gray-500'}`}>
                Hobby: {knownTraits.hobby || '?'}
              </div>
            </div>
            <ul className="space-y-2">
              {collectedClues.suspect.map((clue, i) => (
                <li key={i} className="text-yellow-100 flex items-center gap-2">
                  <ChevronRight size={16} className="text-yellow-400" />
                  {clue}
                </li>
              ))}
            </ul>
          </>
        )}
      </div>

      {/* Conspiracy Board */}
      <div className="bg-red-800/50 p-4 rounded-lg">
        <h3 className="text-yellow-400 font-bold mb-3">Conspiracy Board</h3>
        <p className="text-sm text-yellow-200/70 mb-3">
          Suspects remaining: {remainingCount} / {suspects.length}
          {remainingCount === 1 && " - Ready to issue warrant!"}
        </p>
        <div className="grid grid-cols-2 gap-2 mb-4">
          {suspects.map(suspect => {
            const eliminated = isEliminated(suspect.id);
            const isSelected = selectedWarrant?.id === suspect.id;

            return (
              <div
                key={suspect.id}
                className="relative"
              >
                <button
                  onClick={() => {
                    if (!eliminated) {
                      onSelectWarrant(suspect);
                    }
                  }}
                  onContextMenu={(e) => {
                    e.preventDefault();
                    toggleManualElimination(suspect.id);
                  }}
                  className={`w-full p-3 rounded text-left transition-all relative ${
                    eliminated
                      ? 'bg-gray-800 text-gray-500 opacity-50'
                      : isSelected
                      ? 'bg-yellow-400 text-red-900'
                      : 'bg-red-900 text-yellow-100 hover:bg-red-800'
                  }`}
                >
                  <div className="font-bold">{suspect.name}</div>
                  <div className="text-xs opacity-70">
                    {suspect.gender}, {suspect.hair} hair, {suspect.hobby}
                  </div>

                  {eliminated && (
                    <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                      <X size={48} className="text-red-600 opacity-80" strokeWidth={3} />
                    </div>
                  )}
                </button>

                {!autoEliminated.includes(suspect.id) && !eliminated && (
                  <button
                    onClick={() => toggleManualElimination(suspect.id)}
                    className="absolute top-1 right-1 bg-red-700 hover:bg-red-600 rounded-full p-1 text-white text-xs"
                    title="Eliminate this suspect"
                  >
                    <X size={12} />
                  </button>
                )}
              </div>
            );
          })}
        </div>

        <button
          onClick={onIssueWarrant}
          disabled={!selectedWarrant}
          className="w-full bg-yellow-400 hover:bg-yellow-300 disabled:bg-gray-600 disabled:text-gray-400 text-red-900 font-bold py-3 rounded-lg transition-all"
        >
          {selectedWarrant
            ? `Issue Warrant for ${selectedWarrant.name}`
            : "Select a Suspect"}
        </button>

        {selectedWarrant && (
          <p className="text-center text-sm text-yellow-200/70 mt-2">
            {isFinalCity
              ? "Warrant issued! Investigate to apprehend the suspect."
              : "Warrant ready. Continue tracking to the final destination."}
          </p>
        )}
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
