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

  const { settings, citiesById, investigationSpots, assassinationAttempts } = gameData;

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

    // Check if we hit 11pm (23:00) - trigger sleep
    if (currentHour < 23 && newHour >= 23) {
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

  // Investigate a location
  const investigate = useCallback((locationIndex) => {
    if (!cityClues || !cityClues[locationIndex]) return;

    const clue = cityClues[locationIndex];
    const spot = clue.spot;

    if (timeRemaining < spot.time_cost) {
      setMessage("Not enough time for this investigation!");
      return;
    }

    if (investigatedLocations.includes(spot.id)) {
      return;
    }

    setTimeRemaining(prev => prev - spot.time_cost);
    setInvestigatedLocations(prev => [...prev, spot.id]);
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

    if (timeRemaining - spot.time_cost <= 0) {
      setGameState('lost');
      setMessage("Time's up! The suspect got away!");
    }
  }, [timeRemaining, cityClues, investigatedLocations]);

  // Get available destinations
  const destinations = useMemo(() => {
    if (!currentCase || gameState !== 'playing') return [];
    return getDestinations(gameData, currentCase, currentCityIndex);
  }, [gameData, currentCase, currentCityIndex, gameState]);

  // Travel to a destination
  const travel = useCallback((destination) => {
    const travelTime = settings.travel_time;

    if (timeRemaining < travelTime) {
      setMessage("Not enough time to travel!");
      return;
    }

    setTimeRemaining(prev => prev - travelTime);
    setInvestigatedLocations([]);
    setLastFoundClue({ city: null, suspect: null });

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

    if (timeRemaining - travelTime <= 0) {
      setGameState('lost');
      setMessage("Time's up! The suspect got away!");
    }
  }, [timeRemaining, settings.travel_time, assassinationAttempts]);

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
    isFinalCity,
    destinations,

    // Actions
    startNewCase,
    acceptBriefing,
    sleep,
    investigate,
    travel,
    issueWarrant,
    completeTrial,
    dismissCutscene,
    returnToMenu,
    setActiveTab,
    setSelectedWarrant,
    setMessage,
  };
}

export default useGameState;
