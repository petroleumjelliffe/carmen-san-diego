import { useGameState } from '../hooks/useGameState';
import { Menu } from './Menu';
import { GameOver } from './GameOver';
import { Cutscene } from './Cutscene';
import { Header } from './Header';
import { LocationBanner } from './LocationBanner';
import { TabBar } from './TabBar';
import { InvestigateTab } from './InvestigateTab';
import { AirportTab } from './AirportTab';
import { DossierTab } from './DossierTab';

export function Game({ gameData }) {
  const {
    gameState,
    currentCase,
    currentCity,
    currentCityIndex,
    timeRemaining,
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
    startNewCase,
    investigate,
    travel,
    issueWarrant,
    dismissCutscene,
    returnToMenu,
    setActiveTab,
    setSelectedWarrant,
  } = useGameState(gameData);

  const { ranks, suspects, settings } = gameData;

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

  // Game over screen
  if (gameState === 'won' || gameState === 'lost') {
    return (
      <GameOver
        gameState={gameState}
        message={message}
        solvedCases={solvedCases}
        ranks={ranks}
        onStartNewCase={startNewCase}
        onReturnToMenu={returnToMenu}
      />
    );
  }

  // Cutscene
  if (showCutscene) {
    return (
      <Cutscene
        text={cutsceneText}
        onDismiss={dismissCutscene}
      />
    );
  }

  // Main game UI
  return (
    <div className="min-h-screen bg-gradient-to-b from-red-900 to-red-950">
      <Header
        currentCase={currentCase}
        timeRemaining={timeRemaining}
        solvedCases={solvedCases}
        ranks={ranks}
      />

      <LocationBanner
        currentCity={currentCity}
        currentCityIndex={currentCityIndex}
        wrongCity={wrongCity}
        wrongCityData={wrongCityData}
        citiesPerCase={settings.cities_per_case}
      />

      <TabBar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
      />

      <div className="max-w-4xl mx-auto p-4">
        {message && (
          <div className="bg-yellow-400/20 border border-yellow-400 text-yellow-100 px-4 py-2 rounded mb-4">
            {message}
          </div>
        )}

        {activeTab === 'investigate' && (
          <InvestigateTab
            isFinalCity={isFinalCity}
            wrongCity={wrongCity}
            cityClues={cityClues}
            investigatedLocations={investigatedLocations}
            timeRemaining={timeRemaining}
            collectedClues={collectedClues}
            lastFoundClue={lastFoundClue}
            onInvestigate={investigate}
          />
        )}

        {activeTab === 'airport' && (
          <AirportTab
            destinations={destinations}
            timeRemaining={timeRemaining}
            travelTime={settings.travel_time}
            onTravel={travel}
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
          />
        )}
      </div>
    </div>
  );
}

export default Game;
