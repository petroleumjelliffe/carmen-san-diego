# Carmen San Diego: Phaser Port Planning Document

## Executive Summary

This document outlines the strategy for porting the Carmen San Diego game from React/Leaflet to Phaser 3. The goals are:
1. **Preserve existing game logic** - The 945-line `useGameState` hook and utilities should remain largely intact
2. **Improve state machine resilience** - Replace implicit state with explicit finite state machine
3. **Gain Phaser benefits** - Scene management, tween system, asset pipeline, better animations

---

## Current Architecture Analysis

### Strengths to Preserve
| Component | Location | Value |
|-----------|----------|-------|
| Game state logic | `useGameState.js` (945 lines) | Comprehensive game rules |
| Case generation | `caseGenerator.js` | Deterministic, well-tested |
| Clue system | `clueGenerator.js` | Working lookup system |
| YAML configs | `config/*.yaml` | Extensive game data |
| Save system | `saveManager.js` | LocalStorage persistence |
| Geo utilities | `geoUtils.js` | Map math, bezier curves |

### Current State Machine Issues

The current implementation uses **implicit state** via multiple variables:

```javascript
// Current: Multiple independent state flags
gameState: 'menu' | 'briefing' | 'playing' | 'trial' | 'debrief' | 'apprehended'
isTraveling: boolean
currentEncounter: object | null
currentGoodDeed: object | null
activeRogueAction: object | null
actionQueueState: 'idle' | 'pending' | 'ticking' | 'complete'
```

**Problems:**
1. States can become inconsistent (e.g., `isTraveling=true` but `gameState='menu'`)
2. No clear transitions - any code can set any state variable
3. Race conditions possible when multiple effects update state
4. Hard to debug - must inspect many variables to understand current state
5. Encounter/investigation logic is interleaved, not sequential

---

## Proposed Architecture

### 1. Explicit Finite State Machine

Replace implicit state with a proper state machine using hierarchical states:

```
                    ┌─────────────────────────────────────────────────┐
                    │                    GAME                         │
                    │  ┌──────┐  ┌─────────┐  ┌───────┐  ┌────────┐  │
                    │  │ MENU │→│BRIEFING │→│ TRIAL │→│DEBRIEF │  │
                    │  └──────┘  └────┬────┘  └───────┘  └────────┘  │
                    │                 │                               │
                    │                 ▼                               │
                    │  ┌─────────────────────────────────────────────┐│
                    │  │              PLAYING (Hierarchical)         ││
                    │  │                                             ││
                    │  │  ┌──────┐   ┌────────────┐   ┌──────────┐  ││
                    │  │  │ IDLE │ → │INVESTIGATING│ → │ REVEAL  │  ││
                    │  │  └──────┘   └────────────┘   └────┬─────┘  ││
                    │  │      ▲                            │        ││
                    │  │      │      ┌───────────┐         │        ││
                    │  │      │   ┌─→│ ENCOUNTER │←────────┤        ││
                    │  │      │   │  └─────┬─────┘         │        ││
                    │  │      │   │        │               │        ││
                    │  │      │   │  ┌─────▼─────┐         │        ││
                    │  │      │   │  │ GOOD_DEED │         │        ││
                    │  │      │   │  └─────┬─────┘         │        ││
                    │  │      │   │        │               │        ││
                    │  │      │   │  ┌─────▼─────────┐     │        ││
                    │  │      └───┴──┤ TRAVELING    │◄────┘        ││
                    │  │             └───────────────┘              ││
                    │  │                                             ││
                    │  │  ┌───────────────────────────────────────┐ ││
                    │  │  │          FINAL_CITY (substates)       │ ││
                    │  │  │  ASSASSINATION → APPREHENSION → TRIAL │ ││
                    │  │  └───────────────────────────────────────┘ ││
                    │  └─────────────────────────────────────────────┘│
                    └─────────────────────────────────────────────────┘
```

### 2. State Machine Implementation

Use a dedicated state machine library for explicit transitions:

