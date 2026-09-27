import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

// ─── SQL Triggers Metadata ───────────────────────────────────────────────────

export const TRIGGERS_METADATA = [
  {
    id: 'trg_calculate_cadet_level',
    name: 'trg_calculate_cadet_level',
    functionName: 'fn_trg_calculate_cadet_level',
    table: 'profile_progress',
    timing: 'BEFORE',
    event: 'INSERT OR UPDATE',
    category: 'Business Logic & Data Integrity',
    purpose: 'Guards against negative score/lesson inputs, automatically derives the gamified Cadet Level from cumulative XP (total_score) milestone thresholds, and synchronizes last_lesson_date.',
    postgresSql: `CREATE OR REPLACE FUNCTION fn_trg_calculate_cadet_level()
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
EXECUTE FUNCTION fn_trg_calculate_cadet_level();`,
    mysqlSql: `DELIMITER $$
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
DELIMITER ;`,
    sampleDml: `UPDATE profile_progress SET total_score = 3250 WHERE profile_id = 'usr_001';`,
    expectedOutcome: 'Total score becomes 3250; current_level automatically set to 4 (Officer Cadet).',
  },
  {
    id: 'trg_sync_lesson_event_to_progress',
    name: 'trg_sync_lesson_event_to_progress',
    functionName: 'fn_trg_sync_lesson_event_to_progress',
    table: 'lesson_events',
    timing: 'AFTER',
    event: 'INSERT',
    category: 'Real-time Data Synchronization & Cascading Trigger',
    purpose: 'Automatically updates profile_progress upon inserting a lesson completion event, incrementing total XP and completed lessons, which immediately cascades into trg_calculate_cadet_level.',
    postgresSql: `CREATE OR REPLACE FUNCTION fn_trg_sync_lesson_event_to_progress()
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
EXECUTE FUNCTION fn_trg_sync_lesson_event_to_progress();`,
    mysqlSql: `DELIMITER $$
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
DELIMITER ;`,
    sampleDml: `INSERT INTO lesson_events (profile_id, score_delta, event_type, level_delta) VALUES ('usr_001', 500, 'lesson_completed', 0);`,
    expectedOutcome: 'profile_progress total_score increments by 500, lessons_completed increments by 1, and cascading level triggers.',
  },
  {
    id: 'trg_enforce_game_state_rules',
    name: 'trg_enforce_game_state_rules',
    functionName: 'fn_trg_enforce_game_state_rules',
    table: 'profile_game_state',
    timing: 'BEFORE',
    event: 'INSERT OR UPDATE',
    category: 'Game State Economy & Health Invariant Guard',
    purpose: 'Enforces gameplay invariants: clamps hearts between [0, 5], prevents negative gems or streak counters, and automatically records heart depletion timestamps for regenerative heart refills.',
    postgresSql: `CREATE OR REPLACE FUNCTION fn_trg_enforce_game_state_rules()
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
EXECUTE FUNCTION fn_trg_enforce_game_state_rules();`,
    mysqlSql: `DELIMITER $$
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
DELIMITER ;`,
    sampleDml: `UPDATE profile_game_state SET hearts = 99, gems = -100 WHERE profile_id = 'usr_001';`,
    expectedOutcome: 'Hearts is clamped to 5; gems is clamped to 0; last_heart_lost_at is cleared.',
  },
  {
    id: 'trg_audit_score_adjustments',
    name: 'trg_audit_score_adjustments',
    functionName: 'fn_trg_audit_score_adjustments',
    table: 'profile_progress -> score_audit_logs',
    timing: 'AFTER',
    event: 'UPDATE OF total_score',
    category: 'Security & Administrative Audit Logging',
    purpose: 'Automatically logs every score change into the score_audit_logs ledger with old_score, new_score, delta, rank levels, and timestamp.',
    postgresSql: `CREATE TABLE IF NOT EXISTS score_audit_logs (
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
EXECUTE FUNCTION fn_trg_audit_score_adjustments();`,
    mysqlSql: `DELIMITER $$
-- In MySQL, created via AFTER UPDATE trigger on profile_progress
DROP TRIGGER IF EXISTS trg_after_update_audit_score$$
CREATE TRIGGER trg_after_update_audit_score
AFTER UPDATE ON profile_progress
FOR EACH ROW
BEGIN
    IF OLD.total_score <> NEW.total_score THEN
        INSERT INTO score_audit_logs (profile_id, old_score, new_score, score_delta, old_level, new_level, changed_at)
        VALUES (NEW.profile_id, OLD.total_score, NEW.total_score, NEW.total_score - OLD.total_score, OLD.current_level, NEW.current_level, NOW());
    END IF;
END$$
DELIMITER ;`,
    sampleDml: `SELECT * FROM score_audit_logs ORDER BY changed_at DESC LIMIT 5;`,
    expectedOutcome: 'Returns immutable historical audit records capturing all cadet XP adjustments.',
  },
];

