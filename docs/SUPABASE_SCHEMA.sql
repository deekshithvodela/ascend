-- ==============================================================================
-- ASCEND POWERLIFTING PLATFORM: PRODUCTION SUPABASE POSTGRESQL SCHEMA
-- ==============================================================================
-- Supports Ascend Open, IPF Technical Rulebook, and Custom Competition Modes.
-- Includes Row Level Security (RLS), JSONB Rule Snapshots, and Audit Logging.
-- ==============================================================================

-- 1. EXTENSIONS
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- 2. ENUM TYPES
DO $$ BEGIN
    CREATE TYPE competition_profile_enum AS ENUM ('ascend_open', 'ipf_inspired', 'custom');
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
    CREATE TYPE event_status_enum AS ENUM (
        'draft', 'published', 'live', 'completed', 'unpublished',
        'weigh_in', 'in_progress', 'finalized', 'locked'
    );
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
    CREATE TYPE sex_enum AS ENUM ('M', 'F', 'MX');
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
    CREATE TYPE equipment_division_enum AS ENUM ('raw', 'classic', 'equipped', 'single_ply', 'multi_ply', 'unrestricted');
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
    CREATE TYPE weigh_in_status_enum AS ENUM ('pending', 'passed', 'failed', 'disqualified');
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
    CREATE TYPE lifter_status_enum AS ENUM ('active', 'completed', 'eliminated', 'disqualified', 'withdrawn', 'incomplete');
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
    CREATE TYPE lift_type_enum AS ENUM ('squat', 'bench_press', 'deadlift');
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
    CREATE TYPE attempt_status_enum AS ENUM ('pending', 'good_lift', 'no_lift', 'skipped', 'disqualified');
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
    CREATE TYPE referee_decision_enum AS ENUM ('good_lift', 'no_lift');
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
    CREATE TYPE referee_role_enum AS ENUM ('chief', 'left', 'right', 'operator');
EXCEPTION WHEN duplicate_object THEN null; END $$;

-- ==============================================================================
-- 3. TABLES
-- ==============================================================================

-- 3.1 EVENTS
CREATE TABLE IF NOT EXISTS public.events (
    id TEXT PRIMARY KEY DEFAULT ('evt-' || lower(substr(md5(random()::text), 1, 10))),
    name TEXT NOT NULL,
    date DATE NOT NULL DEFAULT CURRENT_DATE,
    venue TEXT NOT NULL,
    organizer TEXT NOT NULL,
    chief_referee_name TEXT,
    status event_status_enum NOT NULL DEFAULT 'draft',
    is_published BOOLEAN NOT NULL DEFAULT false,
    published_at TIMESTAMPTZ,
    rules_snapshot JSONB NOT NULL,
    custom_modifications JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now()),
    finalized_at TIMESTAMPTZ,
    finalized_by TEXT
);

-- 3.2 ATHLETES
CREATE TABLE IF NOT EXISTS public.athletes (
    id TEXT PRIMARY KEY DEFAULT ('ath-' || lower(substr(md5(random()::text), 1, 10))),
    event_id TEXT NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
    lot_number INT NOT NULL,
    registration_number TEXT NOT NULL,
    first_name TEXT NOT NULL,
    last_name TEXT NOT NULL,
    birth_date DATE,
    sex sex_enum NOT NULL DEFAULT 'M',
    age_category TEXT NOT NULL DEFAULT 'open',
    equipment_division equipment_division_enum NOT NULL DEFAULT 'raw',
    team_or_affiliation TEXT,
    declared_weight_category TEXT NOT NULL,
    verified_weight_category TEXT,
    official_bodyweight_kg NUMERIC(5, 2),
    weigh_in_status weigh_in_status_enum NOT NULL DEFAULT 'pending',
    squat_rack_height INT,
    bench_rack_height INT,
    squat_safety_pin INT,
    bench_safety_pin INT,
    lifter_status lifter_status_enum NOT NULL DEFAULT 'active',
    status_reason TEXT,
    flight TEXT DEFAULT 'Flight A',
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now()),
    CONSTRAINT uq_event_lot UNIQUE (event_id, lot_number)
);

-- 3.3 WEIGH-IN RECORDS
CREATE TABLE IF NOT EXISTS public.weigh_in_records (
    id TEXT PRIMARY KEY DEFAULT ('wrec-' || lower(substr(md5(random()::text), 1, 10))),
    athlete_id TEXT NOT NULL REFERENCES public.athletes(id) ON DELETE CASCADE,
    event_id TEXT NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
    attempt_number INT NOT NULL DEFAULT 1,
    measured_weight_kg NUMERIC(5, 2) NOT NULL,
    official_id TEXT NOT NULL,
    official_name TEXT NOT NULL,
    status weigh_in_status_enum NOT NULL,
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now())
);

