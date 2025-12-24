import React, { useState, useCallback, useMemo, useEffect } from 'react';
import { Plane, Search, FileText, Clock, MapPin, User, Award, AlertTriangle, Skull, ChevronRight } from 'lucide-react';

// Suspect database with attributes
// 3 binary attributes = 2^3 = 8 unique combinations
// Attributes: gender (male/female), hair (dark/light), hobby (intellectual/physical)
const SUSPECTS = [
  { id: 1, name: "Viktor Blackwood", gender: "male", hair: "dark", hobby: "intellectual", hairDesc: "black", hobbyDesc: "chess" },
  { id: 2, name: "Marcus Stone", gender: "male", hair: "dark", hobby: "physical", hairDesc: "brown", hobbyDesc: "boxing" },
  { id: 3, name: "Sebastian Frost", gender: "male", hair: "light", hobby: "intellectual", hairDesc: "blonde", hobbyDesc: "poetry" },
  { id: 4, name: "Dimitri Volkov", gender: "male", hair: "light", hobby: "physical", hairDesc: "gray", hobbyDesc: "hunting" },
  { id: 5, name: "Mei Lin", gender: "female", hair: "dark", hobby: "intellectual", hairDesc: "black", hobbyDesc: "calligraphy" },
  { id: 6, name: "Natasha Petrova", gender: "female", hair: "dark", hobby: "physical", hairDesc: "brown", hobbyDesc: "ballet" },
  { id: 7, name: "Scarlett Viper", gender: "female", hair: "light", hobby: "intellectual", hairDesc: "red", hobbyDesc: "opera" },
  { id: 8, name: "Isabella Frost", gender: "female", hair: "light", hobby: "physical", hairDesc: "blonde", hobbyDesc: "fencing" },
];

