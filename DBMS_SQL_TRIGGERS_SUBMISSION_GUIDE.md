# DBMS Laboratory Partial Requirement: Traditional SQL Triggers
## System Implementation & Submission Guide

**System Name:** Civil Service Examination (CSE) Reviewer Gamified  
**Database Server:** Supabase (PostgreSQL 15+) / MySQL 8.0+  
**Architecture:** Real-time Natural Integration (Integrated directly into normal user activities: Shop, Lessons, Profile, and Progression).

---

## Overview: Natural Trigger Integration Architecture

Unlike artificial demo screens or manual simulators, all four (4) triggers in this application are **naturally woven into core business workflows**:

```
+--------------------------------------------------------------------------------------------------+
|                                    NATURAL APPLICATION FLOW                                      |
+--------------------------------------------------------------------------------------------------+
| 1. Shop (/shop)            --> Attempts purchase with insufficient gems                          |
|                                --> TRIGGER 1: trg_validate_game_economy rejects transaction       |
|                                --> GUI surfaces Database Error Toast naturally                   |
+--------------------------------------------------------------------------------------------------+
| 2. Practice Drills (/lesson) --> Cadet completes exam quiz questions and earns XP                |
|                                --> TRIGGER 2: trg_enforce_cadet_progression_rules calculates level|
|                                --> GUI updates Cadet Rank badge on Dashboard & Profile           |
+--------------------------------------------------------------------------------------------------+
| 3. Profile Progress        --> Total score increments upon drill completion                      |
|                                --> TRIGGER 3: trg_audit_score_adjustments writes audit row        |
|                                --> GUI Profile displays live immutable Score Audit Ledger        |
+--------------------------------------------------------------------------------------------------+
| 4. Lesson Events           --> Drill event is logged to lesson_events                            |
|                                --> TRIGGER 4: trg_auto_log_cadet_activity auto-logs description   |
|                                --> GUI Profile displays auto-logged Recent Activities            |
+--------------------------------------------------------------------------------------------------+
```

---

## 1. Validation Trigger

### a. Explanation
> **Requirement:** The database must prevent the insertion or update of invalid quantities or illegal balances.
>
> In our Civil Service Examination Reviewer system, the database enforces data integrity by strictly validating cadet game economy state (`profile_game_state`). Specifically, the database must prevent any transaction that results in:
> 1. An invalid negative gems balance (`NEW.gems < 0`), which would occur if a user attempts to spend more gems than they possess in the Reviewer Item Shop.
> 2. An invalid heart count exceeding maximum capacity (`NEW.hearts > 5`), or negative hearts (`NEW.hearts < 0`).
> 3. An invalid streak freeze inventory exceeding the maximum allowed equipment of 2 (`NEW.streak_freeze_count > 2`).
>
> When any of these validation constraints are violated, the trigger invokes `RAISE EXCEPTION` in PostgreSQL (or `SIGNAL SQLSTATE '45000'` in MySQL). This immediately rolls back the database transaction and transmits an error message back to the application.

### b. Database Server

#### PostgreSQL (Supabase) Syntax
```sql
CREATE OR REPLACE FUNCTION fn_trg_validate_game_economy()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
    -- 1. Validate Gems: Reject negative balance (cannot spend more than owned)
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

-- Drop legacy clamping triggers that interfere with validation
DROP TRIGGER IF EXISTS trg_enforce_game_state_rules ON profile_game_state;
DROP TRIGGER IF EXISTS trg_before_update_game_state ON profile_game_state;
DROP FUNCTION IF EXISTS fn_trg_enforce_game_state_rules();

DROP TRIGGER IF EXISTS trg_validate_game_economy ON profile_game_state;
CREATE TRIGGER trg_validate_game_economy
BEFORE INSERT OR UPDATE ON profile_game_state
FOR EACH ROW
EXECUTE FUNCTION fn_trg_validate_game_economy();
```

#### Database Server Live Verification Query
```sql
-- Test Trigger: Attempt setting negative gems (-100) or illegal hearts (99)
UPDATE profile_game_state
SET gems = -100
WHERE profile_id = (SELECT id FROM profiles LIMIT 1);

-- Expected Output:
-- ERROR: Validation Trigger Error: Insufficient gem balance (short by 100 gems). Transaction rejected by database.
```

### c. GUI - Output

1. **Where in the GUI:** Navigate to the **Reviewer Shop** (`http://localhost:3000/shop`).
2. **Natural User Action:**
   - Log in or open the Shop as a student with insufficient gems (e.g., 0 gems).
   - Click to purchase **"Streak Freeze"** (Cost: 200 gems) or purchase a custom badge.
3. **Trigger Execution in GUI:**
   - The frontend attempts to update `profile_game_state` with `gems = gems - cost`.
   - The database server validation trigger intercepts the update and aborts it with `P0001 (Validation Trigger Error)`.
   - The application naturally captures the rejected database response and presents the friendly Shop modal:
     > **Title:** `Not Enough Gems!`  
     > **Message:** `You don't have enough Gems to complete this purchase. (You need 200 more 💎 Gems)`  
     > `🛡️ Database Validation Trigger: Transaction rejected to protect your balance.`
