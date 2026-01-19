/**
 * Validates that a case data object matches the expected structure.
 * Throws descriptive errors for debugging test failures.
 *
 * This is the single source of truth for what caseGenerator.js produces
 * and what guards/actions expect.
 */
export function validateCaseData(caseData) {
  const errors = [];

  // Validate cities is array of strings (NOT objects!)
  if (!Array.isArray(caseData.cities)) {
    errors.push('cities must be an array');
  } else {
    caseData.cities.forEach((city, i) => {
      if (typeof city !== 'string') {
        errors.push(
          `cities[${i}] must be a string, got ${typeof city}. ` +
            `Common mistake: cities should be ['city1'], not [{ id: 'city1' }]`
        );
      }
    });
  }

  // Validate cityData has investigationSpots arrays
  if (!Array.isArray(caseData.cityData)) {
    errors.push('cityData must be an array');
  } else {
    caseData.cityData.forEach((cd, i) => {
      if (!cd.investigationSpots || !Array.isArray(cd.investigationSpots)) {
        errors.push(
          `cityData[${i}].investigationSpots must be an array. ` +
            `Investigation spots live in cityData, not cities.`
        );
      }
    });
  }

  // Validate parallel arrays have same length
  if (caseData.cities?.length !== caseData.cityData?.length) {
    errors.push(
      `cities.length (${caseData.cities?.length}) must equal ` +
        `cityData.length (${caseData.cityData?.length})`
    );
  }

  if (errors.length > 0) {
    throw new Error(
      `CaseData validation failed:\n${errors.map((e) => `  - ${e}`).join('\n')}`
    );
  }
}

export default validateCaseData;
