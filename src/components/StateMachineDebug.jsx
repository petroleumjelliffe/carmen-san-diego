/**
 * Debug component for testing the XState game machine
 *
 * This component provides a simple UI to test state machine transitions
 * without affecting the main game. Enable by setting VITE_DEBUG_STATE_MACHINE=true
 *
 * Usage: Add <StateMachineDebug /> anywhere inside GameMachineProvider
 */
import { useGameMachine } from '../hooks/useGameMachine.jsx';

// Sample case data for testing
const sampleCaseData = {
  id: 'test-case-1',
  name: 'Test Case',
  suspect: {
    id: 'carmen',
    name: 'Carmen Sandiego',
    description: 'Master thief',
    traits: ['red coat', 'dark hair'],
  },
  cities: [
    {
      id: 'paris',
      name: 'Paris',
      lat: 48.8566,
      lng: 2.3522,
      investigationSpots: 3,
      correctDestination: 'london',
      wrongDestinations: ['berlin'],
    },
    {
      id: 'london',
      name: 'London',
      lat: 51.5074,
      lng: -0.1278,
      investigationSpots: 3,
      correctDestination: 'tokyo',
      wrongDestinations: ['moscow'],
    },
    {
      id: 'tokyo',
      name: 'Tokyo',
      lat: 35.6762,
      lng: 139.6503,
      investigationSpots: 3,
      correctDestination: null,
      wrongDestinations: [],
    },
  ],
  totalCities: 3,
  startingGadgets: [
    { id: 'gadget-1', name: 'Smoke Bomb', description: 'Escape tool', singleUse: true },
  ],
};

export function StateMachineDebug() {
  const {
    state,
    context,
    isMenu,
    isBriefing,
    isPlaying,
    isIdle,
    isTraveling,
    isInvestigating,
    isEncounter,
    isWitnessClue,
    isSleeping,
    isApprehended,
    isTrial,
    isDebrief,
    startCase,
    acceptBriefing,
    investigate,
    travel,
    arrive,
    chooseGadget,
    chooseEndure,
    helpNpc,
    ignoreNpc,
    resolveEncounter,
    continueAfterClue,
    wake,
    proceedToTrial,
    completeTrial,
    returnToMenu,
  } = useGameMachine();

  // Get current state path
  const stateValue = typeof state.value === 'string'
    ? state.value
    : JSON.stringify(state.value, null, 2);

  return (
    <div className="fixed bottom-4 right-4 bg-black/90 text-white p-4 rounded-lg max-w-md max-h-96 overflow-auto text-xs font-mono z-50">
      <h3 className="font-bold text-yellow-400 mb-2">State Machine Debug</h3>

      {/* Current State */}
      <div className="mb-3">
        <div className="text-gray-400">Current State:</div>
        <pre className="text-green-400 whitespace-pre-wrap">{stateValue}</pre>
      </div>

      {/* Key Context Values */}
      <div className="mb-3">
        <div className="text-gray-400">Context:</div>
        <div className="grid grid-cols-2 gap-1 text-xs">
          <span>Time: {context.currentHour}:00</span>
          <span>Remaining: {context.timeRemaining}h</span>
          <span>City: {context.currentCityId || 'none'}</span>
          <span>Index: {context.cityIndex}</span>
          <span>Wrong City: {context.wrongCity ? 'yes' : 'no'}</span>
          <span>Spots Used: {context.spotsUsedInCity}</span>
          <span>Encounter: {context.encounterType || 'none'}</span>
          <span>Clue Variant: {context.witnessClueVariant || 'none'}</span>
        </div>
      </div>

      {/* Actions based on current state */}
      <div className="space-y-1">
        <div className="text-gray-400">Actions:</div>

        {isMenu && (
          <button
            onClick={() => startCase(sampleCaseData)}
            className="bg-blue-600 px-2 py-1 rounded mr-1"
          >
            Start Test Case
          </button>
        )}

        {isBriefing && (
          <button
            onClick={acceptBriefing}
            className="bg-blue-600 px-2 py-1 rounded mr-1"
          >
            Accept Briefing
          </button>
        )}

        {isIdle && (
          <>
            <button
              onClick={() => investigate(0)}
              className="bg-green-600 px-2 py-1 rounded mr-1"
            >
              Investigate (0)
            </button>
            <button
              onClick={() => investigate(0, true)}
              className="bg-purple-600 px-2 py-1 rounded mr-1"
            >
              Rogue Action
            </button>
            {context.currentCase?.cities[context.cityIndex]?.correctDestination && (
              <button
                onClick={() => {
                  const currentCity = context.currentCase.cities[context.cityIndex];
                  const nextCity = context.currentCase.cities.find(
                    c => c.id === currentCity.correctDestination
                  );
                  if (nextCity) {
                    travel(nextCity, currentCity, true);
                  }
                }}
                className="bg-yellow-600 px-2 py-1 rounded mr-1"
              >
                Travel (Correct)
              </button>
            )}
          </>
        )}

        {isTraveling && (
          <button
            onClick={arrive}
            className="bg-orange-600 px-2 py-1 rounded mr-1"
          >
            Arrive
          </button>
        )}

        {isEncounter && context.encounterType === 'henchman' && (
          <>
            <button
              onClick={() => chooseGadget('gadget-1')}
              className="bg-cyan-600 px-2 py-1 rounded mr-1"
            >
              Use Gadget
            </button>
            <button
              onClick={chooseEndure}
              className="bg-red-600 px-2 py-1 rounded mr-1"
            >
              Endure
            </button>
          </>
        )}

        {isEncounter && context.encounterType === 'goodDeed' && (
          <>
            <button
              onClick={helpNpc}
              className="bg-green-600 px-2 py-1 rounded mr-1"
            >
              Help NPC
            </button>
            <button
              onClick={ignoreNpc}
              className="bg-gray-600 px-2 py-1 rounded mr-1"
            >
              Ignore
            </button>
          </>
        )}

        {isEncounter && ['rogueAction', 'apprehension', 'timeOut'].includes(context.encounterType) && (
          <button
            onClick={resolveEncounter}
            className="bg-blue-600 px-2 py-1 rounded mr-1"
          >
            Resolve Encounter
          </button>
        )}

        {isWitnessClue && (
          <button
            onClick={continueAfterClue}
            className="bg-blue-600 px-2 py-1 rounded mr-1"
          >
            Continue
          </button>
        )}

        {isSleeping && (
          <button
            onClick={wake}
            className="bg-blue-600 px-2 py-1 rounded mr-1"
          >
            Wake Up
          </button>
        )}

        {isApprehended && (
          <button
            onClick={proceedToTrial}
            className="bg-blue-600 px-2 py-1 rounded mr-1"
          >
            Proceed to Trial
          </button>
        )}

        {isTrial && (
          <button
            onClick={completeTrial}
            className="bg-blue-600 px-2 py-1 rounded mr-1"
          >
            Complete Trial
          </button>
        )}

        {isDebrief && (
          <button
            onClick={returnToMenu}
            className="bg-blue-600 px-2 py-1 rounded mr-1"
          >
            Return to Menu
          </button>
        )}
      </div>

      {/* Flags */}
      <div className="mt-3 text-xs text-gray-500">
        Flags: hadEncounter={context.hadEncounterInCity ? '1' : '0'},
        goodDeed={context.hadGoodDeedInCase ? '1' : '0'},
        rogue={context.rogueUsedInCity ? '1' : '0'}
      </div>
    </div>
  );
}

export default StateMachineDebug;
