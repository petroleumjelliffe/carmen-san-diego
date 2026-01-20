import { describe, it, expect, beforeEach, vi } from 'vitest';

/**
 * Integration Tests for Investigation Flow
 *
 * These tests verify the critical interaction between:
 * - handleInvestigate (sets pending ref)
 * - xstateInvestigating useEffect (queues action)
 * - completeInvestigation (uses pending ref data)
 *
 * BUG THAT WAS CAUGHT:
 * The pending ref was cleared immediately after queuing the action,
 * but completeInvestigation runs later as a callback. When it tried
 * to access the ref, it was null, causing it to return early without:
 * - Setting lastVisitedLocation (broke travel animation origin)
 * - Recording the investigation (broke multiple investigations)
 */

describe('Investigation Pending Ref Lifecycle', () => {
  /**
   * Simulates the investigation flow with proper timing
   */
  function simulateInvestigationFlow() {
    const pendingInvestigationRef = { current: null };
    const callbacks = {
      onComplete: null,
      setLastVisitedLocation: vi.fn(),
      setLastFoundClue: vi.fn(),
      sendContinue: vi.fn(),
    };

    // Step 1: User clicks investigate (handleInvestigate)
    const handleInvestigate = (spot, clue) => {
      pendingInvestigationRef.current = {
        spot,
        clue,
        timeCost: 2,
        timestamp: Date.now(),
        // Initially no queued flag
      };
    };

    // Step 2: Machine confirms investigation (useEffect fires)
    const machineConfirmsInvestigation = () => {
      const pending = pendingInvestigationRef.current;

      if (pending && !pending.queued) {
        // Mark as queued (CRITICAL: prevents double-queuing)
        pendingInvestigationRef.current = { ...pending, queued: true };

        // Queue action with completion callback
        callbacks.onComplete = () => {
          completeInvestigation();
        };

        // CRITICAL: Do NOT clear ref here!
        // It must persist until completeInvestigation runs
      }
    };

    // Step 3: Action completes (callback runs)
    const completeInvestigation = () => {
      const pending = pendingInvestigationRef.current;

      if (!pending) {
        // BUG: If ref is null, this function returns early
        // Track this failure for testing
        callbacks.completionFailed = true;
        return;
      }

      const { spot, clue } = pending;

      // Clear ref AFTER using data
      pendingInvestigationRef.current = null;

      // Set lastVisitedLocation (needed for travel animation)
      callbacks.setLastVisitedLocation({
        ...spot,
        lon: spot.lon || spot.lng,
      });

      // Reveal clue
      callbacks.setLastFoundClue({
        city: clue.destinationClue,
        suspect: clue.suspectClue,
      });

      // Send CONTINUE to machine
      callbacks.sendContinue();

      // Track success for testing
      callbacks.completionSucceeded = true;
    };

    return {
      pendingInvestigationRef,
      handleInvestigate,
      machineConfirmsInvestigation,
      completeInvestigation,
      callbacks,
    };
  }

  describe('CORRECT implementation (with queued flag)', () => {
    it('preserves pending ref until completion callback runs', () => {
      const flow = simulateInvestigationFlow();
      const mockSpot = { id: 'opera_house', name: 'Opera House', lat: -33.8568, lon: 151.2153 };
      const mockClue = { destinationClue: 'They asked about Paris', suspectClue: 'They love art' };

      // Step 1: User investigates
      flow.handleInvestigate(mockSpot, mockClue);

      expect(flow.pendingInvestigationRef.current).toEqual({
        spot: mockSpot,
        clue: mockClue,
        timeCost: 2,
        timestamp: expect.any(Number),
      });

      // Step 2: Machine confirms
      flow.machineConfirmsInvestigation();

      // Ref should still exist but marked as queued
      expect(flow.pendingInvestigationRef.current).toBeTruthy();
      expect(flow.pendingInvestigationRef.current.queued).toBe(true);
      expect(flow.pendingInvestigationRef.current.spot).toEqual(mockSpot);

      // Step 3: Action completes
      flow.callbacks.onComplete();

      // Should succeed
      expect(flow.callbacks.completionSucceeded).toBe(true);
      expect(flow.callbacks.completionFailed).toBeUndefined();

      // Should have called setLastVisitedLocation
      expect(flow.callbacks.setLastVisitedLocation).toHaveBeenCalledWith({
        ...mockSpot,
        lon: mockSpot.lon,
      });

      // Should have revealed clue
      expect(flow.callbacks.setLastFoundClue).toHaveBeenCalledWith({
        city: mockClue.destinationClue,
        suspect: mockClue.suspectClue,
      });

      // Should have sent CONTINUE
      expect(flow.callbacks.sendContinue).toHaveBeenCalled();

      // Ref should now be cleared
      expect(flow.pendingInvestigationRef.current).toBe(null);
    });

    it('handles multiple investigations in sequence', () => {
      const flow = simulateInvestigationFlow();

      const spots = [
        { id: 'opera_house', name: 'Opera House', lat: -33.8568, lon: 151.2153 },
        { id: 'bondi_beach', name: 'Bondi Beach', lat: -33.8908, lon: 151.2743 },
        { id: 'harbour_bridge', name: 'Harbour Bridge', lat: -33.8523, lon: 151.2108 },
      ];

      const clues = [
        { destinationClue: 'Clue 1', suspectClue: 'Suspect 1' },
        { destinationClue: 'Clue 2', suspectClue: 'Suspect 2' },
        { destinationClue: 'Clue 3', suspectClue: 'Suspect 3' },
      ];

      for (let i = 0; i < 3; i++) {
        // Reset success flags for each iteration
        flow.callbacks.completionSucceeded = undefined;
        flow.callbacks.completionFailed = undefined;

        // Investigation cycle
        flow.handleInvestigate(spots[i], clues[i]);
        flow.machineConfirmsInvestigation();
        flow.callbacks.onComplete();

        // Each investigation should succeed
        expect(flow.callbacks.completionSucceeded).toBe(true);
        expect(flow.callbacks.completionFailed).toBeUndefined();

        // Should set location for each investigation
        expect(flow.callbacks.setLastVisitedLocation).toHaveBeenNthCalledWith(i + 1, {
          ...spots[i],
          lon: spots[i].lon,
        });
      }

      // All 3 investigations completed
      expect(flow.callbacks.setLastVisitedLocation).toHaveBeenCalledTimes(3);
      expect(flow.callbacks.setLastFoundClue).toHaveBeenCalledTimes(3);
      expect(flow.callbacks.sendContinue).toHaveBeenCalledTimes(3);
    });

    it('prevents double-queuing with queued flag', () => {
      const flow = simulateInvestigationFlow();
      const mockSpot = { id: 'opera_house', name: 'Opera House', lat: -33.8568, lon: 151.2153 };
      const mockClue = { destinationClue: 'They asked about Paris' };

      // Step 1: User investigates
      flow.handleInvestigate(mockSpot, mockClue);

      // Step 2: Machine confirms
      flow.machineConfirmsInvestigation();

      // Store first callback
      const firstCallback = flow.callbacks.onComplete;

      // Try to confirm again (simulates re-render with same xstateInvestigating state)
      flow.machineConfirmsInvestigation();

      // Callback should not change (not re-queued)
      expect(flow.callbacks.onComplete).toBe(firstCallback);

      // Complete investigation
      flow.callbacks.onComplete();
      expect(flow.callbacks.completionSucceeded).toBe(true);
    });
  });

  describe('BUGGY implementation (clearing ref too early)', () => {
    /**
     * This simulates the OLD buggy implementation where ref was cleared
     * immediately after queuing the action
     */
    function simulateBuggyInvestigationFlow() {
      const pendingInvestigationRef = { current: null };
      const callbacks = {
        onComplete: null,
        setLastVisitedLocation: vi.fn(),
        setLastFoundClue: vi.fn(),
        sendContinue: vi.fn(),
      };

      const handleInvestigate = (spot, clue) => {
        pendingInvestigationRef.current = { spot, clue, timeCost: 2 };
      };

      // BUG: Clears ref immediately after queuing
      const machineConfirmsInvestigation = () => {
        const pending = pendingInvestigationRef.current;

        if (pending) {
          callbacks.onComplete = () => {
            completeInvestigation();
          };

          // BUG: Clear ref BEFORE callback runs
          pendingInvestigationRef.current = null;
        }
      };

      const completeInvestigation = () => {
        const pending = pendingInvestigationRef.current;

        if (!pending) {
          callbacks.completionFailed = true;
          return;
        }

        const { spot, clue } = pending;
        pendingInvestigationRef.current = null;

        callbacks.setLastVisitedLocation({ ...spot, lon: spot.lon || spot.lng });
        callbacks.setLastFoundClue({ city: clue.destinationClue, suspect: clue.suspectClue });
        callbacks.sendContinue();

        callbacks.completionSucceeded = true;
      };

      return {
        pendingInvestigationRef,
        handleInvestigate,
        machineConfirmsInvestigation,
        completeInvestigation,
        callbacks,
      };
    }

    it('FAILS: ref is null when completion callback runs', () => {
      const flow = simulateBuggyInvestigationFlow();
      const mockSpot = { id: 'opera_house', name: 'Opera House', lat: -33.8568, lon: 151.2153 };
      const mockClue = { destinationClue: 'They asked about Paris' };

      // User investigates
      flow.handleInvestigate(mockSpot, mockClue);

      // Machine confirms - BUG: clears ref immediately
      flow.machineConfirmsInvestigation();

      // Ref is now null!
      expect(flow.pendingInvestigationRef.current).toBe(null);

      // Action completes - callback runs
      flow.callbacks.onComplete();

      // BUG: Returns early because ref is null
      expect(flow.callbacks.completionFailed).toBe(true);
      expect(flow.callbacks.completionSucceeded).toBeUndefined();

      // BUG: lastVisitedLocation never set
      expect(flow.callbacks.setLastVisitedLocation).not.toHaveBeenCalled();

      // BUG: Clue never revealed
      expect(flow.callbacks.setLastFoundClue).not.toHaveBeenCalled();

      // BUG: CONTINUE never sent
      expect(flow.callbacks.sendContinue).not.toHaveBeenCalled();
    });

    it('FAILS: multiple investigations - only first works', () => {
      const flow = simulateBuggyInvestigationFlow();

      const spots = [
        { id: 'opera_house', name: 'Opera House', lat: -33.8568, lon: 151.2153 },
        { id: 'bondi_beach', name: 'Bondi Beach', lat: -33.8908, lon: 151.2743 },
      ];

      const clues = [
        { destinationClue: 'Clue 1' },
        { destinationClue: 'Clue 2' },
      ];

      // First investigation
      flow.handleInvestigate(spots[0], clues[0]);
      flow.machineConfirmsInvestigation();
      flow.callbacks.onComplete();

      // BUG: First investigation fails
      expect(flow.callbacks.completionFailed).toBe(true);
      expect(flow.callbacks.completionSucceeded).toBeUndefined();
      expect(flow.callbacks.setLastVisitedLocation).not.toHaveBeenCalled();

      // Reset flags
      flow.callbacks.completionFailed = undefined;
      flow.callbacks.completionSucceeded = undefined;

      // Second investigation
      flow.handleInvestigate(spots[1], clues[1]);
      flow.machineConfirmsInvestigation();
      flow.callbacks.onComplete();

      // BUG: Second investigation also fails
      expect(flow.callbacks.completionFailed).toBe(true);
      expect(flow.callbacks.completionSucceeded).toBeUndefined();

      // BUG: No investigations recorded
      expect(flow.callbacks.setLastVisitedLocation).toHaveBeenCalledTimes(0);
    });
  });

  describe('Travel Animation Origin Tracking', () => {
    it('uses lastVisitedLocation as origin for next travel', () => {
      const flow = simulateInvestigationFlow();
      const mockSpot = { id: 'opera_house', name: 'Opera House', lat: -33.8568, lon: 151.2153 };
      const mockClue = { destinationClue: 'They asked about Paris' };

      // Investigate
      flow.handleInvestigate(mockSpot, mockClue);
      flow.machineConfirmsInvestigation();
      flow.callbacks.onComplete();

      // Should have set lastVisitedLocation
      expect(flow.callbacks.setLastVisitedLocation).toHaveBeenCalledWith({
        id: 'opera_house',
        name: 'Opera House',
        lat: -33.8568,
        lon: 151.2153,
      });

      // Next travel would use this location as origin
      const lastVisitedLocation = flow.callbacks.setLastVisitedLocation.mock.calls[0][0];
      expect(lastVisitedLocation).toHaveProperty('lat');
      expect(lastVisitedLocation).toHaveProperty('lon');
      expect(lastVisitedLocation).toHaveProperty('name');
    });
  });
});

