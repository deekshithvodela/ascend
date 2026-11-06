# Step-by-Step Deployment Guide: GitHub Pages & Supabase

This guide provides complete, step-by-step instructions to deploy **Ascend Powerlifting** as a high-performance, cost-effective production system:
- **Frontend SPA**: Hosted globally on **GitHub Pages** (free, high-speed CDN, custom domain support).
- **Backend & Database**: Hosted on **Supabase** (PostgreSQL, Row Level Security, Real-Time subscriptions, and Auth).

---

## Architecture Overview

```
                      ┌──────────────────────────────────────┐
                      │            SPECTATOR / WEB           │
                      │  https://<user>.github.io/<repo>/    │
                      └──────────────────┬───────────────────┘
                                         │
                         HTTPS (SPA Static HTML/JS/CSS)
                                         │
                      ┌──────────────────▼───────────────────┐
                      │             GITHUB PAGES             │
                      │   (Automated CI/CD via Actions)      │
                      └──────────────────┬───────────────────┘
                                         │
                             REST / Real-Time WebSocket
                                         │
                      ┌──────────────────▼───────────────────┐
                      │               SUPABASE               │
                      │  - PostgreSQL 15+                    │
                      │  - Row-Level Security (RLS)          │
                      │  - JSONB Rules Snapshots             │
                      │  - Append-Only Audit Trail           │
                      └──────────────────────────────────────┘
```

---

## Part 1: Provisioning & Configuring Supabase

