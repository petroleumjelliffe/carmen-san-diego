/**
 * Guard function tests
 *
 * Tests all guard functions against the rules specified in docs/game-states.md
 */
import { describe, it, expect } from 'vitest';
import {
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
} from './guards.js';
import { createMockContext } from '../test/factories/createMockCase.js';

// Helper to create minimal context using the shared factory
// This ensures all test mocks match the production data structure
const createContext = (overrides = {}) => createMockContext(overrides);

// ============================================
// TIME CHECKS
// ============================================

describe('isSleepTime', () => {
  it('returns true at 11pm (23:00)', () => {
    expect(isSleepTime({ context: createContext({ currentHour: 23 }) })).toBe(true);
  });

  it('returns true at midnight', () => {
    expect(isSleepTime({ context: createContext({ currentHour: 0 }) })).toBe(true);
  });

  it('returns true at 3am', () => {
    expect(isSleepTime({ context: createContext({ currentHour: 3 }) })).toBe(true);
  });

  it('returns true at 6am', () => {
    expect(isSleepTime({ context: createContext({ currentHour: 6 }) })).toBe(true);
  });

  it('returns false at 7am', () => {
    expect(isSleepTime({ context: createContext({ currentHour: 7 }) })).toBe(false);
  });

  it('returns false at noon', () => {
    expect(isSleepTime({ context: createContext({ currentHour: 12 }) })).toBe(false);
  });

  it('returns false at 10pm (22:00)', () => {
    expect(isSleepTime({ context: createContext({ currentHour: 22 }) })).toBe(false);
  });
});

describe('isTimeExpired', () => {
  it('returns true when timeRemaining is 0', () => {
    expect(isTimeExpired({ context: createContext({ timeRemaining: 0 }) })).toBe(true);
  });

  it('returns true when timeRemaining is negative', () => {
    expect(isTimeExpired({ context: createContext({ timeRemaining: -5 }) })).toBe(true);
  });

  it('returns false when timeRemaining is positive', () => {
    expect(isTimeExpired({ context: createContext({ timeRemaining: 1 }) })).toBe(false);
  });
});

describe('sleepWouldCauseTimeout', () => {
  it('returns true at 11pm with 8 hours remaining (exact match)', () => {
    expect(sleepWouldCauseTimeout({ context: createContext({ currentHour: 23, timeRemaining: 8 }) })).toBe(true);
  });

  it('returns true at 11pm with 5 hours remaining', () => {
    expect(sleepWouldCauseTimeout({ context: createContext({ currentHour: 23, timeRemaining: 5 }) })).toBe(true);
  });

  it('returns false at 11pm with 10 hours remaining', () => {
    expect(sleepWouldCauseTimeout({ context: createContext({ currentHour: 23, timeRemaining: 10 }) })).toBe(false);
  });

  it('returns true at 3am with 4 hours remaining (exact match)', () => {
    expect(sleepWouldCauseTimeout({ context: createContext({ currentHour: 3, timeRemaining: 4 }) })).toBe(true);
  });

  it('returns false at 3am with 10 hours remaining', () => {
    expect(sleepWouldCauseTimeout({ context: createContext({ currentHour: 3, timeRemaining: 10 }) })).toBe(false);
  });
});

// ============================================
// LOCATION CHECKS
// ============================================

describe('isFinalCity', () => {
  it('returns true at last city (index 4 of 5 cities)', () => {
    expect(isFinalCity({ context: createContext({ cityIndex: 4 }) })).toBe(true);
  });

  it('returns false at first city', () => {
    expect(isFinalCity({ context: createContext({ cityIndex: 0 }) })).toBe(false);
  });

  it('returns false at middle city', () => {
    expect(isFinalCity({ context: createContext({ cityIndex: 2 }) })).toBe(false);
  });

  it('returns false when no case', () => {
    expect(isFinalCity({ context: createContext({ currentCase: null }) })).toBe(false);
  });
});

describe('isWrongCity', () => {
  it('returns true when wrongCity is true', () => {
    expect(isWrongCity({ context: createContext({ wrongCity: true }) })).toBe(true);
  });

  it('returns false when wrongCity is false', () => {
    expect(isWrongCity({ context: createContext({ wrongCity: false }) })).toBe(false);
  });
});

