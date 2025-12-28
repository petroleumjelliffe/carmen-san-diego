import { User, X, MapPin, Clock } from 'lucide-react';
import { useMemo } from 'react';

// Pushpin decoration component
function Pushpin() {
  return (
    <div className="absolute -top-2 left-1/2 -translate-x-1/2 w-4 h-4 bg-red-500 rounded-full shadow-lg border-2 border-white/50 z-10">
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-1.5 h-1.5 bg-white/30 rounded-full" />
    </div>
  );
}

// Get emoji based on gender and hair color
function getSuspectEmoji(gender, hair) {
  if (gender === 'female') {
    return hair === 'light' ? '👱‍♀️' : '👩🏽';
  }
  return hair === 'light' ? '👱‍♂️' : '👨🏽';
}

// Get hobby indicator emoji
function getHobbyEmoji(hobby) {
  return hobby === 'intellectual' ? '📚' : '🏋️';
}

// Format time for display (e.g., 14 -> "2:00 PM")
function formatTime(hour) {
  if (hour === undefined || hour === null) return '';
  const h = hour % 12 || 12;
  const ampm = hour >= 12 ? 'PM' : 'AM';
  return `${h}:00 ${ampm}`;
}

// Trait cycling button - tap to cycle through values
function TraitField({ label, value, onCycle }) {
  const displayValue = value || '—';
  const hasValue = value !== null;

  return (
    <button
      onClick={onCycle}
      className={`flex items-center justify-between w-full py-2 px-3 rounded transition-all active:scale-[0.98] ${
        hasValue
          ? 'bg-green-200/80 hover:bg-green-300/80'
          : 'bg-amber-100/80 hover:bg-amber-200/80'
      }`}
    >
      <span className="text-amber-900 font-medium text-sm">{label}:</span>
      <span className={`font-bold text-sm ${hasValue ? 'text-green-800' : 'text-gray-500'}`}>
        {displayValue}
      </span>
    </button>
  );
}

// Quote-style clue display with source attribution
function ClueQuote({ clue }) {
  // Handle both old string format and new object format
  const text = typeof clue === 'string' ? clue : clue.text;
  const cityName = typeof clue === 'object' ? clue.cityName : null;
  const locationName = typeof clue === 'object' ? clue.locationName : null;
  const timeCollected = typeof clue === 'object' ? clue.timeCollected : null;

  const hasAttribution = cityName || locationName || timeCollected !== null;

  return (
    <div className="bg-white/60 rounded p-2 shadow-sm border-l-2 border-amber-400">
      <p className="text-gray-800 text-sm italic">"{text}"</p>
      {hasAttribution && (
        <p className="text-right text-xs text-gray-500 mt-1">
          — {cityName}{locationName ? `, ${locationName}` : ''}
          {timeCollected !== null && (
            <span className="ml-2 inline-flex items-center gap-0.5">
              <Clock size={10} />
              {formatTime(timeCollected)}
            </span>
          )}
        </p>
      )}
    </div>
  );
}

