/**
 * Validate game data at startup and log warnings
 */
export function validateGameData(gameData) {
  const warnings = [];

  // 1. Validate suspects cover all trait combinations
  validateSuspectCombinations(gameData, warnings);

  // 2. Validate all cities have destination clues
  validateCityClues(gameData, warnings);

  // 3. Check minimum clue variety
  validateClueVariety(gameData, warnings);

  // 4. Validate investigation spot configuration
  validateInvestigationSpots(gameData, warnings);

  // Log any warnings
  if (warnings.length > 0) {
    console.warn('Game data validation warnings:');
    warnings.forEach(w => console.warn(`  - ${w}`));
  }

  return warnings;
}

function validateSuspectCombinations(gameData, warnings) {
  const { suspects, suspectClues } = gameData;
  const traitNames = Object.keys(suspectClues);

  // Generate all possible combinations
  const allCombinations = [];
  const generateCombinations = (traits, current = {}) => {
    if (traits.length === 0) {
      allCombinations.push({ ...current });
      return;
    }
    const [trait, ...rest] = traits;
    const values = Object.keys(suspectClues[trait]);
    for (const value of values) {
      generateCombinations(rest, { ...current, [trait]: value });
    }
  };
  generateCombinations(traitNames);

  // Check each combination has exactly one suspect
  for (const combo of allCombinations) {
    const matching = suspects.filter(s =>
      traitNames.every(t => s[t] === combo[t])
    );
    if (matching.length === 0) {
      warnings.push(`Missing suspect for combination: ${JSON.stringify(combo)}`);
    } else if (matching.length > 1) {
      warnings.push(`Multiple suspects for combination: ${JSON.stringify(combo)}`);
    }
  }
}

function validateCityClues(gameData, warnings) {
  const { cityIds, destinationClues } = gameData;

  for (const cityId of cityIds) {
    if (!destinationClues[cityId]) {
      warnings.push(`City "${cityId}" has no destination clues`);
    }
  }
}

function validateClueVariety(gameData, warnings) {
  const { destinationClues, suspectClues } = gameData;

  // Check destination clue variety
  for (const [cityId, clues] of Object.entries(destinationClues)) {
    if (clues.length < 3) {
      warnings.push(`City "${cityId}" has only ${clues.length} destination clues (recommend 3+)`);
    }
  }

  // Check suspect clue variety
  for (const [trait, values] of Object.entries(suspectClues)) {
    for (const [value, clues] of Object.entries(values)) {
      if (clues.length < 2) {
        warnings.push(`Trait "${trait}:${value}" has only ${clues.length} clues (recommend 2+)`);
      }
    }
  }
}

function validateInvestigationSpots(gameData, warnings) {
  const { investigationSpots } = gameData;

  // Check at least one spot gives suspect clues
  const hasSuspectSpot = investigationSpots.some(spot =>
    spot.gives.includes('suspect')
  );
  if (!hasSuspectSpot) {
    warnings.push('No investigation spot provides suspect clues');
  }

  // Check spots are ordered by time_cost
  const costs = investigationSpots.map(s => s.time_cost);
  const sorted = [...costs].sort((a, b) => a - b);
  if (JSON.stringify(costs) !== JSON.stringify(sorted)) {
    warnings.push('Investigation spots are not sorted by time_cost ascending');
  }
}