// City database with facts and connections
const CITIES = {
  paris: {
    name: "Paris",
    country: "France",
    facts: [
      "The suspect mentioned visiting a tower built by Gustave Eiffel",
      "They were seen near the Louvre, home to the Mona Lisa",
      "A witness saw them eating croissants at a café on the Champs-Élysées"
    ],
    hints: {
      tokyo: "They asked about bullet trains to a city with cherry blossoms",
      cairo: "They were reading about pyramids and the Nile",
      london: "They mentioned crossing the Channel to see Big Ben",
      rome: "They booked a flight to see the Colosseum",
      berlin: "They asked about the Brandenburg Gate",
      sydney: "They were researching the Opera House down under",
      moscow: "They mentioned Red Square and the Kremlin"
    }
  },
  tokyo: {
    name: "Tokyo",
    country: "Japan",
    facts: [
      "The suspect visited the Shibuya crossing, the busiest in the world",
      "They were spotted at Senso-ji, Tokyo's oldest temple",
      "A witness saw them buying electronics in Akihabara"
    ],
    hints: {
      paris: "They asked about flights to the city of lights",
      cairo: "They were studying hieroglyphics at a bookstore",
      london: "They mentioned wanting to see Buckingham Palace",
      rome: "They booked tickets to see Vatican City",
      berlin: "They were learning German phrases",
      sydney: "They asked about kangaroos and the outback",
      moscow: "They mentioned wanting to see Saint Basil's Cathedral"
    }
  },
  cairo: {
    name: "Cairo",
    country: "Egypt",
    facts: [
      "The suspect visited the Great Pyramid of Giza",
      "They were seen haggling in the Khan el-Khalili bazaar",
      "A witness spotted them on a felucca on the Nile"
    ],
    hints: {
      paris: "They asked about the Eiffel Tower's viewing deck",
      tokyo: "They were interested in Mount Fuji excursions",
      london: "They mentioned the Thames and Tower Bridge",
      rome: "They wanted to visit the Trevi Fountain",
      berlin: "They asked about remnants of a famous wall",
      sydney: "They were looking at maps of Bondi Beach",
      moscow: "They mentioned the Moscow Metro's ornate stations"
    }
  },
  london: {
    name: "London",
    country: "United Kingdom",
    facts: [
      "The suspect visited Westminster Abbey",
      "They were spotted near the Tower of London's crown jewels",
      "A witness saw them riding the Underground"
    ],
    hints: {
      paris: "They asked about TGV trains across the Channel",
      tokyo: "They were reading about samurai history",
      cairo: "They mentioned wanting to see the Sphinx",
      rome: "They booked a flight to Leonardo da Vinci airport",
      berlin: "They asked about Checkpoint Charlie",
      sydney: "They were researching the Great Barrier Reef",
      moscow: "They mentioned the Bolshoi Theatre"
    }
  },
  rome: {
    name: "Rome",
    country: "Italy",
    facts: [
      "The suspect threw a coin in the Trevi Fountain",
      "They were seen at the Colosseum during sunset",
      "A witness spotted them eating gelato near the Pantheon"
    ],
    hints: {
      paris: "They asked about the Moulin Rouge",
      tokyo: "They were interested in Shinjuku's nightlife",
      cairo: "They mentioned the Valley of the Kings",
      london: "They wanted to see Shakespeare's Globe Theatre",
      berlin: "They asked about Museum Island",
      sydney: "They were looking at flights to the Southern Hemisphere",
      moscow: "They mentioned wanting to see the Hermitage"
    }
  },
  berlin: {
    name: "Berlin",
    country: "Germany",
    facts: [
      "The suspect visited the Brandenburg Gate at dawn",
      "They were spotted at the East Side Gallery",
      "A witness saw them at a beer garden in Prenzlauer Berg"
    ],
    hints: {
      paris: "They asked about the Palace of Versailles",
      tokyo: "They were researching the Imperial Palace",
      cairo: "They mentioned the Egyptian Museum",
      london: "They wanted to visit the British Museum",
      rome: "They asked about the Vatican Museums",
      sydney: "They were interested in Sydney Harbour Bridge",
      moscow: "They mentioned the GUM department store"
    }
  },
  sydney: {
    name: "Sydney",
    country: "Australia",
    facts: [
      "The suspect was spotted at the Opera House",
      "They were seen surfing at Bondi Beach",
      "A witness saw them at the Taronga Zoo"
    ],
    hints: {
      paris: "They asked about the Musée d'Orsay",
      tokyo: "They were interested in the Tsukiji fish market",
      cairo: "They mentioned cruising the Nile",
      london: "They wanted to see the changing of the guard",
      rome: "They asked about the Spanish Steps",
      berlin: "They were researching the Reichstag building",
      moscow: "They mentioned the Arbat Street"
    }
  },
  moscow: {
    name: "Moscow",
    country: "Russia",
    facts: [
      "The suspect visited Red Square at midnight",
      "They were seen at the GUM shopping center",
      "A witness spotted them at the Bolshoi Theatre"
    ],
    hints: {
      paris: "They asked about the Arc de Triomphe",
      tokyo: "They were interested in robot restaurants",
      cairo: "They mentioned the Aswan High Dam",
      london: "They wanted to ride the London Eye",
      rome: "They asked about the Sistine Chapel",
      berlin: "They were researching the Pergamon Museum",
      sydney: "They mentioned the Blue Mountains"
    }
  }
};

const RANKS = [
  { title: "Rookie", minCases: 0 },
  { title: "Gumshoe", minCases: 1 },
  { title: "Sleuth", minCases: 3 },
  { title: "Inspector", minCases: 5 },
  { title: "Detective", minCases: 8 },
  { title: "Senior Detective", minCases: 12 },
  { title: "Chief Inspector", minCases: 17 },
  { title: "Master Detective", minCases: 25 },
];

