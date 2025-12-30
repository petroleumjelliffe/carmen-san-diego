---
paths: src/**/*.{js,jsx}
---

# State Management Rules

## Single Source of Truth

Every piece of state should have ONE authoritative source. Never duplicate state.

### ❌ WRONG - Duplicated State
```javascript
function Game() {
  const [currentClue, setCurrentClue] = useState(null);
  const [displayedClue, setDisplayedClue] = useState(null); // Duplication!

  // Now you have to keep them in sync...
}
```

### ✅ CORRECT - Derived State
```javascript
function Game() {
  const [currentClue, setCurrentClue] = useState(null);
  const [isClueAnimating, setIsClueAnimating] = useState(false);

  // Derive what to display based on state
  const displayedClue = isClueAnimating ? null : currentClue;
}
```

## State Colocation

Keep state as close to where it's used as possible.

### Decision Tree: Where Should State Live?

1. **Is it only used in one component?** → Keep it there with `useState`
2. **Is it used by a component and its immediate children?** → Keep in parent, pass as props
3. **Is it used by siblings?** → Lift to common parent
4. **Is it used across unrelated parts of the tree?** → Use Context or state management library
5. **Is it server data?** → Consider React Query/SWR instead of useState

### ❌ WRONG - State Too High
```javascript
// App.jsx
function App() {
  const [isMapExpanded, setIsMapExpanded] = useState(false); // Only MapPanel needs this!

  return (
    <div>
      <Header />
      <GameBoard>
        <MapPanel isExpanded={isMapExpanded} setExpanded={setIsMapExpanded} />
      </GameBoard>
      <Footer />
    </div>
  );
}
```

### ✅ CORRECT - Colocated State
```javascript
// MapPanel.jsx
function MapPanel() {
  const [isExpanded, setIsExpanded] = useState(false); // Lives where it's used

  return (
    <div className={isExpanded ? 'expanded' : ''}>
      {/* ... */}
    </div>
  );
}
```

## Avoiding Derived State in useEffect

If you can calculate something from existing state/props, don't store it in state.

### ❌ WRONG - Unnecessary Effect
```javascript
function WitnessClue({ clue, isRevealed }) {
  const [displayText, setDisplayText] = useState('');

  // BAD: Storing derived value in state via effect
  useEffect(() => {
    setDisplayText(isRevealed ? clue.text : '???');
  }, [clue, isRevealed]);

  return <p>{displayText}</p>;
}
```

### ✅ CORRECT - Calculate During Render
```javascript
function WitnessClue({ clue, isRevealed }) {
  // GOOD: Calculate directly
  const displayText = isRevealed ? clue.text : '???';

  return <p>{displayText}</p>;
}
```

### When Derived State in useEffect IS Appropriate

Only use derived state in effects when:
- The derived value is expensive to compute (then use `useMemo`)
- You need to perform a side effect based on the change
- You're synchronizing with an external system

```javascript
// ✅ Appropriate: Expensive calculation
const expensiveValue = useMemo(() => {
  return processThousandsOfItems(items);
}, [items]);

// ✅ Appropriate: Side effect needed
useEffect(() => {
  if (gameState.isComplete) {
    saveScoreToLocalStorage(gameState.score);
  }
}, [gameState.isComplete, gameState.score]);
```

## State Update Patterns

### Functional Updates for State Based on Previous State

```javascript
// ❌ WRONG - Can get stale value
setScore(score + points);

// ✅ CORRECT - Always use current value
setScore(prevScore => prevScore + points);

// ❌ WRONG - Race condition with rapid clicks
setClues([...clues, newClue]);

// ✅ CORRECT - Safe with rapid updates
setClues(prevClues => [...prevClues, newClue]);
```

### Batching State Updates

React 18+ automatically batches state updates, but be aware:

```javascript
// These will be batched into one re-render in React 18+
function handleNext() {
  setCurrentLocation(nextLocation);  // ┐
  setCurrentClue(nextClue);           // ├─ Batched together
  setScore(prev => prev + 10);        // ┘
}

// Still only one re-render!
```

### Object/Array State Updates - Immutability

```javascript
// ❌ WRONG - Mutating state
gameState.locations.push(newLocation);
setGameState(gameState);

// ✅ CORRECT - Create new object
setGameState(prev => ({
  ...prev,
  locations: [...prev.locations, newLocation]
}));

// ❌ WRONG - Mutating nested object
player.inventory.items.push(newItem);
setPlayer(player);

// ✅ CORRECT - Spread all levels
setPlayer(prev => ({
  ...prev,
  inventory: {
    ...prev.inventory,
    items: [...prev.inventory.items, newItem]
  }
}));
```

