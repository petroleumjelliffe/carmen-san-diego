import { useEffect, useCallback, useState, useMemo, useRef } from 'react';
import { useGameMachine } from '../hooks/useGameMachine.jsx';
import { useTravelAnimation } from '../hooks/useTravelAnimation';
import { useActionQueue } from '../hooks/useActionQueue';
import { generateCase } from '../utils/caseGenerator';
import { generateCluesForCity, getDestinations } from '../utils/clueGenerator';
import { pickRandom } from '../utils/helpers';
import { getDistanceKm, getTravelHours } from '../state/types.js';
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
import { VersionWarning } from './VersionWarning';

export function Game({ gameData }) {
  // ============================================
  // XSTATE MACHINE
  // ============================================
  const {
    state,
    context,
    isMenu,
    isBriefing,
    isPlaying,
    isIdle,
    isTraveling: xstateTraveling,
    isInvestigating: xstateInvestigating,
    isEncounter,
    isWitnessClue,
    isSleeping,
    isConfirmingSleep,
    isApprehended,
    isTrial,
    isDebrief,
    isChoosingAction,
    isChoosingGoodDeed,
    isResolvingEncounter,
    startCase,
    acceptBriefing,
    continueFromClue,
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
    confirmSleep,
    proceedToTrial,
    completeTrial,
    returnToMenu,
  } = useGameMachine();

  const { ranks, suspects, settings, rogueActions, encounterTimers, citiesById, backgrounds, witnessPhrases, goodDeeds, fakeGoodDeeds } = gameData;

  // ============================================
  // LOCAL UI STATE
  // ============================================
  const [activeTab, setActiveTab] = useState('home');
  const [message, setMessage] = useState(null);
  const [showVersionWarning, setShowVersionWarning] = useState(false);
  const [selectedTraits, setSelectedTraits] = useState({ gender: null, hair: null, hobby: null });

  // Clue display state (XState tracks investigation, but we track clue text for UI)
  const [collectedClues, setCollectedClues] = useState({ city: [], suspect: [] });
  const [lastFoundClue, setLastFoundClue] = useState({ city: null, suspect: null });
  const [lastRogueAction, setLastRogueAction] = useState(null);
  const [activeRogueAction, setActiveRogueAction] = useState(null);
  const [lastSleepResult, setLastSleepResult] = useState(null);

  // Encounter display data
  const [currentGoodDeed, setCurrentGoodDeed] = useState(null);
  const [currentEncounter, setCurrentEncounter] = useState(null);

  // Travel animation coordination
  const [localTravelOrigin, setLocalTravelOrigin] = useState(null);
  const [localTravelDestination, setLocalTravelDestination] = useState(null);
  const [lastVisitedLocation, setLastVisitedLocation] = useState(null);

  // Investigation pending state
  const pendingInvestigationRef = useRef(null);

  // ============================================
  // DERIVED VALUES FROM XSTATE CONTEXT
  // ============================================
  const currentCase = context.currentCase;
  const cityIndex = context.cityIndex;
  const timeRemaining = context.timeRemaining;
  const currentHour = context.currentHour;
  const wrongCity = context.wrongCity;
  const rogueUsedInCity = context.rogueUsedInCity;
  const karma = context.karma;
  const notoriety = context.notoriety;
  const availableGadgets = context.availableGadgets || [];
  const selectedWarrant = context.selectedWarrant;

  // Convert state to gameState string for compatibility
  const gameState = useMemo(() => {
    if (isMenu) return 'menu';
    if (isBriefing) return 'briefing';
    if (isApprehended) return 'apprehended';
    if (isTrial) return 'trial';
    if (isDebrief) return 'debrief';
    return 'playing';
  }, [isMenu, isBriefing, isApprehended, isTrial, isDebrief]);

  // Current city data
  const currentCity = useMemo(() => {
    if (!currentCase) return null;
    const cityId = currentCase.cities[cityIndex];
    return cityId ? citiesById[cityId] : null;
  }, [currentCase, cityIndex, citiesById]);

  const isFinalCity = currentCase && cityIndex === currentCase.cities.length - 1;

  // Wrong city data for display
  const wrongCityData = useMemo(() => {
    if (!wrongCity || !context.currentCityId) return null;
    const city = citiesById[context.currentCityId];
    return city ? { id: city.id, name: city.name, country: city.country, fact: city.fact } : null;
  }, [wrongCity, context.currentCityId, citiesById]);

  // City clues (computed when city changes)
  const cityClues = useMemo(() => {
    if (!currentCase || cityIndex === undefined) return null;
    return generateCluesForCity(gameData, currentCase, cityIndex, wrongCity);
  }, [gameData, currentCase, cityIndex, wrongCity]);

  // Destinations for travel
  const destinations = useMemo(() => {
    if (!currentCase || gameState !== 'playing') return [];
    return getDestinations(gameData, currentCase, cityIndex);
  }, [gameData, currentCase, cityIndex, gameState]);

  // Investigated locations for current city (returns spot.id strings for CityMapView compatibility)
  const investigatedLocations = useMemo(() => {
    const indices = context.investigatedSpots
      .filter(s => s.startsWith(`${context.currentCityId}:`))
      .map(s => parseInt(s.split(':')[1], 10));

    if (!cityClues) {
      console.warn('[DEBUG] investigatedLocations: cityClues is null/undefined');
      return [];
    }

    const result = indices.map(idx => cityClues[idx]?.spot?.id).filter(Boolean);

    // DEBUG: Log what we're computing
    console.log('[DEBUG] investigatedLocations:', {
      raw: context.investigatedSpots,
      currentCity: context.currentCityId,
      indices,
      cityCluesLength: cityClues?.length,
      cityClueIds: cityClues?.map(c => c?.spot?.id),
      result,
      resultTypes: result.map(r => typeof r),
    });

    // ASSERTION: Throw if we accidentally return numbers instead of strings
    result.forEach((item, i) => {
      if (typeof item !== 'string') {
        throw new Error(`[BUG] investigatedLocations[${i}] is ${typeof item} (${item}), expected string`);
      }
    });

    return result;
  }, [context.investigatedSpots, context.currentCityId, cityClues]);

  // Progressive investigation cost
  const nextInvestigationCost = useMemo(() => {
    const baseCost = 2;
    return baseCost * Math.pow(2, context.spotsUsedInCity);
  }, [context.spotsUsedInCity]);

  // City-specific data
  const hotel = currentCase?.cityData?.[cityIndex]?.hotel || null;
  const rogueLocation = currentCase?.cityData?.[cityIndex]?.rogueLocation || null;
  const cityRogueAction = currentCase?.cityData?.[cityIndex]?.rogueAction || null;

  // Solved cases count
  const solvedCases = Array.isArray(context.solvedCases) ? context.solvedCases.length : 0;

  // Permanent injuries and saved NPCs (placeholder until added to machine)
  const permanentInjuries = [];
  const savedNPCs = [];

  // ============================================
  // ACTION QUEUE (for time-based animations)
  // ============================================
  const advanceTimeByOne = useCallback(() => {
    // XState handles time internally; this is for animation sync
    return false;
  }, []);

  const {
    phase: actionPhase,
    pendingAction,
    hoursRemaining: actionHoursRemaining,
    isBusy: isActionBusy,
    queueAction,
    completeAction,
  } = useActionQueue({
    onTickHour: advanceTimeByOne,
    tickSpeed: (settings.time_tick_speed || 0.5) * 1000,
    spinnerDuration: 500,
  });

  // ============================================
  // ACTION HANDLERS
  // ============================================

  // Start new case
  const startNewCase = useCallback(() => {
    const newCase = generateCase(gameData);

    // Reset local UI state
    setCollectedClues({ city: [], suspect: [] });
    setLastFoundClue({ city: null, suspect: null });
    setLastRogueAction(null);
    setActiveRogueAction(null);
    setCurrentGoodDeed(null);
    setCurrentEncounter(null);
    setLastSleepResult(null);
    setMessage(null);
    setActiveTab('investigate');
    setSelectedTraits({ gender: null, hair: null, hobby: null });

    // Send to state machine
    startCase(newCase);
  }, [gameData, startCase]);

  // Accept briefing
  const handleAcceptBriefing = useCallback(() => {
    acceptBriefing();
    setActiveTab('home');
  }, [acceptBriefing]);

  // Investigate location
  const handleInvestigate = useCallback((locationIndex) => {
    console.log('[DEBUG] ===== handleInvestigate CALLED =====');
    console.log('[DEBUG] locationIndex:', locationIndex);
    console.log('[DEBUG] cityClues:', cityClues);
    console.log('[DEBUG] investigatedLocations:', investigatedLocations);
    console.log('[DEBUG] context.spotsUsedInCity:', context.spotsUsedInCity);
    console.log('[DEBUG] timeRemaining:', timeRemaining);

    if (!cityClues || !cityClues[locationIndex]) {
      console.log('[DEBUG] EARLY RETURN: No city clues or invalid locationIndex');
      return;
    }

    const clue = cityClues[locationIndex];
    const spot = clue.spot;
    console.log('[DEBUG] spot:', spot);
    console.log('[DEBUG] spot.id:', spot?.id);

    // Check if already investigated (compare by spot.id)
    if (investigatedLocations.includes(spot?.id)) {
      console.log('[DEBUG] EARLY RETURN: Location already investigated');
      return;
    }

    // Check time
    const timeCost = 2 * Math.pow(2, context.spotsUsedInCity);
    console.log('[DEBUG] timeCost:', timeCost);
    if (timeRemaining < timeCost) {
      console.log('[DEBUG] EARLY RETURN: Not enough time');
      setMessage("Not enough time for this investigation!");
      return;
    }

    console.log('[DEBUG] All checks passed - setting pendingInvestigationRef');
    // Store pending investigation with timestamp
    pendingInvestigationRef.current = {
      locationIndex,
      spot,
      clue,
      timeCost,
      timestamp: Date.now(),
    };

    // Clear previous displays
    setLastFoundClue({ city: null, suspect: null });
    setLastRogueAction(null);
    setLastSleepResult(null);

    console.log('[DEBUG] Current state machine state:', state.value);
    console.log('[DEBUG] isIdle:', isIdle);
    console.log('[DEBUG] isPlaying:', isPlaying);
    console.log('[DEBUG] Calling investigate() with locationIndex:', locationIndex);
    // Send to state machine - use locationIndex, not spotsUsedInCity
    // Machine will validate with hasAvailableSpots guard
    investigate(locationIndex, false);
    console.log('[DEBUG] investigate() called - waiting for state machine response');
    console.log('[DEBUG] State after investigate():', state.value);

    // DON'T return action config - queuing happens in useEffect when machine confirms
  }, [cityClues, investigatedLocations, context.spotsUsedInCity, timeRemaining, investigate]);

  // Complete investigation - reveal clue
  const completeInvestigation = useCallback(() => {
    console.log('[DEBUG] completeInvestigation called! pendingInvestigationRef.current:', pendingInvestigationRef.current);

    const pending = pendingInvestigationRef.current;
    if (!pending) {
      throw new Error('[BUG] completeInvestigation called but pendingInvestigationRef is null - was it cleared prematurely?');
    }

    const { spot, clue } = pending;
    pendingInvestigationRef.current = null;

    // Normalize coordinates (.lng -> .lon) for travel animation
    const visitedLoc = {
      ...spot,
      lon: spot.lon || spot.lng,
    };
    console.log('[DEBUG] completeInvestigation - setting lastVisitedLocation:', visitedLoc);
    setLastVisitedLocation(visitedLoc);

    // Reveal clue
    setLastFoundClue({
      city: clue.destinationClue,
      suspect: clue.suspectClue
    });

    // Store clues
    const cityName = currentCity?.name || 'Unknown';
    const locationName = spot?.name || 'Unknown';

    if (clue.destinationClue) {
      setCollectedClues(prev => ({
        ...prev,
        city: [...prev.city, { text: clue.destinationClue, cityName, locationName, timeCollected: currentHour }],
      }));
    }
    if (clue.suspectClue) {
      setCollectedClues(prev => ({
        ...prev,
        suspect: [...prev.suspect, { text: clue.suspectClue, cityName, locationName, timeCollected: currentHour }],
      }));
    }

    // Check for encounters
    if (context.encounterType === 'goodDeed' && goodDeeds) {
      const deed = pickRandom(goodDeeds);
      setCurrentGoodDeed({ ...deed, isFake: false });
    } else if (['henchman', 'assassination'].includes(context.encounterType)) {
      const cityData = currentCase?.cityData?.[cityIndex];
      const preAssignedEncounter = cityData?.encounter;
      if (preAssignedEncounter) {
        setCurrentEncounter({ ...preAssignedEncounter, type: context.encounterType });
      }
    }

    // Send CONTINUE event to state machine to return to idle
    continueFromClue();
  }, [currentCity, currentHour, context.encounterType, goodDeeds, currentCase, cityIndex, continueFromClue]);

  // Watch for machine confirmation of investigation (guard passed)
  // NOTE: investigating is a transient state - machine immediately transitions to witnessClue or encounter
  // So we check for those states instead of the transient investigating state
  useEffect(() => {
    const pending = pendingInvestigationRef.current;
    console.log('[DEBUG] investigation useEffect FIRED');
    console.log('[DEBUG] - state.value:', state.value);
    console.log('[DEBUG] - isIdle:', isIdle);
    console.log('[DEBUG] - isWitnessClue:', isWitnessClue);
    console.log('[DEBUG] - isEncounter:', isEncounter);
    console.log('[DEBUG] - pending:', pending);

    // Machine transitioned through investigating state and is now in witnessClue or encounter
    // This means the guard passed and investigation was recorded
    // Only queue if not already queued (prevent double-queuing on re-renders)
    if ((isWitnessClue || isEncounter) && pending && !pending.queued) {
      console.log('[DEBUG] Queuing investigation action for:', pending.spot?.name);

      // Mark as queued to prevent double-queuing
      pendingInvestigationRef.current = { ...pending, queued: true };

      queueAction({
        type: 'investigate',
        hoursCost: pending.timeCost,
        spinnerDuration: 500,
        label: `Investigating ${pending.spot?.name || 'location'}...`,
        onComplete: () => {
          console.log('[DEBUG] Investigation onComplete callback running!');
          completeInvestigation();
          completeAction();
        },
      });

      // Don't clear ref here - it will be cleared in completeInvestigation
      // This ensures completeInvestigation has access to the data it needs
    }
  }, [state, isIdle, isWitnessClue, isEncounter, queueAction, completeInvestigation, completeAction]);

  // Watch for machine guard rejection
  useEffect(() => {
    const pending = pendingInvestigationRef.current;
    console.log('[DEBUG] guard rejection useEffect FIRED');
    console.log('[DEBUG] - isIdle:', isIdle);
    console.log('[DEBUG] - pending:', pending);
    console.log('[DEBUG] - pending.queued:', pending?.queued);

    // Machine is idle but we have a pending investigation - guard must have rejected it
    // Only clear if NOT already queued (queued means it was accepted)
    if (isIdle && pending && !pending.queued) {
      console.log('[DEBUG] Machine is idle with pending investigation - checking if guard rejected...');
      // Check if request is stale (>1 second old)
      const isStale = Date.now() - pending.timestamp > 1000;

      if (isStale) {
        console.log('[DEBUG] Investigation is stale - guard rejected it!');
        // Guard rejected the investigation (e.g., no spots available)
        setMessage("Investigation not available right now");
        pendingInvestigationRef.current = null;
      } else {
        console.log('[DEBUG] Investigation is NOT stale - machine might still be transitioning');
      }
      // If not stale, machine might still be transitioning - wait
    }
  }, [isIdle]);

  // Wrapped investigate for action queue
  const queuedInvestigate = useCallback((locationIndex) => {
    // Just send the investigate intent - queuing happens in useEffect when machine confirms
    handleInvestigate(locationIndex);
  }, [handleInvestigate]);

  // Rogue investigate
  const rogueInvestigate = useCallback((rogueAction) => {
    if (!cityClues) return null;
    if (rogueUsedInCity) return null;

    const ROGUE_TIME_COST = 2;
    if (timeRemaining < ROGUE_TIME_COST) {
      setMessage("Not enough time for this action!");
      return null;
    }

    const locationClueData = cityClues.find(c => c.destinationClue);
    const suspectClueData = cityClues.find(c => c.suspectClue);

    pendingInvestigationRef.current = {
      rogueAction,
      locationClue: locationClueData?.destinationClue,
      suspectClue: suspectClueData?.suspectClue,
    };

    setLastFoundClue({ city: null, suspect: null });
    setLastRogueAction(null);
    setLastSleepResult(null);

    investigate(context.spotsUsedInCity, true);

    return {
      type: 'rogue',
      hoursCost: ROGUE_TIME_COST,
      spinnerDuration: 300,
      label: `${rogueAction.name}...`,
    };
  }, [cityClues, rogueUsedInCity, timeRemaining, context.spotsUsedInCity, investigate]);

  // Complete rogue investigation
  const completeRogueInvestigation = useCallback(() => {
    const pending = pendingInvestigationRef.current;
    if (!pending) {
      throw new Error('[BUG] completeRogueInvestigation called but pendingInvestigationRef is null - was it cleared prematurely?');
    }

    const { rogueAction, locationClue, suspectClue } = pending;
    pendingInvestigationRef.current = null;

    const rogueSpot = currentCase?.cityData?.[cityIndex]?.rogueLocation;
    if (rogueSpot) {
      // Normalize coordinates (.lng -> .lon) for travel animation
      setLastVisitedLocation({
        ...rogueSpot,
        lon: rogueSpot.lon || rogueSpot.lng,
      });
    }

    setActiveRogueAction({ action: rogueAction, locationClue, suspectClue });

    const cityName = currentCity?.name || 'Unknown';
    if (locationClue) {
      setCollectedClues(prev => ({
        ...prev,
        city: [...prev.city, { text: locationClue, cityName, locationName: rogueAction.name, timeCollected: currentHour }],
      }));
    }
    if (suspectClue) {
      setCollectedClues(prev => ({
        ...prev,
        suspect: [...prev.suspect, { text: suspectClue, cityName, locationName: rogueAction.name, timeCollected: currentHour }],
      }));
    }

    // Send CONTINUE event to state machine to return to idle
    continueFromClue();
  }, [currentCase, cityIndex, currentCity, currentHour, continueFromClue]);

  // Wrapped rogue for action queue
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

  // Resolve rogue action display
  const resolveRogueActionDisplay = useCallback(() => {
    if (!activeRogueAction) return;
    const { locationClue, suspectClue, action } = activeRogueAction;
    setActiveRogueAction(null);
    setLastFoundClue({ city: locationClue, suspect: suspectClue });
    setLastRogueAction(action);
  }, [activeRogueAction]);

  // Travel
  const handleTravel = useCallback((destination) => {
    const originCity = wrongCity && wrongCityData
      ? citiesById[wrongCityData.id] || wrongCityData
      : currentCity;
    const destCity = citiesById[destination.cityId];

    if (!originCity || !destCity) return null;

    const distance = getDistanceKm(
      { lat: originCity.lat, lng: originCity.lon || originCity.lng },
      { lat: destCity.lat, lng: destCity.lon || destCity.lng }
    );
    const travelHours = getTravelHours(distance);

    if (timeRemaining < travelHours) {
      setMessage("Not enough time to travel!");
      return null;
    }

    console.log('[DEBUG] handleTravel - lastVisitedLocation:', lastVisitedLocation);
    console.log('[DEBUG] handleTravel - originCity:', originCity);
    const travelOrigin = lastVisitedLocation || originCity;
    console.log('[DEBUG] handleTravel - using origin:', travelOrigin);
    setLocalTravelOrigin(travelOrigin);
    setLocalTravelDestination(destination);

    travel(destCity, originCity, destination.isCorrect);

    return travelHours;
  }, [wrongCity, wrongCityData, currentCity, citiesById, timeRemaining, lastVisitedLocation, travel]);

  // Get travel time config
  const getTravelTimeConfig = useCallback(() => {
    if (!localTravelDestination) return null;

    const originCity = wrongCity && wrongCityData
      ? citiesById[wrongCityData.id] || wrongCityData
      : currentCity;
    const destCity = citiesById[localTravelDestination.cityId];

    if (!originCity || !destCity) return null;

    const distance = getDistanceKm(
      { lat: originCity.lat, lng: originCity.lon || originCity.lng },
      { lat: destCity.lat, lng: destCity.lon || destCity.lng }
    );

    return {
      type: 'travel',
      hoursCost: getTravelHours(distance),
      spinnerDuration: 0,
      label: 'Arriving...',
    };
  }, [localTravelDestination, wrongCity, wrongCityData, currentCity, citiesById]);

  // Complete travel
  const completeTravelAnimation = useCallback(() => {
    setLocalTravelOrigin(null);
    setLocalTravelDestination(null);

    // Set last visited location to hotel (if available) for next travel animation
    const arrivalHotel = currentCase?.cityData?.[cityIndex]?.hotel;
    if (arrivalHotel) {
      setLastVisitedLocation({
        ...arrivalHotel,
        lon: arrivalHotel.lon || arrivalHotel.lng,
      });
    } else {
      setLastVisitedLocation(null);
    }

    setLastFoundClue({ city: null, suspect: null });
    setLastRogueAction(null);
    setLastSleepResult(null);

    arrive();
    setActiveTab('home');
  }, [arrive, currentCase, cityIndex]);

  // Flight animation complete handler
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
      completeTravelAnimation();
    }
  }, [getTravelTimeConfig, queueAction, completeTravelAnimation, completeAction]);

  // Encounter resolution
  const handleEncounterResolve = useCallback((result) => {
    if (!result) return;

    const { type, outcome, gadgetId, npcName } = result;

    if (type === 'good_deed') {
      if (outcome === 'helped') {
        helpNpc();
      } else {
        ignoreNpc();
      }
      setCurrentGoodDeed(null);
    } else if (['henchman', 'assassination'].includes(context.encounterType)) {
      if (gadgetId) {
        chooseGadget(gadgetId);
      } else {
        chooseEndure();
      }
      setCurrentEncounter(null);
    }

    setTimeout(() => resolveEncounter(), 100);
  }, [context.encounterType, helpNpc, ignoreNpc, chooseGadget, chooseEndure, resolveEncounter]);

  // Issue warrant
  const issueWarrant = useCallback(() => {
    if (!selectedWarrant) {
      setMessage("Select a suspect first!");
      return;
    }
    setMessage(`Warrant issued for ${selectedWarrant.name}!`);
  }, [selectedWarrant]);

  // Warrant selection (local - would need to sync to machine for full integration)
  const setSelectedWarrant = useCallback((warrant) => {
    // TODO: sync to machine context
  }, []);

  // Handle proceed to trial
  const handleProceedToTrial = useCallback(() => {
    proceedToTrial();
  }, [proceedToTrial]);

  // Handle complete trial
  const handleCompleteTrial = useCallback(() => {
    completeTrial();
  }, [completeTrial]);

  // Handle return to menu
  const handleReturnToMenu = useCallback(() => {
    returnToMenu();
  }, [returnToMenu]);

  // Trait cycling
  const cycleSelectedTrait = useCallback((trait) => {
    const traitOptions = {
      gender: [null, 'male', 'female'],
      hair: [null, 'dark', 'light'],
      hobby: [null, 'intellectual', 'physical'],
    };
    setSelectedTraits(prev => {
      const options = traitOptions[trait];
      const currentIndex = options.indexOf(prev[trait]);
      const nextIndex = (currentIndex + 1) % options.length;
      return { ...prev, [trait]: options[nextIndex] };
    });
  }, []);

  const resetSelectedTraits = useCallback(() => {
    setSelectedTraits({ gender: null, hair: null, hobby: null });
  }, []);

  // ============================================
  // TRAVEL ANIMATION
  // ============================================
  const { isAnimating, progress, travelData, startAnimation } = useTravelAnimation(
    handleFlightAnimationComplete
  );

  const [lastTravelData, setLastTravelData] = useState(null);
  const [showMap, setShowMap] = useState(false);

  // Start animation when traveling
  useEffect(() => {
    if (xstateTraveling && localTravelOrigin && localTravelDestination) {
      const destCity = citiesById[localTravelDestination.cityId];
      if (destCity) {
        startAnimation(localTravelOrigin, destCity);
        setShowMap(true);
      }
    }
  }, [xstateTraveling, localTravelOrigin, localTravelDestination, citiesById, startAnimation]);

  useEffect(() => {
    if (travelData) {
      setLastTravelData(travelData);
    }
  }, [travelData]);

  useEffect(() => {
    if (!xstateTraveling && !isAnimating && showMap) {
      const timeout = setTimeout(() => setShowMap(false), 500);
      return () => clearTimeout(timeout);
    }
  }, [xstateTraveling, isAnimating, showMap]);

  // Use xstate traveling state
  const isTraveling = xstateTraveling;
  const isInvestigating = xstateInvestigating;
  const travelOrigin = localTravelOrigin;
  const travelDestination = localTravelDestination;

  // ============================================
  // RENDER
  // ============================================

  // Menu screen
  if (isMenu) {
    return (
      <Menu
        solvedCases={solvedCases}
        ranks={ranks}
        onStartNewCase={startNewCase}
      />
    );
  }

  // Briefing screen
  if (isBriefing) {
    const startingCity = currentCase ? gameData.citiesById[currentCase.cities[0]] : null;
    return (
      <Briefing
        currentCase={currentCase}
        startingCity={startingCity}
        settings={settings}
        onAccept={handleAcceptBriefing}
        backgrounds={backgrounds}
        citiesById={citiesById}
      />
    );
  }

  // Trial screen
  if (isTrial) {
    return (
      <Trial
        currentCase={currentCase}
        selectedWarrant={selectedWarrant}
        timeRemaining={timeRemaining}
        onContinue={handleCompleteTrial}
      />
    );
  }

  // Debrief screen
  if (isDebrief) {
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
        onReturnToMenu={handleReturnToMenu}
      />
    );
  }

  // Get background image
  const travelingBackground = backgrounds?.traveling || '';
  const currentCityId = wrongCity && wrongCityData ? wrongCityData.id : currentCity?.id;
  const cityData = currentCityId ? citiesById[currentCityId] : null;
  const currentCityBackground = cityData?.background_image || travelingBackground;
  const backgroundUrl = (isAnimating || isTraveling) ? travelingBackground : currentCityBackground;

  // Main game UI
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

      <div className="flex-1 flex overflow-hidden">
        <TabBar
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          variant="sidebar"
        />

        <div className="flex-1 overflow-y-auto">
          <div
            className="max-w-6xl mx-auto p-4 pb-24 md:pb-4 min-h-full grid"
            style={{ alignItems: isAnimating || (actionPhase === 'ticking' && pendingAction?.type === 'travel') ? 'center' : 'end' }}
          >
            <div>
              {showMap && lastTravelData ? (
                <TravelAnimation
                  travelData={lastTravelData}
                  progress={isAnimating || (actionPhase === 'ticking' && pendingAction?.type === 'travel') ? progress : 1.0}
                  backgroundImage={backgrounds?.traveling}
                />
              ) : null}

              {!showMap || !(isAnimating || (actionPhase === 'ticking' && pendingAction?.type === 'travel')) ? <>
                {message && (
                  <div className="bg-yellow-400/20 border border-yellow-400 text-yellow-100 px-4 py-2 rounded mb-4">
                    {message}
                  </div>
                )}

                {activeTab === 'home' && (
                  <HomeTab
                    currentCity={wrongCity && wrongCityData ? wrongCityData : currentCity}
                    cityFact={wrongCity && wrongCityData ? wrongCityData.fact : currentCity?.fact}
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
                    onResolveRogueAction={resolveRogueActionDisplay}
                    rogueUsedInCity={rogueUsedInCity}
                    currentGoodDeed={currentGoodDeed}
                    karma={karma}
                    onInvestigate={queuedInvestigate}
                    cityRogueAction={cityRogueAction}
                    onRogueAction={handleRogueAction}
                    notoriety={notoriety}
                    currentEncounter={currentEncounter}
                    availableGadgets={availableGadgets}
                    onEncounterResolve={handleEncounterResolve}
                    isApprehended={isApprehended}
                    selectedWarrant={selectedWarrant}
                    onProceedToTrial={handleProceedToTrial}
                    encounterTimers={encounterTimers}
                    isInvestigating={isInvestigating}
                    cityFact={wrongCity && wrongCityData ? wrongCityData.fact : currentCity?.fact}
                    actionPhase={actionPhase}
                    actionLabel={pendingAction?.label}
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
                    travelTime={settings.travel_time}
                    onTravel={handleTravel}
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
                    currentCity={currentCity}
                  />
                )}
              </> : null}
            </div>
          </div>
        </div>
      </div>

      <TabBar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        variant="mobile"
      />

      {showVersionWarning && (
        <VersionWarning onDismiss={() => setShowVersionWarning(false)} />
      )}
    </div>
  );
}

export default Game;
