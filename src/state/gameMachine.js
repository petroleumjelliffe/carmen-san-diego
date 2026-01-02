/**
 * Carmen Sandiego XState Game Machine
 *
 * Hierarchical state machine managing all game state transitions.
 * Activity states are nested inside the 'playing' state.
 */
import { createMachine } from 'xstate';
import { initialContext } from './types.js';
import { guards } from './guards.js';
import { actions } from './actions.js';

/**
 * Main game state machine
 *
 * States:
 * - menu: Main menu / case selection
 * - briefing: Case briefing before starting
 * - playing: Active gameplay (contains nested activity states)
 * - apprehended: Suspect in custody, pre-trial
 * - trial: Courtroom verdict
 * - debrief: Post-case summary
 */
export const gameMachine = createMachine(
  {
    id: 'carmenSandiego',
    initial: 'menu',
    context: initialContext,

    states: {
      // ========================================
      // MENU
      // ========================================
      menu: {
        on: {
          START_CASE: {
            target: 'briefing',
            actions: 'initializeCase',
          },
          LOAD_SAVE: {
            target: 'playing',
            actions: 'loadSavedState',
          },
        },
      },

      // ========================================
      // BRIEFING
      // ========================================
      briefing: {
        on: {
          ACCEPT_BRIEFING: {
            target: 'playing',
            actions: 'saveGame',
          },
        },
      },

      // ========================================
      // PLAYING - Contains nested activity states
      // ========================================
      playing: {
        initial: 'checkingIdle',

        states: {
          // Entry point - checks if we should sleep, timeout, or go to idle
          checkingIdle: {
            always: [
              // Check timeout first (after time-consuming action)
              {
                target: 'encounter',
                guard: 'isTimeExpired',
                actions: 'setTimeOutEncounter',
              },
              // Then check sleep time
              {
                target: 'sleepWarning',
                guard: 'isSleepTime',
              },
              { target: 'idle' },
            ],
          },

          // Normal idle state - waiting for player action
          idle: {
            entry: ['saveGame', 'clearTransientState'],
            on: {
              INVESTIGATE: {
                target: 'investigating',
                guard: 'hasAvailableSpots',
                actions: ['setInvestigationParams', 'rollGoodDeedDice'],
              },
              TRAVEL: {
                target: 'traveling',
                actions: 'setTravelDestination',
              },
            },
          },

          // Check if sleeping would cause timeout
          sleepWarning: {
            entry: 'calculateSleepTimeout',
            always: [
              // If sleep would timeout, show warning first
              {
                target: 'confirmingSleep',
                guard: 'sleepWouldCauseTimeout',
              },
              // Otherwise go straight to sleeping
              { target: 'sleeping' },
            ],
          },

          // Warning: sleep will cause timeout
          confirmingSleep: {
            // UI shows: "Sleeping now will cause you to run out of time. Continue?"
            on: {
              CONFIRM_SLEEP: 'sleeping',
              CANCEL_SLEEP: 'idle',
            },
          },

          // Sleep state - advances time to morning
          sleeping: {
            entry: ['advanceTimeToMorning', 'setSleepMessage'],
            on: {
              WAKE: [
                // After sleeping, check if time ran out
                {
                  target: '#carmenSandiego.playing.encounter',
                  guard: 'isTimeExpired',
                  actions: 'setTimeOutEncounter',
                },
                { target: 'idle' },
              ],
            },
          },

          // Traveling between cities
          traveling: {
            entry: 'advanceTimeForTravel',
            on: {
              ARRIVE: [
                // Check timeout first
                {
                  target: '#carmenSandiego.playing.encounter',
                  guard: 'isTimeExpired',
                  actions: ['updateLocation', 'setTimeOutEncounter'],
                },
                // Normal arrival
                {
                  target: 'checkingIdle',
                  actions: ['updateLocation', 'resetCityFlags'],
                },
              ],
            },
          },

          // Investigation started - determines what happens next
          investigating: {
            entry: ['advanceTimeForInvestigation', 'recordInvestigation'],
            always: [
              // Priority 1: Apprehension (final city, assassination done)
              {
                target: 'encounter',
                guard: 'shouldApprehend',
                actions: 'setApprehensionEncounter',
              },
              // Priority 2: Mandatory encounter (henchman/assassination)
              {
                target: 'encounter',
                guard: 'shouldHenchman',
                actions: 'setHenchmanEncounter',
              },
              {
                target: 'encounter',
                guard: 'shouldAssassination',
                actions: 'setAssassinationEncounter',
              },
              // Priority 3: Rogue action (if selected, no mandatory encounter)
              {
                target: 'encounter',
                guard: 'shouldRogueActionAlone',
                actions: 'setRogueEncounter',
              },
              // Priority 4: Good deed (2nd+ investigation, dice roll)
              {
                target: 'encounter',
                guard: 'shouldGoodDeed',
                actions: 'setGoodDeedEncounter',
              },
              // Default: straight to clue
              {
                target: 'witnessClue',
                actions: 'setNormalClue',
              },
            ],
          },

          // Encounter state - has sub-states for different encounter phases
          encounter: {
            initial: 'presenting',
            states: {
              // Show encounter message, determine if choice needed
              presenting: {
                always: [
                  // Encounters requiring player choice
                  {
                    target: 'choosingAction',
                    guard: 'requiresGadgetChoice',
                  },
                  {
                    target: 'choosingGoodDeed',
                    guard: 'isGoodDeed',
                  },
                  // Non-interactive encounters (apprehension, timeOut, rogueAction)
                  { target: 'resolving' },
                ],
              },

              // Henchman/Assassination: choose gadget or endure
              choosingAction: {
                on: {
                  CHOOSE_GADGET: {
                    target: 'resolving',
                    guard: 'hasAvailableGadget',
                    actions: ['useGadget', 'setEncounterChoice'],
                  },
                  CHOOSE_ENDURE: {
                    target: 'resolving',
                    actions: ['applyInjury', 'applyTimePenalty', 'setEncounterChoice'],
                  },
                },
              },

              // Good deed: help or ignore
              choosingGoodDeed: {
                on: {
                  HELP_NPC: {
                    target: 'resolving',
                    actions: ['increaseKarma', 'markGoodDeedComplete'],
                  },
                  IGNORE_NPC: {
                    target: 'resolving',
                    actions: 'markGoodDeedComplete',
                  },
                },
              },

              // Show resolution, wait for dismiss
              resolving: {
                on: {
                  RESOLVE_ENCOUNTER: [
                    // Check for stacked rogue action
                    {
                      target: '#carmenSandiego.playing.encounter',
                      guard: 'hasStackedRogueAction',
                      actions: 'popRogueFromQueue',
                    },
                    // Terminal encounters exit playing
                    {
                      target: '#carmenSandiego.apprehended',
                      guard: 'isApprehension',
                      actions: 'saveGame',
                    },
                    {
                      target: '#carmenSandiego.debrief',
                      guard: 'isTimeOut',
                      actions: 'setTimeOutOutcome',
                    },
                    // Normal flow: proceed to witness clue
                    {
                      target: '#carmenSandiego.playing.witnessClue',
                      actions: 'markEncounterComplete',
                    },
                  ],
                },
              },
            },
          },

          // Witness clue display
          witnessClue: {
            on: {
              CONTINUE: {
                target: 'checkingIdle',
              },
            },
          },
        },
      },

      // ========================================
      // APPREHENDED
      // ========================================
      apprehended: {
        entry: 'saveGame',
        on: {
          PROCEED_TO_TRIAL: 'trial',
        },
      },

      // ========================================
      // TRIAL
      // ========================================
      trial: {
        entry: ['determineTrialOutcome', 'saveGame'],
        on: {
          COMPLETE_TRIAL: 'debrief',
        },
      },

      // ========================================
      // DEBRIEF
      // ========================================
      debrief: {
        entry: ['updateStats', 'saveGame'],
        on: {
          RETURN_TO_MENU: {
            target: 'menu',
            actions: 'clearCaseState',
          },
        },
      },
    },
  },
  {
    guards,
    actions,
  }
);

export default gameMachine;
