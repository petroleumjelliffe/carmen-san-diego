# Game State Machine

## Current States

The comment in code claims these states exist:

```
menu, briefing, playing, sleeping, warrant, trial, debrief, won, lost
```

But actually implemented:

```
menu, briefing, playing, apprehended, trial, debrief
```

**Not actually used:** `sleeping`, `warrant`, `won`, `lost`

---

## Current Transitions (as implemented)

```
┌──────────────────────────────────────────────────────────────────┐
│                                                                  │
│    ┌──────┐                                                      │
│    │ menu │◄─────────────────────────────────────────────────────┤
│    └──┬───┘                                                      │
│       │                                                          │
│       ├──────────────────────┐                                   │
│       │ startNewCase()       │ loadSaveState()                   │
│       ▼                      │ (resume saved)                    │
│    ┌──────────┐              │                                   │
│    │ briefing │              │                                   │
│    └────┬─────┘              │                                   │
│         │                    │                                   │
│         │ acceptBriefing()   │                                   │
│         ▼                    ▼                                   │
│    ┌─────────────────────────────┐                               │
│    │          playing            │                               │
│    └──────┬──────────────┬───────┘                               │
│           │              │                                       │
│           │ time runs    │ 2nd investigation                     │
│           │ out          │ at final city                         │
│           │              │ + warrant selected                    │
│           │              ▼                                       │
│           │         ┌────────────┐                               │
│           │         │ apprehended│                               │
│           │         └─────┬──────┘                               │
│           │               │                                      │
│           │               │ proceedToTrial()                     │
│           │               ▼                                      │
│           │          ┌─────────┐                                 │
│           │          │  trial  │                                 │
│           │          └────┬────┘                                 │
│           │               │                                      │
│           │               │ completeTrial()                      │
│           ▼               ▼                                      │
│    ┌─────────────────────────────┐                               │
│    │          debrief            │───────── returnToMenu() ──────┘
│    └─────────────────────────────┘
│
└──────────────────────────────────────────────────────────────────┘
```

---

## Transition Details

| From        | To          | Trigger           | Function                  | Condition                                                                   |
| ----------- | ----------- | ----------------- | ------------------------- | --------------------------------------------------------------------------- |
| menu        | briefing    | Start new case    | `startNewCase()`          | -                                                                           |
| menu        | playing     | Resume saved game | `loadSaveState()`         | Valid save exists                                                           |
| briefing    | playing     | Accept mission    | `acceptBriefing()`        | -                                                                           |
| playing     | debrief     | Time expires      | `advanceTime()`           | `timeRemaining <= 0`                                                        |
| playing     | apprehended | Arrest suspect    | `completeInvestigation()` | `isFinalCity && hadEncounterInCity && !currentEncounter && selectedWarrant` |
| apprehended | trial       | Continue          | `proceedToTrial()`        | -                                                                           |
| trial       | debrief     | Verdict delivered | `completeTrial()`         | -                                                                           |
| debrief     | menu        | Return to menu    | `returnToMenu()`          | -                                                                           |

---

## Known Issues

### 1. Stuck at Final City (THE BUG)

**Problem:** Player can reach final city, trigger assassination (hadEncounterInCity=true), but exhaust all investigation spots before doing the second investigation needed to trigger apprehension.

**Missing transition:** `playing` → `apprehended` when all spots exhausted at final city

---

## Proposed State Machine

### Primary States (Game Flow)

```
menu → briefing → playing → apprehended → trial → debrief → menu
                     ↓
                  debrief (time out)
```

- `menu` - Main menu / case selection
- `briefing` - Case briefing before starting
- `playing` - Active gameplay (contains activity sub-states)
- `apprehended` - Suspect in custody, pre-trial
- `trial` - Courtroom verdict
- `debrief` - Post-case summary (handles both win/lose)

### Activity States (within `playing`)

These are mutually exclusive activities:

```
idle ←───────────────────────────────────────────────────────────┐
  │                                                              │
  │ (on entry: if 11pm-7am → sleeping)                           │
  │                                                              │
  ├──► traveling ──► [idle check] ───────────────────────────────┤
  │                                                              │
  ├──► investigating ──┬──► encounter ──► witnessClue ──► [idle] │
  │                    │                                         │
  │                    └──► witnessClue ──► [idle] ──────────────┤
  │                                                              │
  └──► sleeping ──► idle ────────────────────────────────────────┘

[idle check] = if currentHour >= 23 || currentHour < 7 → sleeping, else → idle
```

- `idle` - Waiting for player action
- `traveling` - Moving between cities (animation)
- `investigating` - Started investigation, determining what happens
- `encounter` - Resolving an encounter before clue
- `witnessClue` - Revealing the clue from witness (formal state, see variants below)
- `sleeping` - Automatic rest period (11pm-7am), advances time, returns to idle

