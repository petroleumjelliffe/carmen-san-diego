# Message Component Consolidation Plan

## Overview
Consolidate all message/encounter display components into a unified system that handles:
- Witness clues
- Good deed encounters with interaction
- Rogue action encounters with interaction
- Success/failure results
- All with consistent positioning and animation

## Current Components Analysis

### ClueDisplay.jsx
**Purpose**: Display witness statements with emoji and streaming text
**Features**:
- Deterministic profession emoji with skin tone (based on text hash)
- Word-by-word streaming animation
- Quote-style display with border accent
- Support for descriptive text above quote
- Type variants: 'investigation' | 'rogue'

**Structure**:
```
- Optional descriptive text
- Main display:
  - Large emoji (7xl)
  - Streaming quoted text with cursor
  - Border accent (yellow/orange)
```

### EncounterCard.jsx
**Purpose**: Handle interactive encounters (henchman, assassination, good deeds)
**Features**:
- Two-phase display: active → resolved
- Countdown timer with fuse animation
- Action buttons (gadgets or help)
- Result display with time penalties
- Paranoia warnings for good deeds

**Structure (Active)**:
```
- Header (icon + title)
- Fuse timer bar
- Description text
- Optional plea quote (good deeds)
- Optional warnings
- Action buttons
```

**Structure (Resolved)**:
```
- Header (same as active)
- Result in quote style
- Continue button
```

## Key Differences: Henchman vs Assassination

**Henchman Encounters** (mid-game, correct cities):
- Timer: 10 seconds
- Penalties: 4h (wrong), 6h (timeout)
- Lower stakes, mid-game obstacles

**Assassination Attempts** (final city only):
- Timer: 5-7 seconds (more urgent)
- Penalties: 6h (wrong), 8h (timeout)
- Higher stakes, dramatic scenarios
- Has specific timeout text

## Unified Component Design: `MessageDisplay`

### Core Concept
A single component that handles all message types through a unified interface with:
1. **Header Section**: Icon + title (encounters and special events only)
2. **Witness Section**: Person emoji + quote (always present)
3. **Setup Section**: Expositional text (encounters only)
4. **Timer Section**: Countdown visualization (interactive encounters only)
5. **Choice Section**: Buttons/options (interactive encounters only)
6. **Result Section**: Outcome display (after interaction)

### Header Icons by Type
- **Witness Clue**: 🔍 (magnifying glass) - NO HEADER, just shows witness
- **Good Deed**: 😰 or 🆘 (distress/surprise)
- **Henchman**: ⚡ or 👊 (lightning/fist)
- **Assassination**: 💣 or 💀 (bomb/skull)
- **Rogue Action**: 🎭 or ⚡ (mask/lightning) - Shows action name as header
- **Apprehension**: 🚔 (police car) - "SUSPECT APPREHENDED"

### Component Props

```typescript
interface MessageDisplayProps {
  // Message type
  type: 'witness' | 'encounter_henchman' | 'encounter_assassination' |
        'encounter_good_deed' | 'rogue_action' | 'apprehension'

  // Witness/person display
  personEmoji?: string // Auto-generated if not provided
  quote: string // Main message - streams word by word

  // Optional header (encounters/events only)
  headerTitle?: string // e.g., "ASSASSINATION ATTEMPT", "SUSPECT APPREHENDED"
  headerIcon?: React.ReactNode

  // Optional setup (encounters only)
  setupText?: string // Expositional text shown above witness section

  // Optional timer (interactive encounters only)
  timerDuration?: number // Seconds
  onTimeout?: () => void

  // Optional choices (interactive encounters only)
  choices?: Array<{
    id: string
    label: string
    icon?: string
    disabled?: boolean
    type: 'gadget' | 'continue' // 'continue' for good deeds
  }>
  onChoice?: (choiceId: string) => void

  // Optional warning
  warningText?: string

  // Result handling (encounters)
  result?: {
    message: string
    type: 'success' | 'failure' | 'neutral'
    // NO timeLost - all time passes in clock, not shown in message
  }

  // Clue reveal (same for all: investigation, good deed, rogue)
  revealedClue?: string

  // Continue handler
  onContinue?: () => void

  // Behavioral flags
  autoStream?: boolean // Default true
}
```

### Visual Structure

