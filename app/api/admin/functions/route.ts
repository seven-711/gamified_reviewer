import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

// ─── SQL Definitions ──────────────────────────────────────────────────────────

export const FUNCTIONS_METADATA = [
  {
    id: 'fn_format_reviewer_title',
    category: 'String Function',
    name: 'fn_format_reviewer_title',
    returns: 'VARCHAR(150)',
    parameters: [
      { name: 'p_name', type: 'VARCHAR(100)', description: 'Raw username with optional avatar suffix (e.g. July|avatar_1.png)' },
      { name: 'p_level', type: 'INT', description: 'Current gamification level of the reviewer' }
    ],
    purpose: 'Cleanses raw username strings by stripping avatar tags, handling nulls/empty values, and formatting an official Civil Service Rank & Cadet title.',
    postgresSql: `CREATE OR REPLACE FUNCTION fn_format_reviewer_title(
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
$$;`,
    mysqlSql: `DELIMITER $$
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
DELIMITER ;`,
    sampleCall: `SELECT fn_format_reviewer_title('JulyFranz|avatar_4.png', 5);`,
  },
  {
    id: 'fn_calculate_mastery_rate',
    category: 'Numeric Function',
    name: 'fn_calculate_mastery_rate',
    returns: 'NUMERIC(10, 2)',
    parameters: [
      { name: 'p_total_score', type: 'INT', description: 'Cumulative XP/score accumulated across modules' },
      { name: 'p_lessons_completed', type: 'INT', description: 'Total number of lessons or drills finished' }
    ],
    purpose: 'Calculates the reviewer average score/XP efficiency per completed lesson module with zero-division protection and 2 decimal place precision.',
    postgresSql: `CREATE OR REPLACE FUNCTION fn_calculate_mastery_rate(
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
$$;`,
    mysqlSql: `DELIMITER $$
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
DELIMITER ;`,
    sampleCall: `SELECT fn_calculate_mastery_rate(2450, 14);`,
  },
  {
    id: 'fn_determine_exam_readiness',
    category: 'Business Rule Function',
    name: 'fn_determine_exam_readiness',
    returns: 'VARCHAR(50)',
    parameters: [
      { name: 'p_total_score', type: 'INT', description: 'Total cumulative reviewer score' },
      { name: 'p_lessons_completed', type: 'INT', description: 'Number of completed review modules' },
      { name: 'p_streak', type: 'INT', description: 'Consecutive daily study streak' }
    ],
    purpose: 'Enforces Civil Service Examination qualification criteria by assessing cumulative score, drill repetitions, and study streak continuity.',
    postgresSql: `CREATE OR REPLACE FUNCTION fn_determine_exam_readiness(
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
$$;`,
    mysqlSql: `DELIMITER $$
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
DELIMITER ;`,
    sampleCall: `SELECT fn_determine_exam_readiness(3200, 12, 8);`,
  },
];

export const UNIFIED_SYSTEM_QUERY = `
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
`.trim();

// ─── Native Logic Evaluators (Mirroring Database Functions) ───────────────────

export function evalFormatReviewerTitle(name: string | null | undefined, level: number | null | undefined): string {
  const cleanName = (name || '').split('|')[0].trim() || 'Civil Service Cadet';
  const safeLevel = Math.max(Number(level) || 1, 1);
  return `${cleanName} [Lvl ${safeLevel} Cadet]`;
}

export function evalCalculateMasteryRate(totalScore: number | null | undefined, lessonsCompleted: number | null | undefined): number {
  const lessons = Number(lessonsCompleted) || 0;
  if (lessons <= 0) return 0.0;
  const score = Number(totalScore) || 0;
  return Number((score / lessons).toFixed(2));
}

export function evalDetermineExamReadiness(
  totalScore: number | null | undefined,
  lessonsCompleted: number | null | undefined,
  streak: number | null | undefined
): string {
  const score = Number(totalScore) || 0;
  const lessons = Number(lessonsCompleted) || 0;
  const stk = Number(streak) || 0;

  if (score >= 5000 && lessons >= 20 && stk >= 7) {
    return 'EXCELLENT: Exam Ready (High Honor)';
  } else if (score >= 2500 && lessons >= 10) {
    return 'QUALIFIED: Exam Ready (Passing Tier)';
  } else if (score >= 1000 && lessons >= 5) {
    return 'IN PROGRESS: Intermediate Reviewer';
  } else if (score >= 300 || lessons >= 2) {
    return 'DEVELOPING: Basic Competency';
  } else {
    return 'NEEDS PRACTICE: Novice Reviewer';
  }
}

