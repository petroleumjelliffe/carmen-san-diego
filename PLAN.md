# City Map Travel Animation Refactor Plan

## Current State

### CityMapView (Local City Travel)
- **Path style**: Orthogonal (stepwise horizontal then vertical - street-like navigation)
- **Current icon**: Destination landmark icon (e.g., 🗼 for Eiffel Tower)
- **Animation location**: Lines 338-455 and 457-573 in CityMapView.jsx
- **Two separate implementations**: Regular investigation and rogue investigation (nearly identical)

### TravelAnimation (Intercity Flight)
- **Path style**: Curved arcs (Bezier curves - flight paths)
- **Icon**: Plane icon (with recent car support via `vehicleType` prop)
- **Animation location**: Uses world map with continent outlines

## Problems

1. **Wrong icon in city travel**: Using destination landmark icon instead of car
2. **Code duplication**: Investigation and rogue animations are 95% identical
3. **No reusability**: Similar animation patterns exist in both files but aren't shared

## Solution Design

### 1. Create Shared Animation Component

**New file**: `src/components/PathAnimation.jsx`

**Component**: `PathAnimation`

**Props**:
```javascript
{
  startPos: { x, y },
  endPos: { x, y },
  progress: number (0-1),
  pathType: 'orthogonal' | 'arc',
  controlPoint?: { x, y } (for arc paths),
  icon: string (emoji),
  color: string (e.g., '#fbbf24' for yellow, '#f97316' for orange),
  glowColor: string (rgba),
  size: number (icon circle radius)
}
```

**Features**:
- Renders full path (dashed preview)
- Renders animated path (drawn portion)
- Renders moving icon with glow
- Calculates current position based on progress and path type
- Handles both orthogonal and arc path calculations

### 2. Update CityMapView

**Changes**:
- Replace investigation animation block (lines 338-455) with `<PathAnimation>`
- Replace rogue animation block (lines 457-573) with `<PathAnimation>`
- Pass car icon (`'🚗'`) for both animations
- Use yellow color for investigations, orange for rogue
- Remove duplicate path calculation logic

**Example usage**:
```jsx
{investigatingSpotIndex !== null && (
  <PathAnimation
    startPos={animationStartPos}
    endPos={spotPositions[investigatingSpotIndex]}
    progress={animationProgress}
    pathType="orthogonal"
    icon="🚗"
    color="#fbbf24"
    glowColor="rgba(251, 191, 36, 0.5)"
    size={22}
  />
)}
```

### 3. Keep TravelAnimation Separate

**Rationale**:
- Different coordinate systems (world map vs city map)
- Different visual context (continent outlines vs city grid)
- Different data structures (travel data with distance, cities)
- Already supports vehicle type parameterization

**No changes needed** to TravelAnimation.jsx

## Implementation Steps

### Step 1: Extract Path Calculation Utilities
**File**: `src/utils/pathUtils.js`

**Functions**:
- `getOrthogonalPathPoints(start, end)` - Returns corner point and total distance
- `getPointOnOrthogonalPath(start, end, progress)` - Returns current position
- `getOrthogonalPathD(start, end)` - Returns SVG path string
- `getCurrentOrthogonalPathD(start, end, progress)` - Returns partial path string

### Step 2: Create PathAnimation Component
**File**: `src/components/PathAnimation.jsx`

**Structure**:
```jsx
export function PathAnimation({
  startPos,
  endPos,
  progress,
  pathType = 'orthogonal',
  controlPoint = null,
  icon = '🚗',
  color = '#fbbf24',
  glowColor = 'rgba(251, 191, 36, 0.5)',
  dashColor = 'rgba(251, 191, 36, 0.4)',
  size = 22,
}) {
  // Calculate paths based on pathType
  // Render: dashed full path, glowing progress path, solid progress path, moving icon
}
```

### Step 3: Update CityMapView.jsx

**Remove** (lines 338-573):
- Investigation animation block
- Rogue animation block
- Duplicate path calculation logic

**Add**:
- Import PathAnimation
- Two PathAnimation instances (one for regular, one for rogue)
- Pass appropriate props for each

**Result**: ~235 lines removed, ~20 lines added

### Step 4: Test

**Scenarios**:
1. Regular investigation - yellow car traveling on orthogonal path
2. Rogue investigation - orange car traveling on orthogonal path
3. Airport travel - plane icon on curved path (unchanged)
4. Animation completes properly
5. Path colors match design (yellow for regular, orange for rogue)

## File Changes Summary

### New Files
- `src/utils/pathUtils.js` - Path calculation utilities
- `src/components/PathAnimation.jsx` - Reusable animation component

### Modified Files
- `src/components/CityMapView.jsx` - Replace duplicate animation blocks with PathAnimation
- Net change: -215 lines

### Unchanged Files
- `src/components/TravelAnimation.jsx` - Already has vehicle type support
- `src/components/InvestigateTab.jsx` - Only passes props to CityMapView

## Benefits

1. **Correct icon**: Car emoji for city travel ✓
2. **DRY principle**: Eliminate 200+ lines of duplicate code ✓
3. **Reusability**: PathAnimation can be used for future animation needs ✓
4. **Maintainability**: Single source of truth for path animations ✓
5. **Consistency**: Same animation behavior for regular and rogue ✓

## Migration Notes

- No breaking changes to parent components
- CityMapView API remains the same
- Animation behavior identical to current (except icon change)
- Can be implemented incrementally (utils → component → integration)
