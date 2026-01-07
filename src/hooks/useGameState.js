import { useState, useCallback, useMemo, useEffect, useRef } from 'react';
import { generateCase } from '../utils/caseGenerator';
import { generateCluesForCity, getDestinations } from '../utils/clueGenerator';
import { pickRandom } from '../utils/helpers';
import { loadSaveState, saveState } from '../utils/saveManager';

/**
 * Custom hook for managing all game state
 */
export function useGameState(gameData) {
  // Game states: menu, briefing, playing, sleeping, warrant, trial, debrief, won, lost
  const [gameState, setGameState] = useState('menu');
  const [currentCase, setCurrentCase] = useState(null);
  const [currentCityIndex, setCurrentCityIndex] = useState(0);
  const [timeRemaining, setTimeRemaining] = useState(72);
  const [currentHour, setCurrentHour] = useState(8); // Time of day (0-23), starts at 8am
  const [collectedClues, setCollectedClues] = useState({ city: [], suspect: [] });
  const [investigatedLocations, setInvestigatedLocations] = useState([]);
  const [selectedWarrant, setSelectedWarrant] = useState(null);
  const [activeTab, setActiveTab] = useState('home');
  const [solvedCases, setSolvedCases] = useState(0);
  const [message, setMessage] = useState(null);
  const [showCutscene, setShowCutscene] = useState(false);
  const [cutsceneText, setCutsceneText] = useState('');
  const [wrongCity, setWrongCity] = useState(false);
  const [wrongCityData, setWrongCityData] = useState(null);
  const [cityClues, setCityClues] = useState(null);
  const [lastFoundClue, setLastFoundClue] = useState({ city: null, suspect: null });
  const [lastGoodDeedResult, setLastGoodDeedResult] = useState(null); // Track last good deed outcome
  const [lastSleepResult, setLastSleepResult] = useState(null); // Track automatic sleep
  const [lastEncounterResult, setLastEncounterResult] = useState(null); // Track henchman/assassination results
  const [rogueUsedInCity, setRogueUsedInCity] = useState(false); // Track if rogue was used in current city
  const [hadEncounterInCity, setHadEncounterInCity] = useState(false); // Track if encounter already happened in current city
  const [activeRogueAction, setActiveRogueAction] = useState(null); // Active rogue action (shown before clue)

  // Phase 3: Karma & Notoriety System (persists across cases)
  const [karma, setKarma] = useState(0); // Good deeds completed
  const [notoriety, setNotoriety] = useState(0); // Rogue actions taken
  const [savedNPCs, setSavedNPCs] = useState([]); // NPCs saved (for rescue chances)
  const [permanentInjuries, setPermanentInjuries] = useState([]); // Injuries from traps
  const [currentGoodDeed, setCurrentGoodDeed] = useState(null); // Current good deed encounter
  const [showRogueActionModal, setShowRogueActionModal] = useState(false);
  const [currentRogueAction, setCurrentRogueAction] = useState(null);
  const [lastRogueAction, setLastRogueAction] = useState(null); // Track last rogue action used
  const [lastVisitedLocation, setLastVisitedLocation] = useState(null); // Track last visited spot/location for travel animation

  // Phase 4: Trivia Encounters (henchman & assassination)
  const [currentEncounter, setCurrentEncounter] = useState(null); // Current henchman/assassination encounter
  const [hadGoodDeedInCase, setHadGoodDeedInCase] = useState(false); // Only one good deed per case

  // Dossier trait selections (persists across tab switches)
  const [selectedTraits, setSelectedTraits] = useState({
    gender: null,   // null | 'male' | 'female'
    hair: null,     // null | 'dark' | 'light'
    hobby: null,    // null | 'intellectual' | 'physical'
  });

  // Version warning for save migration
  const [showVersionWarning, setShowVersionWarning] = useState(false);

  // Investigation animation state
  const [isInvestigating, setIsInvestigating] = useState(false);
  const [pendingInvestigation, setPendingInvestigation] = useState(null); // { locationIndex, spot, clue }
  const [pendingRogueAction, setPendingRogueAction] = useState(null); // { rogueAction, locationClue, suspectClue }

  // Refs to avoid stale closure issues in action queue callbacks
  const pendingInvestigationRef = useRef(null);
  const pendingRogueActionRef = useRef(null);

  // Keep refs in sync with state
  useEffect(() => {
    pendingInvestigationRef.current = pendingInvestigation;
  }, [pendingInvestigation]);

  useEffect(() => {
    pendingRogueActionRef.current = pendingRogueAction;
  }, [pendingRogueAction]);

  // Travel animation state
  const [isTraveling, setIsTraveling] = useState(false);
  const [travelOrigin, setTravelOrigin] = useState(null);
  const [travelDestination, setTravelDestination] = useState(null);

  const { settings, citiesById, investigationSpots, assassinationAttempts, goodDeeds, fakeGoodDeeds, rogueActions, encounters } = gameData;

  // Get tick speed from settings (for syncing clue reveal with clock animation)
  const timeTickSpeed = settings.time_tick_speed || 0.5;

  // Current city data
  const currentCity = useMemo(() => {
    if (!currentCase) return null;
    return citiesById[currentCase.cities[currentCityIndex]];
  }, [currentCase, currentCityIndex, citiesById]);

  const isFinalCity = currentCityIndex === settings.cities_per_case - 1;

  // Generate clues when city changes
  useEffect(() => {
    if (currentCase && currentCity && gameState === 'playing') {
      const newClues = generateCluesForCity(
        gameData,
        currentCase,
        currentCityIndex,
        wrongCity
      );
      setCityClues(newClues);
    }
  }, [currentCase, currentCity, currentCityIndex, wrongCity, gameState, gameData]);

  // Load save state on mount (profile + optionally active case)
  useEffect(() => {
    const { profile, activeCase, versionMismatch } = loadSaveState();

    // Load profile data
    if (profile) {
      setKarma(profile.karma || 0);
      setNotoriety(profile.notoriety || 0);
      setSolvedCases(profile.solvedCases || 0);
      setSavedNPCs(profile.savedNPCs || []);
      setPermanentInjuries(profile.injuries || []);
    }

    // Load active case if available and version matches
    if (activeCase && !versionMismatch) {
      setCurrentCase(activeCase.case);
      setCurrentCityIndex(activeCase.currentCityIndex);
      setTimeRemaining(activeCase.timeRemaining);
      setCurrentHour(activeCase.currentHour);
      setCollectedClues(activeCase.collectedClues);
      setInvestigatedLocations(activeCase.investigatedLocations);
      setSelectedWarrant(activeCase.selectedWarrant);
      setHadGoodDeedInCase(activeCase.hadGoodDeedInCase);
      setHadEncounterInCity(activeCase.hadEncounterInCity);
      setRogueUsedInCity(activeCase.rogueUsedInCity);
      setSelectedTraits(activeCase.selectedTraits);
      setWrongCity(activeCase.wrongCity);
      setWrongCityData(activeCase.wrongCityData);
      setGameState('playing');
    }

    // Show version warning if save was incompatible
    if (versionMismatch) {
      setShowVersionWarning(true);
    }
  }, []);

  // Helper to save current game state
  const saveCurrentState = useCallback(() => {
    const gameStateSnapshot = {
      karma,
      notoriety,
      solvedCases,
      savedNPCs,
      permanentInjuries,
      currentCase,
      currentCityIndex,
      timeRemaining,
      currentHour,
      collectedClues,
      investigatedLocations,
      selectedWarrant,
      hadGoodDeedInCase,
      hadEncounterInCity,
      rogueUsedInCity,
      selectedTraits,
      wrongCity,
      wrongCityData
    };

    saveState(gameStateSnapshot, true); // immediate save
  }, [
    karma,
    notoriety,
    solvedCases,
    savedNPCs,
    permanentInjuries,
    currentCase,
    currentCityIndex,
    timeRemaining,
    currentHour,
    collectedClues,
    investigatedLocations,
    selectedWarrant,
    hadGoodDeedInCase,
    hadEncounterInCity,
    rogueUsedInCity,
    selectedTraits,
    wrongCity,
    wrongCityData
  ]);

  // Start a new case (show briefing)
  const startNewCase = useCallback(() => {
    const newCase = generateCase(gameData);
    const initialClues = generateCluesForCity(gameData, newCase, 0, false);

    setCurrentCase(newCase);
    setCurrentCityIndex(0);
    setTimeRemaining(settings.total_time);
    setCurrentHour(8); // Start at 8am
    setCollectedClues({ city: [], suspect: [] });
    setInvestigatedLocations([]);
    setSelectedWarrant(null);
    setActiveTab('investigate');
    setGameState('briefing'); // Show briefing first
    setMessage(null);
    setShowCutscene(false);
    setWrongCity(false);
    setWrongCityData(null);
    setCityClues(initialClues);
    setLastFoundClue({ city: null, suspect: null });

    // Reset encounter state for new case
    setLastGoodDeedResult(null);
    setLastSleepResult(null);
    setLastEncounterResult(null);
    setLastRogueAction(null);
    setCurrentGoodDeed(null);
    setCurrentEncounter(null);
    setUsedGadgets([]); // Reset gadgets for new case
    setHadGoodDeedInCase(false); // Reset good deed flag for new case
    setRogueUsedInCity(false);
    setHadEncounterInCity(false);
    setSelectedTraits({ gender: null, hair: null, hobby: null }); // Reset trait selections
  }, [gameData, settings.total_time]);

  // Accept briefing and start playing
  const acceptBriefing = useCallback(() => {
    setGameState('playing');
    setActiveTab('home'); // Start at home tab to show city fact

    // Save game state after accepting briefing and starting case
    saveCurrentState();
  }, [saveCurrentState]);

  // Helper function to advance time and check for auto-sleep
  const advanceTime = useCallback((hours) => {
    let totalHours = hours;
    let newHour = (currentHour + hours) % 24;

    // Check if we crossed 11pm (23:00) during this time advancement
    const crossedSleepTime = newHour < currentHour
      ? currentHour < 23  // Wrapped around midnight - trigger if started before 11pm
      : (currentHour < 23 && newHour >= 23);  // Normal case - crossed 23:00

    if (crossedSleepTime) {
      // AUTO-SLEEP: Automatically rest for 7 hours (11pm → 6am)
      const sleepHours = 7;
      totalHours += sleepHours;
      newHour = 6; // Wake up at 6am

      // Set sleep result to display in results area
      setLastSleepResult({
        message: `You rested for ${sleepHours} hours. (11pm → 6am)`,
        hoursLost: sleepHours,
      });
    }

    setCurrentHour(newHour);
    setTimeRemaining(prev => prev - totalHours);

    // Check if time ran out - go to debrief (no splash screen)
    if (timeRemaining - totalHours <= 0) {
      setGameState('debrief');
      return true; // Indicate game over
    }

    return false; // Game continues
  }, [currentHour, timeRemaining]);

  // Advance time by exactly 1 hour (for action queue ticking)
  // Returns extra hours if sleep was triggered
  const advanceTimeByOne = useCallback(() => {
    const newHour = (currentHour + 1) % 24;

    // Check if we just hit 11pm (23:00) - trigger sleep
    if (currentHour === 22 && newHour === 23) {
      // AUTO-SLEEP: Will rest from 11pm → 6am (7 hours)
      // Don't set sleep result yet - wait until we actually sleep through to 6am
    }

    // Check if we're in sleep hours (11pm-6am) and just woke up at 6am
    if (currentHour === 5 && newHour === 6) {
      setLastSleepResult({
        message: `You rested until 6am.`,
        hoursLost: 0, // Already counted
      });
    }

    setCurrentHour(newHour);
    setTimeRemaining(prev => {
      const newRemaining = prev - 1;
      // Check if time ran out
      if (newRemaining <= 0) {
        setGameState('debrief');
      }
      return newRemaining;
    });

    // Return whether we should add sleep hours (hit 11pm)
    return newHour === 23;
  }, [currentHour]);

  // Calculate progressive investigation cost (2h, 4h, 8h based on order)
  const getInvestigationCost = useCallback((investigationCount) => {
    // Each investigation doubles: 2h, 4h, 8h
    const baseCost = 2;
    return baseCost * Math.pow(2, investigationCount);
  }, []);

  // Get the cost for the NEXT investigation
  const nextInvestigationCost = useMemo(() => {
    return getInvestigationCost(investigatedLocations.length);
  }, [investigatedLocations.length, getInvestigationCost]);

  // Calculate total time penalty from injuries
  const getInjuryTimePenalty = useCallback(() => {
    let penalty = 0;

    // Limp: +2 hours to all investigations
    if (permanentInjuries.some(inj => inj.type === 'limp')) {
      penalty += 2;
    }

    // Scarred lungs: +1 hour to all time costs
    if (permanentInjuries.some(inj => inj.type === 'scarred_lungs')) {
      penalty += 1;
    }

    return penalty;
  }, [permanentInjuries]);

  // Check if injury causes clue to be missed
  const shouldMissClue = useCallback(() => {
    // Head trauma: 33% chance to miss any clue
    if (permanentInjuries.some(inj => inj.type === 'head_trauma')) {
      if (Math.random() < 0.33) {
        return true;
      }
    }

    // Eye patch: 50% chance to miss visual clues (random for now)
    if (permanentInjuries.some(inj => inj.type === 'eye_patch')) {
      if (Math.random() < 0.5) {
        return true;
      }
    }

    return false;
  }, [permanentInjuries]);

  // Investigate a location - returns action config or null if invalid
  // Call this to START an investigation, then use completeInvestigation when time ticks complete
  const investigate = useCallback((locationIndex) => {
    if (!cityClues || !cityClues[locationIndex]) return null;
    if (isInvestigating) return null; // Don't allow new investigation while one is in progress

    const clue = cityClues[locationIndex];
    const spot = clue.spot;

    // Progressive cost based on investigation order (2h, 4h, 8h)
    const baseCost = getInvestigationCost(investigatedLocations.length);
    const timePenalty = getInjuryTimePenalty();
    const totalTimeCost = baseCost + timePenalty;

    if (timeRemaining < totalTimeCost) {
      setMessage("Not enough time for this investigation!");
      return null;
    }

    if (investigatedLocations.includes(spot.id)) {
      return null;
    }

    // Start investigating - set pending state
    setIsInvestigating(true);
    setPendingInvestigation({ locationIndex, spot, clue });
    setLastFoundClue({ city: null, suspect: null }); // Clear previous clue
    setLastRogueAction(null); // Clear rogue action flag
    setLastEncounterResult(null); // Clear previous encounter result
    setLastSleepResult(null); // Clear sleep result so badge doesn't show during day investigations

    // Mark as investigated
    setInvestigatedLocations(prev => [...prev, spot.id]);

    // Return the action config for the action queue
    return {
      type: 'investigate',
      hoursCost: totalTimeCost,
      spinnerDuration: 500,
      label: `Investigating ${spot.name}...`,
    };
  }, [timeRemaining, cityClues, investigatedLocations, getInjuryTimePenalty, getInvestigationCost, isInvestigating]);

  // Complete an investigation - reveals clue and triggers encounters
  // Called by action queue when time ticking is complete
  const completeInvestigation = useCallback(() => {
    const pending = pendingInvestigationRef.current;
    if (!pending) return;

    const { spot, clue } = pending;

    setIsInvestigating(false);
    setPendingInvestigation(null);

    // Track this spot as the last visited location for travel animation
    setLastVisitedLocation(spot);

    // Check for injury-based clue missing
    const missedClue = shouldMissClue();

    if (missedClue) {
      setMessage(`You investigated the ${spot.name}, but your injuries made you miss the clue...`);
    } else {
      setLastFoundClue({
        city: clue.destinationClue,
        suspect: clue.suspectClue
      });

      // Store clues with metadata (city name, location name, time collected)
      const cityName = currentCity?.name || 'Unknown';
      const locationName = spot.name;
      const timeCollected = currentHour;

      if (clue.destinationClue) {
        setCollectedClues(prev => ({
          ...prev,
          city: [...prev.city, {
            text: clue.destinationClue,
            cityName,
            locationName,
            timeCollected,
          }],
        }));
      }

      if (clue.suspectClue) {
        setCollectedClues(prev => ({
          ...prev,
          suspect: [...prev.suspect, {
            text: clue.suspectClue,
            cityName,
            locationName,
            timeCollected,
          }],
        }));
      }

      // Save game state after collecting clues
      saveCurrentState();
    }

    // ENCOUNTER TRIGGER: Use pre-generated encounter from cityData
    // These take priority over good deeds
    if (!wrongCity && !hadEncounterInCity) {
      setHadEncounterInCity(true); // Mark that encounter happened

      // Get pre-assigned encounter for this city
      const cityData = currentCase?.cityData?.[currentCityIndex];
      const preAssignedEncounter = cityData?.encounter;

      if (preAssignedEncounter) {
        const encounterType = isFinalCity ? 'assassination' : 'henchman';
        setCurrentEncounter({ ...preAssignedEncounter, type: encounterType });
        return; // Show encounter
      }
    }

    // GOOD DEED: Can trigger on any investigation if no henchman/assassination, once per case
    // Only triggers if: not in wrong city, not final city, no encounter just triggered, haven't had one this case
    if (!wrongCity && !isFinalCity && !hadGoodDeedInCase && goodDeeds && !currentGoodDeed && Math.random() < 0.25) {
      // Check if high karma triggers fake good deed trap
      const isFakeTrap = karma >= 5 && fakeGoodDeeds && Math.random() < 0.25;

      setHadGoodDeedInCase(true); // Mark that good deed happened this case

      if (isFakeTrap) {
        const fakeDeed = pickRandom(fakeGoodDeeds);
        setCurrentGoodDeed({ ...fakeDeed, isFake: true });
      } else {
        const deed = pickRandom(goodDeeds);
        setCurrentGoodDeed({ ...deed, isFake: false });
      }
      return; // Show good deed encounter
    }

    // APPREHENSION: Second investigation at final city (after assassination resolved)
    // If we're at final city after the assassination attempt
    if (isFinalCity && hadEncounterInCity && !currentEncounter) {
      if (selectedWarrant) {
        // Apprehend the suspect! Show inline in content area with Continue button
        setMessage(`SUSPECT APPREHENDED! ${selectedWarrant.name} is now in custody.`);
        setGameState('apprehended'); // Triggers inline UI in InvestigateTab
        return;
      } else {
        // No warrant issued yet - guide the player
        setMessage("You've cornered the suspect! Issue a warrant in the Dossier tab to make an arrest.");
        return;
      }
    }
  }, [wrongCity, karma, goodDeeds, fakeGoodDeeds, encounters, shouldMissClue, hadEncounterInCity, isFinalCity, currentEncounter, selectedWarrant, currentCity, currentHour, currentCityIndex, hadGoodDeedInCase, currentCase, saveCurrentState]);

  // Rogue investigate - returns action config or null if invalid
  // Fast but increases notoriety, gets BOTH clues
  const rogueInvestigate = useCallback((rogueAction) => {
    if (!cityClues) return null;
    if (rogueUsedInCity) return null; // Already used in this city
    if (isInvestigating) return null; // Don't allow during investigation

    const ROGUE_TIME_COST = 2; // Fixed 2h - fastest option

    if (timeRemaining < ROGUE_TIME_COST) {
      setMessage("Not enough time for this action!");
      return null;
    }

    // Find one location clue and one suspect clue from available spots
    const locationClueData = cityClues.find(c => c.destinationClue);
    const suspectClueData = cityClues.find(c => c.suspectClue);
    const locationClue = locationClueData?.destinationClue;
    const suspectClue = suspectClueData?.suspectClue;

    // Set up pending state
    setIsInvestigating(true);
    setPendingRogueAction({ rogueAction, locationClue, suspectClue });
    setLastFoundClue({ city: null, suspect: null }); // Clear previous clue
    setLastRogueAction(null); // Clear previous rogue action
    setLastEncounterResult(null);
    setLastSleepResult(null);

    // Mark rogue as used in this city (can't use again)
    setRogueUsedInCity(true);

    // Return the action config for the action queue
    return {
      type: 'rogue',
      hoursCost: ROGUE_TIME_COST,
      spinnerDuration: 300, // Faster - it's a rogue action
      label: `${rogueAction.name}...`,
    };
  }, [timeRemaining, cityClues, rogueUsedInCity, isInvestigating]);

  // Complete rogue investigation - shows rogue action (clue revealed after continue)
  const completeRogueInvestigation = useCallback(() => {
    const pending = pendingRogueActionRef.current;
    if (!pending) return;

    const { rogueAction, locationClue, suspectClue } = pending;

    setIsInvestigating(false);
    setPendingRogueAction(null);

    // Track rogue location as the last visited location for travel animation
    const rogueLocation = currentCase?.cityData?.[currentCityIndex]?.rogueLocation || null;
    if (rogueLocation) {
      setLastVisitedLocation(rogueLocation);
    }

    // Set active rogue action (with clue data stored for later reveal - no fear phrase yet)
    setActiveRogueAction({
      action: rogueAction,
      locationClue: locationClue,
      suspectClue: suspectClue,
    });

    // Clear previous clue and rogue action
    setLastFoundClue({ city: null, suspect: null });
    setLastRogueAction(null);

    // Store clues with metadata (city name, rogue action name, time collected)
    const cityName = currentCity?.name || 'Unknown';
    const locationName = rogueAction.name; // Use rogue action name as source
    const timeCollected = currentHour;

    if (locationClue) {
      setCollectedClues(prev => ({
        ...prev,
        city: [...prev.city, {
          text: locationClue,
          cityName,
          locationName,
          timeCollected,
        }],
      }));
    }

    if (suspectClue) {
      setCollectedClues(prev => ({
        ...prev,
        suspect: [...prev.suspect, {
          text: suspectClue,
          cityName,
          locationName,
          timeCollected,
        }],
      }));
    }

    // Increase notoriety
    setNotoriety(prev => prev + rogueAction.notoriety_gain);

    // No good deed encounters after rogue actions (you're being ruthless)
  }, [currentCity, currentHour, currentCase, currentCityIndex]);

  // Resolve rogue action - clears active rogue action and reveals clue
  const resolveRogueAction = useCallback(() => {
    if (!activeRogueAction) return;

    const { locationClue, suspectClue, action } = activeRogueAction;

    // Clear active rogue action
    setActiveRogueAction(null);

    // Set the clue for display
    setLastFoundClue({ city: locationClue, suspect: suspectClue });
    setLastRogueAction(action);
  }, [activeRogueAction]);

  // Get available destinations
  const destinations = useMemo(() => {
    if (!currentCase || gameState !== 'playing') return [];
    return getDestinations(gameData, currentCase, currentCityIndex);
  }, [gameData, currentCase, currentCityIndex, gameState]);

  // Get current trivia question from active encounter
  const currentTriviaQuestion = useMemo(() => {
    const encounter = currentEncounter || null;
    if (!encounter?.triviaQuestion) return null;

    return encounter.triviaQuestion;
  }, [currentEncounter]);

  // Travel to a destination - starts animation, returns travel time
  const travel = useCallback((destination) => {
    // Apply injury time penalties to travel
    const timePenalty = getInjuryTimePenalty();
    const travelTime = settings.travel_time + timePenalty;

    if (timeRemaining < travelTime) {
      setMessage("Not enough time to travel!");
      return null;
    }

    // Use wrongCityData if in wrong city, otherwise use currentCity
    // This ensures the animation shows where you actually ARE, not the trail city
    let actualOrigin = wrongCity && wrongCityData
      ? citiesById[wrongCityData.id] || wrongCityData
      : currentCity;

    // If we have a last visited location (from investigation or rogue action),
    // use that as the origin for a more accurate animation
    if (lastVisitedLocation && lastVisitedLocation.lat && lastVisitedLocation.lon) {
      // Create a location object compatible with city data structure
      actualOrigin = {
        ...actualOrigin,
        lat: lastVisitedLocation.lat,
        lon: lastVisitedLocation.lon,
        name: lastVisitedLocation.name || actualOrigin.name,
      };
    }

    // Store origin and destination for animation
    setTravelOrigin(actualOrigin);
    setTravelDestination(destination);
    setIsTraveling(true);

    // Return travel time so caller can queue time ticking
    return travelTime;
  }, [timeRemaining, settings.travel_time, getInjuryTimePenalty, currentCity, wrongCity, wrongCityData, citiesById, lastVisitedLocation]);

  // Called after flight animation completes - returns action config for time ticking
  const getTravelTimeConfig = useCallback(() => {
    if (!travelDestination) return null;

    // Apply injury time penalties to travel
    const timePenalty = getInjuryTimePenalty();
    const travelTime = settings.travel_time + timePenalty;

    return {
      type: 'travel',
      hoursCost: travelTime,
      spinnerDuration: 0, // No spinner - flight animation was the visual
      label: 'Arriving...',
    };
  }, [travelDestination, settings.travel_time, getInjuryTimePenalty]);

  // Complete travel after time ticking finishes
  const completeTravelAnimation = useCallback(() => {
    if (!travelDestination) return;

    const destination = travelDestination;

    // Clear animation state
    setIsTraveling(false);
    setTravelOrigin(null);
    setTravelDestination(null);

    // Clear city-specific state
    setInvestigatedLocations([]);
    setLastFoundClue({ city: null, suspect: null });
    setLastRogueAction(null); // Clear rogue action result
    setLastGoodDeedResult(null); // Clear good deed result
    setLastSleepResult(null); // Clear sleep result
    setLastEncounterResult(null); // Clear encounter result
    setRogueUsedInCity(false); // Reset rogue action for new city
    setHadEncounterInCity(false); // Reset encounter flag for new city
    setIsInvestigating(false); // Cancel any pending investigation
    setLastVisitedLocation(null); // Clear last visited location for new city

    if (destination.isCorrect) {
      // Advance to next city (no cutscene - assassination only happens when issuing warrant in final city)
      setWrongCity(false);
      setWrongCityData(null);
      setCurrentCityIndex(prev => prev + 1);
      setActiveTab('home');
    } else {
      setWrongCity(true);
      setWrongCityData({ name: destination.name, country: destination.country, id: destination.cityId });
      setMessage(`You've arrived in ${destination.name}, but something feels off...`);
      setActiveTab('home');
    }

    // Save game state after arriving at city
    saveCurrentState();

    // Time was already ticked by the action queue, no need to advance here
  }, [travelDestination, saveCurrentState]);

  // Issue a warrant - just confirms the suspect selection (can be done anytime)
  // The actual apprehension happens on second investigation at final city
  const issueWarrant = useCallback(() => {
    if (!selectedWarrant) {
      setMessage("Select a suspect first!");
      return;
    }

    // Just confirm the warrant was issued
    setMessage(`Warrant issued for ${selectedWarrant.name}! ${isFinalCity ? "Investigate to apprehend the suspect." : "Continue tracking the suspect."}`);
  }, [selectedWarrant, isFinalCity]);

  // Complete trial (moves to debrief)
  const completeTrial = useCallback(() => {
    // Update solved cases if correct
    if (selectedWarrant?.id === currentCase?.suspect.id) {
      setSolvedCases(prev => prev + 1);
    }
    setGameState('debrief');

    // Save game state after completing trial
    saveCurrentState();
  }, [selectedWarrant, currentCase, saveCurrentState]);

  // Proceed from apprehended screen to trial
  const proceedToTrial = useCallback(() => {
    setGameState('trial');

    // Save game state when arriving at courthouse
    saveCurrentState();
  }, [saveCurrentState]);

  // Cycle through trait values in dossier (null → value1 → value2 → null)
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

  // Reset all selected traits
  const resetSelectedTraits = useCallback(() => {
    setSelectedTraits({ gender: null, hair: null, hobby: null });
  }, []);

  // Dismiss cutscene
  const dismissCutscene = useCallback(() => {
    setShowCutscene(false);
  }, []);

  // Unified encounter resolution handler (used by EncounterCard)
  // This is the new single handler that replaces the three separate handlers above
  const handleEncounterResolve = useCallback((result) => {
    if (!result) return;

    const { type, outcome, timeLost, karmaGain, isTrap, injuryChance, npcName } = result;

    // Apply time penalty
    if (timeLost > 0) {
      advanceTime(timeLost);
    }

    // Handle good deed specific effects
    if (type === 'good_deed') {
      if (outcome === 'helped' && karmaGain) {
        setKarma(prev => prev + karmaGain);
        // Add to saved NPCs list
        if (npcName) {
          setSavedNPCs(prev => [...prev, {
            id: currentGoodDeed?.id,
            name: npcName,
            title: currentGoodDeed?.npc_title,
            hasRescued: false,
          }]);
        }
      } else if (outcome === 'trap' && isTrap) {
        // Handle trap injury
        if (injuryChance && Math.random() < injuryChance) {
          const injuryTypes = [
            { type: 'limp', effect: '+2h investigations', icon: '🦵' },
            { type: 'broken_hand', effect: 'Gadgets 2x slower', icon: '✋' },
            { type: 'scarred_lungs', effect: '+1h all costs', icon: '🫁' },
            { type: 'head_trauma', effect: '33% miss clues', icon: '🤕' },
            { type: 'eye_patch', effect: 'Miss visual clues', icon: '👁️' },
            { type: 'nerve_damage', effect: '25% gadget failure', icon: '🤚' },
          ];
          const injury = pickRandom(injuryTypes);
          setPermanentInjuries(prev => [...prev, injury]);
        }
      }
      // Clear good deed
      setCurrentGoodDeed(null);
    } else {
      // Clear henchman/assassination encounter
      setCurrentEncounter(null);
    }

    // Note: We don't set lastEncounterResult/lastGoodDeedResult anymore
    // because the EncounterCard shows results in-place before calling onResolve
  }, [advanceTime, currentGoodDeed]);

  // Return to menu
  const returnToMenu = useCallback(() => {
    setGameState('menu');

    // Save game state when returning to main menu
    saveCurrentState();
  }, [saveCurrentState]);

  // Current city's hotel, rogue location, and rogue action
  const hotel = currentCase?.cityData?.[currentCityIndex]?.hotel || null;
  const rogueLocation = currentCase?.cityData?.[currentCityIndex]?.rogueLocation || null;
  const cityRogueAction = currentCase?.cityData?.[currentCityIndex]?.rogueAction || null;

  return {
    // State
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
    showCutscene,
    cutsceneText,
    wrongCity,
    wrongCityData,
    cityClues,
    lastFoundClue,
    lastGoodDeedResult,
    lastSleepResult,
    lastEncounterResult,
    rogueUsedInCity,
    isFinalCity,
    destinations,
    nextInvestigationCost,
    hotel,
    rogueLocation,
    cityRogueAction,  // Randomized rogue action for current city

    // Phase 3: Karma & Notoriety
    karma,
    notoriety,
    savedNPCs,
    permanentInjuries,
    showVersionWarning,
    dismissVersionWarning: () => setShowVersionWarning(false),
    currentGoodDeed,
    showRogueActionModal,
    currentRogueAction,
    lastRogueAction,
    activeRogueAction,

    // Phase 4: Trivia Encounters
    currentEncounter,
    currentTriviaQuestion,

    // Dossier trait selections
    selectedTraits,
    cycleSelectedTrait,
    resetSelectedTraits,

    // Investigation animation
    isInvestigating,

    // Travel animation
    isTraveling,
    travelOrigin,
    travelDestination,

    // Time advancement for action queue
    advanceTimeByOne,

    // Actions
    startNewCase,
    acceptBriefing,
    investigate,
    completeInvestigation,
    rogueInvestigate,
    completeRogueInvestigation,
    resolveRogueAction,
    travel,
    getTravelTimeConfig,
    completeTravelAnimation,
    issueWarrant,
    completeTrial,
    proceedToTrial,
    dismissCutscene,
    returnToMenu,
    handleEncounterResolve,
    setActiveTab,
    setSelectedWarrant,
    setMessage,
  };
}

export default useGameState;