describe('isCity1', () => {
  it('returns true at first city (index 0)', () => {
    expect(isCity1({ context: createContext({ cityIndex: 0 }) })).toBe(true);
  });

  it('returns false at second city', () => {
    expect(isCity1({ context: createContext({ cityIndex: 1 }) })).toBe(false);
  });
});

describe('isCities2ToNMinus1', () => {
  it('returns true at city 2 (index 1)', () => {
    expect(isCities2ToNMinus1({ context: createContext({ cityIndex: 1 }) })).toBe(true);
  });

  it('returns true at city 3 (index 2)', () => {
    expect(isCities2ToNMinus1({ context: createContext({ cityIndex: 2 }) })).toBe(true);
  });

  it('returns true at city n-1 (index 3 of 5)', () => {
    expect(isCities2ToNMinus1({ context: createContext({ cityIndex: 3 }) })).toBe(true);
  });

  it('returns false at city 1 (index 0)', () => {
    expect(isCities2ToNMinus1({ context: createContext({ cityIndex: 0 }) })).toBe(false);
  });

  it('returns false at final city (index 4 of 5)', () => {
    expect(isCities2ToNMinus1({ context: createContext({ cityIndex: 4 }) })).toBe(false);
  });
});

// ============================================
// INVESTIGATION SPOTS
// ============================================

describe('hasAvailableSpots', () => {
  it('returns true when no spots used', () => {
    expect(hasAvailableSpots({ context: createContext({ spotsUsedInCity: 0 }) })).toBe(true);
  });

  it('returns true when some spots used', () => {
    expect(hasAvailableSpots({ context: createContext({ spotsUsedInCity: 2 }) })).toBe(true);
  });

  it('returns false when all spots used', () => {
    expect(hasAvailableSpots({ context: createContext({ spotsUsedInCity: 3 }) })).toBe(false);
  });

  it('returns false when no case', () => {
    expect(hasAvailableSpots({ context: createContext({ currentCase: null }) })).toBe(false);
  });
});

// ============================================
// ENCOUNTER ROUTING
// ============================================

describe('shouldApprehend', () => {
  // Spec: "Final city, assassination done" triggers apprehension
  it('returns true at final city after assassination (hadEncounterInCity)', () => {
    expect(shouldApprehend({
      context: createContext({
        cityIndex: 4,
        hadEncounterInCity: true,
      }),
    })).toBe(true);
  });

  it('returns false at final city before assassination', () => {
    expect(shouldApprehend({
      context: createContext({
        cityIndex: 4,
        hadEncounterInCity: false,
      }),
    })).toBe(false);
  });

  it('returns false at non-final city', () => {
    expect(shouldApprehend({
      context: createContext({
        cityIndex: 2,
        hadEncounterInCity: true,
      }),
    })).toBe(false);
  });
});

describe('shouldHenchman', () => {
  // Spec: "Cities 2 to n-1, not wrong city, first investigation in city"
  it('returns true at city 2, first investigation, correct path', () => {
    expect(shouldHenchman({
      context: createContext({
        cityIndex: 1,
        wrongCity: false,
        hadEncounterInCity: false,
      }),
    })).toBe(true);
  });

  it('returns false at city 1 (no henchman at first city)', () => {
    expect(shouldHenchman({
      context: createContext({
        cityIndex: 0,
        wrongCity: false,
        hadEncounterInCity: false,
      }),
    })).toBe(false);
  });

  it('returns false at final city (assassination instead)', () => {
    expect(shouldHenchman({
      context: createContext({
        cityIndex: 4,
        wrongCity: false,
        hadEncounterInCity: false,
      }),
    })).toBe(false);
  });

  it('returns false when in wrong city', () => {
    expect(shouldHenchman({
      context: createContext({
        cityIndex: 2,
        wrongCity: true,
        hadEncounterInCity: false,
      }),
    })).toBe(false);
  });

  it('returns false after encounter already happened', () => {
    expect(shouldHenchman({
      context: createContext({
        cityIndex: 2,
        wrongCity: false,
        hadEncounterInCity: true,
      }),
    })).toBe(false);
  });
});

