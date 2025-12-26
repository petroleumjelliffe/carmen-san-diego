# Carmen Sandiego - Quick Reference Guide

## 📱 New UI Structure (Mobile-First)

```
┌─────────────────────────┐
│ 📍 Tokyo  │  ⏰ 48h     │ ← Top Panel
├─────────────────────────┤
│                         │
│   Main Content Area     │ ← Background images + content
│   (City/Location)       │
│                         │
├─────────────────────────┤
│ [🔍] [✈️] [📋]         │ ← Bottom Nav
└─────────────────────────┘
```

## 🎮 Game Flow States

1. **BRIEFING** → Shows case + gadgets
2. **AT CITY** → Investigate locations
3. **HENCHMAN** → Gadget puzzle (mid-game)
4. **TRAVELING** → Animated plane flight
5. **SLEEPING** → Forced at 11pm
6. **ASSASSINATION** → Gadget puzzle (final city)
7. **CATCH** → Automatic arrest
8. **WARRANT** → Conspiracy board
9. **TRIAL** → Verdict reveal
10. **DEBRIEF** → Stats + promotion

## 🔧 Gadget System

### The 6 Gadgets
| Gadget | Icon | Best For |
|--------|------|----------|
| Smoke Bomb | 💨 | Escapes, tailing |
| X-Ray Glasses | 👓 | Detecting traps |
| Shoe Phone | 📱 | Calling backup |
| Laser Watch | ⚡ | Cutting/locked doors |
| Grappling Hook | 🎯 | Vertical movement |
| Antidote Pills | 💊 | Poison/gas |

### How It Works
1. Encounter happens (random type)
2. Player sees 3-4 gadget options
3. Choose correct gadget = 0 hours lost
4. Choose wrong gadget = 4-6 hours lost
5. Choose no gadget = 6-8 hours lost
6. Each gadget is **single-use** per case

### Reading the Clues
- **"Following through market"** → Escape needed (💨)
- **"Rigged with trap"** → Detection needed (👓)
- **"Surrounded by goons"** → Backup needed (📱)
- **"Locked room"** → Cutting needed (⚡)
- **"Rooftop sniper"** → Vertical access needed (🎯)
- **"Poisoned drink"** → Antidote needed (💊)

## 📋 Conspiracy Board (Guess Who Style)

### Layout
```
[👤] [👤] [❌] [👤]  ← Suspect photos (2x4 grid)
[👤] [❌] [👤] [❌]

📌 CLUES:
✓ "The suspect is male"
✓ "Dark hair"
❓ Hobby: Unknown

[ISSUE WARRANT]
```

### How It Works
1. Start with all 8 suspects visible
2. Gather clues from investigations
3. System auto-eliminates non-matching suspects with red X
4. Player can manually X out suspects (tap to toggle)
5. When ready, select remaining suspect and issue warrant
6. Confidence shown based on how many remain

### Traits System
- **Gender**: Male / Female
- **Hair**: Dark / Light
- **Hobby**: Intellectual / Physical

All 8 combinations = 8 suspects exactly

## ⏰ Time Management

### Time Costs
- **Investigation**: 2-8 hours (varies by location)
- **Travel**: 4 hours
- **Sleep**: 7 hours (11pm → 6am)
- **Wrong gadget**: 4-6 hours
- **No gadget**: 6-8 hours

### Total Time: 72 hours (Normal difficulty)

### Sleep Mechanic
- Triggers automatically at 11pm
- Forces 7-hour rest (advance to 6am)
- Creates day/night cycle
- Adds urgency to investigations

## 🗺️ Investigation Locations

Each city has 3 investigation spots:

1. **Local Informant** (2h)
   - Gives: Destination + Suspect clues
   - Best value for information

2. **Police Station** (4h)
   - Gives: Destination clues only
   - More time, less info

3. **Street Vendor** (6h)
   - Gives: Destination clues only
   - Slowest option

## 🎯 Encounter Types

### Henchman (Mid-Game)
- Street Tailing → 💨 Smoke Bomb
- Alley Ambush → 💨 Smoke Bomb
- Booby Trap → 👓 X-Ray Glasses
- Suspicious Package → 👓 X-Ray Glasses
- Surrounded by Goons → 📱 Shoe Phone
- Police Interrogation → 📱 Shoe Phone

### Assassination (Final City)
- Rooftop Sniper → 🎯 Grappling Hook
- Building Escape → 🎯 Grappling Hook
- Poisoned Drink → 💊 Antidote Pills
- Nerve Gas → 💊 Antidote Pills
- Locked Room → ⚡ Laser Watch
- Tied Up → ⚡ Laser Watch

