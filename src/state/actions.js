/**
 * Action functions for the game state machine
 * Uses XState v5's assign() for state mutations
 *
 * XState v5 signature: assign(({ context, event }) => ({ ... }))
 */
import { assign } from 'xstate';

// ============================================
// CASE INITIALIZATION
// ============================================

export const initializeCase = assign(({ event }) => ({
  currentCase: event.caseData,
  cityIndex: 0,
  // Note: cities is an array of city ID strings, not objects
  currentCityId: event.caseData.cities[0],
  wrongCity: false,
  originCityId: null,
  travelDestination: null,
  isCorrectPath: null,
  currentHour: 8,
  timeRemaining: 72,
  investigatedSpots: [],
  spotsUsedInCity: 0,
  currentSpotIndex: null,
  hadEncounterInCity: false,
  hadGoodDeedInCase: false,
  rogueUsedInCity: false,
  warrantIssued: false,
  selectedWarrant: null,
  availableGadgets: event.caseData.startingGadgets || [],
  usedGadgets: [],
  wounds: 0,
  encounterType: null,
  encounterQueue: [],
  encounterChoice: null,
  witnessClueVariant: null,
  pendingRogueAction: false,
  travelHours: null,
  goodDeedRoll: null,
  lastSleepMessage: null,
  sleepWouldTimeout: false,
  debriefOutcome: null,
}));

export const loadSavedState = assign(({ context, event }) => ({
  ...context,
  ...event.savedContext,
}));

// ============================================
// TIME MANAGEMENT (centralized)
// ============================================

export const advanceTimeToMorning = assign(({ context }) => {
  const hoursUntil7am =
    context.currentHour >= 23
      ? 24 - context.currentHour + 7
      : 7 - context.currentHour;
  return {
    currentHour: 7,
    timeRemaining: context.timeRemaining - hoursUntil7am,
    lastSleepMessage: `You rested for ${hoursUntil7am} hours.`,
  };
});

export const advanceTimeForTravel = assign(({ context }) => {
  const hours = context.travelHours || 4;
  return {
    currentHour: (context.currentHour + hours) % 24,
    timeRemaining: context.timeRemaining - hours,
  };
});

export const advanceTimeForInvestigation = assign(({ context }) => {
  // Progressive cost: 2h, 4h, 8h
  const hours = [2, 4, 8][Math.min(context.spotsUsedInCity, 2)];
  return {
    currentHour: (context.currentHour + hours) % 24,
    timeRemaining: context.timeRemaining - hours,
  };
});

// ============================================
// SLEEP
// ============================================

export const calculateSleepTimeout = assign(({ context }) => {
  const hoursUntil7am =
    context.currentHour >= 23
      ? 24 - context.currentHour + 7
      : 7 - context.currentHour;
  return {
    sleepWouldTimeout: context.timeRemaining <= hoursUntil7am,
  };
});

export const setSleepMessage = assign(({ context }) => {
  const hoursUntil7am =
    context.currentHour >= 23
      ? 24 - context.currentHour + 7
      : 7 - context.currentHour;
  return {
    lastSleepMessage: `You rested for ${hoursUntil7am} hours.`,
  };
});

// ============================================
// DICE ROLLS
// ============================================

export const rollGoodDeedDice = assign({
  goodDeedRoll: () => Math.random(),
});

// ============================================
// TRAVEL
// ============================================

export const setTravelDestination = assign(({ context, event }) => ({
  travelHours: event.travelHours,
  travelDestination: event.destinationId,
  isCorrectPath: event.isCorrectPath,
  // Store origin for wrong city return
  originCityId: context.currentCityId,
}));