4. **Screenshot to capture:** The Shop modal displaying the trigger rejection message.

---

## 2. Enforcing Business Rules Trigger

### a. Explanation
> **Requirement:** The database must enforce domain-specific business rules automatically without relying on client-side code.
>
> In our Civil Service Examination Reviewer system, the business rule mandates that **cadet rank progression must be strictly governed by cumulative Experience Points (XP)**. The client application is forbidden from setting or tampering with a user's level.
> 
> The `trg_enforce_cadet_progression_rules` trigger executes on `BEFORE INSERT OR UPDATE ON profile_progress`. It evaluates the cadet's `total_score` against the official Civil Service Examination gamification milestones:
> - **Level 1 (Cadet Recruit):** 0 – 499 XP
> - **Level 2 (Junior Cadet):** 500 – 999 XP
> - **Level 3 (Senior Cadet):** 1,000 – 1,999 XP
> - **Level 4 (Officer Cadet):** 2,000 – 3,499 XP
> - **Level 5 (Master Cadet):** 3,500 – 4,999 XP
> - **Level 6 (Lieutenant Cadet):** 5,000 – 7,499 XP
> - **Level 7+ (Captain Cadet):** 7,500+ XP (+1 level per 2,500 XP)
>
> Furthermore, whenever `lessons_completed` increments, the database trigger automatically updates `last_lesson_date` to the current date (`CURRENT_DATE`), ensuring daily activity and streak eligibility are synchronized at the database level.

### b. Database Server

#### PostgreSQL (Supabase) Syntax
```sql
CREATE OR REPLACE FUNCTION fn_trg_enforce_cadet_progression_rules()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
    -- Business Invariant: Clamp score and lessons completed to non-negative
    NEW.total_score := GREATEST(0, COALESCE(NEW.total_score, 0));
    NEW.lessons_completed := GREATEST(0, COALESCE(NEW.lessons_completed, 0));

    -- Enforce Civil Service cadet level milestones from XP:
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
```

#### Database Server Live Verification Query
```sql
-- Step 1: Update total_score to 3750 XP (Client only updates score)
UPDATE profile_progress
SET total_score = 3750
WHERE profile_id = (SELECT id FROM profiles LIMIT 1);

-- Step 2: Query result
SELECT profile_id, total_score, current_level, last_lesson_date
FROM profile_progress
WHERE profile_id = (SELECT id FROM profiles LIMIT 1);

-- Expected Output:
-- current_level is automatically set to 5 (Master Cadet, 3500-4999 XP) by the trigger!
```

### c. GUI - Output

1. **Where in the GUI:** Navigate to the **Reviewer Dashboard** (`http://localhost:3000/dashboard`) and **Lesson Drills** (`http://localhost:3000/lesson`).
2. **Natural User Action:**
   - Complete an exam practice module in `/lesson`.
   - Upon finishing, XP is added to the cadet's score.
3. **Trigger Execution in GUI:**
   - The application writes the earned XP to `profile_progress`.
   - The database trigger immediately recomputes `current_level` and updates the row.
   - On the **Dashboard Header** and **Profile Page**, the Cadet's Level Badge and title automatically advance (e.g. promoting from Level 1 "Cadet Recruit" to Level 2 "Junior Cadet"), and the progress meter automatically updates without any client-side level formula.
4. **Screenshot to capture:** The Dashboard showing the updated Level and Rank Badge computed by the database trigger.

---

## 3. Auditing Database Changes Trigger

### a. Explanation
> **Requirement:** The database must automatically track, record, and maintain an immutable historical audit trail of changes made to critical data.
>
> In our Civil Service Examination Reviewer system, academic and examination integrity requires that all score modifications, promotions, and XP adjustments are permanently logged. This prevents unauthorized score tampering and allows administrators to audit student learning velocity.
>
> The `trg_audit_score_adjustments` trigger fires on `AFTER UPDATE OF total_score ON profile_progress`. Whenever a cadet's score changes, the trigger automatically constructs an immutable record in `score_audit_logs`, capturing:
> - `profile_id`: Identification of the candidate.
> - `old_score`: Previous score before the transaction.
> - `new_score`: Updated score committed by the transaction.
> - `score_delta`: The exact XP gained (or deducted).
> - `old_level`: Previous rank level.
> - `new_level`: New rank level.
> - `changed_at`: Server timestamp (`NOW()`).

### b. Database Server

#### PostgreSQL (Supabase) Syntax
```sql
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

-- RLS policies ensuring client read access and trigger insert permissions:
ALTER TABLE score_audit_logs ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow all users to read score audit logs" ON score_audit_logs;
CREATE POLICY "Allow all users to read score audit logs" ON score_audit_logs FOR SELECT USING (true);
DROP POLICY IF EXISTS "Allow system and triggers to insert score audit logs" ON score_audit_logs;
CREATE POLICY "Allow system and triggers to insert score audit logs" ON score_audit_logs FOR INSERT WITH CHECK (true);
```

