import { shuffle, pickRandom } from './helpers';

/**
 * Generate a new case with random cities, suspect, and stolen item
 */
export function generateCase(gameData) {
  const { cityIds, suspects, stolenItems, traitNames, settings, gadgets, encounters } = gameData;

  // Pick random cities for the trail
  const shuffledCities = shuffle(cityIds);
  const caseCities = shuffledCities.slice(0, settings.cities_per_case);

  // Pick random suspect
  const suspect = pickRandom(suspects);

  // Pick random stolen item
  const stolenItem = pickRandom(stolenItems);

  // Shuffle trait reveal order (one trait revealed per city before final)
  const traitOrder = shuffle([...traitNames]);

  // Pick 3 gadgets for this mission
  const selectedGadgets = shuffle([...gadgets]).slice(0, 3);

  // Pre-generate encounter sequence based on selected gadgets
  // Each gadget solves exactly one encounter
  const henchmanEncounters = encounters?.henchman_encounters || [];
  const encounterSequence = selectedGadgets
    .map(gadget => {
      // Find encounters that this gadget can solve
      const matching = henchmanEncounters.filter(e => e.correct_gadget === gadget.id);
      return matching.length > 0 ? pickRandom(matching) : null;
    })
    .filter(Boolean); // Remove nulls if no matching encounter found

  // Shuffle the encounter order so they don't appear in gadget order
  shuffle(encounterSequence);

  return {
    cities: caseCities,
    suspect,
    stolenItem,
    traitOrder,
    revealedTraits: [],
    gadgets: selectedGadgets,
    encounterSequence,
  };
}

export default generateCase;