// ─── Fallback Sample Dataset (For Offline or Local Display) ───────────────────

const FALLBACK_PROFILES = [
  { id: 'usr_001', raw_name: 'JulyFranz|avatar_1.png', level: 8, total_score: 6420, lessons_completed: 28, streak: 15 },
  { id: 'usr_002', raw_name: 'Maria Santos|avatar_3.png', level: 5, total_score: 3150, lessons_completed: 16, streak: 9 },
  { id: 'usr_003', raw_name: 'Carlos Reyes|avatar_2.png', level: 3, total_score: 1840, lessons_completed: 9, streak: 4 },
  { id: 'usr_004', raw_name: 'Angela Cruz', level: 2, total_score: 720, lessons_completed: 4, streak: 3 },
  { id: 'usr_005', raw_name: 'Cadet_Ramil|avatar_5.png', level: 1, total_score: 210, lessons_completed: 1, streak: 1 },
  { id: 'usr_006', raw_name: null, level: 1, total_score: 0, lessons_completed: 0, streak: 0 },
];

// ─── GET /api/admin/functions ─────────────────────────────────────────────────

export async function GET() {
  try {
    let rows: any[] = [];
    let rpcSupported = false;

    // 1. Attempt live query to profiles + progress + game state
    try {
      const { data: profiles, error } = await supabase.from('profiles').select(`
        id, name, created_at,
        profile_progress ( total_score, current_level, lessons_completed ),
        profile_game_state ( streak, hearts, gems )
      `);

      if (!error && profiles && profiles.length > 0) {
        // Test if stored functions are callable via Supabase RPC
        try {
          const testRpc = await supabase.rpc('fn_calculate_mastery_rate', { p_total_score: 100, p_lessons_completed: 1 });
          if (!testRpc.error) {
            rpcSupported = true;
          }
        } catch {
          rpcSupported = false;
        }

        rows = await Promise.all(
          profiles.map(async (p: any) => {
            // PostgREST returns 1:1 foreign key relationships as objects or single-element arrays
            const prog = Array.isArray(p.profile_progress) ? p.profile_progress[0] : p.profile_progress;
            const game = Array.isArray(p.profile_game_state) ? p.profile_game_state[0] : p.profile_game_state;

            const rawName = p.name ?? null;
            const level = Number(prog?.current_level) || 1;
            const totalScore = Number(prog?.total_score) || 0;
            const lessons = Number(prog?.lessons_completed) || 0;
            const streak = Number(game?.streak) || 0;

            let title = evalFormatReviewerTitle(rawName, level);
            let mastery = evalCalculateMasteryRate(totalScore, lessons);
            let readiness = evalDetermineExamReadiness(totalScore, lessons, streak);

            // If RPC is supported, evaluate directly via PostgreSQL stored functions in Supabase
            if (rpcSupported) {
              try {
                const [r1, r2, r3] = await Promise.all([
                  supabase.rpc('fn_format_reviewer_title', { p_name: rawName || 'Reviewer', p_level: level }),
                  supabase.rpc('fn_calculate_mastery_rate', { p_total_score: totalScore, p_lessons_completed: lessons }),
                  supabase.rpc('fn_determine_exam_readiness', { p_total_score: totalScore, p_lessons_completed: lessons, p_streak: streak }),
                ]);
                if (!r1.error && r1.data !== undefined && r1.data !== null) title = r1.data;
                if (!r2.error && r2.data !== undefined && r2.data !== null) mastery = Number(r2.data);
                if (!r3.error && r3.data !== undefined && r3.data !== null) readiness = r3.data;
              } catch {
                // Graceful fallback to TypeScript evaluations if a specific RPC call fails
              }
            }

            return {
              profile_id: p.id,
              raw_name: rawName,
              current_level: level,
              total_score: totalScore,
              lessons_completed: lessons,
              streak: streak,
              fn_format_reviewer_title: title,
              fn_calculate_mastery_rate: mastery,
              fn_determine_exam_readiness: readiness,
            };
          })
        );

        // Sort descending by total score so reviewers who took lessons appear at the top
        rows.sort((a, b) => b.total_score - a.total_score);
      }
    } catch (liveErr) {
      console.error('Error fetching live profiles in /api/admin/functions:', liveErr);
    }

    // 2. If database returned zero rows or failed, use rich fallback data
    if (rows.length === 0) {
      rows = FALLBACK_PROFILES.map((f) => ({
        profile_id: f.id,
        raw_name: f.raw_name,
        current_level: f.level,
        total_score: f.total_score,
        lessons_completed: f.lessons_completed,
        streak: f.streak,
        fn_format_reviewer_title: evalFormatReviewerTitle(f.raw_name, f.level),
        fn_calculate_mastery_rate: evalCalculateMasteryRate(f.total_score, f.lessons_completed),
        fn_determine_exam_readiness: evalDetermineExamReadiness(f.total_score, f.lessons_completed, f.streak),
      }));
    }

    return NextResponse.json({
      functions: FUNCTIONS_METADATA,
      unifiedSystemQuery: UNIFIED_SYSTEM_QUERY,
      records: rows,
      rpcSupported,
      totalRecords: rows.length,
    });
  } catch (error: any) {
    console.error('Error in GET /api/admin/functions:', error);
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 });
  }
}

