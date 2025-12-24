/**
 * Shuffle an array using Fisher-Yates algorithm
 */
export function shuffle(array) {
  const arr = [...array];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

/**
 * Pick a random element from an array
 */
export function pickRandom(array) {
  if (!array || array.length === 0) return null;
  return array[Math.floor(Math.random() * array.length)];
}

/**
 * Index an array by a key field
 */
export function indexById(array, key = 'id') {
  return Object.fromEntries(array.map(item => [item[key], item]));
}

/**
 * Group an array by a key field
 */
export function groupBy(array, key) {
  return array.reduce((acc, item) => {
    const groupKey = item[key];
    if (!acc[groupKey]) {
      acc[groupKey] = [];
    }
    acc[groupKey].push(item);
    return acc;
  }, {});
}

/**
 * Get player rank based on solved cases
 */
export function getRank(ranks, solvedCases) {
  const sorted = [...ranks].sort((a, b) => b.min_cases - a.min_cases);
  return sorted.find(r => solvedCases >= r.min_cases) || ranks[0];
}
