# Carmen San Diego Project

## Project Overview
An educational geography game where players track Carmen Sandiego across the world using clues and a map interface.

## Tech Stack
- **Framework**: React 18.3.1 + Vite 6.0.5
- **Mapping**: Leaflet 1.9.4 with react-leaflet 4.2.1
- **Styling**: Tailwind CSS 3.4.17
- **Icons**: lucide-react 0.468.0
- **Language**: JavaScript (not TypeScript)
- **Build Tool**: Vite with @vitejs/plugin-react and @modyfi/vite-plugin-yaml

## Project Structure
```
src/
├── components/
│   ├── Map/           # Map-related components
│   └── ...            # Other UI components
├── utils/
│   ├── leafletIcons.js  # Icon configurations for map markers
│   └── ...
├── data/              # Game data (locations, clues, etc.)
└── App.jsx           # Main application component
```

## Project-Specific Conventions

### State Management
- Use React Context for global state (no Redux)
- Keep state colocated when possible
- Prefer useState for component-local state

### Styling
- **Tailwind only**: Use Tailwind utility classes exclusively
- No custom CSS files
- No inline styles unless absolutely necessary
- Responsive design: mobile-first approach

### Icons
- **lucide-react only**: All icons must come from lucide-react
- No other icon libraries
- Keep icon usage consistent across the application

### Map Components
- All map-related components live in `src/components/Map/`
- Use react-leaflet components as the base
- Custom Leaflet icons configured in `src/utils/leafletIcons.js`
- Map state management should be centralized

### File Organization
- Components: PascalCase (e.g., `MapContainer.jsx`)
- Utilities: camelCase (e.g., `leafletIcons.js`)
- Group related components in subdirectories

### Import Conventions
- Prefer absolute imports from `src/` when configured
- Group imports: React → external libraries → internal components → utils
- One blank line between import groups

### Data Files
- Game data stored in `src/data/` or loaded via YAML
- Use @modyfi/vite-plugin-yaml for YAML imports
- Keep data separate from logic

## Development Commands
- `npm run dev` - Start development server (runs with --host flag)
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `npm run lint` - Run ESLint

## Current Focus Areas
- Map UI and animation improvements
- Map tray redesign (feature/map-tray-ui-redesign branch)
- Performance optimization for map interactions

## Git Workflow
- Main branch: `main`
- Feature branches: `feature/description`
- Bug fixes: `fix/description`
- Refactoring: `refactor/description`

## Testing Approach
- Browser testing during development
- React Dev Tools for component inspection
- Manual testing with focus on user experience

## Best Practices Reference
For general software engineering best practices, see:
@.claude/rules/best-practices.md
