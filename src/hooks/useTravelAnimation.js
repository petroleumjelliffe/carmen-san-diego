import { useState, useCallback, useRef, useEffect } from 'react';
import {
  haversineDistance,
  getAnimationDuration,
  latLonToSVG,
  getFlightArcControlPoint
} from '../utils/geoUtils';

/**
 * Hook for managing travel animation state
 * @param {Function} onComplete - Callback when animation finishes
 * @returns {Object} Animation state and controls
 */
export function useTravelAnimation(onComplete) {
  const [isAnimating, setIsAnimating] = useState(false);
  const [progress, setProgress] = useState(0);
  const [travelData, setTravelData] = useState(null);

  const animationRef = useRef(null);
  const startTimeRef = useRef(null);
  const durationRef = useRef(3000); // Store duration in ref for immediate access
  const onCompleteRef = useRef(onComplete);

  // Keep onComplete ref updated
  useEffect(() => {
    onCompleteRef.current = onComplete;
  }, [onComplete]);

  // Animation loop - uses durationRef instead of travelData
  const animate = useCallback((timestamp) => {
    if (!startTimeRef.current) {
      startTimeRef.current = timestamp;
    }

    const elapsed = timestamp - startTimeRef.current;
    const duration = durationRef.current;
    const newProgress = Math.min(elapsed / duration, 1);

    setProgress(newProgress);

    if (newProgress < 1) {
      animationRef.current = requestAnimationFrame(animate);
    } else {
      // Animation complete - ensure we show 100% before completing
      setTimeout(() => {
        setIsAnimating(false);
        startTimeRef.current = null;
        if (onCompleteRef.current) {
          onCompleteRef.current();
        }
      }, 100); // Small delay to show completed state
    }
  }, []);

  // Start animation
  const startAnimation = useCallback((originCity, destCity) => {
    if (!originCity?.lat || !destCity?.lat) {
      // Missing coordinates, skip animation
      if (onCompleteRef.current) {
        onCompleteRef.current();
      }
      return;
    }

    // Calculate distance and duration
    const distance = haversineDistance(
      originCity.lat, originCity.lon,
      destCity.lat, destCity.lon
    );
    const duration = getAnimationDuration(distance);

    // Store duration in ref BEFORE starting animation
    durationRef.current = duration;

    // Calculate SVG coordinates (using 800x400 viewport)
    const svgWidth = 800;
    const svgHeight = 400;
    const fromPoint = latLonToSVG(originCity.lat, originCity.lon, svgWidth, svgHeight);
    const toPoint = latLonToSVG(destCity.lat, destCity.lon, svgWidth, svgHeight);
    const controlPoint = getFlightArcControlPoint(fromPoint, toPoint);

    setTravelData({
      origin: originCity,
      destination: destCity,
      distance: Math.round(distance),
      duration,
      fromPoint,
      toPoint,
      controlPoint,
      svgWidth,
      svgHeight
    });

    setProgress(0);
    setIsAnimating(true);
    startTimeRef.current = null;
    animationRef.current = requestAnimationFrame(animate);
  }, [animate]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, []);

  // Reset animation (for edge cases)
  const resetAnimation = useCallback(() => {
    if (animationRef.current) {
      cancelAnimationFrame(animationRef.current);
    }
    setIsAnimating(false);
    setProgress(0);
    setTravelData(null);
    startTimeRef.current = null;
  }, []);

  return {
    isAnimating,
    progress,
    travelData,
    startAnimation,
    resetAnimation
  };
}

export default useTravelAnimation;