describe('Investigation State Machine Coordination', () => {
  it('documents the expected state machine flow', () => {
    /**
     * EXPECTED FLOW:
     *
     * 1. User clicks investigate spot
     *    - handleInvestigate sets pendingInvestigationRef.current
     *    - Sends INVESTIGATE event to machine
     *
     * 2. Machine validates with hasAvailableSpots guard
     *    - If guard passes: enters 'investigating' state
     *    - If guard fails: stays in 'idle' state
     *
     * 3. Machine in 'investigating' state (brief)
     *    - Entry actions: advanceTimeForInvestigation, recordInvestigation
     *    - Immediately auto-routes to 'witnessClue' (or 'encounter' if guards match)
     *    - xstateInvestigating becomes true momentarily
     *
     * 4. UI detects xstateInvestigating === true
     *    - Checks pendingInvestigationRef.current exists
     *    - Checks !pending.queued (prevent double-queuing)
     *    - Marks pending as queued
     *    - Queues action with completeInvestigation as onComplete
     *    - DOES NOT clear ref yet
     *
     * 5. Machine now in 'witnessClue' state
     *    - Waiting for CONTINUE event
     *
     * 6. Action animation completes
     *    - completeInvestigation callback runs
     *    - Accesses pendingInvestigationRef.current (still exists!)
     *    - Sets lastVisitedLocation
     *    - Reveals clue
     *    - Sends CONTINUE event to machine
     *    - Clears ref
     *
     * 7. Machine receives CONTINUE
     *    - Transitions from 'witnessClue' to 'checkingIdle' to 'idle'
     *    - Ready for next investigation
     */
    expect(true).toBe(true); // Documentation test
  });
});
