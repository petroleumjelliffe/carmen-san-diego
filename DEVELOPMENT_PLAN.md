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

### 2. Visual Enhancements (Next Priority)
- [ ] Background images for locations/cities
- [ ] Travel animation (plane flying on map)
- [ ] Time advancement animation (clock ticking)
- [ ] Investigation transitions with background changes
- [ ] Sleep fade in/out animation
- [ ] Assassination slow-motion visual effects (desaturation, shake)
- [ ] Incremental "NOOOO..." speech bubble during timer

### 3. Evidence Board Enhancements
- [ ] Cork board aesthetic with polaroid-style photos
- [ ] Red string connecting clues (optional)
- [ ] Auto-elimination animation when clues gathered
- [ ] Confidence rating based on remaining suspects

### 4. Mobile Optimization
- [ ] Swipe gestures for tab navigation
- [ ] Better touch targets (44px minimum)
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
│   │   ├── HenchmanEncounter.jsx # Full-screen (legacy)
│   │   ├── AssassinationAttempt.jsx # Full-screen (legacy)
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
| `src/hooks/useGameState.js` | Core game logic, encounter triggers, state management |
| `src/components/InvestigateTab.jsx` | Inline encounter rendering, investigation UI |
| `src/components/DossierTab.jsx` | Evidence board, warrant issuance |
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

---

## Future Ideas

### Henchman + Rescue Variation
Try a variation where henchman encounters put a bystander at risk. After the gadget puzzle, player can choose to:
- **Save them** - Costs extra time but earns karma (like good deeds)
- **Ignore them** - No time cost, no karma

This would merge the henchman encounter and good deed mechanics into a single cohesive moment, making encounters feel more dynamic and morally weighted.
