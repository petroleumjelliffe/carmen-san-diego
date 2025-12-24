import { shuffle, pickRandom } from './helpers';

/**
 * Generate a new case with random cities, suspect, and stolen item
 */
export function generateCase(gameData) {
  const { cityIds, suspects, stolenItems, traitNames, settings } = gameData;

  // Pick random cities for the trail
  const shuffledCities = shuffle(cityIds);
  const caseCities = shuffledCities.slice(0, settings.cities_per_case);

  // Pick random suspect
  const suspect = pickRandom(suspects);

  // Pick random stolen item
  const stolenItem = pickRandom(stolenItems);

  // Shuffle trait reveal order (one trait revealed per city before final)
  const traitOrder = shuffle([...traitNames]);

  return {
    cities: caseCities,
    suspect,
    stolenItem,
    traitOrder,
    revealedTraits: [],
  };
}

export default generateCase;
