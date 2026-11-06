# Project State

## Project Identity
- **Project Name:** Ascend Powerlifting Competition Management Platform
- **Purpose:** Modular powerlifting competition management platform supporting flexible Ascend Open mode, IPF-inspired federation competition mode, and custom rule profiles with full compliance, referee system, round-based scheduling, weigh-in, and audit trail.
- **Current Phase:** Public Homepage, Supabase Authentication, Real-Time Public Event Pages, Live Weight Editing & Dashboard RLS
- **Repository / Location:** `https://github.com/deekshithvodela/ascend` (`/home/drover/Projects/Powerlifting`)
- **Technology Stack:** TypeScript, React 18, React Router (HashRouter), Vite, Tailwind CSS, Lucide Icons, Supabase JS & Realtime, Express / Node.js API, PostgreSQL / Supabase, Vitest, GitHub Actions
- **Live Deployment URL:** `https://deekshithvodela.github.io/ascend/#/`
- **Database Backend:** Supabase PostgreSQL (`https://texqrojyxrfwxzirgsmx.supabase.co`)
- **License:** MIT License (`LICENSE`)

## Project Goal
Build Ascend as a modular competition management platform with a public-facing portal and secure management architecture:
1. **Public Homepage (`/#/`):**
   - Shows ongoing published and live competitions dynamically fetched from Supabase / DataClient.
   - Event cards with Name, Date, Venue, Status (Live / Published / Completed) and "View Live Event" link.
   - Prominent Organizer Login button.
2. **Supabase Authentication (`/#/login`):**
   - Direct email & password authentication via Supabase Auth (`supabase.auth.signInWithPassword`).
   - Session persistence across page refreshes.
   - Protected dashboard routes preventing unauthorized access.
3. **Authenticated Management Dashboard (`/#/dashboard`):**
   - Competition management for authorized directors: create, edit, publish/unpublish, and finalize meets.
   - Quick publishing toggles (`Draft` ↔ `Published` / `Live`).
   - Dedicated "Open Meet Console" linking to `/#/dashboard/events/:eventId`.
4. **Public Read-Only Event Page (`/#/event/:eventId`):**
   - Strictly read-only public view with zero admin, judging, or editing controls.
   - Live on-platform lifter, attempt number, weight, colored barbell plate breakdown, referee lights.
   - Real-time updates via Supabase Realtime subscriptions.
   - Live leaderboard standings with category filters and printable official sheets.
5. **Real-Time Lift Weight Editing & Atomic Judging:**
   - Real-time editable weight input on the platform card with instant plate calculation and steppers (`-5`, `-2.5`, `+2.5`, `+5`).
   - Atomic attempt declaration and consensus judging so results auto-update immediately.
6. **Strict Database Row-Level Security (RLS):**
   - Public visitors restricted to `SELECT` only on published/live/completed events, athletes, and attempts.
   - Draft and unpublished events remain strictly private.
   - Mutation operations strictly restricted to authenticated officials.

## Current State
- All 32 automated unit and integration tests passing (`npm test`).
- Production client bundle built cleanly in 2.52s (`dist/assets/index-BSdGZsK4.js`, `dist/assets/index-DXjQKw7-.css`).
- Prominent "+ Add Participant" button added directly to the competition platform dashboard and toolbar.
- Quick Add Participant modal enabled directly on the platform with auto-selection of newly added lifters.
- All registration options made completely non-mandatory with zero blocking validation or alerts.
- Directly editable weight number (`<input>` styled identically to the 7xl red display) on the live meet stage.
- Leaderboard enhanced with full Gender filtering (`All`, `Men (M)`, `Women (F)`) and interactive Discipline sorting (`Squat`, `Bench Press`, `Deadlift`, `Total`, `Ratio`, `DOTS`).

## Architecture
- `src/client/pages/HomePage.tsx` — Public homepage displaying live, published, and completed competitions.
- `src/client/pages/LoginPage.tsx` — Supabase Auth login page with master fallback.
- `src/client/pages/DashboardPage.tsx` — Protected management dashboard with publishing controls and competition creation modal.
- `src/client/pages/PublicEventPage.tsx` — Public read-only event page with real-time Supabase subscription and barbell visualizer.
- `src/client/components/platform/PlatformConsole.tsx` — Meet platform console with real-time weight editing and atomic attempt judging.
- `src/client/App.tsx` — Full HashRouter routing connecting public and authenticated routes.
- `docs/SUPABASE_SCHEMA.sql` — Production PostgreSQL schema with Row-Level Security (RLS) policies.

## Verification Status
- Full Test Suite: PASS (32 tests passing across 8 test suites).
- TypeScript & Vite Production Build: PASS.
- Production Endpoint: `https://deekshithvodela.github.io/ascend/#/`.