export const updateLocation = assign(({ context }) => {
  // NOTE: Reads from context, not event. ARRIVE event has no payload.
  // Data was stored by setTravelDestination when TRAVEL was sent.

  // Determine if this is a return from wrong city
  const isReturningFromWrongCity =
    context.wrongCity && context.travelDestination === context.originCityId;

  if (isReturningFromWrongCity) {
    // Returning to correct path - don't change cityIndex
    return {
      currentCityId: context.travelDestination,
      wrongCity: false,
      travelHours: null,
      travelDestination: null,
      isCorrectPath: null,
    };
  }

  // Normal travel
  return {
    cityIndex: context.isCorrectPath ? context.cityIndex + 1 : context.cityIndex,
    currentCityId: context.travelDestination,
    wrongCity: !context.isCorrectPath,
    travelHours: null,
    travelDestination: null,
    isCorrectPath: null,
  };
});

export const resetCityFlags = assign({
  hadEncounterInCity: false,
  rogueUsedInCity: false,
  spotsUsedInCity: 0,
});

// ============================================
// INVESTIGATION
// ============================================

export const setInvestigationParams = assign(({ event }) => ({
  pendingRogueAction: event.isRogueAction || false,
  currentSpotIndex: event.spotIndex,
}));

export const recordInvestigation = assign(({ context }) => ({
  // NOTE: Uses context.currentSpotIndex set by setInvestigationParams
  investigatedSpots: [
    ...context.investigatedSpots,
    `${context.currentCityId}:${context.currentSpotIndex}`,
  ],
  spotsUsedInCity: context.spotsUsedInCity + 1,
  currentSpotIndex: null,
}));

// ============================================
// ENCOUNTER SETUP
// ============================================

export const setHenchmanEncounter = assign(({ context }) => ({
  encounterType: 'henchman',
  encounterChoice: 'pending',
  encounterQueue: context.pendingRogueAction ? ['rogueAction'] : [],
}));

export const setAssassinationEncounter = assign(({ context }) => ({
  encounterType: 'assassination',
  encounterChoice: 'pending',
  encounterQueue: context.pendingRogueAction ? ['rogueAction'] : [],
}));

export const setRogueEncounter = assign(({ context }) => ({
  encounterType: 'rogueAction',
  encounterQueue: [],
  witnessClueVariant: 'rogue',
  // Rogue action increases notoriety
  notoriety: context.notoriety + 1,
}));

export const setGoodDeedEncounter = assign({
  encounterType: 'goodDeed',
  encounterQueue: [],
});

export const setApprehensionEncounter = assign({
  encounterType: 'apprehension',
});

export const setTimeOutEncounter = assign({
  encounterType: 'timeOut',
});

// ============================================
// ENCOUNTER RESOLUTION
// ============================================

export const setEncounterChoice = assign(({ event }) => ({
  encounterChoice: event.type === 'CHOOSE_GADGET' ? 'gadget' : 'endure',
}));

export const useGadget = assign(({ context, event }) => ({
  usedGadgets: [...context.usedGadgets, event.gadgetId],
  availableGadgets: context.availableGadgets.filter((g) => g.id !== event.gadgetId),
}));

export const applyInjury = assign(({ context }) => ({
  wounds: context.wounds + 1,
}));

export const applyTimePenalty = assign(({ context }) => ({
  // Lose 2 extra hours when taking injury
  timeRemaining: context.timeRemaining - 2,
  currentHour: (context.currentHour + 2) % 24,
}));

export const increaseKarma = assign(({ context }) => ({
  karma: context.karma + 1,
}));

export const markGoodDeedComplete = assign({
  hadGoodDeedInCase: true,
});

export const popRogueFromQueue = assign(({ context }) => ({
  encounterType: 'rogueAction',
  encounterQueue: context.encounterQueue.slice(1),
  witnessClueVariant: 'rogue',
}));

export const markEncounterComplete = assign(({ context }) => ({
  hadEncounterInCity: ['henchman', 'assassination'].includes(context.encounterType)
    ? true
    : context.hadEncounterInCity,
  rogueUsedInCity:
    context.encounterType === 'rogueAction' ? true : context.rogueUsedInCity,
}));

// ============================================
// WITNESS CLUE
// ============================================

export const setNormalClue = assign({
  witnessClueVariant: 'normal',
});

// ============================================
// TRIAL & DEBRIEF
// ============================================

