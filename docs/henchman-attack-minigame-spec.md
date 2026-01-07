# Henchman Attack Minigame Spec

## Overview

A quick multiple-choice geography quiz that appears when the player encounters a henchman during the case. The player must identify a country based on a visual or audio clue. These are fast, low-stakes encounters that reinforce geography knowledge throughout the game.

The challenge uses **various clue types** (flags, currency symbols, accent descriptions, silhouettes) to test different aspects of geographic knowledge.

---

## Core Loop

1. **Encounter trigger:** Player arrives at correct city, henchman appears
2. **Scenario setup:** Brief flavor text establishes the encounter context
3. **Clue presentation:** Show stimulus (flag, currency symbol, silhouette, or text clue)
4. **Choice selection:** Player picks from 4 options (1 correct, 3 distractors)
5. **Result:** Immediate feedback, then continue

Total interaction time: ~5-10 seconds

---

## Scoring

| Action | Time Penalty |
|--------|--------------|
| Correct answer | +0 hours |
| Wrong answer | +2 hours |

Simple pass/fail. No hints available (too quick for that).

---

## Challenge Types

### 1. Flag → Country Name
**Stimulus:** Flag emoji or image
**Choices:** 4 country names (text buttons)
**Flavor:** "You spot this flag on their luggage:"

```
     🇫🇷
     
[France]  [Germany]
[Spain]   [Italy]
```

---

### 2. Country Name → Flag
**Stimulus:** Country name as text
**Choices:** 4 flag emojis/images
**Flavor:** "They mentioned visiting..."

```
    "France"
     
[🇫🇷]  [🇩🇪]
[🇪🇸]  [🇮🇹]
```

---

### 3. Currency Symbol → Country Name
**Stimulus:** Currency symbol and name (e.g., "¥ Yen")
**Choices:** 4 country names
**Flavor:** "You notice the currency they're carrying:"

```
      ¥
     Yen
     
[Japan]   [China]
[Korea]   [Taiwan]
```

**Note:** Avoid ambiguous currencies ($ used by many countries, € used by eurozone). Either:
- Only use distinctive currencies (¥, £, ₹, ₽, ₺, ฿)
- Or add context: "Brazilian $" with "R$ Reais"

---

### 4. Currency Symbol → Flag
**Stimulus:** Currency symbol and name
**Choices:** 4 flags
**Flavor:** "Their wallet is open, revealing:"

---

### 5. Accent/Language Clue → Country Name
**Stimulus:** Text description of accent or language heard
**Choices:** 4 country names
**Flavor examples:**
- "You detect a French accent..."
- "They're speaking Japanese into their phone."
- "You overhear them muttering in Portuguese."

```
"You detect a French accent..."

[France]  [Germany]
[Spain]   [Italy]
```

---

### 6. Accent/Language Clue → Flag
**Stimulus:** Text description
**Choices:** 4 flags

---

### 7. Country Silhouette → Country Name
**Stimulus:** Outline/shape of country borders
**Choices:** 4 country names
**Flavor:** "They're studying a map with this country circled:"

```
    [Italy silhouette]
     
[Italy]   [Greece]
[Spain]   [Croatia]
```

---

### 8. Country Silhouette → Flag
**Stimulus:** Country outline
**Choices:** 4 flags

---

## Encounter Contexts

Each encounter has a **context** that determines which challenge types make sense and provides flavor text.

### Accent
- **Valid types:** clue-to-flag, clue-to-name
- **Flavor templates:**
  - "You detect a {demonym} accent..."
  - "They're speaking {language} into their phone."
  - "You overhear them muttering in {language}."

### Luggage
- **Valid types:** flag-to-name (flag IS the visual stimulus)
- **Flavor templates:**
  - "You spot this flag on their luggage:"
  - "Their passport cover is briefly visible:"
  - "A flag sticker on their briefcase catches your eye:"

### Postcard
- **Valid types:** flag-to-name
- **Flavor templates:**
  - "A postcard slips from their pocket, showing:"
  - "You glimpse a flag on their postcard:"

