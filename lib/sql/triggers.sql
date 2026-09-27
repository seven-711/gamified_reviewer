-- ============================================================================
-- DBMS LABORATORY REQUIREMENT: TRADITIONAL SQL TRIGGERS
-- SYSTEM: CIVIL SERVICE EXAM (CSE) REVIEWER GAMIFIED
-- ============================================================================
-- This script defines four (4) Traditional SQL Triggers:
--
-- 1. BEFORE INSERT OR UPDATE ON profile_progress:
--    trg_calculate_cadet_level (fn_trg_calculate_cadet_level)
--    Enforces non-negative score/lesson constraints and automatically calculates
--    the cadet's gamified current_level from total_score XP thresholds, syncing
--    last_lesson_date.
--
-- 2. AFTER INSERT ON lesson_events:
--    trg_sync_lesson_event_to_progress (fn_trg_sync_lesson_event_to_progress)
--    Automatically synchronizes completed lesson drills into profile_progress,
--    incrementing total_score, lessons_completed, and triggering level recomputation.
--
-- 3. BEFORE INSERT OR UPDATE ON profile_game_state:
--    trg_enforce_game_state_rules (fn_trg_enforce_game_state_rules)
--    Enforces game economy and health invariants: clamps hearts between 0 and 5,
--    prevents negative gems/streaks, and manages heart depletion timestamps.
--
-- 4. AFTER UPDATE OF total_score ON profile_progress:
--    trg_audit_score_adjustments (fn_trg_audit_score_adjustments)
--    Maintains an immutable audit ledger (score_audit_logs) tracking user XP
--    adjustments, deltas, rank changes, and exact timestamps.
--
-- Both PostgreSQL (Supabase) and MySQL / MariaDB syntaxes are provided below.
-- ============================================================================

-- ############################################################################
-- SECTION 1: POSTGRESQL (SUPABASE) SYNTAX
-- Run this block directly in the Supabase SQL Editor
-- ############################################################################

-- ----------------------------------------------------------------------------
-- 1. TRIGGER 1: Automatic Cadet Level Calculation & Date Sync
-- Table:         profile_progress
-- Timing/Event:  BEFORE INSERT OR UPDATE ON profile_progress
-- Function:      fn_trg_calculate_cadet_level()
-- Description:   Guards against negative values, calculates gamified rank level
--                from cumulative XP (total_score), and syncs last_lesson_date.
-- ----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION fn_trg_calculate_cadet_level()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
    -- Enforce non-negative score and completed lesson counts
    NEW.total_score := GREATEST(0, COALESCE(NEW.total_score, 0));
    NEW.lessons_completed := GREATEST(0, COALESCE(NEW.lessons_completed, 0));

    -- Derive gamified cadet level from total XP milestones:
    -- Level 1: 0 - 499 XP (Cadet Recruit)
    -- Level 2: 500 - 999 XP (Junior Cadet)
    -- Level 3: 1,000 - 1,999 XP (Senior Cadet)
    -- Level 4: 2,000 - 3,499 XP (Officer Cadet)
    -- Level 5: 3,500 - 4,999 XP (Master Cadet)
    -- Level 6: 5,000 - 7,499 XP (Lieutenant Cadet)
    -- Level 7+: 7,500+ XP (+1 level per 2,500 XP bonus)
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

    -- Automatically update last_lesson_date if lessons were completed
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
-- Table:         lesson_events
-- Timing/Event:  AFTER INSERT ON lesson_events
-- Function:      fn_trg_sync_lesson_event_to_progress()
-- Description:   When a reviewer completes a lesson and an event record is inserted,
--                this trigger immediately updates or provisions the profile_progress
--                row, adding XP and incrementing lesson count. This automatically
--                activates Trigger 1 (trg_calculate_cadet_level) via cascade.
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
-- Table:         profile_game_state
-- Timing/Event:  BEFORE INSERT OR UPDATE ON profile_game_state
-- Function:      fn_trg_enforce_game_state_rules()
-- Description:   Enforces game state constraints: hearts must stay within [0, 5],
--                gems and streak cannot be negative, and heart loss timestamp is
--                automatically managed.
-- ----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION fn_trg_enforce_game_state_rules()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
    -- Clamp hearts between 0 and 5
    NEW.hearts := LEAST(5, GREATEST(0, COALESCE(NEW.hearts, 5)));

    -- Ensure gems balance and streak are non-negative
    NEW.gems := GREATEST(0, COALESCE(NEW.gems, 0));
    NEW.streak := GREATEST(0, COALESCE(NEW.streak, 0));
    NEW.streak_freeze_count := GREATEST(0, COALESCE(NEW.streak_freeze_count, 0));

    -- Automatically track heart loss timestamp for regeneration
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
-- Table:         profile_progress -> score_audit_logs
-- Timing/Event:  AFTER UPDATE OF total_score ON profile_progress
-- Function:      fn_trg_audit_score_adjustments()
-- Description:   Maintains a tamper-evident audit trail whenever a student's XP
--                is updated, tracking the change delta, before/after levels, and time.
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


