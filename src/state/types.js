/**
 * Type definitions for the Carmen Sandiego game state machine
 * Uses JSDoc for type hints in JavaScript
 */

/**
 * @typedef {'menu' | 'briefing' | 'playing' | 'apprehended' | 'trial' | 'debrief'} GameState
 */

/**
 * @typedef {'checkingIdle' | 'idle' | 'sleepWarning' | 'confirmingSleep' | 'sleeping' | 'traveling' | 'investigating' | 'encounter' | 'witnessClue'} ActivityState
 */

/**
 * @typedef {'henchman' | 'assassination' | 'goodDeed' | 'rogueAction' | 'apprehension' | 'timeOut' | null} EncounterType
 */

/**
 * @typedef {'normal' | 'rogue'} WitnessClueVariant
 */

/**
 * @typedef {'pending' | 'gadget' | 'endure' | null} EncounterChoice
 */

/**
 * @typedef {Object} Suspect
 * @property {string} id
 * @property {string} name
 * @property {string} description
 * @property {string[]} traits - Physical/behavioral traits for clues
 */

/**
 * @typedef {Object} Gadget
 * @property {string} id
 * @property {string} name
 * @property {string} description
 * @property {boolean} singleUse - Most gadgets are single-use
 */

/**
 * @typedef {Object} InvestigationSpot
 * @property {string} id - e.g., "informant", "police"
 * @property {string} name - Display name
 * @property {number} time_cost - Hours to investigate
 * @property {string[]} gives - ["suspect"] or ["destination"] or both
 * @property {number} [lat] - Optional coordinates for map display
 * @property {number} [lon] - Optional coordinates for map display
 */

/**
 * City data for a specific city in the case trail.
 * IMPORTANT: This is NOT the same as the cities array!
 * The cities array contains city ID strings, cityData contains these objects.
 *
 * @typedef {Object} CityData
 * @property {string} cityId - e.g., "paris", "tokyo"
 * @property {string} cityName - Display name
 * @property {boolean} isFinalCity - Whether this is the last city in the trail
 * @property {InvestigationSpot[]} investigationSpots - Array of spot objects (NOT a number!)
 * @property {Object|null} encounter - Henchman or assassination encounter for this city
 * @property {Object|null} rogueAction - Rogue action available in this city
 * @property {Object|null} hotel - City's hotel landmark for player location
 * @property {Object|null} rogueLocation - Location for rogue action
 * @property {Object[]} [destinations] - Available destinations from this city (non-final only)
 */

/**
 * Case data structure produced by caseGenerator.js.
 *
 * CRITICAL: cities is an array of city ID STRINGS, NOT CityData objects!
 * CityData objects are in a SEPARATE cityData array that runs parallel to cities.
 *
 * @typedef {Object} CaseData
 * @property {Suspect} suspect
 * @property {string[]} cities - Array of city ID strings like ["paris", "tokyo"] (NOT objects!)
 * @property {CityData[]} cityData - Parallel array with city-specific data (same length as cities)
 * @property {number} totalCities
 * @property {Gadget[]} [gadgets] - Gadgets available for this case
 * @property {Object} [stolenItem] - The item that was stolen
 * @property {string[]} [traitOrder] - Order to reveal suspect traits
 */

/**
 * @typedef {Object} GameContext
 * @property {number} karma - Persistent across cases
 * @property {number} notoriety - Persistent across cases
 * @property {string[]} solvedCases - Case IDs
 * @property {CaseData|null} currentCase
 * @property {number} currentHour - 0-23
 * @property {number} timeRemaining - Hours left in case
 * @property {number} cityIndex - Index in currentCase.cities
 * @property {string|null} currentCityId - Current city ID for lookups
 * @property {boolean} wrongCity
 * @property {string|null} originCityId - Where we came from (for wrong city return)
 * @property {string|null} travelDestination - Where we're traveling to
 * @property {boolean|null} isCorrectPath - Whether current travel is on correct path
 * @property {string[]} investigatedSpots - Format: "cityId:spotIndex"
 * @property {number} spotsUsedInCity - Count for current city
 * @property {number|null} currentSpotIndex - Spot being investigated (transient)
 * @property {boolean} hadEncounterInCity
 * @property {boolean} hadGoodDeedInCase
 * @property {boolean} rogueUsedInCity
 * @property {boolean} warrantIssued
 * @property {Suspect|null} selectedWarrant
 * @property {Gadget[]} availableGadgets
 * @property {Gadget[]} usedGadgets
 * @property {number} wounds - Injury count
 * @property {EncounterType} encounterType
 * @property {EncounterType[]} encounterQueue - For stacking
 * @property {EncounterChoice} encounterChoice - Resolution choice
 * @property {WitnessClueVariant|null} witnessClueVariant
 * @property {boolean} pendingRogueAction
 * @property {number|null} travelHours
 * @property {number|null} goodDeedRoll
 * @property {string|null} lastSleepMessage
 * @property {boolean} sleepWouldTimeout - Warning flag
 * @property {'time_out' | 'no_warrant' | 'wrong_warrant' | 'success' | null} debriefOutcome
 */

/**
 * Initial context for the game machine
 * @type {GameContext}
 */
export const initialContext = {
  // Persistent
  karma: 0,
  notoriety: 0,
  solvedCases: [],

  // Case
  currentCase: null,

  // Time
  currentHour: 8,
  timeRemaining: 72,

  // Location
  cityIndex: 0,
  currentCityId: null,
  wrongCity: false,
  originCityId: null,
  travelDestination: null,
  isCorrectPath: null,

  // Investigation
  investigatedSpots: [],
  spotsUsedInCity: 0,
  currentSpotIndex: null,

  // Progress flags
  hadEncounterInCity: false,
  hadGoodDeedInCase: false,
  rogueUsedInCity: false,
  warrantIssued: false,
  selectedWarrant: null,

  // Gadgets & Health
  availableGadgets: [],
  usedGadgets: [],
  wounds: 0,

  // Activity state
  encounterType: null,
  encounterQueue: [],
  encounterChoice: null,
  witnessClueVariant: null,
  pendingRogueAction: false,
  travelHours: null,
  goodDeedRoll: null,

  // UI
  lastSleepMessage: null,
  sleepWouldTimeout: false,
  debriefOutcome: null,
};

/**
 * Helper: Convert degrees to radians
 * @param {number} degrees
 * @returns {number}
 */
export function toRad(degrees) {
  return degrees * (Math.PI / 180);
}

/**
 * Calculate Haversine distance between two lat/lng points
 * @param {{ lat: number, lng: number }} from
 * @param {{ lat: number, lng: number }} to
 * @returns {number} Distance in kilometers
 */
export function getDistanceKm(from, to) {
  const R = 6371; // Earth's radius in km
  const dLat = toRad(to.lat - from.lat);
  const dLng = toRad(to.lng - from.lng);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(from.lat)) *
      Math.cos(toRad(to.lat)) *
      Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

/**
 * Convert distance to travel hours
 * @param {number} distanceKm
 * @returns {number} Hours (2-16)
 */
export function getTravelHours(distanceKm) {
  // ~800 km/h average (accounts for airports, connections)
  // Minimum 2 hours (short hops still take time)
  // Maximum 16 hours (longest intercontinental)
  const hours = Math.round(distanceKm / 800);
  return Math.max(2, Math.min(16, hours));
}
