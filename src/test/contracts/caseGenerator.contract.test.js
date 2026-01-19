import { describe, it, expect, beforeAll } from 'vitest';
import { generateCase } from '../../utils/caseGenerator.js';
import { loadGameData } from '../../utils/loadGameData.js';
import { createMockCase } from '../factories/createMockCase.js';
import { hasAvailableSpots } from '../../state/guards.js';

/**
 * Contract tests that verify the real caseGenerator.js output
 * matches what guards/actions/components expect.
 *
 * These tests catch data structure mismatches between:
 * - The producer (caseGenerator.js)
 * - The consumers (guards.js, actions.js, components)
 * - The test mocks (createMockCase factory)
 */
describe('caseGenerator contract tests', () => {
  let gameData;
  let generatedCase;

  beforeAll(() => {
    gameData = loadGameData();
    generatedCase = generateCase(gameData);
  });

  describe('data structure contract', () => {
    it('cities should be an array of strings, not objects', () => {
      expect(Array.isArray(generatedCase.cities)).toBe(true);
      expect(generatedCase.cities.length).toBeGreaterThan(0);

      generatedCase.cities.forEach((city, i) => {
        expect(typeof city).toBe('string');
        // Should NOT be an object with id property
        expect(typeof city).not.toBe('object');
      });
    });

    it('cityData should be a parallel array with same length as cities', () => {
      expect(Array.isArray(generatedCase.cityData)).toBe(true);
      expect(generatedCase.cityData.length).toBe(generatedCase.cities.length);
    });

    it('each cityData entry should have investigationSpots array', () => {
      generatedCase.cityData.forEach((cd, i) => {
        expect(cd).toHaveProperty('investigationSpots');
        expect(Array.isArray(cd.investigationSpots)).toBe(true);
        expect(cd.investigationSpots.length).toBeGreaterThan(0);
      });
    });

    it('investigation spots should NOT be on cities array', () => {
      // This is the bug we're preventing
      generatedCase.cities.forEach((city, i) => {
        // cities are strings, so they can't have properties
        expect(typeof city).toBe('string');
        // But if someone accidentally made them objects...
        if (typeof city === 'object') {
          expect(city).not.toHaveProperty('investigationSpots');
        }
      });
    });

    it('suspect should have required properties', () => {
      expect(generatedCase.suspect).toHaveProperty('id');
      expect(generatedCase.suspect).toHaveProperty('name');
    });
  });

  describe('mock factory compatibility', () => {
    it('mock factory structure should match real generator', () => {
      const mockCase = createMockCase();

      // Structural equivalence (not value equivalence)
      expect(typeof generatedCase.cities[0]).toBe(typeof mockCase.cities[0]);
      expect(Array.isArray(generatedCase.cityData)).toBe(
        Array.isArray(mockCase.cityData)
      );
      expect(generatedCase.cityData[0]).toHaveProperty('investigationSpots');
      expect(mockCase.cityData[0]).toHaveProperty('investigationSpots');
    });

    it('both should have parallel cities and cityData arrays', () => {
      const mockCase = createMockCase();

      expect(generatedCase.cities.length).toBe(generatedCase.cityData.length);
      expect(mockCase.cities.length).toBe(mockCase.cityData.length);
    });
  });

  describe('guards compatibility', () => {
    it('hasAvailableSpots guard works with real generator output', () => {
      const context = {
        currentCase: generatedCase,
        cityIndex: 0,
        spotsUsedInCity: 0,
      };

      // This is the exact access pattern that caused the bug:
      // const cityData = context.currentCase.cityData?.[context.cityIndex];
      // return context.spotsUsedInCity < cityData.investigationSpots.length;
      const result = hasAvailableSpots({ context });
      expect(result).toBe(true);
    });

    it('hasAvailableSpots returns false when all spots used', () => {
      const spotsCount =
        generatedCase.cityData[0].investigationSpots.length;
      const context = {
        currentCase: generatedCase,
        cityIndex: 0,
        spotsUsedInCity: spotsCount,
      };

      const result = hasAvailableSpots({ context });
      expect(result).toBe(false);
    });

    it('should work with mock factory too', () => {
      const mockCase = createMockCase();
      const context = {
        currentCase: mockCase,
        cityIndex: 0,
        spotsUsedInCity: 0,
      };

      const result = hasAvailableSpots({ context });
      expect(result).toBe(true);
    });
  });

  describe('preventing the original bug', () => {
    it('accessing cities[idx].investigationSpots should fail gracefully', () => {
      // This is the buggy pattern - it should NOT work
      const cityIndex = 0;
      const city = generatedCase.cities[cityIndex];

      // Since city is a string, accessing .investigationSpots returns undefined
      expect(city.investigationSpots).toBeUndefined();

      // The correct pattern is to use cityData
      const cityData = generatedCase.cityData[cityIndex];
      expect(cityData.investigationSpots).toBeDefined();
      expect(Array.isArray(cityData.investigationSpots)).toBe(true);
    });
  });
});

describe('validateCaseData catches bad mocks', () => {
  it('throws when cities contains objects instead of strings', () => {
    expect(() => {
      createMockCase({
        cities: [{ id: 'city1', investigationSpots: 3 }], // Wrong!
        cityData: [{ investigationSpots: [{ id: 'spot1' }] }],
      });
    }).toThrow(/cities\[0\] must be a string/);
  });

  it('throws when cityData is missing investigationSpots', () => {
    expect(() => {
      createMockCase({
        cities: ['city1'],
        cityData: [{ foo: 'bar' }], // Missing investigationSpots
      });
    }).toThrow(/investigationSpots must be an array/);
  });

  it('throws when cities and cityData lengths mismatch', () => {
    expect(() => {
      createMockCase({
        cities: ['city1', 'city2'],
        cityData: [{ investigationSpots: [{ id: 'spot1' }] }], // Only 1, not 2
      });
    }).toThrow(/cities.length.*must equal.*cityData.length/);
  });
});
