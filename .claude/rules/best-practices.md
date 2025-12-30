# Global Claude Instructions - Best Practices

## Project Context Requirements

When starting work on a project, ensure you understand:

### Essential Project Information
- **Tech Stack**: Framework versions, language versions, key dependencies
- **Architecture**: Monorepo/microservices/monolith, folder structure patterns
- **State Management**: Redux, Context, Zustand, Jotai, etc.
- **Styling Approach**: CSS-in-JS, Tailwind, CSS Modules, etc.
- **Testing Framework**: Jest, Vitest, Cypress, Playwright, etc.
- **Build Tool**: Vite, Webpack, Next.js, etc.
- **Type System**: TypeScript strict mode settings, PropTypes, none

### Project-Specific Patterns to Document
- **Naming Conventions**: File naming (kebab-case, PascalCase), component patterns
- **Code Organization**: Where do hooks go? Utils? Types? Constants?
- **Import Ordering**: Absolute vs relative, grouping patterns
- **Error Handling**: Try/catch patterns, error boundaries, logging approach
- **API Patterns**: REST, GraphQL, fetch vs axios, error handling
- **Component Patterns**: Compound components, render props, HOCs preferences

## Code Quality Principles

### 1. SOLID Principles (Robert C. Martin)
- **Single Responsibility**: Each function/component does one thing well
- **Open/Closed**: Extend behavior through composition, not modification
- **Liskov Substitution**: Subtypes should be substitutable for base types
- **Interface Segregation**: Many specific interfaces > one general interface
- **Dependency Inversion**: Depend on abstractions, not concretions

### 2. DRY (Don't Repeat Yourself) - The Pragmatic Programmer
- Extract repeated logic into reusable functions/components
- BUT: Don't abstract prematurely - wait for third occurrence (Rule of Three)
- Duplication is better than wrong abstraction (Sandi Metz)

### 3. KISS (Keep It Simple, Stupid)
- Simplest solution that solves the problem completely
- Avoid clever code - favor readable code
- Future requirements shouldn't drive current complexity

### 4. YAGNI (You Aren't Gonna Need It) - Extreme Programming
- Don't add functionality until it's actually needed
- No speculative features or "just in case" code
- Build for today's requirements, not imagined future ones

## React-Specific Best Practices

### Component Design (React Docs, Kent C. Dodds)
- **Composition over Inheritance**: Always use composition
- **Container/Presentational Pattern**: Separate logic from presentation when beneficial
- **Custom Hooks**: Extract complex logic into reusable hooks
- **Component Size**: If > 300 lines, consider splitting
- **Props Drilling**: Max 2-3 levels; use Context or state management beyond that

### Performance (React Docs)
- **Premature Optimization**: Avoid until you measure a problem
- **Memoization**: Use React.memo, useMemo, useCallback sparingly
- **Key Props**: Always use stable, unique keys for lists
- **Code Splitting**: React.lazy and Suspense for large components
- **Avoid Inline Functions**: In JSX props only if causing measured performance issues

### State Management (Kent C. Dodds - "Application State Management")
- **Colocation**: Keep state as close to where it's used as possible
- **State Lifting**: Only lift when multiple components need shared state
- **Server State vs Client State**: Use proper tools (React Query/SWR vs useState)
- **Derived State**: Avoid storing what can be calculated from existing state

### Hooks Best Practices (React Docs)
- **Rules of Hooks**: Only call at top level, only in React functions
- **Dependency Arrays**: Always include ALL dependencies (use ESLint)
- **useEffect Cleanup**: Always cleanup subscriptions, timers, listeners
- **Avoid useEffect**: Often useState + event handlers are sufficient

## Testing Principles (Kent C. Dodds - Testing Library)

### Testing Philosophy
- **Test Behavior, Not Implementation**: Test what users see/do
- **Avoid Testing Implementation Details**: Don't test state, don't test props directly
- **Write Tests That Give Confidence**: Not just coverage percentage
- **Test Trophy**: More integration tests, fewer unit/e2e tests