```javascript
// Option A: XState (recommended for complex games)
import { createMachine, interpret } from 'xstate';

const gameMachine = createMachine({
  id: 'carmen',
  initial: 'menu',
  context: {
    // All game data lives in context
    currentCase: null,
    currentCityIndex: 0,
    timeRemaining: 72,
    collectedClues: { city: [], suspect: [] },
    // ... etc
  },
  states: {
    menu: {
      on: { START_NEW_CASE: 'briefing' }
    },
    briefing: {
      entry: 'generateCase',
      on: { ACCEPT_CASE: 'playing' }
    },
    playing: {
      initial: 'idle',
      states: {
        idle: {
          on: {
            INVESTIGATE: 'investigating',
            TRAVEL: 'traveling',
            ROGUE_ACTION: 'rogueAction'
          }
        },
        investigating: {
          entry: 'startInvestigationTimer',
          on: {
            TICK_COMPLETE: [
              { target: 'encounter', cond: 'hasEncounter' },
              { target: 'goodDeed', cond: 'hasGoodDeed' },
              { target: 'reveal' }
            ]
          }
        },
        reveal: {
          entry: 'revealClue',
          on: {
            CONTINUE: 'idle'
          }
        },
        encounter: {
          on: {
            GADGET_SELECTED: { target: 'idle', actions: 'resolveEncounter' },
            TIMER_EXPIRED: { target: 'idle', actions: 'penalizeNoGadget' }
          }
        },
        goodDeed: {
          on: {
            HELP: { target: 'idle', actions: 'completeGoodDeed' },
            SKIP: 'idle'
          }
        },
        traveling: {
          entry: 'startTravelAnimation',
          on: {
            TRAVEL_COMPLETE: [
              { target: 'idle', cond: 'notFinalCity' },
              { target: 'finalCity', cond: 'isFinalCity' }
            ]
          }
        },
        finalCity: {
          initial: 'investigating',
          states: {
            investigating: { /* ... */ },
            assassination: { /* ... */ },
            apprehension: { /* ... */ }
          }
        }
      },
      on: {
        TIME_EXPIRED: 'debrief'
      }
    },
    trial: {
      on: { VERDICT: 'debrief' }
    },
    debrief: {
      on: {
        NEW_CASE: 'briefing',
        RETURN_TO_MENU: 'menu'
      }
    }
  }
});

// Option B: Simple custom FSM (lighter weight)
class GameStateMachine {
  constructor() {
    this.state = 'menu';
    this.substate = null;
    this.context = {};
    this.transitions = new Map();
    this.guards = new Map();
  }

  transition(event, payload) {
    const key = `${this.state}:${event}`;
    const handler = this.transitions.get(key);
    if (!handler) {
      console.warn(`No transition for ${key}`);
      return false;
    }
    const { target, guard, actions } = handler;
    if (guard && !this.guards.get(guard)(this.context, payload)) {
      return false;
    }
    actions?.forEach(action => this.executeAction(action, payload));
    this.state = target;
    this.emit('stateChange', this.state);
    return true;
  }
}
```

### 3. Phaser Scene Structure

Map current screens to Phaser scenes:

```
src/
├── game/
│   ├── scenes/
│   │   ├── BootScene.js        # Asset loading, initialization
│   │   ├── MenuScene.js        # Main menu (from Menu.jsx)
│   │   ├── BriefingScene.js    # Case briefing (from Briefing.jsx)
│   │   ├── PlayScene.js        # Main gameplay (from Game.jsx playing state)
│   │   │   ├── ui/             # UI overlays
│   │   │   │   ├── Header.js
│   │   │   │   ├── TabBar.js
│   │   │   │   ├── InvestigatePanel.js
│   │   │   │   ├── DossierPanel.js
│   │   │   │   └── AirportPanel.js
│   │   │   └── map/            # Map rendering
│   │   │       ├── CityMap.js
│   │   │       └── TravelMap.js
│   │   ├── TrialScene.js       # Warrant verification
│   │   └── DebriefScene.js     # Results
│   │
│   ├── state/
│   │   ├── GameStateMachine.js # Explicit FSM
│   │   ├── GameContext.js      # Shared game data (from useGameState)
│   │   └── SaveManager.js      # Persistence (existing code)
│   │
│   ├── logic/                  # Preserve existing logic
│   │   ├── caseGenerator.js    # COPY from current
│   │   ├── clueGenerator.js    # COPY from current
│   │   └── helpers.js          # COPY from current
│   │
│   ├── data/                   # YAML loading
│   │   └── configLoader.js     # Load YAMLs
│   │
│   └── config.js               # Phaser config
```