export const determineTrialOutcome = assign(({ context }) => {
  let outcome;
  if (!context.warrantIssued) {
    outcome = 'no_warrant';
  } else if (context.selectedWarrant?.id !== context.currentCase?.suspect.id) {
    outcome = 'wrong_warrant';
  } else {
    outcome = 'success';
  }
  return { debriefOutcome: outcome };
});

export const setTimeOutOutcome = assign({
  debriefOutcome: 'time_out',
});

export const updateStats = assign(({ context }) => {
  if (context.debriefOutcome === 'success') {
    return {
      solvedCases: [...context.solvedCases, context.currentCase?.id],
      karma: context.karma + 5, // Bonus for solving
    };
  }
  return {
    notoriety: context.notoriety + 1, // Failed case increases notoriety
  };
});

// ============================================
// CLEANUP
// ============================================

export const clearTransientState = assign({
  encounterType: null,
  encounterQueue: [],
  encounterChoice: null,
  witnessClueVariant: null,
  pendingRogueAction: false,
  currentSpotIndex: null,
  travelHours: null,
  travelDestination: null,
  isCorrectPath: null,
  goodDeedRoll: null,
  lastSleepMessage: null,
  sleepWouldTimeout: false,
});

export const clearCaseState = assign({
  currentCase: null,
  cityIndex: 0,
  currentCityId: null,
  wrongCity: false,
  originCityId: null,
  investigatedSpots: [],
  spotsUsedInCity: 0,
  currentSpotIndex: null,
  hadEncounterInCity: false,
  hadGoodDeedInCase: false,
  rogueUsedInCity: false,
  warrantIssued: false,
  selectedWarrant: null,
  availableGadgets: [],
  usedGadgets: [],
  wounds: 0,
  debriefOutcome: null,
});

// ============================================
// PERSISTENCE
// ============================================

export const saveGame = ({ context }) => {
  // Side effect: persist to localStorage
  const saveData = {
    // Persistent
    karma: context.karma,
    notoriety: context.notoriety,
    solvedCases: context.solvedCases,

    // Case state (only if in case)
    ...(context.currentCase && {
      currentCase: context.currentCase,
      cityIndex: context.cityIndex,
      currentCityId: context.currentCityId,
      wrongCity: context.wrongCity,
      originCityId: context.originCityId,
      currentHour: context.currentHour,
      timeRemaining: context.timeRemaining,
      investigatedSpots: context.investigatedSpots,
      spotsUsedInCity: context.spotsUsedInCity,
      hadEncounterInCity: context.hadEncounterInCity,
      hadGoodDeedInCase: context.hadGoodDeedInCase,
      rogueUsedInCity: context.rogueUsedInCity,
      warrantIssued: context.warrantIssued,
      selectedWarrant: context.selectedWarrant,
      availableGadgets: context.availableGadgets,
      usedGadgets: context.usedGadgets,
      wounds: context.wounds,
    }),
  };
  try {
    localStorage.setItem('carmenSandiego_v2_save', JSON.stringify(saveData));
  } catch (e) {
    console.error('Failed to save game:', e);
  }
};

/**
 * All actions as an object for XState machine config
 */
export const actions = {
  initializeCase,
  loadSavedState,
  advanceTimeToMorning,
  advanceTimeForTravel,
  advanceTimeForInvestigation,
  calculateSleepTimeout,
  setSleepMessage,
  rollGoodDeedDice,
  setTravelDestination,
  updateLocation,
  resetCityFlags,
  setInvestigationParams,
  recordInvestigation,
  setHenchmanEncounter,
  setAssassinationEncounter,
  setRogueEncounter,
  setGoodDeedEncounter,
  setApprehensionEncounter,
  setTimeOutEncounter,
  setEncounterChoice,
  useGadget,
  applyInjury,
  applyTimePenalty,
  increaseKarma,
  markGoodDeedComplete,
  popRogueFromQueue,
  markEncounterComplete,
  setNormalClue,
  determineTrialOutcome,
  setTimeOutOutcome,
  updateStats,
  clearTransientState,
  clearCaseState,
  saveGame,
};

export default actions;
