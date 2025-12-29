import { useState, useEffect } from 'react';

/**
 * Hook for responsive design - detects if screen matches a media query
 * @param {string} query - CSS media query (e.g., '(min-width: 768px)')
 * @returns {boolean} - true if query matches
 */
export function useMediaQuery(query) {
  const [matches, setMatches] = useState(false);

  useEffect(() => {
    const mediaQuery = window.matchMedia(query);

    // Set initial value
    setMatches(mediaQuery.matches);

    // Listen for changes
    const handler = (event) => setMatches(event.matches);

    // Modern browsers
    if (mediaQuery.addEventListener) {
      mediaQuery.addEventListener('change', handler);
      return () => mediaQuery.removeEventListener('change', handler);
    }

    // Fallback for older browsers
    mediaQuery.addListener(handler);
    return () => mediaQuery.removeListener(handler);
  }, [query]);

  return matches;
}

/**
 * Convenience hook for common breakpoint
 * @returns {boolean} - true if desktop (>= 768px)
 */
export function useIsDesktop() {
  return useMediaQuery('(min-width: 768px)');
}

export default useMediaQuery;