## Context Best Practices

### When to Split Contexts

Split contexts to avoid unnecessary re-renders:

```javascript
// ✅ GOOD - Separate contexts by update frequency
export const GameDataContext = createContext();      // Rarely changes
export const GameStateContext = createContext();     // Changes frequently
export const AnimationContext = createContext();     // Changes very frequently

// Now components only re-render when their relevant context changes
```

### Context Value Memoization

```javascript
// ❌ WRONG - New object on every render
function GameProvider({ children }) {
  const [state, setState] = useState(initialState);

  return (
    <GameContext.Provider value={{ state, setState }}>
      {children}
    </GameContext.Provider>
  );
}

// ✅ CORRECT - Memoized value
function GameProvider({ children }) {
  const [state, setState] = useState(initialState);

  const value = useMemo(
    () => ({ state, setState }),
    [state]
  );

  return (
    <GameContext.Provider value={value}>
      {children}
    </GameContext.Provider>
  );
}
```

## State Initialization

### Lazy Initialization for Expensive Computations

```javascript
// ❌ WRONG - Runs on every render
const [locations, setLocations] = useState(loadAllLocations());

// ✅ CORRECT - Only runs once
const [locations, setLocations] = useState(() => loadAllLocations());

// ❌ WRONG - Re-parses JSON on every render
const [gameData, setGameData] = useState(JSON.parse(localStorage.getItem('game')));

// ✅ CORRECT - Lazy initialization
const [gameData, setGameData] = useState(() =>
  JSON.parse(localStorage.getItem('game'))
);
```

## Common State Anti-Patterns

### 1. State Follows Props (Usually Wrong)

```javascript
// ❌ WRONG - Syncing props to state
function ClueDisplay({ initialClue }) {
  const [clue, setClue] = useState(initialClue);

  useEffect(() => {
    setClue(initialClue); // Anti-pattern!
  }, [initialClue]);
}

// ✅ CORRECT - Just use the prop
function ClueDisplay({ clue }) {
  return <div>{clue.text}</div>;
}

// ✅ OR if you need local modifications
function ClueDisplay({ initialClue }) {
  const [clue, setClue] = useState(initialClue);
  // Don't sync back - this is a local copy
}
```

### 2. Boolean Flags That Should Be Enums

```javascript
// ❌ WRONG - Multiple booleans for states
const [isLoading, setIsLoading] = useState(false);
const [isError, setIsError] = useState(false);
const [isSuccess, setIsSuccess] = useState(false);
// These can get out of sync!

// ✅ CORRECT - Single state enum
const [status, setStatus] = useState('idle'); // 'idle' | 'loading' | 'error' | 'success'

// Even better with constants
const STATUS = {
  IDLE: 'idle',
  LOADING: 'loading',
  ERROR: 'error',
  SUCCESS: 'success'
};
const [status, setStatus] = useState(STATUS.IDLE);
```

### 3. Storing Computed Values

```javascript
// ❌ WRONG - Storing what can be computed
const [clues, setClues] = useState([]);
const [clueCount, setClueCount] = useState(0); // Unnecessary!

// ✅ CORRECT - Compute on render
const [clues, setClues] = useState([]);
const clueCount = clues.length;
```

## State Debugging

### Add Logging to Track State Changes

```javascript
// Temporary debugging wrapper
function useDebugState(initialValue, label) {
  const [value, setValue] = useState(initialValue);

  useEffect(() => {
    console.log(`[${label}] changed to:`, value);
  }, [value, label]);

  return [value, setValue];
}

// Usage
const [clue, setClue] = useDebugState(null, 'Current Clue');
```

### React DevTools

Use React DevTools to:
- Inspect current state values
- See what caused a re-render
- Track state changes over time
- Find components that re-render unnecessarily

## Red Flags - State Issues

Watch for these patterns:

- 🚩 Multiple state variables that should be one object
- 🚩 State in parent that's only used by one child
- 🚩 useEffect that just syncs one state to another
- 🚩 Storing props in state without a good reason
- 🚩 Multiple boolean flags for mutually exclusive states
- 🚩 State updates that don't use functional updates when based on previous value
- 🚩 Deeply nested state updates
