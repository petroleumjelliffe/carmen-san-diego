/**
 * Action functions for the game state machine
 * Uses XState's assign() for state mutations
 */
import { assign } from 'xstate';

// ============================================
// CASE INITIALIZATION
// ============================================

export const initializeCase = assign((ctx, event) => ({
  currentCase: event.caseData,
  cityIndex: 0,
  currentCityId: event.caseData.cities[0].id,
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

export const loadSavedState = assign((ctx, event) => ({
  ...ctx,
  ...event.savedContext,
}));

// ============================================
// TIME MANAGEMENT (centralized)
// ============================================

export const advanceTimeToMorning = assign((ctx) => {
  const hoursUntil7am =
    ctx.currentHour >= 23
      ? 24 - ctx.currentHour + 7
      : 7 - ctx.currentHour;
  return {
    currentHour: 7,
    timeRemaining: ctx.timeRemaining - hoursUntil7am,
    lastSleepMessage: `You rested for ${hoursUntil7am} hours.`,
  };
});

export const advanceTimeForTravel = assign((ctx) => {
  const hours = ctx.travelHours || 4;
  return {
    currentHour: (ctx.currentHour + hours) % 24,
    timeRemaining: ctx.timeRemaining - hours,
  };
});

export const advanceTimeForInvestigation = assign((ctx) => {
  // Progressive cost: 2h, 4h, 8h
  const hours = [2, 4, 8][Math.min(ctx.spotsUsedInCity, 2)];
  return {
    currentHour: (ctx.currentHour + hours) % 24,
    timeRemaining: ctx.timeRemaining - hours,
  };
});

// ============================================
// SLEEP
// ============================================

export const calculateSleepTimeout = assign((ctx) => {
  const hoursUntil7am =
    ctx.currentHour >= 23
      ? 24 - ctx.currentHour + 7
      : 7 - ctx.currentHour;
  return {
    sleepWouldTimeout: ctx.timeRemaining <= hoursUntil7am,
  };
});

export const setSleepMessage = assign((ctx) => {
  const hoursUntil7am =
    ctx.currentHour >= 23
      ? 24 - ctx.currentHour + 7
      : 7 - ctx.currentHour;
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

export const setTravelDestination = assign((ctx, event) => ({
  travelHours: event.travelHours,
  travelDestination: event.destinationId,
  isCorrectPath: event.isCorrectPath,
  // Store origin for wrong city return
  originCityId: ctx.currentCityId,
}));

export const updateLocation = assign((ctx) => {
  // NOTE: Reads from context, not event. ARRIVE event has no payload.
  // Data was stored by setTravelDestination when TRAVEL was sent.

  // Determine if this is a return from wrong city
  const isReturningFromWrongCity =
    ctx.wrongCity && ctx.travelDestination === ctx.originCityId;

  if (isReturningFromWrongCity) {
    // Returning to correct path - don't change cityIndex
    return {
      currentCityId: ctx.travelDestination,
      wrongCity: false,
      travelHours: null,
      travelDestination: null,
      isCorrectPath: null,
    };
  }

  // Normal travel
  return {
    cityIndex: ctx.isCorrectPath ? ctx.cityIndex + 1 : ctx.cityIndex,
    currentCityId: ctx.travelDestination,
    wrongCity: !ctx.isCorrectPath,
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

export const setInvestigationParams = assign((ctx, event) => ({
  pendingRogueAction: event.isRogueAction || false,
  currentSpotIndex: event.spotIndex,
}));

export const recordInvestigation = assign((ctx) => ({
  // NOTE: Uses ctx.currentSpotIndex set by setInvestigationParams
  investigatedSpots: [
    ...ctx.investigatedSpots,
    `${ctx.currentCityId}:${ctx.currentSpotIndex}`,
  ],
  spotsUsedInCity: ctx.spotsUsedInCity + 1,
  currentSpotIndex: null,
}));

// ============================================
// ENCOUNTER SETUP
// ============================================

export const setHenchmanEncounter = assign((ctx) => ({
  encounterType: 'henchman',
  encounterChoice: 'pending',
  encounterQueue: ctx.pendingRogueAction ? ['rogueAction'] : [],
}));

export const setAssassinationEncounter = assign((ctx) => ({
  encounterType: 'assassination',
  encounterChoice: 'pending',
  encounterQueue: ctx.pendingRogueAction ? ['rogueAction'] : [],
}));

export const setRogueEncounter = assign({
  encounterType: 'rogueAction',
  encounterQueue: [],
  witnessClueVariant: 'rogue',
  // Rogue action increases notoriety
  notoriety: (ctx) => ctx.notoriety + 1,
});

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

export const setEncounterChoice = assign((ctx, event) => ({
  encounterChoice: event.type === 'CHOOSE_GADGET' ? 'gadget' : 'endure',
}));

export const useGadget = assign((ctx, event) => ({
  usedGadgets: [...ctx.usedGadgets, event.gadgetId],
  availableGadgets: ctx.availableGadgets.filter((g) => g.id !== event.gadgetId),
}));

export const applyInjury = assign((ctx) => ({
  wounds: ctx.wounds + 1,
}));

export const applyTimePenalty = assign((ctx) => ({
  // Lose 2 extra hours when taking injury
  timeRemaining: ctx.timeRemaining - 2,
  currentHour: (ctx.currentHour + 2) % 24,
}));

export const increaseKarma = assign((ctx) => ({
  karma: ctx.karma + 1,
}));

export const markGoodDeedComplete = assign({
  hadGoodDeedInCase: true,
});

export const popRogueFromQueue = assign((ctx) => ({
  encounterType: 'rogueAction',
  encounterQueue: ctx.encounterQueue.slice(1),
  witnessClueVariant: 'rogue',
}));

export const markEncounterComplete = assign((ctx) => ({
  hadEncounterInCity: ['henchman', 'assassination'].includes(ctx.encounterType)
    ? true
    : ctx.hadEncounterInCity,
  rogueUsedInCity:
    ctx.encounterType === 'rogueAction' ? true : ctx.rogueUsedInCity,
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

export const determineTrialOutcome = assign((ctx) => {
  let outcome;
  if (!ctx.warrantIssued) {
    outcome = 'no_warrant';
  } else if (ctx.selectedWarrant?.id !== ctx.currentCase?.suspect.id) {
    outcome = 'wrong_warrant';
  } else {
    outcome = 'success';
  }
  return { debriefOutcome: outcome };
});

export const setTimeOutOutcome = assign({
  debriefOutcome: 'time_out',
});

export const updateStats = assign((ctx) => {
  if (ctx.debriefOutcome === 'success') {
    return {
      solvedCases: [...ctx.solvedCases, ctx.currentCase?.id],
      karma: ctx.karma + 5, // Bonus for solving
    };
  }
  return {
    notoriety: ctx.notoriety + 1, // Failed case increases notoriety
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

export const saveGame = (ctx) => {
  // Side effect: persist to localStorage
  const saveData = {
    // Persistent
    karma: ctx.karma,
    notoriety: ctx.notoriety,
    solvedCases: ctx.solvedCases,

    // Case state (only if in case)
    ...(ctx.currentCase && {
      currentCase: ctx.currentCase,
      cityIndex: ctx.cityIndex,
      currentCityId: ctx.currentCityId,
      wrongCity: ctx.wrongCity,
      originCityId: ctx.originCityId,
      currentHour: ctx.currentHour,
      timeRemaining: ctx.timeRemaining,
      investigatedSpots: ctx.investigatedSpots,
      spotsUsedInCity: ctx.spotsUsedInCity,
      hadEncounterInCity: ctx.hadEncounterInCity,
      hadGoodDeedInCase: ctx.hadGoodDeedInCase,
      rogueUsedInCity: ctx.rogueUsedInCity,
      warrantIssued: ctx.warrantIssued,
      selectedWarrant: ctx.selectedWarrant,
      availableGadgets: ctx.availableGadgets,
      usedGadgets: ctx.usedGadgets,
      wounds: ctx.wounds,
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