**Implementation:** Use XState or equivalent formal state machine library.

### witnessClue State Variants

| Variant | Trigger | Content |
|---------|---------|---------|
| `normal` | Regular investigation | 1 clue (suspect OR location, alternating) |
| `rogue` | Rogue action used | Both clues + fear message from witness |

### Encounter Types (variant of `encounter` state)

Encounters are phases that happen BEFORE the witness clue is revealed.

| Type            | Requirements                                            | Frequency     | Resolution                                    |
| --------------- | ------------------------------------------------------- | ------------- | --------------------------------------------- |
| `henchman`      | Cities 2 to n-1, not wrong city, first investigation in city | Once per city | Use gadget or take injury + lose time         |
| `assassination` | Final city, first investigation                         | Once per case | Use gadget or take injury + lose time         |
| `goodDeed`      | Not wrong city, not first investigation, dice roll      | Once per case | Help (karma+) or ignore                       |
| `rogueAction`   | Player-initiated, not used in city                      | Once per city | Gain both clues + notoriety                   |
| `apprehension`  | Final city, assassination resolved                      | Once per case | Displays arrest message → `apprehended` state |
| `timeOut`       | `timeRemaining <= 0`                                    | Once per case | "Suspect got away" message → `debrief` state  |

### Encounter Priority & Stacking

**Mutually exclusive (first investigation in cities 2 to n-1):**

- `henchman` (cities 2 to n-1) OR `assassination` (final city)
- Never `goodDeed` on first investigation
- City 1: No encounter on first investigation (straight to clue)

**Rogue action (independent, can stack):**

- Rogue action has independent requirements (player-initiated, not used in city)
- CAN stack with henchman/assassination if both conditions met
- If first investigation + rogue action used: `henchman/assassination → rogueAction → witnessClue`
- If 2nd+ investigation + rogue action used: `rogueAction → witnessClue`
- Gets both clues regardless of stacking

**Good deed:**

- Only on 2nd+ investigation in a city
- Only if `!hadGoodDeedInCase`
- Dice roll determines if it triggers

### Encounter Eligibility Logic

```
Investigation started:
  │
  ├─► Final city, assassination done
  │     → apprehension encounter → APPREHENDED state
  │     (no witness clue, exits playing)
  │
  ├─► City 1, first investigation
  │     → [rogueAction if selected] → witnessClue
  │
  ├─► Cities 2 to n-1, first investigation, !wrongCity
  │     → henchman → [rogueAction if selected] → witnessClue
  │
  ├─► Final city, first investigation
  │     → assassination → [rogueAction if selected] → witnessClue
  │
  └─► 2nd+ investigation:
        │
        ├─► rogueAction selected
        │     → rogueAction → witnessClue
        │
        ├─► !wrongCity && !hadGoodDeedInCase && diceRoll
        │     → goodDeed → witnessClue
        │
        └─► otherwise → witnessClue (no encounter)

[rogueAction if selected] = only runs if player initiated rogue action AND !rogueUsedInCity
```

### Game Flags (properties, not states)

**Location flags** - WHERE you are:

- `wrongCity: boolean` - Took wrong path, no real clues here
- `isFinalCity: boolean` - At the last city (derived from cityIndex)

**Progress flags** - WHAT has happened:

- `hadEncounterInCity: boolean` - Already had henchman/assassination in this city
- `hadGoodDeedInCase: boolean` - Already had good deed this case
- `rogueUsedInCity: boolean` - Already used rogue action in this city
- `warrantIssued: boolean` - Player has selected a suspect warrant (NEW)

### Idle State Context Messages

When in `idle`, show contextual guidance based on flags:

| Condition                                             | Message                                                                 | Action               |
| ----------------------------------------------------- | ----------------------------------------------------------------------- | -------------------- |
| `isFinalCity && hadEncounterInCity && !warrantIssued` | "You've cornered the suspect! Review your evidence to issue a warrant." | Link to Evidence tab |
| `isFinalCity && hadEncounterInCity && warrantIssued`  | "Warrant ready. Investigate to make the arrest."                        | -                    |
| `wrongCity`                                           | "This doesn't seem like the right place..."                             | -                    |

**Note:** These messages are GUIDANCE, not gates. Player can proceed to apprehension without a warrant - they'll just fail at trial.

---

## Investigation Flow Detail

