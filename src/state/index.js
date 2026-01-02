/**
 * State machine exports
 *
 * Central export point for the game state machine and related utilities.
 */

// Main machine
export { gameMachine } from './gameMachine.js';

// Types and utilities
export {
  initialContext,
  getDistanceKm,
  getTravelHours,
  toRad,
} from './types.js';

// Guards (for testing/debugging)
export { guards } from './guards.js';

// Actions (for testing/debugging)
export { actions } from './actions.js';
