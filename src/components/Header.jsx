import { Clock, Award, Moon } from 'lucide-react';
import { getRank } from '../utils/helpers';

export function Header({ currentCase, timeRemaining, currentHour, solvedCases, ranks }) {
  const rank = getRank(ranks, solvedCases);

  // Format current time
  const formatTime = (hour) => {
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const displayHour = hour % 12 || 12;
    return `${displayHour}:00 ${ampm}`;
  };

  const isNightTime = currentHour >= 20 || currentHour < 6;

  return (
    <div className="bg-red-950 border-b-4 border-yellow-400 p-4">
      <div className="max-w-4xl mx-auto flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-yellow-400" style={{ fontFamily: 'serif' }}>
            THE SHADOW SYNDICATE
          </h1>
          <div className="text-yellow-200/70 text-sm">
            Case: Recovery of {currentCase?.stolenItem?.name}
          </div>
        </div>
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-2 text-yellow-100">
            <Award size={20} />
            <span>{rank.label}</span>
          </div>
          <div className="flex flex-col items-end gap-1">
            <div className={`flex items-center gap-2 text-sm ${isNightTime ? 'text-blue-300' : 'text-yellow-300'}`}>
              {isNightTime && <Moon size={14} />}
              <span>{formatTime(currentHour)}</span>
              {currentHour >= 22 && <span className="text-red-400 font-bold ml-1">⚠️ Sleep soon!</span>}
            </div>
            <div className={`flex items-center gap-2 ${timeRemaining <= 12 ? 'text-red-400' : 'text-yellow-100'}`}>
              <Clock size={20} />
              <span className="font-mono text-xl">{timeRemaining}h</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Header;
