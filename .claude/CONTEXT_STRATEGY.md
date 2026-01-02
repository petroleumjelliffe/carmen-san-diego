# Context & Documentation Strategy

> Planning document for how to structure Claude Code context across devices.

## Decision Points

### 1. Global vs Project-Specific

| Type | Location | Use Case |
|------|----------|----------|
| **User-global** | `~/.claude/CLAUDE.md` | Personal preferences that apply everywhere (coding style, communication preferences) |
| **Project-specific** | `.claude/CLAUDE.md` | Project architecture, commands, conventions - syncs via Git |
| **Project-local** | `.claude/CLAUDE.local.md` | Machine-specific (local URLs, paths) - gitignored |

**Recommendation**: Keep most context project-specific. Global is only for truly universal preferences.

---

### 2. Proposed File Structure

```
.claude/
├── CLAUDE.md              # Main context (auto-loaded)
├── CLAUDE.local.md        # Machine-specific (gitignored)
├── settings.json          # Permissions, hooks (optional)
└── rules/                 # Modular guidelines (optional)
    └── ...
```

**Root level** (for visibility):
```
DEVELOPMENT_PLAN.md        # Current work, todos, decisions
UI_REDESIGN_SPEC.md        # Feature specifications
```

---

### 3. What Goes Where?

| Content | File | Rationale |
|---------|------|-----------|
| Project overview, tech stack | `.claude/CLAUDE.md` | Auto-loaded every session |
| Build/test commands | `.claude/CLAUDE.md` | Quick reference |
| Current tasks & todos | `DEVELOPMENT_PLAN.md` | Visible in repo, easy to update |
| Feature specs | `UI_REDESIGN_SPEC.md` (etc) | Detailed docs, referenced from CLAUDE.md |
| Completed work history | `DEVELOPMENT_PLAN.md` | Track progress over time |
| Coding conventions | `.claude/rules/` | Modular, can be path-specific |

---

### 4. CLAUDE.md Template

```markdown
# Project Name

> One-line description

## Quick Start
- `npm install` - Install deps
- `npm run dev` - Start dev server
- `npm run build` - Build for production

## Key Files
- `src/hooks/useGameState.js` - Core game logic
- `src/components/` - UI components
- `config/*.yaml` - Game data

## Current Work
See @DEVELOPMENT_PLAN.md for active tasks and decisions.

## Specifications
- @UI_REDESIGN_SPEC.md - Full feature spec

## Conventions
- React functional components with hooks
- Tailwind for styling
- YAML for game data configuration
```

---

### 5. Todo Tracking Options

**Option A: In DEVELOPMENT_PLAN.md** (recommended)
- Markdown checkboxes: `- [ ] Task`
- Section for "In Progress", "Completed", "Backlog"
- Human-readable, visible in Git

**Option B: Separate TODOS.md**
- Dedicated file, but another thing to maintain

**Option C: GitHub Issues**
- Better for collaboration, but requires switching context

**Recommendation**: Keep in DEVELOPMENT_PLAN.md for single-dev projects. Simple, all in one place.

---

### 6. Completed Work Tracking

Keep a **Changelog-style section** in DEVELOPMENT_PLAN.md:

```markdown
## Completed

### 2025-12-27
- [x] Encounters trigger only on first investigation per city
- [x] Inline encounter rendering in InvestigateTab
- [x] Warrant issuable anytime
- [x] Apprehension flow with "Continue to Trial" button
- [x] Timer bars on all encounters (henchman, assassination, good deeds)
```

---

## Questions to Decide

1. **Do you have global preferences** that should apply to ALL projects?
   - If yes → Create `~/.claude/CLAUDE.md`
   - If no → Keep everything project-specific

2. **Do you want path-specific rules?** (e.g., different rules for `*.test.js`)
   - If yes → Use `.claude/rules/` with frontmatter
   - If no → Keep it simple with just CLAUDE.md

3. **Multiple feature specs or one master spec?**
   - Current: `UI_REDESIGN_SPEC.md` is comprehensive
   - Could split into smaller docs if it grows

---

## Proposed Next Steps

1. Create `.claude/CLAUDE.md` with project essentials
2. Update `DEVELOPMENT_PLAN.md` with completed work from today
3. Add `.claude/CLAUDE.local.md` to `.gitignore`
4. Optionally: Create `~/.claude/CLAUDE.md` for global preferences