### Currency
- **Valid types:** currency-to-flag, currency-to-name
- **Flavor templates:**
  - "You notice the currency they're carrying:"
  - "They drop some coins. You recognize the symbol:"
  - "Their wallet is open, revealing:"

### Map
- **Valid types:** silhouette-to-name, silhouette-to-flag
- **Flavor templates:**
  - "They're studying a map with this country circled:"
  - "You find a torn map fragment showing:"
  - "A crumpled travel itinerary shows this destination:"

---

## Distractor Selection

Distractors (wrong answers) should be chosen based on difficulty:

### Easy (Difficulty 1)
- Distractors from **different continents**
- Example: France correct → distractors from Asia, South America, Africa
- Flags look very different

### Medium (Difficulty 2)
- Distractors from **same continent** when possible
- Example: France correct → Germany, Spain, Italy
- Some visual similarity in flags

### Hard (Difficulty 3)
- Distractors from **same region** or with **similar flags**
- Example: Netherlands correct → France, Luxembourg, Russia (horizontal tricolors)
- Example: Australia correct → New Zealand, Fiji (southern cross flags)

### Similar Flag Groupings (for hard mode)
- **Tricolor horizontal:** France, Netherlands, Russia, Luxembourg
- **Tricolor vertical:** Italy, Ireland, Belgium, Romania
- **Nordic crosses:** Sweden, Norway, Denmark, Finland, Iceland
- **Red/white:** Japan, Indonesia, Monaco, Poland, Singapore
- **Stars and stripes:** USA, Liberia, Malaysia
- **Union Jack variants:** UK, Australia, New Zealand, Fiji

---

## Country Data

### Required Fields
```typescript
interface Country {
  id: string;                  // "france"
  name: string;                // "France"
  flag: string;                // "🇫🇷" (emoji) or image path
  continent: string;           // "europe"
  demonym: string;             // "French"
  language: string;            // "French"
  currencySymbol: string;      // "€"
  currencyName: string;        // "Euros"
  silhouette?: SilhouetteData; // SVG path (optional)
  similarFlags?: string[];     // ["netherlands", "russia"] for hard mode
}
```

### Sample Countries

| ID | Name | Flag | Continent | Demonym | Language | Currency |
|----|------|------|-----------|---------|----------|----------|
| france | France | 🇫🇷 | europe | French | French | € Euros |
| germany | Germany | 🇩🇪 | europe | German | German | € Euros |
| italy | Italy | 🇮🇹 | europe | Italian | Italian | € Euros |
| spain | Spain | 🇪🇸 | europe | Spanish | Spanish | € Euros |
| uk | United Kingdom | 🇬🇧 | europe | British | English (British accent) | £ Pounds Sterling |
| netherlands | Netherlands | 🇳🇱 | europe | Dutch | Dutch | € Euros |
| portugal | Portugal | 🇵🇹 | europe | Portuguese | Portuguese | € Euros |
| sweden | Sweden | 🇸🇪 | europe | Swedish | Swedish | kr Kronor |
| norway | Norway | 🇳🇴 | europe | Norwegian | Norwegian | kr Kroner |
| greece | Greece | 🇬🇷 | europe | Greek | Greek | € Euros |
| russia | Russia | 🇷🇺 | europe | Russian | Russian | ₽ Rubles |
| turkey | Turkey | 🇹🇷 | asia | Turkish | Turkish | ₺ Lira |
| japan | Japan | 🇯🇵 | asia | Japanese | Japanese | ¥ Yen |
| china | China | 🇨🇳 | asia | Chinese | Mandarin | ¥ Yuan |
| india | India | 🇮🇳 | asia | Indian | Hindi | ₹ Rupees |
| thailand | Thailand | 🇹🇭 | asia | Thai | Thai | ฿ Baht |
| brazil | Brazil | 🇧🇷 | south_america | Brazilian | Portuguese | R$ Reais |
| argentina | Argentina | 🇦🇷 | south_america | Argentine | Spanish | $ Pesos |
| mexico | Mexico | 🇲🇽 | north_america | Mexican | Spanish (Mexican accent) | $ Pesos |
| usa | United States | 🇺🇸 | north_america | American | English | $ US Dollars |
| canada | Canada | 🇨🇦 | north_america | Canadian | English and French | C$ Canadian Dollars |
| australia | Australia | 🇦🇺 | oceania | Australian | English (Aussie accent) | A$ Australian Dollars |
| egypt | Egypt | 🇪🇬 | africa | Egyptian | Arabic | E£ Egyptian Pounds |
| kenya | Kenya | 🇰🇪 | africa | Kenyan | Swahili and English | KSh Shillings |
| south_africa | South Africa | 🇿🇦 | africa | South African | English, Afrikaans, Zulu | R Rand |

