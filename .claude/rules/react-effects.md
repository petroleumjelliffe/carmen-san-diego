# React Effects and Side Effects Rules

## Critical: Avoid Multiple Effects Updating Same State

**NEVER have multiple useEffect hooks that update the same piece of state.**

### ❌ WRONG - Multiple Effects on Same State
```javascript
// BAD: Two effects both updating displayText
useEffect(() => {
  setDisplayText(streamWords(clue));
}, [clue]);

useEffect(() => {
  if (isComplete) {
    setDisplayText(fullText);
  }
}, [isComplete]);
```

### ✅ CORRECT - Single Effect with Unified Logic
```javascript
// GOOD: One effect manages displayText
useEffect(() => {
  if (isComplete) {
    setDisplayText(fullText);
    return;
  }

  const cleanup = streamWords(clue, setDisplayText);
  return cleanup;
}, [clue, isComplete, fullText]);
```

## Streaming Text / Word-by-Word Display

### Pattern for Safe Text Streaming
```javascript
function useStreamedText(text, wordsPerSecond = 3) {
  const [displayedText, setDisplayedText] = useState('');
  const timeoutRef = useRef(null);

  useEffect(() => {
    // Reset on new text
    setDisplayedText('');

    const words = text.split(' ');
    let currentIndex = 0;

    function streamNextWord() {
      if (currentIndex < words.length) {
        setDisplayedText(prev =>
          prev + (currentIndex > 0 ? ' ' : '') + words[currentIndex]
        );
        currentIndex++;
        timeoutRef.current = setTimeout(
          streamNextWord,
          1000 / wordsPerSecond
        );
      }
    }

    streamNextWord();

    // CRITICAL: Cleanup timeout
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [text, wordsPerSecond]);

  return displayedText;
}
```

### Key Principles for Streaming
1. **One effect per animation** - Never split streaming logic across multiple effects
2. **Always cleanup timeouts/intervals** - Return cleanup function
3. **Use refs for timeout IDs** - Don't store in state
4. **Reset state at start of effect** - Clear old content when input changes
5. **Index tracking in closure** - Use local variables, not state for counters

## Effect Cleanup Rules

### Always Cleanup These Side Effects
- ✅ `setTimeout` / `setInterval` → `clearTimeout` / `clearInterval`
- ✅ Event listeners → `removeEventListener`
- ✅ Subscriptions → `unsubscribe()`
- ✅ Async operations → boolean flag or AbortController
- ✅ Animation frames → `cancelAnimationFrame`
- ✅ Observers → `disconnect()`

### Cleanup Pattern for Async Operations
```javascript
useEffect(() => {
  let isCancelled = false;

  async function fetchData() {
    const result = await api.getData();
    if (!isCancelled) {
      setState(result);
    }
  }

  fetchData();

  return () => {
    isCancelled = true;
  };
}, []);
```

## State vs. Refs Decision Tree

**Use `useState` when:**
- Value affects what renders on screen
- Changes should trigger re-render
- Component needs to react to changes

**Use `useRef` when:**
- Storing mutable values that don't affect render (timeout IDs, previous values)
- Need value to persist across renders without causing re-render
- Tracking DOM elements
- Storing latest callback without re-running effects

### Example: Animation State
```javascript
// ❌ WRONG - timeout ID doesn't need to cause re-renders
const [timeoutId, setTimeoutId] = useState(null);

// ✅ CORRECT - use ref for timeout ID
const timeoutRef = useRef(null);

// ❌ WRONG - display text DOES need to cause re-renders
const displayTextRef = useRef('');

// ✅ CORRECT - use state for rendered values
const [displayText, setDisplayText] = useState('');
```

## Dependency Array Rules

### Include ALL Dependencies
```javascript
// ❌ WRONG - missing 'onComplete' dependency
useEffect(() => {
  if (count > 10) {
    onComplete();
  }
}, [count]); // ESLint warning!

// ✅ CORRECT - all dependencies included
useEffect(() => {
  if (count > 10) {
    onComplete();
  }
}, [count, onComplete]);
```