### Testing Patterns
- **Arrange-Act-Assert (AAA)**: Structure all tests this way
- **One Assertion Per Test**: Debatable, but each test should verify one behavior
- **Test User Interactions**: Click, type, submit - not calling functions directly
- **Accessibility Testing**: Use getByRole, getByLabelText to ensure accessible markup

### What to Test
```
Priority 1: Critical user paths (login, checkout, data submission)
Priority 2: Edge cases that caused bugs before
Priority 3: Complex business logic
Priority 4: Everything else
```

## Security Best Practices (OWASP Top 10)

### Always Consider
- **Input Validation**: Validate/sanitize all user input
- **XSS Prevention**: Never use dangerouslySetInnerHTML without sanitization
- **SQL Injection**: Use parameterized queries (even for NoSQL)
- **Authentication**: Never roll your own - use established libraries
- **Secrets Management**: Never commit API keys, tokens, passwords
- **HTTPS**: All production traffic should use HTTPS
- **CORS**: Understand and configure appropriately
- **Dependencies**: Regularly audit with `npm audit` or `yarn audit`

## Code Style & Readability (Clean Code - Robert C. Martin)

### Naming Conventions
- **Variables/Functions**: camelCase, descriptive, revealing intent
- **Classes/Components**: PascalCase
- **Constants**: UPPER_SNAKE_CASE for true constants
- **Booleans**: Use is/has/should prefix (isLoading, hasError, shouldRender)
- **Event Handlers**: Use handle/on prefix (handleClick, onSubmit)

### Function Design
- **Small Functions**: Ideally < 20 lines, definitely < 50 lines
- **Function Arguments**: Ideally 0-2, max 3; use objects for > 3
- **Single Level of Abstraction**: Don't mix high/low level operations
- **No Side Effects**: Pure functions when possible
- **Command-Query Separation**: Functions either do something OR return something

### Comments
- **Self-Documenting Code**: Code should explain what it does
- **Comments Explain Why**: Not what - explain reasoning, gotchas, business rules
- **Avoid Noise Comments**: No `// increment i` or `// loop through array`
- **TODO Comments**: Include ticket number and name: `// TODO(JIRA-123): Refactor after API v2`

## Error Handling

### Patterns (Effective TypeScript, Resilient Web Design)
- **Fail Fast**: Validate inputs early, throw errors immediately
- **Error Boundaries**: React error boundaries for component tree failures
- **User-Friendly Messages**: Technical errors → user-friendly messages
- **Logging**: Log errors with context (user ID, timestamp, action attempted)
- **Fallbacks**: Always have UI fallback for failures (empty states, error states)
- **Network Errors**: Assume network calls will fail; handle appropriately

### Error Types
```javascript
// Operational Errors: Expected (network, validation, not found)
// - Handle gracefully, show user message, retry if appropriate

// Programming Errors: Bugs (null reference, type errors)
// - Fix the code, add tests, log to monitoring service
```

## Git Best Practices

### Commits (Conventional Commits)
- **Atomic Commits**: Each commit = one logical change
- **Descriptive Messages**: What and why, not how
- **Present Tense**: "Add feature" not "Added feature"
- **Format**: `type(scope): description` - e.g., `feat(auth): add OAuth login`
  - Types: feat, fix, docs, style, refactor, test, chore

### Branching (Git Flow, GitHub Flow)
- **Branch Naming**: `feature/description`, `fix/bug-description`, `refactor/component-name`
- **Short-Lived Branches**: Merge frequently, avoid long-running branches
- **Pull Requests**: Should be reviewable (< 400 lines changed)

## Performance Best Practices

### General (Web Performance Working Group)
- **Measure First**: Don't optimize without measuring
- **Critical Rendering Path**: Minimize render-blocking resources
- **Lazy Loading**: Images, routes, components not immediately visible
- **Bundle Size**: Monitor and keep < 200KB initial load
- **Tree Shaking**: Ensure build tools can eliminate dead code