---

## UI Layout

### Challenge Screen

```
┌─────────────────────────────────┐
│      HENCHMAN ATTACK!           │  ← Header
├─────────────────────────────────┤
│ 🧳 You spot this flag on       │  ← Context icon + flavor text
│    their luggage:               │
├─────────────────────────────────┤
│                                 │
│           🇫🇷                   │  ← Stimulus (large)
│                                 │
├─────────────────────────────────┤
│    Select the correct country:  │  ← Instruction
├─────────────────────────────────┤
│  ┌─────────┐  ┌─────────┐      │
│  │ France  │  │ Germany │      │  ← Choice grid (2x2)
│  └─────────┘  └─────────┘      │
│  ┌─────────┐  ┌─────────┐      │
│  │  Spain  │  │  Italy  │      │
│  └─────────┘  └─────────┘      │
└─────────────────────────────────┘
```

### Context Icons
- 👂 Accent
- 🧳 Luggage
- 📮 Postcard
- 💰 Currency
- 🗺️ Map

### Result Feedback (overlay or inline)

**Correct:**
```
┌─────────────────────────────────┐
│  ✓ Correct!                     │
│  You thwarted the henchman!     │
└─────────────────────────────────┘
```

**Wrong:**
```
┌─────────────────────────────────┐
│  ✗ Wrong!                       │
│  The answer was France 🇫🇷      │
│  +2 hours                       │
└─────────────────────────────────┘
```

---

## Data Structures

```typescript
interface HenchmanChallenge {
  type: ChallengeType;
  context: EncounterContext;
  correctAnswer: string;        // Country ID
  distractors: string[];        // 3 country IDs
  flavorText: string;           // Generated from context + country
}

type ChallengeType = 
  | 'flag-to-name'
  | 'name-to-flag'
  | 'currency-to-name'
  | 'currency-to-flag'
  | 'clue-to-name'      // accent/language
  | 'clue-to-flag'
  | 'silhouette-to-name'
  | 'silhouette-to-flag';

type EncounterContext = 
  | 'accent'
  | 'luggage'
  | 'postcard'
  | 'currency'
  | 'map';

interface ChallengeResult {
  correct: boolean;
  timePenalty: number;          // 0 or 2
}
```

---

## Generation Algorithm

```
function generateHenchmanChallenge(correctCountry, difficulty):
  1. Pick encounter context (random or based on case theme)
  2. Pick challenge type (valid for chosen context)
  3. If silhouette type, verify country has silhouette data (fallback to flag if not)
  4. Select 3 distractors based on difficulty:
     - Easy: different continents
     - Medium: same continent
     - Hard: same continent + similar flags
  5. Generate flavor text from template + country data
  6. Shuffle answer order
  7. Return challenge object
```

---

## Integration with Case

### Encounter Frequency
- 1-2 henchman encounters per city
- 3-4 cities per case
- Total: 3-8 henchman challenges per case

### Continent Relevance
Henchman's origin country should relate to the case region:
- Case in Europe → European henchman → European geography questions
- Allows theming: "Carmen's European operatives are on your tail"

### Difficulty Progression
- Early cities: Easy (difficulty 1)
- Mid cities: Medium (difficulty 2)
- Final city approach: Hard (difficulty 3)

---

## Open Items & Improvement Ideas