// ─── Native Logic Evaluators (Mirroring Database Triggers) ────────────────────

export function evalLevelFromScore(totalScore: number): number {
  const safeScore = Math.max(0, totalScore || 0);
  if (safeScore >= 7500) {
    return 7 + Math.floor((safeScore - 7500) / 2500);
  } else if (safeScore >= 5000) {
    return 6;
  } else if (safeScore >= 3500) {
    return 5;
  } else if (safeScore >= 2000) {
    return 4;
  } else if (safeScore >= 1000) {
    return 3;
  } else if (safeScore >= 500) {
    return 2;
  } else {
    return 1;
  }
}

export function evalCadetRankTitle(level: number): string {
  switch (level) {
    case 1: return 'Cadet Recruit';
    case 2: return 'Junior Cadet';
    case 3: return 'Senior Cadet';
    case 4: return 'Officer Cadet';
    case 5: return 'Master Cadet';
    case 6: return 'Lieutenant Cadet';
    default: return level >= 7 ? `Executive Commander (Lvl ${level})` : 'Cadet';
  }
}

export function evalClampedGameState(hearts: number, gems: number) {
  const clampedHearts = Math.min(5, Math.max(0, hearts ?? 5));
  const clampedGems = Math.max(0, gems ?? 0);
  const heartLostAt = clampedHearts < 5 ? new Date().toISOString() : null;
  return { hearts: clampedHearts, gems: clampedGems, last_heart_lost_at: heartLostAt };
}

// ─── GET /api/admin/triggers ──────────────────────────────────────────────────

export async function GET() {
  try {
    let auditLogs: any[] = [];
    let progressRecords: any[] = [];

    // Attempt to read live database status if available
    try {
      const { data: logs } = await supabase
        .from('score_audit_logs')
        .select('*')
        .order('changed_at', { ascending: false })
        .limit(10);
      if (logs) auditLogs = logs;
    } catch {
      // Table may not have been migrated yet in remote Supabase
    }

    try {
      const { data: prog } = await supabase
        .from('profile_progress')
        .select('profile_id, total_score, current_level, lessons_completed, last_lesson_date')
        .order('total_score', { ascending: false })
        .limit(10);
      if (prog) progressRecords = prog;
    } catch {
      // fallback
    }

    // Default mock audit records if empty
    if (auditLogs.length === 0) {
      auditLogs = [
        { id: 1, profile_id: 'usr_001', old_score: 2950, new_score: 3450, score_delta: 500, old_level: 4, new_level: 4, changed_at: new Date(Date.now() - 3600000).toISOString() },
        { id: 2, profile_id: 'usr_002', old_score: 1800, new_score: 2100, score_delta: 300, old_level: 3, new_level: 4, changed_at: new Date(Date.now() - 7200000).toISOString() },
        { id: 3, profile_id: 'usr_003', old_score: 450, new_score: 550, score_delta: 100, old_level: 1, new_level: 2, changed_at: new Date(Date.now() - 86400000).toISOString() },
      ];
    }

    return NextResponse.json({
      triggers: TRIGGERS_METADATA,
      progressRecords,
      auditLogs,
      databaseSystem: 'PostgreSQL (Supabase) / MySQL Compatible',
      totalTriggers: TRIGGERS_METADATA.length,
    });
  } catch (error: any) {
    console.error('Error in GET /api/admin/triggers:', error);
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 });
  }
}

