# Carmen Sandiego - UI Redesign & Game Flow Specification

## Design Goals
1. **Mobile-first responsive design**
2. **Add meaningful friction** to create tension and pacing
3. **Visual storytelling** through backgrounds and animations
4. **Gadget mechanics** for strategic gameplay

---

## UI Layout Structure

### Panel Layout (Mobile-Optimized)

```
┌─────────────────────────────────────┐
│  TOP PANEL - Status Bar             │
│  📍 Tokyo, Japan    ⏰ 48h remaining│
└─────────────────────────────────────┘
┌─────────────────────────────────────┐
│                                     │
│  MAIN CONTENT AREA                  │
│  (Background: City/Location Image)  │
│                                     │
│  [Dynamic Content Based on State]   │
│  - Investigation results            │
│  - Airport map & destinations       │
│  - Evidence board                   │
│  - Briefing text                    │
│  - Cutscenes                        │
│                                     │
└─────────────────────────────────────┘
┌─────────────────────────────────────┐
│  BOTTOM MENU - Action Options       │
│  [🔍 Investigate] [✈️ Travel] [📋 Evidence]
└─────────────────────────────────────┘
```

### Component Breakdown

#### Top Panel (Fixed Header)
- **Left**: Current location (city name, country)
- **Right**: Time remaining (hours, with warning state when low)
- **Mobile**: Single line, condensed info
- **Desktop**: More spacing, can show additional info

#### Main Content Area (Scrollable)
- **Background Image**: Changes based on:
  - Current city (city skyline/landmark)
  - Investigation location (informant office, police station, etc.)
  - Game state (briefing room, airplane, courtroom)
- **Content Overlay**: Semi-transparent panel with current state content
- **Responsive**: Full viewport height minus header/footer
- **Scroll behavior**: Vertical scroll for longer content

#### Bottom Menu (Fixed Footer)
- **Three primary actions**:
  - 🔍 **Investigate**: Open investigation options
  - ✈️ **Travel**: Open airport/travel screen
  - 📋 **Evidence**: Open evidence board/dossier
- **Active state**: Highlight current view
- **Mobile**: Icon + small label, touch-friendly (min 44px tap target)
- **Desktop**: Icon + full label, hover states

---

## Enhanced Game States & Flow

### 1. BRIEFING
**When**: Start of new case
**Background**: ACME Detective Agency headquarters

**Content**:
```
┌─────────────────────────────────────┐
│  CASE FILE #1847                    │
│                                     │
│  STOLEN: The Crown Jewels           │
│  LOCATION: London, England          │
│  DEADLINE: 72 hours                 │
│                                     │
│  DESCRIPTION:                       │
│  Priceless gems stolen from the     │
│  Tower of London. Intelligence      │
│  suggests the Shadow Syndicate.     │
│                                     │
│  MISSION EQUIPMENT:                 │
│  💨 Smoke Bomb - Quick escapes      │
│  👓 X-Ray Glasses - See hidden      │
│  📱 Shoe Phone - Call for backup    │
│  ⚡ Laser Watch - Precision cutting │
│  🎯 Grappling Hook - Scale buildings│
│  💊 Antidote Pills - Counter poison │
│                                     │
│  Use wisely - each gadget works     │
│  only once per mission!             │
│                                     │
│  [ACCEPT MISSION]                   │
└─────────────────────────────────────┘
```

**Actions**:
- "Accept Mission" button → Transition to first city

**New Mechanics**:
- **Gadgets**: Player starts with limited-use gadgets
- Shows mission details clearly

---

### 2. AT A CITY (Investigation Phase)
**When**: Player is in a city and can investigate
**Background**: Current city skyline or iconic landmark

**Content**:
```
┌─────────────────────────────────────┐
│  Select Investigation Location:     │
│                                     │
│  [👤 Local Informant]      ⏰ 2h   │
│   Suspect info + Destination        │
│                                     │
│  [🚔 Police Station]       ⏰ 4h   │
│   Destination clue only             │
│                                     │
│  [🛒 Street Vendor]        ⏰ 6h   │
│   Destination clue only             │
│                                     │
│  Time: 48h remaining                │
└─────────────────────────────────────┘
```

**After Selection**: **Animate time advancing**
- Show clock ticking forward
- Show investigation scene (background changes to location interior)
- Reveal clue with text animation
- Update time remaining
- Return to city view

