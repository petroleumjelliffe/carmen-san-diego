import { useGameState } from '../hooks/useGameState';
import { Menu } from './Menu';
import { Header } from './Header';
import { LocationBanner } from './LocationBanner';
import { TabBar } from './TabBar';
import { InvestigateTab } from './InvestigateTab';
import { AirportTab } from './AirportTab';
import { DossierTab } from './DossierTab';
import { Briefing } from './Briefing';
import { Trial } from './Trial';
import { Debrief } from './Debrief';

export function Game({ gameData }) {
  const {
    gameState,
    currentCase,
    currentCity,
    currentCityIndex,
    timeRemaining,
    currentHour,
    collectedClues,
    investigatedLocations,
    selectedWarrant,
    activeTab,
    solvedCases,
    message,
    wrongCity,
    wrongCityData,
    cityClues,
    lastFoundClue,
    lastSleepResult,
    rogueUsedInCity,
    isFinalCity,
    destinations,
    karma,
    notoriety,
    savedNPCs,
    permanentInjuries,
    currentGoodDeed,
    lastRogueAction,
    currentEncounter,
    availableGadgets,
    startNewCase,
    acceptBriefing,
    investigate,
    rogueInvestigate,
    travel,
    issueWarrant,
    completeTrial,
    proceedToTrial,
    returnToMenu,
    handleGoodDeed,
    handleHenchmanGadget,
    handleAssassinationGadget,
    handleEncounterResolve,
    setActiveTab,
    setSelectedWarrant,
  } = useGameState(gameData);

  const { ranks, suspects, settings, rogueActions, encounterTimers } = gameData;

  // Menu screen
  if (gameState === 'menu') {
    return (
      <Menu
        solvedCases={solvedCases}
        ranks={ranks}
        onStartNewCase={startNewCase}
      />
    );
  }

  // Briefing screen
  if (gameState === 'briefing') {
    const startingCity = currentCase ? gameData.citiesById[currentCase.cities[0]] : null;
    return (
      <Briefing
        currentCase={currentCase}
        startingCity={startingCity}
        settings={settings}
        onAccept={acceptBriefing}
      />
    );
  }

  // Trial screen
  if (gameState === 'trial') {
    return (
      <Trial
        currentCase={currentCase}
        selectedWarrant={selectedWarrant}
        timeRemaining={timeRemaining}
        onContinue={completeTrial}
      />
    );
  }

  // Debrief screen
  if (gameState === 'debrief') {
    const isWon = selectedWarrant?.id === currentCase?.suspect.id;
    return (
      <Debrief
        isWon={isWon}
        currentCase={currentCase}
        timeRemaining={timeRemaining}
        solvedCases={solvedCases}
        ranks={ranks}
        karma={karma}
        notoriety={notoriety}
        savedNPCs={savedNPCs}
        permanentInjuries={permanentInjuries}
        onNewCase={startNewCase}
        onReturnToMenu={returnToMenu}
      />
    );
  }

  // Main game UI
  return (
    <div className="min-h-screen bg-gradient-to-b from-red-900 to-red-950">
      <Header
        currentCase={currentCase}
        timeRemaining={timeRemaining}
        currentHour={currentHour}
        solvedCases={solvedCases}
        ranks={ranks}
      />

      <LocationBanner
        currentCity={currentCity}
        currentCityIndex={currentCityIndex}
        wrongCity={wrongCity}
        wrongCityData={wrongCityData}
        citiesPerCase={settings.cities_per_case}
      />

      <TabBar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
      />

      <div className="max-w-4xl mx-auto p-4 pb-24 sm:pb-4">
        {message && (
          <div className="bg-yellow-400/20 border border-yellow-400 text-yellow-100 px-4 py-2 rounded mb-4">
            {message}
          </div>
        )}

        {activeTab === 'investigate' && (
          <InvestigateTab
            isFinalCity={isFinalCity}
            wrongCity={wrongCity}
            cityClues={cityClues}
            investigatedLocations={investigatedLocations}
            timeRemaining={timeRemaining}
            collectedClues={collectedClues}
            lastFoundClue={lastFoundClue}
            lastRogueAction={lastRogueAction}
            lastSleepResult={lastSleepResult}
            rogueUsedInCity={rogueUsedInCity}
            currentGoodDeed={currentGoodDeed}
            karma={karma}
            onInvestigate={investigate}
            rogueActions={rogueActions}
            onRogueAction={rogueInvestigate}
            notoriety={notoriety}
            currentEncounter={currentEncounter}
            availableGadgets={availableGadgets}
            onEncounterResolve={handleEncounterResolve}
            isApprehended={gameState === 'apprehended'}
            selectedWarrant={selectedWarrant}
            onProceedToTrial={proceedToTrial}
            encounterTimers={encounterTimers}
          />
        )}

        {activeTab === 'airport' && (
          <AirportTab
            destinations={destinations}
            timeRemaining={timeRemaining}
            travelTime={settings.travel_time}
            onTravel={travel}
          />
        )}

        {activeTab === 'dossier' && (
          <DossierTab
            collectedClues={collectedClues}
            suspects={suspects}
            selectedWarrant={selectedWarrant}
            isFinalCity={isFinalCity}
            onSelectWarrant={setSelectedWarrant}
            onIssueWarrant={issueWarrant}
          />
        )}
      </div>
    </div>
  );
}

export default Game;
