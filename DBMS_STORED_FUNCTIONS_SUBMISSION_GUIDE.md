# DBMS Laboratory Partial Requirement: Stored SQL Functions
## System Implementation & Submission Guide (10 Points)

**System Name:** Civil Service Examination (CSE) Reviewer Gamified  
**Database System:** Supabase (PostgreSQL) / MySQL Compatible  
**Requirement:** Implement at least three (3) Stored SQL Functions across String, Numeric, and Business Rule categories, and demonstrate their live invocation in the database system.

---

## 1. Requirements Compliance Summary

| Category | Function Name | Input Parameters | Return Type | Status | System Relevance |
| :--- | :--- | :--- | :--- | :---: | :--- |
| **String Function** | `fn_format_reviewer_title` | `p_name VARCHAR`<br>`p_level INT` | `VARCHAR(150)` | **Implemented** | Cleanses raw usernames by stripping avatar image delimiters, handling nulls/empty strings, and appending formatted Civil Service rank badges (e.g., `'JulyFranz [Lvl 5 Cadet]'`). |
| **Numeric Function** | `fn_calculate_mastery_rate` | `p_total_score INT`<br>`p_lessons_completed INT` | `NUMERIC(10,2)` | **Implemented** | Computes player learning efficiency as average XP earned per completed lesson module, guarding against division-by-zero errors with 2-decimal precision. |
| **Business Rule Function** | `fn_determine_exam_readiness` | `p_total_score INT`<br>`p_lessons_completed INT`<br>`p_streak INT` | `VARCHAR(50)` | **Implemented** | Enforces the system's Civil Service exam readiness business rule by evaluating cumulative score, lesson volume, and study streak continuity. |

---

## 2. Stored SQL Functions DDL (Database Server)

Run these scripts in your **Database Server** (e.g., **Supabase SQL Editor** or **MySQL Workbench / phpMyAdmin**) to create the functions.

### A. PostgreSQL (Supabase) Syntax

```sql
-- ============================================================================
-- 1. STRING FUNCTION: fn_format_reviewer_title
-- ============================================================================
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
    -- Strip avatar suffix delimited by '|' and trim whitespace
    v_clean_name := TRIM(SPLIT_PART(COALESCE(p_name, 'Reviewer'), '|', 1));
    IF v_clean_name = '' THEN
        v_clean_name := 'Civil Service Cadet';
    END IF;

    -- Default level safely to at least 1
    v_safe_level := GREATEST(COALESCE(p_level, 1), 1);

    -- Return formatted gamified badge
    RETURN CONCAT(v_clean_name, ' [Lvl ', v_safe_level, ' Cadet]');
END;
$$;

-- ============================================================================
-- 2. NUMERIC FUNCTION: fn_calculate_mastery_rate
-- ============================================================================
CREATE OR REPLACE FUNCTION fn_calculate_mastery_rate(
    p_total_score INT,
    p_lessons_completed INT
)
RETURNS NUMERIC(10, 2)
LANGUAGE plpgsql
IMMUTABLE
AS $$
BEGIN
    -- Guard against division-by-zero for new users with 0 completed lessons
    IF p_lessons_completed IS NULL OR p_lessons_completed <= 0 THEN
        RETURN 0.00;
    END IF;

    -- Return rounded average score per lesson
    RETURN ROUND((COALESCE(p_total_score, 0)::NUMERIC / p_lessons_completed), 2);
END;
$$;

-- ============================================================================
-- 3. BUSINESS RULE FUNCTION: fn_determine_exam_readiness
-- ============================================================================
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
    -- Tier 1: Candidate exhibits high score, deep volume, and study streak habit
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
```

### B. MySQL / MariaDB Syntax

```sql
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
```

---

## 3. SQL Code Used in the Database System (Application Code)

The stored functions are integrated into our database queries. Below is the system-wide query executed in our application layer to process reviewer profile datasets:

```sql
SELECT
    p.id AS profile_id,
    p.name AS raw_username,
    fn_format_reviewer_title(p.name, pp.current_level) AS reviewer_title,
    pp.total_score,
    pp.lessons_completed,
    pgs.streak,
    fn_calculate_mastery_rate(pp.total_score, pp.lessons_completed) AS avg_xp_per_lesson,
    fn_determine_exam_readiness(pp.total_score, pp.lessons_completed, pgs.streak) AS exam_readiness
FROM profiles p
INNER JOIN profile_progress pp ON pp.profile_id = p.id
INNER JOIN profile_game_state pgs ON pgs.profile_id = p.id
ORDER BY pp.total_score DESC;
```