**States**:
- Before investigation: Show options
- During investigation: Show animation (1-2 seconds)
- After investigation: Show results, then return to options

---

### 3. ON THE RIGHT TRACK (Henchman Encounter)
**When**: First investigation in a CORRECT city (not final city)
**Background**: City location + shadowy figure overlay

**Mechanics**:
- Random henchman encounter type selected (Street Tailing, Booby Trap, or Surrounded by Goons)
- Player must choose correct gadget or face time penalty
- See detailed gadget system below for encounter types and correct gadgets

**Example Flow**:
1. Player investigates at correct city
2. Henchman encounter triggers (see Gadget System section for full UI)
3. Player selects gadget or chooses to risk it
4. Result shown (success/failure with time impact)
5. Continue to investigation results

---

### 4. TRAVELING (Between Cities)
**When**: Player selects destination from airport
**Background**: World map with plane route animation

**Content**:
```
┌─────────────────────────────────────┐
│                                     │
│       [Animated plane on map]       │
│                                     │
│  Flying to Tokyo, Japan...          │
│                                     │
│  ⏰ +4 hours                        │
│                                     │
└─────────────────────────────────────┘
```

**Animation**:
- Plane icon moves from current city to destination
- Time counter increments
- Duration: 2-3 seconds
- Auto-advances to destination city when done

**Note**: If time reaches 11pm during travel, skip to SLEEPING state

---

### 5. SLEEPING
**When**: Time reaches 11pm (23:00) and player is not traveling
**Background**: Hotel room or dark cityscape

**Content**:
```
┌─────────────────────────────────────┐
│                                     │
│         💤 NIGHTFALL                │
│                                     │
│  It's 11 PM. Time to rest.          │
│                                     │
│  [Sleep] - Advance to 6 AM (+7h)    │
│                                     │
└─────────────────────────────────────┘
```

**Mechanics**:
- Forced rest period at 11pm
- Advances time to 6am next day (7 hours)
- Adds daily rhythm to gameplay
- Creates pressure to use time wisely

**Animation**:
- Fade to black
- Show sleeping/time advancing
- Fade in to morning

---

### 6. ASSASSINATION ATTEMPT (Final City)
**When**: First investigation option at FINAL CITY
**Background**: City location with danger overlay

**Mechanics**:
- Random assassination attempt type selected (Rooftop Sniper, Poisoned Drink, or Locked Room)
- Higher stakes than henchman encounters (more time lost if wrong)
- Player must choose correct gadget or face larger time penalty
- See detailed gadget system below for assassination types and correct gadgets

**Example Flow**:
1. Player arrives at final city and investigates
2. Assassination attempt triggers (see Gadget System section for full UI)
3. Player selects gadget or chooses to risk it
4. Result shown (success/failure with time impact)
5. Continue to investigation results
6. Signals player is close to suspect

---

### 7. CATCH SUSPECT
**When**: After surviving assassination attempt at FINAL CITY
**Background**: Dramatic action scene

**Content**:
```
┌─────────────────────────────────────┐
│                                     │
│  🎯 TARGET SPOTTED!                 │
│                                     │
│  You see the suspect attempting to  │
│  flee with the stolen item!         │
│                                     │
│  After a tense chase through the    │
│  streets, you corner them in an     │
│  alley. Time to make the arrest!    │
│                                     │
│  [Continue]                         │
└─────────────────────────────────────┘
```

**Mechanics**:
- Automatic capture after surviving assassination attempt
- No gadget choice (gadgets were used in encounters)
- Dramatic cutscene showing pursuit and capture
- Brief animation showing handcuffs/arrest

**After Capture**: Proceed to GET WARRANT / Evidence Board

---

### 8. GET WARRANT (Evidence Board)
**When**: After catching suspect OR from Evidence menu if at final city
**Background**: ACME office/evidence room with conspiracy board

**Mechanics**:
- Uses the Conspiracy Board interface (see Evidence Board section above)
- Player has eliminated suspects based on gathered clues
- Remaining non-eliminated suspects are shown
- Player taps to select which suspect to arrest
- Confidence rating shown based on how many suspects remain
- Issue warrant → Proceed to TRIAL

**Flow**:
1. Evidence board opens automatically after catching suspect
2. Shows all suspects with eliminations from clues
3. Player reviews remaining suspects
4. Player taps "ISSUE WARRANT" button
5. Confirmation modal shows selected suspect
6. Proceed to TRIAL

