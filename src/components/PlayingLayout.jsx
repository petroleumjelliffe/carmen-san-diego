/**
 * PlayingLayout - Parent layout for all playing states
 *
 * Key principles:
 * - Tab state is derived from state machine (not React state)
 * - Tabs are rendered inline based on state.matches()
 * - Header mounts once and stays mounted
 * - Overlays (ClueDialog, EncounterDialog) render on top with z-index
 */
import { useMemo } from 'react';
import { useGameMachine } from '../hooks/useGameMachine.jsx';
import Header from './Header.jsx';
import { TabBar } from './TabBar.jsx';
import { HomeTab } from './HomeTab.jsx';
import { InvestigateTab } from './InvestigateTab.jsx';
import { AirportTab } from './AirportTab.jsx';
import { DossierTab } from './DossierTab.jsx';
import ClueDialog from './ClueDialog.jsx';
import EncounterDialog from './EncounterDialog.jsx';
import TravelAnimation from './TravelAnimation.jsx';

function PlayingLayout(props) {
  const { state, send } = useGameMachine();

  // Derive current tab from state machine (single source of truth)
  const currentTab = useMemo(() => {
    if (state.matches('playing.home')) return 'home';
    if (state.matches('playing.investigate')) return 'investigate';
    if (state.matches('playing.airport')) return 'airport';
    if (state.matches('playing.dossier')) return 'dossier';
    return 'home'; // Fallback
  }, [state]);

  // Determine if we're in an overlay state (encounter or clue)
  const isInEncounter = state.matches('playing.investigate.encountering');
  const isInWitnessClue = state.matches('playing.investigate.witnessClue');
  const isTraveling = state.matches('playing.airport.traveling');
  const isSleeping = state.matches('playing.sleeping');
  const isConfirmingSleep = state.matches('playing.confirmingSleep');

  // Determine if tabs should be disabled
  const canSwitchTabs = !isInEncounter && !isInWitnessClue && !isTraveling && !isSleeping && !isConfirmingSleep;

  // Tab navigation handler - sends events to state machine
  const handleTabClick = (tabId) => {
    const eventType = `GOTO_${tabId.toUpperCase()}`;
    send({ type: eventType });
  };

  // Calculate background for current state
  const travelingBackground = props.backgrounds?.traveling || '';
  const currentCityId = props.wrongCity && props.wrongCityData ? props.wrongCityData.id : props.currentCity?.id;
  const cityData = currentCityId ? props.citiesById[currentCityId] : null;
  const currentCityBackground = cityData?.background_image || travelingBackground;
  const backgroundUrl = (isTraveling) ? travelingBackground : currentCityBackground;

  return (
    <div
      className="h-screen flex flex-col overflow-hidden bg-gray-900"
      style={{
        backgroundImage: `
          linear-gradient(to bottom, rgba(0, 0, 0, 0.3), rgba(0, 0, 0, 0.4)),
          url('${backgroundUrl}')
        `,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
      }}
    >
      {/* Header mounts ONCE and stays mounted throughout playing state */}
      <Header
        currentCity={props.currentCity}
        wrongCity={props.wrongCity}
        wrongCityData={props.wrongCityData}
        timeRemaining={props.timeRemaining}
        currentHour={props.currentHour}
        maxTime={props.maxTime}
        timeTickSpeed={props.timeTickSpeed}
        lastSleepResult={props.lastSleepResult}
      />

      {/* Main content area with sidebar and tab content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Sidebar TabBar (desktop) */}
        <TabBar
          activeTab={currentTab}
          onTabClick={handleTabClick}
          disabled={!canSwitchTabs}
          variant="sidebar"
        />

        {/* Tab content (dimmed during overlays) */}
        <div
          className={`flex-1 overflow-y-auto ${
            isInEncounter || isInWitnessClue ? 'opacity-50 pointer-events-none' : ''
          }`}
        >
          <div className="max-w-6xl mx-auto p-4 pb-24 md:pb-4 min-h-full">
            {props.message && (
              <div className="bg-yellow-400/20 border border-yellow-400 text-yellow-100 px-4 py-2 rounded mb-4">
                {props.message}
              </div>
            )}

            {/* Render tab content based on current state */}
            {currentTab === 'home' && (
              <HomeTab
                currentCity={props.wrongCity && props.wrongCityData ? props.wrongCityData : props.currentCity}
                cityFact={props.wrongCity && props.wrongCityData ? props.wrongCityData.fact : props.cityFact}
              />
            )}

            {currentTab === 'investigate' && (
              <InvestigateTab
                isFinalCity={props.isFinalCity}
                wrongCity={props.wrongCity}
                cityClues={props.cityClues}
                investigatedLocations={props.investigatedLocations}
                timeRemaining={props.timeRemaining}
                nextInvestigationCost={props.nextInvestigationCost}
                collectedClues={props.collectedClues}
                lastFoundClue={props.lastFoundClue}
                lastRogueAction={props.lastRogueAction}
                activeRogueAction={props.activeRogueAction}
                onResolveRogueAction={props.onResolveRogueAction}
                rogueUsedInCity={props.rogueUsedInCity}
                currentGoodDeed={props.currentGoodDeed}
                karma={props.karma}
                onInvestigate={props.onInvestigate}
                cityRogueAction={props.cityRogueAction}
                onRogueAction={props.onRogueAction}
                notoriety={props.notoriety}
                currentEncounter={props.currentEncounter}
                availableGadgets={props.availableGadgets}
                onEncounterResolve={props.onEncounterResolve}
                isApprehended={props.isApprehended}
                selectedWarrant={props.selectedWarrant}
                onProceedToTrial={props.onProceedToTrial}
                encounterTimers={props.encounterTimers}
                isInvestigating={props.isInvestigating}
                cityFact={props.wrongCity && props.wrongCityData ? props.wrongCityData.fact : props.cityFact}
                actionPhase={props.actionPhase}
                actionLabel={props.actionLabel}
                actionHoursRemaining={props.actionHoursRemaining}
                currentCity={props.wrongCity && props.wrongCityData ? props.wrongCityData : props.currentCity}
                hotel={props.hotel}
                rogueLocation={props.rogueLocation}
                witnessPhrases={props.witnessPhrases}
              />
            )}

            {currentTab === 'airport' && (
              <AirportTab
                destinations={props.destinations}
                timeRemaining={props.timeRemaining}
                travelTime={props.travelTime}
                onTravel={props.onTravel}
                currentCity={props.wrongCity && props.wrongCityData ? props.citiesById[props.wrongCityData.id] || props.wrongCityData : props.currentCity}
              />
            )}

            {currentTab === 'dossier' && (
              <DossierTab
                collectedClues={props.collectedClues}
                suspects={props.suspects}
                selectedWarrant={props.selectedWarrant}
                isFinalCity={props.isFinalCity}
                onSelectWarrant={props.onSelectWarrant}
                onIssueWarrant={props.onIssueWarrant}
                selectedTraits={props.selectedTraits}
                onCycleTrait={props.onCycleTrait}
                onResetTraits={props.onResetTraits}
                currentCity={props.currentCity}
              />
            )}
          </div>
        </div>
      </div>

      {/* Mobile TabBar (bottom) */}
      <TabBar
        activeTab={currentTab}
        onTabClick={handleTabClick}
        disabled={!canSwitchTabs}
        variant="mobile"
      />

      {/* Overlays - render on top with fixed positioning and high z-index */}
      {isInWitnessClue && <ClueDialog />}
      {isInEncounter && <EncounterDialog />}

      {/* Traveling - fullscreen takeover */}
      {isTraveling && (
        <div className="fixed inset-0 flex items-center justify-center bg-gray-900 z-40">
          <TravelAnimation
            travelData={props.travelData}
            progress={props.progress}
            backgroundImage={travelingBackground}
          />
        </div>
      )}

      {/* Sleep states - placeholder overlays (not implemented yet) */}
      {isSleeping && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center text-white z-50">
          <div className="text-center">
            <h2 className="text-2xl mb-4">💤 Sleeping...</h2>
            <p>Sleep UI not implemented - reload required</p>
          </div>
        </div>
      )}

      {isConfirmingSleep && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center text-white z-50">
          <div className="text-center">
            <h2 className="text-2xl mb-4">⚠️ Sleep Warning</h2>
            <p>Sleep warning UI not implemented - reload required</p>
          </div>
        </div>
      )}
    </div>
  );
}

export default PlayingLayout;
