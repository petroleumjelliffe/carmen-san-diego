---
paths: src/**/*.{js,jsx}
---

# Animation and Text Streaming Rules

These rules specifically address the word-by-word text streaming race conditions experienced with witness clues.

## Core Principle: One Animation Controller

**Each animation must have exactly ONE controlling effect.**

Multiple effects attempting to control the same animation = guaranteed race conditions.

## Text Streaming Pattern (The Safe Way)

### Custom Hook for Word-by-Word Streaming

```javascript
/**
 * Safely streams text word-by-word
 * @param {string} text - Full text to display
 * @param {number} wordsPerSecond - Streaming speed
 * @returns {string} Currently displayed text
 */
function useStreamedText(text, wordsPerSecond = 3) {
  const [displayedText, setDisplayedText] = useState('');
  const animationRef = useRef({ timeoutId: null, currentIndex: 0 });

  useEffect(() => {
    // Clear any existing animation
    if (animationRef.current.timeoutId) {
      clearTimeout(animationRef.current.timeoutId);
    }

    // Reset state for new text
    setDisplayedText('');
    animationRef.current.currentIndex = 0;

    if (!text) return;

    const words = text.split(' ');
    const delay = 1000 / wordsPerSecond;

    function displayNextWord() {
      const index = animationRef.current.currentIndex;

      if (index < words.length) {
        setDisplayedText(prev =>
          prev + (index > 0 ? ' ' : '') + words[index]
        );

        animationRef.current.currentIndex++;
        animationRef.current.timeoutId = setTimeout(displayNextWord, delay);
      } else {
        animationRef.current.timeoutId = null;
      }
    }

    displayNextWord();

    // Critical cleanup
    return () => {
      if (animationRef.current.timeoutId) {
        clearTimeout(animationRef.current.timeoutId);
        animationRef.current.timeoutId = null;
      }
    };
  }, [text, wordsPerSecond]);

  return displayedText;
}
```

### Usage

```javascript
function WitnessClue({ clueText }) {
  const displayedText = useStreamedText(clueText, 4); // 4 words per second

  return <p className="clue-text">{displayedText}</p>;
}
```

## Controlling Animation State

### Pattern for Animations with Multiple Triggers

When animation needs to respond to multiple state changes, consolidate into ONE effect:

```javascript
function CluePanel({ clue, shouldReveal, isComplete }) {
  const [displayState, setDisplayState] = useState('hidden');
  const [streamedText, setStreamedText] = useState('');
  const animationRef = useRef(null);

  // ONE effect manages all animation logic
  useEffect(() => {
    // Cleanup any ongoing animation
    if (animationRef.current) {
      clearTimeout(animationRef.current);
      animationRef.current = null;
    }

    // Determine what to do based on ALL relevant state
    if (isComplete) {
      // Show everything immediately
      setDisplayState('complete');
      setStreamedText(clue.fullText);
      return;
    }

    if (!shouldReveal) {
      // Hide clue
      setDisplayState('hidden');
      setStreamedText('');
      return;
    }

    // Stream the clue
    setDisplayState('streaming');
    const cleanup = startStreaming(clue.text, setStreamedText);

    return () => cleanup();
  }, [clue, shouldReveal, isComplete]);

  return (
    <div className={displayState}>
      {streamedText}
    </div>
  );
}
```

## Preventing Race Conditions Checklist

Before implementing any animation:

- [ ] Is there exactly ONE useEffect controlling this animation?
- [ ] Does the effect clean up timeouts/intervals on unmount?
- [ ] Does the effect clean up when dependencies change?
- [ ] Are animation counters/IDs stored in refs (not state)?
- [ ] Are state updates using functional form when based on previous value?
- [ ] Will rapid prop changes cause issues? (If yes, add cleanup/cancellation)

## Common Animation Patterns

### 1. Typewriter Effect (Character-by-Character)

```javascript
function useTypewriter(text, charsPerSecond = 20) {
  const [displayedText, setDisplayedText] = useState('');
  const timeoutRef = useRef(null);

  useEffect(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    setDisplayedText('');
    if (!text) return;

    let index = 0;
    const delay = 1000 / charsPerSecond;

    function typeNextChar() {
      if (index < text.length) {
        setDisplayedText(text.slice(0, index + 1));
        index++;
        timeoutRef.current = setTimeout(typeNextChar, delay);
      }
    }

    typeNextChar();

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [text, charsPerSecond]);

  return displayedText;
}
```

### 2. Fade In/Out Animation

```javascript
function useFadeAnimation(isVisible, duration = 300) {
  const [shouldRender, setShouldRender] = useState(isVisible);
  const [fadeState, setFadeState] = useState('hidden');
  const timeoutRef = useRef(null);

  useEffect(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    if (isVisible) {
      setShouldRender(true);
      // Need to wait a tick for DOM to render before fading in
      timeoutRef.current = setTimeout(() => {
        setFadeState('visible');
      }, 10);
    } else {
      setFadeState('hidden');
      // Wait for fade out animation before removing from DOM
      timeoutRef.current = setTimeout(() => {
        setShouldRender(false);
      }, duration);
    }

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [isVisible, duration]);

  return { shouldRender, opacity: fadeState === 'visible' ? 1 : 0 };
}
```

### 3. Sequence of Animations

