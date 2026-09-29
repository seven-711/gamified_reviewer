-- ============================================================================
-- DATABASE SERVER MIGRATION: 4 TRADITIONAL SQL TRIGGERS
-- SYSTEM: CIVIL SERVICE EXAMINATION (CSE) REVIEWER GAMIFIED
-- ============================================================================
-- Requirement Compliance:
-- 1. VALIDATION TRIGGER (Prevents invalid quantities / negative economy balances)
-- 2. ENFORCING BUSINESS RULES TRIGGER (Calculates cadet rank level from XP & syncs date)
-- 3. AUDITING DATABASE CHANGES TRIGGER (Maintains immutable score & rank audit ledger)
-- 4. AUTOMATIC DATA LOGGING TRIGGER (Auto-logs learning activity from lesson events)
-- ============================================================================

-- ============================================================================
-- 1. VALIDATION TRIGGER: Prevent Invalid Quantity / Negative Balance
-- Target Table: profile_game_state
-- Timing/Event: BEFORE INSERT OR UPDATE
-- ============================================================================
-- Explanation: The database must prevent any transaction that results in an
-- invalid quantity (e.g. negative gems balance, hearts exceeding maximum 
-- capacity of 5, or equipping more than 2 streak freezes).
-- ============================================================================
CREATE OR REPLACE FUNCTION fn_trg_validate_game_economy()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
    -- 1. Validate Gems Balance: Reject negative balance (cannot spend more than owned)
    IF NEW.gems < 0 THEN
        RAISE EXCEPTION 'Validation Trigger Error: Insufficient gem balance (short by % gems). Transaction rejected by database.', ABS(NEW.gems);
    END IF;

    -- 2. Validate Hearts: Cannot exceed maximum capacity of 5
    IF NEW.hearts > 5 THEN
        RAISE EXCEPTION 'Validation Trigger Error: Heart capacity cannot exceed 5 (attempted: %). Transaction rejected by database.', NEW.hearts;
    END IF;

    -- 3. Validate Hearts: Cannot be negative
    IF NEW.hearts < 0 THEN
        RAISE EXCEPTION 'Validation Trigger Error: Hearts cannot be negative (attempted: %). Transaction rejected by database.', NEW.hearts;
    END IF;

    -- 4. Validate Streak Freezes: Cannot equip more than 2
    IF NEW.streak_freeze_count > 2 THEN
        RAISE EXCEPTION 'Validation Trigger Error: Cannot equip more than 2 Streak Freezes (attempted: %). Transaction rejected by database.', NEW.streak_freeze_count;
    END IF;

    -- Automatic timestamp management for heart regeneration
    IF NEW.hearts < 5 THEN
        IF NEW.last_heart_lost_at IS NULL THEN
            NEW.last_heart_lost_at := TO_CHAR(NOW(), 'YYYY-MM-DD"T"HH24:MI:SS.MS"Z"');
        END IF;
    ELSE
        NEW.last_heart_lost_at := NULL;
    END IF;

    RETURN NEW;
END;
$$;

-- Drop any legacy triggers that silently clamp values and prevent validation exceptions
DROP TRIGGER IF EXISTS trg_enforce_game_state_rules ON profile_game_state;
DROP TRIGGER IF EXISTS trg_before_update_game_state ON profile_game_state;
DROP FUNCTION IF EXISTS fn_trg_enforce_game_state_rules();

DROP TRIGGER IF EXISTS trg_validate_game_economy ON profile_game_state;
CREATE TRIGGER trg_validate_game_economy
BEFORE INSERT OR UPDATE ON profile_game_state
FOR EACH ROW
EXECUTE FUNCTION fn_trg_validate_game_economy();


-- ============================================================================
-- 2. ENFORCING BUSINESS RULES TRIGGER: Automatic Cadet Rank Tier Calculation
-- Target Table: profile_progress
-- Timing/Event: BEFORE INSERT OR UPDATE
-- ============================================================================
-- Explanation: The database enforces gamified rank progression rules. It 
-- automatically calculates the cadet rank level based on cumulative XP tiers
-- and synchronizes last_lesson_date to the current date upon lesson completion.
-- ============================================================================
CREATE OR REPLACE FUNCTION fn_trg_enforce_cadet_progression_rules()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
    -- Business Invariant: Clamp score and lessons completed to non-negative
    NEW.total_score := GREATEST(0, COALESCE(NEW.total_score, 0));
    NEW.lessons_completed := GREATEST(0, COALESCE(NEW.lessons_completed, 0));

    -- Enforce Civil Service cadet level milestones from XP:
    -- Level 1: 0 - 499 XP (Cadet Recruit)
    -- Level 2: 500 - 999 XP (Junior Cadet)
    -- Level 3: 1,000 - 1,999 XP (Senior Cadet)
    -- Level 4: 2,000 - 3,499 XP (Officer Cadet)
    -- Level 5: 3,500 - 4,999 XP (Master Cadet)
    -- Level 6: 5,000 - 7,499 XP (Lieutenant Cadet)
    -- Level 7+: 7,500+ XP (Captain Cadet)
    IF NEW.total_score >= 7500 THEN
        NEW.current_level := 7 + FLOOR((NEW.total_score - 7500) / 2500)::INT;
    ELSIF NEW.total_score >= 5000 THEN
        NEW.current_level := 6;
    ELSIF NEW.total_score >= 3500 THEN
        NEW.current_level := 5;
    ELSIF NEW.total_score >= 2000 THEN
        NEW.current_level := 4;
    ELSIF NEW.total_score >= 1000 THEN
        NEW.current_level := 3;
    ELSIF NEW.total_score >= 500 THEN
        NEW.current_level := 2;
    ELSE
        NEW.current_level := 1;
    END IF;

    -- Business Rule: Automatically update last_lesson_date when lessons completed increments
    IF NEW.lessons_completed > 0 AND (
        NEW.last_lesson_date IS NULL OR 
        (TG_OP = 'UPDATE' AND NEW.lessons_completed > COALESCE(OLD.lessons_completed, 0))
    ) THEN
        NEW.last_lesson_date := TO_CHAR(CURRENT_DATE, 'YYYY-MM-DD');
    END IF;

    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_enforce_cadet_progression_rules ON profile_progress;
