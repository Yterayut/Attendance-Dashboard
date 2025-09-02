# Attendance Dashboard — Engineering Memory (Dark Mode + Day View Fixes)

## Changelog
- 2025-09-02
  - Day view: map `name -> employee` before passing to `DailyTable` (names now render).
  - Normalize API person status (Thai/English) to `present|leave|not_reported`.
  - Dark Mode: chip headers + list items use theme tokens and safe inline `color: var(--on-surface)`.
  - Add theme tokens in `globals.css` (surfaces, text, chip, status).
  - Refactor AdvancedFilter/RealTimeStatus/SummaryCards/DailyTable to tokens; reduce translucent backgrounds in dark.
  - A11y: add `aria-label`/`sr-only` to icon-only buttons (refresh, notifications, calendar nav, theme toggle).
  - Theme Lab page (`/?lab=1`) and Playwright + axe-core tests; add `npm run test:e2e`.

This file records recent changes so future work can build on them confidently.

## Outcomes
- Day view now lists employee names correctly under each status.
- Dark mode text is readable across components (chip headers, lists, cards, bars).
- Accessibility improved for icon-only controls (aria-label + sr-only).
- Theme tokens added to centralize dark/light surfaces and status colors.
- Theme Lab page and Playwright + axe-core a11y tests added for ongoing QA.

## Root Causes and Fixes
- Day view names not visible:
  - DailyTable expected `employee` but upstream data used `name`.
  - Fix: map `name -> employee` when passing data to `DailyTable`.
  - Normalized API person status (Thai/English) to `present | leave | not_reported` so grouping works.
- Dark mode unreadable text:
  - Chip header and list items were drawn on translucent surfaces; arbitrary Tailwind color class sometimes not applied.
  - Fix: chip header + list items use theme tokens and inline `style={{ color: 'var(--on-surface)' }}` as a safe fallback.

## Theme Tokens (globals)
Defined in `src/figma/styles/globals.css` for both light and dark:
- Surfaces: `--surface-1`, `--surface-2`, `--panel-bg`
- Text: `--on-surface`, `--on-surface-muted`
- Chip: `--chip-bg`, `--chip-border`
- Status: `--status-present/leave/notrep-{fg|bg}`

Usage patterns:
- Panels: `bg-[var(--panel-bg)]`
- Headers (chip): `bg-[var(--chip-bg)] border-[var(--chip-border)]`
- Text: `style={{ color: 'var(--on-surface)' }}` or `text-[color:var(--on-surface)]`
- Muted: `text-[color:var(--on-surface-muted)]`
- Status borders: `border-[var(--status-*-fg)]`

## Files Touched (by area)
- Day data plumbing
  - `src/components/AttendanceDashboard.tsx`
    - Normalize API person status (Thai/English → present/leave/not_reported).
    - Pass `employee = name` to `DailyTable` and include `checkIn/checkOut` if present.
- Daily view rendering
  - `src/components/DailyTable.tsx`
    - Chip header with high-contrast background; safe inline text color.
    - Robust name rendering: fallback `'—'`, show "ไม่มีรายชื่อ" only if truly empty.
- Real-time/status & filters (dark mode + a11y)
  - `src/components/RealTimeStatus.tsx`, `src/components/AdvancedFilter.tsx`
    - Use theme tokens; reduce transparency; add `aria-label`/`sr-only` for icon-only buttons.
- Monthly summary readability
  - `src/components/MonthlyDaysTable.tsx` — improve dark text color on stats.
- Summary cards contrast
  - `src/components/SummaryCards.tsx` — strengthen dark gradients.
- Theme tokens
  - `src/figma/styles/globals.css` — add tokens above.
- Theme Lab + a11y tests
  - `src/ThemeLab.tsx`, `src/main.tsx` (lab entry via `?lab=1` or `#theme-lab`).
  - `e2e/theme-lab.spec.ts`, `package.json` (`test:e2e`).

## Representative Commits (main)
- `fix(day view): map filteredDailyEmployees -> DailyTable shape (employee=name) ...`
- `fix(day data): normalize person.status from API (Thai/English) ...`
- `fix(daily-table): robust name rendering — fallback to '—' and safe text color`
- `feat(theme-tokens): add surface/status tokens and refactor key components ...`
- `feat(dark-mode): system pass — chip headers, reduce transparency, strengthen gradients`
- `a11y: add aria-label/sr-only to icon-only buttons; add aria to calendar nav`
- `test(e2e): add Playwright + axe-core ThemeLab accessibility tests and lab entry`

## How to Test
- Local/dev
  - `npm install`
  - `npm run dev` → open `/?lab=1` to review Light/Dark quickly.
- Build
  - `npm run build` then `npm run preview`
- a11y (one-time `npx playwright install`)
  - `npm run test:e2e`

## Next Suggestions
- Show `checkIn/checkOut` under each name when available.
- Add copy-to-clipboard for day names; optional sort/search within each block.
- CI: GitHub Actions to run `npm run build` and `npm run test:e2e` on PRs.

---
This memory file should be updated with each substantive change to keep context fresh for future iterations.
