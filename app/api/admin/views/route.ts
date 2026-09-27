import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

/**
 * SQL VIEWS DEFINITIONS
 * ─────────────────────
 * These are the native MySQL/PostgreSQL VIEW statements used in this system.
 * In Supabase they are created via the SQL Editor.  In MySQL they would be
 * executed directly against the database.
 *
 * VIEW 1: vw_user_full_profile
 *   Joins: profiles + profile_study_settings + profile_progress
 *   Purpose: Full Player Dashboard Report
 *
 * VIEW 2: vw_user_game_status
 *   Joins: profiles + profile_game_state + profile_progress
 *   Purpose: Game Economy & Engagement Report
 *
 * VIEW 3: vw_lesson_activity_summary
 *   Joins: profiles + lesson_events + profile_study_settings
 *   Purpose: Lesson Activity & XP Audit Report
 */

export const VIEW_SQL = {
  vw_user_full_profile: `
CREATE OR REPLACE VIEW vw_user_full_profile AS
SELECT
  p.id                          AS profile_id,
  p.name                        AS display_name,
  p.created_at                  AS registered_at,
  pss.exam_category,
  pss.sub_topic,
  pss.study_style,
  pss.difficulty,
  pss.timer_duration,
  pp.total_score,
  pp.current_level,
  pp.lessons_completed,
  pp.last_lesson_date
FROM profiles p
INNER JOIN profile_study_settings pss
       ON pss.profile_id = p.id
INNER JOIN profile_progress pp
       ON pp.profile_id = p.id;`.trim(),

  vw_user_game_status: `
CREATE OR REPLACE VIEW vw_user_game_status AS
SELECT
  p.id                             AS profile_id,
  p.name                           AS display_name,
  pp.total_score,
  pp.lessons_completed,
  pp.last_lesson_date,
  pgs.streak,
  pgs.streak_freeze_count,
  pgs.hearts,
  pgs.gems,
  pgs.last_heart_lost_at,
  CASE
    WHEN pp.total_score >= 8000 THEN 'Legend League'
    WHEN pp.total_score >= 6000 THEN 'Champion League'
    WHEN pp.total_score >= 4000 THEN 'Master League'
    WHEN pp.total_score >= 2500 THEN 'Diamond League'
    WHEN pp.total_score >= 1500 THEN 'Crystal League'
    WHEN pp.total_score >= 800  THEN 'Gold League'
    WHEN pp.total_score >= 300  THEN 'Silver League'
    ELSE 'Bronze League'
  END AS league_name
FROM profiles p
INNER JOIN profile_game_state pgs
       ON pgs.profile_id = p.id
INNER JOIN profile_progress pp
       ON pp.profile_id = p.id;`.trim(),

  vw_lesson_activity_summary: `
CREATE OR REPLACE VIEW vw_lesson_activity_summary AS
SELECT
  p.id                              AS profile_id,
  p.name                            AS display_name,
  p.created_at                      AS registered_at,
  pss.exam_category,
  pss.sub_topic,
  COUNT(le.id)                      AS total_events,
  SUM(le.score_delta)               AS total_xp_earned,
  MAX(le.created_at)                AS last_activity_at,
  MIN(le.created_at)                AS first_activity_at
FROM profiles p
LEFT JOIN lesson_events le
       ON le.profile_id = p.id
INNER JOIN profile_study_settings pss
       ON pss.profile_id = p.id
GROUP BY
  p.id, p.name, p.created_at,
  pss.exam_category, pss.sub_topic;`.trim(),
};

function extractName(rawName: string | null): string {
  if (!rawName) return 'Anonymous';
  return rawName.includes('|') ? rawName.split('|')[0] : rawName;
}

function getLeague(score: number): string {
  if (score >= 8000) return 'Legend League';
  if (score >= 6000) return 'Champion League';
  if (score >= 4000) return 'Master League';
  if (score >= 2500) return 'Diamond League';
  if (score >= 1500) return 'Crystal League';
  if (score >= 800) return 'Gold League';
  if (score >= 300) return 'Silver League';
  return 'Bronze League';
}