```
Player clicks investigate spot (normal or rogue action)
            │
            ▼
   ┌─────────────────┐
   │  investigating  │
   └────────┬────────┘
            │
            │ Check: Final city + assassination done?
            │    YES → apprehension → APPREHENDED STATE (exit)
            │
            │ Check: Mandatory encounter? (first investigation)
            │    City 1: none
            │    Cities 2 to n-1 + !wrongCity: henchman
            │    Final city: assassination
            │
            ▼
   ┌─────────────────┐
   │  mandatory      │ (henchman/assassination, if applicable)
   │  encounter      │
   └────────┬────────┘
            │
            │ Check: Rogue action selected + !rogueUsedInCity?
            │    YES → rogueAction encounter
            │
            ▼
   ┌─────────────────┐
   │  rogueAction    │ (if selected)
   │  encounter      │
   └────────┬────────┘
            │
            │ Check: 2nd+ investigation, goodDeed eligible?
            │    YES → goodDeed encounter (only if no rogue action)
            │
            ▼
   ┌─────────────────┐
   │  witnessClue    │
   │   revealing...  │
   └────────┬────────┘
            │
            ▼
       idle (+ save)
```

### Encounter Sequence Examples

**City 1, first investigation:**

```
investigating → witnessClue → idle
```

**City 1, rogue action:**

```
investigating → rogueAction → witnessClue (both) → idle
```

**City 2, first investigation:**

```
investigating → henchman → witnessClue → idle
```

**City 2, first investigation + rogue action:**

```
investigating → henchman → rogueAction → witnessClue (both) → idle
```

**Second investigation, rogue action:**

```
investigating → rogueAction → witnessClue (both) → idle
```

**Second investigation with good deed:**

```
investigating → goodDeed → witnessClue → idle
```

**Final city, first investigation:**

```
investigating → assassination → witnessClue → idle
```

**Final city, first investigation + rogue action:**

```
investigating → assassination → rogueAction → witnessClue (both) → idle
```

**Final city, post-assassination:**

```
investigating → apprehension → APPREHENDED (main state change)
```

---

## Travel & Wrong City

### Travel Flow

```
Player selects destination from travel options
            │
            ▼
   ┌─────────────────┐
   │   traveling     │
   │   (animation)   │
   │   duration =    │
   │   travelHours   │
   └────────┬────────┘
            │
            │ Destination correct?
            │    YES → arrive at next correct city
            │    NO  → arrive at wrong city (wrongCity = true)
            │
            ▼
       idle (+ save)
```

### Travel Time Calculation

Travel time is proportional to the distance between cities.

**Formula:**
```javascript
// Haversine distance between two lat/lng points
function getDistanceKm(from, to) {
  const R = 6371; // Earth's radius in km
  const dLat = toRad(to.lat - from.lat);
  const dLng = toRad(to.lng - from.lng);
  const a = Math.sin(dLat/2) ** 2 +
            Math.cos(toRad(from.lat)) * Math.cos(toRad(to.lat)) *
            Math.sin(dLng/2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
}

// Convert distance to travel hours
function getTravelHours(distanceKm) {
  // ~800 km/h average (accounts for airports, connections)
  // Minimum 2 hours (short hops still take time)
  // Maximum 16 hours (longest intercontinental)
  const hours = Math.round(distanceKm / 800);
  return Math.max(2, Math.min(16, hours));
}
```

**Example travel times:**
| Route | Distance | Hours |
|-------|----------|-------|
| Paris → London | ~340 km | 2 hours |
| New York → Chicago | ~1,150 km | 2 hours |
| Tokyo → Sydney | ~7,800 km | 10 hours |
| London → Tokyo | ~9,500 km | 12 hours |
| New York → Sydney | ~16,000 km | 16 hours |

**UI consideration:** Show estimated travel time before player confirms destination.

### Wrong City Simplified Model

**How it works:**
- Case defines a sequence of correct cities: `[city1, city2, city3, city4, city5]`
- At each city, player sees 2-3 travel destinations
- One destination is correct (advances to next city in sequence)
- Other destinations are wrong (lead to wrong city state)

