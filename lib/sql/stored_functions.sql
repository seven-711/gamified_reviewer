-- ============================================================================
-- DBMS LABORATORY REQUIREMENT: STORED SQL FUNCTIONS
-- SYSTEM: CIVIL SERVICE EXAM (CSE) REVIEWER GAMIFIED
-- ============================================================================
-- This script defines three (3) Stored SQL Functions:
-- 1. String Function:        fn_format_reviewer_title(p_name, p_level)
-- 2. Numeric Function:       fn_calculate_mastery_rate(p_total_score, p_lessons_completed)
-- 3. Business Rule Function: fn_determine_exam_readiness(p_total_score, p_lessons_completed, p_streak)
--
-- Both PostgreSQL (Supabase) and MySQL / MariaDB syntaxes are provided below.
-- ============================================================================

-- ############################################################################
-- SECTION 1: POSTGRESQL (SUPABASE) SYNTAX
-- Run this block directly in the Supabase SQL Editor
-- ############################################################################

-- ----------------------------------------------------------------------------
-- 1. STRING FUNCTION: fn_format_reviewer_title
-- Category: String Function
-- Description: Parses raw profile usernames (which may contain pipe-delimited
--              avatar tags, e.g. 'JulyFranz|avatar_4.png'), trims whitespace,
--              capitalizes/cleans the name, and appends a formatted Civil Service
--              Cadet / Rank Level badge.
-- Parameters:  p_name VARCHAR, p_level INT
-- Returns:     VARCHAR
-- ----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION fn_format_reviewer_title(
    p_name VARCHAR,
    p_level INT
)
RETURNS VARCHAR
LANGUAGE plpgsql
IMMUTABLE
AS $$
DECLARE
    v_clean_name VARCHAR;
    v_safe_level INT;
BEGIN
    -- Extract display name prior to any internal '|' avatar delimiter
    v_clean_name := TRIM(SPLIT_PART(COALESCE(p_name, 'Reviewer'), '|', 1));
    IF v_clean_name = '' THEN
        v_clean_name := 'Civil Service Cadet';
    END IF;

    -- Ensure level defaults safely to 1
    v_safe_level := GREATEST(COALESCE(p_level, 1), 1);

    -- Format and return the unified gamer title
    RETURN CONCAT(v_clean_name, ' [Lvl ', v_safe_level, ' Cadet]');
END;
$$;


-- ----------------------------------------------------------------------------
-- 2. NUMERIC FUNCTION: fn_calculate_mastery_rate
-- Category: Numeric Function
-- Description: Calculates the player's average XP earned per completed lesson module.
--              Guards against division-by-zero errors using conditional checks and
--              rounds the result to 2 decimal places.
-- Parameters:  p_total_score INT, p_lessons_completed INT
-- Returns:     NUMERIC(10, 2)
-- ----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION fn_calculate_mastery_rate(
    p_total_score INT,
    p_lessons_completed INT
)
RETURNS NUMERIC(10, 2)
LANGUAGE plpgsql
IMMUTABLE
AS $$
BEGIN
    -- Handle null or zero lessons safely to prevent division by zero
    IF p_lessons_completed IS NULL OR p_lessons_completed <= 0 THEN
        RETURN 0.00;
    END IF;

    -- Compute and return rounded rate
    RETURN ROUND((COALESCE(p_total_score, 0)::NUMERIC / p_lessons_completed), 2);
END;
$$;


-- ----------------------------------------------------------------------------
-- 3. BUSINESS RULE FUNCTION: fn_determine_exam_readiness
-- Category: Business Rule Function
-- Description: Enforces the CSE Reviewer examination eligibility business rule.
--              Evaluates total score, lessons completed, and daily streak continuity
--              to classify the candidate's exam readiness status.
-- Parameters:  p_total_score INT, p_lessons_completed INT, p_streak INT
-- Returns:     VARCHAR(50)
-- ----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION fn_determine_exam_readiness(
    p_total_score INT,
    p_lessons_completed INT,
    p_streak INT
)
RETURNS VARCHAR
LANGUAGE plpgsql
IMMUTABLE
AS $$
DECLARE
    v_score INT := COALESCE(p_total_score, 0);
    v_lessons INT := COALESCE(p_lessons_completed, 0);
    v_streak INT := COALESCE(p_streak, 0);
BEGIN
    -- Tier 1: Candidate exhibits mastery, high volume of review, and active streak
    IF v_score >= 5000 AND v_lessons >= 20 AND v_streak >= 7 THEN
        RETURN 'EXCELLENT: Exam Ready (High Honor)';
    -- Tier 2: Candidate meets required passing threshold and module completion
    ELSIF v_score >= 2500 AND v_lessons >= 10 THEN
        RETURN 'QUALIFIED: Exam Ready (Passing Tier)';
    -- Tier 3: Reviewer is actively progressing through syllabus
    ELSIF v_score >= 1000 AND v_lessons >= 5 THEN
        RETURN 'IN PROGRESS: Intermediate Reviewer';
    -- Tier 4: Beginner with introductory module completions
    ELSIF v_score >= 300 OR v_lessons >= 2 THEN
        RETURN 'DEVELOPING: Basic Competency';
    -- Tier 5: New or inactive reviewer needing study drill practice
    ELSE
        RETURN 'NEEDS PRACTICE: Novice Reviewer';
    END IF;
