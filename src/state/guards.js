/**
 * Pure guard functions for the game state machine
 * All guards are (context) => boolean or (context, event) => boolean
 */

// === Time checks ===

export const isSleepTime = (ctx) => ctx.currentHour >= 23 || ctx.currentHour < 7;

export const isTimeExpired = (ctx) => ctx.timeRemaining <= 0;

export const sleepWouldCauseTimeout = (ctx) => {
  const hoursUntil7am =
    ctx.currentHour >= 23
      ? 24 - ctx.currentHour + 7
      : 7 - ctx.currentHour;
  return ctx.timeRemaining <= hoursUntil7am;
};

// === Location checks ===

export const isFinalCity = (ctx) =>
  ctx.currentCase && ctx.cityIndex === ctx.currentCase.totalCities - 1;

export const isWrongCity = (ctx) => ctx.wrongCity;

export const isCity1 = (ctx) => ctx.cityIndex === 0;

export const isCities2ToNMinus1 = (ctx) =>
  ctx.currentCase &&
  ctx.cityIndex >= 1 &&
  ctx.cityIndex < ctx.currentCase.totalCities - 1;

// === Investigation spots ===

export const hasAvailableSpots = (ctx) => {
  if (!ctx.currentCase) return false;
  const city = ctx.currentCase.cities[ctx.cityIndex];
  return ctx.spotsUsedInCity < city.investigationSpots;
};

// === Investigation routing ===

export const shouldApprehend = (ctx) =>
  ctx.currentCase &&
  ctx.cityIndex === ctx.currentCase.totalCities - 1 &&
  ctx.hadEncounterInCity;

export const shouldHenchman = (ctx) =>
  ctx.currentCase &&
  ctx.cityIndex >= 1 &&
  ctx.cityIndex < ctx.currentCase.totalCities - 1 &&
  !ctx.wrongCity &&
  !ctx.hadEncounterInCity;

export const shouldAssassination = (ctx) =>
  ctx.currentCase &&
  ctx.cityIndex === ctx.currentCase.totalCities - 1 &&
  !ctx.hadEncounterInCity;

export const shouldRogueActionAlone = (ctx) =>
  ctx.pendingRogueAction &&
  !ctx.rogueUsedInCity &&
  ctx.encounterQueue.length === 0;

export const shouldGoodDeed = (ctx) =>
  ctx.spotsUsedInCity > 0 && // 2nd+ investigation in this city
  !ctx.wrongCity &&
  !ctx.hadGoodDeedInCase &&
  ctx.goodDeedRoll !== null &&
  ctx.goodDeedRoll < 0.3; // 30% chance

// === Encounter types ===

export const requiresGadgetChoice = (ctx) =>
  ['henchman', 'assassination'].includes(ctx.encounterType);

export const isGoodDeed = (ctx) => ctx.encounterType === 'goodDeed';

export const isApprehension = (ctx) => ctx.encounterType === 'apprehension';

export const isTimeOut = (ctx) => ctx.encounterType === 'timeOut';

export const hasStackedRogueAction = (ctx) =>
  ctx.encounterQueue.length > 0 && ctx.encounterQueue[0] === 'rogueAction';

// === Gadgets ===

export const hasAvailableGadget = (ctx, event) =>
  ctx.availableGadgets.some((g) => g.id === event.gadgetId);

export const hasAnyGadgets = (ctx) => ctx.availableGadgets.length > 0;

// === Trial ===

export const hasNoWarrant = (ctx) => !ctx.warrantIssued;

export const hasWrongWarrant = (ctx) =>
  ctx.warrantIssued &&
  ctx.currentCase &&
  ctx.selectedWarrant?.id !== ctx.currentCase.suspect.id;

export const hasCorrectWarrant = (ctx) =>
  ctx.warrantIssued &&
  ctx.currentCase &&
  ctx.selectedWarrant?.id === ctx.currentCase.suspect.id;

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
