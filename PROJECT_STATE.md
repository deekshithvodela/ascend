# Project State

## Project Identity
- **Project Name:** Ascend Powerlifting Competition Management Platform
- **Purpose:** Modular powerlifting competition management platform supporting flexible Ascend Open mode, IPF-inspired federation competition mode, and custom rule profiles with full compliance, referee system, round-based scheduling, weigh-in, and audit trail.
- **Current Phase:** Production Ready — Pre-Push Hardening Complete
- **Repository / Location:** `https://github.com/deekshithvodela/ascend` (`/home/drover/Projects/Powerlifting`)
- **Technology Stack:** TypeScript, React 18, Vite, Tailwind CSS, Lucide Icons, Express / Node.js API, PostgreSQL / Supabase, Vitest, GitHub Actions
- **Deployment Environment:** GitHub Pages (`https://deekshithvodela.github.io/ascend/`) + Supabase (`https://texqrojyxrfwxzirgsmx.supabase.co`)
- **License:** MIT License (`LICENSE`)

## Project Goal
Build Ascend as a modular competition management platform that supports different powerlifting competition formats, from informal open competitions to professional federation-style competitions:
1. **Ascend Open Mode (Default):** Bodyweight ratio default (`Total / BW`), open weight categories, flexible attempt tracking, optional referee/weigh-in.
2. **IPF Competition Mode:** Official IPF Technical Rulebook compliance (standard weight classes, 2-hour weigh-in, 3-referee majority judging with infraction codes, round-based flight scheduling, attempt declaration deadlines, automatic 3-fail elimination, official ranking by total with bodyweight and order-of-achievement tie-breaking, official documentation sheets).
3. **Custom Mode:** Independent event-level rule profiles, custom scoring/tie-breaking, configurable checklists, and audit logging.
4. **Referee & Attempt Customization:** Custom 1-referee (single operator with 1-decision station) and 2-attempt per lift support across queue, score sheet, and total calculations.
5. **Red Accent Rebrand:** Athletic crimson/red powerlifting aesthetic across all UI elements, virtual lights, and tables.
6. **Cloud Deployment:** GitHub Actions CI/CD to GitHub Pages (`/ascend/`) backed by live Supabase PostgreSQL schema with RLS and atomic vote resolution.

