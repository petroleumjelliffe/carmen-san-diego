import { useEffect } from 'react';
import { useGameState } from '../hooks/useGameState';
import { useTravelAnimation } from '../hooks/useTravelAnimation';
import { Menu } from './Menu';
import { Header } from './Header';
import { TabBar } from './TabBar';
import { InvestigateTab } from './InvestigateTab';
import { AirportTab } from './AirportTab';
import { DossierTab } from './DossierTab';
import { TravelAnimation } from './TravelAnimation';
import { Briefing } from './Briefing';
import { Trial } from './Trial';
import { Debrief } from './Debrief';

// City background images - moody noir-inspired shots from Unsplash
const CITY_BACKGROUNDS = {
  paris: 'https://images.unsplash.com/photo-1502602898657-3e91760cbb34?w=1920&q=80', // Eiffel Tower at dusk
  tokyo: 'https://images.unsplash.com/photo-1540959733332-eab4deabeeaf?w=1920&q=80', // Tokyo night
  cairo: 'https://images.unsplash.com/photo-1572252009286-268acec5ca0a?w=1920&q=80', // Pyramids
  london: 'https://images.unsplash.com/photo-1513635269975-59663e0ac1ad?w=1920&q=80', // London skyline
  rome: 'https://images.unsplash.com/photo-1552832230-c0197dd311b5?w=1920&q=80', // Colosseum
  berlin: 'https://images.unsplash.com/photo-1560969184-10fe8719e047?w=1920&q=80', // Brandenburg Gate
  sydney: 'https://images.unsplash.com/photo-1506973035872-a4ec16b8e8d9?w=1920&q=80', // Opera House
  moscow: 'https://images.unsplash.com/photo-1513326738677-b964603b136d?w=1920&q=80', // Red Square
  default: 'https://images.unsplash.com/photo-1477959858617-67f85cf4f1df?w=1920&q=80', // Generic city night
};

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
    nextInvestigationCost,
    karma,
    notoriety,
    savedNPCs,
    permanentInjuries,
    currentGoodDeed,
    lastRogueAction,
    currentEncounter,
    availableGadgets,
    selectedTraits,
    cycleSelectedTrait,
    resetSelectedTraits,
    isInvestigating,
    isTraveling,
    travelOrigin,
    travelDestination,
    startNewCase,
    acceptBriefing,
    investigate,
    rogueInvestigate,
    travel,
    completeTravelAnimation,
    issueWarrant,
    completeTrial,
    proceedToTrial,
    returnToMenu,
    handleEncounterResolve,
    setActiveTab,
    setSelectedWarrant,
  } = useGameState(gameData);

  const { ranks, suspects, settings, rogueActions, encounterTimers, citiesById } = gameData;

  // Travel animation
  const { isAnimating, progress, travelData, startAnimation } = useTravelAnimation(
    completeTravelAnimation
  );

  // Start travel animation when isTraveling becomes true
  useEffect(() => {
    if (isTraveling && travelOrigin && travelDestination) {
      const destCity = citiesById[travelDestination.cityId];
      if (destCity) {
        startAnimation(travelOrigin, destCity);
      }
    }
  }, [isTraveling, travelOrigin, travelDestination, citiesById, startAnimation]);

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

  // Get background image for current city
  const currentCityId = wrongCity && wrongCityData ? wrongCityData.id : currentCity?.id;
  const backgroundUrl = CITY_BACKGROUNDS[currentCityId] || CITY_BACKGROUNDS.default;

  // Main game UI with city background
  return (
    <div
      className="h-screen flex flex-col overflow-hidden bg-gray-900"
      style={{
        backgroundImage: `
          linear-gradient(to bottom, rgba(0, 0, 0, 0.7), rgba(0, 0, 0, 0.85)),
          url('${backgroundUrl}')
        `,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
      }}
    >
      <Header
        currentCity={currentCity}
        wrongCity={wrongCity}
        wrongCityData={wrongCityData}
        timeRemaining={timeRemaining}
        currentHour={currentHour}
        maxTime={settings.total_time}
        timeTickSpeed={settings.time_tick_speed || 0.5}
        lastSleepResult={lastSleepResult}
      />

      {/* 2-column layout wrapper */}
      <div className="flex-1 flex overflow-hidden">
        {/* Sidebar tabs - desktop only */}
        <TabBar
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          variant="sidebar"
        />

        {/* Main content area */}
        <div className="flex-1 overflow-y-auto">
          <div
            className="max-w-6xl mx-auto p-4 pb-24 md:pb-4 min-h-full grid"
            style={{ alignItems: isAnimating ? 'center' : 'end' }}
          >
          <div>
            {/* Travel Animation - shown during flight */}
            {isAnimating && travelData ? (
              <TravelAnimation
                travelData={travelData}
                progress={progress}
              />
            ) : (
              <>
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
                    nextInvestigationCost={nextInvestigationCost}
                    collectedClues={collectedClues}
                    lastFoundClue={lastFoundClue}
                    lastRogueAction={lastRogueAction}
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
                    isInvestigating={isInvestigating}
                    cityFact={currentCity?.fact}
                  />
                )}

                {activeTab === 'airport' && (
                  <AirportTab
                    destinations={destinations}
                    timeRemaining={timeRemaining}
                    travelTime={settings.travel_time}
                    onTravel={travel}
                    currentCity={wrongCity && wrongCityData ? citiesById[wrongCityData.id] || wrongCityData : currentCity}
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
                    selectedTraits={selectedTraits}
                    onCycleTrait={cycleSelectedTrait}
                    onResetTraits={resetSelectedTraits}
                  />
                )}
              </>
            )}
          </div>
        </div>
        </div>
      </div>

      {/* Mobile bottom tabs */}
      <TabBar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        variant="mobile"
      />
    </div>
  );
}

export default Game;
