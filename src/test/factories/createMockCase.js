import { validateCaseData } from '../contracts/validateCaseData.js';

/**
 * Deep merge two objects. Arrays are replaced, not merged.
 */
function deepMerge(target, source) {
  const result = { ...target };
  for (const key of Object.keys(source)) {
    if (
      source[key] &&
      typeof source[key] === 'object' &&
      !Array.isArray(source[key])
    ) {
      result[key] = deepMerge(target[key] || {}, source[key]);
    } else {
      result[key] = source[key];
    }
  }
  return result;
}

/**
 * Creates a mock CaseData object matching production structure.
 * Validates structure to catch mismatches early.
 *
 * IMPORTANT: This factory produces the exact structure that caseGenerator.js
 * produces. If this structure changes, update both the generator and this factory.
 *
 * @param {Object} overrides - Properties to override in the default case
 * @returns {Object} A valid CaseData object
 */
export function createMockCase(overrides = {}) {
  const defaults = {
    cities: ['city1', 'city2', 'city3', 'city4', 'city5'],
    cityData: [
      {
        investigationSpots: [{ id: 'spot1' }, { id: 'spot2' }, { id: 'spot3' }],
      },
      {
        investigationSpots: [{ id: 'spot4' }, { id: 'spot5' }, { id: 'spot6' }],
      },
      {
        investigationSpots: [{ id: 'spot7' }, { id: 'spot8' }, { id: 'spot9' }],
      },
      {
        investigationSpots: [
          { id: 'spot10' },
          { id: 'spot11' },
          { id: 'spot12' },
        ],
      },
      {
        investigationSpots: [
          { id: 'spot13' },
          { id: 'spot14' },
          { id: 'spot15' },
        ],
      },
    ],
    totalCities: 5,
    suspect: { id: 'suspect1', name: 'Test Suspect' },
    gadgets: [],
  };

  const merged = deepMerge(defaults, overrides);

  // Validate structure - throws if mock doesn't match expected format
  validateCaseData(merged);

  return merged;
}

/**
 * Creates a mock context for guard/action testing.
 * Uses createMockCase for the currentCase property.
 *
 * @param {Object} overrides - Properties to override (currentCase can be nested overrides)
 * @returns {Object} A valid game context for testing guards/actions
 */
export function createMockContext(overrides = {}) {
  const { currentCase: caseOverrides, ...contextOverrides } = overrides;

  return {
    currentHour: 12,
    timeRemaining: 48,
    currentCase: caseOverrides === null ? null : createMockCase(caseOverrides),
    cityIndex: 0,
    wrongCity: false,
    spotsUsedInCity: 0,
    hadEncounterInCity: false,
    hadGoodDeedInCase: false,
    pendingRogueAction: false,
    rogueUsedInCity: false,
    encounterQueue: [],
    encounterType: null,
    goodDeedRoll: null,
    availableGadgets: [],
    investigatedSpots: [],
    currentCityId: 'city1',
    wounds: 0,
    karma: 0,
    notoriety: 0,
    solvedCases: [],
    warrantIssued: false,
    selectedWarrant: null,
    ...contextOverrides,
  };
}

export default { createMockCase, createMockContext };