---

## Migration Strategy

### Phase 1: Core Infrastructure (Foundation)

**Goal:** Set up Phaser project with state machine, no visual changes yet

1. **Create Phaser project structure**
   - Initialize Phaser 3 with Vite
   - Configure asset loading for YAML files
   - Set up scene skeleton

2. **Extract game logic from useGameState**
   - Create `GameContext` class with pure game data
   - Remove React-specific code (useState, useEffect)
   - Keep all game rules, calculations, validation

3. **Implement explicit state machine**
   - Define all states and transitions
   - Add guards for transition validation
   - Implement actions for state entry/exit

4. **Port save system**
   - Adapt `saveManager.js` for Phaser
   - Ensure backward compatibility with existing saves

### Phase 2: Scene Implementation

**Goal:** Recreate all screens as Phaser scenes

1. **BootScene**
   - Preload all assets (images, YAML configs)
   - Show loading progress
   - Initialize game context

2. **MenuScene**
   - Background animation
   - Start button
   - Load game option
   - Settings

3. **BriefingScene**
   - Case details display
   - Stolen item reveal
   - Accept button

4. **PlayScene** (most complex)
   - Tabbed interface (Home, Investigate, Airport, Dossier)
   - Header with clock, urgency bar
   - Panel switching
   - Sub-scene management for encounters/good deeds

5. **TrialScene**
   - Warrant display
   - Suspect comparison
   - Verdict animation

6. **DebriefScene**
   - Stats display
   - Rank reveal
   - Continue options

### Phase 3: Map System

**Goal:** Replace Leaflet with Phaser-based maps

**Options Analysis:**

| Approach | Pros | Cons |
|----------|------|------|
| **A. Tilemap** | Native Phaser, fast, flexible | Need to create/convert map tiles |
| **B. Static images** | Simple, quick | Less interactive |
| **C. Procedural SVG** | Resolution independent | More complex rendering |
| **D. External library** | Full map features | Integration complexity |
| **E. Hybrid (Leaflet in DOM)** | Preserve current maps | Mixing technologies |

**Recommended: Option A (Tilemap) for city maps + Option C (Procedural) for travel**

1. **City investigation map**
   - Create tilemap from OpenStreetMap exports
   - Or use stylized procedural maps
   - Place investigation spots as sprites
   - Click interaction via Phaser input

2. **Travel animation map**
   - World map as background image
   - Bezier curve path (existing geoUtils code)
   - Animated plane/vehicle sprite
   - Tween-based animation

### Phase 4: Animation System

**Goal:** Leverage Phaser tweens for all animations

1. **Time ticking animation**
   - Replace `useActionQueue` with Phaser timeline
   - Clock sprite with tween rotation
   - Urgency bar tween

2. **Travel animation**
   - Replace `useTravelAnimation` with Phaser path following
   - Use `Phaser.Curves.QuadraticBezier`
   - Path follower for vehicle

3. **UI transitions**
   - Tab slide animations
   - Panel fade in/out
   - Clue reveal effect

4. **Encounter animations**
   - Timer countdown visual
   - Gadget selection effect
   - Success/failure feedback

### Phase 5: Polish & PWA

**Goal:** Match original quality, ensure offline support

1. **PWA support**
   - Service worker for Phaser game
   - Asset caching strategy
   - Offline play capability

2. **Responsive design**
   - Scale mode configuration
   - Mobile touch controls
   - Landscape/portrait handling

3. **Accessibility**
   - Keyboard navigation
   - Screen reader announcements (where possible)
   - Color contrast

---

## State Machine Deep Dive

### Current Pain Points & Solutions

#### Problem 1: Encounter/Investigation Race Conditions

