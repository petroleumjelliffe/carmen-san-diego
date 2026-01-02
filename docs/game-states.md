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
idle ←──────────────────────────────────────────────────┐
  │                                                     │
  ├──► traveling ──► idle                               │
  │                                                     │
  └──► investigating ──┬──► encounter ──► witnessClue ──┤
                       │                                │
                       └──► witnessClue ────────────────┘
```

- `idle` - Waiting for player action
- `traveling` - Moving between cities (animation)
- `investigating` - Started investigation, determining what happens
- `encounter` - Resolving an encounter before clue
- `witnessClue` - Revealing the clue from witness (formal state, see variants below)

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
   └────────┬────────┘
            │
            │ Destination correct?
            │    YES → arrive at next correct city
            │    NO  → arrive at wrong city (wrongCity = true)
            │
            ▼
       idle (+ save)
```

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

## XState Machine Sketch

```javascript
const activityMachine = createMachine({
  id: 'activity',
  initial: 'idle',
  context: {
    encounterType: null,      // henchman | assassination | goodDeed | rogueAction | apprehension | timeOut
    witnessClueVariant: null, // normal | rogue
  },
  states: {
    idle: {
      entry: ['saveGame'],
      on: {
        INVESTIGATE: 'investigating',
        TRAVEL: 'traveling',
        TIME_OUT: 'encounter', // with encounterType: timeOut
      }
    },
    traveling: {
      on: {
        ARRIVE: 'idle'
      }
    },
    investigating: {
      always: [
        { target: 'encounter', cond: 'shouldApprehend', actions: 'setApprehension' },
        { target: 'encounter', cond: 'shouldHenchman', actions: 'setHenchman' },
        { target: 'encounter', cond: 'shouldAssassination', actions: 'setAssassination' },
        { target: 'encounter', cond: 'shouldRogueAction', actions: 'setRogueAction' },
        { target: 'encounter', cond: 'shouldGoodDeed', actions: 'setGoodDeed' },
        { target: 'witnessClue', actions: 'setNormalClue' }
      ]
    },
    encounter: {
      on: {
        RESOLVE: [
          { target: 'encounter', cond: 'hasStackedRogueAction', actions: 'setRogueAction' },
          { target: 'witnessClue', cond: 'notApprehensionOrTimeout' },
          { target: '#apprehended', cond: 'isApprehension' },
          { target: '#debrief', cond: 'isTimeOut' }
        ]
      }
    },
    witnessClue: {
      // variants: normal (1 clue) or rogue (both clues + fear)
      on: {
        CONTINUE: 'idle'
      }
    }
  }
});
```

### Guards (conditions)

```javascript
const guards = {
  shouldApprehend: (ctx) => isFinalCity && hadEncounterInCity,
  shouldHenchman: (ctx) => cityIndex >= 1 && cityIndex < finalIndex && !wrongCity && !hadEncounterInCity,
  shouldAssassination: (ctx) => isFinalCity && !hadEncounterInCity,
  shouldRogueAction: (ctx) => rogueActionSelected && !rogueUsedInCity,
  shouldGoodDeed: (ctx) => !isFirstInvestigation && !wrongCity && !hadGoodDeedInCase && diceRoll(),
  hasStackedRogueAction: (ctx) => rogueActionSelected && !rogueUsedInCity && ctx.encounterType !== 'rogueAction',
  isApprehension: (ctx) => ctx.encounterType === 'apprehension',
  isTimeOut: (ctx) => ctx.encounterType === 'timeOut',
};
```

---

## Edit Below: Your Proposed Changes

<!-- Add your proposed state changes, new states, or transition modifications here -->
