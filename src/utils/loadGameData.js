import settings from '../../config/settings.yaml';
import cities from '../../config/cities.yaml';
import destinationClues from '../../config/destination_clues.yaml';
import suspectClues from '../../config/suspect_clues.yaml';
import investigationSpots from '../../config/investigation_spots.yaml';
import suspects from '../../config/suspects.yaml';
import stolenItems from '../../config/stolen_items.yaml';
import assassinationAttempts from '../../config/assassination_attempts.yaml';
import ranks from '../../config/ranks.yaml';
import deadEnds from '../../config/dead_ends.yaml';
import finalCityClues from '../../config/final_city_clues.yaml';

import { indexById, groupBy } from './helpers';
import { validateGameData } from './validation';

/**
 * Load and preprocess all game data from YAML files
 */
export function loadGameData() {
  const citiesList = cities.cities;
  const suspectsList = suspects.suspects;
  const ranksList = ranks.ranks;
  const spotsList = investigationSpots.investigation_spots;
  const stolenItemsList = stolenItems.stolen_items;
  const assassinationList = assassinationAttempts.assassination_attempts;
  const finalCluesList = finalCityClues.final_city_clues;
  const deadEndsList = deadEnds.dead_ends;
  const destClues = destinationClues.destination_clues;
  const suspClues = suspectClues.suspect_clues;
  const gameSettings = settings.settings;
  const difficultySettings = settings.difficulty;

  const gameData = {
    settings: gameSettings,
    difficulty: difficultySettings,

    // Raw arrays
    cities: citiesList,
    suspects: suspectsList,
    ranks: ranksList,
    investigationSpots: spotsList,
    stolenItems: stolenItemsList,
    assassinationAttempts: assassinationList,
    finalCityClues: finalCluesList,
    deadEnds: deadEndsList,

    // Clue maps
    destinationClues: destClues,
    suspectClues: suspClues,

    // Indexed data
    citiesById: indexById(citiesList),
    citiesByRegion: groupBy(citiesList, 'region'),
    cityIds: citiesList.map(c => c.id),

    // Trait names extracted from suspect clues
    traitNames: Object.keys(suspClues),
  };

  // Validate data and log warnings
  validateGameData(gameData);

  return gameData;
}

export default loadGameData;
