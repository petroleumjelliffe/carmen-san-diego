# Carmen Sandiego Clone - Technical Specification

## Overview

A detective game where players chase a suspect across cities, gathering clues about their next destination and the suspect's identity. Players must reach the final city and issue the correct warrant before time runs out.

## Core Game Loop

1. Player arrives at a city
2. Player investigates locations (costs time) to get:
   - **Destination clues** → hints about the next city
   - **Suspect clues** → traits to identify the culprit
3. Player travels to next city (costs time)
4. If correct city → assassination attempt cutscene → continue
5. If wrong city → dead end, no useful clues
6. At final city → issue warrant based on collected suspect clues
7. Win if correct suspect + reached final city before time expires

---

## YAML Schemas

### `config/settings.yaml`

Game configuration and tuning parameters.

```yaml
settings:
  total_time: 72              # Hours available per case
  cities_per_case: 4          # Number of cities in the trail
  travel_time: 4              # Hours to travel between cities
  
difficulty:
  easy:
    total_time: 96
    cities_per_case: 3
  normal:
    total_time: 72
    cities_per_case: 4
  hard:
    total_time: 48
    cities_per_case: 5
```

---

### `config/cities.yaml`

Travel destinations. Minimal data - just what's needed for the map/travel UI.

```yaml
cities:
  - id: paris
    name: Paris
    country: France
    region: europe           # For selecting plausible wrong destinations
    latlon: [48.8566, 2.3522]
    image: cities/paris.jpg  # Skyline or iconic view
    
  - id: tokyo
    name: Tokyo
    country: Japan
    region: asia
    latlon: [35.6762, 139.6503]
    image: cities/tokyo.jpg
```

**Required fields:** `id`, `name`, `country`
**Optional fields:** `region`, `latlon`, `image`

---

### `config/destination_clues.yaml`

Clues that point TO a city. Used when generating hints about where the suspect went next.

```yaml
destination_clues:
  paris:
    - text: "asked about a famous iron tower"
      landmark: Eiffel Tower
      image: landmarks/eiffel.jpg
      
    - text: "wanted to see the Mona Lisa"
      landmark: The Louvre
      image: landmarks/louvre.jpg
      
    - text: "mentioned the City of Light"
    
    - text: "booked a flight to Charles de Gaulle"
    
  tokyo:
    - text: "asked about bullet trains"
      landmark: Tokyo Station
      image: landmarks/shinkansen.jpg
      
    - text: "was studying cherry blossom seasons"
      landmark: Ueno Park
      
    - text: "mentioned wanting to visit Shibuya crossing"
      landmark: Shibuya Crossing
      image: landmarks/shibuya.jpg
```

**Required fields:** `text`
**Optional fields:** `landmark`, `image`

**Authoring target:** 4-6 clues per city minimum for variety.

---

### `config/suspect_clues.yaml`

Clues that reveal suspect traits. Organized by trait → value → clue variants.

```yaml
suspect_clues:
  gender:
    male:
      - "The suspect is male"
      - "Witnesses describe a man"
      - "He was in a hurry"
    female:
      - "The suspect is female"
      - "Witnesses describe a woman"
      - "She seemed nervous"
      
  hair:
    dark:
      - "The suspect has dark hair"
      - "I noticed black or brown hair"
      - "Dark-haired, for sure"
    light:
      - "The suspect has light hair"
      - "Blonde or gray hair"
      - "Light-haired, maybe reddish"
      
  hobby:
    intellectual:
      - "The suspect enjoys intellectual pursuits"
      - "They mentioned loving chess"
      - "Seemed bookish, talked about poetry"
    physical:
      - "The suspect is athletic"
      - "They talked about fencing"
      - "Mentioned going hunting"
```

**Authoring target:** 3-5 variants per trait value for variety.

---

### `config/investigation_spots.yaml`

Locations within a city where the player can gather intel.

```yaml
investigation_spots:
  - id: informant
    name: Local Informant
    time_cost: 2
    gives: [destination, suspect]
    image: spots/informant.jpg
    flavor:
      - "A shady figure in a trench coat approaches..."
      - "Your contact slides into the booth..."
    
  - id: police
    name: Police Station
    time_cost: 4
    gives: [destination]
    image: spots/police.jpg
    flavor:
      - "The detective pulls up the case file..."
      - "Officers check their records..."
    
  - id: vendor
    name: Street Vendor
    time_cost: 8
    gives: [destination]
    image: spots/vendor.jpg
    flavor:
      - "The vendor squints, remembering..."
      - "After some haggling for information..."
```