**Current code:**
```javascript
// useGameState.js - multiple effects can conflict
useEffect(() => {
  if (lastFoundClue && !currentEncounter) {
    maybeStartGoodDeed();
  }
}, [lastFoundClue]);

useEffect(() => {
  if (currentEncounter) {
    // handle encounter
  }
}, [currentEncounter]);
```

**Solution: Sequential state machine**
```javascript
// Only one active state at a time
states: {
  investigating: {
    entry: 'startTimer',
    on: {
      COMPLETE: [
        { target: 'encounter', cond: 'hasEncounter' },
        { target: 'goodDeed', cond: 'shouldTriggerGoodDeed' },
        { target: 'clueReveal' }
      ]
    }
  },
  encounter: {
    on: { RESOLVED: 'clueReveal' }
  },
  goodDeed: {
    on: { RESOLVED: 'clueReveal' }
  },
  clueReveal: {
    on: { CONTINUE: 'idle' }
  }
}
```

#### Problem 2: Time Updates During Actions

**Current code:**
```javascript
// Action queue manages ticking independently
const [actionQueueState, setActionQueueState] = useState('idle');
// Can conflict with encounter timers
```

**Solution: Unified time controller**
```javascript
class TimeController {
  constructor(stateMachine) {
    this.sm = stateMachine;
  }

  async tickHours(count, onTick) {
    // Block state transitions during ticking
    this.sm.lock();
    for (let i = 0; i < count; i++) {
      await this.animateTick();
      onTick();
    }
    this.sm.unlock();
    this.sm.send('TICK_COMPLETE');
  }
}
```

#### Problem 3: Wrong City State Overlap

**Current code:**
```javascript
// wrongCity boolean exists alongside normal gameplay
if (wrongCity) {
  // Show dead-end clues
} else {
  // Normal clues
}
```

**Solution: Wrong city as explicit substate**
```javascript
playing: {
  states: {
    normalCity: {
      // Normal investigation flow
    },
    wrongCity: {
      // Dead-end investigation flow
      // Must find correct destination to leave
      on: {
        FOUND_CORRECT_CITY: 'traveling'
      }
    }
  }
}
```

### State Context Structure

```javascript
const gameContext = {
  // === CASE DATA (generated once per case) ===
  currentCase: {
    id: 'case_123',
    cities: ['paris', 'tokyo', 'rio', 'cairo'],
    suspect: { id: 'viktor', name: 'Viktor', gender: 'male', hair: 'dark', hobby: 'intellectual' },
    stolenItem: { name: 'Ancient Artifact' },
    gadgets: ['lockpick', 'disguise', 'tracker'],
    cityData: [ /* pre-generated city details */ ]
  },

  // === PROGRESS (changes during gameplay) ===
  progress: {
    currentCityIndex: 0,
    investigatedLocations: [],
    collectedClues: { city: [], suspect: [] },
    usedGadgets: [],
    selectedTraits: { gender: null, hair: null, hobby: null },
    selectedWarrant: null,
    hadEncounterInCity: false,
    hadGoodDeedInCase: false,
    rogueUsedInCity: false
  },

  // === TIME (tick-based) ===
  time: {
    remaining: 72,
    currentHour: 9 // 9am
  },

  // === PERSISTENT PROFILE ===
  profile: {
    karma: 5,
    notoriety: 2,
    solvedCases: 3,
    savedNPCs: [],
    permanentInjuries: []
  },

  // === VOLATILE (current action only) ===
  volatile: {
    pendingInvestigation: null,
    activeEncounter: null,
    activeGoodDeed: null,
    travelDestination: null
  }
};
```

### Transition Validation

```javascript
const transitionGuards = {
  canInvestigate: (ctx) => {
    return ctx.time.remaining > 0 &&
           ctx.progress.investigatedLocations.length < 3;
  },

  canTravel: (ctx) => {
    return ctx.time.remaining >= 4 && // travel cost
           ctx.progress.investigatedLocations.length > 0; // must have clue
  },

  canIssueWarrant: (ctx) => {
    const { gender, hair, hobby } = ctx.progress.selectedTraits;
    return gender && hair && hobby;
  },

  hasEncounter: (ctx) => {
    return ctx.currentCase.cityData[ctx.progress.currentCityIndex].encounter &&
           !ctx.progress.hadEncounterInCity;
  },

  shouldTriggerGoodDeed: (ctx) => {
    return !ctx.progress.hadGoodDeedInCase &&
           Math.random() < 0.25; // 25% chance
  },

  isFinalCity: (ctx) => {
    return ctx.progress.currentCityIndex === ctx.currentCase.cities.length - 1;
  }
};
```

