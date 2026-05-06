# SIGHT Conventions

Quick reference for layout, naming, styling, and lint/test rules. Established before feature work began so the rebuild stays clean. If you change something here, also adjust the corresponding config (`tsconfig.json`, `.eslintrc.json`, `vite.aliases.ts`).

## Directory Layout

```
electron/      Backend (Node side)
  main/        App lifecycle (entry: index.ts)
  preload/     Preload scripts (entry: index.ts)
  ipc/         IPC routers, one file per namespace
  services/    Business logic — no IPC concerns
  db/          DatabaseManager + Repository base + tables/
  analysis/    Analysis utilities

src/           Renderer (React)
  api/         Typed IPC client per namespace (mirrors electron/ipc/)
  routes/      React Router v7 route components (folder + index.tsx)
  components/  base / layout / feedback / feature / form
  store/       Zustand stores (useThingStore.ts)
  hooks/       Cross-page hooks
  controls/    Imperative dispatchers
  config/      Menus, route tables, feature flags
  styles/      tokens.css (@theme), reset.css, globals.css
  types/       Ambient/shared renderer types
  utils/

shared/        Cross-domain pure utilities (csv, stats, diagnostics)
saccades/      Gaze/saccade domain library
pupil/         Pupillometry domain library
viz/           Rendering primitives (PNG, backends)
```

Tests live **co-located** as `*.test.ts(x)` next to source. No central `tests/` directory.

## Path Aliases

Defined once in `vite.aliases.ts`, mirrored in `tsconfig.json` paths:

```
@app/*       → src/*
@electron/*  → electron/*
@shared/*    → shared/*
@saccades/*  → saccades/*
@pupil/*     → pupil/*
@viz/*       → viz/*
```

Use aliases for any cross-directory import. Relative paths are fine for sibling/child imports within a folder.

## Naming

- **Components / route files**: PascalCase folder, `index.tsx` inside. Co-located: `Component.test.tsx`, `useComponentName.ts`, `Component.module.css` (only when Tailwind utilities can't express it).
- **Hooks**: `useThing.ts`, camelCase function name.
- **Zustand stores**: `useThingStore.ts`, exported hook named `useThingStore`.
- **IPC namespaces**: lowercase singular — `user`, `case`, `profile`, `csv`, `video`, `stream`. Backend (`electron/ipc/<ns>.ts`) and frontend client (`src/api/<ns>.ts`) match exactly.
- **Types**: PascalCase. `Options` for caller-supplied params, `Config` for instance configuration, `Bounds` for ranges. Don't mix.
- **Domain output bundles**: prefix with domain — `SaccadeOutputBundle`, `PupilOutputBundle`.
- **One export = filename matches export.** Many small exports = lowercase-kebab descriptive filename.

## Styling

- **Tailwind utilities first.** Class strings directly in JSX.
- **Design tokens** live in `src/styles/tokens.css` under a `@theme` block. Tailwind 4 emits CSS variables from these automatically — utility classes (`bg-primary`) and `var(--color-primary)` both work.
- **No inline `style={{}}`** for color/spacing/typography. Inline style is acceptable only for runtime-derived values (computed transforms, dynamic widths).
- **CSS Modules** are an escape hatch for animations, complex selectors, or things Tailwind can't express. Co-locate as `Component.module.css`.
- `src/styles/globals.css` is the single import surface (loaded once from `renderer.tsx`).

## Imports

- **No default exports** except in `src/routes/**/index.tsx` and `*.config.*` files. Use named exports everywhere else.
- **Type-only imports** must use `import type { … }` (autofixable).
- **Import order** (autofixed by `eslint --fix`):
  1. Node builtins (`node:path`)
  2. External packages (`react`, `electron`, …)
  3. Internal aliases (`@app/*`, `@electron/*`, …)
  4. Parent (`../foo`)
  5. Sibling (`./foo`)
  6. Index (`.`)

  One blank line between groups. Within a group, alphabetize case-insensitively.

## Testing

- **Vitest** runs everything. `npm test` (single run), `npm run test:watch`.
- **Default environment is jsdom.** Backend/lib tests opt out with `// @vitest-environment node` at the top of the file.
- **Co-located**: `Button/index.tsx` ↔ `Button/Button.test.tsx`. Integration tests that span domains live as `<domain>/integration.test.ts`.
- `vitest.setup.ts` loads `@testing-library/jest-dom/vitest` matchers.

## Scripts

```
npm start          # Electron Forge dev
npm run lint       # ESLint
npm run typecheck  # tsc --noEmit
npm test           # Vitest single run
npm run test:watch # Vitest watch
npm run format     # Prettier write
npm run make       # Build distributable
```

## Background

This rebuild replaces the original EyeDHD project. The structural pain points being avoided are catalogued in `~/Desktop/EyeDHD/SIGHT-Remodel.md` — primarily monolithic IPC glue files, inline-style sprawl, missing design tokens, and parallel duplication between `saccades/` and `pupil/`. The conventions above exist to keep those problems from re-emerging.
