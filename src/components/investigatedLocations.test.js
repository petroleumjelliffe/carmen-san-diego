import { describe, it, expect } from 'vitest';

/**
 * Tests for the investigatedLocations computation logic
 * These tests verify the data format contract between:
 * - Game.jsx (produces investigatedLocations)
 * - CityMapView.jsx (consumes investigatedSpots, expects spot.id strings)
 * - InvestigateTab.jsx (consumes investigatedLocations, expects spot.id strings)
 */

describe('investigatedLocations computation', () => {
  // Mock city clues as they would come from generateCluesForCity
  const mockCityClues = [
    { spot: { id: 'cafe-001', name: 'Cafe', lat: 48.8566, lon: 2.3522 } },
    { spot: { id: 'museum-002', name: 'Museum', lat: 48.8606, lon: 2.3376 } },
    { spot: { id: 'park-003', name: 'Park', lat: 48.8530, lon: 2.3499 } },
  ];

  /**
   * Helper to compute investigatedLocations the same way Game.jsx does
   */
  function computeInvestigatedLocations(investigatedSpots, currentCityId, cityClues) {
    const indices = investigatedSpots
      .filter(s => s.startsWith(`${currentCityId}:`))
      .map(s => parseInt(s.split(':')[1], 10));

    if (!cityClues) return [];
    return indices.map(idx => cityClues[idx]?.spot?.id).filter(Boolean);
  }

  describe('data format contract', () => {
    it('should return spot.id values (strings), not indices (numbers)', () => {
      const investigatedSpots = ['paris:0', 'paris:2'];
      const currentCityId = 'paris';

      const result = computeInvestigatedLocations(investigatedSpots, currentCityId, mockCityClues);

      // Must return strings
      expect(result).toEqual(['cafe-001', 'park-003']);

      // Must NOT contain indices
      expect(result).not.toContain(0);
      expect(result).not.toContain(2);

      // All elements must be strings
      result.forEach(item => {
        expect(typeof item).toBe('string');
      });
    });

    it('should work with CityMapView spot.id check', () => {
      const investigatedLocations = computeInvestigatedLocations(
        ['paris:0', 'paris:2'],
        'paris',
        mockCityClues
      );

      // CityMapView does: investigatedSpots.includes(spot.id)
      const spotId = 'cafe-001';
      const isInvestigated = investigatedLocations.includes(spotId);

      expect(isInvestigated).toBe(true);
    });

    it('should work with InvestigateTab spot.id check', () => {
      const investigatedLocations = computeInvestigatedLocations(
        ['paris:0', 'paris:2'],
        'paris',
        mockCityClues
      );

      // InvestigateTab does: investigatedLocations.includes(clue.spot.id)
      mockCityClues.forEach(clue => {
        const investigated = investigatedLocations.includes(clue.spot.id);

        if (clue.spot.id === 'cafe-001' || clue.spot.id === 'park-003') {
          expect(investigated).toBe(true);
        } else {
          expect(investigated).toBe(false);
        }
      });
    });
  });

  describe('edge cases', () => {
    it('should return empty array for no investigated spots', () => {
      const result = computeInvestigatedLocations([], 'paris', mockCityClues);
      expect(result).toEqual([]);
    });

    it('should return empty array when cityClues is null', () => {
      const result = computeInvestigatedLocations(['paris:0'], 'paris', null);
      expect(result).toEqual([]);
    });

    it('should return empty array when cityClues is undefined', () => {
      const result = computeInvestigatedLocations(['paris:0'], 'paris', undefined);
      expect(result).toEqual([]);
    });

    it('should filter to current city only', () => {
      const investigatedSpots = ['paris:0', 'london:1', 'paris:2', 'tokyo:0'];
      const currentCityId = 'paris';

      const result = computeInvestigatedLocations(investigatedSpots, currentCityId, mockCityClues);

      // Should only include paris spots
      expect(result).toEqual(['cafe-001', 'park-003']);
      expect(result).toHaveLength(2);
    });

    it('should handle invalid indices gracefully', () => {
      const investigatedSpots = ['paris:0', 'paris:99']; // 99 is out of bounds
      const currentCityId = 'paris';

      const result = computeInvestigatedLocations(investigatedSpots, currentCityId, mockCityClues);

      // Should only include valid index
      expect(result).toEqual(['cafe-001']);
    });

    it('should handle spots without id gracefully', () => {
      const cluesWithMissingId = [
        { spot: { id: 'cafe-001', name: 'Cafe' } },
        { spot: { name: 'Museum' } }, // No id
        { spot: { id: 'park-003', name: 'Park' } },
      ];

      const investigatedSpots = ['paris:0', 'paris:1', 'paris:2'];
      const currentCityId = 'paris';

      const result = computeInvestigatedLocations(investigatedSpots, currentCityId, cluesWithMissingId);

      // Should filter out undefined
      expect(result).toEqual(['cafe-001', 'park-003']);
    });
  });
});