**See "Evidence Board - Conspiracy Style" section above for full UI details**

---

### 9. TRIAL
**When**: After issuing warrant
**Background**: Courtroom

**Content** (If Correct):
```
┌─────────────────────────────────────┐
│  ⚖️  TRIAL VERDICT                  │
│                                     │
│  The People vs. Viktor Blackwood    │
│                                     │
│  Evidence presented:                │
│  ✓ Matching physical description    │
│  ✓ Witnessed at crime scenes        │
│  ✓ Recovered stolen goods           │
│                                     │
│  VERDICT: GUILTY                    │
│                                     │
│  [Continue]                         │
└─────────────────────────────────────┘
```

**Content** (If Wrong):
```
┌─────────────────────────────────────┐
│  ⚖️  TRIAL VERDICT                  │
│                                     │
│  The People vs. Marcus Stone        │
│                                     │
│  Defense argues:                    │
│  ✗ Alibi confirmed                  │
│  ✗ Wrong physical description       │
│  ✗ No connection to crime           │
│                                     │
│  VERDICT: NOT GUILTY                │
│                                     │
│  The real culprit was:              │
│  Viktor Blackwood                   │
│                                     │
│  [Continue]                         │
└─────────────────────────────────────┘
```

**Mechanics**:
- Shows courtroom drama
- Reveals whether warrant was correct
- If wrong, shows who the real culprit was
- Proceed to DEBRIEF

---

### 10. DEBRIEF
**When**: After trial
**Background**: ACME office

**Content** (Success):
```
┌─────────────────────────────────────┐
│  ✅ CASE CLOSED                     │
│                                     │
│  Excellent work, Detective!         │
│                                     │
│  Time remaining: 12 hours           │
│  Cities visited: 4/4 (perfect)      │
│  Gadgets used: 2/3                  │
│                                     │
│  PROMOTION!                         │
│  Rookie → Gumshoe                   │
│                                     │
│  Cases solved: 1                    │
│  Rank: Gumshoe                      │
│                                     │
│  [New Case] [Main Menu]             │
└─────────────────────────────────────┘
```

**Content** (Failure):
```
┌─────────────────────────────────────┐
│  ❌ CASE FAILED                     │
│                                     │
│  The suspect escaped justice.       │
│                                     │
│  Reason: Wrong suspect arrested     │
│                                     │
│  Time used: 68/72 hours             │
│  Cities visited: 4/4                │
│                                     │
│  Better luck next time, Detective.  │
│                                     │
│  Cases solved: 0                    │
│  Rank: Rookie                       │
│                                     │
│  [Try Again] [Main Menu]            │
└─────────────────────────────────────┘
```

**Mechanics**:
- Shows stats from case
- Shows promotion if earned (solved case)
- Options to continue or return to menu

---

## Evidence Board - Conspiracy Style (Accessible Anytime)

**When**: Player taps "Evidence" in bottom menu
**Background**: Cork board with pushpins, red string, and photos (conspiracy aesthetic)

### Layout: Suspect Photo Grid (Guess Who Style)

