import { useState, useEffect, useCallback } from 'react';

/**
 * Shared timer hook for all timed encounters (henchman, assassination, good deed)
 *
 * @param {number} duration - Timer duration in seconds
 * @param {function} onTimeout - Callback when timer expires
 * @param {boolean} active - Whether the timer should be running
 * @returns {{ timeLeft, hasTimedOut, timerPercent, urgencyLevel }}
 */
export function useEncounterTimer(duration, onTimeout, active = true) {
  const [timeLeft, setTimeLeft] = useState(duration);
  const [hasTimedOut, setHasTimedOut] = useState(false);

  useEffect(() => {
    if (!active || hasTimedOut) return;

    const interval = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 0.1) {
          setHasTimedOut(true);
          clearInterval(interval);
          // Small delay before triggering timeout callback
          setTimeout(() => onTimeout(), 500);
          return 0;
        }
        return prev - 0.1;
      });
    }, 100);

    return () => clearInterval(interval);
  }, [active, hasTimedOut, onTimeout]);

  const timerPercent = (timeLeft / duration) * 100;

  // Urgency levels for visual feedback
  // 'critical' = red pulse, 'warning' = orange, 'normal' = blue
  const urgencyLevel = timeLeft < 2 ? 'critical' : timeLeft < duration * 0.4 ? 'warning' : 'normal';

  return {
    timeLeft,
    hasTimedOut,
    timerPercent,
    urgencyLevel,
  };
}

export default useEncounterTimer;
