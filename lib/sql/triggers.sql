-- ============================================================================
-- DBMS LABORATORY REQUIREMENT: 4 TRADITIONAL SQL TRIGGERS
-- SYSTEM: CIVIL SERVICE EXAMINATION (CSE) REVIEWER GAMIFIED
-- ============================================================================
-- 1. VALIDATION TRIGGER (Prevents invalid quantity / negative balance)
-- 2. ENFORCING BUSINESS RULES TRIGGER (Calculates cadet rank level from XP & syncs date)
-- 3. AUDITING DATABASE CHANGES TRIGGER (Maintains immutable score & rank audit ledger)
-- 4. AUTOMATIC DATA LOGGING TRIGGER (Auto-logs learning activity from lesson events)
-- ============================================================================

-- ############################################################################
-- SECTION 1: POSTGRESQL (SUPABASE) SYNTAX
-- Run this directly in the Supabase SQL Editor
-- ############################################################################

-- ----------------------------------------------------------------------------
-- 1. VALIDATION TRIGGER: Prevent Invalid Quantity / Negative Balance
-- ----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION fn_trg_validate_game_economy()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
    IF NEW.gems < 0 THEN
        RAISE EXCEPTION 'Validation Trigger Error: Insufficient gem balance (short by % gems). Transaction rejected by database.', ABS(NEW.gems);
    END IF;

    IF NEW.hearts > 5 THEN
        RAISE EXCEPTION 'Validation Trigger Error: Heart capacity cannot exceed 5 (attempted: %). Transaction rejected by database.', NEW.hearts;
    END IF;

    IF NEW.hearts < 0 THEN
        RAISE EXCEPTION 'Validation Trigger Error: Hearts cannot be negative (attempted: %). Transaction rejected by database.', NEW.hearts;
    END IF;

    IF NEW.streak_freeze_count > 2 THEN
        RAISE EXCEPTION 'Validation Trigger Error: Cannot equip more than 2 Streak Freezes (attempted: %). Transaction rejected by database.', NEW.streak_freeze_count;
    END IF;

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


-- ----------------------------------------------------------------------------
-- 2. ENFORCING BUSINESS RULES TRIGGER: Automatic Cadet Rank Tier Calculation
-- ----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION fn_trg_enforce_cadet_progression_rules()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
    NEW.total_score := GREATEST(0, COALESCE(NEW.total_score, 0));
    NEW.lessons_completed := GREATEST(0, COALESCE(NEW.lessons_completed, 0));

    IF NEW.total_score >= 120000 THEN
        NEW.current_level := 7 + FLOOR((NEW.total_score - 120000) / 20000)::INT;
    ELSIF NEW.total_score >= 100000 THEN
        NEW.current_level := 6;
    ELSIF NEW.total_score >= 80000 THEN
        NEW.current_level := 5;
    ELSIF NEW.total_score >= 60000 THEN
        NEW.current_level := 4;
    ELSIF NEW.total_score >= 40000 THEN
        NEW.current_level := 3;
    ELSIF NEW.total_score >= 20000 THEN
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

DROP TRIGGER IF EXISTS trg_enforce_cadet_progression_rules ON profile_progress;
CREATE TRIGGER trg_enforce_cadet_progression_rules
BEFORE INSERT OR UPDATE ON profile_progress
FOR EACH ROW
EXECUTE FUNCTION fn_trg_enforce_cadet_progression_rules();


-- ----------------------------------------------------------------------------
-- 3. AUDITING DATABASE CHANGES TRIGGER: Immutable Score & Rank Audit Ledger
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


-- ----------------------------------------------------------------------------
-- 4. AUTOMATIC DATA LOGGING TRIGGER: Automatic Activity Logging from Lesson Events
-- ----------------------------------------------------------------------------
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

-- RLS policies for lesson_events
ALTER TABLE lesson_events ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow users to read own lesson events" ON lesson_events;
CREATE POLICY "Allow users to read own lesson events" ON lesson_events FOR SELECT USING (true);
DROP POLICY IF EXISTS "Allow users to insert own lesson events" ON lesson_events;
CREATE POLICY "Allow users to insert own lesson events" ON lesson_events FOR INSERT WITH CHECK (true);

-- RLS policies for cadet_activity_logs
ALTER TABLE cadet_activity_logs ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow all users to read cadet activity logs" ON cadet_activity_logs;
CREATE POLICY "Allow all users to read cadet activity logs" ON cadet_activity_logs FOR SELECT USING (true);
DROP POLICY IF EXISTS "Allow system and triggers to insert cadet activity logs" ON cadet_activity_logs;
CREATE POLICY "Allow system and triggers to insert cadet activity logs" ON cadet_activity_logs FOR INSERT WITH CHECK (true);


