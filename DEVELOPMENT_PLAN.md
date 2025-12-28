# Carmen San Diego - Development Plan

> **Context Document** - Use this to resume work on any machine.
> Run `npm install && npm run dev` to start.

## Project Status: Active Development

**Last Updated**: 2025-12-27
**Tech Stack**: Vite + React 18 + Tailwind CSS + YAML configs
**Build**: `npm run build` (verified working)
**Dev**: `npm run dev` (includes --host for network access)

---

## Quick Start for New Session

1. Read this file for context
2. Check `UI_REDESIGN_SPEC.md` for full feature spec
3. Key files to understand:
   - `src/hooks/useGameState.js` - All game logic
   - `src/components/InvestigateTab.jsx` - Main gameplay UI with inline encounters
   - `src/components/Game.jsx` - Component orchestration
   - `config/encounters.yaml` - Henchman/assassination definitions
   - `config/gadgets.yaml` - 6 gadgets with correct_gadget mappings

---

## ✅ COMPLETED

### Phase 1: Project Setup
- Vite + React + Tailwind + @modyfi/vite-plugin-yaml
- 15 YAML config files in `/config/`
- Utility functions (loadGameData, caseGenerator, clueGenerator, helpers)
- Components split from monolithic file
- Custom hook `useGameState.js`

### Phase 2: Core Features (from UI_REDESIGN_SPEC.md)
- **Game Flow**: Menu → Briefing → City Loop → Final City → Trial → Debrief
- **Encounters**: Henchman (non-final cities) + Assassination (final city, with timer)
- **Gadget System**: 6 gadgets, one-use per case, correct/wrong penalties
- **Karma/Notoriety**: Good deeds, fake traps (karma≥5), rogue actions, localStorage persistence
- **Time**: Auto-sleep at 11pm, injury penalties, time-of-day tracking

### Phase 2.5: Bug Fixes (2025-12-27)
- Encounters trigger only on FIRST investigation per city (not every time)
- Assassination triggers at final city on first investigation (not warrant)
- Encounters render INLINE in InvestigateTab (not full-screen modals)
- Warrants issuable anytime (just saves selection)
- Trial triggers on SECOND investigation at final city (after assassination + warrant issued)

### Phase 2.6: Legacy Component Cleanup
- Deleted splash screen components: GameOver, Cutscene, HenchmanEncounter, AssassinationAttempt, GoodDeedEncounter, GoodDeedModal, Sleep
- Case timeout now goes to Debrief (not GameOver splash)
- All encounters use unified EncounterCard component

---

## 🚧 REMAINING: Phase 3 - UI Cleanup & Polish

### Priority Order
1. Core Gameplay Fixes (immediate)
2. Visual Enhancements (next)
3. UI Redundancy Cleanup (later, as we touch components)

---

### UI Redundancy Cleanup (Later)

**40+ redundant patterns identified across components. Estimated 15-20% code reduction.**

#### Approach: Combined (Utilities + Components)
- **Utilities** for simple styling (headings, card backgrounds, spacing)
- **Components** for complex patterns (EncounterBox, IconLabel)

#### Quick Wins
1. **Section Headings** - Utility classes `.heading-1`, `.heading-2`, `.heading-3`
2. **Dark Background Cards** - Utility classes `.card-dark`, `.card-dark-lg`
3. **Encounter Boxes** - Component `<EncounterBox color="orange|red|blue">`
4. **Icon + Label Pairs** - Component `<IconLabel icon={...} label="..." />`

#### Tailwind Utilities
Add to `index.css`:
```css
@layer components {
  .card-dark { @apply bg-black/50 rounded-lg p-4; }
  .card-dark-lg { @apply bg-black/70 rounded-lg p-8; }
  .encounter-orange { @apply border-2 border-orange-500 bg-orange-900/50 p-4 rounded-lg; }
  .encounter-red { @apply border-2 border-red-500 bg-red-900/60 p-4 rounded-lg; }
  .encounter-blue { @apply border-2 border-blue-400 bg-blue-900/50 p-4 rounded-lg; }
  .heading-1 { @apply text-3xl font-bold text-yellow-400; }
  .heading-2 { @apply text-2xl font-bold text-yellow-400; }
  .heading-3 { @apply text-xl font-bold text-yellow-400 mb-2; }
  .section-box { @apply bg-red-800/50 p-4 rounded-lg; }
}
```

#### Files Most Affected (by redundancy count)
1. `Debrief.jsx` - 11 patterns (stat containers, alert boxes, grids)
2. `InvestigateTab.jsx` - 10 patterns (encounter boxes, result cards, buttons)
3. `Trial.jsx` - 8 patterns (dark cards, verdict boxes)
4. `Briefing.jsx` - 7 patterns (dark cards, section headings)
5. `DossierTab.jsx` - 6 patterns (section containers, headings)