```
SIMPLE WITNESS (no header, just witness):
┌─────────────────────────────────────────────┐
│ [Witness Section - Always Present]          │
│                                             │
│   👨‍⚕️    "The streaming quote text        │
│  7xl     appears here word by word with    │
│  emoji   a cursor at the end|"             │
│                                             │
│  └─ Single border color for all (yellow)   │
└─────────────────────────────────────────────┘

ENCOUNTER/EVENT (with header):
┌─────────────────────────────────────────────┐
│ [Header Section]                            │
│                                             │
│ 💣 ASSASSINATION ATTEMPT                    │
│ ════════════════ Timer ═════════════════   │ <- Fuse animation
│                                             │
│ Setup/expositional text here...            │
│ [Warning text if applicable]               │
└─────────────────────────────────────────────┘
┌─────────────────────────────────────────────┐
│ [Witness Section]                           │
│                                             │
│   👨‍⚕️    "The streaming quote text        │
│          appears here..."                  │
└─────────────────────────────────────────────┘
┌─────────────────────────────────────────────┐
│ [Choice Section - Gadget Encounters]        │
│                                             │
│ ┌─────┐ ┌─────┐ ┌─────┐                   │
│ │ 🔬  │ │ 📡  │ │ 🔪  │                   │
│ │Tool │ │Radio│ │Knife│                   │
│ └─────┘ └─────┘ └─────┘                   │
└─────────────────────────────────────────────┘

OR

┌─────────────────────────────────────────────┐
│ [Choice Section - Good Deed]                │
│                                             │
│         [CONTINUE] button                   │
│    (player chooses to help or not)         │
└─────────────────────────────────────────────┘

AFTER CHOICE/TIMEOUT:
┌─────────────────────────────────────────────┐
│ [Header - Same as Active]                   │
│ 💣 ASSASSINATION ATTEMPT                    │
└─────────────────────────────────────────────┘
┌─────────────────────────────────────────────┐
│ [Result in Quote Style]                     │
│                                             │
│   👨‍⚕️    "Success or failure message      │
│          shown here..."                    │
│                                             │
│  NO TIME PENALTY SHOWN - passes in clock   │
└─────────────────────────────────────────────┘
┌─────────────────────────────────────────────┐
│ [Continue Button]                           │
│                                             │
│         [CONTINUE]                          │
└─────────────────────────────────────────────┘

CLUE REVEAL (same for all types):
┌─────────────────────────────────────────────┐
│ [Revealed Clue - Same Display as Witness]   │
│                                             │
│   👨‍🎨    "Revealed clue text streams       │
│          here after action completes..."   │
│                                             │
│  Same format whether from investigation,   │
│  good deed, or rogue action                │
└─────────────────────────────────────────────┘
```

### State Machine

```
WITNESS (simple):
  idle → streaming → complete

ENCOUNTER (interactive):
  setup_display → awaiting_choice → [choice_made | timeout] → showing_result → [revealing_clue] → complete

ROGUE_ACTION:
  action_display → showing_result → revealing_clue → complete
```

### Animation Sequence

1. **Setup Section** (if present): Fade in immediately
2. **Timer** (if present): Start counting down
3. **Witness Section**: Delay 200ms, then stream quote word by word
4. **Choice Section** (if present): Fade in when quote completes
5. **Result Section**: Replace choice section with result
6. **Clue Reveal** (if present): Stream after result acknowledged

### Positioning Behavior

All message displays use the same positioning system:
- **Investigation tab**: Absolute positioned at top-4 left-4 right-4, z-20
- **Overlay mode** (encounters): Centered in fullscreen overlay with backdrop blur
- Always above map, below blocking overlays (apprehension, trial)

### Type-Specific Configurations

#### Witness Clue (Simple)
```javascript
{
  type: 'witness',
  quote: clueText,
  personEmoji: <auto-generated>,
  autoStream: true
  // No header, no border color variation - obvious from context
}
```

#### Rogue Action
```javascript
{
  type: 'rogue_action',
  headerTitle: rogueAction.name, // e.g., "Bribe Official"
  headerIcon: '🎭',
  setupText: rogueAction.description,
  quote: rogueAction.success_text,
  revealedClue: foundClue, // Shows as normal clue after result
  result: {
    message: rogueAction.success_text,
    type: 'success'
    // Time passes in clock, not shown
  },
  onContinue: completeRogueAction
}
```

