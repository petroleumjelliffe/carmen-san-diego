import { useEffect, useCallback, useState } from 'react';
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
    cityRogueAction,
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

  const { ranks, suspects, settings, rogueActions, encounterTimers, citiesById, backgrounds } = gameData;

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

  // Keep last travel data for showing car at destination
  const [lastTravelData, setLastTravelData] = useState(null);
  const [showMap, setShowMap] = useState(false);

  // Start travel animation when isTraveling becomes true
  useEffect(() => {
    if (isTraveling && travelOrigin && travelDestination) {
      const destCity = citiesById[travelDestination.cityId];
      if (destCity) {
        startAnimation(travelOrigin, destCity);
        setShowMap(true);
      }
    }
  }, [isTraveling, travelOrigin, travelDestination, citiesById, startAnimation]);

  // Update last travel data when animation is running
  useEffect(() => {
    if (travelData) {
      setLastTravelData(travelData);
    }
  }, [travelData]);

  // Hide map when travel completes
  useEffect(() => {
    if (!isTraveling && !isAnimating && showMap) {
      // Wait a brief moment after animation completes before hiding
      const timeout = setTimeout(() => {
        setShowMap(false);
      }, 500);
      return () => clearTimeout(timeout);
    }
  }, [isTraveling, isAnimating, showMap]);

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
  // Use generic background during travel animation
  const travelingBackground = backgrounds?.traveling || '';
  const currentCityId = wrongCity && wrongCityData ? wrongCityData.id : currentCity?.id;
  const cityData = currentCityId ? citiesById[currentCityId] : null;
  const currentCityBackground = cityData?.background_image || travelingBackground;
  const backgroundUrl = (isAnimating || isTraveling) ? travelingBackground : currentCityBackground;

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
            {/* Travel Animation - shown during flight, time ticking, and car at destination */}
            {showMap && lastTravelData ? (
              <TravelAnimation
                travelData={lastTravelData}
                progress={isAnimating || (actionPhase === 'ticking' && pendingAction?.type === 'travel') ? progress : 1.0}
                backgroundImage={backgrounds?.traveling}
              />
            ) : null}

            {/* Main content - shown when not traveling */}
            {!showMap || !(isAnimating || (actionPhase === 'ticking' && pendingAction?.type === 'travel')) ? <>
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
                    cityRogueAction={cityRogueAction}
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
              </> : null}
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