**Content**:
```
┌─────────────────────────────────────────────────┐
│  🔍 CONSPIRACY BOARD                            │
│  Case: The Crown Jewels  │  Time: 48h remaining │
├─────────────────────────────────────────────────┤
│  SUSPECTS:                                      │
│                                                 │
│  ┌─────┐  ┌─────┐  ┌─────┐  ┌─────┐           │
│  │[👤]│  │[👤]│  │  ❌  │  │[👤]│           │
│  │Vik  │  │Marc │  │ Seb  │  │Dim  │           │
│  │ tor │  │ us  │  │(OUT) │  │itri │           │
│  └─────┘  └─────┘  └─────┘  └─────┘           │
│   Male     Male     Male     Male              │
│   Dark     Dark     Light    Light             │
│   Intel    Phys     Intel    Phys              │
│                                                 │
│  ┌─────┐  ┌─────┐  ┌─────┐  ┌─────┐           │
│  │[👤]│  │  ❌  │  │[👤]│  │  ❌  │           │
│  │ Mei │  │Nat   │  │Scar │  │Isa  │           │
│  │ Lin │  │(OUT) │  │lett │  │(OUT)│           │
│  └─────┘  └─────┘  └─────┘  └─────┘           │
│  Female   Female   Female   Female             │
│   Dark     Dark     Light    Light             │
│   Intel    Phys     Intel    Phys              │
│                                                 │
│  [Tap suspect to eliminate/restore]            │
├─────────────────────────────────────────────────┤
│  📌 CLUES GATHERED:                             │
│                                                 │
│  ✓ "The suspect is male"                       │
│    (Eliminated: Mei, Natasha, Scarlett, Isabella)
│                                                 │
│  ✓ "I saw light-colored hair"                  │
│    (Eliminated: Viktor, Marcus, Mei, Natasha)  │
│                                                 │
│  ❓ Hobby: Unknown                              │
│                                                 │
│  🗺️ Trail: London → Paris → Tokyo             │
│                                                 │
│  🔧 Gadgets: 💨🔧 👓✓ 📱✓ ⚡✓ 🎯✓ 💊✓         │
│     (✓ = available, 🔧 = used)                 │
├─────────────────────────────────────────────────┤
│  [ ISSUE WARRANT ] (2 suspects remaining)      │
└─────────────────────────────────────────────────┘
```

### Interactive Elements

#### Suspect Photo Cards
Each suspect card shows:
- **Photo/Avatar**: Mugshot-style portrait (placeholder or actual image)
- **Name**: First name prominent
- **Traits**: Small text below (Gender, Hair, Hobby)
- **Status**:
  - Active (full color, tappable)
  - Eliminated (greyed out with red X, can tap to restore)
  - Highlighted (pulsing border if only one remaining)

#### Tap Interaction
- **Tap suspect card** → Toggle eliminated/active state
- **Long press** → Show full suspect details modal
- **Auto-elimination**: When clue is gathered, suspects are auto-eliminated with animation
  - Red X fades in over photo
  - Brief highlight shows which suspects were eliminated
  - Undo button appears briefly

#### Visual Feedback
```
Example after gathering "The suspect is male" clue:

All female suspects get:
┌─────┐
│  ❌  │ ← Red X overlay
│Nat  │
│(OUT)│ ← Status text
└─────┘
  Greyed out

With notification:
"4 suspects eliminated based on new evidence!"
```

### Auto-Deduction System

**When clue is collected**:
1. System identifies matching trait
2. Animates elimination of non-matching suspects (one by one, 200ms each)
3. Shows which clue caused elimination
4. Updates remaining suspect count

**Manual Override**:
- Player can tap to re-include eliminated suspect (if they disagree)
- Player can eliminate suspects manually (making notes/guesses)
- Warning if player eliminates ALL suspects

### Clue Organization

**Destination Clues** (Collapsible Section):
```
📍 DESTINATION CLUES (5):
  • "Asked about cherry blossoms"
  • "Booked flight to Narita"
  • "Mentioned bullet trains"
  • "Wanted to visit Shibuya"
  • "Learning Japanese phrases"
```

**Suspect Clues** (Always Visible):
```
🔍 SUSPECT DESCRIPTION:
  ✓ Gender: Male
  ✓ Hair: Light colored
  ❓ Hobby: Unknown

  Remaining suspects: 2
  Confidence: ⭐⭐ (Need more clues!)
```

### Warrant Issuance

**At Final City** (after catching suspect):
```
┌─────────────────────────────────────┐
│  ⚖️  ISSUE ARREST WARRANT            │
│                                     │
│  Based on your evidence, select     │
│  the suspect to arrest:             │
│                                     │
│  ┌─────┐              ┌─────┐      │
│  │[👤]│              │[👤]│      │
│  │Seb  │              │Dim  │      │
│  │⭐⭐⭐│              │⭐⭐⭐│      │
│  └─────┘              └─────┘      │
│  Sebastian           Dimitri       │
│  Frost              Volkov         │
│                                     │
│  Male, Light, Intel  Male, Light, Phys
│                                     │
│  [SELECT]            [SELECT]      │
│                                     │
│  Confidence: HIGH                   │
│  (All traits identified)            │
└─────────────────────────────────────┘
```

**If too many suspects remain**:
```
⚠️  WARNING: 4 suspects still possible!
Recommended: Gather more clues before issuing warrant.

Risk proceeding anyway? (25% chance of success)
```

### Visual Design Details

