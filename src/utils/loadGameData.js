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
import goodDeeds from '../../config/good_deeds.yaml';
import rogueActions from '../../config/rogue_actions.yaml';
import encounters from '../../config/encounters.yaml';
import gadgetsConfig from '../../config/gadgets.yaml';

import { indexById, groupBy } from './helpers';
import { validateGameData } from './validation';

/**
 * Load and preprocess all game data from YAML files
 */
export function loadGameData() {
  const citiesList = cities.cities;
  const backgroundsData = cities.backgrounds;
  const suspectsList = suspects.suspects;
  const ranksList = ranks.ranks;
  const spotsList = investigationSpots.investigation_spots;
  const stolenItemsList = stolenItems.stolen_items;
  const assassinationList = assassinationAttempts.assassination_attempts;
  const finalCluesList = finalCityClues.final_city_clues;
  const deadEndsList = deadEnds.dead_ends;
  const destClues = destinationClues.destination_clues;
  const suspClues = suspectClues.suspect_clues;
  const goodDeedsList = goodDeeds.good_deeds;
  const fakeGoodDeedsList = goodDeeds.fake_good_deeds;
  const rogueActionsList = rogueActions.rogue_actions;
  const gadgetsList = gadgetsConfig.gadgets;
  const gameSettings = settings.settings;
  const difficultySettings = settings.difficulty;
  const encounterTimers = settings.encounter_timers;

  const gameData = {
    settings: gameSettings,
    difficulty: difficultySettings,
    encounterTimers: encounterTimers,
    backgrounds: backgroundsData,

    // Raw arrays
    cities: citiesList,
    suspects: suspectsList,
    ranks: ranksList,
    investigationSpots: spotsList,
    stolenItems: stolenItemsList,
    assassinationAttempts: assassinationList,
    finalCityClues: finalCluesList,
    deadEnds: deadEndsList,
    goodDeeds: goodDeedsList,
    fakeGoodDeeds: fakeGoodDeedsList,
    rogueActions: rogueActionsList,
    gadgets: gadgetsList,
    encounters: encounters, // Contains henchman_encounters and assassination_attempts

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