#### Audit Checklist (When Ready)
- [ ] Add utility classes to `index.css` with `@layer components`
- [ ] Create `src/components/shared/EncounterBox.jsx` and `IconLabel.jsx`
- [ ] Replace repeated heading classes with `.heading-1/2/3`
- [ ] Replace dark background containers with `.card-dark` / `.card-dark-lg`
- [ ] Reduce unnecessary nesting in encounter/result displays
- [ ] Standardize spacing (use `mb-3` for sections, `space-y-2` for lists, `p-4` default padding)

---

### 1. Core Gameplay Fixes (Immediate Priority)
- [x] Show encounter results in the results area after gadget choice
- [x] Add "Apprehend Suspect" messaging before trial transition
- [x] Handle case where player investigates at final city without warrant issued
- [x] Clear lastEncounterResult appropriately (clears on travel)

### 1.5 Encounter System Refactor ✅
Consolidated henchman, good deed, and assassination into a unified encounter system:

**Completed:**
- [x] Created shared `useEncounterTimer` hook (`src/hooks/useEncounterTimer.js`)
- [x] Created unified `EncounterCard` component (`src/components/EncounterCard.jsx`):
  - Timer bar with urgency levels (normal/warning/critical)
  - Type-specific styling (henchman=orange, assassination=red, good deed=blue)
  - In-place result display with Continue button
- [x] Encounter flow: Active → Resolved (result shows in same card) → Dismissed
- [x] Moved encounters to dedicated area ABOVE investigation options
- [x] Removed encounter results from "Latest Activity" (only clues/sleep/rogue shown there)
- [x] Unified `handleEncounterResolve` handler in useGameState.js
- [x] Removed legacy handlers (handleGoodDeed, handleHenchmanGadget, handleAssassinationGadget)

### 2. Visual Enhancements (Next Priority)
- [x] AirportTab departure board aesthetic with boarding pass-style flight cards
- [x] Briefing screen as manila folder case file (CLASSIFIED stamp, paper clip, lined paper, DocuSign)
- [x] Trial screen courtroom aesthetic (wooden bench, verdict stamp, gavel animation)
- [x] Debrief screen report cards (trophy, promotion banner, stat sections)
- [x] Background images for locations/cities (Unsplash city photos with dark overlay)
- [ ] Travel animation (plane flying on map)
- [ ] Time advancement animation (clock ticking)
- [ ] Investigation transitions with background changes
- [ ] Sleep fade in/out animation
- [ ] Assassination slow-motion visual effects (desaturation, shake)
- [ ] Incremental "NOOOO..." speech bubble during timer

### 2.5 UI Simplification (2025-12-27)
- [x] Header spoiler removal - replaced numeric time with abstract urgency bar
- [x] Removed rank display, current time, and sleep warnings from header
- [x] LocationBanner - replaced "Stop X of Y" with dot indicators
- [x] AirportTab - removed time remaining from header (kept travel time info)
- [x] Created FadeIn transition component for smooth show/hide animations
- [x] Applied transitions to InvestigateTab (encounters, results, apprehended)
- [x] Flattened nested boxes in InvestigateTab results (single card with accent strips)
- [x] Simplified EncounterCard structure (integrated timer bar, removed nested boxes)
- [x] Unified encounter styling (consistent gray backgrounds, accent colors for type)

### 3. Evidence Board Enhancements
- [x] Cork board aesthetic with wood grain background
- [x] Polaroid-style suspect photos with slight rotations
- [x] Pushpin decorations on notes and photos
- [x] Colored note cards (yellow, blue, pink) for different info types
- [x] Suspect count display
- [ ] Red string connecting clues (optional)
- [ ] Auto-elimination animation when clues gathered

### 3.5 UX Improvements (2025-12-27)
- [x] Briefing split into two steps: Case Details → Equipment
- [x] DocuSign-style signature required before proceeding to equipment
- [x] Interactive trait selector in Dossier (tap to cycle: Gender, Hair, Hobby)
- [x] Clues displayed as quotes with city/location/time attribution
- [x] "N suspects match" counter on photo section
- [x] Photos auto-dismiss when traits are selected
- [x] Clue metadata includes timeCollected for attribution

### 4. Mobile Optimization
- [x] Static tab bar (fixed at bottom on mobile, inline on desktop)
- [x] Rearrange header elements for better mobile layout (compact 2-row design)
- [x] Better touch targets (52px minimum height on buttons)
- [x] Bottom padding on content area to clear fixed tab bar
- [ ] Swipe gestures for tab navigation
- [ ] Responsive layouts for different breakpoints
- [ ] Bottom sheet modals on mobile

### 5. Audio (Optional)
- [ ] Sound effects for actions
- [ ] Pitch-shifted "NOOOO" during assassination timer

### 6. UI Redundancy Cleanup (As We Go)
- Clean up each component as we touch it for other changes
- See detailed audit checklist above

---

## Project Structure

