/**
 * Geographic utilities for travel animation
 */

/**
 * Calculate great-circle distance between two points using Haversine formula
 * @param {number} lat1 - Latitude of point 1 (degrees)
 * @param {number} lon1 - Longitude of point 1 (degrees)
 * @param {number} lat2 - Latitude of point 2 (degrees)
 * @param {number} lon2 - Longitude of point 2 (degrees)
 * @returns {number} Distance in kilometers
 */
export function haversineDistance(lat1, lon1, lat2, lon2) {
  const R = 6371; // Earth's radius in km
  const dLat = toRadians(lat2 - lat1);
  const dLon = toRadians(lon2 - lon1);

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRadians(lat1)) * Math.cos(toRadians(lat2)) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

function toRadians(degrees) {
  return degrees * (Math.PI / 180);
}

/**
 * Convert lat/lon to SVG coordinates using equirectangular projection
 * @param {number} lat - Latitude (degrees)
 * @param {number} lon - Longitude (degrees)
 * @param {number} width - SVG width
 * @param {number} height - SVG height
 * @returns {{x: number, y: number}} SVG coordinates
 */
export function latLonToSVG(lat, lon, width, height) {
  // Equirectangular projection
  // Longitude maps directly to x (-180 to 180 -> 0 to width)
  // Latitude maps to y (90 to -90 -> 0 to height)
  const x = ((lon + 180) / 360) * width;
  const y = ((90 - lat) / 180) * height;
  return { x, y };
}

/**
 * Calculate animation duration based on distance
 * Shorter flights: 2000ms, longest flights: 5000ms
 * @param {number} distanceKm - Distance in kilometers
 * @returns {number} Duration in milliseconds
 */
export function getAnimationDuration(distanceKm) {
  // Max distance roughly: Tokyo to London ~9500km
  // Min useful distance: ~500km
  const minDuration = 2000;
  const maxDuration = 5000;
  const minDistance = 500;
  const maxDistance = 15000;

  // Clamp distance
  const clampedDistance = Math.max(minDistance, Math.min(maxDistance, distanceKm));

  // Linear interpolation
  const t = (clampedDistance - minDistance) / (maxDistance - minDistance);
  return Math.round(minDuration + t * (maxDuration - minDuration));
}

/**
 * Get control point for quadratic bezier curve (for curved flight path)
 * The control point is offset perpendicular to the midpoint
 * @param {{x: number, y: number}} from - Start point
 * @param {{x: number, y: number}} to - End point
 * @returns {{x: number, y: number}} Control point
 */
export function getFlightArcControlPoint(from, to) {
  // Midpoint
  const midX = (from.x + to.x) / 2;
  const midY = (from.y + to.y) / 2;

  // Vector from start to end
  const dx = to.x - from.x;
  const dy = to.y - from.y;

  // Perpendicular vector (rotated 90 degrees)
  // Normalize and scale by arc height (proportional to distance)
  const length = Math.sqrt(dx * dx + dy * dy);
  const arcHeight = Math.min(length * 0.3, 80); // Max arc height of 80px

  // Perpendicular unit vector
  const perpX = -dy / length;
  const perpY = dx / length;

  // Control point offset upward (negative y in SVG is up)
  // We want the arc to curve "up" which means toward the poles
  return {
    x: midX + perpX * arcHeight,
    y: midY - Math.abs(perpY * arcHeight) // Always curve upward
  };
}

/**
 * Calculate point on quadratic bezier curve
 * @param {{x: number, y: number}} p0 - Start point
 * @param {{x: number, y: number}} p1 - Control point
 * @param {{x: number, y: number}} p2 - End point
 * @param {number} t - Progress (0 to 1)
 * @returns {{x: number, y: number}} Point on curve
 */
export function quadraticBezierPoint(p0, p1, p2, t) {
  const oneMinusT = 1 - t;
  return {
    x: oneMinusT * oneMinusT * p0.x + 2 * oneMinusT * t * p1.x + t * t * p2.x,
    y: oneMinusT * oneMinusT * p0.y + 2 * oneMinusT * t * p1.y + t * t * p2.y
  };
}

/**
 * Calculate tangent angle on quadratic bezier curve (for plane rotation)
 * @param {{x: number, y: number}} p0 - Start point
 * @param {{x: number, y: number}} p1 - Control point
 * @param {{x: number, y: number}} p2 - End point
 * @param {number} t - Progress (0 to 1)
 * @returns {number} Angle in degrees
 */
export function quadraticBezierTangent(p0, p1, p2, t) {
  // Derivative of quadratic bezier
  const dx = 2 * (1 - t) * (p1.x - p0.x) + 2 * t * (p2.x - p1.x);
  const dy = 2 * (1 - t) * (p1.y - p0.y) + 2 * t * (p2.y - p1.y);
  return Math.atan2(dy, dx) * (180 / Math.PI);
}

/**
 * Generate SVG path string for quadratic bezier
 * @param {{x: number, y: number}} from - Start point
 * @param {{x: number, y: number}} control - Control point
 * @param {{x: number, y: number}} to - End point
 * @returns {string} SVG path d attribute
 */
export function generateFlightPath(from, control, to) {
  return `M ${from.x} ${from.y} Q ${control.x} ${control.y} ${to.x} ${to.y}`;
}

/**
 * Approximate length of quadratic bezier curve (for stroke animation)
 * @param {{x: number, y: number}} p0 - Start point
 * @param {{x: number, y: number}} p1 - Control point
 * @param {{x: number, y: number}} p2 - End point
 * @returns {number} Approximate length in pixels
 */
export function approximateBezierLength(p0, p1, p2) {
  // Simple approximation using chord and control polygon
  const chord = Math.sqrt(
    Math.pow(p2.x - p0.x, 2) + Math.pow(p2.y - p0.y, 2)
  );
  const controlPoly =
    Math.sqrt(Math.pow(p1.x - p0.x, 2) + Math.pow(p1.y - p0.y, 2)) +
    Math.sqrt(Math.pow(p2.x - p1.x, 2) + Math.pow(p2.y - p1.y, 2));

  // Approximate length is average of chord and control polygon
  return (chord + controlPoly) / 2;
}
