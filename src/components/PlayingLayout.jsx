/**
 * PlayingLayout - Parent layout for all playing states
 *
 * Key principles:
 * - Manages activeTab state that persists across state transitions
 * - Header mounts once and stays mounted
 * - IdleContent always rendered (hidden when overlays show) to preserve tab state
 * - Overlays (ClueDialog, EncounterDialog) render on top with z-index
 */
import { useState, useEffect, useRef } from 'react';
import { useGameMachine } from '../hooks/useGameMachine.jsx';
import Header from './Header.jsx';
import IdleContent from './IdleContent.jsx';
import ClueDialog from './ClueDialog.jsx';
import EncounterDialog from './EncounterDialog.jsx';
import TravelAnimation from './TravelAnimation.jsx';

function PlayingLayout({
  // General
  message,
  wrongCity,
  wrongCityData,
  currentCity,
  cityFact,
  hotel,

  // Header props
  timeRemaining,
  currentHour,
  maxTime,
  timeTickSpeed,
  lastSleepResult,

  // Investigation
  isFinalCity,
  cityClues,
  investigatedLocations,
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

  // Travel animation
  travelData,
  progress,
  isAnimating,
  backgrounds,
}) {
  const { state, context } = useGameMachine();

  // State matchers
  const isIdle = state.matches('playing.idle');
  const isWitnessClue = state.matches('playing.witnessClue');
  const isEncounter = state.matches('playing.encounter');
  const isTraveling = state.matches('playing.traveling');
  const isSleeping = state.matches('playing.sleeping');
  const isConfirmingSleep = state.matches('playing.confirmingSleep');

  // ✅ CRITICAL: activeTab state lives HERE
  // This persists across idle/witnessClue/encounter state transitions
  const [activeTab, setActiveTab] = useState('home');

  // Track city changes to detect travel completion
  const prevCityIndexRef = useRef(context.cityIndex);

  // ✅ Set initial tab when entering playing from briefing
  useEffect(() => {
    // On first idle after starting case, go to investigate tab
    // (This happens after accepting briefing)
    if (isIdle && context.cityIndex === 0 && prevCityIndexRef.current === undefined) {
      setActiveTab('investigate');
      prevCityIndexRef.current = context.cityIndex;
    }
  }, [isIdle, context.cityIndex]);

  // ✅ Reset to home tab after completing travel
  useEffect(() => {
    if (context.cityIndex !== prevCityIndexRef.current && context.cityIndex !== undefined && prevCityIndexRef.current !== undefined) {
      // City changed → user just traveled → go to home tab
      setActiveTab('home');
      prevCityIndexRef.current = context.cityIndex;
    }
  }, [context.cityIndex]);

  // Calculate background for current state
  const travelingBackground = backgrounds?.traveling || '';
  const currentCityId = wrongCity && wrongCityData ? wrongCityData.id : currentCity?.id;
  const cityData = currentCityId ? citiesById[currentCityId] : null;
  const currentCityBackground = cityData?.background_image || travelingBackground;
  const backgroundUrl = (isAnimating || isTraveling) ? travelingBackground : currentCityBackground;

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
      {/* ✅ Header mounts ONCE and stays mounted throughout playing state */}
      <Header
        currentCity={currentCity}
        wrongCity={wrongCity}
        wrongCityData={wrongCityData}
        timeRemaining={timeRemaining}
        currentHour={currentHour}
        maxTime={maxTime}
        timeTickSpeed={timeTickSpeed}
        lastSleepResult={lastSleepResult}
      />

      {/* ✅ IdleContent ALWAYS rendered - hidden via CSS when overlays are active */}
      {/* This preserves tab state when ClueDialog/EncounterDialog show */}
      <div className={isIdle ? '' : 'hidden'}>
        <IdleContent
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          message={message}
          wrongCity={wrongCity}
          wrongCityData={wrongCityData}
          currentCity={currentCity}
          cityFact={cityFact}
          hotel={hotel}
          isFinalCity={isFinalCity}
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
          actionPhase={actionPhase}
          actionLabel={actionLabel}
          actionHoursRemaining={actionHoursRemaining}
          rogueLocation={rogueLocation}
          witnessPhrases={witnessPhrases}
          destinations={destinations}
          travelTime={travelTime}
          onTravel={onTravel}
          citiesById={citiesById}
          suspects={suspects}
          onSelectWarrant={onSelectWarrant}
          onIssueWarrant={onIssueWarrant}
          selectedTraits={selectedTraits}
          onCycleTrait={onCycleTrait}
          onResetTraits={onResetTraits}
          settings={settings}
        />
      </div>

      {/* ✅ Overlays - render on top with fixed positioning and high z-index */}
      {/* ClueDialog already has fixed inset-0 bg-black/80 z-50 */}
      {isWitnessClue && <ClueDialog />}

      {/* EncounterDialog already has fixed inset-0 bg-black/80 z-50 */}
      {isEncounter && <EncounterDialog />}

      {/* ✅ Traveling - fullscreen takeover (replaces everything) */}
      {(isTraveling || isAnimating) && (
        <div className="flex-1 flex items-center justify-center">
          <TravelAnimation
            travelData={travelData}
            progress={progress}
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
