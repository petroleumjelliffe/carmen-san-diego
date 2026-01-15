/**
 * React hook for the Carmen Sandiego game state machine
 *
 * Provides access to the game state machine via React context.
 * Handles initialization, persistence loading, and event dispatching.
 */
import { createContext, useContext, useMemo } from 'react';
import { useMachine } from '@xstate/react';
import { gameMachine } from '../state/gameMachine.js';
import { getDistanceKm, getTravelHours } from '../state/types.js';

// Storage key for save data
const SAVE_KEY = 'carmenSandiego_v2_save';

/**
 * Load saved game data from localStorage
 * @returns {Object|null} Saved context or null if no save exists
 */
function loadSavedGame() {
  try {
    const saved = localStorage.getItem(SAVE_KEY);
    if (saved) {
      return JSON.parse(saved);
    }
  } catch (e) {
    console.error('Failed to load saved game:', e);
  }
  return null;
}

/**
 * Check if a valid save exists
 * @returns {boolean}
 */
export function hasSavedGame() {
  const saved = loadSavedGame();
  return saved !== null && saved.currentCase !== null;
}

// Context for the game machine
const GameMachineContext = createContext(null);

/**
 * Provider component for the game machine
 * Wrap your app with this to provide access to the game state
 */
export function GameMachineProvider({ children }) {
  const [state, send, service] = useMachine(gameMachine);

  // Memoize the context value to prevent unnecessary re-renders
  const value = useMemo(
    () => ({
      // Current state
      state,
      context: state.context,

      // State matching helpers
      isMenu: state.matches('menu'),
      isBriefing: state.matches('briefing'),
      isPlaying: state.matches('playing'),
      isApprehended: state.matches('apprehended'),
      isTrial: state.matches('trial'),
      isDebrief: state.matches('debrief'),

      // Activity state matching (when in playing)
      isIdle: state.matches('playing.idle'),
      isTraveling: state.matches('playing.traveling'),
      isInvestigating: state.matches('playing.investigating'),
      isEncounter: state.matches('playing.encounter'),
      isWitnessClue: state.matches('playing.witnessClue'),
      isSleeping: state.matches('playing.sleeping'),
      isConfirmingSleep: state.matches('playing.confirmingSleep'),

      // Encounter sub-state matching
      isChoosingAction: state.matches('playing.encounter.choosingAction'),
      isChoosingGoodDeed: state.matches('playing.encounter.choosingGoodDeed'),
      isResolvingEncounter: state.matches('playing.encounter.resolving'),

      // Event dispatchers
      send,

      // High-level action helpers
      startCase: (caseData) => send({ type: 'START_CASE', caseData }),

      loadSave: () => {
        const saved = loadSavedGame();
        if (saved) {
          send({ type: 'LOAD_SAVE', savedContext: saved });
        }
      },

      acceptBriefing: () => send({ type: 'ACCEPT_BRIEFING' }),

      /**
       * Travel to a destination
       * Calculates travel time based on distance
       * @param {Object} destination - Destination city data
       * @param {Object} currentCity - Current city data (for distance calc)
       * @param {boolean} isCorrectPath - Whether this is the correct destination
       */
      travel: (destination, currentCity, isCorrectPath) => {
        const distanceKm = getDistanceKm(currentCity, destination);
        const travelHours = getTravelHours(distanceKm);
        send({
          type: 'TRAVEL',
          destinationId: destination.id,
          travelHours,
          isCorrectPath,
        });
      },

      // Called when travel animation completes
      arrive: () => send({ type: 'ARRIVE' }),

      /**
       * Investigate a spot
       * @param {number} spotIndex - Index of the investigation spot
       * @param {boolean} isRogueAction - Whether this is a rogue action
       */
      investigate: (spotIndex, isRogueAction = false) =>
        send({ type: 'INVESTIGATE', spotIndex, isRogueAction }),

      // Encounter resolution
      chooseGadget: (gadgetId) => send({ type: 'CHOOSE_GADGET', gadgetId }),
      chooseEndure: () => send({ type: 'CHOOSE_ENDURE' }),
      helpNpc: () => send({ type: 'HELP_NPC' }),
      ignoreNpc: () => send({ type: 'IGNORE_NPC' }),
      resolveEncounter: () => send({ type: 'RESOLVE_ENCOUNTER' }),

      // Witness clue
      continueAfterClue: () => send({ type: 'CONTINUE' }),

      // Sleep
      wake: () => send({ type: 'WAKE' }),
      confirmSleep: () => send({ type: 'CONFIRM_SLEEP' }),
      cancelSleep: () => send({ type: 'CANCEL_SLEEP' }),

      // Trial flow
      proceedToTrial: () => send({ type: 'PROCEED_TO_TRIAL' }),
      completeTrial: () => send({ type: 'COMPLETE_TRIAL' }),
      returnToMenu: () => send({ type: 'RETURN_TO_MENU' }),

      // Service for advanced use (subscriptions, etc.)
      service,

      // Utility: check if save exists
      hasSavedGame: hasSavedGame(),
    }),
    [state, send, service]
  );

  return (
    <GameMachineContext.Provider value={value}>
      {children}
    </GameMachineContext.Provider>
  );
}

