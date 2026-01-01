const SAVE_VERSION = '1.0.0';
const STORAGE_KEY = 'carmen-save-state';
const PROFILE_KEY = 'carmen-profile'; // Keep existing for migration

/**
 * Save state schema
 */
export const createSaveState = (gameState) => ({
  version: SAVE_VERSION,
  savedAt: new Date().toISOString(),
  profile: {
    karma: gameState.karma,
    notoriety: gameState.notoriety,
    solvedCases: gameState.solvedCases,
    savedNPCs: gameState.savedNPCs,
    injuries: gameState.permanentInjuries
  },
  activeCase: gameState.currentCase ? {
    case: gameState.currentCase,
    currentCityIndex: gameState.currentCityIndex,
    timeRemaining: gameState.timeRemaining,
    currentHour: gameState.currentHour,
    collectedClues: gameState.collectedClues,
    investigatedLocations: gameState.investigatedLocations,
    selectedWarrant: gameState.selectedWarrant,
    usedGadgets: gameState.usedGadgets,
    hadGoodDeedInCase: gameState.hadGoodDeedInCase,
    hadEncounterInCity: gameState.hadEncounterInCity,
    rogueUsedInCity: gameState.rogueUsedInCity,
    selectedTraits: gameState.selectedTraits,
    wrongCity: gameState.wrongCity,
    wrongCityData: gameState.wrongCityData
  } : null
});

/**
 * Load save state with version checking
 */
export const loadSaveState = () => {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (!saved) {
      // Migrate from old profile-only save
      return migrateLegacyProfile();
    }

    const state = JSON.parse(saved);

    // Version check
    if (state.version !== SAVE_VERSION) {
      console.warn(`Save version mismatch: ${state.version} !== ${SAVE_VERSION}`);
      // Keep profile, discard active case
      return {
        profile: state.profile,
        activeCase: null,
        versionMismatch: true,
        oldVersion: state.version
      };
    }

    return {
      profile: state.profile,
      activeCase: state.activeCase,
      versionMismatch: false
    };
  } catch (error) {
    console.error('Failed to load save state:', error);
    return { profile: null, activeCase: null, error: true };
  }
};

/**
 * Save state with debouncing
 */
let saveTimeout;
export const saveState = (gameState, immediate = false) => {
  const doSave = () => {
    try {
      const state = createSaveState(gameState);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch (error) {
      console.error('Failed to save state:', error);
    }
  };

  if (immediate) {
    doSave();
  } else {
    clearTimeout(saveTimeout);
    saveTimeout = setTimeout(doSave, 500);
  }
};

/**
 * Migrate legacy profile-only save
 */
const migrateLegacyProfile = () => {
  try {
    const legacyProfile = localStorage.getItem(PROFILE_KEY);
    if (legacyProfile) {
      const profile = JSON.parse(legacyProfile);
      // Clean up old key
      localStorage.removeItem(PROFILE_KEY);
      return { profile, activeCase: null, migrated: true };
    }
  } catch (error) {
    console.error('Failed to migrate legacy profile:', error);
  }
  return { profile: null, activeCase: null };
};

/**
 * Clear all save data (for testing/reset)
 */
export const clearSaveState = () => {
  localStorage.removeItem(STORAGE_KEY);
  localStorage.removeItem(PROFILE_KEY);
};
