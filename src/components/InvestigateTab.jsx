import { useState, useEffect } from 'react';
import { Zap, AlertTriangle, Loader } from 'lucide-react';
import { EncounterCard } from './EncounterCard';
import { FadeIn } from './FadeIn';
import { CityMapView } from './CityMapView';
import { OptionCard } from './OptionCard';
import { OptionTray } from './OptionTray';

export function InvestigateTab({
  isFinalCity,
  wrongCity,
  cityClues,
  investigatedLocations,
  timeRemaining,
  nextInvestigationCost,
  collectedClues,
  lastFoundClue,
  lastRogueAction,
  rogueUsedInCity,
  currentGoodDeed,
  karma,
  onInvestigate,
  rogueActions,
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
  cityFact,
  actionPhase,
  actionLabel,
  actionHoursRemaining,
  currentCity,
  hotel,
  rogueLocation,
}) {
  const [hoveredSpotId, setHoveredSpotId] = useState(null);
  const [investigatingSpotIndex, setInvestigatingSpotIndex] = useState(null);

  // Track last investigated spot for animation starting point
  // Use second-to-last to avoid animating from the spot we just clicked to itself
  const lastInvestigatedSpotId = investigatedLocations.length > 1
    ? investigatedLocations[investigatedLocations.length - 2]
    : null;

  // Handler for investigating - sets animation index and calls parent handler
  const handleInvestigateClick = (index) => {
    setInvestigatingSpotIndex(index);
    onInvestigate(index);
  };

  if (!cityClues) return null;

  const ROGUE_TIME_COST = 2;

  // Pick any rogue action (just use first one for now)
  const availableRogueAction = rogueActions && rogueActions.length > 0 ? rogueActions[0] : null;

  // Determine if there's an active encounter (any type)
  const activeEncounter = currentEncounter || currentGoodDeed;
  const encounterType = currentEncounter?.type || (currentGoodDeed ? 'good_deed' : null);

  // Get timer duration based on encounter type
  const getTimerDuration = () => {
    if (currentEncounter?.type === 'assassination') {
      return currentEncounter.timer_duration || 5;
    }
    if (currentEncounter?.type === 'henchman') {
      return encounterTimers?.henchman_duration || 10;
    }
    if (currentGoodDeed) {
      return encounterTimers?.good_deed_duration || 8;
    }
    return 10;
  };

  // Only block map for major overlays (not investigation results)
  const hasBlockingOverlay = isApprehended || activeEncounter;

  // Determine if animation is in progress
  const isAnimating = actionPhase === 'ticking' || actionPhase === 'pending';

  // Note: We don't clear investigatingSpotIndex when action completes
  // because the animation in CityMapView needs it to persist for the full 1.5s animation duration

  return (
    <div className="relative h-[600px]">
      {/* City Map Background */}
      {!hasBlockingOverlay && (
        <div className="absolute inset-0 z-0">
          <CityMapView
            currentCity={currentCity}
            spots={cityClues}
            investigatedSpots={investigatedLocations}
            onSpotClick={handleInvestigateClick}
            hoveredSpotId={hoveredSpotId}
            onSpotHover={setHoveredSpotId}
            investigatingSpotIndex={investigatingSpotIndex}
            isAnimating={isAnimating}
            hotel={hotel}
            rogueLocation={rogueLocation}
            lastInvestigatedSpotId={lastInvestigatedSpotId}
          />
        </div>
      )}

      {/* Blocking Overlays - only for encounters and apprehension */}
      {hasBlockingOverlay && (
        <div className="absolute inset-0 bg-gray-900/95 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="max-w-2xl w-full space-y-3">
            {/* Apprehended - Shows inline with Continue button */}
            <FadeIn show={isApprehended}>
              <div className="bg-green-900/50 border-2 border-green-400 p-6 rounded-lg text-center">
                <div className="text-5xl mb-3">🚔</div>
                <h3 className="text-2xl font-bold text-green-400 mb-2">SUSPECT APPREHENDED!</h3>
                <p className="text-yellow-100 text-lg mb-2">
                  {selectedWarrant?.name} is now in custody.
                </p>
                <p className="text-yellow-200/70 mb-4">
                  Time to face the court and see if you got the right person...
                </p>
                <button
                  onClick={onProceedToTrial}
                  className="bg-yellow-500 hover:bg-yellow-400 text-black font-bold py-3 px-6 rounded-lg text-lg transition-all"
                >
                  Continue to Trial
                </button>
              </div>
            </FadeIn>

            {/* Unified Encounter Card - handles henchman, assassination, and good deed */}
            <FadeIn show={!!(activeEncounter && encounterType)}>
              <EncounterCard
                type={encounterType}
                encounter={activeEncounter}
                timerDuration={getTimerDuration()}
                availableGadgets={availableGadgets}
                karma={karma}
                timeRemaining={timeRemaining}
                onResolve={onEncounterResolve}
              />
            </FadeIn>
          </div>
        </div>
      )}

      {/* Investigation Results Banner - above map */}
      {!hasBlockingOverlay && !isAnimating && (lastFoundClue?.city || lastFoundClue?.suspect || lastRogueAction) && (
        <div className="absolute top-4 left-4 right-4 z-20">
          <div className="bg-gray-900/95 backdrop-blur-sm rounded-lg overflow-hidden shadow-lg">
            {(
              <>
                {/* Rogue Action Result */}
                {lastRogueAction && (
                  <div className="p-4 border-l-4 border-orange-500">
                    <p className="text-yellow-100 italic">"{lastRogueAction.success_text}"</p>
                    <p className="text-red-400 text-xs mt-2">
                      <AlertTriangle size={10} className="inline mr-1" />
                      +{lastRogueAction.notoriety_gain} notoriety
                    </p>
                  </div>
                )}

                {/* Investigation Result - any clue type (same styling) */}
                {(lastFoundClue?.city || lastFoundClue?.suspect) && (
                  <div className="p-4 border-l-4 border-yellow-500">
                    <p className="text-yellow-100 italic">"{lastFoundClue.city || lastFoundClue.suspect}"</p>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      )}

      {/* Wrong City Message - banner at top */}
      {wrongCity && !hasBlockingOverlay && (
        <div className="absolute top-4 left-1/2 transform -translate-x-1/2 bg-red-800/95 backdrop-blur-sm px-6 py-3 rounded-lg text-center shadow-lg z-20">
          <p className="text-yellow-200">
            The trail seems cold here... but you can still ask around.
          </p>
        </div>
      )}

      {/* Option Tray - Always horizontal at bottom */}
      {!hasBlockingOverlay && (
        <div className="absolute bottom-0 left-0 right-0 h-48 p-4 bg-gray-900/90 backdrop-blur-sm z-30">
          <OptionTray orientation="horizontal">
            {/* Investigation Spots */}
            {cityClues.map((clue, i) => {
              const investigated = investigatedLocations.includes(clue.spot.id);
              const actionBusy = actionPhase && actionPhase !== 'idle';

              return (
                <div key={clue.spot.id} className="snap-start">
                  <OptionCard
                    icon={clue.spot.icon || '📍'}
                    title={clue.spot.name}
                    subtitle={clue.spot.neighborhood || currentCity?.name}
                    duration={nextInvestigationCost}
                    transfers={0}
                    disabled={investigated || timeRemaining < nextInvestigationCost || isInvestigating || actionBusy}
                    selected={hoveredSpotId === clue.spot.id}
                    onClick={() => !investigated && handleInvestigateClick(i)}
                    variant="investigation"
                  />
                </div>
              );
            })}

            {/* Rogue Action as option in tray */}
            {availableRogueAction && onRogueAction && rogueLocation && (
              <div key="rogue-action" className="snap-start">
                <OptionCard
                  icon={rogueLocation.icon || "⚡"}
                  title={rogueLocation.name || availableRogueAction.name}
                  subtitle={rogueLocation.neighborhood || "Rogue Tactic"}
                  duration={rogueLocation.time_cost || ROGUE_TIME_COST}
                  transfers={0}
                  disabled={rogueUsedInCity || timeRemaining < (rogueLocation.time_cost || ROGUE_TIME_COST) || isInvestigating || (actionPhase && actionPhase !== 'idle')}
                  selected={false}
                  onClick={() => onRogueAction(availableRogueAction)}
                  variant="investigation"
                />
              </div>
            )}
          </OptionTray>
        </div>
      )}
    </div>
  );
}

export default InvestigateTab;
