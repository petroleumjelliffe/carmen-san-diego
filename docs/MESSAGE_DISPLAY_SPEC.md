# MessageDisplay Component Specification

This document defines the exact display behavior for all message types across different states.

## Component Props Reference

### Core Props
- `type` - Message type identifier (see table below)
- `quote` - Main text content
- `personEmoji` - Optional custom emoji (if not provided, auto-generated)
- `descriptiveText` - Optional text shown in separate card above quote
- `headerTitle` - Custom header title
- `headerIcon` - Custom header icon

### Encounter Props
- `setupText` - Setup description (active phase only)
- `warningText` - Warning message
- `timerDuration` - Countdown timer in seconds
- `choices` - Array of choice buttons
- `result` - Result object with type and message (resolved phase only)

### Behavioral Props
- `autoStream` - Enable word-by-word streaming (default: true)
- `showQuotes` - Override quote marks display (default: auto-determined by type)
- `hideEmojiAndQuotes` - Hide both emoji and quotes (legacy, prefer showQuotes)
- `onChoice` - Choice selection handler
- `onTimeout` - Timer expiration handler
- `onContinue` - Continue button handler

## Display States Table

| Message Type | Phase | Header (headerTitle) | Descriptive Text (descriptiveText) | Setup Text (setupText) | Warning (warningText) | Witness Emoji (personEmoji) | Witness Quote (quote) | Streaming (autoStream) | Choices (choices) | Timer (timerDuration) | Continue (onContinue) |
|--------------|-------|----------------------|-------------------------------------|------------------------|----------------------|----------------------------|----------------------|----------------------|-------------------|---------------------|----------------------|
| **Normal Witness** | complete | ❌ | ❌ | ❌ | ❌ | ✅ auto-generated | ✅ with "" | ✅ | ❌ | ❌ | ❌ |
| **Rogue Action Desc** | custom | ✅ "UNORTHODOX METHODS" | ✅ action.description | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ✅ |
| **Rogue Clue** | complete | ❌ | ❌ | ❌ | ✅ "Word spreads..." | ✅ auto-generated | ✅ with "" | ✅ | ❌ | ❌ | ❌ |
| **Good Deed** | active | ✅ "SOMEONE NEEDS HELP" | ❌ | ✅ optional | ✅ optional | ❌  | ✅ no "" | ✅ | ✅ 1 button | ✅ | ❌ |
| **Good Deed** | resolved | ✅ "SOMEONE NEEDS HELP" | ❌ | ❌ | ✅ "Your integrity..." | ✅ auto-generated | ✅ with "" result.message | ❌ | ❌ | ❌ | ✅ |
| **Henchman** | active | ✅ "HENCHMAN ENCOUNTER" | ❌ | ✅ optional | ❌ | ❌ | ✅ no "" | ✅ | ✅ 3x3 grid | ✅ | ❌ |
| **Henchman** | resolved | ✅ "HENCHMAN ENCOUNTER" | ❌ | ❌ | ❌ | ❌ | ✅ no "" result.message | ❌ | ❌ | ❌ | ✅ |
| **Assassination** | active | ✅ "ASSASSINATION ATTEMPT" | ❌ | ✅ optional | ✅ optional | ❌ | ✅ no "" | ✅ | ✅ 3x3 grid | ✅ | ❌ |
| **Assassination** | resolved | ✅ "ASSASSINATION ATTEMPT" | ❌ | ❌ | ❌ | ❌ | ✅ no "" result.message | ❌ | ❌ | ❌ | ✅ |
| **Apprehension** | complete | ✅ "SUSPECT APPREHENDED" | ❌ | ❌ | ❌ | ✅ auto-generated | ✅ no "" | ✅ | ❌ | ❌ | ✅ |

## Element Display Logic

### Header Section
- **Displayed when:** `headerTitle` provided OR type is encounter/event
- **Content:** Icon + Title
- **Styling:** Gray card with yellow border-left
- **Implementation:** Lines 310-321 (resolved), 238-245 (active), 191-199 (witness)

### Descriptive Text Card
- **Displayed when:** `descriptiveText` provided
- **Content:** Plain text paragraph
- **Styling:** Gray card with yellow border-left, separate from quote
- **Implementation:** Lines 202-209
- **Note:** When present, hides emoji and quotes from witness section

### Setup Text
- **Displayed when:** `setupText` provided AND phase is 'active'
- **Content:** Small gray text above witness section
- **Styling:** `text-yellow-200/70 text-sm`
- **Implementation:** Lines 248-252

### Warning Section
- **Displayed when:** `warningText` provided
- **Content:** Alert icon + warning message
- **Styling:** Red background with red border-left
- **Implementation:** Lines 255-262 (active), 338-346 (good deed resolved), InvestigateTab lines 273-279 (rogue clue)
- **Special cases:**
  - Good deed resolved: Green background, "Your integrity strengthens your reputation"
  - Rogue clue: Red background, "Word spreads about your methods"