#### Cork Board Aesthetic
- **Background**: Cork texture or tan/brown bulletin board
- **Photos**: Polaroid-style frames or mugshot cards
- **Pins**: Red pushpins at top of each photo
- **String**: Red string connecting clues to suspects (optional, could be too busy on mobile)
- **Notes**: Sticky notes for clues with handwritten-style font
- **Stamps**: "ELIMINATED" stamp effect when X'd out

#### Mobile Optimization
- **Grid layout**: 2x4 on mobile (2 columns, 4 rows for 8 suspects)
- **Grid layout**: 4x2 on tablet/desktop (4 columns, 2 rows)
- **Swipe up**: Expand clues section
- **Swipe down**: Minimize clues, focus on suspects
- **Pinch zoom**: Zoom into suspect photos (optional)

#### Animations
- **Clue gather**: New sticky note slides in and pins to board
- **Elimination**: Red X stamp effect with sound (optional)
- **Restore**: X fades out, photo returns to color
- **Final suspect**: Pulsing glow effect when only one remains
- **Warrant ready**: "APPREHEND" button glows at final city

### Example Flow

1. **Start of case**: All 8 suspects visible, no clues
2. **First clue** ("The suspect is male"):
   - Sticky note appears with clue text
   - 4 female suspects get X'd out with animation
   - Toast: "4 suspects eliminated!"
3. **Second clue** ("Dark hair"):
   - Another sticky note appears
   - 2 more suspects eliminated (light hair males)
   - Toast: "2 suspects eliminated! 2 remaining."
4. **Third clue** ("Enjoys chess"):
   - Final sticky note
   - 1 more eliminated
   - Toast: "1 suspect identified! Viktor Blackwood"
   - Viktor's card pulses with highlight
5. **At final city**: "ISSUE WARRANT" button enabled and glowing

### Enhanced Features

**Smart Hints** (Optional):
- If player hasn't eliminated anyone manually and has gathered clues, show hint:
  - "💡 Tip: Your clues suggest 3 suspects are impossible. Tap to eliminate them."

**Statistics** (Post-game):
- "Suspects eliminated: 7/8"
- "Manual eliminations: 2"
- "Correct deductions: 100%"

**Undo System**:
- Recent eliminations can be undone (last 3 actions)
- "↶ Undo" button when available

---

## Gadget System (NEW)

### Gadget Philosophy
- **Varied arsenal**: 5-6 different gadgets inspired by spy fiction (James Bond, Austin Powers, etc.)
- **Specific encounters**: Each dangerous situation requires a SPECIFIC gadget
- **Red herrings**: Wrong gadgets waste your item and may still incur time penalty
- **Deduction puzzle**: Player must match gadget to threat type

### Gadget Arsenal (Starting Loadout)

1. **💨 Smoke Bomb**
   - *"A miniature smoke grenade for quick escapes"*
   - **Works on**: Street Tailing, Alley Ambush
   - **Doesn't work on**: Long-range threats

2. **👓 X-Ray Glasses**
   - *"See through walls and detect hidden threats"*
   - **Works on**: Booby Trap, Suspicious Package
   - **Doesn't work on**: Direct confrontation

3. **📱 Shoe Phone**
   - *"Call for backup in tight situations"*
   - **Works on**: Surrounded by Goons, Police Interrogation
   - **Doesn't work on**: Solo threats

4. **⚡ Laser Watch**
   - *"A precision cutting tool disguised as a timepiece"*
   - **Works on**: Locked Room, Tied Up Scenario
   - **Doesn't work on**: Fast-moving threats

5. **🎯 Grappling Hook Ring**
   - *"Scale buildings or swing to safety"*
   - **Works on**: Rooftop Sniper, Building Escape
   - **Doesn't work on**: Close-quarters combat

6. **💊 Antidote Pills**
   - *"Universal antitoxin for various poisons"*
   - **Works on**: Poisoned Drink, Nerve Gas
   - **Doesn't work on**: Physical threats

### Encounter Types

#### Henchman Encounters (Mid-Game)
Each playthrough randomly selects from:

1. **Street Tailing**
   - *"A shadowy figure is following you through the market..."*
   - **Correct gadget**: 💨 Smoke Bomb
   - **Wrong gadget**: Lose 4 hours
   - **No gadget**: Lose 6 hours