**Application Code Locations in Codebase:**
- SQL Definitions & Migration: `lib/sql/stored_functions.sql` and `supabase/migrations/20260915_stored_sql_functions.sql`
- Backend API Integration & Execution: `app/api/admin/functions/route.ts`
- Interactive User Interface & Evaluation Matrix: `app/(main)/admin/functions/page.tsx`

---

## 4. Screenshot Submission Checklist

Capture the following three (3) screenshots for your submission:

### Screenshot 1: Stored SQL Functions (Database Server)
- **Where to capture:** Open your **Supabase Dashboard** -> **SQL Editor** (or **MySQL Workbench** / **phpMyAdmin**).
- **What to run:**
  ```sql
  -- Run this test query in the SQL editor:
  SELECT
      fn_format_reviewer_title('JulyFranz|avatar_4.png', 5) AS reviewer_title,
      fn_calculate_mastery_rate(3250, 15) AS mastery_rate,
      fn_determine_exam_readiness(3250, 15, 8) AS exam_readiness;
  ```
- **Screenshot contents:** The SQL statement showing `Success` and the resulting output table with the 3 computed columns.

### Screenshot 2: SQL Code for each function (Application Code)
- **Where to capture:** Your code editor (VS Code).
- **What to open:** 
  - `lib/sql/stored_functions.sql` or `app/api/admin/functions/route.ts`.
- **Screenshot contents:** The file showing the function definitions and API handler code.

### Screenshot 3: System Output (GUI)
- **Where to capture:** Web Browser on `http://localhost:3000/admin/functions`.
- **What to show:**
  - The **System Evaluation Matrix** tab showing the live database table with real reviewer profiles and the computed `fn_format_reviewer_title`, `fn_calculate_mastery_rate`, and colorful `fn_determine_exam_readiness` badges.
  - Or the interactive **Function Sandbox Tester** tab showing custom inputs executed in real time.

---

## 5. Brief Explanation of How Each Function is Used in the System

*(Copy and paste these exact paragraphs into your written submission)*

### Function 1: String Function (`fn_format_reviewer_title`)
> "In our gamified Civil Service Examination Reviewer, usernames are frequently stored alongside avatar image identifiers delimited by pipe symbols (for example, `'JulyFranz|avatar_4.png'`). The `fn_format_reviewer_title` stored function processes and manipulates string data by isolating the true display name, stripping away internal avatar tags, trimming whitespace, and handling null or missing values gracefully by substituting a default cadet alias. It then concatenates the sanitized name with the player's current gamified rank level to output a standardized cadet badge string (e.g., `'JulyFranz [Lvl 5 Cadet]'`). This guarantees consistent, sanitized, and uniform display formatting across leaderboards, administrative reports, and user profile headers without requiring repetitive frontend string manipulation."

### Function 2: Numeric Function (`fn_calculate_mastery_rate`)
> "The `fn_calculate_mastery_rate` stored function performs a numerical calculation to determine a candidate's learning efficiency: the average XP earned per completed lesson module. It accepts two numeric integer parameters: `p_total_score` (cumulative experience points) and `p_lessons_completed` (count of drills finished). To prevent catastrophic division-by-zero runtime exceptions for novice cadets who have completed 0 lessons, the function employs conditional validation (`NULLIF`/zero check) and returns `0.00`. For active users, it performs floating-point division and rounds the quotient to two decimal places (e.g., `216.67 XP/lesson`). This numeric metric serves as a key performance indicator (KPI) on admin audit dashboards to measure user mastery and content difficulty."

### Function 3: Business Rule Function (`fn_determine_exam_readiness`)
> "The `fn_determine_exam_readiness` stored function implements the core business logic of our Civil Service Exam Reviewer: determining whether a candidate is formally qualified and prepared to pass the official Civil Service Commission examination. Rather than a simple score check, it enforces a multi-factor business rule combining cumulative score, syllabus drill repetition, and study streak continuity. A reviewer achieving ≥5,000 XP, ≥20 lessons, and a daily streak of ≥7 days is awarded `'EXCELLENT: Exam Ready (High Honor)'`. Reviewers meeting the baseline passing score of 2,500 XP and 10 lessons receive `'QUALIFIED: Exam Ready (Passing Tier)'`, while progressing users receive intermediate or novice classifications. By embedding this business rule directly inside a stored SQL function, the qualification standards are centralized and uniformly enforced across all system components."