### Step 1.1: Create a Supabase Project
1. Go to [https://supabase.com](https://supabase.com) and sign in (or create an account).
2. Click **New Project**.
3. Fill in the project details:
   - **Name**: `ascend-powerlifting` (or your preferred name)
   - **Database Password**: Choose a strong password and save it securely.
   - **Region**: Select the region closest to your competition venue or primary audience.
   - **Pricing Plan**: Free tier (sufficient for hundreds of meets and thousands of attempts).
4. Click **Create new project** and wait 1–2 minutes for database provisioning.

### Step 1.2: Execute the Production SQL Schema
1. In your Supabase project dashboard, navigate to the **SQL Editor** tab (icon `>_` on the left sidebar).
2. Click **+ New Query**.
3. Open [`docs/SUPABASE_SCHEMA.sql`](file:///home/drover/Projects/Powerlifting/docs/SUPABASE_SCHEMA.sql) from this repository, copy its entire contents, and paste them into the SQL Editor.
4. Click **Run** (or press `Ctrl+Enter`).
5. Confirm that the following tables and functions were created:
   - Tables: `events`, `athletes`, `weigh_in_records`, `attempts`, `referee_votes`, `audit_logs`.
   - Function: `submit_referee_vote`.
   - Security: Row Level Security (RLS) policies enabled.

### Step 1.3: Retrieve API Credentials
1. Navigate to **Project Settings** (gear icon at the bottom of the left sidebar) $\to$ **API**.
2. Locate and copy:
   - **Project URL** (`https://<project-ref>.supabase.co`)
   - **anon / public key** (Safe to expose in the browser client for read and authenticated operations)
   - **service_role key** (Keep secret; used only for administrative migration scripts)

### Step 1.4: Create Competition Official User Accounts
1. In the Supabase dashboard, click **Authentication** $\to$ **Users**.
2. Click **Add User** $\to$ **Create User**.
3. Create accounts for your competition officials (e.g., `chief.referee@meet.com`, `platform.manager@meet.com`).
4. These credentials allow officials to log in and cast votes or record weigh-ins through Row Level Security. Spectators browsing the leaderboard do not need to log in.

---

## Part 2: GitHub Repository Setup & SPA Routing

### Step 2.1: Base URL Configuration
When deploying to GitHub Pages under a repository name (e.g. `https://<username>.github.io/<repo-name>/`), Vite needs to know the subpath.

In `vite.config.ts`, verify the `base` property:
```typescript
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  base: process.env.VITE_BASE_PATH || '/',
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
});
```

### Step 2.2: The Single-Page Application (SPA) 404 Fallback Trick
GitHub Pages is a static file host. If a user reloads `https://<username>.github.io/<repo-name>/leaderboard`, GitHub Pages looks for `leaderboard/index.html` and returns a 404.

Ascend includes a `public/404.html` redirect script that intercepts 404 errors on GitHub Pages and routes them back to `index.html` with query parameters preserving the intended view:
1. When GitHub Pages hits a missing route, it serves `public/404.html`.
2. The script encodes the current URL and redirects to `index.html`.
3. `index.html` decodes the path and restores the exact tab or sub-view smoothly.

---

## Part 3: GitHub Actions CI/CD Pipeline

### Step 3.1: Enable GitHub Pages in Repository Settings
1. Go to your repository on GitHub: `https://github.com/<username>/<repo-name>`.
2. Click **Settings** $\to$ **Pages** (under "Code and automation").
3. Under **Build and deployment** $\to$ **Source**, select:
   👉 **GitHub Actions** (NOT "Deploy from a branch").

### Step 3.2: Configure Repository Secrets & Variables
1. In your GitHub repository, click **Settings** $\to$ **Secrets and variables** $\to$ **Actions**.
2. Under **Repository secrets**, click **New repository secret**:
   - Name: `VITE_SUPABASE_URL`
   - Secret: Your Supabase Project URL (`https://<project-ref>.supabase.co`)
3. Click **New repository secret**:
   - Name: `VITE_SUPABASE_ANON_KEY`
   - Secret: Your Supabase `anon` / `public` API key.
4. Under **Repository variables** (optional, only if using a custom subpath):
   - Name: `VITE_BASE_PATH`
   - Value: `/<repo-name>/` (e.g. `/Powerlifting/`)

### Step 3.3: Verify the GitHub Actions Workflow
Ascend includes `.github/workflows/deploy.yml`. Whenever you push commits to the `main` branch, GitHub Actions automatically:
1. Checks out the code.
2. Installs dependencies (`npm ci`).
3. Runs the test suite (`npm test`).
4. Builds the production bundle (`npm run build`).
5. Deploys the static bundle to GitHub Pages over HTTPS.

---

## Part 4: Production Verification Checklist

Once the GitHub Actions workflow completes:
1. Open your published GitHub Pages URL (e.g., `https://<username>.github.io/<repo-name>/`).
2. **Profile Switching**: Toggle between *Ascend Open Summer Classic* and *National Powerlifting Championship (IPF Technical Standard)*.
3. **Platform Queue**: Verify that the ascending queue and calibrated colored plate loading discs render correctly.
4. **3-Referee Console**: Test clicking White and Red lights for Chief, Left, and Right referees; verify the majority calculation (2-1 or 3-0).
5. **Weigh-In**: Open the weigh-in table and verify bodyweight against category limits.
6. **Official Documentation**: Click **Official Score Sheet** and **Referee Decision Audit** to verify printable layouts and sign-off blocks.
7. **CSV Export**: Click **Export CSV** to ensure scores and attempt histories download cleanly.

---

## Part 5: Custom Domain Setup (Optional)

To point your own domain (e.g., `meet.myclub.com` or `live.powerlifting.org`):
1. In your GitHub repository, go to **Settings** $\to$ **Pages**.
2. Under **Custom domain**, enter your domain name (e.g., `live.powerlifting.org`).
3. In your DNS provider (Cloudflare, Namecheap, Route53, etc.), create:
   - For a subdomain: `CNAME` pointing to `<username>.github.io`.
   - For an apex domain: Four `A` records pointing to GitHub's IP addresses (`185.199.108.153`, `185.199.109.153`, `185.199.110.153`, `185.199.111.153`).
4. Check **Enforce HTTPS** in GitHub Pages.

