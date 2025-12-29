/**
 * Get clues for a city using pre-generated case data
 * This now just looks up data instead of generating it
 */
export function generateCluesForCity(gameData, currentCase, cityIndex, isWrongCity) {
  const { investigationSpots } = gameData;

  // Get pre-generated city data
  const cityData = currentCase.cityData[cityIndex];

  if (!cityData) {
    console.warn('No pre-generated data for city index:', cityIndex);
    return investigationSpots.map(spot => ({
      spot,
      destinationClue: 'No information available.',
      suspectClue: null,
    }));
  }

  // Wrong city - use pre-generated dead ends
  if (isWrongCity) {
    return investigationSpots.map((spot, i) => ({
      spot,
      destinationClue: cityData.deadEndClues[i % cityData.deadEndClues.length],
      suspectClue: null,
    }));
  }

  // Correct city - use pre-generated clues
  let locationClueIndex = 0;

  return investigationSpots.map((spot, i) => {
    if (i === cityData.suspectSpotIndex) {
      // This spot gets the suspect clue
      return {
        spot,
        destinationClue: null,
        suspectClue: cityData.suspectClue,
      };
    } else {
      // This spot gets a location clue
      const clue = cityData.locationClues[locationClueIndex % cityData.locationClues.length];
      locationClueIndex++;
      return {
        spot,
        destinationClue: clue || 'No information available.',
        suspectClue: null,
      };
    }
  });
}

/**
 * Get travel destinations using pre-generated case data
 */
export function getDestinations(gameData, currentCase, currentCityIndex) {
  const cityData = currentCase.cityData[currentCityIndex];

  if (!cityData) {
    console.warn('No pre-generated data for city index:', currentCityIndex);
    return [];
  }

  // Return pre-generated destinations
  return cityData.destinations;
}

export { generateCluesForCity as default };
