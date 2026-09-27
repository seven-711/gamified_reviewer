# DBMS Laboratory Partial Requirement: Traditional SQL Triggers
## System Implementation & Submission Guide (10 Points)

**System Name:** Civil Service Examination (CSE) Reviewer Gamified  
**Database System:** Supabase (PostgreSQL) / MySQL Compatible  
**Requirement:** Implement at least two (2) traditional SQL triggers for this system, demonstrate their live invocation in the database system, and document application integration.

---

## 1. Requirements Compliance Summary

| # | Trigger Name | Timing & Event | Target Table | Trigger Function | Status | System Relevance |
| :-: | :--- | :--- | :--- | :--- | :-: | :--- |
| **1** | `trg_calculate_cadet_level` | `BEFORE INSERT OR UPDATE` | `profile_progress` | `fn_trg_calculate_cadet_level()` | **Implemented** | **Business Logic & Data Integrity:** Guards against negative scores/lessons, automatically derives the cadet's gamified level (Levels 1–7+) from cumulative XP (`total_score`), and synchronizes `last_lesson_date`. |
| **2** | `trg_sync_lesson_event_to_progress` | `AFTER INSERT` | `lesson_events` | `fn_trg_sync_lesson_event_to_progress()` | **Implemented** | **Real-time Data Synchronization & Cascading Trigger:** Automatically propagates newly inserted lesson drill events into `profile_progress`, adding XP and incrementing lesson count, which in turn automatically fires Trigger 1. |
| **3** | `trg_enforce_game_state_rules` | `BEFORE INSERT OR UPDATE` | `profile_game_state` | `fn_trg_enforce_game_state_rules()` | **Implemented** | **Game Economy Invariant Guard:** Clamps `hearts` into `[0, 5]`, prevents negative `gems` and `streak`, and manages heart loss depletion timestamps for health regeneration. |
| **4** | `trg_audit_score_adjustments` | `AFTER UPDATE OF total_score` | `profile_progress` | `fn_trg_audit_score_adjustments()` | **Implemented** | **Security & Audit Logging:** Automatically logs all cadet XP updates into an immutable `score_audit_logs` ledger with `old_score`, `new_score`, `score_delta`, and timestamps. |

---

## 2. Traditional SQL Triggers DDL (Database Server)

Execute these scripts in your **Database Server** (e.g., **Supabase SQL Editor** or **MySQL Workbench / phpMyAdmin**) to establish the triggers.

### A. PostgreSQL (Supabase) Syntax

```sql
-- ============================================================================
-- 1. TRIGGER 1: Automatic Cadet Level Calculation & Date Sync
-- Table: profile_progress | Timing: BEFORE INSERT OR UPDATE
-- ============================================================================
CREATE OR REPLACE FUNCTION fn_trg_calculate_cadet_level()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
    -- Clamp scores and lesson counts to prevent negative values
    NEW.total_score := GREATEST(0, COALESCE(NEW.total_score, 0));
    NEW.lessons_completed := GREATEST(0, COALESCE(NEW.lessons_completed, 0));

    -- Derive gamified cadet rank level based on total XP milestones:
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


-- ============================================================================
-- 2. TRIGGER 2: Real-time Lesson Event Aggregator (Score & Progress Sync)
-- Table: lesson_events | Timing: AFTER INSERT
-- ============================================================================
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


-- ============================================================================
-- 3. TRIGGER 3: Game State Economy & Health Guard Trigger
-- Table: profile_game_state | Timing: BEFORE INSERT OR UPDATE
-- ============================================================================
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


-- ============================================================================
-- 4. TRIGGER 4 (AUDIT TRAIL): Automatic Score Audit Logging Trigger
-- Table: profile_progress -> score_audit_logs | Timing: AFTER UPDATE
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
```

---

### B. MySQL / MariaDB Syntax

```sql
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
```

---

## 3. Live Verification Commands (Run in Database Server)

Run these interactive commands sequentially to verify the triggers:

### Verification Test 1: Trigger 1 (Automatic Level Calculation & Date Sync)
```sql
-- Step 1: Update total_score to 3250 XP
UPDATE profile_progress
SET total_score = 3250
WHERE profile_id = (SELECT id FROM profiles LIMIT 1);

-- Step 2: Query result
SELECT profile_id, total_score, current_level, last_lesson_date
FROM profile_progress
WHERE profile_id = (SELECT id FROM profiles LIMIT 1);
-- Expected Result: current_level is automatically set to 4 (Officer Cadet, 2000-3499 XP).
```

### Verification Test 2: Trigger 2 (Lesson Event Insertion Cascades to Progress & Level)
```sql
-- Step 1: Insert lesson completed event (+500 XP)
INSERT INTO lesson_events (profile_id, score_delta, event_type, level_delta)
VALUES ((SELECT id FROM profiles LIMIT 1), 500, 'lesson_completed', 0);

-- Step 2: Query result
SELECT profile_id, total_score, current_level, lessons_completed, last_lesson_date
FROM profile_progress
WHERE profile_id = (SELECT id FROM profiles LIMIT 1);
-- Expected Result: total_score increments by 500, lessons_completed increments by 1,
-- and Trigger 1 automatically recalculates current_level.
```