**Required fields:** `id`, `name`, `time_cost`, `gives`
**Optional fields:** `image`, `flavor`

**`gives` values:**
- `destination` - provides a clue about the next city
- `suspect` - provides a clue about a suspect trait

---

### `config/suspects.yaml`

The suspects. Each must have a unique combination of trait values.

```yaml
suspects:
  - id: viktor
    name: Viktor Blackwood
    gender: male
    hair: dark
    hobby: intellectual
    mugshot: suspects/viktor.jpg
    
  - id: marcus
    name: Marcus Stone
    gender: male
    hair: dark
    hobby: physical
    mugshot: suspects/marcus.jpg
    
  - id: sebastian
    name: Sebastian Frost
    gender: male
    hair: light
    hobby: intellectual
    mugshot: suspects/sebastian.jpg
    
  - id: dimitri
    name: Dimitri Volkov
    gender: male
    hair: light
    hobby: physical
    mugshot: suspects/dimitri.jpg
    
  - id: mei
    name: Mei Lin
    gender: female
    hair: dark
    hobby: intellectual
    mugshot: suspects/mei.jpg
    
  - id: natasha
    name: Natasha Petrova
    gender: female
    hair: dark
    hobby: physical
    mugshot: suspects/natasha.jpg
    
  - id: scarlett
    name: Scarlett Viper
    gender: female
    hair: light
    hobby: intellectual
    mugshot: suspects/scarlett.jpg
    
  - id: isabella
    name: Isabella Frost
    gender: female
    hair: light
    hobby: physical
    mugshot: suspects/isabella.jpg
```

**Constraint:** With 3 binary traits, exactly 8 suspects cover all combinations. Adding a 4th trait would require 16 suspects.

---

### `config/stolen_items.yaml`

What was stolen. Flavor for case briefings.

```yaml
stolen_items:
  - id: crown_jewels
    name: The Crown Jewels
    origin_city: london
    description: "Priceless gems stolen from the Tower of London"
    image: items/crown_jewels.jpg
    
  - id: mona_lisa
    name: The Mona Lisa
    origin_city: paris
    description: "Da Vinci's masterpiece vanished from the Louvre"
    image: items/mona_lisa.jpg
    
  - id: terracotta_soldier
    name: Ancient Terracotta Soldier
    origin_city: beijing
    description: "A 2000-year-old warrior statue smuggled out of China"
    image: items/terracotta.jpg
```

**Optional:** `origin_city` could influence starting city for thematic coherence.

---

### `config/assassination_attempts.yaml`

Cutscenes shown when the player arrives at the correct next city.

```yaml
assassination_attempts:
  - id: sniper
    text: "A sniper's bullet whizzes past your ear, shattering a window behind you! You dive for cover as the shooter disappears into the crowd."
    image: assassinations/sniper.jpg
    
  - id: car
    text: "A car accelerates toward you on the sidewalk! You leap aside at the last second, crashing through a fruit stand as the vehicle speeds away."
    image: assassinations/car.jpg
    
  - id: poison
    text: "You notice your coffee tastes bitter. Knocking it aside, you see a shadowy figure slip out the café's back door. Too close!"
    image: assassinations/poison.jpg
    
  - id: knife
    text: "A knife blade gleams in the crowd! You twist away as an assassin lunges past you, disappearing into an alley."
    image: assassinations/knife.jpg
    
  - id: elevator
    text: "The elevator cables snap! You grab the emergency hatch and pull yourself up as the car plummets. Someone tampered with this..."
    image: assassinations/elevator.jpg
```

---

### `config/ranks.yaml`

Player progression based on solved cases.

```yaml
ranks:
  - id: rookie
    label: Rookie
    min_cases: 0
    
  - id: gumshoe
    label: Gumshoe
    min_cases: 1
    
  - id: sleuth
    label: Sleuth
    min_cases: 3
    
  - id: inspector
    label: Inspector
    min_cases: 5
    
  - id: detective
    label: Detective
    min_cases: 8
    
  - id: senior_detective
    label: Senior Detective
    min_cases: 12
    
  - id: chief
    label: Chief Inspector
    min_cases: 17
    
  - id: master
    label: Master Detective
    min_cases: 25
```

---

### `config/dead_ends.yaml`

Responses when the player goes to the wrong city.

```yaml
dead_ends:
  - "I don't know what you're talking about. No suspicious characters here."
  - "Suspicious person? Never seen anyone like that."
  - "Can't help you, detective. You must have the wrong place."
  - "Nobody matching that description has been through here."
  - "Sorry, I haven't seen anyone unusual lately."
```

---

### `config/final_city_clues.yaml`

