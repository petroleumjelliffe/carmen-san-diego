import { User, ChevronRight, X, MapPin } from 'lucide-react';
import { useState, useMemo } from 'react';

// Pushpin decoration component
function Pushpin({ color = 'red' }) {
  const colors = {
    red: 'bg-red-500',
    yellow: 'bg-yellow-400',
    blue: 'bg-blue-500',
    green: 'bg-green-500',
  };
  return (
    <div className={`absolute -top-2 left-1/2 -translate-x-1/2 w-4 h-4 ${colors[color]} rounded-full shadow-lg border-2 border-white/50 z-10`}>
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-1.5 h-1.5 bg-white/30 rounded-full" />
    </div>
  );
}

// Polaroid-style suspect card
function SuspectCard({ suspect, eliminated, isSelected, autoEliminated, onSelect, onEliminate, rotation }) {
  return (
    <div
      className="relative"
      style={{ transform: `rotate(${rotation}deg)` }}
    >
      {/* Pushpin */}
      <Pushpin color={isSelected ? 'yellow' : eliminated ? 'blue' : 'red'} />

      <button
        onClick={() => !eliminated && onSelect(suspect)}
        onContextMenu={(e) => {
          e.preventDefault();
          onEliminate(suspect.id);
        }}
        className={`w-full bg-amber-50 p-2 pt-3 shadow-lg transition-all min-h-[100px] ${
          eliminated ? 'opacity-40 grayscale' : 'hover:scale-105 hover:shadow-xl'
        } ${isSelected ? 'ring-4 ring-yellow-400' : ''}`}
        style={{
          boxShadow: eliminated ? 'none' : '3px 3px 10px rgba(0,0,0,0.3)',
        }}
      >
        {/* Photo area */}
        <div className={`aspect-square mb-2 flex items-center justify-center text-4xl ${
          eliminated ? 'bg-gray-300' : 'bg-gradient-to-br from-gray-700 to-gray-900'
        }`}>
          {suspect.gender === 'female' ? '👩' : '👨'}
        </div>

        {/* Name caption */}
        <div className="text-center">
          <div className="font-bold text-gray-800 text-sm truncate">{suspect.name}</div>
          <div className="text-xs text-gray-600">
            {suspect.hair} • {suspect.hobby}
          </div>
        </div>

        {/* Red X overlay for eliminated */}
        {eliminated && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <X size={64} className="text-red-600" strokeWidth={4} />
          </div>
        )}
      </button>

      {/* Manual eliminate button */}
      {!autoEliminated && !eliminated && (
        <button
          onClick={() => onEliminate(suspect.id)}
          className="absolute -top-1 -right-1 bg-red-600 hover:bg-red-500 rounded-full p-1 text-white shadow-lg z-20"
          title="Eliminate suspect"
        >
          <X size={12} />
        </button>
      )}
    </div>
  );
}

// Note card with pushpin
function NoteCard({ children, color = 'yellow', rotation = 0 }) {
  const bgColors = {
    yellow: 'bg-yellow-100',
    blue: 'bg-blue-100',
    pink: 'bg-pink-100',
    green: 'bg-green-100',
  };
  return (
    <div
      className={`relative ${bgColors[color]} p-3 shadow-md`}
      style={{ transform: `rotate(${rotation}deg)` }}
    >
      <Pushpin color="red" />
      <div className="text-gray-800 text-sm pt-2">{children}</div>
    </div>
  );
}

