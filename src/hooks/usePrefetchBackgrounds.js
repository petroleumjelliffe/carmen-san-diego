import { useEffect, useState } from 'react';

/**
 * Prefetches background images for a case during briefing
 * @param {Object} currentCase - Case object with cities array
 * @param {Object} citiesById - City data indexed by ID
 * @param {Object} backgrounds - Global backgrounds (traveling)
 * @returns {Object} { isLoading, loadedCount, totalCount }
 */
export function usePrefetchBackgrounds(currentCase, citiesById, backgrounds) {
  const [isLoading, setIsLoading] = useState(false);
  const [loadedCount, setLoadedCount] = useState(0);
  const [totalCount, setTotalCount] = useState(0);

  useEffect(() => {
    if (!currentCase || !citiesById || !backgrounds) return;

    // Collect all background URLs for this case
    const backgroundUrls = [];

    // Add traveling background
    if (backgrounds.traveling) {
      backgroundUrls.push(backgrounds.traveling);
    }

    // Add each city background
    currentCase.cities.forEach(cityId => {
      const city = citiesById[cityId];
      if (city?.background_image) {
        backgroundUrls.push(city.background_image);
      }
    });

    setTotalCount(backgroundUrls.length);
    setIsLoading(true);

    // Prefetch each image
    let loaded = 0;
    const images = backgroundUrls.map(url => {
      const img = new Image();
      img.onload = () => {
        loaded++;
        setLoadedCount(loaded);
        if (loaded === backgroundUrls.length) {
          setIsLoading(false);
        }
      };
      img.onerror = () => {
        // Still count as "loaded" to avoid blocking
        loaded++;
        setLoadedCount(loaded);
        if (loaded === backgroundUrls.length) {
          setIsLoading(false);
        }
      };
      img.src = url;
      return img;
    });

    // Cleanup
    return () => {
      images.forEach(img => {
        img.onload = null;
        img.onerror = null;
      });
    };
  }, [currentCase, citiesById, backgrounds]);

  return { isLoading, loadedCount, totalCount };
}