Clues shown at the final city (all reveal assassination plots).

```yaml
final_city_clues:
  - text: "A sniper was spotted on a nearby rooftop, watching your arrival"
    image: final/sniper_rooftop.jpg
    
  - text: "Hotel staff found a bomb under your reserved room's bed"
  
  - text: "A man with a garrote was arrested asking about your whereabouts"
  
  - text: "Poison was discovered in the restaurant where you have reservations"
  
  - text: "Local police intercepted a hitman contract with your photo"
```

---

## Preprocessing & Runtime

### 1. YAML Loading

At build time or app startup:

```javascript
import yaml from 'js-yaml'

async function loadGameData() {
  const [
    settings,
    cities,
    destinationClues,
    suspectClues,
    investigationSpots,
    suspects,
    stolenItems,
    assassinationAttempts,
    ranks,
    deadEnds,
    finalCityClues
  ] = await Promise.all([
    loadYaml('config/settings.yaml'),
    loadYaml('config/cities.yaml'),
    loadYaml('config/destination_clues.yaml'),
    loadYaml('config/suspect_clues.yaml'),
    loadYaml('config/investigation_spots.yaml'),
    loadYaml('config/suspects.yaml'),
    loadYaml('config/stolen_items.yaml'),
    loadYaml('config/assassination_attempts.yaml'),
    loadYaml('config/ranks.yaml'),
    loadYaml('config/dead_ends.yaml'),
    loadYaml('config/final_city_clues.yaml'),
  ])
  
  return {
    settings,
    cities: indexById(cities),
    destinationClues,
    suspectClues,
    investigationSpots,
    suspects,
    stolenItems,
    assassinationAttempts,
    ranks,
    deadEnds,
    finalCityClues
  }
}
```

### 2. Build Indices

```javascript
function preprocessGameData(data) {
  return {
    ...data,
    
    // Index cities by ID for fast lookup
    citiesById: Object.fromEntries(
      data.cities.map(c => [c.id, c])
    ),
    
    // Index cities by region for selecting wrong destinations
    citiesByRegion: groupBy(data.cities, 'region'),
    
    // List of city IDs for random selection
    cityIds: data.cities.map(c => c.id),
    
    // Trait names extracted from suspect_clues keys
    traitNames: Object.keys(data.suspectClues)
  }
}
```

### 3. Case Generation

```javascript
function generateCase(gameData) {
  const { cityIds, suspects, stolenItems, traitNames } = gameData
  
  // Pick random cities for the trail
  const shuffledCities = shuffle(cityIds)
  const caseCities = shuffledCities.slice(0, gameData.settings.cities_per_case)
  
  // Pick random suspect
  const suspect = pickRandom(suspects)
  
  // Pick random stolen item
  const stolenItem = pickRandom(stolenItems)
  
  // Shuffle trait reveal order
  const traitOrder = shuffle(traitNames)
  
  return {
    cities: caseCities,        // [city0, city1, city2, city3]
    suspect,
    stolenItem,
    traitOrder,                // e.g., ['hobby', 'gender', 'hair']
    revealedTraits: []         // Filled as player investigates
  }
}
```

### 4. Clue Generation

```javascript
function generateCluesForCity(gameData, currentCase, cityIndex, isWrongCity) {
  const { destinationClues, suspectClues, investigationSpots, deadEnds, finalCityClues } = gameData
  const isFinalCity = cityIndex === currentCase.cities.length - 1
  
  // Wrong city - all dead ends
  if (isWrongCity) {
    return investigationSpots.map(spot => ({
      spot,
      destinationClue: pickRandom(deadEnds),
      suspectClue: null
    }))
  }
  
  // Final city - assassination plot clues
  if (isFinalCity) {
    const shuffledFinal = shuffle(finalCityClues)
    return investigationSpots.map((spot, i) => ({
      spot,
      destinationClue: shuffledFinal[i]?.text || shuffledFinal[0].text,
      suspectClue: null
    }))
  }
  
  // Normal city - destination + suspect clues
  const nextCityId = currentCase.cities[cityIndex + 1]
  const traitToReveal = currentCase.traitOrder[cityIndex]
  const traitValue = currentCase.suspect[traitToReveal]
  
  return investigationSpots.map(spot => {
    // Get destination clue
    const destClue = pickRandom(destinationClues[nextCityId])
    
    // Get suspect clue only if this spot gives it
    let suspClue = null
    if (spot.gives.includes('suspect')) {
      suspClue = pickRandom(suspectClues[traitToReveal][traitValue])
    }
    
    return {
      spot,
      destinationClue: destClue.text,
      destinationImage: destClue.image,
      destinationLandmark: destClue.landmark,
      suspectClue: suspClue
    }
  })
}
```

