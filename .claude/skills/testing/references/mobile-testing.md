# Mobile Testing (React Native / Expo)

For React Native screens, Expo components, and navigation flows.

## What to Write

Component and interaction tests using @testing-library/react-native:
- Screen renders expected content
- User interactions (press, swipe, scroll) trigger actions
- Navigation flows work (screen A → screen B)
- Form inputs validate and submit correctly
- Loading, error, and empty states display correctly
- Platform-specific behavior (if any) works on iOS and Android

## Running Tests
pnpm test:mobile        # Mobile tests only
pnpm test               # Full suite

## What "Passing" Looks Like
- All component tests green
- Navigation flows complete without errors
- Shared components from `packages/ui` work in mobile context

## Common Pitfalls
- Don't use web-specific testing patterns (no `screen.getByRole` quirks)
- Don't forget to test with mock navigation context
- Don't assume shared components from `packages/ui` render identically
- Test both platforms if there are platform-specific code paths