// ─── POST /api/admin/triggers ─────────────────────────────────────────────────

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { action, params } = body;

    let simulationResult: any = null;

    if (action === 'simulate_level_calc') {
      const rawScore = Number(params?.total_score) || 0;
      const rawLessons = Number(params?.lessons_completed) || 0;
      const safeScore = Math.max(0, rawScore);
      const safeLessons = Math.max(0, rawLessons);
      const calculatedLevel = evalLevelFromScore(safeScore);
      const rankTitle = evalCadetRankTitle(calculatedLevel);
      const todayStr = new Date().toISOString().split('T')[0];

      simulationResult = {
        action: 'trg_calculate_cadet_level',
        input: { total_score: rawScore, lessons_completed: rawLessons },
        output: {
          clamped_total_score: safeScore,
          clamped_lessons_completed: safeLessons,
          current_level: calculatedLevel,
          rank_title: rankTitle,
          last_lesson_date: safeLessons > 0 ? todayStr : null,
        },
        sqlFired: `BEFORE INSERT OR UPDATE ON profile_progress -> fn_trg_calculate_cadet_level()`,
        explanation: `Score was clamped to ${safeScore} XP. Evaluated milestone: level ${calculatedLevel} (${rankTitle}). last_lesson_date synchronized to ${todayStr}.`,
      };
    } else if (action === 'simulate_lesson_sync') {
      const oldScore = Number(params?.old_score) || 1800;
      const oldLessons = Number(params?.old_lessons) || 8;
      const xpEarned = Number(params?.score_delta) || 500;
      const newScore = oldScore + xpEarned;
      const newLessons = oldLessons + 1;
      const oldLevel = evalLevelFromScore(oldScore);
      const newLevel = evalLevelFromScore(newScore);
      const isLevelUp = newLevel > oldLevel;

      simulationResult = {
        action: 'trg_sync_lesson_event_to_progress',
        input: { old_score: oldScore, old_lessons: oldLessons, score_delta: xpEarned },
        output: {
          previous_state: { total_score: oldScore, lessons_completed: oldLessons, current_level: oldLevel },
          updated_state: { total_score: newScore, lessons_completed: newLessons, current_level: newLevel },
          is_level_up: isLevelUp,
          audit_logged: {
            old_score: oldScore,
            new_score: newScore,
            score_delta: xpEarned,
            old_level: oldLevel,
            new_level: newLevel,
          },
        },
        sqlFired: `AFTER INSERT ON lesson_events -> trg_sync_lesson_event_to_progress -> CASCADES TO trg_calculate_cadet_level & trg_audit_score_adjustments`,
        explanation: `Lesson completion logged (+${xpEarned} XP). Trigger updated profile_progress, which immediately activated the level-calc trigger (${oldLevel} -> ${newLevel}) and audit logging.`,
      };
    } else if (action === 'simulate_game_state') {
      const rawHearts = Number(params?.hearts);
      const rawGems = Number(params?.gems);
      const clamped = evalClampedGameState(rawHearts, rawGems);

      simulationResult = {
        action: 'trg_enforce_game_state_rules',
        input: { raw_hearts: rawHearts, raw_gems: rawGems },
        output: clamped,
        sqlFired: `BEFORE INSERT OR UPDATE ON profile_game_state -> fn_trg_enforce_game_state_rules()`,
        explanation: `Hearts was clamped into valid [0, 5] range (${clamped.hearts}). Gems was clamped to non-negative (${clamped.gems}). Heart depletion timestamp: ${clamped.last_heart_lost_at || 'NULL (Full Hearts)'}.`,
      };
    } else {
      return NextResponse.json({ error: 'Unknown simulation action' }, { status: 400 });
    }

    return NextResponse.json({
      success: true,
      simulationResult,
      executedAt: new Date().toISOString(),
    });
  } catch (error: any) {
    console.error('Error in POST /api/admin/triggers:', error);
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 });
  }
}
