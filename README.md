# Carmen San Diego Clone

A detective game inspired by the classic "Where in the World is Carmen Sandiego?" built with React and Vite.

## Development

```bash
npm install
npm run dev
```

## Building

```bash
npm run build
```

## TODO

### Deployment
- [ ] Set up GitHub Actions workflow for automated deployment
  - Add dist to .gitignore
  - Remove dist from git tracking
  - Create .github/workflows/deploy.yml
  - Configure GitHub Pages to use GitHub Actions source

### Phase 3: Karma & Notoriety Systems
- [x] YAML configuration for good deeds and rogue actions
- [x] Rogue cop tactics (4th investigation option)
- [ ] Good deed encounters
- [ ] NPC rescue system
- [ ] Notoriety consequences

### Phase 4: Advanced Features
- [ ] Gadgets system
- [ ] Henchmen encounters
- [ ] Assassination attempts
- [ ] Final showdown mechanics

### Polish & UX Enhancements
- [ ] Cinematic city arrival animation
  - Fade in background image
  - Type city name and time of day character-by-character (upper left, large text)
  - Spy movie aesthetic callback
- [ ] Rename "Dossier" tab to "Evidence"
- [ ] Split Evidence page into two tabs
  - **Suspect tab**: Interactive filtering form with collected clues at top
  - **Trail tab**: Collected clues at top, possible options below (no filtering)
- [ ] Trivia mini-game for good deeds and rogue activities
  - Rearrange sequences to succeed (e.g., rivers shortest→longest)
  - World wonders oldest→newest
  - Mountains shortest→tallest
  - Other geography/landmark trivia challenges