-- 3.4 ATTEMPTS
CREATE TABLE IF NOT EXISTS public.attempts (
    id TEXT PRIMARY KEY DEFAULT ('att-' || lower(substr(md5(random()::text), 1, 10))),
    athlete_id TEXT NOT NULL REFERENCES public.athletes(id) ON DELETE CASCADE,
    event_id TEXT NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
    lift_type lift_type_enum NOT NULL,
    attempt_number INT NOT NULL CHECK (attempt_number BETWEEN 1 AND 4),
    weight_kg NUMERIC(6, 2) NOT NULL,
    status attempt_status_enum NOT NULL DEFAULT 'pending',
    majority_decision referee_decision_enum,
    is_jury_override BOOLEAN NOT NULL DEFAULT false,
    jury_override_by TEXT,
    jury_override_reason TEXT,
    declared_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now()),
    declaration_change_count INT NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now()),
    CONSTRAINT uq_athlete_attempt UNIQUE (athlete_id, lift_type, attempt_number)
);

-- 3.5 REFEREE VOTES
CREATE TABLE IF NOT EXISTS public.referee_votes (
    id TEXT PRIMARY KEY DEFAULT ('vote-' || lower(substr(md5(random()::text), 1, 10))),
    attempt_id TEXT NOT NULL REFERENCES public.attempts(id) ON DELETE CASCADE,
    event_id TEXT NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
    referee_id TEXT NOT NULL,
    referee_name TEXT,
    referee_role referee_role_enum NOT NULL,
    decision referee_decision_enum NOT NULL,
    infraction_reason_codes TEXT[] DEFAULT '{}',
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now()),
    CONSTRAINT uq_attempt_role UNIQUE (attempt_id, referee_role)
);

-- 3.6 IMMUTABLE AUDIT LOGS
CREATE TABLE IF NOT EXISTS public.audit_logs (
    id TEXT PRIMARY KEY DEFAULT ('audit-' || lower(substr(md5(random()::text), 1, 12))),
    event_id TEXT NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
    entity_type TEXT NOT NULL,
    entity_id TEXT NOT NULL,
    action TEXT NOT NULL,
    previous_value JSONB,
    updated_value JSONB,
    actor_id TEXT NOT NULL,
    actor_role TEXT NOT NULL,
    reason TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now())
);

