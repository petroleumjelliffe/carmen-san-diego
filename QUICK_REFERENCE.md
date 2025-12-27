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
2. **AT CITY** → Investigate locations (with unified results display)
3. **GOOD DEED** → Optional NPC help (builds karma) ✅ IMPLEMENTED
4. **ROGUE OPTION** → Optional destructive shortcut (builds notoriety) ✅ IMPLEMENTED
5. **HENCHMAN** → Gadget puzzle (mid-game)
6. **TRAVELING** → Animated plane flight
7. **ASSASSINATION** → Gadget puzzle (final city)
8. **NPC RESCUE** → Saved NPC may appear and save you!
9. **CATCH** → Automatic arrest
10. **WARRANT** → Conspiracy board
11. **TRIAL** → Verdict reveal
12. **DEBRIEF** → Stats + promotion (clean/dirty/pragmatic)

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
- **Good Deed**: 2-4 hours (optional!)
- **Wrong gadget**: 4-6 hours
- **No gadget**: 6-8 hours

### Total Time: 72 hours (Normal difficulty)

### Sleep Mechanic ✅ IMPLEMENTED
- Triggers automatically when any action crosses 11pm
- Forces 7-hour rest (advance to 6am)
- Notification appears in unified results area (no separate screen)
- Creates day/night cycle
- Adds urgency to investigations

## ❤️ Karma System (Good Deeds)

### How It Works
1. **Random encounter**: 25% chance during correct city investigation
2. **Help NPC**: Costs 2-4 hours, NPC is saved
3. **Persists across cases**: Saved NPCs remembered in profile
4. **Payoff**: May save you during assassination attempts in future cases

### Good Deed Types
- Burning cart → Save vendor's merchandise
- Child in traffic → Save child from cars
- Lost wallet → Return wallet across town
- Elderly groceries → Carry bags up stairs
- Stop pickpocket → Recover stolen camera
- Lost traveler → Guide to destination
- Injured animal → Help vet save dog
- Falling scaffolding → Save worker

### Rescue Chances
- **1 NPC saved**: 30% chance of rescue
- **2+ NPCs saved**: 60% chance of rescue
- **5+ NPCs saved**: 100% chance of rescue (guaranteed!)
- Each NPC can only save you once

### Strategic Decision
**RISK**: Costs precious time, might miss deadline
**REWARD**: Might save your life in future case

**The Dilemma**: Help now and risk failing current case, or ignore and risk assassination later?

### ⚠️ Fake Good Deed Traps (High Karma Penalty)
**Trigger**: When karma ≥ 5 (helped 5+ NPCs)
**Chance**: 25% of good deed encounters are syndicate traps
**The Syndicate's Revenge**: They study your patterns and exploit your predictability

**What Happens**:
- Appears identical to real good deed (no way to tell!)
- Tasks take WAY longer (8 hours vs normal 2-4 hours)
- Always include "saving every cat in the burning house" escalation
- 75% chance of permanent injury
- Creates paranoia: "Is this one real or another trap?"

**Example Traps**:
- Burning building → Collapses on you → Limp (+2h to all investigations)
- Elderly person → Leads to ambush → Broken hand (gadgets 2x slower)
- Drowning child → Chemical trap → Scarred lungs (+1h to all time costs)
- Lost child → Syndicate beating → Head trauma (33% miss clues)
- Scaffolding → Debris falls → Eye patch (miss visual clues)
- Poisoned vendor → Contamination → Nerve damage (25% gadget failure)

