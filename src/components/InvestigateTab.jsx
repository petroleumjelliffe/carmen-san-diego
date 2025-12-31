import { useState, useEffect, useMemo } from 'react';
import { Zap, AlertTriangle, Loader } from 'lucide-react';
import { EncounterDisplay } from './EncounterDisplay';
import { MessageDisplay } from './MessageDisplay';
import { FadeIn } from './FadeIn';
import { CityMapView } from './CityMapView';
import { OptionCard } from './OptionCard';
import { OptionTray } from './OptionTray';
import { pickRandom } from '../utils/helpers';

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
  cityFact,
  actionPhase,
  actionLabel,
  actionHoursRemaining,
  currentCity,
  hotel,
  rogueLocation,
  witnessPhrases,
}) {
  const [hoveredSpotId, setHoveredSpotId] = useState(null);
  const [investigatingSpotIndex, setInvestigatingSpotIndex] = useState(null);
  const [isInvestigatingRogue, setIsInvestigatingRogue] = useState(false);

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

  // Clear investigating index after animation completes (1.5s)
  useEffect(() => {
    if (investigatingSpotIndex !== null) {
      const timeout = setTimeout(() => {
        setInvestigatingSpotIndex(null);
      }, 1500); // Match animation duration in CityMapView

      return () => clearTimeout(timeout);
    }
  }, [investigatingSpotIndex]);

  // Clear rogue investigating flag after animation completes (1.5s)
  useEffect(() => {
    if (isInvestigatingRogue) {
      const timeout = setTimeout(() => {
        setIsInvestigatingRogue(false);
      }, 1500);

      return () => clearTimeout(timeout);
    }
  }, [isInvestigatingRogue]);

  // Handler for rogue action - sets animation flag and calls parent handler
  const handleRogueClick = () => {
    if (availableRogueAction && onRogueAction) {
      setIsInvestigatingRogue(true);
      onRogueAction(availableRogueAction);
    }
  };

  if (!cityClues) return null;

  const ROGUE_TIME_COST = 2;

  // Use the city's randomized rogue action
  const availableRogueAction = cityRogueAction;

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

  // No blocking overlays - all messages in banner area
  const hasBlockingOverlay = false;

  // Determine if animation is in progress
  const isAnimating = actionPhase === 'ticking' || actionPhase === 'pending';

  // Memoize clue text to prevent re-rendering ClueDisplay
  const rogueClueText = useMemo(() => {
    if (!lastRogueAction) return '';
    // Concatenate both city and suspect clues for rogue actions
    const cityClue = lastFoundClue?.city || '';
    const suspectClue = lastFoundClue?.suspect || '';

    let concatenated = '';
    if (cityClue && suspectClue) {
      // Both clues - concatenate with period separator
      const cityEnding = /[.!?]$/.test(cityClue) ? '' : '.';
      concatenated = `${cityClue}${cityEnding} ${suspectClue}`;
    } else {
      // Only one clue
      concatenated = cityClue || suspectClue || '';
    }

    // Add fear phrase to concatenated result
    if (concatenated && witnessPhrases && witnessPhrases.length > 0) {
      const phrase = pickRandom(witnessPhrases);
      const needsPeriod = !/[.!?]$/.test(concatenated);
      return `${concatenated}${needsPeriod ? '.' : ''} ${phrase}`;
    }

    return concatenated;
  }, [lastRogueAction, lastFoundClue, witnessPhrases]);

  // Memoize rogue action descriptive text (description + success text)
  const rogueDescriptiveText = useMemo(() => {
    if (!lastRogueAction) return '';
    const description = lastRogueAction.description || '';
    const successText = lastRogueAction.success_text || '';

    if (description && successText) {
      const descEnding = /[.!?]$/.test(description) ? '' : '.';
      return `${description}${descEnding} ${successText}`;
    }
    return description || successText || lastRogueAction.name || '';
  }, [lastRogueAction]);

  const regularClueText = useMemo(() => {
    if (lastRogueAction) return ''; // Don't compute if rogue action is active
    const clue = lastFoundClue?.city || lastFoundClue?.suspect;
    return clue ? String(clue).trim() : '';
  }, [lastRogueAction, lastFoundClue]);

  // Note: We don't clear investigatingSpotIndex when action completes
  // because the animation in CityMapView needs it to persist for the full 1.5s animation duration

  return (
    <div className="relative h-[600px]">
      {/* City Map Background */}
      <div className="absolute inset-0 z-0">
          <CityMapView
            currentCity={currentCity}
            spots={cityClues}
            investigatedSpots={investigatedLocations}
            onSpotClick={handleInvestigateClick}
            hoveredSpotId={hoveredSpotId}
            onSpotHover={setHoveredSpotId}
            investigatingSpotIndex={investigatingSpotIndex}
            hotel={hotel}
            rogueLocation={rogueLocation}
            lastInvestigatedSpotId={lastInvestigatedSpotId}
            onRogueClick={availableRogueAction && onRogueAction ? handleRogueClick : null}
            rogueUsed={rogueUsedInCity}
            isInvestigatingRogue={isInvestigatingRogue}
            isAnimating={isAnimating}
          />
      </div>

      {/* Message Banner - above map (encounters and clues) */}
      <div className="absolute top-4 left-4 right-4 z-20 space-y-2">
        {/* Apprehension Message */}
          {isApprehended && (
            <MessageDisplay
              type="witness"
              headerTitle="SUSPECT APPREHENDED!"
              headerIcon={<span className="text-2xl">🚔</span>}
              personEmoji="🚔"
              quote={`${selectedWarrant?.name} is now in custody. Time to face the court and see if you got the right person...`}
              showQuotes={false}
              onContinue={onProceedToTrial}
            />
          )}

          {/* Active Encounter - handles henchman, assassination, and good deed */}
          {!isAnimating && !isApprehended && activeEncounter && encounterType && (
            <EncounterDisplay
              type={encounterType}
              encounter={activeEncounter}
              timerDuration={getTimerDuration()}
              availableGadgets={availableGadgets}
              karma={karma}
              timeRemaining={timeRemaining}
              onResolve={onEncounterResolve}
            />
          )}

          {/* Active Rogue Action - shown before clue reveal */}
          {!isAnimating && !isApprehended && !activeEncounter && activeRogueAction && (
            <div className="space-y-2">
              {/* Header */}
              <div className="bg-gray-900/95 backdrop-blur-sm rounded-lg p-4 border-l-4 border-yellow-500">
                <div className="flex items-center gap-3">
                  <span className="text-2xl">⚡</span>
                  <h3 className="text-lg font-bold text-purple-400">UNORTHODOX METHODS</h3>
                </div>
              </div>

              {/* Rogue action description */}
              <div className="bg-gray-900/95 backdrop-blur-sm rounded-lg p-4 border-l-4 border-yellow-500">
                <p className="text-yellow-100 text-lg leading-relaxed">
                  {activeRogueAction.action.description} {activeRogueAction.action.success_text}
                </p>
              </div>

              {/* Continue button */}
              <div className="px-2">
                <button
                  onClick={onResolveRogueAction}
                  className="w-full font-bold py-3 rounded transition-colors bg-gray-700 hover:bg-gray-600 text-white"
                >
                  CONTINUE
                </button>
              </div>
            </div>
          )}

          {/* Investigation Results - only show if no encounter or active rogue action */}
          {!isAnimating && !isApprehended && !activeEncounter && !activeRogueAction && (lastFoundClue?.city || lastFoundClue?.suspect || lastRogueAction) && (
            <>
              {/* Rogue Action Clue (after rogue action resolved) */}
              {lastRogueAction && (
                <div className="space-y-2">
                  <MessageDisplay
                    type="witness"
                    quote={rogueClueText}
                    showQuotes={false}
                  />
                  {/* Notoriety warning */}
                  <div className="bg-red-900/50 border-l-4 border-red-500 p-3 rounded-lg">
                    <p className="text-red-400 text-sm flex items-center gap-2">
                      <AlertTriangle size={14} />
                      Word spreads about your methods.
                    </p>
                  </div>
                </div>
              )}

              {/* Investigation Result - any clue type (only show if no rogue action) */}
              {(lastFoundClue?.city || lastFoundClue?.suspect) && !lastRogueAction && (
                <MessageDisplay
                  type="witness"
                  quote={regularClueText}
                />
              )}
            </>
          )}
      </div>

      {/* Wrong City Message - banner at top */}
      {wrongCity && (
        <div className="absolute top-4 left-1/2 transform -translate-x-1/2 bg-red-800/95 backdrop-blur-sm px-6 py-3 rounded-lg text-center shadow-lg z-20">
          <p className="text-yellow-200">
            The trail seems cold here... but you can still ask around.
          </p>
        </div>
      )}

      {/* Option Tray - Always horizontal at bottom */}
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
                  onClick={handleRogueClick}
                  variant="investigation"
                />
              </div>
            )}
          </OptionTray>
      </div>
    </div>
  );
}

export default InvestigateTab;
