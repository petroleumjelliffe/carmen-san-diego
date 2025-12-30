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

## Unified Component Design: `MessageDisplay`

### Core Concept
A single component that handles all message types through a unified interface with:
1. **Witness Section**: Person emoji + quote (always present)
2. **Setup Section**: Expositional text (encounters only)
3. **Timer Section**: Countdown visualization (interactive encounters only)
4. **Choice Section**: Buttons/options (interactive encounters only)
5. **Result Section**: Outcome display (after interaction)

### Component Props

```typescript
interface MessageDisplayProps {
  // Message type
  type: 'witness' | 'encounter_henchman' | 'encounter_assassination' |
        'encounter_good_deed' | 'rogue_action'

  // Witness/person display
  personEmoji?: string // Auto-generated if not provided
  quote: string // Main message - streams word by word
  quoteColor?: 'yellow' | 'green' | 'orange' | 'red' // Border accent

  // Optional setup (encounters)
  setupText?: string // Expositional text shown before quote
  setupTitle?: string // e.g., "ASSASSINATION ATTEMPT"
  setupIcon?: React.ReactNode

  // Optional timer (interactive encounters)
  timerDuration?: number // Seconds
  onTimeout?: () => void

  // Optional choices (interactive encounters)
  choices?: Array<{
    id: string
    label: string
    icon?: string
    disabled?: boolean
    type: 'gadget' | 'action' | 'trivia'
  }>
  onChoice?: (choiceId: string) => void

  // Optional warning
  warningText?: string

  // Result handling
  result?: {
    message: string
    type: 'success' | 'failure' | 'neutral'
    timeLost?: number
    clue?: string // Revealed after good deed or rogue action
  }
  onContinue?: () => void

  // Behavioral flags
  autoStream?: boolean // Default true
  dismissible?: boolean
}
```

### Visual Structure

```
┌─────────────────────────────────────────────┐
│ [Setup Section - Encounters Only]           │
│                                             │
│ [Icon] TITLE                                │
│ ════════════════ Timer ═════════════════   │ <- Fuse animation
│                                             │
│ Setup/expositional text here...            │
│                                             │
│ [Warning text if applicable]               │
└─────────────────────────────────────────────┘

┌─────────────────────────────────────────────┐
│ [Witness/Person Section - Always Present]   │
│                                             │
│   👨‍⚕️    "The streaming quote text        │
│  7xl     appears here word by word with    │
│  emoji   a cursor at the end|"             │
│                                             │
│  └─ Border accent color based on type      │
└─────────────────────────────────────────────┘

┌─────────────────────────────────────────────┐
│ [Choice Section - Interactive Only]         │
│                                             │
│ ┌─────┐ ┌─────┐ ┌─────┐                   │
│ │ 🔬  │ │ 📡  │ │ 🔪  │                   │
│ │Tool │ │Radio│ │Knife│                   │
│ └─────┘ └─────┘ └─────┘                   │
└─────────────────────────────────────────────┘

OR (after choice/timeout)

┌─────────────────────────────────────────────┐
│ [Result Section]                            │
│                                             │
│ "Success/failure message here"              │
│ [-4h] <- Time penalty if applicable         │
│                                             │
│ [CONTINUE] button                           │
└─────────────────────────────────────────────┘

┌─────────────────────────────────────────────┐
│ [Clue Reveal - Good Deeds Only]             │
│                                             │
│   👨‍🎨    "Revealed clue text streams       │
│          here after helping..."            │
│                                             │
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

#### Witness Clue
```javascript
{
  type: 'witness',
  quote: clueText,
  quoteColor: 'yellow',
  personEmoji: <auto-generated>,
  autoStream: true
}
```

#### Rogue Action
```javascript
{
  type: 'rogue_action',
  setupText: rogueAction.description,
  quote: rogueAction.success_text,
  quoteColor: 'orange',
  result: {
    message: rogueAction.success_text,
    type: 'success',
    clue: foundClue
  }
}
```

#### Good Deed Encounter
```javascript
{
  type: 'encounter_good_deed',
  setupTitle: 'SOMEONE NEEDS HELP',
  setupIcon: <Heart />,
  setupText: encounter.description,
  quote: encounter.plea,
  quoteColor: 'yellow',
  timerDuration: 8,
  choices: [
    { id: 'help', label: 'HELP', icon: '❤️', type: 'action' },
    { id: 'skip', label: 'SKIP', icon: '🚶', type: 'action' }
  ],
  warningText: karma > 0 ? 'Could be a trap...' : undefined,
  result: {
    message: outcome.message,
    type: outcome.helped ? 'success' : 'neutral',
    timeLost: outcome.timeLost,
    clue: outcome.helped && !isTrap ? revealedClue : undefined
  }
}
```

#### Henchman Encounter
```javascript
{
  type: 'encounter_henchman',
  setupTitle: 'HENCHMAN ENCOUNTER',
  setupIcon: <Zap />,
  setupText: encounter.description,
  quote: encounter.description, // Or separate taunt
  quoteColor: 'orange',
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
    type: outcome.success ? 'success' : 'failure',
    timeLost: outcome.timeLost
  }
}
```

#### Assassination Encounter
```javascript
{
  type: 'encounter_assassination',
  setupTitle: 'ASSASSINATION ATTEMPT',
  setupIcon: <Skull />,
  setupText: encounter.description,
  quote: "NOOOO!", // Special case when timer < 3s
  quoteColor: 'red',
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
    type: outcome.success ? 'success' : 'failure',
    timeLost: outcome.timeLost
  }
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
