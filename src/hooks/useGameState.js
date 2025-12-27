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
  const [rogueUsedInCity, setRogueUsedInCity] = useState(false); // Track if rogue was used in current city

  // Phase 3: Karma & Notoriety System (persists across cases)
  const [karma, setKarma] = useState(0); // Good deeds completed
  const [notoriety, setNotoriety] = useState(0); // Rogue actions taken
  const [savedNPCs, setSavedNPCs] = useState([]); // NPCs saved (for rescue chances)
  const [permanentInjuries, setPermanentInjuries] = useState([]); // Injuries from traps
  const [showGoodDeedModal, setShowGoodDeedModal] = useState(false);
  const [currentGoodDeed, setCurrentGoodDeed] = useState(null);
  const [showRogueActionModal, setShowRogueActionModal] = useState(false);
  const [currentRogueAction, setCurrentRogueAction] = useState(null);
  const [lastRogueAction, setLastRogueAction] = useState(null); // Track last rogue action used

  const { settings, citiesById, investigationSpots, assassinationAttempts, goodDeeds, fakeGoodDeeds, rogueActions } = gameData;

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
  }, [gameData, settings.total_time]);

  // Accept briefing and start playing
  const acceptBriefing = useCallback(() => {
    setGameState('playing');
  }, []);

  // Helper function to advance time and check for sleep
  const advanceTime = useCallback((hours) => {
    const newHour = (currentHour + hours) % 24;
    setCurrentHour(newHour);
    setTimeRemaining(prev => prev - hours);

    // Check if we crossed 11pm (23:00) during this time advancement
    const crossedSleepTime = newHour < currentHour
      ? currentHour < 23  // Wrapped around midnight - trigger if started before 11pm
      : (currentHour < 23 && newHour >= 23);  // Normal case - crossed 23:00

    if (crossedSleepTime) {
      setGameState('sleeping');
    }

    // Check if time ran out
    if (timeRemaining - hours <= 0) {
      setGameState('lost');
      setMessage("Time's up! The suspect got away!");
      return true; // Indicate game over
    }

    return false; // Game continues
  }, [currentHour, timeRemaining]);

  // Sleep through the night
  const sleep = useCallback(() => {
    const sleepHours = 7; // Sleep 7 hours (11pm to 6am)
    setCurrentHour(6); // Wake up at 6am
    setTimeRemaining(prev => prev - sleepHours);

    if (timeRemaining - sleepHours <= 0) {
      setGameState('lost');
      setMessage("Time's up! The suspect got away!");
    } else {
      setGameState('playing');
    }
  }, [timeRemaining]);

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
    advanceTime(totalTimeCost);

    // Check for good deed encounter (25% chance in correct cities only)
    if (!wrongCity && goodDeeds && Math.random() < 0.25) {
      // Check if high karma triggers fake good deed trap
      const isFakeTrap = karma >= 5 && fakeGoodDeeds && Math.random() < 0.25;

      if (isFakeTrap) {
        const fakeDeed = pickRandom(fakeGoodDeeds);
        setCurrentGoodDeed({ ...fakeDeed, isFake: true });
      } else {
        const deed = pickRandom(goodDeeds);
        setCurrentGoodDeed({ ...deed, isFake: false });
      }

      setShowGoodDeedModal(true);
    }
  }, [timeRemaining, cityClues, investigatedLocations, advanceTime, wrongCity, karma, goodDeeds, fakeGoodDeeds, getInjuryTimePenalty, shouldMissClue]);

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
    setRogueUsedInCity(false); // Reset rogue action for new city

    if (destination.isCorrect) {
      // Show assassination cutscene
      const attempt = pickRandom(assassinationAttempts);
      setCutsceneText(attempt.text);
      setShowCutscene(true);
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
  }, [timeRemaining, settings.travel_time, assassinationAttempts, advanceTime, getInjuryTimePenalty]);

  // Issue a warrant (moves to trial)
  const issueWarrant = useCallback(() => {
    if (!selectedWarrant) {
      setMessage("Select a suspect first!");
      return;
    }

    if (!isFinalCity) {
      setMessage("You need to reach the final destination first!");
      return;
    }

    // Move to trial state
    setGameState('trial');
  }, [selectedWarrant, isFinalCity]);

  // Complete trial (moves to debrief)
  const completeTrial = useCallback(() => {
    // Update solved cases if correct
    if (selectedWarrant?.id === currentCase?.suspect.id) {
      setSolvedCases(prev => prev + 1);
    }
    setGameState('debrief');
  }, [selectedWarrant, currentCase]);

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
          setMessage(`TRAP! You've been injured: ${injury.effect}`);
        } else {
          setMessage("That was close! You barely escaped the trap!");
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
        setMessage(`${currentGoodDeed.gratitude}`);
      }
    }

    setShowGoodDeedModal(false);
    setCurrentGoodDeed(null);
  }, [currentGoodDeed, advanceTime]);

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
    rogueUsedInCity,
    isFinalCity,
    destinations,

    // Phase 3: Karma & Notoriety
    karma,
    notoriety,
    savedNPCs,
    permanentInjuries,
    showGoodDeedModal,
    currentGoodDeed,
    showRogueActionModal,
    currentRogueAction,
    lastRogueAction,

    // Actions
    startNewCase,
    acceptBriefing,
    sleep,
    investigate,
    rogueInvestigate,
    travel,
    issueWarrant,
    completeTrial,
    dismissCutscene,
    returnToMenu,
    handleGoodDeed,
    setActiveTab,
    setSelectedWarrant,
    setMessage,
  };
}

export default useGameState;