2. **Booby Trap**
   - *"Your hotel room door is rigged with a trap..."*
   - **Correct gadget**: 👓 X-Ray Glasses
   - **Wrong gadget**: Lose 4 hours
   - **No gadget**: Lose 6 hours

3. **Surrounded by Goons**
   - *"Three burly henchmen corner you in an alley..."*
   - **Correct gadget**: 📱 Shoe Phone (call backup)
   - **Wrong gadget**: Lose 4 hours
   - **No gadget**: Lose 6 hours

#### Assassination Attempts (Final City)
Each playthrough randomly selects from:

1. **Rooftop Sniper**
   - *"A glint of light from a rooftop! Sniper taking aim!"*
   - **Correct gadget**: 🎯 Grappling Hook Ring (reach sniper)
   - **Wrong gadget**: Lose 6 hours
   - **No gadget**: Lose 8 hours

2. **Poisoned Drink**
   - *"Your coffee tastes bitter. Something's wrong..."*
   - **Correct gadget**: 💊 Antidote Pills
   - **Wrong gadget**: Lose 6 hours
   - **No gadget**: Lose 8 hours

3. **Locked Room**
   - *"The door slams shut! The room is filling with gas!"*
   - **Correct gadget**: ⚡ Laser Watch (cut through lock)
   - **Wrong gadget**: Lose 6 hours
   - **No gadget**: Lose 8 hours

### Gadget Choice UI

**Example: Henchman Encounter**
```
┌─────────────────────────────────────┐
│  ⚠️  HENCHMAN SPOTTED!               │
│                                     │
│  A shadowy figure is following you  │
│  through the crowded market...      │
│                                     │
│  Select Gadget:                     │
│                                     │
│  [💨 Smoke Bomb]                    │
│   Quick escape device               │
│                                     │
│  [📱 Shoe Phone]                    │
│   Call for backup                   │
│                                     │
│  [🎯 Grappling Hook Ring]           │
│   Scale buildings to escape         │
│                                     │
│  [⚙️ No Gadget - Risk It]           │
│   (May lose 6 hours!)               │
└─────────────────────────────────────┘
```

### Gadget Feedback

**Correct Choice**:
```
┌─────────────────────────────────────┐
│  ✅ SUCCESS!                        │
│                                     │
│  You deploy the Smoke Bomb!         │
│  The henchman loses sight of you    │
│  in the thick cloud. You escape     │
│  without losing any time!           │
│                                     │
│  Time lost: 0 hours                 │
│  Gadget consumed: Smoke Bomb        │
│                                     │
│  [Continue]                         │
└─────────────────────────────────────┘
```

**Wrong Choice**:
```
┌─────────────────────────────────────┐
│  ❌ WRONG GADGET!                   │
│                                     │
│  The Shoe Phone won't help here!    │
│  By the time backup arrives, the    │
│  henchman has already slowed you    │
│  down and escaped.                  │
│                                     │
│  Time lost: 4 hours                 │
│  Gadget wasted: Shoe Phone          │
│                                     │
│  [Continue]                         │
└─────────────────────────────────────┘
```

**No Gadget**:
```
┌─────────────────────────────────────┐
│  ⚠️  CONFRONTATION!                 │
│                                     │
│  You try to evade manually but the  │
│  henchman is persistent. After a    │
│  lengthy chase through back alleys, │
│  you finally lose them.             │
│                                     │
│  Time lost: 6 hours                 │
│                                     │
│  [Continue]                         │
└─────────────────────────────────────┘
```

### Strategic Depth
- **Learn from failures**: Wrong gadget use teaches which gadget is correct
- **Risk vs. reward**: Save gadgets or use them cautiously?
- **Reading the situation**: Clues in the encounter text hint at correct gadget
  - "following through market" → need escape (Smoke Bomb)
  - "room rigged with trap" → need detection (X-Ray Glasses)
  - "three burly henchmen" → need help (Shoe Phone)
- **Replay value**: Different encounters each playthrough

---

## Time & Sleep Mechanics (NEW)

### Time Advancement
- **Investigation**: 2-8 hours (based on location)
- **Travel**: 4 hours
- **Sleep**: 7 hours (11pm → 6am)
- **Henchman encounter**: 0h (with gadget) or 4h (without)
- **Assassination attempt**: 0h (with gadget) or 6h (without)

