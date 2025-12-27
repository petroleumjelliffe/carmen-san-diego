import { GameLayout } from './GameLayout';
import { TopPanel } from './TopPanel';

/**
 * Briefing - Shows case details and mission equipment at start of case
 */
export function Briefing({ currentCase, startingCity, settings, onAccept }) {
  if (!currentCase) return null;

  // Calculate deadline (current date + total hours)
  const calculateDeadline = () => {
    const now = new Date();
    const deadline = new Date(now.getTime() + settings.total_time * 60 * 60 * 1000);
    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const dayName = days[deadline.getDay()];
    const hours = deadline.getHours();
    const minutes = deadline.getMinutes().toString().padStart(2, '0');
    const ampm = hours >= 12 ? 'PM' : 'AM';
    const displayHours = hours % 12 || 12;
    return `${dayName}, ${displayHours}:${minutes} ${ampm}`;
  };

  return (
    <GameLayout
      topPanel={<TopPanel location="ACME HQ" timeRemaining={settings.total_time} />}
      bottomPanel={
        <button
          onClick={onAccept}
          className="w-full bg-yellow-500 hover:bg-yellow-600 text-black font-bold py-3 px-6 rounded text-lg transition-colors"
        >
          ACCEPT MISSION
        </button>
      }
    >
      <div className="bg-black bg-opacity-60 rounded-lg p-6 text-white max-w-2xl mx-auto">
        <h1 className="text-3xl font-bold text-yellow-400 mb-4">
          CASE FILE #{Math.floor(Math.random() * 9000) + 1000}
        </h1>

        <div className="space-y-4">
          {/* Stolen Item */}
          <div>
            <h2 className="text-xl font-bold text-yellow-400 mb-2">STOLEN:</h2>
            <p className="text-lg">{currentCase.stolenItem?.name || 'Unknown'}</p>
          </div>

          {/* Starting Location */}
          <div>
            <h2 className="text-xl font-bold text-yellow-400 mb-2">LOCATION:</h2>
            <p className="text-lg">{startingCity ? `${startingCity.name}, ${startingCity.country}` : 'Unknown'}</p>
          </div>

          {/* Deadline */}
          <div>
            <h2 className="text-xl font-bold text-yellow-400 mb-2">DEADLINE:</h2>
            <p className="text-lg">{calculateDeadline()}</p>
            <p className="text-sm text-gray-300">({settings.total_time} hours total)</p>
          </div>

          {/* Description */}
          <div>
            <h2 className="text-xl font-bold text-yellow-400 mb-2">DESCRIPTION:</h2>
            <p className="text-lg leading-relaxed">
              The infamous Shadow Syndicate has struck again. Intelligence suggests
              they're moving the stolen goods through multiple cities. Track them down
              before time runs out.
            </p>
          </div>

          {/* Mission Equipment */}
          <div>
            <h2 className="text-xl font-bold text-yellow-400 mb-2">MISSION EQUIPMENT:</h2>
            <div className="grid grid-cols-2 gap-2 text-sm">
              <div>💨 Smoke Bomb - Quick escapes</div>
              <div>👓 X-Ray Glasses - See hidden</div>
              <div>📱 Shoe Phone - Call for backup</div>
              <div>⚡ Laser Watch - Precision cutting</div>
              <div>🎯 Grappling Hook - Scale buildings</div>
              <div>💊 Antidote Pills - Counter poison</div>
            </div>
            <p className="text-yellow-400 text-sm mt-2 italic">
              Use wisely - each gadget works only once per mission!
            </p>
          </div>
        </div>
      </div>
    </GameLayout>
  );
}