## Current State
- Full modular rules engine implemented, tested, and passing all 32 automated tests.
- Vite frontend bundle built and verified (`dist/assets/`).
- MIT License added (`LICENSE`).
- Pre-push safeguards implemented:
  - [`.gitignore`](file:///home/drover/Projects/Powerlifting/.gitignore) protecting against committing `node_modules` and local artifacts.
  - [`.github/workflows/deploy.yml`](file:///home/drover/Projects/Powerlifting/.github/workflows/deploy.yml) updated with default `/ascend/` path and Supabase key fallbacks.
  - [`index.html`](file:///home/drover/Projects/Powerlifting/index.html) updated with GitHub Pages SPA routing decoder.
- Supabase credentials and base path wired into `.env` and `.env.production`.
- Red accent theme active across all 6 main UI modules.
- Dynamic 1-referee and 2-attempt meet configuration verified.
- 6 official sheets and CSV exports verified (Weigh-in sheet, Score sheet, Referee records, CSV results, CSV weigh-in).

## Architecture
- **Directory Structure:**
  - `src/core/types/` — Strongly-typed TypeScript interfaces, enums, schemas for all competition models.
  - `src/core/competition-profiles/` — `ascend_open`, `ipf_inspired` (versioned `IPF-2024.1.0`), and `custom` profiles.
  - `src/core/rules-engine/` — Profile resolution, dependency validation, rule immutability snapshots.
  - `src/core/scoring-engine/` — Total, Bodyweight Ratio, DOTS, Wilks, Wilks 2020 formulas with rounding rules.
  - `src/core/ranking-engine/` — Official category ranking, overall open ranking, individual lift awards, team scoring.
  - `src/core/tie-breaker-engine/` — Ordered tie-breaking evaluation with auditable justification strings.
  - `src/core/attempt-scheduler/` — Flight manager, lot numbers, round-based attempt ordering, bar load calculator.
  - `src/core/judging-engine/` — 1-referee and 3-referee majority decision evaluator with jury override protections.
  - `src/core/technical-validation/` — Squat, Bench, Deadlift infraction reason codes based on IPF Technical Rules.
  - `src/core/weigh-in/` — Official weigh-in session records, re-weighing, rack heights, status transitions.
  - `src/core/equipment-inspection/` — Pass/Fail/NA inspection checklists and inspector sign-off.
  - `src/core/official-results/` — Generation of 6 official sheets (Weigh-in, Attempt/Flight, Score Sheet, Results, Referee Records, Audit Report), CSV export, printable views.
  - `src/core/audit-trail/` — Append-only audit logger for critical competition actions.
  - `src/core/services/supabase.ts` — Supabase API client and RPC executor.
  - `src/server/` — Express backend with REST/RPC endpoints, transactional state management, and rule validation.
  - `src/client/` — Vite + React frontend featuring red accent theme, 15-section Rules Dashboard, Platform Operator Queue, Referee Lights, Weigh-In, and Official Sheets.
  - `docs/` — Architecture, standards, API, Supabase SQL schema, and cloud deployment guides.
  - `.github/workflows/` — Automated CI/CD pipeline for GitHub Pages.
  - `tests/` — Automated test suite covering all engines, tie-breakers, 1-referee mode, 2-attempt meets, and IPF rules.

## Core Decisions
- **Decision 1: Full Decoupling of Rules Engine from UI**: The rules engine and scoring formulas reside in pure, testable TypeScript modules (`src/core/`), shared between backend validation and frontend display.
  - *Status:* Active & Verified.
- **Decision 2: Strict Rulebook Versioning & Snapshotting**: Every event stores a frozen rule snapshot (`ruleProfileVersion`, `rulebookEdition`, `effectiveDate`). Updating software never retroactively alters finalized competitions.
  - *Status:* Active & Verified.
- **Decision 3: Zero Mixing of Rankings**: Ascend Open ranking (bodyweight ratio / DOTS) and IPF official ranking (Total -> Bodyweight -> Order of achievement) are isolated; official federation ranking never silently substitutes formulas.
  - *Status:* Active & Verified.
- **Decision 4: Append-Only Immutable Audit Trail**: All critical operations (weight declarations, weigh-ins, referee votes, jury overrides, rule adjustments) append to an immutable audit store.
  - *Status:* Active & Verified.
- **Decision 5: Configurable Referee Panels & Attempt Counts**: Ascend natively supports 1 referee (`single_operator`) or 3 referees (`three_referee`), and customizable attempts per lift (e.g. 2 attempts or 3 attempts).
  - *Status:* Active & Verified.

## Verification Status
- Full Test Suite: PASS (32 tests passing across 8 test suites).
- TypeScript & Vite Production Build: PASS with base path `/ascend/` (`dist/assets/index-Ke0CUYyF.js`, `dist/assets/index-DqmF65at.css`).
- Local Server Hosting: ACTIVE (`http://localhost:3001` serving frontend SPA & REST API).
- License: VERIFIED (`LICENSE` MIT).
- Supabase Integration: WIRED (`.env` & `src/core/services/supabase.ts`).
- Pre-Push Hardening: COMPLETE ([`.gitignore`](file:///home/drover/Projects/Powerlifting/.gitignore), [`.github/workflows/deploy.yml`](file:///home/drover/Projects/Powerlifting/.github/workflows/deploy.yml), [`index.html`](file:///home/drover/Projects/Powerlifting/index.html)).

## Next Direction
- Ready for remote git push to `https://github.com/deekshithvodela/ascend`.
