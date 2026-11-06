# Project State

## Project Identity
- **Project Name:** Ascend Powerlifting Competition Management Platform
- **Purpose:** Modular powerlifting competition management platform supporting flexible Ascend Open mode, IPF-inspired federation competition mode, and custom rule profiles with full compliance, referee system, round-based scheduling, weigh-in, and audit trail.
- **Current Phase:** Streamlined Release — Simple Dashboard, Unified Weigh-in, Delete Participant & Organizer Login
- **Repository / Location:** `https://github.com/deekshithvodela/ascend` (`/home/drover/Projects/Powerlifting`)
- **Technology Stack:** TypeScript, React 18, Vite, Tailwind CSS, Lucide Icons, Express / Node.js API, PostgreSQL / Supabase, Vitest, GitHub Actions
- **Live Deployment URL:** `https://deekshithvodela.github.io/ascend/`
- **Database Backend:** Supabase PostgreSQL (`https://texqrojyxrfwxzirgsmx.supabase.co`)
- **License:** MIT License (`LICENSE`)

## Project Goal
Build Ascend as a modular competition management platform that supports different powerlifting competition formats, from informal open competitions to professional federation-style competitions:
1. **Simple, Intuitive Live Meet Dashboard:**
   - Always-active platform card with independent steppers: Next/Prev Lifter (with dropdown), Next/Prev Lift (Squat/Bench/Deadlift), Next/Prev Attempt (#1/#2/#3).
   - Working 1-click action buttons on card: `[⚪ Good Lift]`, `[🔴 No Lift]`, `[Next Lifter ►]`.
   - Barbell plate breakdown visualizer with colored discs and quick weight steppers (`-2.5kg`, `+2.5kg`, `+5kg`).
2. **General Organizer Login:**
   - Prominent login modal in Header with instant 1-click "Log in as Meet Organizer / Director" or Supabase credentials.
   - Dual-mode: Full Organizer Mode vs Read-only Spectator/Participant View.
3. **Unified Registration + Weigh-In (No Separate Round):**
   - Single-step participant entry form combining Name, Sex, Category, Verified Bodyweight (kg), Squat & Bench Rack Heights, and Opening Attempt declarations.
4. **Delete Participant Feature:**
   - Dedicated Delete (`Trash`) button on each participant row to remove lifters and their attempts from the competition.
5. **Clean 3-Tab Interface:**
   - Platform (Live Meet), Participants & Registration, Results & Standings.

## Current State
- All 32 automated unit and integration tests passing (`npm test`).
- Production client bundle built cleanly in 2.90s (`dist/assets/index-DByQoP8W.js`).
- Pre-push safeguards active (`.gitignore`, subpath `/ascend/`, SPA route decoder).
- Pushed to `main` at `git@github.com:deekshithvodela/ascend.git`.

## Architecture
- `src/client/components/platform/PlatformConsole.tsx` — Streamlined live meet dashboard with working steppers and card decisions.
- `src/client/components/athletes/AthleteRoster.tsx` — Unified registration + weigh-in + participant deletion.
- `src/client/components/auth/LoginModal.tsx` — General organizer login and spectator mode toggle.
- `src/client/components/layout/Header.tsx` — Streamlined 3-tab navigation with Organizer badge.
- `src/client/services/data-client.ts` — Universal dual-mode data layer with static in-browser fallback and persistence.
- `src/server/store.ts` — Transactional memory store with `deleteAthlete` and initial seed data.

## Verification Status
- Full Test Suite: PASS (32 tests passing across 8 test suites).
- TypeScript & Vite Production Build: PASS.
- Production Endpoint: `https://deekshithvodela.github.io/ascend/`.
