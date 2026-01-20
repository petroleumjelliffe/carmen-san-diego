/**
 * Pure guard functions for the game state machine
 *
 * XState v5 signature: ({ context, event }) => boolean
 */

// === Time checks ===

export const isSleepTime = ({ context }) =>
  false; // DISABLED: No sleep UI exists yet, so disable sleep transitions
  // TODO: Re-enable when sleep dialog is implemented
  // context.currentHour >= 23 || context.currentHour < 7;

export const isTimeExpired = ({ context }) => context.timeRemaining <= 0;

export const sleepWouldCauseTimeout = ({ context }) => {
  const hoursUntil7am =
    context.currentHour >= 23
      ? 24 - context.currentHour + 7
      : 7 - context.currentHour;
  return context.timeRemaining <= hoursUntil7am;
};

// === Location checks ===

export const isFinalCity = ({ context }) =>
  !!(context.currentCase && context.cityIndex === context.currentCase.totalCities - 1);

export const isWrongCity = ({ context }) => context.wrongCity;

export const isCity1 = ({ context }) => context.cityIndex === 0;

export const isCities2ToNMinus1 = ({ context }) =>
  context.currentCase &&
  context.cityIndex >= 1 &&
  context.cityIndex < context.currentCase.totalCities - 1;

// === Investigation spots ===

export const hasAvailableSpots = ({ context }) => {
  if (!context.currentCase) return false;
  // Note: cities is an array of city ID strings, cityData has the actual data
  const cityData = context.currentCase.cityData?.[context.cityIndex];
  if (!cityData) return false;
  const totalSpots = cityData.investigationSpots?.length || 3;
  console.log('[DEBUG] hasAvailableSpots:', {
    spotsUsedInCity: context.spotsUsedInCity,
    totalSpots,
    result: context.spotsUsedInCity < totalSpots,
  });
  return context.spotsUsedInCity < totalSpots;
};

// === Investigation routing ===

export const shouldApprehend = ({ context }) =>
  context.currentCase &&
  context.cityIndex === context.currentCase.totalCities - 1 &&
  context.hadEncounterInCity;

export const shouldHenchman = ({ context }) =>
  context.currentCase &&
  context.cityIndex >= 1 &&
  context.cityIndex < context.currentCase.totalCities - 1 &&
  !context.wrongCity &&
  !context.hadEncounterInCity;

export const shouldAssassination = ({ context }) =>
  context.currentCase &&
  context.cityIndex === context.currentCase.totalCities - 1 &&
  !context.hadEncounterInCity;

export const shouldRogueActionAlone = ({ context }) =>
  context.pendingRogueAction &&
  !context.rogueUsedInCity &&
  context.encounterQueue.length === 0;

export const shouldGoodDeed = ({ context }) =>
  context.spotsUsedInCity > 1 && // 2nd+ investigation (checked AFTER increment)
  !context.wrongCity &&
  !context.hadGoodDeedInCase &&
  context.goodDeedRoll !== null &&
  context.goodDeedRoll < 0.3; // 30% chance

// === Encounter types ===

export const requiresGadgetChoice = ({ context }) =>
  ['henchman', 'assassination'].includes(context.encounterType);

export const isGoodDeed = ({ context }) => context.encounterType === 'goodDeed';

export const isApprehension = ({ context }) => context.encounterType === 'apprehension';

export const isTimeOut = ({ context }) => context.encounterType === 'timeOut';

export const hasStackedRogueAction = ({ context }) =>
  context.encounterQueue.length > 0 && context.encounterQueue[0] === 'rogueAction';

// === Gadgets ===

export const hasAvailableGadget = ({ context, event }) =>
  context.availableGadgets.some((g) => g.id === event.gadgetId);

export const hasAnyGadgets = ({ context }) => context.availableGadgets.length > 0;

// === Trial ===

export const hasNoWarrant = ({ context }) => !context.warrantIssued;

export const hasWrongWarrant = ({ context }) =>
  context.warrantIssued &&
  context.currentCase &&
  context.selectedWarrant?.id !== context.currentCase.suspect.id;

export const hasCorrectWarrant = ({ context }) =>
  context.warrantIssued &&
  context.currentCase &&
  context.selectedWarrant?.id === context.currentCase.suspect.id;

/**
 * All guards as an object for XState machine config
 */
export const guards = {
  isSleepTime,
  isTimeExpired,
  sleepWouldCauseTimeout,
  isFinalCity,
  isWrongCity,
  isCity1,
  isCities2ToNMinus1,
  hasAvailableSpots,
  shouldApprehend,
  shouldHenchman,
  shouldAssassination,
  shouldRogueActionAlone,
  shouldGoodDeed,
  requiresGadgetChoice,
  isGoodDeed,
  isApprehension,
  isTimeOut,
  hasStackedRogueAction,
  hasAvailableGadget,
  hasAnyGadgets,
  hasNoWarrant,
  hasWrongWarrant,
  hasCorrectWarrant,
};

export default guards;