export function DossierTab({
  collectedClues,
  suspects,
  selectedWarrant,
  isFinalCity,
  onSelectWarrant,
  onIssueWarrant,
}) {
  const [manuallyEliminated, setManuallyEliminated] = useState([]);

  // Stable rotations for each suspect based on their id
  const rotations = useMemo(() => {
    return suspects.reduce((acc, s, i) => {
      acc[s.id] = (i % 2 === 0 ? 1 : -1) * (2 + (i % 3));
      return acc;
    }, {});
  }, [suspects]);

  const knownTraits = useMemo(() => {
    const traits = { gender: null, hair: null, hobby: null };

    collectedClues.suspect.forEach(clue => {
      const lowerClue = clue.toLowerCase();

      if (lowerClue.includes('male') && !lowerClue.includes('female')) {
        traits.gender = 'male';
      } else if (lowerClue.includes('female')) {
        traits.gender = 'female';
      }

      if (lowerClue.includes('dark')) {
        traits.hair = 'dark';
      } else if (lowerClue.includes('light') || lowerClue.includes('blonde')) {
        traits.hair = 'light';
      }

      if (lowerClue.includes('intellectual') || lowerClue.includes('chess') || lowerClue.includes('book')) {
        traits.hobby = 'intellectual';
      } else if (lowerClue.includes('athletic') || lowerClue.includes('physical') || lowerClue.includes('fencing') || lowerClue.includes('hunting')) {
        traits.hobby = 'physical';
      }
    });

    return traits;
  }, [collectedClues.suspect]);

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
    <div
      className="space-y-6 p-4 rounded-lg min-h-[500px]"
      style={{
        background: 'linear-gradient(135deg, #b8956c 0%, #a0845c 50%, #c4a574 100%)',
        backgroundImage: `
          linear-gradient(135deg, #b8956c 0%, #a0845c 50%, #c4a574 100%),
          url("data:image/svg+xml,%3Csvg viewBox='0 0 100 100' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.8' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E")
        `,
        boxShadow: 'inset 0 0 50px rgba(0,0,0,0.3)',
      }}
    >
      {/* Cork board header */}
      <div className="text-center mb-4">
        <h2 className="text-2xl font-bold text-amber-900 drop-shadow-sm" style={{ fontFamily: 'serif' }}>
          EVIDENCE BOARD
        </h2>
        <p className="text-amber-800 text-sm">
          Suspects: {remainingCount} / {suspects.length} remaining
        </p>
      </div>

      {/* Suspect Profile Note */}
      <div className="relative">
        <NoteCard color="yellow" rotation={-1}>
          <div className="flex items-center gap-2 mb-2 border-b border-amber-300 pb-1">
            <User size={16} className="text-amber-700" />
            <span className="font-bold text-amber-900">Suspect Profile</span>
          </div>
          {collectedClues.suspect.length === 0 ? (
            <p className="text-gray-500 italic text-xs">No intel gathered...</p>
          ) : (
            <>
              <div className="grid grid-cols-3 gap-1 mb-2 text-xs">
                <div className={`p-1 rounded text-center ${knownTraits.gender ? 'bg-green-200 text-green-800' : 'bg-gray-200 text-gray-500'}`}>
                  {knownTraits.gender || '?'}
                </div>
                <div className={`p-1 rounded text-center ${knownTraits.hair ? 'bg-green-200 text-green-800' : 'bg-gray-200 text-gray-500'}`}>
                  {knownTraits.hair || '?'} hair
                </div>
                <div className={`p-1 rounded text-center ${knownTraits.hobby ? 'bg-green-200 text-green-800' : 'bg-gray-200 text-gray-500'}`}>
                  {knownTraits.hobby || '?'}
                </div>
              </div>
              <ul className="space-y-1 text-xs">
                {collectedClues.suspect.map((clue, i) => (
                  <li key={i} className="flex items-start gap-1">
                    <ChevronRight size={12} className="text-amber-600 mt-0.5 flex-shrink-0" />
                    <span>{clue}</span>
                  </li>
                ))}
              </ul>
            </>
          )}
        </NoteCard>
      </div>

      {/* Suspect Photos Grid */}
      <div className="grid grid-cols-3 sm:grid-cols-4 gap-4 py-4">
        {suspects.map(suspect => {
          const eliminated = isEliminated(suspect.id);
          const isSelected = selectedWarrant?.id === suspect.id;

          return (
            <SuspectCard
              key={suspect.id}
              suspect={suspect}
              eliminated={eliminated}
              isSelected={isSelected}
              autoEliminated={autoEliminated.includes(suspect.id)}
              onSelect={onSelectWarrant}
              onEliminate={toggleManualElimination}
              rotation={rotations[suspect.id]}
            />
          );
        })}
      </div>

      {/* Warrant Button */}
      <div className="relative">
        <NoteCard color="pink" rotation={1}>
          <button
            onClick={onIssueWarrant}
            disabled={!selectedWarrant}
            className={`w-full font-bold py-3 rounded transition-all text-sm ${
              selectedWarrant
                ? 'bg-red-600 hover:bg-red-500 text-white shadow-md'
                : 'bg-gray-300 text-gray-500 cursor-not-allowed'
            }`}
          >
            {selectedWarrant
              ? `🚨 ISSUE WARRANT: ${selectedWarrant.name}`
              : "Select a Suspect Above"}
          </button>
          {selectedWarrant && (
            <p className="text-center text-xs text-gray-600 mt-2">
              {isFinalCity
                ? "Ready to apprehend!"
                : "Continue tracking..."}
            </p>
          )}
        </NoteCard>
      </div>

      {/* Investigation Notes */}
      {collectedClues.city.length > 0 && (
        <div className="relative">
          <NoteCard color="blue" rotation={-2}>
            <div className="flex items-center gap-2 mb-2 border-b border-blue-300 pb-1">
              <MapPin size={16} className="text-blue-700" />
              <span className="font-bold text-blue-900">Location Intel</span>
            </div>
            <ul className="space-y-1 max-h-32 overflow-y-auto text-xs">
              {collectedClues.city.map((clue, i) => (
                <li key={i} className="border-b border-blue-200 pb-1 last:border-0">
                  {clue}
                </li>
              ))}
            </ul>
          </NoteCard>
        </div>
      )}
    </div>
  );
}

export default DossierTab;