-- ==============================================================================
-- 4. INDEXES
-- ==============================================================================
CREATE INDEX IF NOT EXISTS idx_athletes_event ON public.athletes(event_id);
CREATE INDEX IF NOT EXISTS idx_attempts_event_lift ON public.attempts(event_id, lift_type, attempt_number);
CREATE INDEX IF NOT EXISTS idx_attempts_athlete ON public.attempts(athlete_id);
CREATE INDEX IF NOT EXISTS idx_referee_votes_attempt ON public.referee_votes(attempt_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_event ON public.audit_logs(event_id, created_at DESC);

-- ==============================================================================
-- 5. ROW LEVEL SECURITY (RLS) POLICIES & REALTIME REPLICATION
-- ==============================================================================

ALTER TABLE public.events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.athletes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.weigh_in_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.attempts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.referee_votes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

-- 5.1 Events Table: Public Read for spectators, Anonymous & Authenticated Write for organizers
DROP POLICY IF EXISTS "Public Spectator Read Published Events" ON public.events;
DROP POLICY IF EXISTS "Officials Read All Events" ON public.events;
DROP POLICY IF EXISTS "Officials Insert Events" ON public.events;
DROP POLICY IF EXISTS "Officials Update Events" ON public.events;
DROP POLICY IF EXISTS "Allow public select events" ON public.events;
DROP POLICY IF EXISTS "Allow anon and auth insert events" ON public.events;
DROP POLICY IF EXISTS "Allow anon and auth update events" ON public.events;
DROP POLICY IF EXISTS "Allow anon and auth delete events" ON public.events;

CREATE POLICY "Allow public select events" ON public.events FOR SELECT USING (true);
CREATE POLICY "Allow anon and auth insert events" ON public.events FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow anon and auth update events" ON public.events FOR UPDATE USING (true);
CREATE POLICY "Allow anon and auth delete events" ON public.events FOR DELETE USING (true);

-- 5.2 Athletes Table
DROP POLICY IF EXISTS "Public Spectator Read Published Athletes" ON public.athletes;
DROP POLICY IF EXISTS "Officials Manage Athletes" ON public.athletes;
DROP POLICY IF EXISTS "Allow public select athletes" ON public.athletes;
DROP POLICY IF EXISTS "Allow anon and auth insert athletes" ON public.athletes;
DROP POLICY IF EXISTS "Allow anon and auth update athletes" ON public.athletes;
DROP POLICY IF EXISTS "Allow anon and auth delete athletes" ON public.athletes;

CREATE POLICY "Allow public select athletes" ON public.athletes FOR SELECT USING (true);
CREATE POLICY "Allow anon and auth insert athletes" ON public.athletes FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow anon and auth update athletes" ON public.athletes FOR UPDATE USING (true);
CREATE POLICY "Allow anon and auth delete athletes" ON public.athletes FOR DELETE USING (true);

-- 5.3 Attempts Table
DROP POLICY IF EXISTS "Public Spectator Read Published Attempts" ON public.attempts;
DROP POLICY IF EXISTS "Officials Manage Attempts" ON public.attempts;
DROP POLICY IF EXISTS "Allow public select attempts" ON public.attempts;
DROP POLICY IF EXISTS "Allow anon and auth insert attempts" ON public.attempts;
DROP POLICY IF EXISTS "Allow anon and auth update attempts" ON public.attempts;
DROP POLICY IF EXISTS "Allow anon and auth delete attempts" ON public.attempts;

CREATE POLICY "Allow public select attempts" ON public.attempts FOR SELECT USING (true);
CREATE POLICY "Allow anon and auth insert attempts" ON public.attempts FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow anon and auth update attempts" ON public.attempts FOR UPDATE USING (true);
CREATE POLICY "Allow anon and auth delete attempts" ON public.attempts FOR DELETE USING (true);

-- 5.4 Referee Votes Table
DROP POLICY IF EXISTS "Public Spectator Read Published Votes" ON public.referee_votes;
DROP POLICY IF EXISTS "Officials Manage Votes" ON public.referee_votes;
DROP POLICY IF EXISTS "Allow public select votes" ON public.referee_votes;
DROP POLICY IF EXISTS "Allow anon and auth insert votes" ON public.referee_votes;
DROP POLICY IF EXISTS "Allow anon and auth update votes" ON public.referee_votes;

CREATE POLICY "Allow public select votes" ON public.referee_votes FOR SELECT USING (true);
CREATE POLICY "Allow anon and auth insert votes" ON public.referee_votes FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow anon and auth update votes" ON public.referee_votes FOR UPDATE USING (true);

-- 5.5 Weigh-In Records & Audit Logs
CREATE POLICY "Officials Manage WeighIn" ON public.weigh_in_records FOR ALL USING (true);
CREATE POLICY "Officials Read Audit" ON public.audit_logs FOR SELECT USING (true);
CREATE POLICY "Officials Insert Audit" ON public.audit_logs FOR INSERT WITH CHECK (true);

-- 5.6 Realtime Publication for Live Streaming
DO $$ BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.events;
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.athletes;
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.attempts;
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.referee_votes;
EXCEPTION WHEN duplicate_object THEN null; END $$;

-- ==============================================================================
-- 6. STORED PROCEDURES & ATOMIC MAJORITY RESOLVER
-- ==============================================================================

-- Submits a referee vote and atomically evaluates the 2-1 or 3-0 majority decision
CREATE OR REPLACE FUNCTION public.submit_referee_vote(
    p_attempt_id TEXT,
    p_event_id TEXT,
    p_referee_id TEXT,
    p_referee_name TEXT,
    p_referee_role referee_role_enum,
    p_decision referee_decision_enum,
    p_infractions TEXT[] DEFAULT '{}'
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_white_count INT;
    v_red_count INT;
    v_total_votes INT;
    v_majority referee_decision_enum;
    v_result JSONB;
BEGIN
    -- Upsert vote
    INSERT INTO public.referee_votes (attempt_id, event_id, referee_id, referee_name, referee_role, decision, infraction_reason_codes)
    VALUES (p_attempt_id, p_event_id, p_referee_id, p_referee_name, p_referee_role, p_decision, p_infractions)
    ON CONFLICT (attempt_id, referee_role)
    DO UPDATE SET
        decision = EXCLUDED.decision,
        infraction_reason_codes = EXCLUDED.infraction_reason_codes,
        created_at = timezone('utc', now());

    -- Tally lights
    SELECT
        COUNT(*) FILTER (WHERE decision = 'good_lift'),
        COUNT(*) FILTER (WHERE decision = 'no_lift'),
        COUNT(*)
    INTO v_white_count, v_red_count, v_total_votes
    FROM public.referee_votes
    WHERE attempt_id = p_attempt_id;

    -- If 3-referee panel reached or majority confirmed
    IF v_white_count >= 2 THEN
        v_majority := 'good_lift';
        UPDATE public.attempts
        SET status = 'good_lift', majority_decision = 'good_lift', updated_at = timezone('utc', now())
        WHERE id = p_attempt_id;
    ELSIF v_red_count >= 2 THEN
        v_majority := 'no_lift';
        UPDATE public.attempts
        SET status = 'no_lift', majority_decision = 'no_lift', updated_at = timezone('utc', now())
        WHERE id = p_attempt_id;
    END IF;

    -- Append audit record
    INSERT INTO public.audit_logs (event_id, entity_type, entity_id, action, updated_value, actor_id, actor_role, reason)
    VALUES (
        p_event_id,
        'judging',
        p_attempt_id,
        'REFEREE_VOTE_CAST',
        jsonb_build_object('role', p_referee_role, 'decision', p_decision, 'infractions', p_infractions, 'majority', v_majority),
        p_referee_id,
        (p_referee_role::text || '_referee'),
        ('Vote cast: ' || upper(p_decision::text))
    );

    SELECT jsonb_build_object(
        'attempt_id', p_attempt_id,
        'white_count', v_white_count,
        'red_count', v_red_count,
        'total_votes', v_total_votes,
        'majority_decision', v_majority
    ) INTO v_result;

    RETURN v_result;
END;
$$;