**Wrong city characteristics:**
- `wrongCity = true` flag set
- No henchman encounter (this is how player realizes mistake)
- Clues are vague/unhelpful (don't point to real suspect)
- Travel options always include "Return to [origin city]"

**Recovery:**
- Player travels back to the city they came from
- `wrongCity = false`, back to correct path
- Can now choose the correct destination
- Time is wasted but game continues

### Wrong City Data Structure

```javascript
// Each city in case has:
{
  correctDestination: "paris",      // Next city in sequence
  wrongDestinations: ["berlin"],    // Decoy destinations
  originCity: "london"              // Where player came from (for return)
}

// When in wrong city:
{
  wrongCity: true,
  returnTo: "london"                // Always available as travel option
}
```

---

## Sleep Mechanic

### Sleep Flow

```
Any action completes → attempting to enter idle
            │
            ▼
   ┌─────────────────────────────────────┐
   │  Check: currentHour >= 23           │
   │         OR currentHour < 7?         │
   └────────────────┬────────────────────┘
                    │
        ┌───────────┴───────────┐
        │                       │
        ▼                       ▼
      YES                      NO
        │                       │
        ▼                       ▼
   ┌──────────┐            ┌──────────┐
   │ sleeping │            │   idle   │
   │          │            │          │
   │ Advance  │            │ (normal) │
   │ time to  │            │          │
   │  7am     │            │          │
   └────┬─────┘            └──────────┘
        │
        │ Time advanced, show message
        ▼
   ┌──────────┐
   │   idle   │
   │ (+ save) │
   └──────────┘
```

### Sleep Rules

- **Trigger:** Entering idle when `currentHour >= 23 || currentHour < 7`
- **Duration:** Advances time to 7am (variable hours depending on when sleep starts)
- **Blocking:** No actions available from sleeping state - only WAKE transition
- **Message:** "You rested until 7am" displayed
- **Exit:** Automatically transitions to idle after time advancement

### Sleep Time Calculation

| Enter Sleep At | Hours Until 7am |
|----------------|-----------------|
| 11pm (23:00)   | 8 hours         |
| Midnight       | 7 hours         |
| 1am            | 6 hours         |
| 2am            | 5 hours         |
| 3am            | 4 hours         |
| 4am            | 3 hours         |
| 5am            | 2 hours         |
| 6am            | 1 hour          |

```javascript
const hoursUntil7am = currentHour >= 23
  ? (24 - currentHour) + 7  // e.g., 23:00 → 8 hours
  : 7 - currentHour;         // e.g., 2:00 → 5 hours
```

---

## Final City Special Logic

```
Arrive at final city
            │
            ▼
   ┌─────────────────────────────────────┐
   │  idle (at final city)              │
   │  No special message yet            │
   └────────────────┬────────────────────┘
                    │
                    │ Player investigates
                    ▼
   ┌─────────────────────────────────────┐
   │  assassination encounter            │
   │  (first investigation triggers it) │
   └────────────────┬────────────────────┘
                    │
                    │ Resolve encounter
                    ▼
   ┌─────────────────────────────────────┐
   │  witnessClue → idle                │
   │  hadEncounterInCity = true         │
   └────────────────┬────────────────────┘
                    │
                    │ Show contextual message:
                    │   - No warrant: "Review evidence for warrant"
                    │   - Has warrant: "Warrant ready. Make the arrest."
                    │
                    │ (Messages are guidance only - player can proceed either way)
                    │
                    ▼
   ┌─────────────────────────────────────┐
   │  Player investigates again         │
   │  (or auto-apprehend if no spots)   │
   └────────────────┬────────────────────┘
                    │
                    ▼
   ┌─────────────────────────────────────┐
   │  apprehension encounter            │
   │  → APPREHENDED (main state)        │
   └────────────────┬────────────────────┘
                    │
                    ▼
   ┌─────────────────────────────────────┐
   │            trial                   │
   └────────────────┬────────────────────┘
                    │
        ┌───────────┼───────────┐
        │           │           │
        ▼           ▼           ▼
   No warrant?  Wrong suspect?  Correct warrant?
        │           │           │
        ▼           ▼           ▼
      FAIL        FAIL       SUCCESS
```

### Trial Outcomes

| Warrant Status | Trial Result |
|----------------|--------------|
| No warrant issued | FAIL - "No warrant to present" |
| Wrong suspect | FAIL - "Wrong person arrested" |
| Correct suspect | SUCCESS - Case solved |

### The Fix

When `isFinalCity && hadEncounterInCity`:

- If spots remain → next investigation triggers apprehension
- If NO spots remain → auto-transition to apprehension (fixes the bug)

The key insight: once assassination is resolved, the player should ALWAYS be able to proceed to apprehension, regardless of investigation spots. Warrant status only affects trial outcome.

---

## Time Out Flow

When time runs out, show a failure encounter before debrief:

```
Time expires (timeRemaining <= 0)
            │
            ▼
   ┌─────────────────────────────────────┐
   │  timeOut encounter                  │
   │  "The suspect got away!"            │
   │  [Continue] button                  │
   └────────────────┬────────────────────┘
                    │
                    ▼
              DEBRIEF state
              (outcome: time_out)
```

Same UI pattern as apprehension encounter - message displayed in playing state, then transitions to debrief.

---

## Debrief Outcomes

All game endings go through debrief. Four possible outcomes:

| Outcome | Trigger | Message |
|---------|---------|---------|
| `time_out` | `timeRemaining <= 0` | "The suspect escaped. Case unsolved." |
| `no_warrant` | Trial with no warrant issued | "No warrant to present. Case dismissed." |
| `wrong_warrant` | Trial with wrong suspect warrant | "Wrong person arrested. Real culprit escapes." |
| `success` | Trial with correct warrant | "Case solved! [Suspect] convicted." |

### Debrief Screen Content

Debrief shows:
- Case outcome (success/failure reason)
- Stats: time spent, cities visited, clues collected
- Karma/notoriety changes
- [Return to Menu] button

---

## Save Points

Game saves automatically at these transitions:

### Within `playing` state (save on idle entry):
- After investigation completes → idle
- After travel completes → idle
- After encounter resolves → idle

### Major state transitions:
- `briefing` → `playing` (case start)
- `playing` → `apprehended`
- `apprehended` → `trial`
- `trial` → `debrief`
- `debrief` → `menu`

### What gets saved:
```javascript
{
  // Persistent (across cases)
  karma,
  notoriety,
  solvedCases,
  savedNPCs,
  permanentInjuries,

  // Active case
  currentCase,
  currentCityIndex,
  timeRemaining,
  currentHour,
  collectedClues,
  investigatedLocations,
  selectedWarrant,
  usedGadgets,
  hadGoodDeedInCase,
  hadEncounterInCity,
  rogueUsedInCity,
  wrongCity,
  wrongCityData
}
```

### Load behavior:
- Menu → playing (if valid save exists)
- Always resumes in `idle` activity state
- Never mid-encounter or mid-animation

---

## Resolved Questions

1. ✅ **City 1** - No encounter on first investigation, straight to clue
2. ✅ **Rogue action** - Independent, can stack with henchman/assassination
3. ✅ **Assassination failure** - Wounds + time loss, doesn't end game
4. ✅ **Debrief outcomes** - Four: time_out, no_warrant, wrong_warrant, success
5. ✅ **Time out** - Show "suspect got away" encounter, same pattern as apprehension
6. ✅ **Save points** - On transition to idle within playing, and major state changes
7. ✅ **Formal state machine** - Yes, use XState or equivalent for activity states
8. ✅ **witnessClue** - Distinct formal state with 2 variants (normal: 1 clue, rogue: both + fear)
9. ✅ **Time out mid-encounter** - Let encounter finish, then show timeOut
10. ✅ **Sleep** - Formal state, entered from idle when 11pm-7am, advances time to 7am, returns to idle

---

## Implementation Priority

1. **Fix the bug** - Auto-apprehend when final city + assassination done + no spots
2. **Add timeOut encounter** - Show message before debrief on time expiry
3. **Add warrantIssued flag** - Track and display guidance messages
4. **Implement XState machine** - Formal activity state machine with:
   - States: idle, traveling, investigating, encounter, witnessClue
   - witnessClue variants: normal, rogue
   - Encounter types as context/metadata
   - Guards for transition conditions
   - Actions for side effects (save, time advancement)

---

## XState Machine Architecture

### Design Decisions

1. **Hierarchical machine** - Activity states are nested inside `playing` state
2. **Self-contained context** - All state needed for guards lives in machine context
3. **Pure guards** - No side effects; dice rolls happen as actions, results stored in context
4. **Centralized time** - Single `advanceTime` action handles all time changes + timeout checks
5. **Intermediate state for idle entry** - `checkingIdle` state handles sleep/timeout checks cleanly

### TypeScript Types

```typescript
// Primary game states
type GameState = 'menu' | 'briefing' | 'playing' | 'apprehended' | 'trial' | 'debrief';

// Activity states (within playing)
type ActivityState = 'idle' | 'checkingIdle' | 'traveling' | 'investigating' | 'encounter' | 'witnessClue' | 'sleeping';

// Encounter types
type EncounterType = 'henchman' | 'assassination' | 'goodDeed' | 'rogueAction' | 'apprehension' | 'timeOut' | null;

// Witness clue variants
type WitnessClueVariant = 'normal' | 'rogue';

// Events
type GameEvent =
  | { type: 'START_CASE' }
  | { type: 'ACCEPT_BRIEFING' }
  | { type: 'INVESTIGATE'; spotIndex: number; isRogueAction: boolean }
  | { type: 'TRAVEL'; destination: string; travelHours: number }
  | { type: 'RESOLVE_ENCOUNTER' }
  | { type: 'CONTINUE' }
  | { type: 'WAKE' }
  | { type: 'PROCEED_TO_TRIAL' }
  | { type: 'COMPLETE_TRIAL' }
  | { type: 'RETURN_TO_MENU' };

// Full context
interface GameContext {
  // Time
  currentHour: number;
  timeRemaining: number;

  // Location
  cityIndex: number;
  wrongCity: boolean;

  // Case data (set on case start)
  totalCities: number;

  // Progress flags
  hadEncounterInCity: boolean;
  hadGoodDeedInCase: boolean;
  rogueUsedInCity: boolean;
  investigatedLocations: string[];
  warrantIssued: boolean;
  selectedWarrant: Suspect | null;

  // Activity state data
  encounterType: EncounterType;
  encounterQueue: EncounterType[];  // For stacking
  witnessClueVariant: WitnessClueVariant | null;
  pendingRogueAction: boolean;
  travelHours: number | null;  // Current travel duration (for animation)

  // Pre-rolled values (dice rolls happen as actions, not in guards)
  goodDeedRoll: number | null;

  // UI state
  lastSleepMessage: string | null;

  // Debrief outcome
  debriefOutcome: 'time_out' | 'no_warrant' | 'wrong_warrant' | 'success' | null;
}
```

### Hierarchical Machine Structure

```javascript
import { createMachine, assign } from 'xstate';

const gameMachine = createMachine({
  id: 'carmenSandiego',
  initial: 'menu',
  context: {
    // Time
    currentHour: 8,
    timeRemaining: 72,

    // Location
    cityIndex: 0,
    wrongCity: false,
    totalCities: 5,

    // Progress flags
    hadEncounterInCity: false,
    hadGoodDeedInCase: false,
    rogueUsedInCity: false,
    investigatedLocations: [],
    warrantIssued: false,
    selectedWarrant: null,

    // Activity state
    encounterType: null,
    encounterQueue: [],
    witnessClueVariant: null,
    pendingRogueAction: false,
    travelHours: null,
    goodDeedRoll: null,

    // UI
    lastSleepMessage: null,
    debriefOutcome: null,
  },
  states: {
    menu: {
      on: {
        START_CASE: { target: 'briefing', actions: 'initializeCase' },
        LOAD_SAVE: { target: 'playing', actions: 'loadSavedState' }
      }
    },

    briefing: {
      on: {
        ACCEPT_BRIEFING: { target: 'playing', actions: 'saveGame' }
      }
    },

    // ========================================
    // PLAYING - Contains nested activity states
    // ========================================
    playing: {
      initial: 'checkingIdle',

      // Global handlers for playing state
      on: {
        // Time out can interrupt from any activity state
        TIME_OUT: {
          target: '.encounter',
          actions: 'setTimeOutEncounter',
          cond: 'isTimeExpired'
        }
      },

      states: {
        // Entry point - checks if we should sleep or go to idle
        checkingIdle: {
          always: [
            { target: 'sleeping', cond: 'isSleepTime' },
            { target: 'idle' }
          ]
        },

        idle: {
          entry: ['saveGame', 'clearTransientState'],
          on: {
            INVESTIGATE: {
              target: 'investigating',
              actions: ['setInvestigationParams', 'rollGoodDeedDice']
            },
            TRAVEL: {
              // travelHours passed in event, calculated from distance
              target: 'traveling',
              actions: 'setTravelDestination'
            }
          }
        },

        sleeping: {
          entry: ['advanceTimeToMorning', 'setSleepMessage'],
          on: {
            WAKE: [
              // After sleeping, check if time ran out
              { target: '#carmenSandiego.debrief', cond: 'isTimeExpired', actions: 'setTimeOutOutcome' },
              { target: 'idle' }
            ]
          }
        },

        traveling: {
          // travelHours already stored in context by setTravelDestination
          entry: 'advanceTimeForTravel',
          on: {
            ARRIVE: {
              target: 'checkingIdle',
              actions: ['updateLocation', 'resetCityFlags']
            }
          }
        },

        investigating: {
          entry: 'advanceTimeForInvestigation',
          always: [
            // Priority 1: Apprehension (final city, assassination done)
            {
              target: 'encounter',
              cond: 'shouldApprehend',
              actions: 'setApprehensionEncounter'
            },
            // Priority 2: Mandatory encounter (henchman/assassination)
            {
              target: 'encounter',
              cond: 'shouldHenchman',
              actions: 'setHenchmanEncounter'
            },
            {
              target: 'encounter',
              cond: 'shouldAssassination',
              actions: 'setAssassinationEncounter'
            },
            // Priority 3: Rogue action (if selected, no mandatory encounter)
            {
              target: 'encounter',
              cond: 'shouldRogueActionAlone',
              actions: 'setRogueEncounter'
            },
            // Priority 4: Good deed (2nd+ investigation, dice roll)
            {
              target: 'encounter',
              cond: 'shouldGoodDeed',
              actions: 'setGoodDeedEncounter'
            },
            // Default: straight to clue
            {
              target: 'witnessClue',
              actions: 'setNormalClue'
            }
          ]
        },

        encounter: {
          on: {
            RESOLVE_ENCOUNTER: [
              // Check for stacked rogue action
              {
                target: 'encounter',
                cond: 'hasStackedRogueAction',
                actions: 'setRogueEncounter'
              },
              // Exit to parent states for terminal encounters
              {
                target: '#carmenSandiego.apprehended',
                cond: 'isApprehension',
                actions: 'saveGame'
              },
              {
                target: '#carmenSandiego.debrief',
                cond: 'isTimeOut',
                actions: 'setTimeOutOutcome'
              },
              // Normal flow: proceed to witness clue
              {
                target: 'witnessClue',
                actions: 'markEncounterComplete'
              }
            ]
          }
        },

        witnessClue: {
          on: {
            CONTINUE: {
              target: 'checkingIdle',
              actions: 'recordClue'
            }
          }
        }
      }
    },

    apprehended: {
      entry: 'saveGame',
      on: {
        PROCEED_TO_TRIAL: 'trial'
      }
    },

    trial: {
      entry: ['determineTrialOutcome', 'saveGame'],
      on: {
        COMPLETE_TRIAL: 'debrief'
      }
    },

    debrief: {
      entry: ['updateStats', 'saveGame'],
      on: {
        RETURN_TO_MENU: {
          target: 'menu',
          actions: 'clearCaseState'
        }
      }
    }
  }
});
```

### Guards (Pure Functions)

```javascript
const guards = {
  // Time checks
  isSleepTime: (ctx) => ctx.currentHour >= 23 || ctx.currentHour < 7,
  isTimeExpired: (ctx) => ctx.timeRemaining <= 0,

  // Location checks
  isFinalCity: (ctx) => ctx.cityIndex === ctx.totalCities - 1,
  isWrongCity: (ctx) => ctx.wrongCity,
  isCity1: (ctx) => ctx.cityIndex === 0,
  isCities2ToNMinus1: (ctx) => ctx.cityIndex >= 1 && ctx.cityIndex < ctx.totalCities - 1,

  // Investigation routing
  shouldApprehend: (ctx) =>
    ctx.cityIndex === ctx.totalCities - 1 && ctx.hadEncounterInCity,

  shouldHenchman: (ctx) =>
    ctx.cityIndex >= 1 &&
    ctx.cityIndex < ctx.totalCities - 1 &&
    !ctx.wrongCity &&
    !ctx.hadEncounterInCity,

  shouldAssassination: (ctx) =>
    ctx.cityIndex === ctx.totalCities - 1 &&
    !ctx.hadEncounterInCity,

  shouldRogueActionAlone: (ctx) =>
    ctx.pendingRogueAction &&
    !ctx.rogueUsedInCity &&
    // Only "alone" if no mandatory encounter was triggered
    ctx.encounterQueue.length === 0,

  shouldGoodDeed: (ctx) =>
    ctx.investigatedLocations.length > 0 &&  // 2nd+ investigation
    !ctx.wrongCity &&
    !ctx.hadGoodDeedInCase &&
    ctx.goodDeedRoll !== null &&
    ctx.goodDeedRoll < 0.3,  // 30% chance, already rolled

  // Encounter resolution
  hasStackedRogueAction: (ctx) =>
    ctx.pendingRogueAction &&
    !ctx.rogueUsedInCity &&
    ctx.encounterType !== 'rogueAction',

  isApprehension: (ctx) => ctx.encounterType === 'apprehension',
  isTimeOut: (ctx) => ctx.encounterType === 'timeOut',

  // Trial
  hasNoWarrant: (ctx) => !ctx.warrantIssued,
  hasWrongWarrant: (ctx) =>
    ctx.warrantIssued &&
    ctx.selectedWarrant?.id !== ctx.currentCase?.suspect.id,
  hasCorrectWarrant: (ctx) =>
    ctx.warrantIssued &&
    ctx.selectedWarrant?.id === ctx.currentCase?.suspect.id,
};
```

### Actions (State Mutations)

```javascript
const actions = {
  // === Time Management (centralized) ===
  advanceTime: assign((ctx, event) => {
    const hours = event.hours || 0;
    return {
      currentHour: (ctx.currentHour + hours) % 24,
      timeRemaining: ctx.timeRemaining - hours,
    };
  }),

  advanceTimeToMorning: assign((ctx) => {
    const hoursUntil7am = ctx.currentHour >= 23
      ? (24 - ctx.currentHour) + 7
      : 7 - ctx.currentHour;
    return {
      currentHour: 7,
      timeRemaining: ctx.timeRemaining - hoursUntil7am,
      lastSleepMessage: `You rested for ${hoursUntil7am} hours.`,
    };
  }),

  advanceTimeForTravel: assign((ctx) => {
    // Travel time proportional to distance (stored by setTravelDestination)
    const hours = ctx.travelHours || 4;
    return {
      currentHour: (ctx.currentHour + hours) % 24,
      timeRemaining: ctx.timeRemaining - hours,
    };
  }),

  advanceTimeForInvestigation: assign((ctx) => {
    // Progressive cost: 2h, 4h, 8h based on investigation count in city
    const count = ctx.investigatedLocations.filter(loc =>
      loc.startsWith(`city${ctx.cityIndex}`)).length;
    const hours = [2, 4, 8][Math.min(count, 2)];
    return {
      currentHour: (ctx.currentHour + hours) % 24,
      timeRemaining: ctx.timeRemaining - hours,
    };
  }),

  // === Dice Rolls (happen as actions, not guards) ===
  rollGoodDeedDice: assign({
    goodDeedRoll: () => Math.random(),
  }),

  // === Investigation Setup ===
  setInvestigationParams: assign((ctx, event) => ({
    pendingRogueAction: event.isRogueAction || false,
  })),

  // === Encounter Setup ===
  setHenchmanEncounter: assign({
    encounterType: 'henchman',
    encounterQueue: (ctx) => ctx.pendingRogueAction ? ['rogueAction'] : [],
  }),

  setAssassinationEncounter: assign({
    encounterType: 'assassination',
    encounterQueue: (ctx) => ctx.pendingRogueAction ? ['rogueAction'] : [],
  }),

  setRogueEncounter: assign({
    encounterType: 'rogueAction',
    encounterQueue: [],
    witnessClueVariant: 'rogue',
  }),

  setGoodDeedEncounter: assign({
    encounterType: 'goodDeed',
    encounterQueue: [],
  }),

  setApprehensionEncounter: assign({
    encounterType: 'apprehension',
  }),

  setTimeOutEncounter: assign({
    encounterType: 'timeOut',
  }),

  // === Encounter Resolution ===
  markEncounterComplete: assign((ctx) => ({
    hadEncounterInCity: ['henchman', 'assassination'].includes(ctx.encounterType)
      ? true
      : ctx.hadEncounterInCity,
    hadGoodDeedInCase: ctx.encounterType === 'goodDeed'
      ? true
      : ctx.hadGoodDeedInCase,
    rogueUsedInCity: ctx.encounterType === 'rogueAction'
      ? true
      : ctx.rogueUsedInCity,
  })),

  // === Witness Clue ===
  setNormalClue: assign({
    witnessClueVariant: 'normal',
  }),

  recordClue: assign((ctx, event) => ({
    investigatedLocations: [...ctx.investigatedLocations, event.locationId],
  })),

  // === Travel ===
  setTravelDestination: assign((ctx, event) => ({
    travelHours: event.travelHours,  // Store for animation & time advancement
  })),

  // === Location ===
  updateLocation: assign((ctx, event) => ({
    cityIndex: event.isCorrectDestination ? ctx.cityIndex + 1 : ctx.cityIndex,
    wrongCity: !event.isCorrectDestination,
    travelHours: null,  // Clear after arrival
  })),

  resetCityFlags: assign({
    hadEncounterInCity: false,
    rogueUsedInCity: false,
  }),

  // === Trial ===
  determineTrialOutcome: assign((ctx) => {
    let outcome;
    if (!ctx.warrantIssued) {
      outcome = 'no_warrant';
    } else if (ctx.selectedWarrant?.id !== ctx.currentCase?.suspect.id) {
      outcome = 'wrong_warrant';
    } else {
      outcome = 'success';
    }
    return { debriefOutcome: outcome };
  }),

  setTimeOutOutcome: assign({
    debriefOutcome: 'time_out',
  }),

  // === Cleanup ===
  clearTransientState: assign({
    encounterType: null,
    encounterQueue: [],
    witnessClueVariant: null,
    pendingRogueAction: false,
    travelHours: null,
    goodDeedRoll: null,
    lastSleepMessage: null,
  }),

  // === Persistence ===
  saveGame: (ctx) => {
    // Side effect: persist to localStorage/IndexedDB
    saveToStorage(ctx);
  },
};
```

### Key Architectural Improvements

| Issue | Solution |
|-------|----------|
| Guards reference external state | All state in `context`, guards are pure `(ctx) => boolean` |
| Two machines unclear connection | Single hierarchical machine, activity states nested in `playing` |
| Side effect in guard (diceRoll) | `rollGoodDeedDice` action runs on INVESTIGATE, result in `goodDeedRoll` |
| Time management scattered | All time changes via `advanceTime*` actions, centralized |
| Sleep/idle order of operations | `checkingIdle` intermediate state handles sleep check cleanly |
| No stacking mechanism | `encounterQueue` array holds pending encounters |
| No error handling | Can add `onError` handlers and error states (not shown for brevity) |

### Testing Strategy

```javascript
// Model-based testing with @xstate/test
import { createModel } from '@xstate/test';

const testModel = createModel(gameMachine).withEvents({
  START_CASE: { exec: () => { /* click start */ } },
  INVESTIGATE: {
    exec: (ctx, event) => { /* click investigate spot */ },
    cases: [
      { spotIndex: 0, isRogueAction: false },
      { spotIndex: 0, isRogueAction: true },
    ]
  },
  // ... other events
});

// Generate test paths
const testPlans = testModel.getSimplePathPlans();

// Run tests
testPlans.forEach(plan => {
  plan.paths.forEach(path => {
    it(path.description, async () => {
      await path.test();
    });
  });
});
```

---

## Edit Below: Your Proposed Changes

<!-- Add your proposed state changes, new states, or transition modifications here -->