export async function GET() {
  try {
    // ── VIEW 1: vw_user_full_profile ─────────────────────────────────────────
    // Equivalent of: SELECT * FROM vw_user_full_profile
    const { data: profilesRaw } = await supabase.from('profiles').select(`
      id, name, created_at,
      profile_study_settings ( exam_category, sub_topic, study_style, difficulty, timer_duration ),
      profile_progress ( total_score, current_level, lessons_completed, last_lesson_date )
    `);

    const view1 = (profilesRaw || [])
      .map((p: any) => {
        const settings = Array.isArray(p.profile_study_settings) ? p.profile_study_settings[0] : p.profile_study_settings;
        const prog = Array.isArray(p.profile_progress) ? p.profile_progress[0] : p.profile_progress;
        if (!settings && !prog) return null;
        return {
          profile_id: p.id,
          display_name: extractName(p.name),
          registered_at: p.created_at,
          exam_category: settings?.exam_category ?? null,
          sub_topic: settings?.sub_topic ?? null,
          study_style: settings?.study_style ?? 'Flashcards',
          difficulty: settings?.difficulty ?? 'Beginner',
          timer_duration: settings?.timer_duration ?? 5,
          total_score: Number(prog?.total_score) || 0,
          current_level: Number(prog?.current_level) || 1,
          lessons_completed: Number(prog?.lessons_completed) || 0,
          last_lesson_date: prog?.last_lesson_date ?? null,
        };
      })
      .filter(Boolean);

    // ── VIEW 2: vw_user_game_status ──────────────────────────────────────────
    // Equivalent of: SELECT * FROM vw_user_game_status
    const { data: gameRaw } = await supabase.from('profiles').select(`
      id, name,
      profile_game_state ( streak, streak_freeze_count, hearts, gems, last_heart_lost_at ),
      profile_progress ( total_score, lessons_completed, last_lesson_date )
    `);

    const view2 = (gameRaw || [])
      .map((p: any) => {
        const game = Array.isArray(p.profile_game_state) ? p.profile_game_state[0] : p.profile_game_state;
        const prog = Array.isArray(p.profile_progress) ? p.profile_progress[0] : p.profile_progress;
        if (!game && !prog) return null;
        const score = Number(prog?.total_score) || 0;
        return {
          profile_id: p.id,
          display_name: extractName(p.name),
          total_score: score,
          lessons_completed: Number(prog?.lessons_completed) || 0,
          last_lesson_date: prog?.last_lesson_date ?? null,
          streak: Number(game?.streak) || 0,
          streak_freeze_count: Number(game?.streak_freeze_count) || 0,
          hearts: game?.hearts !== undefined && game?.hearts !== null ? Number(game.hearts) : 5,
          gems: game?.gems !== undefined && game?.gems !== null ? Number(game.gems) : 0,
          last_heart_lost_at: game?.last_heart_lost_at ?? null,
          league_name: getLeague(score),
        };
      })
      .filter(Boolean);

    // ── VIEW 3: vw_lesson_activity_summary ──────────────────────────────────
    // Equivalent of: SELECT * FROM vw_lesson_activity_summary
    const { data: eventsRaw } = await supabase.from('lesson_events').select(`
      id, profile_id, score_delta, created_at
    `);

    const { data: settingsRaw } = await supabase.from('profile_study_settings').select(`
      profile_id, exam_category, sub_topic
    `);

    // Group events by profile_id
    const eventsByProfile: Record<string, any[]> = {};
    for (const ev of eventsRaw || []) {
      if (!eventsByProfile[ev.profile_id]) eventsByProfile[ev.profile_id] = [];
      eventsByProfile[ev.profile_id].push(ev);
    }

    const settingsMap: Record<string, any> = {};
    for (const s of settingsRaw || []) {
      settingsMap[s.profile_id] = s;
    }

    // Join profiles with events + settings
    const { data: profilesForView3 } = await supabase.from('profiles').select('id, name, created_at');

    const view3 = (profilesForView3 || [])
      .filter((p: any) => settingsMap[p.id]) // INNER JOIN profile_study_settings
      .map((p: any) => {
        const events = eventsByProfile[p.id] || [];
        const totalXp = events.reduce((sum: number, e: any) => sum + (e.score_delta ?? 0), 0);
        const dates = events.map((e: any) => e.created_at).sort();
        return {
          profile_id: p.id,
          display_name: extractName(p.name),
          registered_at: p.created_at,
          exam_category: settingsMap[p.id]?.exam_category ?? null,
          sub_topic: settingsMap[p.id]?.sub_topic ?? null,
          total_events: events.length,
          total_xp_earned: totalXp,
          last_activity_at: dates.length ? dates[dates.length - 1] : null,
          first_activity_at: dates.length ? dates[0] : null,
        };
      });

    view1.sort((a: any, b: any) => b.total_score - a.total_score);
    view2.sort((a: any, b: any) => b.total_score - a.total_score);
    view3.sort((a: any, b: any) => b.total_xp_earned - a.total_xp_earned);

    return NextResponse.json({
      viewSql: VIEW_SQL,
      view1,   // vw_user_full_profile
      view2,   // vw_user_game_status
      view3,   // vw_lesson_activity_summary
    });
  } catch (error: any) {
    console.error('Error in GET /api/admin/views:', error);
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}