-- ############################################################################
-- SECTION 2: MYSQL / MARIADB SYNTAX
-- ############################################################################

DELIMITER $$

-- 1. VALIDATION TRIGGER (MySQL)
DROP TRIGGER IF EXISTS trg_validate_game_economy_insert$$
CREATE TRIGGER trg_validate_game_economy_insert
BEFORE INSERT ON profile_game_state
FOR EACH ROW
BEGIN
    IF NEW.gems < 0 THEN
        SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT = 'Validation Trigger Error: Insufficient gem balance (cannot be negative).';
    END IF;
    IF NEW.hearts > 5 THEN
        SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT = 'Validation Trigger Error: Heart capacity cannot exceed 5.';
    END IF;
    IF NEW.hearts < 0 THEN
        SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT = 'Validation Trigger Error: Hearts cannot be negative.';
    END IF;
    IF NEW.streak_freeze_count > 2 THEN
        SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT = 'Validation Trigger Error: Cannot equip more than 2 Streak Freezes.';
    END IF;
END$$

DROP TRIGGER IF EXISTS trg_validate_game_economy_update$$
CREATE TRIGGER trg_validate_game_economy_update
BEFORE UPDATE ON profile_game_state
FOR EACH ROW
BEGIN
    IF NEW.gems < 0 THEN
        SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT = 'Validation Trigger Error: Insufficient gem balance (cannot be negative).';
    END IF;
    IF NEW.hearts > 5 THEN
        SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT = 'Validation Trigger Error: Heart capacity cannot exceed 5.';
    END IF;
    IF NEW.hearts < 0 THEN
        SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT = 'Validation Trigger Error: Hearts cannot be negative.';
    END IF;
    IF NEW.streak_freeze_count > 2 THEN
        SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT = 'Validation Trigger Error: Cannot equip more than 2 Streak Freezes.';
    END IF;
END$$

-- 2. ENFORCING BUSINESS RULES TRIGGER (MySQL)
DROP TRIGGER IF EXISTS trg_enforce_cadet_progression_rules_update$$
CREATE TRIGGER trg_enforce_cadet_progression_rules_update
BEFORE UPDATE ON profile_progress
FOR EACH ROW
BEGIN
    SET NEW.total_score = GREATEST(0, COALESCE(NEW.total_score, 0));
    SET NEW.lessons_completed = GREATEST(0, COALESCE(NEW.lessons_completed, 0));

    IF NEW.total_score >= 120000 THEN
        SET NEW.current_level = 7 + FLOOR((NEW.total_score - 120000) / 20000);
    ELSEIF NEW.total_score >= 100000 THEN
        SET NEW.current_level = 6;
    ELSEIF NEW.total_score >= 80000 THEN
        SET NEW.current_level = 5;
    ELSEIF NEW.total_score >= 60000 THEN
        SET NEW.current_level = 4;
    ELSEIF NEW.total_score >= 40000 THEN
        SET NEW.current_level = 3;
    ELSEIF NEW.total_score >= 20000 THEN
        SET NEW.current_level = 2;
    ELSE
        SET NEW.current_level = 1;
    END IF;

    IF NEW.lessons_completed > OLD.lessons_completed THEN
        SET NEW.last_lesson_date = CURDATE();
    END IF;
END$$

-- 3. AUDITING DATABASE CHANGES TRIGGER (MySQL)
DROP TRIGGER IF EXISTS trg_audit_score_adjustments_mysql$$
CREATE TRIGGER trg_audit_score_adjustments_mysql
AFTER UPDATE ON profile_progress
FOR EACH ROW
BEGIN
    IF OLD.total_score <> NEW.total_score THEN
        INSERT INTO score_audit_logs (profile_id, old_score, new_score, score_delta, old_level, new_level, changed_at)
        VALUES (NEW.profile_id, OLD.total_score, NEW.total_score, NEW.total_score - OLD.total_score, OLD.current_level, NEW.current_level, NOW());
    END IF;
END$$

-- 4. AUTOMATIC DATA LOGGING TRIGGER (MySQL)
DROP TRIGGER IF EXISTS trg_auto_log_cadet_activity_mysql$$
CREATE TRIGGER trg_auto_log_cadet_activity_mysql
AFTER INSERT ON lesson_events
FOR EACH ROW
BEGIN
    INSERT INTO cadet_activity_logs (profile_id, event_type, activity_description, xp_gained, created_at)
    VALUES (NEW.profile_id, NEW.event_type, CONCAT('Completed CSE Practice Drill (+', NEW.score_delta, ' XP)'), NEW.score_delta, NOW());
END$$

DELIMITER ;