#### Good Deed Encounter
```javascript
{
  type: 'encounter_good_deed',
  headerTitle: 'SOMEONE NEEDS HELP',
  headerIcon: '😰',
  setupText: encounter.description,
  quote: encounter.plea,
  timerDuration: 8,
  choices: [
    {
      id: 'continue',
      label: 'CONTINUE',
      type: 'continue'
      // Player clicks to help - single choice
    }
  ],
  warningText: karma > 0 ? 'Could be a trap...' : undefined,
  result: {
    message: outcome.message,
    type: outcome.helped ? 'success' : 'neutral'
    // Time passes in clock
  },
  revealedClue: outcome.helped && !isTrap ? clue : undefined,
  onContinue: resolveGoodDeed
}
```

#### Henchman Encounter
```javascript
{
  type: 'encounter_henchman',
  headerTitle: 'HENCHMAN ENCOUNTER',
  headerIcon: '👊',
  setupText: encounter.description,
  quote: encounter.description, // Or separate taunt
  timerDuration: 10,
  choices: availableGadgets.map(g => ({
    id: g.id,
    label: g.name,
    icon: g.icon,
    disabled: g.used,
    type: 'gadget'
  })),
  result: {
    message: outcome.message,
    type: outcome.success ? 'success' : 'failure'
    // Time passes in clock - penalties: 4h wrong, 6h timeout
  },
  onContinue: resolveHenchman
}
```

#### Assassination Encounter
```javascript
{
  type: 'encounter_assassination',
  headerTitle: 'ASSASSINATION ATTEMPT',
  headerIcon: '💣',
  setupText: encounter.description,
  quote: timeLeft < 3 ? "NOOOO!" : encounter.description,
  timerDuration: encounter.timer_duration || 5,
  choices: availableGadgets.map(g => ({
    id: g.id,
    label: g.name,
    icon: g.icon,
    disabled: g.used,
    type: 'gadget'
  })),
  result: {
    message: outcome.message,
    type: outcome.success ? 'success' : 'failure'
    // Time passes in clock - penalties: 6h wrong, 8h timeout
  },
  onContinue: resolveAssassination
}
```

#### Apprehension
```javascript
{
  type: 'apprehension',
  headerTitle: 'SUSPECT APPREHENDED',
  headerIcon: '🚔',
  quote: `${selectedWarrant.name} is now in custody.`,
  choices: [
    {
      id: 'trial',
      label: 'CONTINUE TO TRIAL',
      type: 'continue'
    }
  ],
  onContinue: proceedToTrial
}
```

## Implementation Plan

### Phase 1: Create Unified Component
1. Create `src/components/MessageDisplay.jsx`
2. Implement core structure with sections
3. Add streaming animation
4. Add timer with fuse visualization
5. Add choice rendering
6. Add result display
7. Add clue reveal sequence

### Phase 2: Internal State Management
1. State machine for message phases
2. Animation sequencing
3. Timer integration
4. Choice handling
5. Result transitions

### Phase 3: Styling & Polish
1. Consistent spacing and padding
2. Border accents by type
3. Smooth transitions between phases
4. Urgency levels for timer colors
5. Mobile responsiveness

### Phase 4: Integration
1. Replace ClueDisplay with MessageDisplay in InvestigateTab
2. Replace EncounterCard with MessageDisplay in InvestigateTab
3. Test all encounter types
4. Test all clue types
5. Verify animations and timing

### Phase 5: Cleanup
1. Remove ClueDisplay.jsx
2. Remove EncounterCard.jsx
3. Update imports
4. Remove unused hooks if any

## Benefits of Consolidation

1. **Consistency**: All messages look and behave the same way
2. **Maintainability**: Single source of truth for message display logic
3. **Flexibility**: Easy to add new message types
4. **DRY**: No duplicate animation or styling code
5. **Better UX**: Predictable interaction patterns across all message types

## Testing Checklist

- [ ] Witness clue displays with streaming
- [ ] Witness clue emoji is deterministic
- [ ] Rogue action shows setup → result → clue
- [ ] Good deed shows timer → choices → result → clue (if helped)
- [ ] Good deed trap shows different result
- [ ] Good deed skip works correctly
- [ ] Henchman encounter timer counts down
- [ ] Henchman gadget choice works
- [ ] Henchman timeout penalty applies
- [ ] Assassination encounter shows NOOOO at low time
- [ ] Assassination gadget choice works
- [ ] All animations smooth and timed correctly
- [ ] Mobile layout works
- [ ] Border colors correct for each type
- [ ] Timer urgency colors change appropriately