END;
$$;


-- ============================================================================
-- VERIFICATION QUERIES (PostgreSQL / Supabase)
-- ============================================================================
-- Run these in Supabase SQL Editor to test individual functions:

-- 1. Test String Function:
-- SELECT fn_format_reviewer_title('JulyFranz|avatar_4.png', 5) AS test_title;
-- Result: 'JulyFranz [Lvl 5 Cadet]'

-- 2. Test Numeric Function:
-- SELECT fn_calculate_mastery_rate(2450, 14) AS test_mastery_rate;
-- Result: 175.00

-- 3. Test Business Rule Function:
-- SELECT fn_determine_exam_readiness(3200, 12, 8) AS test_readiness;
-- Result: 'QUALIFIED: Exam Ready (Passing Tier)'

-- 4. SYSTEM-WIDE INTEGRATED CALL:
-- Query demonstrating all 3 functions called on actual database tables:
/*
SELECT
    p.id AS profile_id,
    p.name AS original_name,
    fn_format_reviewer_title(p.name, pp.current_level) AS reviewer_title,
    pp.total_score,
    pp.lessons_completed,
    pgs.streak,
    fn_calculate_mastery_rate(pp.total_score, pp.lessons_completed) AS avg_xp_per_lesson,
    fn_determine_exam_readiness(pp.total_score, pp.lessons_completed, pgs.streak) AS exam_readiness
FROM profiles p
LEFT JOIN profile_progress pp ON pp.profile_id = p.id
LEFT JOIN profile_game_state pgs ON pgs.profile_id = p.id
ORDER BY pp.total_score DESC NULLS LAST;
*/


-- ############################################################################
-- SECTION 2: MYSQL / MARIADB SYNTAX
-- Run this block if using MySQL Workbench, phpMyAdmin, or MySQL CLI
-- ############################################################################

/*
-- 1. STRING FUNCTION (MySQL)
DELIMITER $$
DROP FUNCTION IF EXISTS fn_format_reviewer_title$$
CREATE FUNCTION fn_format_reviewer_title(
    p_name VARCHAR(100),
    p_level INT
)
RETURNS VARCHAR(150)
DETERMINISTIC
BEGIN
    DECLARE v_clean_name VARCHAR(100);
    DECLARE v_safe_level INT;

    SET v_clean_name = TRIM(SUBSTRING_INDEX(COALESCE(p_name, 'Reviewer'), '|', 1));
    IF v_clean_name = '' THEN
        SET v_clean_name = 'Civil Service Cadet';
    END IF;

    SET v_safe_level = GREATEST(COALESCE(p_level, 1), 1);
    RETURN CONCAT(v_clean_name, ' [Lvl ', v_safe_level, ' Cadet]');
END$$
DELIMITER ;


-- 2. NUMERIC FUNCTION (MySQL)
DELIMITER $$
DROP FUNCTION IF EXISTS fn_calculate_mastery_rate$$
CREATE FUNCTION fn_calculate_mastery_rate(
    p_total_score INT,
    p_lessons_completed INT
)
RETURNS DECIMAL(10, 2)
DETERMINISTIC
BEGIN
    IF p_lessons_completed IS NULL OR p_lessons_completed <= 0 THEN
        RETURN 0.00;
    END IF;

    RETURN ROUND(COALESCE(p_total_score, 0) / p_lessons_completed, 2);
END$$
DELIMITER ;


-- 3. BUSINESS RULE FUNCTION (MySQL)
DELIMITER $$
DROP FUNCTION IF EXISTS fn_determine_exam_readiness$$
CREATE FUNCTION fn_determine_exam_readiness(
    p_total_score INT,
    p_lessons_completed INT,
    p_streak INT
)
RETURNS VARCHAR(50)
DETERMINISTIC
BEGIN
    DECLARE v_score INT DEFAULT COALESCE(p_total_score, 0);
    DECLARE v_lessons INT DEFAULT COALESCE(p_lessons_completed, 0);
    DECLARE v_streak INT DEFAULT COALESCE(p_streak, 0);

    IF v_score >= 5000 AND v_lessons >= 20 AND v_streak >= 7 THEN
        RETURN 'EXCELLENT: Exam Ready (High Honor)';
    ELSEIF v_score >= 2500 AND v_lessons >= 10 THEN
        RETURN 'QUALIFIED: Exam Ready (Passing Tier)';
    ELSEIF v_score >= 1000 AND v_lessons >= 5 THEN
        RETURN 'IN PROGRESS: Intermediate Reviewer';
    ELSEIF v_score >= 300 OR v_lessons >= 2 THEN
        RETURN 'DEVELOPING: Basic Competency';
    ELSE
        RETURN 'NEEDS PRACTICE: Novice Reviewer';
    END IF;
END$$
DELIMITER ;
*/
