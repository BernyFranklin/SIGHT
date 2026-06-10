# Handoff — Wiring the Gaze Cleaning Module into the User Workflow

**Audience:** a future session integrating the `cleaning/` module into SIGHT's UI.
**Status:** the cleaning engine + Electron seam are **done and committed** (branch
`feature-data-cleaning`). What remains is the **renderer/UX** work to let a user
clean a case's gaze data and see the result. Nothing below is built yet.

---

## 1. What already exists (don't rebuild)

- **Engine** — `cleaning/` (alias `@cleaning`): `cleanRecording(path, config?, id?)`
  → `CleanResult` (`.frame`, three views, `.report`, `.save(outDir)`). All tested.
- **Electron seam** — already registered and typed end-to-end:
  - Main: `electron/services/cleaningService.ts` → `runCleaning(projectPath, id, overrides?)`,
    `readCleaningReport(projectPath, id)`, `hasCleaningReport(projectPath, id)`.
    Reads `<project>/.sight/cases/<id>.csv`, writes `<project>/.sight/cleaned/<id>/`.
  - IPC: `electron/ipc/cleaning.ts` (channels `cleaning:run`, `cleaning:read-report`,
    `cleaning:has-report`), wired in `electron/main/index.ts`.
  - Preload bridge + renderer client are **ready to call**:

    ```ts
    import { cleaningApi, type QaReport } from '@app/api/cleaning';

    const report = await cleaningApi.run(projectPath, caseId);      // clean + persist + return QA
    const existing = await cleaningApi.readReport(projectPath, caseId); // QaReport | null
    const done = await cleaningApi.hasReport(projectPath, caseId);   // boolean
    ```

  - `cleaningApi.run` accepts an optional third arg: `CleaningConfigOverrides`
    (partial `CleaningConfig`). Omit it to use the spec §6 defaults.

So the renderer can already invoke cleaning. The work is **state + UI**, not plumbing.

---

## 2. The goal

Let a researcher, from a case, **run cleaning on demand** and **see the data-quality
result** (status, valid %, gaps, exclusions, warnings). Outputs land in
`.sight/cleaned/<id>/` (gitignored) for downstream Saccade/Pupillometry/Gaze-Quality
modules to consume later.

---

## 3. Recommended integration points (with exact files)

### 3a. Store — track cleaning per case
`src/store/useProjectStore.ts` already keys everything by `projectPath` and holds
`cases: Record<string, CaseRecord[]>`. Mirror that for cleaning:

- Add state: `cleaningReports: Record<string /*projectPath*/, Record<string /*caseId*/, QaReport | null>>`
  and `cleaningBusy: Record<string, Record<string, boolean>>` (to disable buttons / show a spinner).
- Add actions:
  - `runCleaning(path, caseId)` → set busy → `await cleaningApi.run(path, caseId)` →
    store the returned report → clear busy. Wrap in try/catch (no toast system exists —
    see §5; surface errors inline for now).
  - `refreshCleaning(path, caseId)` → `cleaningApi.readReport(path, caseId)` into state.