describe('lastInvestigatedSpotId for animation origin', () => {
  it('should return second-to-last spot.id for animation origin', () => {
    // This is what InvestigateTab computes for CityMapView animation
    const investigatedLocations = ['cafe-001', 'museum-002', 'park-003'];

    const lastInvestigatedSpotId = investigatedLocations.length > 1
      ? investigatedLocations[investigatedLocations.length - 2]
      : null;

    expect(lastInvestigatedSpotId).toBe('museum-002');
    expect(typeof lastInvestigatedSpotId).toBe('string');
  });

  it('should return null when only one spot investigated', () => {
    const investigatedLocations = ['cafe-001'];

    const lastInvestigatedSpotId = investigatedLocations.length > 1
      ? investigatedLocations[investigatedLocations.length - 2]
      : null;

    expect(lastInvestigatedSpotId).toBe(null);
  });

  it('should return null when no spots investigated', () => {
    const investigatedLocations = [];

    const lastInvestigatedSpotId = investigatedLocations.length > 1
      ? investigatedLocations[investigatedLocations.length - 2]
      : null;

    expect(lastInvestigatedSpotId).toBe(null);
  });

  it('should return first spot when exactly two spots investigated', () => {
    const investigatedLocations = ['cafe-001', 'museum-002'];

    const lastInvestigatedSpotId = investigatedLocations.length > 1
      ? investigatedLocations[investigatedLocations.length - 2]
      : null;

    expect(lastInvestigatedSpotId).toBe('cafe-001');
  });
});

describe('CityMapView getAnimationStartPos integration', () => {
  const mockSpots = [
    { spot: { id: 'cafe-001', lat: 48.8566, lon: 2.3522 } },
    { spot: { id: 'museum-002', lat: 48.8606, lon: 2.3376 } },
    { spot: { id: 'park-003', lat: 48.8530, lon: 2.3499 } },
  ];

  const mockHotel = { lat: 48.8584, lon: 2.2945 };

  /**
   * Simulates CityMapView's getAnimationStartPos logic
   */
  function getAnimationStartPos(lastInvestigatedSpotId, spots, hotel) {
    if (lastInvestigatedSpotId) {
      const lastSpot = spots.find(s => s.spot.id === lastInvestigatedSpotId)?.spot;
      if (lastSpot?.lat && lastSpot?.lon) {
        return { lat: lastSpot.lat, lon: lastSpot.lon };
      }
    }
    return hotel ? { lat: hotel.lat, lon: hotel.lon } : null;
  }

  it('should find spot by id when lastInvestigatedSpotId is a string', () => {
    const lastInvestigatedSpotId = 'museum-002';
    const result = getAnimationStartPos(lastInvestigatedSpotId, mockSpots, mockHotel);

    expect(result).toEqual({ lat: 48.8606, lon: 2.3376 });
  });

  it('should NOT find spot when lastInvestigatedSpotId is a number (index)', () => {
    // This is the bug we're preventing
    const lastInvestigatedSpotId = 1; // This is wrong - should be 'museum-002'
    const result = getAnimationStartPos(lastInvestigatedSpotId, mockSpots, mockHotel);

    // Falls back to hotel because spots.find(s => s.spot.id === 1) returns undefined
    expect(result).toEqual({ lat: mockHotel.lat, lon: mockHotel.lon });
  });

  it('should fall back to hotel when spot not found', () => {
    const lastInvestigatedSpotId = 'nonexistent-spot';
    const result = getAnimationStartPos(lastInvestigatedSpotId, mockSpots, mockHotel);

    expect(result).toEqual({ lat: mockHotel.lat, lon: mockHotel.lon });
  });

  it('should fall back to hotel when lastInvestigatedSpotId is null', () => {
    const result = getAnimationStartPos(null, mockSpots, mockHotel);

    expect(result).toEqual({ lat: mockHotel.lat, lon: mockHotel.lon });
  });
});