-- ============================================================================
-- VERIFICATION COMMANDS & QUERIES (PostgreSQL / Supabase)
-- ============================================================================
-- Run these commands in Supabase SQL Editor to test live trigger execution:

-- STEP 1: Verify Trigger 1 (Automatic Level Calculation on Update)
-- Set total_score to 3250 XP. The trigger should automatically set current_level to 4:
/*
UPDATE profile_progress
SET total_score = 3250
WHERE profile_id = (SELECT id FROM profiles LIMIT 1);

SELECT profile_id, total_score, current_level, last_lesson_date
FROM profile_progress
WHERE profile_id = (SELECT id FROM profiles LIMIT 1);
-- Expected Result: current_level = 4 (Officer Cadet)
*/

-- STEP 2: Verify Trigger 2 (Lesson Event Sync Cascading to Level Calculation)
-- Insert a lesson completion event with 500 XP delta:
/*
INSERT INTO lesson_events (profile_id, score_delta, event_type, level_delta)
VALUES ((SELECT id FROM profiles LIMIT 1), 500, 'lesson_completed', 0);

SELECT profile_id, total_score, current_level, lessons_completed, last_lesson_date
FROM profile_progress
WHERE profile_id = (SELECT id FROM profiles LIMIT 1);
-- Expected Result: total_score increased by 500, lessons_completed +1, current_level updated.
*/

-- STEP 3: Verify Trigger 3 (Game State Economy Clamping)
-- Attempt to set hearts to 12 and gems to -50:
/*
UPDATE profile_game_state
SET hearts = 12, gems = -50
WHERE profile_id = (SELECT id FROM profiles LIMIT 1);

SELECT profile_id, hearts, gems, last_heart_lost_at
FROM profile_game_state
WHERE profile_id = (SELECT id FROM profiles LIMIT 1);
-- Expected Result: hearts clamped to 5, gems clamped to 0, last_heart_lost_at is NULL.
*/

-- STEP 4: Verify Trigger 4 (Audit Trail Logging)
-- Check the score audit log table:
/*
SELECT * FROM score_audit_logs ORDER BY changed_at DESC LIMIT 5;
*/


-- ############################################################################
-- SECTION 2: MYSQL / MARIADB SYNTAX
-- Run this block if using MySQL Workbench, phpMyAdmin, or MySQL CLI
-- ############################################################################