### Verification Test 3: Trigger 3 (Game State Economy Clamping)
```sql
-- Step 1: Try setting invalid out-of-bound hearts (99) and negative gems (-100)
UPDATE profile_game_state
SET hearts = 99, gems = -100
WHERE profile_id = (SELECT id FROM profiles LIMIT 1);

-- Step 2: Query result
SELECT profile_id, hearts, gems, last_heart_lost_at
FROM profile_game_state
WHERE profile_id = (SELECT id FROM profiles LIMIT 1);
-- Expected Result: hearts is clamped to 5, gems is clamped to 0.
```

### Verification Test 4: Trigger 4 (Score Audit Ledger)
```sql
-- Step 1: View the immutable audit records generated by the triggers
SELECT * FROM score_audit_logs ORDER BY changed_at DESC LIMIT 5;
```

---

## 4. Application Code Integration

- **SQL Definitions & Migration Script:** `lib/sql/triggers.sql` and `supabase/migrations/20260924_sql_triggers.sql`
- **Backend API & Simulator Route:** `app/api/admin/triggers/route.ts`
- **Interactive Web Interface & Trigger Sandbox:** `app/(main)/admin/triggers/page.tsx`
- **Admin Dashboard Navigation Link:** Added "Triggers" tab in `app/(main)/admin/page.tsx`

---

## 5. Screenshot Submission Checklist

Capture the following three (3) screenshots for your submission:

### Screenshot 1: Traditional SQL Triggers (Database Server)
- **Where to capture:** **Supabase SQL Editor** (or **MySQL Workbench** / **phpMyAdmin**).
- **What to run:**
  ```sql
  -- Run the test query:
  UPDATE profile_progress SET total_score = 3500 WHERE profile_id = (SELECT id FROM profiles LIMIT 1);
  SELECT profile_id, total_score, current_level, last_lesson_date FROM profile_progress WHERE profile_id = (SELECT id FROM profiles LIMIT 1);
  ```
- **Screenshot contents:** The SQL statement execution returning `current_level = 5` computed entirely by `trg_calculate_cadet_level`.

### Screenshot 2: Trigger SQL Code in Editor (Application Code)
- **Where to capture:** VS Code / Antigravity IDE.
- **What to open:** `lib/sql/triggers.sql` or `app/api/admin/triggers/route.ts`.
- **Screenshot contents:** The trigger functions, trigger definitions, and comments.

### Screenshot 3: System Output (GUI)
- **Where to capture:** Web browser at `http://localhost:3000/admin/triggers`.
- **What to show:**
  - The **Live Trigger Simulator** tab showing custom XP adjustments triggering level promotions in real time, or
  - The **Trigger Catalog** tab showing all 4 operational triggers.

---

## 6. Technical Explanation of How Each Trigger Operates

*(Copy and paste these exact paragraphs into your written submission)*

### Trigger 1: Automatic Cadet Level Calculation & Date Sync (`trg_calculate_cadet_level`)
> "In our Civil Service Examination Reviewer system, cadet progression levels must strictly correlate with cumulative experience points (XP) earned across practice drills. The `trg_calculate_cadet_level` traditional trigger operates on `BEFORE INSERT OR UPDATE` on the `profile_progress` table. Before any score change is permanently committed to disk, the trigger intercepts the record, sanitizes against anomalous negative score inputs, and applies our gamification tier algorithm (Level 1 for <500 XP, Level 2 for 500–999 XP, up to Level 7+ for master cadets). It also automatically verifies and timestamps the `last_lesson_date` column with the current date whenever lessons completed increments. By executing this logic at the database engine tier, our system guarantees 100% data consistency across all client applications and prevents level manipulation."

### Trigger 2: Real-time Lesson Event Aggregator (`trg_sync_lesson_event_to_progress`)
> "Whenever a student finishes an exam simulation module, an event log is generated and inserted into the `lesson_events` table. The `trg_sync_lesson_event_to_progress` trigger executes `AFTER INSERT` on `lesson_events` for each row. It extracts the score delta and event type, and performs an atomic upsert into `profile_progress`, incrementing cumulative `total_score` and `lessons_completed`. Crucially, this operation demonstrates cascading trigger execution: when Trigger 2 updates `profile_progress`, it immediately activates Trigger 1 (`trg_calculate_cadet_level`), which recalculates the cadet's rank level and updates audit logs. This decouples event logging from aggregate maintenance, ensuring optimal transaction isolation and performance."

### Trigger 3: Game Economy & Health Guard (`trg_enforce_game_state_rules`)
> "The `trg_enforce_game_state_rules` trigger enforces core game economy and health invariant rules on the `profile_game_state` table via a `BEFORE INSERT OR UPDATE` hook. In our reviewer application, cadet health is represented by hearts (capped between 0 and 5) and gems balance. The trigger clamps hearts to never exceed 5 or drop below 0, guards gems against negative balances, and automatically tracks heart regeneration cycles: when hearts fall below 5, it initializes `last_heart_lost_at` with the current UTC timestamp, and when hearts are refilled to 5, it resets the timestamp to `NULL`. This offloads continuous health and economy validation directly to the database layer."

### Trigger 4: Automatic Score Audit Ledger (`trg_audit_score_adjustments`)
> "To comply with academic and administrative data integrity standards, the `trg_audit_score_adjustments` trigger operates on `AFTER UPDATE OF total_score` on `profile_progress`. Whenever a student's score changes, the trigger automatically constructs an immutable audit entry in the `score_audit_logs` table, storing the candidate's profile ID, previous score, updated score, difference (`score_delta`), previous level, new level, and timestamp. This provides an audit trail to monitor score gains, track learning milestones, and detect anomalies."
