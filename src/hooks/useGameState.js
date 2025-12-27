import { useState, useCallback, useMemo, useEffect } from 'react';
import { generateCase } from '../utils/caseGenerator';
import { generateCluesForCity, getDestinations } from '../utils/clueGenerator';
import { pickRandom } from '../utils/helpers';

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
  const [activeTab, setActiveTab] = useState('investigate');
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

  // Phase 3: Karma & Notoriety System (persists across cases)
  const [karma, setKarma] = useState(0); // Good deeds completed
  const [notoriety, setNotoriety] = useState(0); // Rogue actions taken
  const [savedNPCs, setSavedNPCs] = useState([]); // NPCs saved (for rescue chances)
  const [permanentInjuries, setPermanentInjuries] = useState([]); // Injuries from traps
  const [currentGoodDeed, setCurrentGoodDeed] = useState(null); // Current good deed encounter
  const [showRogueActionModal, setShowRogueActionModal] = useState(false);
  const [currentRogueAction, setCurrentRogueAction] = useState(null);
  const [lastRogueAction, setLastRogueAction] = useState(null); // Track last rogue action used

  // Phase 4: Gadget Encounters (henchman & assassination)
  const [currentEncounter, setCurrentEncounter] = useState(null); // Current henchman/assassination encounter
  const [usedGadgets, setUsedGadgets] = useState([]); // Gadgets used in current case

  const { settings, citiesById, investigationSpots, assassinationAttempts, goodDeeds, fakeGoodDeeds, rogueActions, encounters, gadgets } = gameData;

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

  // Load persistent state from LocalStorage on mount
  useEffect(() => {
    try {
      const savedProfile = localStorage.getItem('carmen-profile');
      if (savedProfile) {
        const profile = JSON.parse(savedProfile);
        setKarma(profile.karma || 0);
        setNotoriety(profile.notoriety || 0);
        setSavedNPCs(profile.savedNPCs || []);
        setPermanentInjuries(profile.injuries || []);
        setSolvedCases(profile.solvedCases || 0);
      }
    } catch (e) {
      console.error('Failed to load profile:', e);
    }
  }, []);

  // Save persistent state to LocalStorage when it changes
  useEffect(() => {
    try {
      const profile = {
        karma,
        notoriety,
        savedNPCs,
        injuries: permanentInjuries,
        solvedCases,
      };
      localStorage.setItem('carmen-profile', JSON.stringify(profile));
    } catch (e) {
      console.error('Failed to save profile:', e);
    }
  }, [karma, notoriety, savedNPCs, permanentInjuries, solvedCases]);

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
    setRogueUsedInCity(false);
    setHadEncounterInCity(false);
  }, [gameData, settings.total_time]);

  // Accept briefing and start playing
  const acceptBriefing = useCallback(() => {
    setGameState('playing');
  }, []);

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

    // Check if time ran out
    if (timeRemaining - totalHours <= 0) {
      setGameState('lost');
      setMessage("Time's up! The suspect got away!");
      return true; // Indicate game over
    }

    return false; // Game continues
  }, [currentHour, timeRemaining]);

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

  // Investigate a location
  const investigate = useCallback((locationIndex) => {
    if (!cityClues || !cityClues[locationIndex]) return;

    const clue = cityClues[locationIndex];
    const spot = clue.spot;

    // Apply injury time penalties
    const timePenalty = getInjuryTimePenalty();
    const totalTimeCost = spot.time_cost + timePenalty;

    if (timeRemaining < totalTimeCost) {
      setMessage("Not enough time for this investigation!");
      return;
    }

    if (investigatedLocations.includes(spot.id)) {
      return;
    }

    // Mark as investigated
    setInvestigatedLocations(prev => [...prev, spot.id]);
    setLastRogueAction(null); // Clear rogue action flag
    setLastEncounterResult(null); // Clear previous encounter result

    // Check for injury-based clue missing
    const missedClue = shouldMissClue();

    if (missedClue) {
      setLastFoundClue({ city: null, suspect: null });
      setMessage(`You investigated the ${spot.name}, but your injuries made you miss the clue...`);
    } else {
      setLastFoundClue({ city: clue.destinationClue, suspect: clue.suspectClue });

      if (clue.destinationClue) {
        setCollectedClues(prev => ({
          ...prev,
          city: [...prev.city, clue.destinationClue],
        }));
      }

      if (clue.suspectClue) {
        setCollectedClues(prev => ({
          ...prev,
          suspect: [...prev.suspect, clue.suspectClue],
        }));
      }
    }

    // Advance time with injury penalties (checks for sleep and game over)
    const gameOver = advanceTime(totalTimeCost);

    if (gameOver) return; // Don't trigger encounters if game is over

    // Check for good deed encounter (25% chance in correct cities only, not if encounter already happened)
    // Good deeds appear inline in the investigation tab, not as a separate state
    if (!wrongCity && !hadEncounterInCity && goodDeeds && !currentGoodDeed && Math.random() < 0.25) {
      // Check if high karma triggers fake good deed trap
      const isFakeTrap = karma >= 5 && fakeGoodDeeds && Math.random() < 0.25;

      if (isFakeTrap) {
        const fakeDeed = pickRandom(fakeGoodDeeds);
        setCurrentGoodDeed({ ...fakeDeed, isFake: true });
      } else {
        const deed = pickRandom(goodDeeds);
        setCurrentGoodDeed({ ...deed, isFake: false });
      }
      return; // Don't trigger encounter if good deed is shown
    }

    // ENCOUNTER TRIGGER: Only on FIRST investigation in correct cities
    // Henchman in non-final cities, Assassination in final city
    if (!wrongCity && !hadEncounterInCity && encounters) {
      setHadEncounterInCity(true); // Mark that encounter happened

      if (isFinalCity && !wrongCity && encounters.assassination_attempts) {
        // CORRECT FINAL CITY ONLY: Trigger assassination attempt (high stakes!)
        const assassinationEncounter = pickRandom(encounters.assassination_attempts);
        setCurrentEncounter({ ...assassinationEncounter, type: 'assassination' });
        // Don't change gameState - render inline in InvestigateTab
        return; // Wait for assassination to be resolved before allowing apprehension
      } else if (!isFinalCity && currentCityIndex > 0 && encounters.henchman_encounters) {
        // MIDDLE CITIES ONLY (not first, not last): Trigger henchman encounter
        // "You're on the right track!" - signals player is in correct city
        const henchmanEncounter = pickRandom(encounters.henchman_encounters);
        setCurrentEncounter({ ...henchmanEncounter, type: 'henchman' });
        // Don't change gameState - render inline in InvestigateTab
      }
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
  }, [timeRemaining, cityClues, investigatedLocations, advanceTime, wrongCity, karma, goodDeeds, fakeGoodDeeds, encounters, getInjuryTimePenalty, shouldMissClue, hadEncounterInCity, isFinalCity, currentEncounter, selectedWarrant]);

  // Rogue investigate - Fast but increases notoriety, gets BOTH clues
  const rogueInvestigate = useCallback((rogueAction) => {
    if (!cityClues) return;
    if (rogueUsedInCity) return; // Already used in this city

    const ROGUE_TIME_COST = 2; // Fixed 2h - fastest option

    if (timeRemaining < ROGUE_TIME_COST) {
      setMessage("Not enough time for this action!");
      return;
    }

    // Find one location clue and one suspect clue from available spots
    const locationClue = cityClues.find(c => c.destinationClue)?.destinationClue;
    const suspectClue = cityClues.find(c => c.suspectClue)?.suspectClue;

    // Clear previous results
    setLastEncounterResult(null);

    // Rogue actions always get BOTH clues (if available)
    setLastFoundClue({ city: locationClue, suspect: suspectClue });
    setLastRogueAction(rogueAction);

    if (locationClue) {
      setCollectedClues(prev => ({
        ...prev,
        city: [...prev.city, locationClue],
      }));
    }

    if (suspectClue) {
      setCollectedClues(prev => ({
        ...prev,
        suspect: [...prev.suspect, suspectClue],
      }));
    }

    // Mark rogue as used in this city (can't use again)
    setRogueUsedInCity(true);

    // Increase notoriety
    setNotoriety(prev => prev + rogueAction.notoriety_gain);

    // Advance time (fixed 2h cost)
    advanceTime(ROGUE_TIME_COST);

    // No good deed encounters after rogue actions (you're being ruthless)
  }, [timeRemaining, cityClues, rogueUsedInCity, advanceTime]);

  // Get available destinations
  const destinations = useMemo(() => {
    if (!currentCase || gameState !== 'playing') return [];
    return getDestinations(gameData, currentCase, currentCityIndex);
  }, [gameData, currentCase, currentCityIndex, gameState]);

  // Get available gadgets with used status
  const availableGadgets = useMemo(() => {
    if (!gadgets) return [];
    return gadgets.map(gadget => ({
      ...gadget,
      used: usedGadgets.includes(gadget.id)
    }));
  }, [gadgets, usedGadgets]);

  // Travel to a destination
  const travel = useCallback((destination) => {
    // Apply injury time penalties to travel
    const timePenalty = getInjuryTimePenalty();
    const travelTime = settings.travel_time + timePenalty;

    if (timeRemaining < travelTime) {
      setMessage("Not enough time to travel!");
      return;
    }

    // Clear city-specific state
    setInvestigatedLocations([]);
    setLastFoundClue({ city: null, suspect: null });
    setLastGoodDeedResult(null); // Clear good deed result
    setLastSleepResult(null); // Clear sleep result
    setLastEncounterResult(null); // Clear encounter result
    setRogueUsedInCity(false); // Reset rogue action for new city
    setHadEncounterInCity(false); // Reset encounter flag for new city

    if (destination.isCorrect) {
      // Advance to next city (no cutscene - assassination only happens when issuing warrant in final city)
      setWrongCity(false);
      setWrongCityData(null);
      setCurrentCityIndex(prev => prev + 1);
      setActiveTab('investigate');
    } else {
      setWrongCity(true);
      setWrongCityData({ name: destination.name, country: destination.country });
      setMessage(`You've arrived in ${destination.name}, but something feels off...`);
    }

    // Advance time (checks for sleep and game over)
    advanceTime(travelTime);
  }, [timeRemaining, settings.travel_time, advanceTime, getInjuryTimePenalty]);

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
  }, [selectedWarrant, currentCase]);

  // Proceed from apprehended screen to trial
  const proceedToTrial = useCallback(() => {
    setGameState('trial');
  }, []);

  // Dismiss cutscene
  const dismissCutscene = useCallback(() => {
    setShowCutscene(false);
  }, []);

  // Handle good deed choice
  const handleGoodDeed = useCallback((helpNPC) => {
    if (!currentGoodDeed) return;

    if (helpNPC) {
      const timeCost = currentGoodDeed.time_cost || currentGoodDeed.timeCost || 3;

      if (currentGoodDeed.isFake) {
        // Fake good deed - takes longer and causes injury
        advanceTime(8); // Fake deeds take 8 hours

        // 75% chance of injury
        if (Math.random() < 0.75) {
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

          // Set result to display in investigation tab
          setLastGoodDeedResult({
            isTrap: true,
            title: 'TRAP!',
            message: `${currentGoodDeed.trap_reveal || 'It was a trap!'} You've been injured: ${injury.effect}`,
          });
        } else {
          setLastGoodDeedResult({
            isTrap: true,
            title: 'Narrow Escape',
            message: "That was close! You barely escaped the trap!",
          });
        }
      } else {
        // Real good deed
        advanceTime(timeCost);
        setKarma(prev => prev + 1);
        setSavedNPCs(prev => [...prev, {
          id: currentGoodDeed.id,
          name: currentGoodDeed.npc_name,
          title: currentGoodDeed.npc_title,
          hasRescued: false,
        }]);

        // Set result to display in investigation tab
        setLastGoodDeedResult({
          isTrap: false,
          title: 'Good Deed Complete',
          message: currentGoodDeed.gratitude || 'They thank you warmly. +1 Karma',
        });
      }
    } else {
      // Player chose to ignore
      setLastGoodDeedResult(null); // No result to show
    }

    // Clear good deed (stay in playing state - good deeds are inline)
    setCurrentGoodDeed(null);
  }, [currentGoodDeed, advanceTime]);

  // Handle henchman gadget choice
  const handleHenchmanGadget = useCallback((gadgetId) => {
    if (!currentEncounter) return;

    const isCorrect = gadgetId === currentEncounter.correct_gadget;
    const timePenalty = gadgetId === null
      ? currentEncounter.time_penalty_none
      : isCorrect
      ? 0
      : currentEncounter.time_penalty_wrong;

    // Mark gadget as used
    if (gadgetId) {
      setUsedGadgets(prev => [...prev, gadgetId]);
    }

    // Advance time based on choice
    advanceTime(timePenalty);

    // Set result to display in unified results area
    let resultText, resultType;
    if (isCorrect) {
      resultText = currentEncounter.success_text;
      resultType = 'success';
    } else if (gadgetId === null) {
      resultText = currentEncounter.no_gadget_text;
      resultType = 'no_gadget';
    } else {
      resultText = currentEncounter.failure_text;
      resultType = 'wrong_gadget';
    }

    setLastEncounterResult({
      type: 'henchman',
      name: currentEncounter.name,
      message: resultText,
      outcome: resultType,
      timeLost: timePenalty
    });

    // Clear encounter (stay in playing state - encounters are inline)
    setCurrentEncounter(null);
  }, [currentEncounter, advanceTime]);

  // Handle assassination gadget choice
  const handleAssassinationGadget = useCallback((gadgetId) => {
    if (!currentEncounter) return;

    const isCorrect = gadgetId === currentEncounter.correct_gadget;
    const timePenalty = gadgetId === null
      ? currentEncounter.time_penalty_none
      : isCorrect
      ? 0
      : currentEncounter.time_penalty_wrong;

    // Mark gadget as used
    if (gadgetId) {
      setUsedGadgets(prev => [...prev, gadgetId]);
    }

    // Advance time based on choice
    advanceTime(timePenalty);

    // Set result to display in unified results area
    let resultText, resultType;
    if (isCorrect) {
      resultText = currentEncounter.success_text;
      resultType = 'success';
    } else if (gadgetId === null) {
      resultText = currentEncounter.timeout_text || currentEncounter.no_gadget_text;
      resultType = 'timeout';
    } else {
      resultText = currentEncounter.failure_text;
      resultType = 'wrong_gadget';
    }

    setLastEncounterResult({
      type: 'assassination',
      name: currentEncounter.name,
      message: resultText,
      outcome: resultType,
      timeLost: timePenalty
    });

    // TODO: Check for NPC rescue if failed and karma is high

    // Clear encounter (stay in playing state - user can now issue warrant)
    setCurrentEncounter(null);
  }, [currentEncounter, advanceTime]);

  // Return to menu
  const returnToMenu = useCallback(() => {
    setGameState('menu');
  }, []);

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

    // Phase 3: Karma & Notoriety
    karma,
    notoriety,
    savedNPCs,
    permanentInjuries,
    currentGoodDeed,
    showRogueActionModal,
    currentRogueAction,
    lastRogueAction,

    // Phase 4: Gadget Encounters
    currentEncounter,
    availableGadgets,

    // Actions
    startNewCase,
    acceptBriefing,
    investigate,
    rogueInvestigate,
    travel,
    issueWarrant,
    completeTrial,
    proceedToTrial,
    dismissCutscene,
    returnToMenu,
    handleGoodDeed,
    handleHenchmanGadget,
    handleAssassinationGadget,
    setActiveTab,
    setSelectedWarrant,
    setMessage,
  };
}

export default useGameState;