## 📊 Win/Lose Conditions

### Win Conditions
1. ✓ Reach final city before time runs out
2. ✓ Gather enough clues to identify suspect
3. ✓ Issue warrant for correct suspect
4. ✓ Trial verdict: GUILTY

### Lose Conditions
1. ✗ Time runs out (0 hours remaining)
2. ✗ Issue warrant for wrong suspect → NOT GUILTY verdict

## 🏆 Progression System

### Ranks
- **Rookie**: 0 cases
- **Gumshoe**: 1 case
- **Sleuth**: 3 cases
- **Inspector**: 5 cases
- **Detective**: 8 cases
- **Senior Detective**: 12 cases
- **Chief Inspector**: 17 cases
- **Master Detective**: 25 cases

### Difficulty Levels
- **Easy**: 96 hours, 3 cities
- **Normal**: 72 hours, 4 cities (default)
- **Hard**: 48 hours, 5 cities

## 🎨 Visual Design Elements

### Color Scheme
- **Background**: Red gradient (retro Carmen theme)
- **Accent**: Yellow/gold
- **Danger**: Red/orange
- **Success**: Green
- **Info**: Blue

### Animations
- Time advancing: Clock rotation + number increment
- Travel: Plane moving across map
- Clue reveal: Sticky note slides in
- Elimination: Red X stamp effect
- Transitions: 300ms smooth fades

### Background Images
- **Briefing**: HQ office
- **Cities**: Skylines/landmarks
- **Investigations**: Location interiors
- **Travel**: World map
- **Sleep**: Hotel room
- **Trial**: Courtroom
- **Evidence**: Cork board

## 🎯 Strategy Tips

### Optimal Play
1. **Always investigate Local Informant first** (best info/time ratio)
2. **Save gadgets** until you understand the encounter
3. **Read encounter text carefully** for hints
4. **Don't sleep if close to time limit** (plan investigations before 11pm)
5. **Gather all 3 suspect traits** before final city
6. **Use evidence board** to eliminate suspects as you go

### Resource Management
- 6 gadgets per case, 2 encounters typically
- Can complete without using any (higher time cost)
- Wrong gadget use teaches you for next playthrough

### Risk vs Reward
- Fast investigations (2h) = less likely to get all clues
- Slow investigations (6h) = thorough but time-consuming
- Wrong city = dead ends, waste of time
- Read destination clues carefully before traveling

## 📁 Config Files

### Required YAML Files
1. `cities.yaml` - City data
2. `destination_clues.yaml` - Clues pointing to cities
3. `suspect_clues.yaml` - Clues about suspect traits
4. `investigation_spots.yaml` - Investigation locations
5. `suspects.yaml` - 8 suspects with traits
6. `stolen_items.yaml` - What was stolen
7. `assassination_attempts.yaml` - Final city encounters
8. `ranks.yaml` - Progression ranks
9. `dead_ends.yaml` - Wrong city responses
10. `final_city_clues.yaml` - Final city investigation text
11. **NEW:** `gadgets.yaml` - Gadget definitions
12. **NEW:** `encounters.yaml` - Henchman & assassination encounters

## 🚀 Implementation Priority

### Phase 1: UI Structure ⭐ START HERE
- [ ] Panel layout (top/main/bottom)
- [ ] Responsive breakpoints
- [ ] Background image system
- [ ] Bottom navigation
- [ ] Basic state transitions

### Phase 2: Game States
- [ ] Briefing screen
- [ ] Sleeping state + trigger
- [ ] Henchman encounters
- [ ] Assassination attempts
- [ ] Catch suspect
- [ ] Trial screen

### Phase 3: Conspiracy Board
- [ ] Suspect photo grid
- [ ] Auto-elimination logic
- [ ] Manual toggle (X out)
- [ ] Clue display
- [ ] Warrant issuance

### Phase 4: Gadget System
- [ ] Gadget inventory state
- [ ] Encounter type selection
- [ ] Gadget choice UI
- [ ] Success/failure feedback
- [ ] Time penalty logic

### Phase 5: Animations & Polish
- [ ] Time advancement animation
- [ ] Travel animation
- [ ] Clue reveal animations
- [ ] Sleep transitions
- [ ] Touch interactions

---

**Ready to implement?** Start with Phase 1: UI Structure!

See `UI_REDESIGN_SPEC.md` for detailed specifications.