describe('shouldAssassination', () => {
  // Spec: "Final city, first investigation"
  it('returns true at final city, first investigation', () => {
    expect(shouldAssassination({
      context: createContext({
        cityIndex: 4,
        hadEncounterInCity: false,
      }),
    })).toBe(true);
  });

  it('returns false at final city after encounter', () => {
    expect(shouldAssassination({
      context: createContext({
        cityIndex: 4,
        hadEncounterInCity: true,
      }),
    })).toBe(false);
  });

  it('returns false at non-final city', () => {
    expect(shouldAssassination({
      context: createContext({
        cityIndex: 2,
        hadEncounterInCity: false,
      }),
    })).toBe(false);
  });
});

describe('shouldRogueActionAlone', () => {
  // Spec: "Player-initiated, not used in city" AND no mandatory encounter queued
  it('returns true when rogue action pending, not used, no queue', () => {
    expect(shouldRogueActionAlone({
      context: createContext({
        pendingRogueAction: true,
        rogueUsedInCity: false,
        encounterQueue: [],
      }),
    })).toBe(true);
  });

  it('returns false when not pending', () => {
    expect(shouldRogueActionAlone({
      context: createContext({
        pendingRogueAction: false,
        rogueUsedInCity: false,
        encounterQueue: [],
      }),
    })).toBe(false);
  });

  it('returns false when already used in city', () => {
    expect(shouldRogueActionAlone({
      context: createContext({
        pendingRogueAction: true,
        rogueUsedInCity: true,
        encounterQueue: [],
      }),
    })).toBe(false);
  });

  it('returns false when encounter queue has items (stacking scenario)', () => {
    expect(shouldRogueActionAlone({
      context: createContext({
        pendingRogueAction: true,
        rogueUsedInCity: false,
        encounterQueue: ['rogueAction'],
      }),
    })).toBe(false);
  });
});

describe('shouldGoodDeed', () => {
  // Spec: "Not wrong city, not first investigation, dice roll"
  // IMPORTANT: Check happens AFTER spotsUsedInCity is incremented by recordInvestigation

  it('returns false on first investigation (spotsUsedInCity = 1 after increment)', () => {
    // After first investigation, spotsUsedInCity = 1
    // Guard checks spotsUsedInCity > 1, so 1 > 1 = false
    expect(shouldGoodDeed({
      context: createContext({
        spotsUsedInCity: 1, // After recording first investigation
        wrongCity: false,
        hadGoodDeedInCase: false,
        goodDeedRoll: 0.1, // Would pass dice check
      }),
    })).toBe(false);
  });

  it('returns true on second investigation with passing dice roll', () => {
    // After second investigation, spotsUsedInCity = 2
    // Guard checks spotsUsedInCity > 1, so 2 > 1 = true
    expect(shouldGoodDeed({
      context: createContext({
        spotsUsedInCity: 2, // After recording second investigation
        wrongCity: false,
        hadGoodDeedInCase: false,
        goodDeedRoll: 0.1, // 10% < 30% = pass
      }),
    })).toBe(true);
  });

  it('returns false on second investigation with failing dice roll', () => {
    expect(shouldGoodDeed({
      context: createContext({
        spotsUsedInCity: 2,
        wrongCity: false,
        hadGoodDeedInCase: false,
        goodDeedRoll: 0.5, // 50% >= 30% = fail
      }),
    })).toBe(false);
  });

  it('returns false in wrong city', () => {
    expect(shouldGoodDeed({
      context: createContext({
        spotsUsedInCity: 2,
        wrongCity: true,
        hadGoodDeedInCase: false,
        goodDeedRoll: 0.1,
      }),
    })).toBe(false);
  });

  it('returns false if good deed already happened in case', () => {
    expect(shouldGoodDeed({
      context: createContext({
        spotsUsedInCity: 2,
        wrongCity: false,
        hadGoodDeedInCase: true,
        goodDeedRoll: 0.1,
      }),
    })).toBe(false);
  });

  it('returns false if dice not rolled yet', () => {
    expect(shouldGoodDeed({
      context: createContext({
        spotsUsedInCity: 2,
        wrongCity: false,
        hadGoodDeedInCase: false,
        goodDeedRoll: null,
      }),
    })).toBe(false);
  });
});