const ASSASSINATION_CUTSCENES = [
  "A sniper's bullet whizzes past your ear, shattering a window behind you! You dive for cover as the shooter disappears into the crowd.",
  "A car accelerates toward you on the sidewalk! You leap aside at the last second, crashing through a fruit stand as the vehicle speeds away.",
  "You notice your coffee tastes bitter. Knocking it aside, you see a shadowy figure slip out the café's back door. Too close!",
  "A knife blade gleams in the crowd! You twist away as an assassin lunges past you, disappearing into an alley before you can react.",
  "The elevator cables snap! You grab the emergency hatch and pull yourself up as the car plummets. Someone tampered with this...",
  "Your hotel room doorknob is electrified! Your rubber-soled shoes save you. Someone really doesn't want you on this case."
];

const FINAL_CITY_CLUES = [
  "A sniper was spotted on a nearby rooftop, watching your arrival",
  "Hotel staff found a bomb under your reserved room's bed",
  "A man with a garrote was arrested asking about your whereabouts",
  "Poison was discovered in the restaurant where you have reservations",
  "A car with tinted windows has been circling the block for hours",
  "Local police intercepted a hitman contract with your photo"
];

// Helper functions
const shuffle = (array) => {
  const arr = [...array];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
};

const generateCase = () => {
  const cityKeys = Object.keys(CITIES);
  const shuffledCities = shuffle(cityKeys);
  const caseCities = shuffledCities.slice(0, 4);
  const suspect = SUSPECTS[Math.floor(Math.random() * SUSPECTS.length)];
  
  // Always reveal these 3 attributes (one per non-final city) - this uniquely identifies the suspect
  const attributes = shuffle(['gender', 'hair', 'hobby']);
  
  return {
    cities: caseCities,
    suspect,
    revealedAttributes: attributes,
    stolenItem: shuffle([
      "the Crown Jewels",
      "the Mona Lisa",
      "the Hope Diamond",
      "ancient scrolls",
      "a rare artifact",
      "classified documents"
    ])[0]
  };
};

const getRank = (solvedCases) => {
  for (let i = RANKS.length - 1; i >= 0; i--) {
    if (solvedCases >= RANKS[i].minCases) {
      return RANKS[i].title;
    }
  }
  return RANKS[0].title;
};

// Components
const TabButton = ({ active, onClick, icon: Icon, label }) => (
  <button
    onClick={onClick}
    className={`flex items-center gap-2 px-4 py-3 font-bold transition-all ${
      active 
        ? 'bg-yellow-400 text-red-900 border-b-4 border-yellow-600' 
        : 'bg-red-800 text-yellow-100 hover:bg-red-700'
    }`}
  >
    <Icon size={20} />
    {label}
  </button>
);

const ClueButton = ({ clue, timeCost, onInvestigate, disabled, investigated, locationIndex }) => (
  <button
    onClick={() => onInvestigate(clue, timeCost, locationIndex)}
    disabled={disabled || investigated}
    className={`w-full p-4 text-left rounded-lg transition-all ${
      investigated 
        ? 'bg-gray-700 text-gray-400 cursor-not-allowed'
        : disabled
        ? 'bg-gray-800 text-gray-500 cursor-not-allowed'
        : 'bg-red-900 hover:bg-red-800 text-yellow-100 cursor-pointer'
    }`}
  >
    <div className="flex justify-between items-center">
      <span>{investigated ? `✓ ${clue.location}` : clue.location}</span>
      <span className="flex items-center gap-1 text-sm">
        <Clock size={14} />
        {timeCost}h
      </span>
    </div>
  </button>
);

