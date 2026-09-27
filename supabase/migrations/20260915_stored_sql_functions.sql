-- Migration: 20260915_stored_sql_functions.sql
-- Description: Creates 3 Stored SQL Functions for DBMS Laboratory Partial Requirement
-- Category 1: String Function (fn_format_reviewer_title)
-- Category 2: Numeric Function (fn_calculate_mastery_rate)
-- Category 3: Business Rule Function (fn_determine_exam_readiness)

-- 1. STRING FUNCTION: fn_format_reviewer_title
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
    v_clean_name := TRIM(SPLIT_PART(COALESCE(p_name, 'Reviewer'), '|', 1));
    IF v_clean_name = '' THEN
        v_clean_name := 'Civil Service Cadet';
    END IF;

    v_safe_level := GREATEST(COALESCE(p_level, 1), 1);
    RETURN CONCAT(v_clean_name, ' [Lvl ', v_safe_level, ' Cadet]');
END;
$$;

-- 2. NUMERIC FUNCTION: fn_calculate_mastery_rate
CREATE OR REPLACE FUNCTION fn_calculate_mastery_rate(
    p_total_score INT,
    p_lessons_completed INT
)
RETURNS NUMERIC(10, 2)
LANGUAGE plpgsql
IMMUTABLE
AS $$
BEGIN
    IF p_lessons_completed IS NULL OR p_lessons_completed <= 0 THEN
        RETURN 0.00;
    END IF;

    RETURN ROUND((COALESCE(p_total_score, 0)::NUMERIC / p_lessons_completed), 2);
END;
$$;

-- 3. BUSINESS RULE FUNCTION: fn_determine_exam_readiness
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
    IF v_score >= 5000 AND v_lessons >= 20 AND v_streak >= 7 THEN
        RETURN 'EXCELLENT: Exam Ready (High Honor)';
    ELSIF v_score >= 2500 AND v_lessons >= 10 THEN
        RETURN 'QUALIFIED: Exam Ready (Passing Tier)';
    ELSIF v_score >= 1000 AND v_lessons >= 5 THEN
        RETURN 'IN PROGRESS: Intermediate Reviewer';
    ELSIF v_score >= 300 OR v_lessons >= 2 THEN
        RETURN 'DEVELOPING: Basic Competency';
    ELSE
        RETURN 'NEEDS PRACTICE: Novice Reviewer';
    END IF;
END;
$$;