**Prevention**:
- Keep karma below 5 (stop helping after 4 good deeds)
- Build notoriety (syndicate fears you, won't bait)
- Accept the risk and help anyway (paranoid detective path)

## 🔥 Notoriety System (Rogue Actions)

### How It Works
1. **Optional choice**: Alternative to normal investigation/travel that saves time
2. **Destructive methods**: Break rules, threaten, bribe, or use violence
3. **Persists across cases**: Notoriety level remembered in profile
4. **Consequences**: Closes off options, harder trials, bad endings

### Rogue Action Types
- Threaten Informant → Save 2h (informant unavailable in future)
- Break Into Police → Save 4h (police cooperation ends forever)
- Steal Vehicle → Save 4h (wanted status, police pursuit)
- Rough Up Witness → Save 6h (witness can't testify, harder trial)
- Plant Evidence → Save 0h (wrongful conviction risk, termination chance)
- Bribe Security → Save 7h (skip sleep, gadget lost to debts)
- Destroy Property → Save 3h (arson, suspension risk)
- Fake Credentials → Save 4h (countries refuse entry)
- Intimidate Suspect → Save 0h (confession inadmissible, brutality charges)

### Notoriety Tiers
- **Low (1-2 actions)**: ⭐ - 1 investigation option unavailable, Chief's warning
- **Medium (3-5 actions)**: ⭐⭐ - 2 options unavailable, +1 evidence needed, NPCs fear you, promotion denied
- **High (6+ actions)**: ⭐⭐⭐ - 3 options unavailable, perfect evidence needed, police pursue you, 33% suspension risk, **bad ending even if you win**

### Strategic Decision
**REWARD**: Save precious time, guaranteed results
**RISK**: Burn bridges, face consequences, corruption path

**The Dilemma**: Get results fast and risk your career, or play clean and risk running out of time?

### Cross-Pollination with Karma
- **High Karma (≥3)**: Reduces notoriety gain by 50% (reputation protects you)
- **Very High Karma (≥5)**: Syndicate sets fake good deed traps (predictable = exploitable)
- **High Notoriety (≥3)**: NPCs refuse good deed opportunities (nobody trusts you)
- **Redemption Path**: 5 good deeds with notoriety ≥3 → Reset to 0
- **Corruption Path**: 5 rogue actions with karma ≥3 → Reputation shattered, reset to 0

### The Optimal Balance
- **Karma Sweet Spot**: 3-4 good deeds (60% rescue chance, no fake traps)
- **Notoriety Sweet Spot**: 1-2 rogue actions (some shortcuts, no death spiral)
- **Both extremes are dangerous**: Too good OR too bad = injuries & consequences
- **Pragmatic Detective**: Know when to help, when to cut corners, when to walk away

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

### Assassination (Final City) ⚠️ TIME PRESSURE!
**ALL have 5-8 second timer with slow-mo effect**
- Rooftop Sniper → 🎯 Grappling Hook (5s)
- Falling Safe → 🎯 Grappling Hook (5s)
- Poisoned Drink → 💊 Antidote Pills (6s)
- Locked Room → ⚡ Laser Watch (7s)
- Ticking Bomb → 👓 X-Ray Glasses (5s)
- Knife Assassin → 💨 Smoke Bomb (6s)

**Timer Features**:
- Slow motion visuals (desaturated)
- Speech bubble: "N..." → "NOOOOOO!"
- Progress bar counting down
- Screen shake intensifies
- Timeout = "no gadget" penalty (8h)

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
13. **NEW:** `good_deeds.yaml` - Karma system NPC encounters + fake good deed traps
14. **NEW:** `rogue_actions.yaml` - Notoriety system destructive options

## 🚀 Implementation Priority (MECHANICS FIRST!)

### Phase 1: Minimal Viable UI ⭐ START HERE
**Goal**: Get basic game loop working with zero polish
- [ ] Simple 3-panel layout (top/main/bottom) - text only
- [ ] Basic state machine (briefing → city → travel → trial)
- [ ] Time tracking system
- [ ] Navigation between states
- [ ] Simple button-based UI (no animations yet)

**Deliverable**: You can play through one case start-to-finish

---

### Phase 2: Core Investigation Loop
**Goal**: Make the detective work functional
- [ ] Investigation options (informant/police/vendor)
- [ ] Clue gathering and storage
- [ ] Destination selection (travel between cities)
- [ ] Dead ends vs correct cities
- [ ] Sleep trigger at 11pm (simple time check)
- [ ] Basic conspiracy board (8 suspects, manual elimination)
- [ ] Auto-elimination based on clues
- [ ] Warrant issuance
- [ ] Trial verdict (correct/wrong)
- [ ] Basic debrief with stats

**Deliverable**: Core gameplay loop is complete and winnable

---

### Phase 3: Karma & Notoriety Systems 🎯 **THE INNOVATION**
**Goal**: Test the dual-pressure mechanics ASAP - this is what makes the game unique!
- [x] Good deed random encounters (25% chance) ✅
- [x] Good deed choice UI (state-based full-screen) ✅
- [x] **Fake good deed traps (karma ≥5 trigger)** ✅
- [x] **Permanent injury system (6 injury types)** ✅
- [ ] **Injury effects on gameplay** (time penalties, gadget failures, missed clues)
- [x] **Paranoia text on good deeds after first trap** ✅
- [x] **Unified results display** (all results in one area above actions) ✅
- [x] **Auto-sleep system** (no separate state, notification only) ✅
- [x] Rogue action options (4th investigation option) ✅
- [x] Notoriety tracking ✅
- [ ] Notoriety tier consequences (investigation unavailability, trial difficulty)
- [ ] Cross-pollination logic (karma reduces notoriety, notoriety blocks good deeds)
- [ ] LocalStorage persistence across cases
- [x] Debrief component exists ✅
- [ ] Three debrief variants (clean/dirty/pragmatic/injured)
- [x] NPC save tracking in player profile ✅
- [ ] NPC rescue logic during assassinations (basic)

**Deliverable**: Can test if the paranoia/death spiral mechanics are fun ← CRITICAL TEST

---

### Phase 4: Gadget Encounters
**Goal**: Add tactical challenge
- [ ] Gadget inventory
- [ ] Henchman encounters (no timer, simple choice)
- [ ] Assassination attempts (WITH simple countdown timer)
- [ ] Gadget success/failure outcomes
- [ ] Time penalty logic
- [ ] NPC rescue dramatic reveal

**Deliverable**: Full tactical gameplay with life-or-death decisions

---

### Phase 5: Polish & "Good Friction" 🎨
**Goal**: Make it feel cinematic (ONLY after mechanics are proven fun)
- [ ] Assassination timer with slow-motion visuals
- [ ] "NOOOO" speech bubble animation (incremental)
- [ ] Time advancement animations
- [ ] Travel/plane animation
- [ ] Sleep transitions (fade to black)
- [ ] Background images for cities
- [ ] Cork board aesthetic for conspiracy board
- [ ] Pitch-shifted "noooo" audio
- [ ] Screen shake effects
- [ ] Touch interactions polish
- [ ] Responsive breakpoints refinement

**Deliverable**: Game feels polished and dramatic

---

## 🧪 Testing Milestones

**After Phase 1**: Can I click through a case?
**After Phase 2**: Can I win a case by solving clues? ← First real playtest
**After Phase 3**: Is the dual-pressure system fun? Does paranoia feel good? ← MAKE OR BREAK TEST
**After Phase 4**: Do gadgets add tension?
**After Phase 5**: Does it look/feel cinematic?

---

**Ready to implement?** Start with Phase 1: UI Structure!

See `UI_REDESIGN_SPEC.md` for detailed specifications.
