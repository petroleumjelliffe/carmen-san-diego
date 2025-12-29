import { useEffect, useCallback } from 'react';
import { useGameState } from '../hooks/useGameState';
import { useTravelAnimation } from '../hooks/useTravelAnimation';
import { useActionQueue } from '../hooks/useActionQueue';
import { Menu } from './Menu';
import { Header } from './Header';
import { TabBar } from './TabBar';
import { HomeTab } from './HomeTab';
import { InvestigateTab } from './InvestigateTab';
import { AirportTab } from './AirportTab';
import { DossierTab } from './DossierTab';
import { TravelAnimation } from './TravelAnimation';
import { Briefing } from './Briefing';
import { Trial } from './Trial';
import { Debrief } from './Debrief';
import { Loader } from 'lucide-react';

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
    hotel,
    rogueLocation,
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
    advanceTimeByOne,
    startNewCase,
    acceptBriefing,
    investigate,
    completeInvestigation,
    rogueInvestigate,
    completeRogueInvestigation,
    travel,
    completeTravelAnimation,
    getTravelTimeConfig,
    issueWarrant,
    completeTrial,
    proceedToTrial,
    returnToMenu,
    handleEncounterResolve,
    setActiveTab,
    setSelectedWarrant,
  } = useGameState(gameData);

  const { ranks, suspects, settings, rogueActions, encounterTimers, citiesById } = gameData;

  // Action queue for staged time advancement
  const {
    phase: actionPhase,
    pendingAction,
    hoursRemaining: actionHoursRemaining,
    isBusy: isActionBusy,
    queueAction,
    completeAction,
  } = useActionQueue({
    onTickHour: advanceTimeByOne,
    tickSpeed: (settings.time_tick_speed || 0.5) * 1000, // Match clock animation speed
    spinnerDuration: 500,
  });

  // Wrapped investigate function that queues the action
  const handleInvestigate = useCallback((locationIndex) => {
    const actionConfig = investigate(locationIndex);
    if (actionConfig) {
      queueAction({
        ...actionConfig,
        onComplete: () => {
          completeInvestigation();
          completeAction();
        },
      });
    }
  }, [investigate, queueAction, completeInvestigation, completeAction]);

  // Wrapped rogue action function that queues the action
  const handleRogueAction = useCallback((rogueAction) => {
    const actionConfig = rogueInvestigate(rogueAction);
    if (actionConfig) {
      queueAction({
        ...actionConfig,
        onComplete: () => {
          completeRogueInvestigation();
          completeAction();
        },
      });
    }
  }, [rogueInvestigate, queueAction, completeRogueInvestigation, completeAction]);

  // Handler for when flight animation completes - queues time ticking
  const handleFlightAnimationComplete = useCallback(() => {
    const travelConfig = getTravelTimeConfig();
    if (travelConfig) {
      queueAction({
        ...travelConfig,
        onComplete: () => {
          completeTravelAnimation();
          completeAction();
        },
      });
    } else {
      // Fallback if no config (shouldn't happen)
      completeTravelAnimation();
    }
  }, [getTravelTimeConfig, queueAction, completeTravelAnimation, completeAction]);

  // Travel animation
  const { isAnimating, progress, travelData, startAnimation } = useTravelAnimation(
    handleFlightAnimationComplete
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
          linear-gradient(to bottom, rgba(0, 0, 0, 0.3), rgba(0, 0, 0, 0.4)),
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
            style={{ alignItems: isAnimating || (actionPhase === 'ticking' && pendingAction?.type === 'travel') ? 'center' : 'end' }}
          >
          <div>
            {/* Travel Animation - shown during flight */}
            {isAnimating && travelData ? (
              <TravelAnimation
                travelData={travelData}
                progress={progress}
              />
            ) : actionPhase === 'ticking' && pendingAction?.type === 'travel' ? (
              /* Travel time ticking - spinner while clock in header shows time */
              <div className="bg-gray-900/80 rounded-lg p-8 flex flex-col items-center justify-center gap-4">
                <Loader className="animate-spin text-yellow-400" size={48} />
                <p className="text-yellow-100 font-medium text-lg">Arriving at destination...</p>
              </div>
            ) : (
              <>
                {message && (
                  <div className="bg-yellow-400/20 border border-yellow-400 text-yellow-100 px-4 py-2 rounded mb-4">
                    {message}
                  </div>
                )}

                {activeTab === 'home' && (
                  <HomeTab
                    currentCity={currentCity}
                    cityFact={currentCity?.fact}
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
                    rogueUsedInCity={rogueUsedInCity}
                    currentGoodDeed={currentGoodDeed}
                    karma={karma}
                    onInvestigate={handleInvestigate}
                    rogueActions={rogueActions}
                    onRogueAction={handleRogueAction}
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
                    actionPhase={actionPhase}
                    actionLabel={pendingAction?.label}
                    actionHoursRemaining={actionHoursRemaining}
                    currentCity={currentCity}
                    hotel={hotel}
                    rogueLocation={rogueLocation}
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
