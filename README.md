# Ascend Powerlifting Platform

> **Modular Competition Management, Technical Standards & Federation Compliance Engine**

Ascend is a modular powerlifting competition management platform designed to run everything from informal, recreational gym meets to strict, professional federation-grade championships adhering to official technical rulebooks.

---

## 🌟 Overview & Supported Competition Profiles

Ascend does not hardcode a single federation's rules into the application. Every competition event has its own independently configured, versioned, and immutable rule set.

| Feature / Standard | Ascend Open Mode (Default) | IPF Competition Mode | Custom Mode |
| :--- | :--- | :--- | :--- |
| **Weight Categories** | Optional / Open-weight | Mandatory Official IPF Classes | Organizers define custom ranges |
| **Primary Ranking** | Bodyweight Ratio ($\frac{\text{Total}}{\text{BW}}$) | Weight-Category Total Lifted | Total, DOTS, Wilks, or Ratio |
| **Weigh-In Workflow** | Self-reported or verified | Strict 2-hour official weigh-in | Configurable window & re-weighs |
| **Judging System** | Single operator / Multi-judge | 3-Referee Panel (Chief, Left, Right) | 1, 2, or 3+ judges with custom thresholds |
| **Technical Infractions**| Optional | Official IPF Red-Card Infraction Codes | Configurable checklist |
| **Attempt Scheduling** | Simple sequential queue | Round-based flights (max 14 lifters) | Flexible or round-based |
| **Deadlift 3rd Attempt**| Standard declarations | Up to 2 weight changes allowed | Configurable change limits |
| **Bomb-Out Consequences**| Total reflects valid lifts | 3 misses in 1 lift bombs out of total | Disqualify or preserve medals |
| **Tie-Breaking Method** | Bodyweight Ratio $\to$ Total $\to$ BW | Total $\to$ Lower BW $\to$ Lot Number | Fully re-orderable sequence |
| **Official Sheets** | Score sheet & CSV | Score, Weigh-In, Referee Sheets, CSV | Configurable printable documents |

---

## ⚡ Core Modules & Workflows

### 1. 15-Section Rules & Settings Dashboard
An exhaustive, dedicated configuration suite with real-time dependency validation (`RulesDependencyValidator`) that automatically detects conflicting rules and surfaces one-click **Auto-Fix** recommendations:
1. Competition Profile
2. Competition Format
3. Weight Categories
4. Scoring & Ranking
5. Athlete Registration
6. Weigh-In Workflow
7. Attempt Management
8. Scheduling & Flights
9. Referee & Judging
10. Technical Validation
11. Elimination & Disqualification
12. Tie-Breaking Engine
13. Equipment Inspection
14. Official Documentation
15. Audit Trail & Finalization Locking

### 2. Platform Operator Console & Olympic Bar Loader
- Real-time attempt queue sorting: **Current on platform**, **On deck**, and **In the hole**.
- In round-based mode, attempts are sorted in ascending weight order, with ties broken by lot number.
- Automatic calibrated plate loading visualizer displaying plate breakdowns per side with standard color codes: Red (25kg), Blue (20kg), Yellow (15kg), Green (10kg), White (5kg), Black (2.5kg), and Silver (1.25kg, 0.5kg, 0.25kg).

### 3. 3-Referee Virtual Lights System
- Dedicated voting pads for **Chief Referee**, **Left Referee**, and **Right Referee**.
- Real-time majority decision calculation (2-1 or 3-0 white lights = Good Lift; 2-1 or 3-0 red lights = No Lift).
- Specific technical red-card infraction reason codes based on current official IPF Technical Rules for Squat, Bench Press, and Deadlift.
- Authorized Jury / Chief Referee override workflow with mandatory recorded justification.

### 4. Official Weigh-In & Rack Heights Desk
- 2-hour weigh-in window tracking with re-weigh records.
- Instant validation against category boundaries (Passed, Overweight, Underweight).
- Platform squat and bench rack height recording.

### 5. Live Leaderboard & Official Documentation
- Instant recalculation of Totals, Bodyweight Ratios, DOTS, and Wilks points.
- Transparent tie-break explanation strings displayed for every rank (e.g. `Rank determined by lower bodyweight: 82.1kg vs 82.6kg`).
- Print-ready HTML official sheets and standard CSV exports for Weigh-in Sheets, Attempt Cards, Competition Score Sheets, and Referee Decisions.

### 6. Append-Only Immutable Audit Trail
- Every critical competition operation (registration, weigh-in, attempt weight declaration, referee vote, jury override, finalization) is permanently logged with timestamp and actor attribution.

---

## 🚀 Quick Start

### Prerequisites
- Node.js (v20.x or later)
- npm (v10.x or later)

### Installation
```bash
git clone <repo-url>
cd Powerlifting
npm install
```

### Run Automated Tests
```bash
npm test
```
Runs the Vitest test suite (31 tests covering scoring formulas, tie-breakers, IPF rule cases, referee consensus, and API flows).

### Local Hosting (Full-Stack Mode)
```bash
npm run server
```
Launches the Express API server and serves the built single-page application at:
👉 **http://localhost:3001**

### Development Mode (Vite Hot-Reload)
```bash
npm run dev
```
Starts the Vite client dev server at `http://localhost:5173` with proxy forwarding to the API.

---

## 📖 Documentation Directory

Comprehensive technical guides are available in the [`docs/`](file:///home/drover/Projects/Powerlifting/docs) directory:

- [**Architecture Guide (`docs/ARCHITECTURE.md`)**](file:///home/drover/Projects/Powerlifting/docs/ARCHITECTURE.md): Decoupled engine design, data flows, and immutability guarantees.
- [**Competition Standards (`docs/COMPETITION_STANDARDS.md`)**](file:///home/drover/Projects/Powerlifting/docs/COMPETITION_STANDARDS.md): Deep-dive into Ascend Open vs official IPF Technical Rulebook compliance.
- [**API Reference (`docs/API_REFERENCE.md`)**](file:///home/drover/Projects/Powerlifting/docs/API_REFERENCE.md): Complete REST/RPC endpoints specification, request payloads, and response schemas.
- [**Deployment Guide (`docs/DEPLOYMENT_GUIDE.md`)**](file:///home/drover/Projects/Powerlifting/docs/DEPLOYMENT_GUIDE.md): Step-by-step instructions to deploy to **GitHub Pages** (Frontend SPA) and **Supabase** (PostgreSQL Database, Auth, RLS).
- [**Supabase SQL Schema (`docs/SUPABASE_SCHEMA.sql`)**](file:///home/drover/Projects/Powerlifting/docs/SUPABASE_SCHEMA.sql): Production PostgreSQL schema with Row-Level Security and audit triggers.

---

## ⚖️ Compliance Disclaimer

Implementing these procedures and technical rulebook profiles does not itself confer IPF or federation sanctioning, certification, or official recognition. Actual competition compliance must be validated against the applicable current rulebook and conducted by qualified, accredited competition officials.