### Currency Ambiguity Problem
**Issue:** Multiple countries use same symbol ($ for USA, Canada, Australia, Mexico, etc.)
**Solutions:**
1. Only use distinctive currencies (¥, £, ₹, ₽, ₺, ฿, R$)
2. Show currency with country qualifier: "A$ Australian Dollars"
3. Show actual bill/coin imagery instead of just symbol
4. Add contextual hint: "They paid in currency featuring the Queen"

### Accent Specificity
**Issue:** "Spanish accent" could be Spain or Latin America
**Solutions:**
1. Be specific: "Castilian Spanish accent" vs "Mexican Spanish accent"
2. Add regional flavor: "They're speaking Portuguese with a Brazilian accent"
3. Use language + accent combo: "English with an Aussie accent"

### Silhouette Coverage
**Issue:** Not all countries have distinctive silhouettes
**Solutions:**
1. Only enable silhouette challenges for recognizable shapes (Italy, Japan, Australia, etc.)
2. Fallback to flag if no silhouette available
3. Show silhouette on continental context (Italy within Europe outline)

### Flag Emoji Rendering
**Issue:** Flag emojis render differently across platforms, some don't render at all (Windows)
**Solutions:**
1. Use SVG flag images instead of emojis
2. Library: flag-icons, flagpack, country-flag-icons
3. Fallback to country code if flag doesn't render

### Additional Clue Types (Future)
- **Landmark → Country:** "They're heading to see this:" [Eiffel Tower silhouette]
- **Food → Country:** "They ordered this dish:" [description or image]
- **Music → Country:** Play a short clip of traditional music
- **Famous person → Country:** "They mentioned meeting someone from here" [silhouette of famous landmark/person]
- **License plate → Country:** Show plate format/colors
- **Phone code → Country:** "You see +81 on their phone" → Japan

### Henchman Personality
Add character to encounters:
- Named henchmen with recurring appearances
- Different henchmen associated with different regions
- Flavor text varies by henchman: "Viktor lunges at you with a knife!"

### Streak Bonuses
- 3 correct in a row: Time bonus (-1 hour)
- 5 correct in a row: Larger bonus or achievement
- Encourages engagement without punishing failure

### Near-Miss Feedback
When wrong, show how "close" they were:
- "Close! Belgium and Netherlands are neighbors."
- "That's the right continent, at least!"
- Educational micro-moment

### Timed Pressure (Optional)
- Add countdown timer (10 seconds)
- Running out = auto-wrong
- Creates tension without being unfair
- Could be difficulty-dependent (more time on Easy)

---

## Sample Challenge Flow

**Setup:**
```
Case location: Paris, France
Henchman origin: Germany
Difficulty: Medium (same continent distractors)
Context: Currency
Challenge type: currency-to-name
```

**Generated challenge:**
```
Flavor: "Their wallet is open, revealing:"
Stimulus: "€ Euros"

Wait - this is ambiguous! Many European countries use Euros.
```

**Better setup:**
```
Henchman origin: Japan
Context: Currency
Challenge type: currency-to-name
```

**Generated challenge:**
```
Flavor: "They drop some coins. You recognize the symbol:"
Stimulus: "¥ Yen"

Choices: [Japan] [China] [Thailand] [South Korea]

(China also uses ¥ for Yuan - need to handle this!)
```

**Even better:**
```
Stimulus: "¥ Yen" with subtext "featuring Mount Fuji"
OR
Use distinct currency: "₹ Rupees" → clearly India
```

---

## Testing Checklist

- [ ] All challenge types render correctly
- [ ] Flag emojis display on target platforms (or fallback works)
- [ ] Distractor selection never duplicates correct answer
- [ ] Distractor selection respects difficulty settings
- [ ] Currency challenges avoid ambiguous cases
- [ ] Silhouette fallback works when data missing
- [ ] Flavor text generates correctly with country data
- [ ] Timer (if implemented) doesn't feel unfair
- [ ] Results show educational feedback
- [ ] Time penalty integrates with game clock