### Sleep Trigger
- When time reaches 23:00 (11pm) and player is NOT traveling
- Forced sleep screen appears
- Player must sleep (no option to skip)
- Advances to 06:00 next day
- Creates day/night cycle and urgency

### Time Display
- Show as hours: "48h remaining"
- Warning state at < 12h: Red color, pulse animation
- Critical state at < 6h: Flashing red

---

## Mobile-First Responsive Design

### Breakpoints
- **Mobile**: < 640px (primary focus)
- **Tablet**: 640px - 1024px
- **Desktop**: > 1024px

### Touch Interactions
- **Tap targets**: Minimum 44x44px
- **Swipe gestures**:
  - Swipe left/right to change bottom menu tabs
  - Pull down to refresh/dismiss modals
- **Long press**: Show additional info/tooltips
- **Haptic feedback**: On important actions (if supported)

### Layout Adjustments
- **Mobile**:
  - Single column
  - Fixed header/footer
  - Fullscreen content area
  - Bottom sheet for modals
- **Desktop**:
  - Wider content area (max 800px)
  - Centered layout
  - Hover states
  - Keyboard shortcuts

---

## Animation Specifications

### Transitions
- **Page transitions**: 300ms ease-in-out
- **Modal open/close**: 200ms with backdrop fade
- **Button press**: 100ms scale (0.95)

### Time Advancement Animation
- Clock icon rotates
- Numbers increment with counter animation
- Duration: 1-2 seconds based on time cost

### Travel Animation
- Plane icon moves along path (Bezier curve)
- Duration: 3 seconds
- Easing: ease-in-out

### Investigation Animation
- Background cross-fade to location (500ms)
- Clue text types out (50ms per character)
- Return to city view (500ms fade)

---

## Updated State Machine

```
START
  ↓
BRIEFING (accept mission)
  ↓
CITY (investigation phase) ←──┐
  ↓                            │
  ├→ Investigate ─→ [Animation] ─→ Check time ─→ 11pm? → SLEEPING ──┤
  ├→ Travel ─→ [Animation] ─→ Check if correct city                  │
  │     ├→ Wrong city ─→ CITY (dead end clues)                       │
  │     └→ Right city ─→ HENCHMAN? ─→ CITY (next city) ──────────────┘
  └→ Evidence ─→ EVIDENCE BOARD ─→ Return to CITY

Final City Reached
  ↓
FIRST INVESTIGATION ─→ ASSASSINATION ATTEMPT
  ↓
SECOND INVESTIGATION ─→ CATCH SUSPECT
  ↓
GET WARRANT (evidence board with warrant UI)
  ↓
TRIAL (show verdict)
  ↓
DEBRIEF (stats, promotion)
  ↓
MENU (new case or return)
```

---

## Implementation Checklist

### Phase 1: UI Structure
- [ ] Create new panel layout (top/main/bottom)
- [ ] Implement responsive breakpoints
- [ ] Add background image system
- [ ] Create bottom navigation menu
- [ ] Update header with location + time

### Phase 2: Game States
- [ ] Implement BRIEFING screen
- [ ] Add SLEEPING state with trigger logic
- [ ] Create HENCHMAN encounter
- [ ] Update ASSASSINATION attempt with gadget choice
- [ ] Add CATCH SUSPECT screen
- [ ] Create GET WARRANT UI
- [ ] Implement TRIAL screen
- [ ] Update DEBRIEF with stats

### Phase 3: Animations
- [ ] Time advancement animation
- [ ] Travel/plane animation
- [ ] Investigation transitions
- [ ] Sleep fade in/out
- [ ] Smooth state transitions

### Phase 4: Gadget System
- [ ] Add gadget inventory to game state
- [ ] Implement gadget usage logic
- [ ] Create gadget choice modals
- [ ] Update evidence board with gadgets
- [ ] Add briefing gadget display

### Phase 5: Polish
- [ ] Add sound effects (optional)
- [ ] Improve touch targets for mobile
- [ ] Add loading states
- [ ] Test on various screen sizes
- [ ] Add swipe gestures

---

## Next Steps
1. Review and approve this specification
2. Set up background image placeholders/system
3. Begin Phase 1: UI Structure implementation
4. Iterate on animations and timing
5. Test on mobile devices

---

**Document Version**: 1.0
**Last Updated**: 2025-12-26
**Status**: Ready for Implementation
