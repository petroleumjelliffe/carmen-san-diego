/**
 * Path calculation utilities for orthogonal (street-like) navigation
 */

/**
 * Calculate the corner point for an orthogonal path (horizontal then vertical)
 * and the total distance
 */
export function getOrthogonalPathPoints(startPos, endPos) {
  const cornerX = endPos.x;
  const cornerY = startPos.y;

  const horizontalDist = Math.abs(endPos.x - startPos.x);
  const verticalDist = Math.abs(endPos.y - startPos.y);
  const totalDist = horizontalDist + verticalDist;

  return {
    corner: { x: cornerX, y: cornerY },
    horizontalDist,
    verticalDist,
    totalDist,
  };
}

/**
 * Get the current position along an orthogonal path based on progress (0-1)
 */
export function getPointOnOrthogonalPath(startPos, endPos, progress) {
  const { corner, horizontalDist, verticalDist, totalDist } = getOrthogonalPathPoints(startPos, endPos);
  const travelDist = progress * totalDist;

  if (travelDist <= horizontalDist) {
    // Moving horizontally
    const ratio = horizontalDist > 0 ? travelDist / horizontalDist : 0;
    return {
      x: startPos.x + (corner.x - startPos.x) * ratio,
      y: startPos.y
    };
  } else {
    // Moving vertically
    const verticalProgress = travelDist - horizontalDist;
    const ratio = verticalDist > 0 ? verticalProgress / verticalDist : 0;
    return {
      x: corner.x,
      y: corner.y + (endPos.y - corner.y) * ratio
    };
  }
}

/**
 * Generate SVG path string for full orthogonal path
 */
export function getOrthogonalPathD(startPos, endPos) {
  const { corner } = getOrthogonalPathPoints(startPos, endPos);
  return `M ${startPos.x} ${startPos.y} L ${corner.x} ${corner.y} L ${endPos.x} ${endPos.y}`;
}

/**
 * Generate SVG path string for the traveled portion of an orthogonal path
 */
export function getCurrentOrthogonalPathD(startPos, endPos, progress) {
  const currentPos = getPointOnOrthogonalPath(startPos, endPos, progress);
  const { corner, horizontalDist, totalDist } = getOrthogonalPathPoints(startPos, endPos);
  const travelDist = progress * totalDist;

  if (travelDist <= horizontalDist) {
    // Only horizontal movement so far
    return `M ${startPos.x} ${startPos.y} L ${currentPos.x} ${currentPos.y}`;
  } else {
    // Horizontal complete, now vertical
    return `M ${startPos.x} ${startPos.y} L ${corner.x} ${corner.y} L ${currentPos.x} ${currentPos.y}`;
  }
}
