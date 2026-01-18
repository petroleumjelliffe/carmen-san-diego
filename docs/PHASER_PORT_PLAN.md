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

> **Reference:** See `docs/game-states.md` for the complete state machine specification.
> This section summarizes the key architectural decisions.

### 1. Explicit Finite State Machine

Replace implicit state with a proper state machine using hierarchical states.

**Primary States (Game Flow):**
```
menu → briefing → playing → apprehended → trial → debrief → menu
                     ↓
                  debrief (time out)
```

**Activity States (within `playing`):**
```
idle ←───────────────────────────────────────────────────────────┐
  │                                                              │
  │ (on entry: checkingIdle → if 11pm-7am → sleeping)            │
  │                                                              │
  ├──► traveling ──► [idle check] ───────────────────────────────┤
  │                                                              │
  ├──► investigating ──┬──► encounter ──► witnessClue ──► [idle] │
  │                    │                                         │
  │                    └──► witnessClue ──► [idle] ──────────────┤
  │                                                              │
  └──► sleeping ──► idle ────────────────────────────────────────┘
```

**Key Design Decisions:**
- `checkingIdle` intermediate state handles sleep/timeout checks cleanly
- `witnessClue` is a distinct state with variants (normal vs rogue)
- Encounter queue allows stacking (rogue action can stack with henchman/assassination)
- `wrongCity` is a context flag, not a substate

### 2. State Machine Implementation (XState)

```javascript
import { createMachine, interpret } from 'xstate';

const gameMachine = createMachine({
  id: 'carmen',
  initial: 'menu',
  context: {
    // See GameContext interface in game-states.md for full structure
    currentCase: null,
    cityIndex: 0,
    timeRemaining: 72,
    currentHour: 9,
    wrongCity: false,
    encounterQueue: [],        // Enables encounter stacking
    witnessClueVariant: null,  // 'normal' | 'rogue'
    // ... etc
  },
  states: {
    menu: {
      on: {
        START_CASE: { target: 'briefing', actions: 'generateCase' },
        LOAD_SAVE: { target: 'playing', actions: 'loadSavedContext' }
      }
    },
    briefing: {
      on: { ACCEPT_BRIEFING: 'playing' }
    },
    playing: {
      initial: 'checkingIdle',
      states: {
        checkingIdle: {
          always: [
            { target: 'sleeping', cond: 'shouldSleep' },
            { target: 'idle' }
          ]
        },
        idle: {
          on: {
            INVESTIGATE: 'investigating',
            TRAVEL: 'traveling'
          }
        },
        investigating: {
          entry: 'buildEncounterQueue',  // Determine what encounters happen
          always: [
            { target: 'encounter', cond: 'hasQueuedEncounter' },
            { target: 'witnessClue' }
          ]
        },
        encounter: {
          initial: 'presenting',
          states: {
            presenting: {
              on: {
                CHOOSE_GADGET: 'resolving',
                CHOOSE_ENDURE: 'resolving',
                HELP_NPC: 'resolving',
                IGNORE_NPC: 'resolving'
              }
            },
            resolving: {
              entry: 'resolveEncounter',
              always: [
                { target: '#carmen.playing.encounter.presenting', cond: 'hasMoreEncounters' },
                { target: '#carmen.playing.witnessClue' }
              ]
            }
          }
        },
        witnessClue: {
          entry: 'revealClue',
          on: {
            CONTINUE: 'checkingIdle'
          }
        },
        traveling: {
          entry: 'startTravelAnimation',
          on: {
            ARRIVE: {
              target: 'checkingIdle',
              actions: ['updateLocation', 'advanceTime']
            }
          }
        },
        sleeping: {
          entry: 'advanceTimeToMorning',
          on: {
            WAKE: 'idle'
          }
        }
      },
      on: {
        // Global transitions from any playing substate
        TIME_EXPIRED: {
          target: 'debrief',
          actions: 'setTimeoutOutcome'
        }
      }
    },
    apprehended: {
      on: { PROCEED_TO_TRIAL: 'trial' }
    },
    trial: {
      on: { COMPLETE_TRIAL: 'debrief' }
    },
    debrief: {
      on: {
        RETURN_TO_MENU: 'menu'
      }
    }
  }
});
```

### 3. Encounter Queue System

Encounters can stack. The queue is built when investigation starts:

```javascript
// Encounter eligibility logic (see game-states.md for full rules)
function buildEncounterQueue(context) {
  const queue = [];
  const { cityIndex, spotsUsedInCity, wrongCity, hadEncounterInCity } = context;
  const isFirstInvestigation = spotsUsedInCity === 0;
  const isFinalCity = cityIndex === context.currentCase.cities.length - 1;

  // Mandatory encounters (first investigation only)
  if (isFirstInvestigation && !wrongCity) {
    if (isFinalCity && !hadEncounterInCity) {
      queue.push('assassination');
    } else if (cityIndex > 0 && !hadEncounterInCity) {
      queue.push('henchman');
    }
  }

  // Check for apprehension (final city, assassination done)
  if (isFinalCity && hadEncounterInCity) {
    queue.push('apprehension');  // Triggers state change to apprehended
    return queue;
  }

  // Rogue action (if player selected, not used in city)
  if (context.pendingRogueAction && !context.rogueUsedInCity) {
    queue.push('rogueAction');
  }

  // Good deed (2nd+ investigation, not in wrong city, dice roll)
  if (!isFirstInvestigation && !wrongCity && !context.hadGoodDeedInCase) {
    if (context.goodDeedRoll < 0.25) {
      queue.push('goodDeed');
    }
  }

  return queue;
}
```

