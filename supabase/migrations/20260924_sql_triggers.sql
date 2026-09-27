-- Migration: 20260924_sql_triggers.sql
-- Description: Creates Traditional SQL Triggers for DBMS Laboratory Requirement
-- 1. trg_calculate_cadet_level (BEFORE INSERT OR UPDATE ON profile_progress)
-- 2. trg_sync_lesson_event_to_progress (AFTER INSERT ON lesson_events)
-- 3. trg_enforce_game_state_rules (BEFORE INSERT OR UPDATE ON profile_game_state)
-- 4. trg_audit_score_adjustments (AFTER UPDATE OF total_score ON profile_progress)

-- ----------------------------------------------------------------------------
-- 1. TRIGGER 1: Automatic Cadet Level Calculation & Date Sync
-- ----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION fn_trg_calculate_cadet_level()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
    NEW.total_score := GREATEST(0, COALESCE(NEW.total_score, 0));
    NEW.lessons_completed := GREATEST(0, COALESCE(NEW.lessons_completed, 0));

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

    IF NEW.lessons_completed > 0 AND (
        NEW.last_lesson_date IS NULL OR 
        (TG_OP = 'UPDATE' AND NEW.lessons_completed > COALESCE(OLD.lessons_completed, 0))
    ) THEN
        NEW.last_lesson_date := TO_CHAR(CURRENT_DATE, 'YYYY-MM-DD');
    END IF;

    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_calculate_cadet_level ON profile_progress;
CREATE TRIGGER trg_calculate_cadet_level
BEFORE INSERT OR UPDATE ON profile_progress
FOR EACH ROW
EXECUTE FUNCTION fn_trg_calculate_cadet_level();


-- ----------------------------------------------------------------------------
-- 2. TRIGGER 2: Real-time Lesson Event Aggregator (Score & Progress Sync)
-- ----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION fn_trg_sync_lesson_event_to_progress()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
DECLARE
    v_xp INT := GREATEST(0, COALESCE(NEW.score_delta, 0));
    v_is_lesson BOOLEAN := (COALESCE(NEW.event_type, 'lesson_completed') = 'lesson_completed');
    v_lesson_inc INT := CASE WHEN v_is_lesson THEN 1 ELSE 0 END;
    v_today TEXT := TO_CHAR(CURRENT_DATE, 'YYYY-MM-DD');
BEGIN
    INSERT INTO profile_progress (
        profile_id,
        total_score,
        current_level,
        lessons_completed,
        last_lesson_date
    )
    VALUES (
        NEW.profile_id,
        v_xp,
        1,
        v_lesson_inc,
        v_today
    )
    ON CONFLICT (profile_id) DO UPDATE SET
        total_score = profile_progress.total_score + EXCLUDED.total_score,
        lessons_completed = profile_progress.lessons_completed + EXCLUDED.lessons_completed,
        last_lesson_date = v_today;

    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_sync_lesson_event_to_progress ON lesson_events;
CREATE TRIGGER trg_sync_lesson_event_to_progress
AFTER INSERT ON lesson_events
FOR EACH ROW
EXECUTE FUNCTION fn_trg_sync_lesson_event_to_progress();


-- ----------------------------------------------------------------------------
-- 3. TRIGGER 3: Game State Economy & Health Guard Trigger
-- ----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION fn_trg_enforce_game_state_rules()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
    NEW.hearts := LEAST(5, GREATEST(0, COALESCE(NEW.hearts, 5)));
    NEW.gems := GREATEST(0, COALESCE(NEW.gems, 0));
    NEW.streak := GREATEST(0, COALESCE(NEW.streak, 0));
    NEW.streak_freeze_count := GREATEST(0, COALESCE(NEW.streak_freeze_count, 0));

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

DROP TRIGGER IF EXISTS trg_enforce_game_state_rules ON profile_game_state;
CREATE TRIGGER trg_enforce_game_state_rules
BEFORE INSERT OR UPDATE ON profile_game_state
FOR EACH ROW
EXECUTE FUNCTION fn_trg_enforce_game_state_rules();


-- ----------------------------------------------------------------------------
-- 4. TRIGGER 4 (AUDIT TRAIL): Automatic Score Audit Logging Trigger
-- ----------------------------------------------------------------------------
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