/**
 * Hook to access the game machine
 * Must be used within a GameMachineProvider
 *
 * @example
 * const { context, isIdle, investigate, travel } = useGameMachine();
 *
 * if (isIdle) {
 *   return <button onClick={() => investigate(0)}>Investigate</button>;
 * }
 */
export function useGameMachine() {
  const context = useContext(GameMachineContext);
  if (!context) {
    throw new Error('useGameMachine must be used within a GameMachineProvider');
  }
  return context;
}

/**
 * Selector hook for specific context values
 * Helps prevent re-renders when only specific values are needed
 *
 * @example
 * const timeRemaining = useGameContext(ctx => ctx.timeRemaining);
 */
export function useGameContext(selector) {
  const { context } = useGameMachine();
  return selector(context);
}

/**
 * Hook to get current city data
 * Returns the city object from the current case
 */
export function useCurrentCity() {
  const { context } = useGameMachine();
  if (!context.currentCase) return null;

  // Handle wrongCity - we're at a decoy city, not in the cities array
  if (context.wrongCity) {
    // Find the wrong city from the origin city's wrongDestinations
    // For now, return minimal city data since wrong cities may not be fully defined
    return {
      id: context.currentCityId,
      name: context.currentCityId, // Will need proper lookup
      investigationSpots: 3, // Default
    };
  }

  return context.currentCase.cities[context.cityIndex];
}

/**
 * Hook to get travel options from current city
 * Returns array of possible destinations with distance/time info
 */
export function useTravelOptions() {
  const { context } = useGameMachine();
  if (!context.currentCase) return [];

  const currentCity = context.currentCase.cities[context.cityIndex];
  if (!currentCity) return [];

  // If in wrong city, only option is to return to origin
  if (context.wrongCity && context.originCityId) {
    // Find origin city data
    const originCity = context.currentCase.cities.find(
      (c) => c.id === context.originCityId
    );
    if (originCity) {
      const distanceKm = getDistanceKm(
        { lat: currentCity.lat, lng: currentCity.lng },
        originCity
      );
      return [
        {
          city: originCity,
          isCorrectPath: true, // Returning is "correct"
          distanceKm,
          travelHours: getTravelHours(distanceKm),
        },
      ];
    }
    return [];
  }

  // Normal travel options
  const options = [];

  // Correct destination
  if (currentCity.correctDestination) {
    const correctCity = context.currentCase.cities.find(
      (c) => c.id === currentCity.correctDestination
    );
    if (correctCity) {
      const distanceKm = getDistanceKm(currentCity, correctCity);
      options.push({
        city: correctCity,
        isCorrectPath: true,
        distanceKm,
        travelHours: getTravelHours(distanceKm),
      });
    }
  }

  // Wrong destinations (decoys)
  // Note: Wrong destinations may reference cities not in the main path
  // For now, we need city data for wrong destinations in the case data
  if (currentCity.wrongDestinations) {
    currentCity.wrongDestinations.forEach((cityId) => {
      // Try to find in cities array first
      let wrongCity = context.currentCase.cities.find((c) => c.id === cityId);

      // If not found, might need to look up from a global cities database
      // For now, skip if not found
      if (wrongCity) {
        const distanceKm = getDistanceKm(currentCity, wrongCity);
        options.push({
          city: wrongCity,
          isCorrectPath: false,
          distanceKm,
          travelHours: getTravelHours(distanceKm),
        });
      }
    });
  }

  return options;
}

export default useGameMachine;