// ============================================
// ENCOUNTER TYPE CHECKS
// ============================================

describe('requiresGadgetChoice', () => {
  it('returns true for henchman encounter', () => {
    expect(requiresGadgetChoice({ context: createContext({ encounterType: 'henchman' }) })).toBe(true);
  });

  it('returns true for assassination encounter', () => {
    expect(requiresGadgetChoice({ context: createContext({ encounterType: 'assassination' }) })).toBe(true);
  });

  it('returns false for goodDeed encounter', () => {
    expect(requiresGadgetChoice({ context: createContext({ encounterType: 'goodDeed' }) })).toBe(false);
  });

  it('returns false for rogueAction encounter', () => {
    expect(requiresGadgetChoice({ context: createContext({ encounterType: 'rogueAction' }) })).toBe(false);
  });
});

describe('isGoodDeed', () => {
  it('returns true when encounterType is goodDeed', () => {
    expect(isGoodDeed({ context: createContext({ encounterType: 'goodDeed' }) })).toBe(true);
  });

  it('returns false for other encounter types', () => {
    expect(isGoodDeed({ context: createContext({ encounterType: 'henchman' }) })).toBe(false);
  });
});

describe('isApprehension', () => {
  it('returns true when encounterType is apprehension', () => {
    expect(isApprehension({ context: createContext({ encounterType: 'apprehension' }) })).toBe(true);
  });

  it('returns false for other encounter types', () => {
    expect(isApprehension({ context: createContext({ encounterType: 'henchman' }) })).toBe(false);
  });
});

describe('isTimeOut', () => {
  it('returns true when encounterType is timeOut', () => {
    expect(isTimeOut({ context: createContext({ encounterType: 'timeOut' }) })).toBe(true);
  });

  it('returns false for other encounter types', () => {
    expect(isTimeOut({ context: createContext({ encounterType: 'henchman' }) })).toBe(false);
  });
});

describe('hasStackedRogueAction', () => {
  it('returns true when rogue action is first in queue', () => {
    expect(hasStackedRogueAction({
      context: createContext({ encounterQueue: ['rogueAction'] }),
    })).toBe(true);
  });

  it('returns false when queue is empty', () => {
    expect(hasStackedRogueAction({
      context: createContext({ encounterQueue: [] }),
    })).toBe(false);
  });

  it('returns false when other item is first in queue', () => {
    expect(hasStackedRogueAction({
      context: createContext({ encounterQueue: ['something'] }),
    })).toBe(false);
  });
});

// ============================================
// GADGETS
// ============================================

describe('hasAvailableGadget', () => {
  it('returns true when gadget exists', () => {
    expect(hasAvailableGadget({
      context: createContext({
        availableGadgets: [{ id: 'gadget-1' }, { id: 'gadget-2' }],
      }),
      event: { gadgetId: 'gadget-1' },
    })).toBe(true);
  });

  it('returns false when gadget does not exist', () => {
    expect(hasAvailableGadget({
      context: createContext({
        availableGadgets: [{ id: 'gadget-1' }],
      }),
      event: { gadgetId: 'gadget-99' },
    })).toBe(false);
  });

  it('returns false when no gadgets available', () => {
    expect(hasAvailableGadget({
      context: createContext({
        availableGadgets: [],
      }),
      event: { gadgetId: 'gadget-1' },
    })).toBe(false);
  });
});

describe('hasAnyGadgets', () => {
  it('returns true when gadgets available', () => {
    expect(hasAnyGadgets({
      context: createContext({
        availableGadgets: [{ id: 'gadget-1' }],
      }),
    })).toBe(true);
  });

  it('returns false when no gadgets', () => {
    expect(hasAnyGadgets({
      context: createContext({
        availableGadgets: [],
      }),
    })).toBe(false);
  });
});
