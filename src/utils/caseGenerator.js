import { shuffle, pickRandom } from './helpers';
import { generateTriviaQuestion } from './triviaGenerator';

/**
 * Generate a complete mission with all data pre-defined
 * This makes the mission deterministic and debuggable
 */
export function generateCase(gameData) {
  const {
    cityIds,
    citiesById,
    suspects,
    stolenItems,
    traitNames,
    settings,
    countries,
    challengeTypes,
    encounters,
    destinationClues,
    suspectClues,
    finalCityClues,
    deadEnds,
    investigationSpots,
    rogueActions,
  } = gameData;

  // Pick random cities for the trail
  const shuffledCities = shuffle([...cityIds]);
  const caseCities = shuffledCities.slice(0, settings.cities_per_case);

  // Pick random suspect
  const suspect = pickRandom(suspects);

  // Pick random stolen item
  const stolenItem = pickRandom(stolenItems);

  // Shuffle trait reveal order (one trait revealed per city before final)
  const traitOrder = shuffle([...traitNames]);

  // Generate unique trivia questions for encounters
  const usedCountries = [];

  // Generate 2 henchman trivia questions
  const henchmanTriviaQuestions = [];
  for (let i = 0; i < 2; i++) {
    const question = generateTriviaQuestion(countries, challengeTypes, usedCountries);
    henchmanTriviaQuestions.push(question);
    usedCountries.push(question.correctCountryId);
  }

  // Generate assassination trivia question
  const assassinationTriviaQuestion = generateTriviaQuestion(
    countries,
    challengeTypes,
    usedCountries
  );

  // Select encounter templates (no gadget matching needed)
  const henchmanEncounters = encounters?.henchman_encounters || [];
  const encounterTemplates = shuffle([...henchmanEncounters]).slice(0, 2);

  // Combine templates with trivia
  const encounterSequence = encounterTemplates.map((template, idx) => ({
    ...template,
    triviaQuestion: henchmanTriviaQuestions[idx],
  }));

  // Assassination with trivia
  const assassinationTemplate = pickRandom(encounters?.assassination_attempts || []);
  const assassinationAttempt = {
    ...assassinationTemplate,
    triviaQuestion: assassinationTriviaQuestion,
  };

  // Shuffle investigation rogue actions and assign one to each city
  const investigationRogueActions = rogueActions?.filter(ra => ra.type === 'investigation') || [];
  console.log('ROGUE ACTION DEBUG - Original order:', investigationRogueActions.map(ra => ra.id));
  const shuffledRogueActions = shuffle([...investigationRogueActions]);
  console.log('ROGUE ACTION DEBUG - Shuffled order:', shuffledRogueActions.map(ra => ra.id));

  // Pre-generate data for each city in the trail
  const cityData = caseCities.map((cityId, cityIndex) => {
    const isFinalCity = cityIndex === caseCities.length - 1;
    const city = citiesById[cityId];

    // Determine trait to reveal at this city
    const traitToReveal = traitOrder[cityIndex % traitOrder.length];
    const traitValue = suspect[traitToReveal];
    const traitCluePool = suspectClues[traitToReveal]?.[traitValue] || [];

    // Randomly pick which spot (0, 1, or 2) gets the suspect clue
    const suspectSpotIndex = Math.floor(Math.random() * investigationSpots.length);

    // Pick the actual suspect clue text
    const suspectClue = pickRandom(traitCluePool);

    // Get destination clues (for next city) or final city clues
    let locationClues;
    if (isFinalCity) {
      // Final city uses assassination plot clues
      const shuffledFinal = shuffle([...finalCityClues]);
      locationClues = shuffledFinal.slice(0, 2).map(c => c.text);
    } else {
      // Normal city - clues point to next city
      const nextCityId = caseCities[cityIndex + 1];
      const nextCityClues = destinationClues[nextCityId] || [];
      const shuffled = shuffle([...nextCityClues]);
      locationClues = shuffled.slice(0, 2).map(c => c.text);
    }

    // Generate travel destinations (correct + 3 decoys)
    let destinations = [];
    if (!isFinalCity) {
      const correctNextCity = caseCities[cityIndex + 1];
      const wrongCities = cityIds.filter(id =>
        id !== cityId && id !== correctNextCity
      );
      const selectedWrong = shuffle([...wrongCities]).slice(0, 3);

      destinations = shuffle([
        { cityId: correctNextCity, isCorrect: true },
        ...selectedWrong.map(id => ({ cityId: id, isCorrect: false })),
      ]).map(dest => ({
        ...dest,
        ...citiesById[dest.cityId],
      }));
    }

    // Pre-select dead ends for if player visits wrong city from here
    const shuffledDeadEnds = shuffle([...deadEnds]);

    // Parse city landmarks by type
    const landmarks = city?.landmarks || [];
    const hotel = landmarks.find(l => l.type === 'hotel') || null;
    const rogueLocation = landmarks.find(l => l.type === 'rogue') || null;
    const cityInvestigationSpots = landmarks.filter(l => l.type === 'investigation');

    // Fallback to generic investigation spots if none defined
    const investigationSpotsToUse = cityInvestigationSpots.length > 0
      ? cityInvestigationSpots
      : investigationSpots;

    // Assign a rogue action for this city (cycle through shuffled list)
    const rogueAction = shuffledRogueActions[cityIndex % shuffledRogueActions.length] || null;

    return {
      cityId,
      cityName: city?.name || cityId,
      isFinalCity,
      traitToReveal,
      suspectSpotIndex,
      suspectClue,
      locationClues,
      destinations,
      deadEndClues: shuffledDeadEnds.slice(0, 3),
      investigationSpots: investigationSpotsToUse,  // City-specific spots
      hotel,  // City-specific hotel
      rogueLocation,  // City-specific rogue location
      rogueAction,  // Randomized rogue action for this city
      // Assign encounter for this city (if applicable)
      // City 0 = no encounter, Cities 1-2 = henchman, Final = assassination
      encounter: isFinalCity
        ? assassinationAttempt
        : (cityIndex > 0 && cityIndex < caseCities.length - 1)
          ? encounterSequence[cityIndex - 1] || null
          : null,
    };
  });

  const caseData = {
    cities: caseCities,
    suspect,
    stolenItem,
    traitOrder,
    encounterSequence,
    assassinationAttempt,
    cityData,
    // Keep investigationSpots reference for UI
    investigationSpots,
  };

  // Debug output
  if (settings.debug_mode || import.meta.env.DEV) {
    console.log('=== NEW MISSION GENERATED ===');
    console.log('Suspect:', suspect.name, `(${suspect.gender}, ${suspect.hair} hair, ${suspect.hobby})`);
    console.log('Stolen:', stolenItem.name);
    console.log('Trail:', caseCities.map(id => citiesById[id]?.name).join(' → '));
    console.log('Trait reveal order:', traitOrder);
    console.log('Trivia Questions:', [
      ...henchmanTriviaQuestions.map(q => `${q.challengeType.id}: ${q.correctCountry.name}`),
      `Assassination: ${assassinationTriviaQuestion.challengeType.id}: ${assassinationTriviaQuestion.correctCountry.name}`
    ]);
    console.log('Encounters:', encounterSequence.map(e => e?.name || 'none'));
    console.log('Assassination:', assassinationAttempt?.name);
    console.log('--- City Details ---');
    cityData.forEach((cd, i) => {
      console.log(`City ${i} (${cd.cityName}):`, {
        trait: cd.traitToReveal,
        suspectSpot: cd.suspectSpotIndex,
        suspectClue: cd.suspectClue,
        locationClues: cd.locationClues,
        encounter: cd.encounter?.name || 'none',
        rogueAction: cd.rogueAction?.id || 'none',
        destinations: cd.destinations.map(d => `${d.name}${d.isCorrect ? ' ✓' : ''}`),
      });
    });
    console.log('=== END MISSION DATA ===');

    // Expose for automated QA
    if (typeof window !== 'undefined') {
      window.__CARMEN_DEBUG__ = {
        currentCase: caseData,
        getCorrectPath: () => caseCities.map(id => citiesById[id]?.name),
        getSuspect: () => suspect,
        getTraitOrder: () => traitOrder,
      };
    }
  }

  return caseData;
}

export default generateCase;