- **Populate lazily, not eagerly.** Unlike `cases`, do **not** run cleaning on project
  open (it's expensive). On open you may optionally `hasReport`/`readReport` to show a
  "cleaned ✓" badge, but only *run* on explicit user action.
- Clear a project's cleaning state in `closeActive()` alongside `cases`/`hasCases`.

### 3b. Trigger — ProjectExplorer case context menu
`src/components/layout/ProjectExplorer/index.tsx` → `CaseContextMenu` (~line 333) already
renders **Edit** / **Delete** menuitems, with `openEditCaseTab` / `deleteCase` plumbed from
the parent (`CasesFolder`, ~line 248). Add a third menuitem **"Clean gaze data"** wired to
a new `onCleanCase(record)` prop that calls `store.runCleaning(path, record.id)`. Show a
busy state from `cleaningBusy`. This matches the existing prop-drilling pattern
(`onOpenCase` / `onEditCase` / `onDeleteCase`).

### 3c. Display — CaseTab "Data Quality" panel
`src/components/layout/Workspace/CaseTab/index.tsx` is the read-only case surface and the
best place to show results. It already uses `Group` / `FieldRow` / `ReadOnlyValue`
(from `../ProjectConfigTab/components/`) and reads from `useProjectStore`. Add a
**Data Quality** `Group` below the metadata:

- If a report exists for `(projectPath, record.id)`: render a **status badge**
  (`pass` = green, `warn` = amber — reuse the amber incomplete-banner styling already in
  this file), then `FieldRow`s for valid %, inferred Hz, data gaps (count / frames),
  excluded %, and a warnings list. A "Re-clean" button calls `runCleaning` again.
- If no report: a single **"Clean gaze data"** button (disabled + "Cleaning…" while busy).
- On mount, call `refreshCleaning(projectPath, record.id)` so a previously-cleaned case
  shows its result without re-running.

(Optional, later) a dedicated `cleaning-report` tab kind in `useWorkspaceStore.ts`
(`TabKind`) showing the full QA markdown / per-column detail. Start inline in CaseTab.

---

## 4. Opportunity: use the project's configured thresholds (not defaults)

`cleaningApi.run` takes `CleaningConfigOverrides`. The project already persists overlapping
thresholds in `ProjectConfigFile` (`src/api/projectConfig.ts`, stored via the
project-config stack, surfaced in `ProjectConfigTab`). A high-value follow-up is a
**mapper** `ProjectConfigFile → CleaningConfigOverrides` so cleaning honors the researcher's
configured values:

| ProjectConfigFile field | CleaningConfig field | Note |
| --- | --- | --- |
| `quality_min_valid_frame_ratio` | `min_valid_frame_ratio` | |
| `quality_max_consecutive_invalid` | `max_consecutive_invalid_for_gap` | |
| `quality_eye_openness_threshold` | `eye_openness_blink_threshold` | |
| `pupil_min_diameter` | `pupil_min_diameter_mm` | confirm units (mm) |
| `pupil_max_diameter` | `pupil_max_diameter_mm` | confirm units |
| `pupil_lr_asymmetry_tolerance` | `pupil_lr_asymmetry_tolerance_mm` | confirm units |
| `pupil_blink_interpolation_method` | `pupil_interpolation_method` | **validate value** — must be `linear`\|`cubic_spline`\|`none`; translate otherwise |
| `pupil_blink_max_gap` | `pupil_blink_max_gap_ms` | confirm units (ms) |
| `focus_min_distance` | `focus_min_distance_m` | confirm units (m) |
| `focus_max_distance` | `focus_max_distance_m` | confirm units |
| `focus_min_stability` | `focus_min_stability` | |
| `saccade_max_gap_for_velocity` | `max_gap_for_velocity_ms` | confirm units |

Caveats: `resolveConfig` **throws** (`ConfigError`) on out-of-range/invalid values, so the
mapper must validate (especially the interpolation method) and fall back to defaults with a
surfaced warning rather than crashing the run. Put the mapper in `src/` (renderer) or pass
the already-loaded `projectConfigs[path]` into `runCleaning`.

---

## 5. Gotchas & constraints

- **No toast/notification primitive exists** (`src/components/feedback/` is empty). For now
  surface run errors/success inline (button state + an error line in CaseTab), or build a
  small feedback component if richer UX is wanted.
- **`runCleaning` blocks the main process.** A full recording is hundreds of thousands of
  rows; the parse/clean runs synchronously in `cleaningService`. Always show a busy state.
  If it janks the UI, move the run into a `worker_threads`/utility process (already flagged
  in a comment in `cleaningService.ts`).
- **Outputs are gitignored** (`cleaned/`). The per-project `.sight/cleaned/<id>/` artifacts
  are runtime data, not committed.
- **Tests need `window.api` mocked.** The existing `MenuBar` test fails precisely because
  `window.api` is undefined under jsdom. Any new component test that touches `cleaningApi`
  must mock `window.api.cleaning`. Consider adding a shared test setup that stubs `window.api`
  (would also fix the pre-existing MenuBar failure).
- **Config defaults vs. §6:** `derive_gaze_angles` defaults `true`; interpolation defaults
  `linear`. If the UI exposes toggles, drive them through overrides — don't fork the engine.

---

## 6. Open questions to confirm with the user before building

1. **When does cleaning run?** On-demand per case (recommended), automatically when a case
   is added, or a "Clean all cases" batch action on the project?
2. **Whose thresholds?** Ship with engine defaults first, or wire the §4 ProjectConfig
   mapper in the same pass?
3. **How much report to show?** Inline summary in CaseTab (recommended) vs. a full
   dedicated report tab / link to the generated `.qa.md`.
4. **Re-clean semantics?** Overwrite silently, or warn that existing `.sight/cleaned/<id>/`
   outputs will be replaced?

---

## 7. Suggested first slice (smallest shippable)

1. Add `cleaningReports` + `cleaningBusy` state and `runCleaning` / `refreshCleaning` to
   `useProjectStore`.
2. Add the **"Clean gaze data"** context-menu item in `ProjectExplorer`.
3. Add the **Data Quality** panel to `CaseTab` (status badge + a few `FieldRow`s + re-clean).
4. Add a component test with `window.api.cleaning` mocked.

Defaults-only, on-demand, inline summary. The ProjectConfig mapper (§4) and a full report
tab are fast-follows.
