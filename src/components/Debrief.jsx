import { GameLayout } from './GameLayout';
import { Trophy, TrendingUp, Clock, MapPin, Heart, AlertTriangle, Star, Award } from 'lucide-react';

// Stat row component
function StatRow({ label, value, icon: Icon, highlight }) {
  return (
    <div className={`flex items-center justify-between py-2 border-b border-gray-700/50 last:border-0 ${highlight ? 'bg-yellow-500/10 -mx-2 px-2 rounded' : ''}`}>
      <div className="flex items-center gap-2 text-gray-300">
        {Icon && <Icon size={14} className="text-gray-500" />}
        <span>{label}</span>
      </div>
      <div className="font-bold text-white">{value}</div>
    </div>
  );
}

// Section card
function ReportSection({ title, icon: Icon, children, color = 'gray' }) {
  const colors = {
    gray: 'border-gray-600 bg-gray-800/50',
    green: 'border-green-600 bg-green-900/30',
    red: 'border-red-600 bg-red-900/30',
    yellow: 'border-yellow-600 bg-yellow-900/20',
  };
  const titleColors = {
    gray: 'text-gray-300',
    green: 'text-green-300',
    red: 'text-red-300',
    yellow: 'text-yellow-300',
  };

  return (
    <div className={`rounded-lg border p-4 ${colors[color]}`}>
      <div className={`flex items-center gap-2 mb-3 ${titleColors[color]}`}>
        {Icon && <Icon size={18} />}
        <h3 className="font-bold text-sm tracking-wide">{title}</h3>
      </div>
      {children}
    </div>
  );
}

/**
 * Debrief - Shows case stats and promotion after trial
 */
export function Debrief({
  isWon,
  currentCase,
  timeRemaining,
  solvedCases,
  ranks,
  karma,
  notoriety,
  savedNPCs,
  permanentInjuries,
  onNewCase,
  onReturnToMenu,
}) {
  // Get current rank
  const currentRank = ranks.find(
    (rank) => solvedCases >= rank.min_cases && (ranks[ranks.indexOf(rank) + 1]
      ? solvedCases < ranks[ranks.indexOf(rank) + 1].min_cases
      : true)
  ) || ranks[0];

  // Get previous rank for promotion display
  const rankIndex = ranks.indexOf(currentRank);
  const previousRank = rankIndex > 0 ? ranks[rankIndex - 1] : null;

  return (
    <GameLayout
      bottomPanel={
        <div className="flex gap-3">
          <button
            onClick={onNewCase}
            className="flex-1 bg-yellow-500 hover:bg-yellow-400 text-black font-bold py-4 px-6 rounded-lg text-lg transition-all shadow-lg hover:shadow-xl active:scale-[0.98]"
          >
            NEW CASE
          </button>
          <button
            onClick={onReturnToMenu}
            className="flex-1 bg-gray-700 hover:bg-gray-600 text-white font-bold py-4 px-6 rounded-lg text-lg transition-all shadow-lg hover:shadow-xl active:scale-[0.98]"
          >
            MAIN MENU
          </button>
        </div>
      }
    >
      <div className="max-w-2xl mx-auto space-y-4">
        {/* Header Banner */}
        <div
          className={`rounded-lg p-6 text-center ${
            isWon
              ? 'bg-gradient-to-br from-green-800 to-green-900'
              : 'bg-gradient-to-br from-red-800 to-red-900'
          }`}
          style={{ boxShadow: 'inset 0 -2px 4px rgba(0,0,0,0.3)' }}
        >
          <div className="text-5xl mb-3">
            {isWon ? <Trophy className="inline text-yellow-400" size={56} /> : '❌'}
          </div>
          <h1 className={`text-3xl font-bold mb-2 ${isWon ? 'text-green-200' : 'text-red-200'}`}>
            {isWon ? 'CASE CLOSED' : 'CASE FAILED'}
          </h1>
          <p className={`text-lg ${isWon ? 'text-green-300' : 'text-red-300'}`}>
            {isWon ? 'Outstanding detective work!' : 'The suspect escaped justice.'}
          </p>
        </div>

        {/* Promotion Banner - only show if rank actually increased */}
        {isWon && previousRank && previousRank.label !== currentRank.label && (
          <div className="bg-gradient-to-r from-yellow-600 via-yellow-500 to-yellow-600 rounded-lg p-4 text-center shadow-lg">
            <div className="flex items-center justify-center gap-3">
              <Award className="text-yellow-900" size={28} />
              <div>
                <p className="text-yellow-900 font-bold text-lg">NEW RANK</p>
                <p className="text-yellow-800 font-bold text-xl">{currentRank.label}</p>
              </div>
              <Award className="text-yellow-900" size={28} />
            </div>
          </div>
        )}

        {/* Injuries Warning */}
        {permanentInjuries && permanentInjuries.length > 0 && (
          <ReportSection title="MEDICAL REPORT" icon={AlertTriangle} color="red">
            <div className="space-y-2">
              {permanentInjuries.map((injury, i) => (
                <div key={i} className="flex items-center gap-2 text-red-200 text-sm">
                  <span className="text-lg">{injury.icon}</span>
                  <span>{injury.effect}</span>
                </div>
              ))}
            </div>
          </ReportSection>
        )}

        {/* Career Stats */}
        <ReportSection title="CAREER RECORD" icon={TrendingUp} color="yellow">
          <div className="space-y-1">
            <StatRow
              label="Cases Solved"
              value={solvedCases}
              highlight={true}
            />
            <StatRow
              label="Current Rank"
              value={currentRank.label}
            />
            <StatRow
              label="NPCs Helped"
              value={savedNPCs?.length || 0}
              icon={Heart}
            />
            <div className="flex items-center justify-between py-2 border-b border-gray-700/50">
              <div className="flex items-center gap-2 text-gray-300">
                <Star size={14} className="text-gray-500" />
                <span>Karma</span>
              </div>
              <div className="font-bold text-white flex items-center gap-1">
                {[...Array(5)].map((_, i) => (
                  <Star
                    key={i}
                    size={14}
                    className={i < (karma || 0) ? 'text-yellow-400 fill-yellow-400' : 'text-gray-600'}
                  />
                ))}
                {karma >= 5 && <span className="text-red-400 text-xs ml-1">Exploitable</span>}
              </div>
            </div>
            <div className="flex items-center justify-between py-2 border-b border-gray-700/50">
              <div className="flex items-center gap-2 text-gray-300">
                <AlertTriangle size={14} className="text-gray-500" />
                <span>Notoriety</span>
              </div>
              <div className="font-bold text-white flex items-center gap-1">
                {[...Array(5)].map((_, i) => (
                  <div
                    key={i}
                    className={`w-3 h-3 rounded-sm ${i < (notoriety || 0) ? 'bg-red-500' : 'bg-gray-600'}`}
                  />
                ))}
                {notoriety >= 5 && <span className="text-red-400 text-xs ml-1">Dangerous</span>}
              </div>
            </div>
{permanentInjuries?.length > 0 && (
              <StatRow
                label="Permanent Injuries"
                value={`${permanentInjuries.length} (${permanentInjuries.map(i => i.icon).join(' ')})`}
                icon={AlertTriangle}
              />
            )}
          </div>
        </ReportSection>
      </div>
    </GameLayout>
  );
}
