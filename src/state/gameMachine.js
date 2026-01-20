/**
 * Carmen Sandiego XState Game Machine
 *
 * Hierarchical state machine managing all game state transitions.
 * Tabs are now first-class states within 'playing'.
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
 * - playing: Active gameplay (tabs as hierarchical states)
 *   - home: Home tab (city info)
 *   - investigate: Investigation tab (with encountering, witnessClue sub-states)
 *   - airport: Airport tab (with traveling sub-state)
 *   - dossier: Dossier/Evidence tab
 *   - sleeping: Sleep flow (global)
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
            target: 'playing.investigate',
            actions: 'saveGame',
          },
        },
      },

      // ========================================
      // PLAYING - Tabs as hierarchical states
      // ========================================
      playing: {
        initial: 'investigate',

        // Global events handled at playing level
        on: {
          // Tab navigation events
          GOTO_HOME: [
            {
              target: '.home',
              guard: 'canSwitchTabs',
            },
            {
              // Guard rejected - log and show message
              actions: ['logGuardRejection', 'showTabLockMessage'],
            },
          ],
          GOTO_INVESTIGATE: [
            {
              target: '.investigate',
              guard: 'canSwitchTabs',
            },
            {
              actions: ['logGuardRejection', 'showTabLockMessage'],
            },
          ],
          GOTO_AIRPORT: [
            {
              target: '.airport',
              guard: 'canSwitchTabs',
            },
            {
              actions: ['logGuardRejection', 'showTabLockMessage'],
            },
          ],
          GOTO_DOSSIER: [
            {
              target: '.dossier',
              guard: 'canSwitchTabs',
            },
            {
              actions: ['logGuardRejection', 'showTabLockMessage'],
            },
          ],
        },

        states: {
          // ========================================
          // HOME TAB
          // ========================================
          home: {
            entry: [
              (context) => console.log('[STATE MACHINE] Entered home tab', { cityIndex: context.cityIndex }),
              'saveGame',
              'clearTransientState',
            ],
            // Tab navigation handled by parent playing state
          },

          // ========================================
          // INVESTIGATE TAB
          // ========================================
          investigate: {
            initial: 'idle',

            states: {
              // Idle - waiting for investigation action
              idle: {
                entry: [
                  (context) => console.log('[STATE MACHINE] Entered investigate.idle', { cityIndex: context.cityIndex, spotsUsedInCity: context.spotsUsedInCity }),
                  'saveGame',
                  'clearTransientState',
                ],
                on: {
                  INVESTIGATE: [
                    {
                      target: 'investigating',
                      guard: 'hasAvailableSpots',
                      actions: [
                        (context, event) => console.log('[STATE MACHINE] INVESTIGATE event accepted', { event, spotsUsedInCity: context.spotsUsedInCity }),
                        'setInvestigationParams',
                        'rollGoodDeedDice',
                      ],
                    },
                    {
                      // Guard failed - stay in idle but log and show message
                      actions: [
                        (context, event) => console.log('[STATE MACHINE] ❌ INVESTIGATE event REJECTED', { event, spotsUsedInCity: context.spotsUsedInCity }),
                        'logGuardRejection',
                        'showNoSpotsMessage',
                      ],
                    },
                  ],
                },
              },

              // Investigation in progress - determines what happens next
              investigating: {
                entry: [
                  (context) => console.log('[STATE MACHINE] Entered investigating', { cityIndex: context.cityIndex, spotsUsedInCity: context.spotsUsedInCity, currentSpotIndex: context.currentSpotIndex }),
                  'advanceTimeForInvestigation',
                  'recordInvestigation',
                ],
                always: [
                  // Check timeout first (after time-consuming action)
                  {
                    target: 'encountering',
                    guard: 'isTimeExpired',
                    actions: 'setTimeOutEncounter',
                  },
                  // Priority 1: Apprehension (final city, assassination done)
                  {
                    target: 'encountering',
                    guard: 'shouldApprehend',
                    actions: 'setApprehensionEncounter',
                  },
                  // Priority 2: Mandatory encounter (henchman/assassination)
                  {
                    target: 'encountering',
                    guard: 'shouldHenchman',
                    actions: 'setHenchmanEncounter',
                  },
                  {
                    target: 'encountering',
                    guard: 'shouldAssassination',
                    actions: 'setAssassinationEncounter',
                  },
                  // Priority 3: Rogue action (if selected, no mandatory encounter)
                  {
                    target: 'encountering',
                    guard: 'shouldRogueActionAlone',
                    actions: 'setRogueEncounter',
                  },
                  // Priority 4: Good deed (2nd+ investigation, dice roll)
                  {
                    target: 'encountering',
                    guard: 'shouldGoodDeed',
                    actions: 'setGoodDeedEncounter',
                  },
                  // Default: straight to witness clue
                  {
                    target: 'witnessClue',
                    actions: [
                      (context) => console.log('[STATE MACHINE] No encounter - going to witnessClue'),
                      'setNormalClue',
                    ],
                  },
                ],
              },

              // Encountering - overlays on investigate tab
              encountering: {
                initial: 'presenting',
                states: {
                  // Show encounter message, determine if choice needed
                  presenting: {
                    always: [
                      {
                        target: 'choosingAction',
                        guard: 'requiresGadgetChoice',
                      },
                      {
                        target: 'choosingGoodDeed',
                        guard: 'isGoodDeed',
                      },
                      // Non-interactive encounters
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
                          target: 'presenting',
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
                          target: '#carmenSandiego.playing.investigate.witnessClue',
                          actions: 'markEncounterComplete',
                        },
                      ],
                    },
                  },
                },
              },

              // Witness clue - overlays on investigate tab
              witnessClue: {
                entry: (context) => console.log('[STATE MACHINE] Entered witnessClue', { encounterType: context.encounterType }),
                on: {
                  CONTINUE: {
                    target: 'idle',
                    actions: (context) => console.log('[STATE MACHINE] CONTINUE from witnessClue -> idle'),
                  },
                },
              },
            },
          },

          // ========================================
          // AIRPORT TAB
          // ========================================
          airport: {
            initial: 'idle',

            states: {
              // Idle - destination selection
              idle: {
                entry: [
                  (context) => console.log('[STATE MACHINE] Entered airport.idle', { cityIndex: context.cityIndex }),
                  'saveGame',
                  'clearTransientState',
                ],
                on: {
                  TRAVEL: {
                    target: 'traveling',
                    actions: 'setTravelDestination',
                  },
                },
              },

              // Traveling animation
              traveling: {
                entry: [
                  (context) => console.log('[STATE MACHINE] Entered traveling', { fromCity: context.cityIndex, destination: context.travelDestination }),
                  'advanceTimeForTravel',
                ],
                on: {
                  ARRIVE: [
                    // Check timeout first
                    {
                      target: '#carmenSandiego.playing.investigate.encountering',
                      guard: 'isTimeExpired',
                      actions: ['updateLocation', 'setTimeOutEncounter'],
                    },
                    // Normal arrival -> go to home tab
                    {
                      target: '#carmenSandiego.playing.home',
                      actions: [
                        (context) => console.log('[STATE MACHINE] ARRIVE - updating location', { newCityIndex: context.cityIndex + (context.isCorrectPath ? 1 : 0) }),
                        'updateLocation',
                        'resetCityFlags',
                      ],
                    },
                  ],
                },
              },
            },
          },

          // ========================================
          // DOSSIER TAB
          // ========================================
          dossier: {
            entry: [
              (context) => console.log('[STATE MACHINE] Entered dossier tab', { cityIndex: context.cityIndex }),
              'saveGame',
              'clearTransientState',
            ],
            // Tab navigation handled by parent playing state
          },

          // ========================================
          // SLEEPING (Global within playing)
          // ========================================
          sleepWarning: {
            entry: 'calculateSleepTimeout',
            always: [
              {
                target: 'confirmingSleep',
                guard: 'sleepWouldCauseTimeout',
              },
              { target: 'sleeping' },
            ],
          },

          confirmingSleep: {
            on: {
              CONFIRM_SLEEP: 'sleeping',
              CANCEL_SLEEP: 'investigate.idle', // Return to investigate tab
            },
          },

          sleeping: {
            entry: ['advanceTimeToMorning', 'setSleepMessage'],
            on: {
              WAKE: [
                {
                  target: 'investigate.encountering',
                  guard: 'isTimeExpired',
                  actions: 'setTimeOutEncounter',
                },
                { target: 'investigate.idle' }, // Return to investigate tab
              ],
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