#### Database Server Live Verification Query
```sql
-- Query the immutable audit ledger generated by the trigger:
SELECT id, profile_id, old_score, new_score, score_delta, old_level, new_level, changed_at
FROM score_audit_logs
ORDER BY changed_at DESC
LIMIT 5;

-- Expected Output:
-- Live rows showing old_score, new_score, and positive score_delta with exact server timestamps.
```

### c. GUI - Output

1. **Where in the GUI:** Navigate to the **Profile Page** (`http://localhost:3000/profile`).
2. **Natural User Action:**
   - As a student finishes practice drills in `/lesson`, their score increases.
3. **Trigger Execution in GUI:**
   - Under the **"Cadet Activity & Audit Ledger"** section on the Profile page, click the **"Score Audit Trail"** tab.
   - The GUI directly renders the rows created by `trg_audit_score_adjustments`:
     - Displays `Score: 50 XP → 115 XP`
     - Displays `+65 XP` delta badge
     - Displays `Cadet Level: Lvl 1 → Lvl 2`
     - Displays exact audit timestamp (e.g., `09:48:12 PM`)
4. **Screenshot to capture:** The Profile page showing the "Score Audit Trail" ledger populated by the database trigger.

---

## 4. Automatic Data Logging Trigger

### a. Explanation
> **Requirement:** The database must automatically log business events into a secondary history or activity table upon data insertion, without requiring manual multi-table insert statements in application code.
>
> In our Civil Service Examination Reviewer system, whenever a student finishes an exam simulation module or practice drill, an event record is inserted into `lesson_events`.
>
> The `trg_auto_log_cadet_activity` trigger executes on `AFTER INSERT ON lesson_events`. It automatically extracts the drill score, inspects the event type, and formats a human-readable activity entry directly into the `cadet_activity_logs` table (e.g. `'Completed CSE Practice Drill (+65 XP)'`).
>
> This demonstrates **database-tier decoupling**: the client application only performs a single insert into `lesson_events`, and the database engine automatically maintains the user's activity log ledger.

### b. Database Server

#### PostgreSQL (Supabase) Syntax
```sql
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

-- RLS policies ensuring client read access and trigger insert permissions:
ALTER TABLE cadet_activity_logs ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow all users to read cadet activity logs" ON cadet_activity_logs;
CREATE POLICY "Allow all users to read cadet activity logs" ON cadet_activity_logs FOR SELECT USING (true);
DROP POLICY IF EXISTS "Allow system and triggers to insert cadet activity logs" ON cadet_activity_logs;
CREATE POLICY "Allow system and triggers to insert cadet activity logs" ON cadet_activity_logs FOR INSERT WITH CHECK (true);
```

#### Database Server Live Verification Query
```sql
-- Step 1: Insert a new lesson event (+75 XP)
INSERT INTO lesson_events (profile_id, score_delta, event_type, level_delta)
VALUES ((SELECT id FROM profiles LIMIT 1), 75, 'lesson_completed', 0);

-- Step 2: Query the automatically logged activity table
SELECT id, profile_id, event_type, activity_description, xp_gained, created_at
FROM cadet_activity_logs
ORDER BY created_at DESC
LIMIT 5;

-- Expected Output:
-- Contains auto-formatted record: "Completed CSE Practice Drill (+75 XP)"
```

### c. GUI - Output

1. **Where in the GUI:** Navigate to the **Profile Page** (`http://localhost:3000/profile`) or **Quests** (`http://localhost:3000/quests`).
2. **Natural User Action:**
   - Complete any test question drill or exam module in `/lesson`.
3. **Trigger Execution in GUI:**
   - On the Profile page under **"Cadet Activity & Audit Ledger"**, toggle to the **"Auto-Logged Events"** tab.
   - The GUI displays the activity records created automatically by `trg_auto_log_cadet_activity`:
     - Activity: `Completed CSE Practice Drill (+65 XP)`
     - Event Type: `lesson_completed`
     - XP Badge: `+65 XP`
     - Timestamp: Live server timestamp
4. **Screenshot to capture:** The Profile page showing the "Auto-Logged Events" tab with entries generated by the database trigger.

---

## 5. Submission Walkthrough & Verification Steps

To present this to your professor:

| Step | What to Demonstrate | Location | What the Professor Observes |
| :---: | :--- | :--- | :--- |
| **1** | **Validation Trigger** | Shop (`/shop`) | Attempting to purchase an item with insufficient gems results in a database rejection toast: `❌ Purchase failed: Validation Trigger Error: Insufficient gem balance...` |
| **2** | **Enforcing Business Rules** | Lesson (`/lesson`) & Dashboard (`/dashboard`) | Finishing a practice drill awards XP. The database trigger recalculates the Cadet Level, updating the Rank Badge (Level 1 $\rightarrow$ Level 2) on the Dashboard automatically. |
| **3** | **Auditing Database Changes** | Profile (`/profile`) $\rightarrow$ Score Audit Trail | Every score adjustment appears in the live immutable `score_audit_logs` table showing old score, new score, delta, and exact timestamp. |
| **4** | **Automatic Data Logging** | Profile (`/profile`) $\rightarrow$ Auto-Logged Events | Inserting a drill event automatically creates human-readable activity entries in `cadet_activity_logs` via the database trigger. |