### React Performance
- **Virtual Scrolling**: For large lists (react-window, react-virtualized)
- **Debounce/Throttle**: User input that triggers expensive operations
- **Web Workers**: CPU-intensive operations off main thread
- **Images**: Use appropriate formats (WebP), sizes (srcset), lazy loading

## Accessibility (WCAG 2.1, WAI-ARIA)

### Essential Principles
- **Semantic HTML**: Use correct elements (button, nav, main, etc.)
- **Keyboard Navigation**: All interactive elements keyboard accessible
- **Screen Reader Testing**: Test with VoiceOver/NVDA
- **Color Contrast**: WCAG AA minimum (4.5:1 for normal text)
- **Focus Management**: Visible focus indicators, logical focus order
- **ARIA**: Use sparingly - HTML semantics first, ARIA when needed
- **Alt Text**: Descriptive for images, empty for decorative

## Documentation Patterns

### When to Document
- **README**: Setup, running, testing, architecture overview
- **API Documentation**: All public functions/endpoints
- **Complex Logic**: Non-obvious algorithms or business rules
- **Architectural Decisions**: Use ADRs (Architecture Decision Records)
- **Breaking Changes**: Always document in changelog

### What NOT to Document
- Obvious code (self-explanatory function names)
- Temporary workarounds (comment them instead)
- Implementation details that change frequently

## Asking Claude for Help

### Effective Prompts
- **Provide Context**: Share tech stack, relevant code, error messages
- **Be Specific**: "Fix login bug" → "Login button doesn't update state after API call"
- **Share Error Messages**: Full stack traces, console errors, network errors
- **Describe Expected Behavior**: What should happen vs what is happening
- **Share Screenshots**: From browser, React Dev Tools, error states

### Iterative Collaboration
- **Start Simple**: Get basic version working, then enhance
- **Review Suggestions**: Don't blindly accept - understand and verify
- **Ask Questions**: If approach isn't clear, ask before implementing
- **Share Results**: Did it work? New errors? Changed behavior?

## Code Review Checklist

Before considering code complete:
- [ ] Code follows project conventions
- [ ] No console.logs or debugging code
- [ ] Error cases handled appropriately
- [ ] User-facing text is clear and helpful
- [ ] Accessibility considerations addressed
- [ ] Performance implications considered
- [ ] Tests added/updated
- [ ] No obvious security vulnerabilities
- [ ] Code is readable and maintainable
- [ ] Breaking changes documented

## Anti-Patterns to Avoid

### React Anti-Patterns
- **Mutating State**: Always treat state as immutable
- **Index as Key**: Use stable unique IDs instead
- **Derived State in useEffect**: Calculate during render instead
- **Huge Components**: Split when > 300 lines or multiple concerns
- **Props Overload**: If > 8 props, reconsider component design

### General Anti-Patterns
- **Premature Abstraction**: Wait until pattern emerges 3+ times
- **God Objects/Components**: Components that do too many things
- **Magic Numbers**: Use named constants instead
- **Tight Coupling**: Components should be loosely coupled
- **Circular Dependencies**: Indicates architectural issue

## References & Further Reading

- **Clean Code** - Robert C. Martin
- **The Pragmatic Programmer** - Hunt & Thomas
- **Refactoring** - Martin Fowler
- **Effective TypeScript** - Dan Vanderkam
- **React Documentation** - https://react.dev
- **Testing Library Docs** - https://testing-library.com
- **OWASP Top 10** - https://owasp.org/www-project-top-ten/
- **WCAG Guidelines** - https://www.w3.org/WAI/WCAG21/quickref/
- **Kent C. Dodds Blog** - https://kentcdodds.com/blog
- **Web.dev** - https://web.dev
- **MDN Web Docs** - https://developer.mozilla.org

## Project-Specific Overrides

*Add project-specific conventions here that override or extend these global practices:*

```
Example:
- API calls: Always use our custom `apiClient` wrapper, not fetch
- Form handling: Use react-hook-form with Zod validation
- Date handling: Use date-fns, not moment or native Date
- Styling: Tailwind only, no custom CSS files
- Icons: lucide-react only
```
