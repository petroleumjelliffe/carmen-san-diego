/**
 * Generate geography trivia questions for encounters
 */

function shuffle(array) {
  const result = [...array];
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}

function pickRandom(array) {
  return array[Math.floor(Math.random() * array.length)];
}

/**
 * Select distractor countries for multiple choice
 * Medium difficulty: same continent as correct answer
 */
export function selectDistractors(countries, correctCountry, count = 3) {
  // Medium difficulty: same continent
  let pool = countries.filter(c =>
    c.id !== correctCountry.id &&
    c.continent === correctCountry.continent
  );

  // Fallback if not enough same-continent countries
  if (pool.length < count) {
    pool = countries.filter(c => c.id !== correctCountry.id);
  }

  const selected = shuffle(pool).slice(0, count);

  // Debug logging
  console.log('Trivia Question Generation:', {
    correctCountry: correctCountry.name,
    correctId: correctCountry.id,
    distractors: selected.map(c => c.name),
    allOptions: [correctCountry, ...selected].map(c => ({ id: c.id, name: c.name }))
  });

  return selected;
}

/**
 * Generate a trivia question
 * @param {Array} countries - All available countries
 * @param {Array} challengeTypes - Challenge type definitions
 * @param {Array} answeredCountries - Country IDs already used (to avoid duplicates)
 * @returns {Object} Complete trivia question with options and correct answer
 */
export function generateTriviaQuestion(countries, challengeTypes, answeredCountries = []) {
  // Filter out already answered countries
  const availableCountries = countries.filter(
    c => !answeredCountries.includes(c.id)
  );

  // Fallback if all countries used
  const countryPool = availableCountries.length >= 4
    ? availableCountries
    : countries;

  // Pick random challenge type (flag or currency)
  const challengeType = pickRandom(challengeTypes);

  // Pick correct answer
  let correctCountry;
  if (challengeType.stimulus_type === 'currency') {
    // Only use countries with distinctive currencies
    const distinctiveCurrencies = ['£', '¥', '₹', '₽', '₺', '฿', 'R$', 'KSh', 'DH', 'E£'];
    const validCountries = countryPool.filter(c =>
      distinctiveCurrencies.includes(c.currencySymbol)
    );
    correctCountry = pickRandom(validCountries.length > 0 ? validCountries : countryPool);
  } else {
    correctCountry = pickRandom(countryPool);
  }

  // Select 3 distractors (same continent)
  const distractors = selectDistractors(countryPool, correctCountry, 3);

  // Shuffle all options
  const allOptions = shuffle([correctCountry, ...distractors]);

  // Generate stimulus
  let stimulus, stimulusSubtext;
  if (challengeType.stimulus_type === 'flag') {
    stimulus = correctCountry.flag;
  } else if (challengeType.stimulus_type === 'currency') {
    stimulus = correctCountry.currencySymbol;
    stimulusSubtext = correctCountry.currencyName;
  }

  return {
    challengeTypeId: challengeType.id,
    challengeType: challengeType,
    correctCountryId: correctCountry.id,
    correctCountry: correctCountry,
    options: allOptions.map(c => c.id),
    mappedOptions: allOptions,
    stimulus: stimulus,
    stimulusSubtext: stimulusSubtext,
    flavorText: challengeType.prompt_template,
    contextIcon: challengeType.icon,
  };
}