export default function CarmenClone() {
  const [gameState, setGameState] = useState('menu'); // menu, playing, won, lost
  const [currentCase, setCurrentCase] = useState(null);
  const [currentCityIndex, setCurrentCityIndex] = useState(0);
  const [timeRemaining, setTimeRemaining] = useState(72);
  const [collectedClues, setCollectedClues] = useState({ city: [], suspect: [] });
  const [investigatedLocations, setInvestigatedLocations] = useState([]);
  const [selectedWarrant, setSelectedWarrant] = useState(null);
  const [activeTab, setActiveTab] = useState('investigate');
  const [solvedCases, setSolvedCases] = useState(0);
  const [message, setMessage] = useState(null);
  const [showCutscene, setShowCutscene] = useState(false);
  const [cutsceneText, setCutsceneText] = useState('');
  const [wrongCity, setWrongCity] = useState(false);
  const [wrongCityData, setWrongCityData] = useState(null); // Store the wrong city info

  // Pre-generated clues for current city locations
  const [cityClues, setCityClues] = useState(null);
  const [lastFoundClue, setLastFoundClue] = useState({ city: null, suspect: null });

  // Generate clues for a city when arriving (defined before startNewCase so it can be called there)
  const generateCityClues = useCallback((caseData, cityIdx, city, isWrong) => {
    if (!caseData || !city) return null;
    
    const isFinal = cityIdx === 3;
    
    if (isWrong) {
      return {
        locations: [
          { cityClue: "I don't know what you're talking about. No suspicious characters around here.", suspectClue: null },
          { cityClue: "Suspicious person? Never seen anyone like that. You must have the wrong place.", suspectClue: null },
          { cityClue: "Can't help you, detective. Nobody matching that description has been through here.", suspectClue: null }
        ]
      };
    }
    
    if (isFinal) {
      const shuffledFinalClues = shuffle([...FINAL_CITY_CLUES]);
      return {
        locations: [
          { cityClue: shuffledFinalClues[0], suspectClue: null },
          { cityClue: shuffledFinalClues[1], suspectClue: null },
          { cityClue: shuffledFinalClues[2], suspectClue: null }
        ]
      };
    }
    
    const nextCityKey = caseData.cities[cityIdx + 1];
    const cityHint = city.hints[nextCityKey];
    const shuffledFacts = shuffle([...city.facts]);
    
    // Each city reveals one suspect attribute
    const suspectAttrIdx = cityIdx;
    const attrName = caseData.revealedAttributes[suspectAttrIdx];
    const suspect = caseData.suspect;
    
    // Format the suspect clue based on attribute type
    let suspectClueText = null;
    if (attrName === 'gender') {
      suspectClueText = `The suspect is ${suspect.gender}`;
    } else if (attrName === 'hair') {
      suspectClueText = `The suspect has ${suspect.hair} hair (${suspect.hairDesc})`;
    } else if (attrName === 'hobby') {
      suspectClueText = `The suspect has ${suspect.hobby} hobbies (like ${suspect.hobbyDesc})`;
    }
    
    // Different ways to phrase the destination hint
    const hintPhrases = [
      `${cityHint}.`,
      `I overheard them say: "${cityHint}."`,
      `Before leaving, ${cityHint.toLowerCase()}.`
    ];
    
    return {
      locations: [
        { 
          cityClue: `${shuffledFacts[0]}. ${hintPhrases[0]}`,
          suspectClue: suspectClueText
        },
        { 
          cityClue: `${shuffledFacts[1] || shuffledFacts[0]}. ${hintPhrases[1]}`,
          suspectClue: null
        },
        { 
          cityClue: `${shuffledFacts[2] || shuffledFacts[0]}. ${hintPhrases[2]}`,
          suspectClue: null
        }
      ]
    };
  }, []);

  const startNewCase = useCallback(() => {
    const newCase = generateCase();
    const firstCity = CITIES[newCase.cities[0]];
    const initialClues = generateCityClues(newCase, 0, firstCity, false);
    
    setCurrentCase(newCase);
    setCurrentCityIndex(0);
    setTimeRemaining(72);
    setCollectedClues({ city: [], suspect: [] });
    setInvestigatedLocations([]);
    setSelectedWarrant(null);
    setActiveTab('investigate');
    setGameState('playing');
    setMessage(null);
    setShowCutscene(false);
    setWrongCity(false);
    setWrongCityData(null);
    setCityClues(initialClues);
    setLastFoundClue({ city: null, suspect: null });
  }, [generateCityClues]);

  const currentCity = useMemo(() => {
    if (!currentCase) return null;
    return CITIES[currentCase.cities[currentCityIndex]];
  }, [currentCase, currentCityIndex]);

  const isFinalCity = currentCityIndex === 3;
  
  const getClueLocations = useCallback(() => {
    if (!currentCity) return [];
    
    const locations = [
      { location: "Local Informant", type: "both" },
      { location: "Police Station", type: "both" },
      { location: "Street Vendor", type: "both" }
    ];
    
    return locations;
  }, [currentCity]);

  // Generate clues when city changes
  useEffect(() => {
    if (currentCase && currentCity && gameState === 'playing') {
      const newClues = generateCityClues(
        currentCase, 
        currentCityIndex, 
        currentCity, 
        wrongCity
      );
      setCityClues(newClues);
    }
  }, [currentCase, currentCity, currentCityIndex, wrongCity, gameState, generateCityClues]);

  const investigate = useCallback((location, timeCost, locationIndex) => {
    if (timeRemaining < timeCost) {
      setMessage("Not enough time for this investigation!");
      return;
    }
    
    if (!cityClues || !cityClues.locations[locationIndex]) {
      return;
    }
    
    const clues = cityClues.locations[locationIndex];
    
    setTimeRemaining(prev => prev - timeCost);
    setInvestigatedLocations(prev => [...prev, location.location]);
    
    // Track the last found clue for immediate display
    setLastFoundClue({ city: clues.cityClue, suspect: clues.suspectClue });
    
    if (clues.cityClue) {
      setCollectedClues(prev => ({
        ...prev,
        city: [...prev.city, clues.cityClue]
      }));
    }
    
    if (clues.suspectClue) {
      setCollectedClues(prev => ({
        ...prev,
        suspect: [...prev.suspect, clues.suspectClue]
      }));
    }
    
    if (timeRemaining - timeCost <= 0) {
      setGameState('lost');
      setMessage("Time's up! The suspect got away!");
    }
  }, [timeRemaining, cityClues]);

  const getDestinations = useCallback(() => {
    if (!currentCase) return [];
    
    const allCities = Object.keys(CITIES);
    const correctNext = currentCityIndex < 3 ? currentCase.cities[currentCityIndex + 1] : null;
    
    // Get 3 random wrong cities plus the correct one
    const wrongCities = shuffle(
      allCities.filter(c => c !== currentCase.cities[currentCityIndex] && c !== correctNext)
    ).slice(0, 3);
    
    const destinations = correctNext 
      ? shuffle([correctNext, ...wrongCities])
      : shuffle(wrongCities.slice(0, 4));
    
    return destinations.map(key => ({
      key,
      ...CITIES[key],
      isCorrect: key === correctNext
    }));
  }, [currentCase, currentCityIndex]);

  const travel = useCallback((destination) => {
    const travelTime = 4;
    
    if (timeRemaining < travelTime) {
      setMessage("Not enough time to travel!");
      return;
    }
    
    setTimeRemaining(prev => prev - travelTime);
    setInvestigatedLocations([]);
    setLastFoundClue({ city: null, suspect: null });
    
    if (destination.isCorrect) {
      // Show assassination cutscene
      setCutsceneText(ASSASSINATION_CUTSCENES[Math.floor(Math.random() * ASSASSINATION_CUTSCENES.length)]);
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
  }, [timeRemaining]);

  const issueWarrant = useCallback(() => {
    if (!selectedWarrant) {
      setMessage("Select a suspect first!");
      return;
    }
    
    if (!isFinalCity) {
      setMessage("You need to reach the final destination first!");
      return;
    }
    
    if (selectedWarrant.id === currentCase.suspect.id) {
      setSolvedCases(prev => prev + 1);
      setGameState('won');
      setMessage(`Excellent work! You've captured ${currentCase.suspect.name}!`);
    } else {
      setGameState('lost');
      setMessage(`Wrong suspect! ${currentCase.suspect.name} escaped while you arrested ${selectedWarrant.name}!`);
    }
  }, [selectedWarrant, isFinalCity, currentCase]);

  const dismissCutscene = useCallback(() => {
    setShowCutscene(false);
  }, []);

  // Render menu
  if (gameState === 'menu') {
    return (
      <div className="min-h-screen bg-gradient-to-b from-red-900 to-red-950 flex items-center justify-center p-4">
        <div className="text-center">
          <div className="mb-8">
            <h1 className="text-6xl font-bold text-yellow-400 mb-2" style={{ fontFamily: 'serif' }}>
              WHERE IN THE WORLD IS
            </h1>
            <h2 className="text-4xl font-bold text-yellow-200" style={{ fontFamily: 'serif' }}>
              THE SHADOW SYNDICATE?
            </h2>
          </div>
          
          <div className="bg-red-800/50 rounded-lg p-6 mb-8 inline-block">
            <div className="flex items-center gap-3 text-yellow-100 mb-2">
              <Award size={24} />
              <span className="text-xl">Rank: {getRank(solvedCases)}</span>
            </div>
            <div className="text-yellow-200/70">Cases Solved: {solvedCases}</div>
          </div>
          
          <div>
            <button
              onClick={startNewCase}
              className="bg-yellow-400 hover:bg-yellow-300 text-red-900 font-bold text-2xl px-12 py-4 rounded-lg transition-all transform hover:scale-105 shadow-lg"
            >
              NEW CASE
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Render game over
  if (gameState === 'won' || gameState === 'lost') {
    return (
      <div className="min-h-screen bg-gradient-to-b from-red-900 to-red-950 flex items-center justify-center p-4">
        <div className="text-center">
          <div className={`text-6xl mb-4 ${gameState === 'won' ? 'text-yellow-400' : 'text-red-400'}`}>
            {gameState === 'won' ? '🎉' : '💀'}
          </div>
          <h1 className={`text-4xl font-bold mb-4 ${gameState === 'won' ? 'text-yellow-400' : 'text-red-400'}`}>
            {gameState === 'won' ? 'CASE CLOSED!' : 'CASE FAILED'}
          </h1>
          <p className="text-xl text-yellow-100 mb-8">{message}</p>
          
          <div className="bg-red-800/50 rounded-lg p-6 mb-8 inline-block">
            <div className="flex items-center gap-3 text-yellow-100 mb-2">
              <Award size={24} />
              <span className="text-xl">Rank: {getRank(solvedCases)}</span>
            </div>
            <div className="text-yellow-200/70">Cases Solved: {solvedCases}</div>
          </div>
          
          <div className="space-x-4">
            <button
              onClick={startNewCase}
              className="bg-yellow-400 hover:bg-yellow-300 text-red-900 font-bold text-xl px-8 py-3 rounded-lg transition-all"
            >
              NEW CASE
            </button>
            <button
              onClick={() => setGameState('menu')}
              className="bg-red-700 hover:bg-red-600 text-yellow-100 font-bold text-xl px-8 py-3 rounded-lg transition-all"
            >
              MAIN MENU
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Render cutscene
  if (showCutscene) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center p-4">
        <div className="max-w-2xl text-center">
          <div className="text-6xl mb-6">
            <AlertTriangle className="inline text-red-500" size={80} />
          </div>
          <h2 className="text-3xl font-bold text-red-500 mb-6">ASSASSINATION ATTEMPT!</h2>
          <p className="text-xl text-gray-200 mb-8 leading-relaxed">{cutsceneText}</p>
          <p className="text-yellow-400 mb-8">You're on the right track - the syndicate wants you stopped!</p>
          <button
            onClick={dismissCutscene}
            className="bg-red-600 hover:bg-red-500 text-white font-bold text-xl px-8 py-3 rounded-lg transition-all"
          >
            CONTINUE INVESTIGATION
          </button>
        </div>
      </div>
    );
  }

  // Main game UI
  const clueLocations = getClueLocations();
  const timeCosts = [2, 4, 8];

  return (
    <div className="min-h-screen bg-gradient-to-b from-red-900 to-red-950">
      {/* Header */}
      <div className="bg-red-950 border-b-4 border-yellow-400 p-4">
        <div className="max-w-4xl mx-auto flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-yellow-400" style={{ fontFamily: 'serif' }}>
              THE SHADOW SYNDICATE
            </h1>
            <div className="text-yellow-200/70 text-sm">
              Case: Recovery of {currentCase?.stolenItem}
            </div>
          </div>
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-2 text-yellow-100">
              <Award size={20} />
              <span>{getRank(solvedCases)}</span>
            </div>
            <div className={`flex items-center gap-2 ${timeRemaining <= 12 ? 'text-red-400' : 'text-yellow-100'}`}>
              <Clock size={20} />
              <span className="font-mono text-xl">{timeRemaining}h</span>
            </div>
          </div>
        </div>
      </div>

      {/* Location Banner */}
      <div className="bg-red-800 py-3">
        <div className="max-w-4xl mx-auto px-4 flex items-center gap-3">
          <MapPin className="text-yellow-400" />
          <span className="text-yellow-100 text-lg">
            {wrongCity && wrongCityData 
              ? `${wrongCityData.name}, ${wrongCityData.country}` 
              : `${currentCity?.name}, ${currentCity?.country}`}
          </span>
          {wrongCity ? (
            <span className="ml-auto text-red-400 text-sm font-bold">
              ⚠ WRONG TRAIL
            </span>
          ) : (
            <span className="ml-auto text-yellow-200/50 text-sm">
              Stop {currentCityIndex + 1} of 4
            </span>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="max-w-4xl mx-auto">
        <div className="flex">
          <TabButton
            active={activeTab === 'investigate'}
            onClick={() => setActiveTab('investigate')}
            icon={Search}
            label="Investigate"
          />
          <TabButton
            active={activeTab === 'airport'}
            onClick={() => setActiveTab('airport')}
            icon={Plane}
            label="Airport"
          />
          <TabButton
            active={activeTab === 'dossier'}
            onClick={() => setActiveTab('dossier')}
            icon={FileText}
            label="Dossier"
          />
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-4xl mx-auto p-4">
        {message && (
          <div className="bg-yellow-400/20 border border-yellow-400 text-yellow-100 px-4 py-2 rounded mb-4">
            {message}
          </div>
        )}

        {/* Investigate Tab */}
        {activeTab === 'investigate' && (
          <div className="space-y-4">
            <h2 className="text-xl font-bold text-yellow-400 mb-2">
              {isFinalCity && !wrongCity 
                ? "🎯 FINAL DESTINATION - Issue Warrant to Capture!" 
                : wrongCity 
                ? "❌ Dead End - Wrong Location"
                : "Gather Intel"}
            </h2>
            
            {!isFinalCity && !wrongCity && (
              <div className="text-sm text-yellow-200/70 mb-4">
                Suspect clues collected: {collectedClues.suspect.length} / 3
                {collectedClues.suspect.length < 3 && " (check the Local Informant for suspect info)"}
              </div>
            )}
            
            {wrongCity && (
              <div className="bg-red-800/50 p-4 rounded-lg text-center mb-4">
                <p className="text-yellow-200/70">
                  The trail seems cold here... but you can still ask around.
                </p>
              </div>
            )}
            
            {clueLocations.map((loc, i) => (
              <ClueButton
                key={loc.location}
                clue={loc}
                timeCost={timeCosts[i]}
                onInvestigate={investigate}
                disabled={timeRemaining < timeCosts[i]}
                investigated={investigatedLocations.includes(loc.location)}
                locationIndex={i}
              />
            ))}

            {lastFoundClue.city && (
              <div className="mt-6 bg-red-950/50 p-4 rounded-lg border border-yellow-400/30">
                <h3 className="text-yellow-400 font-bold mb-3">Latest Intel:</h3>
                <p className="text-yellow-100 mb-3">
                  📍 {lastFoundClue.city}
                </p>
                {lastFoundClue.suspect && (
                  <div className="bg-green-900/50 border border-green-500 p-3 rounded mt-2">
                    <p className="text-green-400 font-bold">
                      🔍 SUSPECT DESCRIPTION FOUND!
                    </p>
                    <p className="text-green-300 mt-1">
                      {lastFoundClue.suspect}
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* Airport Tab */}
        {activeTab === 'airport' && (
          <div className="space-y-4">
            <h2 className="text-xl font-bold text-yellow-400 mb-4">
              ✈️ Select Destination (Travel time: 4h)
            </h2>
            
            <div className="grid grid-cols-2 gap-4">
              {getDestinations().map(dest => (
                <button
                  key={dest.key}
                  onClick={() => travel(dest)}
                  disabled={timeRemaining < 4}
                  className="bg-red-800 hover:bg-red-700 disabled:bg-gray-800 disabled:text-gray-500 text-yellow-100 p-4 rounded-lg transition-all text-left"
                >
                  <div className="flex items-center gap-2 mb-1">
                    <Plane size={16} />
                    <span className="font-bold">{dest.name}</span>
                  </div>
                  <div className="text-yellow-200/70 text-sm">{dest.country}</div>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Dossier Tab */}
        {activeTab === 'dossier' && (
          <div className="space-y-6">
            {/* Suspect Clues */}
            <div className="bg-red-800/50 p-4 rounded-lg">
              <h3 className="text-yellow-400 font-bold mb-3 flex items-center gap-2">
                <User size={20} />
                Suspect Description
              </h3>
              {collectedClues.suspect.length === 0 ? (
                <p className="text-yellow-200/50 italic">No suspect information gathered yet</p>
              ) : (
                <ul className="space-y-2">
                  {collectedClues.suspect.map((clue, i) => (
                    <li key={i} className="text-yellow-100 flex items-center gap-2">
                      <ChevronRight size={16} className="text-yellow-400" />
                      {clue}
                    </li>
                  ))}
                </ul>
              )}
            </div>

            {/* Warrant Section */}
            <div className="bg-red-800/50 p-4 rounded-lg">
              <h3 className="text-yellow-400 font-bold mb-3">Issue Warrant</h3>
              <div className="grid grid-cols-2 gap-2 mb-4">
                {SUSPECTS.map(suspect => (
                  <button
                    key={suspect.id}
                    onClick={() => setSelectedWarrant(suspect)}
                    className={`p-3 rounded text-left transition-all ${
                      selectedWarrant?.id === suspect.id
                        ? 'bg-yellow-400 text-red-900'
                        : 'bg-red-900 text-yellow-100 hover:bg-red-800'
                    }`}
                  >
                    <div className="font-bold">{suspect.name}</div>
                    <div className="text-xs opacity-70">
                      {suspect.gender}, {suspect.hair} hair, {suspect.hobby}
                    </div>
                  </button>
                ))}
              </div>
              
              <button
                onClick={issueWarrant}
                disabled={!selectedWarrant || !isFinalCity}
                className="w-full bg-yellow-400 hover:bg-yellow-300 disabled:bg-gray-600 disabled:text-gray-400 text-red-900 font-bold py-3 rounded-lg transition-all"
              >
                {!isFinalCity 
                  ? "Must reach final destination first" 
                  : selectedWarrant 
                  ? `Issue Warrant for ${selectedWarrant.name}` 
                  : "Select a Suspect"}
              </button>
            </div>

            {/* Investigation Log */}
            <div className="bg-red-800/50 p-4 rounded-lg">
              <h3 className="text-yellow-400 font-bold mb-3">Investigation Log</h3>
              {collectedClues.city.length === 0 ? (
                <p className="text-yellow-200/50 italic">No investigation notes yet</p>
              ) : (
                <ul className="space-y-2 max-h-48 overflow-y-auto">
                  {collectedClues.city.map((clue, i) => (
                    <li key={i} className="text-yellow-100 text-sm border-b border-red-700/50 pb-2">
                      {clue}
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
