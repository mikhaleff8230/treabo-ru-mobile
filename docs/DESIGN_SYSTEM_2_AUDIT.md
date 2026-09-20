# TREABO Design System 2.0 — audit

## Baseline

The mobile client already had a small `src/theme.ts` file and several shared components. Most product screens still define visual values locally.

Static audit across `src`, `screens`, and `components` before this stage found:

| Pattern | Occurrences |
| --- | ---: |
| `fontSize` | 325 |
| `fontWeight` | 211 |
| padding declarations | 356 |
| margin declarations | 249 |
| `borderRadius` | 206 |
| shadow declarations | 54 |
| elevation declarations | 16 |
| literal hex colors | 203 |

These counts are a migration baseline, not a request to replace all values at once. Screen-level migration must happen during each screen's approved redesign.

## Foundation introduced in this stage

- Semantic colors with legacy aliases for compatibility.
- System-font typography scale.
- Spacing scale: 4, 8, 12, 16, 20, 24, 32.
- New radius scale: 8, 10, 12, with 16 for special surfaces and pill for chips/avatars.
- Shared sizes for icons, avatars, controls, headers, bottom navigation, and screen padding.
- Reusable UI primitives in `components/ui`.
- An isolated showcase route at `treabo-client://design-system`.

## Deliberately unchanged

- Places feed and detail.
- Requests, chat, messenger, profile, map, AI request and create-place screens.
- Backend, API contracts, stores, navigation architecture and business logic.
- Existing shared components that would visually change several production screens at once.

Legacy token aliases remain until each screen is migrated and visually verified.