---

## Code Preservation Strategy

### Files to Copy Directly (with minimal changes)

| File | Changes Needed |
|------|----------------|
| `caseGenerator.js` | None - pure functions |
| `clueGenerator.js` | None - pure functions |
| `helpers.js` | None - pure functions |
| `geoUtils.js` | None - pure functions |
| `validation.js` | None - pure functions |
| `saveManager.js` | Minor - remove React deps |

### Files to Adapt

| File | Adaptation |
|------|------------|
| `useGameState.js` | Extract to GameContext class |
| `useActionQueue.js` | Replace with Phaser timeline |
| `useTravelAnimation.js` | Replace with Phaser tweens |
| `loadGameData.js` | Adapt for Phaser preloader |

### Files to Rewrite

| File | Reason |
|------|--------|
| All React components | Phaser scenes/UI |
| Leaflet map components | Phaser maps |
| CSS/Tailwind | Phaser graphics |

---

## Risk Analysis

### High Risk Items

1. **Map replacement complexity**
   - Leaflet provides rich features
   - May need significant effort to match
   - Consider hybrid approach initially

2. **UI recreation effort**
   - Current UI is polished
   - Phaser UI requires more manual work
   - Consider Phaser UI plugins (rexUI, etc.)

3. **Mobile touch handling**
   - React-leaflet handles touch well
   - Phaser needs explicit touch zones
   - Test extensively on devices

### Medium Risk Items

1. **State machine complexity**
   - XState has learning curve
   - Custom FSM needs thorough testing
   - Start simple, add complexity

2. **Save compatibility**
   - May need migration layer
   - Version save format carefully

3. **Performance on mobile**
   - Phaser canvas vs React DOM
   - Optimize asset sizes
   - Profile early and often

### Low Risk Items

1. **Game logic preservation**
   - Pure functions port easily
   - Keep test coverage high

2. **YAML config system**
   - Works with any loader
   - Already well-structured

---

## Alternative Approaches

### Option A: Full Phaser Port (Recommended)
- Complete rewrite of UI layer
- Best long-term performance
- Most work upfront

### Option B: Hybrid Approach
- Keep React for UI
- Use Phaser for map/animations only
- Faster initial progress
- Complexity in integration

### Option C: Incremental Port
- Replace pieces one at a time
- Start with travel animation
- Then city map
- Then full game
- Longest timeline, lowest risk

### Option D: Phaser + DOM UI
- Phaser for game graphics
- HTML/CSS for UI overlays
- Familiar web patterns
- Some performance trade-offs

---

## Recommended Implementation Order

```
Week 1-2: Foundation
├── Phaser project setup
├── State machine implementation
├── Game context extraction
└── Boot/Menu scenes

Week 3-4: Core Gameplay
├── PlayScene skeleton
├── Tab system
├── Investigation flow
└── State machine integration

Week 5-6: Maps & Animation
├── City map implementation
├── Travel animation
├── Time ticking system
└── Encounter system

Week 7-8: Polish
├── All scenes complete
├── Responsive design
├── PWA support
└── Testing & fixes
```

---

## Questions to Resolve

1. **State machine library**: XState vs custom implementation?
2. **Map approach**: Tilemap vs procedural vs hybrid?
3. **UI framework**: Pure Phaser vs plugin (rexUI) vs DOM overlay?
4. **Asset strategy**: Keep existing images or redesign?
5. **Responsive approach**: Scale mode or multiple layouts?

---

## Next Steps

1. Review and approve this plan
2. Set up Phaser project with Vite
3. Create state machine proof-of-concept
4. Extract game logic to `GameContext`
5. Build BootScene and MenuScene
6. Iterate through phases

---

*Document created: January 2026*
*Last updated: [Current session]*
