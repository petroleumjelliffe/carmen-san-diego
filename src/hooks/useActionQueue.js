import { useState, useEffect, useCallback, useRef } from 'react';

/**
 * Hook for managing staged action flow:
 * 1. pending - spinner shown, action in progress
 * 2. ticking - time advancing visibly (1 hour per tick)
 * 3. complete - ready to show results
 *
 * @param {Object} options
 * @param {Function} options.onTickHour - Called for each hour tick
 * @param {number} options.tickSpeed - Milliseconds per hour tick (default 300)
 * @param {number} options.spinnerDuration - Milliseconds for pending phase (default 500)
 */
export function useActionQueue({
  onTickHour,
  tickSpeed = 300,
  spinnerDuration = 500,
} = {}) {
  const [phase, setPhase] = useState('idle'); // 'idle' | 'pending' | 'ticking' | 'complete'
  const [pendingAction, setPendingAction] = useState(null);
  const [hoursRemaining, setHoursRemaining] = useState(0);
  const [totalHours, setTotalHours] = useState(0);

  const onTickHourRef = useRef(onTickHour);
  const pendingActionRef = useRef(null);

  // Keep refs updated
  useEffect(() => {
    onTickHourRef.current = onTickHour;
  }, [onTickHour]);

  useEffect(() => {
    pendingActionRef.current = pendingAction;
  }, [pendingAction]);

  // Handle pending phase timeout -> ticking
  useEffect(() => {
    if (phase !== 'pending' || !pendingAction) return;

    const duration = pendingAction.spinnerDuration ?? spinnerDuration;
    const timer = setTimeout(() => {
      setHoursRemaining(pendingAction.hoursCost);
      setTotalHours(pendingAction.hoursCost);
      setPhase('ticking');
    }, duration);

    return () => clearTimeout(timer);
  }, [phase, pendingAction, spinnerDuration]);

  // Handle ticking phase - advance one hour at a time
  useEffect(() => {
    if (phase !== 'ticking' || hoursRemaining <= 0) return;

    const timer = setTimeout(() => {
      // Advance one hour
      if (onTickHourRef.current) {
        onTickHourRef.current(1);
      }

      const remaining = hoursRemaining - 1;
      setHoursRemaining(remaining);

      if (remaining <= 0) {
        // Ticking complete - call onComplete and transition
        setPhase('complete');
        if (pendingActionRef.current?.onComplete) {
          pendingActionRef.current.onComplete();
        }
      }
    }, tickSpeed);

    return () => clearTimeout(timer);
  }, [phase, hoursRemaining, tickSpeed]);

  // Queue an action
  const queueAction = useCallback((action) => {
    if (phase !== 'idle') {
      console.warn('Action already in progress, ignoring new action');
      return false;
    }

    setPendingAction(action);
    setPhase('pending');
    return true;
  }, [phase]);

  // Reset to idle (called after results are shown)
  const completeAction = useCallback(() => {
    setPendingAction(null);
    setHoursRemaining(0);
    setTotalHours(0);
    setPhase('idle');
  }, []);

  // Check if any action is in progress
  const isBusy = phase !== 'idle';

  return {
    phase,
    pendingAction,
    hoursRemaining,
    totalHours,
    isBusy,
    queueAction,
    completeAction,
  };
}

export default useActionQueue;