```javascript
function useAnimationSequence(trigger, steps) {
  const [currentStep, setCurrentStep] = useState(0);
  const timeoutRef = useRef(null);

  useEffect(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    if (!trigger) {
      setCurrentStep(0);
      return;
    }

    function runNextStep() {
      if (currentStep < steps.length) {
        const step = steps[currentStep];
        step.action();

        timeoutRef.current = setTimeout(() => {
          setCurrentStep(prev => prev + 1);
        }, step.duration);
      }
    }

    runNextStep();

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [trigger, currentStep, steps]);

  return currentStep;
}
```

## Map Animations

### Coordinating Map Movement with Text Display

```javascript
function GameController({ targetLocation, clue }) {
  const mapRef = useRef(null);
  const [animationPhase, setAnimationPhase] = useState('idle');

  useEffect(() => {
    if (!mapRef.current || !targetLocation) return;

    const map = mapRef.current;

    // Start map animation
    setAnimationPhase('flying');
    map.stop(); // Cancel any ongoing animation

    map.flyTo(targetLocation, zoom, {
      duration: 2
    });

    function handleArrival() {
      setAnimationPhase('arrived');
    }

    map.once('moveend', handleArrival);

    return () => {
      map.off('moveend', handleArrival);
      map.stop();
    };
  }, [targetLocation]);

  // Separate effect for clue display based on arrival
  useEffect(() => {
    if (animationPhase === 'arrived') {
      // Now show the clue
      setAnimationPhase('showingClue');
    }
  }, [animationPhase]);

  return (
    <div>
      <Map ref={mapRef} />
      {animationPhase === 'showingClue' && (
        <ClueDisplay clue={clue} />
      )}
    </div>
  );
}
```

## Skip/Fast-Forward Animations

Always provide a way to skip or fast-forward animations:

```javascript
function useSkippableStream(text, speed = 3) {
  const [displayedText, setDisplayedText] = useState('');
  const [isComplete, setIsComplete] = useState(false);
  const animationRef = useRef({ timeoutId: null, currentIndex: 0 });

  const skip = useCallback(() => {
    if (animationRef.current.timeoutId) {
      clearTimeout(animationRef.current.timeoutId);
      animationRef.current.timeoutId = null;
    }
    setDisplayedText(text);
    setIsComplete(true);
  }, [text]);

  useEffect(() => {
    // ... streaming logic ...

    function displayNextWord() {
      // ... display logic ...

      if (index >= words.length) {
        setIsComplete(true);
      }
    }

    // ... rest of implementation ...
  }, [text, speed]);

  return { displayedText, isComplete, skip };
}

// Usage
function CluePanel({ clue }) {
  const { displayedText, skip } = useSkippableStream(clue.text);

  return (
    <div>
      <p>{displayedText}</p>
      <button onClick={skip}>Skip</button>
    </div>
  );
}
```

## Testing Animations

### Using Fake Timers

```javascript
import { render, screen } from '@testing-library/react';
import { act } from 'react-dom/test-utils';

test('streams text word by word', () => {
  jest.useFakeTimers();

  render(<StreamedText text="Hello world test" wordsPerSecond={2} />);

  // Initially empty
  expect(screen.getByTestId('text')).toHaveTextContent('');

  // After 500ms, first word
  act(() => {
    jest.advanceTimersByTime(500);
  });
  expect(screen.getByTestId('text')).toHaveTextContent('Hello');

  // After another 500ms, second word
  act(() => {
    jest.advanceTimersByTime(500);
  });
  expect(screen.getByTestId('text')).toHaveTextContent('Hello world');

  jest.useRealTimers();
});

test('cleans up timeout on unmount', () => {
  jest.useFakeTimers();

  const { unmount } = render(<StreamedText text="Hello" wordsPerSecond={1} />);

  // Unmount before animation completes
  unmount();

  // Advance timers - should not cause any warnings
  act(() => {
    jest.advanceTimersByTime(10000);
  });

  jest.useRealTimers();
});
```

## Red Flags - Animation Issues

- 🚩 Multiple useEffect hooks that start/stop the same animation
- 🚩 setTimeout/setInterval without cleanup in return statement
- 🚩 Animation index/counter stored in useState (should be useRef)
- 🚩 No way to cancel ongoing animation when props change
- 🚩 Assuming previous animation is done (always clean up first!)
- 🚩 State updates in animation loop not using functional form
- 🚩 No skip/fast-forward option for text streaming

## Performance Considerations

### Use requestAnimationFrame for Visual Animations

For smooth visual changes (positions, transforms, etc.):

```javascript
// ✅ Better for visual animations
function useVisualAnimation() {
  const frameRef = useRef(null);

  useEffect(() => {
    function animate() {
      // Update visual state
      frameRef.current = requestAnimationFrame(animate);
    }

    frameRef.current = requestAnimationFrame(animate);

    return () => {
      if (frameRef.current) {
        cancelAnimationFrame(frameRef.current);
      }
    };
  }, []);
}
```

### Use CSS Animations When Possible

For simple animations, prefer CSS over JavaScript:

```javascript
// ✅ CSS animation - more performant
<div className="fade-in">Content</div>

// CSS
.fade-in {
  animation: fadeIn 0.3s ease-in;
}

// ❌ JavaScript animation - less performant
useEffect(() => {
  let opacity = 0;
  const interval = setInterval(() => {
    opacity += 0.1;
    element.style.opacity = opacity;
    if (opacity >= 1) clearInterval(interval);
  }, 30);
}, []);
```
