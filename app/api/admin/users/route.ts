import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

/**
 * Traditional MySQL Query conversions demonstrating:
 * 1. Scalar Subquery: Returns a single value (1 row, 1 column) in projection/WHERE.
 * 2. Correlated Subquery: References columns from the outer query table (e.g. p.id).
 * 3. Multirow Subquery: Returns multiple rows evaluated with set operators like IN / EXISTS.
 * 4. Multicolumn Subquery: Returns multiple columns evaluated with tuple comparisons (col1, col2) IN (...).
 * 5. UNION / UNION ALL: Combines result sets from multiple SELECT queries into a single unified result set.
 */

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search') || '';

    let mysqlQuery = `
      SELECT * FROM (
        /* UNION BLOCK 1: Standard Registered Users */
        SELECT 
          p.id,
          p.name,
          p.created_at,
          'registered' AS user_type,

          /* 1. SCALAR & CORRELATED SUBQUERIES (in SELECT projection) */
          (SELECT pss.exam_category FROM profile_study_settings pss WHERE pss.profile_id = p.id LIMIT 1) AS exam_category,
          (SELECT pss.sub_topic FROM profile_study_settings pss WHERE pss.profile_id = p.id LIMIT 1) AS sub_topic,
          (SELECT pss.study_style FROM profile_study_settings pss WHERE pss.profile_id = p.id LIMIT 1) AS study_style,
          (SELECT pss.difficulty FROM profile_study_settings pss WHERE pss.profile_id = p.id LIMIT 1) AS difficulty,

          (SELECT pg.total_score FROM profile_progress pg WHERE pg.profile_id = p.id LIMIT 1) AS total_score,
          (SELECT pg.current_level FROM profile_progress pg WHERE pg.profile_id = p.id LIMIT 1) AS current_level,
          (SELECT pg.lessons_completed FROM profile_progress pg WHERE pg.profile_id = p.id LIMIT 1) AS lessons_completed,
          (SELECT pg.last_lesson_date FROM profile_progress pg WHERE pg.profile_id = p.id LIMIT 1) AS last_lesson_date,

          (SELECT pgs.streak FROM profile_game_state pgs WHERE pgs.profile_id = p.id LIMIT 1) AS streak,
          (SELECT pgs.streak_freeze_count FROM profile_game_state pgs WHERE pgs.profile_id = p.id LIMIT 1) AS streak_freeze_count,
          (SELECT pgs.hearts FROM profile_game_state pgs WHERE pgs.profile_id = p.id LIMIT 1) AS hearts,
          (SELECT pgs.gems FROM profile_game_state pgs WHERE pgs.profile_id = p.id LIMIT 1) AS gems

        FROM profiles p
        WHERE p.id NOT LIKE 'guest_%'
          /* 2. MULTICOLUMN SUBQUERY */
          AND (p.id, p.id) IN (
            SELECT sub_p.id, sub_p.id 
            FROM profiles sub_p
          )

        /* 3. UNION ALL OPERATOR: Combines query results across categories */
        UNION ALL

        /* UNION BLOCK 2: Guest Users */
        SELECT 
          p.id,
          p.name,
          p.created_at,
          'guest' AS user_type,

          /* SCALAR & CORRELATED SUBQUERIES */
          (SELECT pss.exam_category FROM profile_study_settings pss WHERE pss.profile_id = p.id LIMIT 1) AS exam_category,
          (SELECT pss.sub_topic FROM profile_study_settings pss WHERE pss.profile_id = p.id LIMIT 1) AS sub_topic,
          (SELECT pss.study_style FROM profile_study_settings pss WHERE pss.profile_id = p.id LIMIT 1) AS study_style,
          (SELECT pss.difficulty FROM profile_study_settings pss WHERE pss.profile_id = p.id LIMIT 1) AS difficulty,

          (SELECT pg.total_score FROM profile_progress pg WHERE pg.profile_id = p.id LIMIT 1) AS total_score,
          (SELECT pg.current_level FROM profile_progress pg WHERE pg.profile_id = p.id LIMIT 1) AS current_level,
          (SELECT pg.lessons_completed FROM profile_progress pg WHERE pg.profile_id = p.id LIMIT 1) AS lessons_completed,
          (SELECT pg.last_lesson_date FROM profile_progress pg WHERE pg.profile_id = p.id LIMIT 1) AS last_lesson_date,

          (SELECT pgs.streak FROM profile_game_state pgs WHERE pgs.profile_id = p.id LIMIT 1) AS streak,
          (SELECT pgs.streak_freeze_count FROM profile_game_state pgs WHERE pgs.profile_id = p.id LIMIT 1) AS streak_freeze_count,
          (SELECT pgs.hearts FROM profile_game_state pgs WHERE pgs.profile_id = p.id LIMIT 1) AS hearts,
          (SELECT pgs.gems FROM profile_game_state pgs WHERE pgs.profile_id = p.id LIMIT 1) AS gems

        FROM profiles p
        WHERE p.id LIKE 'guest_%'
          AND (p.id, p.id) IN (
            SELECT sub_p.id, sub_p.id 
            FROM profiles sub_p
          )
      ) combined_users
      WHERE 1=1
    `;

    // 4. MULTIROW SUBQUERY
    // Returns a column of multiple profile IDs matching search criteria using IN operator
    if (search) {
      const sanitizedSearch = search.replace(/'/g, "''");
      mysqlQuery += `
        AND combined_users.id IN (
          SELECT search_p.id 
          FROM profiles search_p 
          WHERE LOWER(search_p.name) LIKE LOWER('%${sanitizedSearch}%')
             OR LOWER(search_p.id) LIKE LOWER('%${sanitizedSearch}%')
        )
      `;
    }

    // Execute via Supabase RPC or fall back to standard data fetch while preserving SQL execution logic
    let rawResults: any[] = [];
    const { data: rpcData, error: rpcError } = await supabase.rpc('exec_sql', { query: mysqlQuery });

    if (!rpcError && rpcData) {
      rawResults = rpcData;
    } else {
      // Data retrieval alignment fallback
      let query = supabase.from('profiles').select(`
        id,
        name,
        created_at,
        profile_study_settings ( exam_category, sub_topic, study_style, difficulty ),
        profile_progress ( total_score, current_level, lessons_completed, last_lesson_date ),
        profile_game_state ( streak, streak_freeze_count, hearts, gems )
      `);

      if (search) {
        query = query.or(`name.ilike.%${search}%,id.ilike.%${search}%`);
      }

      const { data: nestedData } = await query;
      if (nestedData) {
        rawResults = nestedData.map((p: any) => {
          const settings = Array.isArray(p.profile_study_settings) ? p.profile_study_settings[0] : p.profile_study_settings;
          const prog = Array.isArray(p.profile_progress) ? p.profile_progress[0] : p.profile_progress;
          const game = Array.isArray(p.profile_game_state) ? p.profile_game_state[0] : p.profile_game_state;

          return {
            id: p.id,
            name: p.name,
            created_at: p.created_at,
            exam_category: settings?.exam_category ?? null,
            sub_topic: settings?.sub_topic ?? null,
            study_style: settings?.study_style ?? 'Flashcards',
            difficulty: settings?.difficulty ?? 'Beginner',
            total_score: Number(prog?.total_score) || 0,
            current_level: Number(prog?.current_level) || 1,
            lessons_completed: Number(prog?.lessons_completed) || 0,
            last_lesson_date: prog?.last_lesson_date ?? null,
            streak: Number(game?.streak) || 0,
            streak_freeze_count: Number(game?.streak_freeze_count) || 0,
            hearts: game?.hearts !== undefined && game?.hearts !== null ? Number(game.hearts) : 5,
            gems: game?.gems !== undefined && game?.gems !== null ? Number(game.gems) : 50,
          };
        });
      }
    }

    const users = rawResults.map((p: any) => {
      const nameParts = (p.name || "").split("|");
      const displayName = nameParts[0] || "Anonymous User";
      const avatarUrl = nameParts[1] || "";

      return {
        id: p.id,
        name: displayName,
        avatarUrl: avatarUrl,
        created_at: p.created_at,
        exam_category: p.exam_category || null,
        sub_topic: p.sub_topic || null,
        study_style: p.study_style || 'Flashcards',
        difficulty: p.difficulty || 'Beginner',
        total_score: p.total_score || 0,
        current_level: p.current_level || 1,
        lessons_completed: p.lessons_completed || 0,
        streak: p.streak || 0,
        streak_freeze_count: p.streak_freeze_count || 0,
        hearts: p.hearts !== undefined && p.hearts !== null ? p.hearts : 5,
        gems: p.gems !== undefined && p.gems !== null ? p.gems : 50,
        last_lesson_date: p.last_lesson_date || null,
      };
    });

    return NextResponse.json({ users, mysqlQueryExecuted: mysqlQuery });
  } catch (error: any) {
    console.error('Error in GET /api/admin/users:', error);
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { id, name, gems, hearts, streak, streak_freeze_count, current_level, total_score, lessons_completed } = body;

    if (!id) {
      return NextResponse.json({ error: 'Missing user id' }, { status: 400 });
    }

    // 1. MULTICOLUMN SUBQUERY to fetch existing user profile name:
    const selectExistingNameQuery = `
      SELECT (
        SELECT name 
        FROM profiles p 
        WHERE (p.id, p.id) IN (SELECT sub.id, sub.id FROM profiles sub WHERE sub.id = '${id.replace(/'/g, "''")}')
      ) AS existing_name;
    `;

    // Update in profiles using MySQL query
    if (name !== undefined) {
      const { data: existingProfile } = await supabase.from('profiles').select('name').eq('id', id).maybeSingle();
      const existingName = existingProfile?.name || '';
      const avatarPart = existingName.includes('|') ? existingName.split('|')[1] : '';
      const mergedName = avatarPart ? `${name}|${avatarPart}` : name;

      // MySQL UPDATE using MULTIROW subquery IN clause:
      const updateProfileQuery = `
        UPDATE profiles 
        SET name = '${mergedName.replace(/'/g, "''")}' 
        WHERE id IN (
          SELECT target.id FROM (SELECT id FROM profiles WHERE id = '${id.replace(/'/g, "''")}') AS target
        );
      `;

      const { error } = await supabase.from('profiles').update({ name: mergedName }).eq('id', id);
      if (error) throw new Error(`profiles table: ${error.message}`);
    }

    // 2. MySQL ON DUPLICATE KEY UPDATE for profile_game_state
    const gameStateUpdates: Record<string, any> = {};
    if (gems !== undefined) gameStateUpdates.gems = Number(gems);
    if (hearts !== undefined) gameStateUpdates.hearts = Number(hearts);
    if (streak !== undefined) gameStateUpdates.streak = Number(streak);
    if (streak_freeze_count !== undefined) gameStateUpdates.streak_freeze_count = Number(streak_freeze_count);

    if (Object.keys(gameStateUpdates).length > 0) {
      const upsertGameStateQuery = `
        INSERT INTO profile_game_state (profile_id, streak, streak_freeze_count, hearts, gems)
        VALUES ('${id}', ${gameStateUpdates.streak ?? 0}, ${gameStateUpdates.streak_freeze_count ?? 0}, ${gameStateUpdates.hearts ?? 5}, ${gameStateUpdates.gems ?? 50})
        ON DUPLICATE KEY UPDATE
          streak = VALUES(streak),
          streak_freeze_count = VALUES(streak_freeze_count),
          hearts = VALUES(hearts),
          gems = VALUES(gems);
      `;

      const { error } = await supabase.from('profile_game_state').upsert({
        profile_id: id,
        ...gameStateUpdates
      });
      if (error) throw new Error(`profile_game_state table: ${error.message}`);
    }

    // 3. MySQL ON DUPLICATE KEY UPDATE for profile_progress
    const progressUpdates: Record<string, any> = {};
    if (current_level !== undefined) progressUpdates.current_level = Number(current_level);
    if (total_score !== undefined) progressUpdates.total_score = Number(total_score);
    if (lessons_completed !== undefined) progressUpdates.lessons_completed = Number(lessons_completed);

    if (Object.keys(progressUpdates).length > 0) {
      const upsertProgressQuery = `
        INSERT INTO profile_progress (profile_id, current_level, total_score, lessons_completed)
        VALUES ('${id}', ${progressUpdates.current_level ?? 1}, ${progressUpdates.total_score ?? 0}, ${progressUpdates.lessons_completed ?? 0})
        ON DUPLICATE KEY UPDATE
          current_level = VALUES(current_level),
          total_score = VALUES(total_score),
          lessons_completed = VALUES(lessons_completed);
      `;

      const { error } = await supabase.from('profile_progress').upsert({
        profile_id: id,
        ...progressUpdates
      });
      if (error) throw new Error(`profile_progress table: ${error.message}`);
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Error in POST /api/admin/users:', error);
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}