### When to Use useCallback for Dependencies
```javascript
// Parent component
function Parent() {
  // ✅ Wrap in useCallback if passed to child's effect
  const handleComplete = useCallback(() => {
    console.log('Complete!');
  }, []);

  return <Child onComplete={handleComplete} />;
}

// Child component
function Child({ onComplete }) {
  useEffect(() => {
    // onComplete won't change on every render
    doSomething(onComplete);
  }, [onComplete]);
}
```

## Common Race Condition Patterns to Avoid

### 1. Competing Animation Effects
```javascript
// ❌ WRONG
useEffect(() => {
  animateIn();
}, [show]);

useEffect(() => {
  animateOut();
}, [show]);

// ✅ CORRECT - single effect handles both
useEffect(() => {
  if (show) {
    return animateIn();
  } else {
    return animateOut();
  }
}, [show]);
```

### 2. State Updates from Stale Closures
```javascript
// ❌ WRONG - count is stale in timeout
const [count, setCount] = useState(0);
useEffect(() => {
  setTimeout(() => {
    setCount(count + 1); // Uses old count value!
  }, 1000);
}, []);

// ✅ CORRECT - use functional update
useEffect(() => {
  const id = setTimeout(() => {
    setCount(prev => prev + 1);
  }, 1000);
  return () => clearTimeout(id);
}, []);
```

### 3. Rapid State Changes
```javascript
// ❌ WRONG - if text changes rapidly, race conditions!
useEffect(() => {
  fetchRelatedData(text);
}, [text]);

// ✅ CORRECT - debounce or cancel previous
useEffect(() => {
  const controller = new AbortController();

  async function fetch() {
    try {
      const data = await fetchRelatedData(text, {
        signal: controller.signal
      });
      setData(data);
    } catch (err) {
      if (err.name !== 'AbortError') {
        throw err;
      }
    }
  }

  fetch();

  return () => controller.abort();
}, [text]);
```

## Map Animation Specific Rules

When animating map movements (flyTo, etc.):

1. **One animation manager** - Single effect controls map state
2. **Cancel previous animations** - Store map instance in ref, call `stop()` before new animation
3. **Don't update state during animation** - Use map events (`moveend`) to update state
4. **Coordinate with clue display** - Use animation callbacks, not separate effects

```javascript
// ✅ Good map animation pattern
useEffect(() => {
  if (!mapRef.current || !targetLocation) return;

  const map = mapRef.current;

  // Cancel any ongoing animation
  map.stop();

  // Start new animation
  map.flyTo(targetLocation, zoom, {
    duration: 2,
    easeLinearity: 0.5
  });

  // Update state when animation completes
  function handleMoveEnd() {
    setIsAnimating(false);
  }

  map.once('moveend', handleMoveEnd);

  return () => {
    map.off('moveend', handleMoveEnd);
    map.stop();
  };
}, [targetLocation, zoom]);
```

## Debugging Race Conditions

When debugging race conditions:

1. **Add console.logs with timestamps**
   ```javascript
   console.log(`[${Date.now()}] Effect running:`, dependencies);
   ```

2. **Log cleanup executions**
   ```javascript
   return () => {
     console.log(`[${Date.now()}] Cleanup running`);
     cleanup();
   };
   ```

3. **Check for multiple effects on same state** - Search codebase for `setState` calls

4. **Use React DevTools Profiler** - Identify unnecessary re-renders

5. **Add effect labels** (in development)
   ```javascript
   useEffect(() => {
     // ... effect logic
   }, [deps]); // Label: "Stream witness text"
   ```

## Red Flags - Immediate Review Required

If you see any of these patterns, stop and refactor:

- 🚩 Two or more `useEffect` hooks that call the same `setState`
- 🚩 `setTimeout` or `setInterval` without cleanup
- 🚩 State update inside a timeout using the state variable directly (not functional update)
- 🚩 Empty dependency array with state/props used inside
- 🚩 Multiple animation effects on the same element
- 🚩 Async operations without cancellation mechanism

## Testing Effects

When testing components with effects:

- Use `@testing-library/react` and `waitFor`
- Test cleanup by unmounting component
- Use fake timers: `jest.useFakeTimers()`
- Verify no state updates after unmount