### NOOOO Animation
- **Displayed when:** type is 'encounter_assassination' AND timeLeft < 3
- **Content:** "NOOOOOO!" or "N..." based on time
- **Implementation:** Lines 265-271

### Witness Section (Quote Display)
- **Emoji:**
  - Auto-generated from quote hash if not provided
  - Hidden when: type is henchman/assassination (active), hideEmojiAndQuotes=true
  - Shown when: witness, good deed, apprehension
- **Quote Text:**
  - With quotation marks: witness (normal), apprehension, good deed/assassination (resolved)
  - Without quotation marks: henchman (any phase), assassination (active), good deed (active), rogue clue
  - Override with: `showQuotes` prop
- **Streaming:**
  - Enabled: active phase encounters, witness clues
  - Disabled: resolved phase
- **Implementation:** Lines 210-216 (witness), 275-281 (active), 325-336 (resolved)

### Choice Section
- **Displayed when:** phase is 'active' AND choices array has items
- **Layout:**
  - Good deed: Single full-width button with Heart icon
  - Henchman/Assassination: 3x3 grid of gadget buttons
- **Timer Integration:** Background fill shows timer progress with color coding
- **Implementation:** Lines 405-470

### Timer Display
- **Displayed when:** `timerDuration` provided AND phase is 'active'
- **Integration:** Shown as background fill in choice buttons
- **Colors:**
  - Green: > 60% time remaining (normal)
  - Orange: 30-60% time remaining (warning)
  - Red: < 30% time remaining (critical)
- **Implementation:** Lines 426-432 (good deed), 457-462 (gadgets)

### Continue Button
- **Displayed when:**
  - Witness: has `onContinue` handler
  - Rogue action description: always
  - Encounters resolved: type is NOT henchman
- **Styling:** Gray button, full width
- **Implementation:** Lines 218-227 (witness), 349-358 (resolved)

## Type Values

### Standard Types
- `witness` - Regular witness clue
- `encounter_henchman` - Henchman gadget challenge
- `encounter_assassination` - Assassination attempt
- `encounter_good_deed` - Good deed opportunity
- `apprehension` - Suspect captured (uses witness type with custom header)
- `rogue_action` - Rogue action header (currently unused, handled in InvestigateTab)

## Phase Determination

```javascript
const phase = type === 'witness' ? 'complete' : (result ? 'resolved' : 'active');
```

- **complete:** Witness clues (streaming then static)
- **active:** Encounters waiting for user interaction
- **resolved:** Encounters showing result after interaction

## Usage Examples

### Normal Witness Clue
```jsx
<MessageDisplay
  type="witness"
  quote="I saw someone with a red hat heading toward the museum."
/>
```

### Rogue Action Description (InvestigateTab)
```jsx
<div className="space-y-2">
  <div className="bg-gray-900/95...">
    <div className="flex items-center gap-3">
      <span className="text-2xl">⚡</span>
      <h3 className="text-lg font-bold text-purple-400">UNORTHODOX METHODS</h3>
    </div>
  </div>
  <div className="bg-gray-900/95...">
    <p>{action.description} {action.success_text}</p>
  </div>
  <button onClick={onResolveRogueAction}>CONTINUE</button>
</div>
```

### Rogue Clue (InvestigateTab)
```jsx
<div className="space-y-2">
  <MessageDisplay
    type="witness"
    quote={rogueClueText}
    showQuotes={false}
  />
  <div className="bg-red-900/50...">
    <p>Word spreads about your methods.</p>
  </div>
</div>
```

### Good Deed Active
```jsx
<MessageDisplay
  type="encounter_good_deed"
  quote="Someone is trapped! Help them?"
  timerDuration={10}
  choices={[{ id: 'help', label: 'Help', icon: '❤️' }]}
  onChoice={handleChoice}
  onTimeout={handleTimeout}
/>
```

### Good Deed Resolved
```jsx
<MessageDisplay
  type="encounter_good_deed"
  result={{ type: 'success', message: 'You helped them escape!' }}
  onContinue={handleContinue}
/>
```

### Henchman Active
```jsx
<MessageDisplay
  type="encounter_henchman"
  quote="A henchman blocks your path!"
  timerDuration={8}
  choices={gadgetChoices}
  onChoice={handleGadgetChoice}
  onTimeout={handleTimeout}
/>
```

### Henchman Resolved (auto-dismiss)
```jsx
<MessageDisplay
  type="encounter_henchman"
  result={{ type: 'success', message: 'You escaped!' }}
/>
```
Note: No onContinue, encounter should auto-dismiss

### Apprehension
```jsx
<MessageDisplay
  type="witness"
  headerTitle="SUSPECT APPREHENDED"
  headerIcon={<span className="text-2xl">🚔</span>}
  quote="You caught Carmen San Diego!"
  onContinue={handleContinue}
/>
```

## Maintenance Notes

When adding new message types or modifying display logic:

1. Update this specification table first
2. Implement changes in MessageDisplay.jsx
3. Update relevant parent components (InvestigateTab, EncounterDisplay)
4. Test all phases for the affected type
5. Verify no regressions in other types