### 5. Wrong City Selection

When showing airport destinations:

```javascript
function getDestinations(gameData, currentCase, currentCityIndex) {
  const correctNextCity = currentCase.cities[currentCityIndex + 1]
  const currentCity = currentCase.cities[currentCityIndex]
  
  // Get wrong cities (exclude current and correct)
  const wrongCities = gameData.cityIds.filter(id => 
    id !== currentCity && id !== correctNextCity
  )
  
  // Pick 3 random wrong cities
  const selectedWrong = shuffle(wrongCities).slice(0, 3)
  
  // Combine and shuffle
  return shuffle([
    { cityId: correctNextCity, isCorrect: true },
    ...selectedWrong.map(id => ({ cityId: id, isCorrect: false }))
  ])
}
```

### 6. Rank Calculation

```javascript
function getRank(gameData, solvedCases) {
  const { ranks } = gameData
  
  // Ranks sorted by min_cases descending
  const sorted = [...ranks].sort((a, b) => b.min_cases - a.min_cases)
  
  return sorted.find(r => solvedCases >= r.min_cases) || ranks[0]
}
```

---

## Validation Rules

At load time, validate:

1. **Suspects cover all trait combinations**
   - Extract trait values from `suspect_clues`
   - Generate all combinations
   - Verify each combination has exactly one suspect

2. **All cities have destination clues**
   - Every city ID in `cities.yaml` must have entries in `destination_clues.yaml`

3. **Minimum clue variety**
   - Warn if any city has < 3 destination clues
   - Warn if any trait value has < 2 suspect clues

4. **Investigation spot consistency**
   - At least one spot must give `suspect` clues
   - Spots should be ordered by `time_cost` ascending

5. **Image paths exist** (optional, for builds with assets)

---

## File Structure

```
carmen-game/
├── src/
│   ├── components/
│   │   ├── Game.jsx
│   │   ├── InvestigateTab.jsx
│   │   ├── AirportTab.jsx
│   │   ├── DossierTab.jsx
│   │   ├── Cutscene.jsx
│   │   └── ...
│   ├── hooks/
│   │   └── useGameState.js
│   ├── utils/
│   │   ├── loadGameData.js
│   │   ├── caseGenerator.js
│   │   ├── clueGenerator.js
│   │   └── helpers.js
│   └── App.jsx
├── config/
│   ├── settings.yaml
│   ├── cities.yaml
│   ├── destination_clues.yaml
│   ├── suspect_clues.yaml
│   ├── investigation_spots.yaml
│   ├── suspects.yaml
│   ├── stolen_items.yaml
│   ├── assassination_attempts.yaml
│   ├── ranks.yaml
│   ├── dead_ends.yaml
│   └── final_city_clues.yaml
├── assets/
│   ├── cities/
│   ├── landmarks/
│   ├── suspects/
│   ├── spots/
│   ├── assassinations/
│   └── items/
└── package.json
```

---

## Future Enhancements

1. **Visual clue mode** - Show landmark images as hints instead of text
2. **Regional wrong cities** - Prefer wrong cities from same region for harder choices
3. **Difficulty scaling** - Fewer clues per city, more cities, less time
4. **Case themes** - Stolen item influences city selection (art heist = European cities)
5. **Witness personalities** - Different speech patterns per investigation spot
6. **Localization** - All text in YAML makes i18n straightforward
7. **Procedural suspects** - Generate names/mugshots, just define trait space
8. **Achievements** - "Solve 3 cases without visiting a wrong city"

---

## Summary

| YAML File | Purpose | Key Fields |
|-----------|---------|------------|
| `settings.yaml` | Game tuning | `total_time`, `cities_per_case` |
| `cities.yaml` | Travel destinations | `id`, `name`, `country`, `latlon` |
| `destination_clues.yaml` | Hints pointing to cities | `text`, `landmark`, `image` |
| `suspect_clues.yaml` | Trait descriptions | Nested by trait → value → strings |
| `investigation_spots.yaml` | Where to get clues | `name`, `time_cost`, `gives`, `image` |
| `suspects.yaml` | Who to catch | `name`, trait values, `mugshot` |
| `stolen_items.yaml` | Case flavor | `name`, `description`, `image` |
| `assassination_attempts.yaml` | Correct-city cutscenes | `text`, `image` |
| `ranks.yaml` | Progression | `label`, `min_cases` |
| `dead_ends.yaml` | Wrong-city responses | List of strings |
| `final_city_clues.yaml` | Final city danger | `text`, `image` |