// Polaroid-style suspect card
function SuspectCard({ suspect, eliminated, isSelected, onSelect, rotation, gridIndex, totalColumns = 4 }) {
  // Selected cards animate up to center above the grid
  // Calculate horizontal offset to center the card
  const col = gridIndex % totalColumns;
  const centerCol = (totalColumns - 1) / 2;
  const horizontalOffset = (centerCol - col) * 80; // Move toward center
  const row = Math.floor(gridIndex / totalColumns);
  const verticalOffset = -(row * 100 + 120); // Move above grid

  const selectedTransform = isSelected
    ? `translateX(${horizontalOffset}px) translateY(${verticalOffset}px) scale(1.1) rotate(-3deg)`
    : '';
  const baseTransform = `rotate(${rotation}deg)`;

  return (
    <div
      className={`relative transition-all duration-500 ease-out ${isSelected ? 'z-20' : ''}`}
      style={{ transform: isSelected ? selectedTransform : baseTransform }}
    >
      {/* Pushpin */}
      <Pushpin />

      <button
        onClick={() => !eliminated && onSelect(suspect)}
        disabled={eliminated}
        className={`w-full bg-amber-50 p-2 pt-3 shadow-lg transition-all min-h-[100px] ${
          eliminated ? 'opacity-50 grayscale cursor-not-allowed' : 'hover:scale-105 hover:shadow-xl'
        } ${isSelected ? 'ring-4 ring-yellow-400 scale-105' : ''}`}
        style={{
          boxShadow: eliminated ? '1px 1px 4px rgba(0,0,0,0.2)' : '3px 3px 10px rgba(0,0,0,0.3)',
        }}
      >
        {/* Photo area */}
        <div className={`aspect-square mb-2 flex flex-col items-center justify-center ${
          eliminated ? 'bg-gray-300' : 'bg-gradient-to-br from-gray-700 to-gray-900'
        }`}>
          <span className="text-3xl">{getSuspectEmoji(suspect.gender, suspect.hair)}</span>
          <span className="text-lg -mt-1">{getHobbyEmoji(suspect.hobby)}</span>
        </div>

        {/* Name caption */}
        <div className="text-center">
          <div className="font-bold text-gray-800 text-sm truncate">{suspect.name}</div>
        </div>
      </button>
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
  selectedTraits,
  onCycleTrait,
  onResetTraits,
}) {

  // Stable rotations for each suspect based on their id
  const rotations = useMemo(() => {
    return suspects.reduce((acc, s, i) => {
      acc[s.id] = (i % 2 === 0 ? 1 : -1) * (2 + (i % 3));
      return acc;
    }, {});
  }, [suspects]);

  // Auto-eliminate based on player-selected traits
  const autoEliminated = useMemo(() => {
    return suspects
      .filter(suspect => {
        if (selectedTraits.gender && suspect.gender !== selectedTraits.gender) return true;
        if (selectedTraits.hair && suspect.hair !== selectedTraits.hair) return true;
        if (selectedTraits.hobby && suspect.hobby !== selectedTraits.hobby) return true;
        return false;
      })
      .map(s => s.id);
  }, [suspects, selectedTraits]);

  const isEliminated = (suspectId) => {
    return autoEliminated.includes(suspectId);
  };

  const remainingCount = suspects.filter(s => !isEliminated(s.id)).length;

  // Check if any traits are set
  const hasAnyTraits = selectedTraits.gender || selectedTraits.hair || selectedTraits.hobby;

  return (
    <div
      className="space-y-4 p-4 rounded-lg"
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
      </div>

      {/* Suspect Profile - Interactive Trait Selector */}
      <div className="relative">
        <NoteCard color="yellow" rotation={-1}>
          <div className="flex items-center gap-2 mb-3 border-b border-amber-300 pb-1">
            <User size={16} className="text-amber-700" />
            <span className="font-bold text-amber-900">Suspect Profile</span>
          </div>

          {/* Collected Clues as Quotes - Above form so photos stay close to controls */}
          {collectedClues.suspect.length > 0 && (
            <div className="mb-4 space-y-2">
              <p className="text-xs font-medium text-amber-800 mb-2">Intel gathered:</p>
              {collectedClues.suspect.map((clue, i) => (
                <ClueQuote key={i} clue={clue} />
              ))}
            </div>
          )}

          {collectedClues.suspect.length === 0 && (
            <p className="text-gray-500 italic text-xs text-center mb-4">No intel gathered yet...</p>
          )}

          {/* Trait Selector - Vertical Form */}
          <div className="space-y-2 border-t border-amber-300 pt-3">
            <TraitField
              label="Gender"
              value={selectedTraits.gender}
              onCycle={() => onCycleTrait('gender')}
            />
            <TraitField
              label="Hair"
              value={selectedTraits.hair}
              onCycle={() => onCycleTrait('hair')}
            />
            <TraitField
              label="Hobby"
              value={selectedTraits.hobby}
              onCycle={() => onCycleTrait('hobby')}
            />
          </div>

          <p className="text-xs text-amber-700 text-center italic mt-2">
            Tap fields to cycle values
          </p>
        </NoteCard>
      </div>

      {/* Suspect Photos Grid */}
      <div className="relative">
        <NoteCard color="green" rotation={1}>
          <div className="flex items-center justify-between mb-3 border-b border-green-300 pb-1">
            <span className="font-bold text-green-900">
              {remainingCount} suspect{remainingCount !== 1 ? 's' : ''} match
            </span>
            {hasAnyTraits && (
              <button
                onClick={onResetTraits}
                className="text-xs text-green-700 hover:text-green-900 underline"
              >
                Reset
              </button>
            )}
          </div>

          <div className="grid grid-cols-3 sm:grid-cols-4 gap-4 py-2">
            {suspects.map((suspect, index) => {
              const eliminated = isEliminated(suspect.id);
              const isSelected = selectedWarrant?.id === suspect.id;

              return (
                <SuspectCard
                  key={suspect.id}
                  suspect={suspect}
                  eliminated={eliminated}
                  isSelected={isSelected}
                  onSelect={onSelectWarrant}
                  rotation={rotations[suspect.id]}
                  gridIndex={index}
                />
              );
            })}
          </div>
        </NoteCard>
      </div>

      {/* Warrant Button */}
      <div className="relative">
        <NoteCard color="pink" rotation={-1}>
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

      {/* Location Intel */}
      {collectedClues.city.length > 0 && (
        <div className="relative">
          <NoteCard color="blue" rotation={2}>
            <div className="flex items-center gap-2 mb-2 border-b border-blue-300 pb-1">
              <MapPin size={16} className="text-blue-700" />
              <span className="font-bold text-blue-900">Location Intel</span>
            </div>
            <div className="space-y-2 max-h-40 overflow-y-auto">
              {collectedClues.city.map((clue, i) => (
                <ClueQuote key={i} clue={clue} />
              ))}
            </div>
          </NoteCard>
        </div>
      )}
    </div>
  );
}

export default DossierTab;