```
carmen-san-diego/
├── src/
│   ├── components/
│   │   ├── Game.jsx              # Main orchestrator
│   │   ├── Menu.jsx              # Title screen
│   │   ├── Briefing.jsx          # Mission briefing
│   │   ├── Header.jsx            # Top bar
│   │   ├── LocationBanner.jsx    # Current city
│   │   ├── TabBar.jsx            # Navigation tabs
│   │   ├── InvestigateTab.jsx    # Investigation + inline encounters
│   │   ├── AirportTab.jsx        # Travel destinations
│   │   ├── DossierTab.jsx        # Evidence board + warrants
│   │   ├── Trial.jsx             # Court verdict
│   │   ├── Debrief.jsx           # Post-case stats
│   │   ├── EncounterCard.jsx     # Unified inline encounters
│   │   └── GameLayout.jsx        # Layout wrapper
│   ├── hooks/
│   │   └── useGameState.js       # All game state & actions
│   └── utils/
│       ├── loadGameData.js       # YAML loading (includes gadgets, encounters)
│       ├── caseGenerator.js
│       ├── clueGenerator.js
│       ├── validation.js
│       └── helpers.js
├── config/
│   ├── settings.yaml
│   ├── cities.yaml
│   ├── suspects.yaml
│   ├── gadgets.yaml              # 6 gadgets with icons
│   ├── encounters.yaml           # Henchman + assassination encounters
│   ├── good_deeds.yaml           # Good deed + fake deed events
│   ├── rogue_actions.yaml        # Rogue investigation options
│   └── ... (other config files)
└── UI_REDESIGN_SPEC.md           # Full specification document
```

---

## Key Files for Current Work

| File | Purpose |
|------|---------|
| `src/hooks/useGameState.js` | Core game logic, encounter triggers, clue metadata |
| `src/components/InvestigateTab.jsx` | Inline encounter rendering, investigation UI |
| `src/components/DossierTab.jsx` | Evidence board, interactive trait selector, warrant |
| `src/components/Briefing.jsx` | Two-step briefing: case details → equipment |
| `src/components/Game.jsx` | Component orchestration, state routing |
| `config/encounters.yaml` | Henchman and assassination encounter definitions |
| `config/gadgets.yaml` | Gadget definitions with correct_gadget mappings |

---

## Game Flow Summary

```
MENU → BRIEFING → CITY LOOP → FINAL CITY → TRIAL → DEBRIEF

CITY LOOP (cities 1-3):
  1. Arrive at city
  2. First investigation → Henchman encounter (if correct city)
  3. Continue investigating, traveling
  4. Travel to next city (resets encounter flag)

FINAL CITY (city 4):
  1. Arrive at final city
  2. First investigation → Assassination attempt (with timer!)
  3. Survive assassination
  4. Second investigation (with warrant issued) → Apprehend → Trial
  5. Trial verdict based on warrant correctness
  6. Debrief with stats
```

---

## Design Decisions

1. **Encounters render inline** - Not full-screen modal, appears in InvestigateTab content area
2. **Warrants anytime** - Player can issue warrant at any city, but apprehension only at final city
3. **Two-investigation final city** - First = assassination, Second = apprehension
4. **First-investigation-only triggers** - Encounters don't repeat on subsequent investigations in same city
5. **Gadgets are one-use per case** - Track `usedGadgets` array, reset on new case
6. **NO SPLASH PAGES** - ALWAYS use the main content area for messages, encounters, and transitions. Never create full-screen splash components. All interactive moments (apprehended, encounters, good deeds, results) render inline in InvestigateTab.

---

## Future Ideas

### Henchman + Rescue Variation
Try a variation where henchman encounters put a bystander at risk. After the gadget puzzle, player can choose to:
- **Save them** - Costs extra time but earns karma (like good deeds)
- **Ignore them** - No time cost, no karma

This would merge the henchman encounter and good deed mechanics into a single cohesive moment, making encounters feel more dynamic and morally weighted.

### Trivia-Based Encounters (TODO: Flesh out and templatize)
Replace gadget puzzles with geography/trivia questions. Examples:
- **City ordering**: "Order these cities by population: Tokyo, Paris, Cairo" (timer running)
- **Geography facts**: "Which country does this city belong to?"
- **Capital cities**: "What is the capital of [country]?"
- **Landmark matching**: "Which city has [famous landmark]?"

**Implementation ideas:**
- Create a trivia question template system in YAML
- Question types: ordering, multiple choice, true/false, matching
- Difficulty scales with game progression
- Correct answer = no penalty, wrong = time loss
- Could replace gadgets entirely or be an alternative mode
- Timer adds pressure - wrong answer on timeout

**Data sources to add:**
- Cities with population data (for ordering)
- Countries and capitals
- Famous landmarks by city
- Regional groupings

### Hold-to-Investigate Mechanic
Replace click-to-investigate with tap-and-hold, where hold duration is proportional to the clue's time cost. This makes time cost feel tangible rather than abstract.

**Implementation ideas:**
- Hold duration = `time_cost * multiplier` (e.g., 3h clue = 1.5s hold)
- Visual progress ring fills as you hold
- Releasing early cancels the investigation
- Mobile: long-press gesture with haptic feedback
- Desktop: click-and-hold with mouse
- Could show "investigating..." animation during hold
- Adds physicality to the time investment decision

**Benefits:**
- Time cost becomes a felt experience, not just a number
- Creates natural moments of tension/commitment
- Prevents accidental clicks
- Mobile-friendly interaction pattern
