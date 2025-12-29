import { shuffle, pickRandom } from './helpers';

/**
 * Generate clues for a city based on game state
 */
export function generateCluesForCity(gameData, currentCase, cityIndex, isWrongCity) {
  const {
    destinationClues,
    suspectClues,
    investigationSpots,
    deadEnds,
    finalCityClues,
    settings,
  } = gameData;

  const isFinalCity = cityIndex === settings.cities_per_case - 1;

  // Wrong city - all dead ends
  if (isWrongCity) {
    const shuffledDeadEnds = shuffle([...deadEnds]);
    return investigationSpots.map((spot, i) => ({
      spot,
      destinationClue: shuffledDeadEnds[i % shuffledDeadEnds.length],
      suspectClue: null,
    }));
  }

  // Final city - assassination plot clues + exactly 1 suspect clue
  if (isFinalCity) {
    const shuffledFinal = shuffle([...finalCityClues]);

    // Final city still needs suspect clues for identification
    // Use the last trait in the order (or a random one if none left)
    const traitToReveal = currentCase.traitOrder[cityIndex] || currentCase.traitOrder[currentCase.traitOrder.length - 1];
    const traitValue = currentCase.suspect[traitToReveal];
    const traitClues = suspectClues[traitToReveal]?.[traitValue] || [];

    // Randomly pick which spot gets the suspect clue
    const suspectSpotIndex = Math.floor(Math.random() * investigationSpots.length);
    let destClueIndex = 0;

    return investigationSpots.map((spot, i) => {
      if (i === suspectSpotIndex) {
        // This spot gets suspect clue
        return {
          spot,
          destinationClue: null,
          suspectClue: pickRandom(traitClues),
        };
      } else {
        // This spot gets final city clue (assassination plot)
        const clue = shuffledFinal[destClueIndex % shuffledFinal.length];
        destClueIndex++;
        return {
          spot,
          destinationClue: clue?.text || 'No information available.',
          suspectClue: null,
        };
      }
    });
  }

  // Normal city - exactly 1 spot gives suspect clue, others give destination
  const nextCityId = currentCase.cities[cityIndex + 1];
  const cityClues = destinationClues[nextCityId] || [];
  const shuffledCityClues = shuffle([...cityClues]);

  // Determine which trait to reveal at this city
  const traitToReveal = currentCase.traitOrder[cityIndex];
  const traitValue = currentCase.suspect[traitToReveal];
  const traitClues = suspectClues[traitToReveal]?.[traitValue] || [];

  // Randomly pick which spot gets the suspect clue
  const suspectSpotIndex = Math.floor(Math.random() * investigationSpots.length);
  let destClueIndex = 0;

  return investigationSpots.map((spot, i) => {
    if (i === suspectSpotIndex) {
      // This spot gets suspect clue
      return {
        spot,
        destinationClue: null,
        suspectClue: pickRandom(traitClues),
      };
    } else {
      // This spot gets destination clue
      const clue = shuffledCityClues[destClueIndex % shuffledCityClues.length];
      destClueIndex++;
      return {
        spot,
        destinationClue: clue?.text || 'No information available.',
        suspectClue: null,
      };
    }
  });
}

/**
 * Get travel destinations with correct city and decoys
 */
export function getDestinations(gameData, currentCase, currentCityIndex) {
  const { cityIds, citiesById, settings } = gameData;
  const isFinalCity = currentCityIndex >= settings.cities_per_case - 1;

  // At final city, no more travel needed
  if (isFinalCity) {
    return [];
  }

  const correctNextCity = currentCase.cities[currentCityIndex + 1];
  const currentCity = currentCase.cities[currentCityIndex];

  // Get wrong cities (exclude current and correct)
  const wrongCities = cityIds.filter(id =>
    id !== currentCity && id !== correctNextCity
  );

  // Pick 3 random wrong cities
  const selectedWrong = shuffle(wrongCities).slice(0, 3);

  // Combine and shuffle
  const destinations = shuffle([
    { cityId: correctNextCity, isCorrect: true },
    ...selectedWrong.map(id => ({ cityId: id, isCorrect: false })),
  ]);

  // Attach city data
  return destinations.map(dest => ({
    ...dest,
    ...citiesById[dest.cityId],
  }));
}

export { generateCluesForCity as default };
