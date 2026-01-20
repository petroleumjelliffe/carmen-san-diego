/**
 * IdleContent - Renders when state.matches('playing.idle')
 *
 * Contains tabs (home, investigate, airport, dossier)
 * Tab state is received from PlayingLayout to persist across state transitions
 */
import { TabBar } from './TabBar';
import { HomeTab } from './HomeTab';
import { InvestigateTab } from './InvestigateTab';
import { AirportTab } from './AirportTab';
import { DossierTab } from './DossierTab';

function IdleContent({
  // Tab state (from parent PlayingLayout)
  activeTab,
  setActiveTab,

  // General
  message,
  wrongCity,
  wrongCityData,
  currentCity,
  cityFact,
  hotel,

  // Investigation
  isFinalCity,
  cityClues,
  investigatedLocations,
  timeRemaining,
  nextInvestigationCost,
  collectedClues,
  lastFoundClue,
  lastRogueAction,
  activeRogueAction,
  onResolveRogueAction,
  rogueUsedInCity,
  currentGoodDeed,
  karma,
  onInvestigate,
  cityRogueAction,
  onRogueAction,
  notoriety,
  currentEncounter,
  availableGadgets,
  onEncounterResolve,
  isApprehended,
  selectedWarrant,
  onProceedToTrial,
  encounterTimers,
  isInvestigating,
  actionPhase,
  actionLabel,
  actionHoursRemaining,
  rogueLocation,
  witnessPhrases,

  // Travel
  destinations,
  travelTime,
  onTravel,
  citiesById,

  // Dossier
  suspects,
  onSelectWarrant,
  onIssueWarrant,
  selectedTraits,
  onCycleTrait,
  onResetTraits,

  // Settings
  settings,
}) {
  // Tab state is now received as props from PlayingLayout
  // This allows tab state to persist across idle/witnessClue/encounter transitions

  return (
    <>
      <div className="flex-1 flex overflow-hidden">
        <TabBar
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          variant="sidebar"
        />

        <div className="flex-1 overflow-y-auto">
          <div className="max-w-6xl mx-auto p-4 pb-24 md:pb-4 min-h-full">
            {message && (
              <div className="bg-yellow-400/20 border border-yellow-400 text-yellow-100 px-4 py-2 rounded mb-4">
                {message}
              </div>
            )}

            {activeTab === 'home' && (
              <HomeTab
                currentCity={wrongCity && wrongCityData ? wrongCityData : currentCity}
                cityFact={wrongCity && wrongCityData ? wrongCityData.fact : cityFact}
              />
            )}

            {activeTab === 'investigate' && (
              <InvestigateTab
                isFinalCity={isFinalCity}
                wrongCity={wrongCity}
                cityClues={cityClues}
                investigatedLocations={investigatedLocations}
                timeRemaining={timeRemaining}
                nextInvestigationCost={nextInvestigationCost}
                collectedClues={collectedClues}
                lastFoundClue={lastFoundClue}
                lastRogueAction={lastRogueAction}
                activeRogueAction={activeRogueAction}
                onResolveRogueAction={onResolveRogueAction}
                rogueUsedInCity={rogueUsedInCity}
                currentGoodDeed={currentGoodDeed}
                karma={karma}
                onInvestigate={onInvestigate}
                cityRogueAction={cityRogueAction}
                onRogueAction={onRogueAction}
                notoriety={notoriety}
                currentEncounter={currentEncounter}
                availableGadgets={availableGadgets}
                onEncounterResolve={onEncounterResolve}
                isApprehended={isApprehended}
                selectedWarrant={selectedWarrant}
                onProceedToTrial={onProceedToTrial}
                encounterTimers={encounterTimers}
                isInvestigating={isInvestigating}
                cityFact={wrongCity && wrongCityData ? wrongCityData.fact : cityFact}
                actionPhase={actionPhase}
                actionLabel={actionLabel}
                actionHoursRemaining={actionHoursRemaining}
                currentCity={wrongCity && wrongCityData ? wrongCityData : currentCity}
                hotel={hotel}
                rogueLocation={rogueLocation}
                witnessPhrases={witnessPhrases}
              />
            )}

            {activeTab === 'airport' && (
              <AirportTab
                destinations={destinations}
                timeRemaining={timeRemaining}
                travelTime={travelTime}
                onTravel={onTravel}
                currentCity={wrongCity && wrongCityData ? citiesById[wrongCityData.id] || wrongCityData : currentCity}
              />
            )}

            {activeTab === 'dossier' && (
              <DossierTab
                collectedClues={collectedClues}
                suspects={suspects}
                selectedWarrant={selectedWarrant}
                isFinalCity={isFinalCity}
                onSelectWarrant={onSelectWarrant}
                onIssueWarrant={onIssueWarrant}
                selectedTraits={selectedTraits}
                onCycleTrait={onCycleTrait}
                onResetTraits={onResetTraits}
                currentCity={currentCity}
              />
            )}
          </div>
        </div>
      </div>

      <TabBar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        variant="mobile"
      />
    </>
  );
}

export default IdleContent;