CREATE TRIGGER trg_enforce_cadet_progression_rules
BEFORE INSERT OR UPDATE ON profile_progress
FOR EACH ROW
EXECUTE FUNCTION fn_trg_enforce_cadet_progression_rules();


-- ============================================================================
-- 3. AUDITING DATABASE CHANGES TRIGGER: Immutable Score & Rank Audit Ledger
-- Target Table: profile_progress -> score_audit_logs
-- Timing/Event: AFTER UPDATE OF total_score
-- ============================================================================
-- Explanation: The database automatically audits all score and level modifications,
-- constructing an immutable ledger of previous score, new score, score delta (+XP),
-- previous level, new level, and timestamp to prevent cheating and track progress.
-- ============================================================================
CREATE TABLE IF NOT EXISTS score_audit_logs (
    id BIGSERIAL PRIMARY KEY,
    profile_id VARCHAR(100) NOT NULL,
    old_score INT NOT NULL,
    new_score INT NOT NULL,
    score_delta INT NOT NULL,
    old_level INT,
    new_level INT,
    changed_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE OR REPLACE FUNCTION fn_trg_audit_score_adjustments()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    IF OLD.total_score IS DISTINCT FROM NEW.total_score THEN
        INSERT INTO score_audit_logs (
            profile_id,
            old_score,
            new_score,
            score_delta,
            old_level,
            new_level,
            changed_at
        )
        VALUES (
            NEW.profile_id,
            COALESCE(OLD.total_score, 0),
            COALESCE(NEW.total_score, 0),
            COALESCE(NEW.total_score, 0) - COALESCE(OLD.total_score, 0),
            OLD.current_level,
            NEW.current_level,
            NOW()
        );
    END IF;

    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_audit_score_adjustments ON profile_progress;
CREATE TRIGGER trg_audit_score_adjustments
AFTER UPDATE OF total_score ON profile_progress
FOR EACH ROW
EXECUTE FUNCTION fn_trg_audit_score_adjustments();

-- RLS policies for score_audit_logs
ALTER TABLE score_audit_logs ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow all users to read score audit logs" ON score_audit_logs;
CREATE POLICY "Allow all users to read score audit logs" ON score_audit_logs FOR SELECT USING (true);
DROP POLICY IF EXISTS "Allow system and triggers to insert score audit logs" ON score_audit_logs;
CREATE POLICY "Allow system and triggers to insert score audit logs" ON score_audit_logs FOR INSERT WITH CHECK (true);


-- ============================================================================
-- 4. AUTOMATIC DATA LOGGING TRIGGER: Automatic Activity Logging from Lesson Events
-- Target Table: lesson_events -> cadet_activity_logs
-- Timing/Event: AFTER INSERT
-- ============================================================================
-- Explanation: Whenever a practice drill or exam event is inserted into 
-- lesson_events, the database automatically logs a human-readable activity entry
-- into cadet_activity_logs, decoupling event auditing from the application layer.
-- ============================================================================
CREATE TABLE IF NOT EXISTS cadet_activity_logs (
    id BIGSERIAL PRIMARY KEY,
    profile_id VARCHAR(100) NOT NULL,
    event_type VARCHAR(50) NOT NULL,
    activity_description TEXT NOT NULL,
    xp_gained INT NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE OR REPLACE FUNCTION fn_trg_auto_log_cadet_activity()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_xp INT := GREATEST(0, COALESCE(NEW.score_delta, 0));
    v_desc TEXT;
BEGIN
    IF NEW.event_type = 'lesson_completed' THEN
        v_desc := 'Completed CSE Practice Drill (+' || v_xp || ' XP)';
    ELSIF NEW.event_type = 'mock_exam' THEN
        v_desc := 'Completed Full Mock Exam Simulation (+' || v_xp || ' XP)';
    ELSE
        v_desc := 'Reviewer Drill Activity: ' || COALESCE(NEW.event_type, 'General Drill') || ' (+' || v_xp || ' XP)';
    END IF;

    INSERT INTO cadet_activity_logs (
        profile_id,
        event_type,
        activity_description,
        xp_gained,
        created_at
    )
    VALUES (
        NEW.profile_id,
        COALESCE(NEW.event_type, 'lesson_completed'),
        v_desc,
        v_xp,
        NOW()
    );

    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_auto_log_cadet_activity ON lesson_events;
CREATE TRIGGER trg_auto_log_cadet_activity
AFTER INSERT ON lesson_events
FOR EACH ROW
EXECUTE FUNCTION fn_trg_auto_log_cadet_activity();

-- RLS policies for cadet_activity_logs
ALTER TABLE cadet_activity_logs ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow all users to read cadet activity logs" ON cadet_activity_logs;
CREATE POLICY "Allow all users to read cadet activity logs" ON cadet_activity_logs FOR SELECT USING (true);
DROP POLICY IF EXISTS "Allow system and triggers to insert cadet activity logs" ON cadet_activity_logs;
CREATE POLICY "Allow system and triggers to insert cadet activity logs" ON cadet_activity_logs FOR INSERT WITH CHECK (true);