// ─── POST /api/admin/functions ────────────────────────────────────────────────

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { functionId, params } = body;

    let result: any = null;
    let sqlExecutionCall = '';

    if (functionId === 'fn_format_reviewer_title') {
      const name = params?.name ?? 'JulyFranz|avatar_4.png';
      const level = Number(params?.level) || 1;
      sqlExecutionCall = `SELECT fn_format_reviewer_title('${name.replace(/'/g, "''")}', ${level});`;
      try {
        const rpcRes = await supabase.rpc('fn_format_reviewer_title', { p_name: name, p_level: level });
        if (!rpcRes.error && rpcRes.data !== undefined && rpcRes.data !== null) {
          result = rpcRes.data;
        } else {
          result = evalFormatReviewerTitle(name, level);
        }
      } catch {
        result = evalFormatReviewerTitle(name, level);
      }
    } else if (functionId === 'fn_calculate_mastery_rate') {
      const score = Number(params?.total_score) || 0;
      const lessons = Number(params?.lessons_completed) || 0;
      sqlExecutionCall = `SELECT fn_calculate_mastery_rate(${score}, ${lessons});`;
      try {
        const rpcRes = await supabase.rpc('fn_calculate_mastery_rate', { p_total_score: score, p_lessons_completed: lessons });
        if (!rpcRes.error && rpcRes.data !== undefined && rpcRes.data !== null) {
          result = Number(rpcRes.data);
        } else {
          result = evalCalculateMasteryRate(score, lessons);
        }
      } catch {
        result = evalCalculateMasteryRate(score, lessons);
      }
    } else if (functionId === 'fn_determine_exam_readiness') {
      const score = Number(params?.total_score) || 0;
      const lessons = Number(params?.lessons_completed) || 0;
      const streak = Number(params?.streak) || 0;
      sqlExecutionCall = `SELECT fn_determine_exam_readiness(${score}, ${lessons}, ${streak});`;
      try {
        const rpcRes = await supabase.rpc('fn_determine_exam_readiness', { p_total_score: score, p_lessons_completed: lessons, p_streak: streak });
        if (!rpcRes.error && rpcRes.data !== undefined && rpcRes.data !== null) {
          result = rpcRes.data;
        } else {
          result = evalDetermineExamReadiness(score, lessons, streak);
        }
      } catch {
        result = evalDetermineExamReadiness(score, lessons, streak);
      }
    } else {
      return NextResponse.json({ error: 'Unknown functionId' }, { status: 400 });
    }

    return NextResponse.json({
      functionId,
      result,
      sqlExecutionCall,
      executedAt: new Date().toISOString(),
    });
  } catch (error: any) {
    console.error('Error in POST /api/admin/functions:', error);
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 });
  }
}