/*
DELIMITER $$

-- 1. TRIGGER 1: trg_before_insert_profile_progress (MySQL)
DROP TRIGGER IF EXISTS trg_before_insert_profile_progress$$
CREATE TRIGGER trg_before_insert_profile_progress
BEFORE INSERT ON profile_progress
FOR EACH ROW
BEGIN
    SET NEW.total_score = GREATEST(0, COALESCE(NEW.total_score, 0));
    SET NEW.lessons_completed = GREATEST(0, COALESCE(NEW.lessons_completed, 0));

    IF NEW.total_score >= 7500 THEN
        SET NEW.current_level = 7 + FLOOR((NEW.total_score - 7500) / 2500);
    ELSEIF NEW.total_score >= 5000 THEN
        SET NEW.current_level = 6;
    ELSEIF NEW.total_score >= 3500 THEN
        SET NEW.current_level = 5;
    ELSEIF NEW.total_score >= 2000 THEN
        SET NEW.current_level = 4;
    ELSEIF NEW.total_score >= 1000 THEN
        SET NEW.current_level = 3;
    ELSEIF NEW.total_score >= 500 THEN
        SET NEW.current_level = 2;
    ELSE
        SET NEW.current_level = 1;
    END IF;

    IF NEW.lessons_completed > 0 AND NEW.last_lesson_date IS NULL THEN
        SET NEW.last_lesson_date = CURDATE();
    END IF;
END$$

-- 2. TRIGGER 1B: trg_before_update_profile_progress (MySQL)
DROP TRIGGER IF EXISTS trg_before_update_profile_progress$$
CREATE TRIGGER trg_before_update_profile_progress
BEFORE UPDATE ON profile_progress
FOR EACH ROW
BEGIN
    SET NEW.total_score = GREATEST(0, COALESCE(NEW.total_score, 0));
    SET NEW.lessons_completed = GREATEST(0, COALESCE(NEW.lessons_completed, 0));

    IF NEW.total_score >= 7500 THEN
        SET NEW.current_level = 7 + FLOOR((NEW.total_score - 7500) / 2500);
    ELSEIF NEW.total_score >= 5000 THEN
        SET NEW.current_level = 6;
    ELSEIF NEW.total_score >= 3500 THEN
        SET NEW.current_level = 5;
    ELSEIF NEW.total_score >= 2000 THEN
        SET NEW.current_level = 4;
    ELSEIF NEW.total_score >= 1000 THEN
        SET NEW.current_level = 3;
    ELSEIF NEW.total_score >= 500 THEN
        SET NEW.current_level = 2;
    ELSE
        SET NEW.current_level = 1;
    END IF;

    IF NEW.lessons_completed > OLD.lessons_completed THEN
        SET NEW.last_lesson_date = CURDATE();
    END IF;
END$$

-- 3. TRIGGER 2: trg_after_insert_lesson_events (MySQL)
DROP TRIGGER IF EXISTS trg_after_insert_lesson_events$$
CREATE TRIGGER trg_after_insert_lesson_events
AFTER INSERT ON lesson_events
FOR EACH ROW
BEGIN
    DECLARE v_xp INT;
    DECLARE v_inc INT;
    SET v_xp = GREATEST(0, COALESCE(NEW.score_delta, 0));
    SET v_inc = IF(COALESCE(NEW.event_type, 'lesson_completed') = 'lesson_completed', 1, 0);

    INSERT INTO profile_progress (profile_id, total_score, current_level, lessons_completed, last_lesson_date)
    VALUES (NEW.profile_id, v_xp, 1, v_inc, CURDATE())
    ON DUPLICATE KEY UPDATE
        total_score = total_score + VALUES(total_score),
        lessons_completed = lessons_completed + VALUES(lessons_completed),
        last_lesson_date = CURDATE();
END$$

-- 4. TRIGGER 3: trg_before_update_game_state (MySQL)
DROP TRIGGER IF EXISTS trg_before_update_game_state$$
CREATE TRIGGER trg_before_update_game_state
BEFORE UPDATE ON profile_game_state
FOR EACH ROW
BEGIN
    SET NEW.hearts = LEAST(5, GREATEST(0, COALESCE(NEW.hearts, 5)));
    SET NEW.gems = GREATEST(0, COALESCE(NEW.gems, 0));
    SET NEW.streak = GREATEST(0, COALESCE(NEW.streak, 0));
    SET NEW.streak_freeze_count = GREATEST(0, COALESCE(NEW.streak_freeze_count, 0));

    IF NEW.hearts < 5 THEN
        IF NEW.last_heart_lost_at IS NULL THEN
            SET NEW.last_heart_lost_at = NOW();
        END IF;
    ELSE
        SET NEW.last_heart_lost_at = NULL;
    END IF;
END$$

DELIMITER ;
*/