### 4. The Final City Bug Fix

**Problem:** Player could exhaust investigation spots without triggering apprehension.

**Solution:** When `isFinalCity && hadEncounterInCity`:
- If spots remain → next investigation triggers apprehension
- If NO spots remain → auto-transition to apprehension

This is handled in `checkingIdle`:
```javascript
checkingIdle: {
  always: [
    { target: '#carmen.apprehended', cond: 'shouldAutoApprehend' },
    { target: 'sleeping', cond: 'shouldSleep' },
    { target: 'idle' }
  ]
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

> **Full specification:** See `docs/game-states.md` for complete details including
> TypeScript types, all guards, and edge case handling.

### Key Improvements Over Current Implementation

| Problem | Current Code | New Solution |
|---------|-------------|--------------|
| Race conditions | Multiple `useEffect` hooks updating same state | Single state machine, one transition at a time |
| Time conflicts | Action queue + encounter timers can conflict | Centralized `advanceTime` action, state machine blocks during ticking |
| Wrong city overlap | Boolean flag alongside normal gameplay | Context flag checked in guards, affects clue content only |
| Final city bug | Could exhaust spots without apprehension | `shouldAutoApprehend` guard in `checkingIdle` |
| Encounter stacking | Not supported | `encounterQueue` array, processed sequentially |

### State Context Structure

```typescript
interface GameContext {
  // === Persistent (across cases) ===
  karma: number;
  notoriety: number;
  solvedCases: string[];

  // === Case data ===
  currentCase: CaseData | null;

  // === Time ===
  currentHour: number;           // 0-23
  timeRemaining: number;         // Hours left in case

  // === Location ===
  cityIndex: number;
  currentCityId: string | null;
  wrongCity: boolean;
  originCityId: string | null;   // For wrong city return

  // === Investigation ===
  investigatedSpots: string[];   // Format: "cityId:spotIndex"
  spotsUsedInCity: number;

  // === Progress flags ===
  hadEncounterInCity: boolean;
  hadGoodDeedInCase: boolean;
  rogueUsedInCity: boolean;
  warrantIssued: boolean;
  selectedWarrant: Suspect | null;

  // === Gadgets & Health ===
  availableGadgets: Gadget[];
  usedGadgets: Gadget[];
  wounds: number;

  // === Activity state data (transient) ===
  encounterType: EncounterType;
  encounterQueue: EncounterType[];
  witnessClueVariant: 'normal' | 'rogue' | null;
  pendingRogueAction: boolean;
  travelHours: number | null;
  goodDeedRoll: number | null;   // Pre-rolled for determinism
}
```

### Travel Time Calculation

Travel time is proportional to distance (from `game-states.md`):

```javascript
function getTravelHours(fromCity, toCity) {
  const distanceKm = haversineDistance(
    fromCity.lat, fromCity.lng,
    toCity.lat, toCity.lng
  );
  // ~800 km/h average (accounts for airports, connections)
  const hours = Math.round(distanceKm / 800);
  return Math.max(2, Math.min(16, hours));  // 2-16 hour range
}
```

| Route | Distance | Hours |
|-------|----------|-------|
| Paris → London | ~340 km | 2 hours |
| New York → Chicago | ~1,150 km | 2 hours |
| Tokyo → Sydney | ~7,800 km | 10 hours |
| London → Tokyo | ~9,500 km | 12 hours |

### Save Points

Game saves automatically at these moments:
- On transition to `idle` (after investigation, travel, encounter)
- Major state changes: `briefing→playing`, `playing→apprehended`, etc.

**What gets saved:** All context except transient activity data (`encounterQueue`, `travelHours`, etc.)

**Load behavior:** Always resumes in `idle` state - never mid-encounter or mid-animation.

### Debrief Outcomes

All game endings flow through `debrief` with one of four outcomes:

| Outcome | Trigger | Message |
|---------|---------|---------|
| `time_out` | `timeRemaining <= 0` | "The suspect escaped. Case unsolved." |
| `no_warrant` | Trial with no warrant | "No warrant to present. Case dismissed." |
| `wrong_warrant` | Trial with wrong suspect | "Wrong person arrested. Real culprit escapes." |
| `success` | Trial with correct warrant | "Case solved! [Suspect] convicted." |

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

### Phase 1: Foundation
- Phaser project setup with Vite
- State machine implementation (XState)
- Game context extraction from `useGameState.js`
- Boot/Menu scenes

### Phase 2: Core Gameplay
- PlayScene skeleton
- Tab system
- Investigation flow
- State machine integration

### Phase 3: Maps & Animation
- City map implementation
- Travel animation
- Time ticking system
- Encounter system

### Phase 4: Polish
- All scenes complete
- Responsive design
- PWA support
- Testing & fixes

---

## Decisions Made

1. **State machine library**: ✅ XState (see `docs/game-states.md`)
2. **Map approach**: TBD - Tilemap vs procedural vs hybrid
3. **UI framework**: TBD - Pure Phaser vs plugin (rexUI) vs DOM overlay
4. **Asset strategy**: TBD - Keep existing images or redesign
5. **Responsive approach**: TBD - Scale mode or multiple layouts

---

## Next Steps

1. Copy `game-states.md` to this branch
2. Set up Phaser project with Vite
3. Implement XState machine per `game-states.md` spec
4. Extract game logic to `GameContext`
5. Build BootScene and MenuScene
6. Iterate through phases

---

## Related Documents

- `docs/game-states.md` - Complete state machine specification (in `feature/state-machine-planning` branch)

---

*Document created: January 2026*
*Last updated: January 2026*
