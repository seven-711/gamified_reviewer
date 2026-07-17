import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search') || '';

    // Fetch from all four tables to perform in-memory join
    const [profilesRes, settingsRes, progressRes, gameStateRes] = await Promise.all([
      supabase.from('profiles').select('id, name, created_at'),
      supabase.from('profile_study_settings').select('*'),
      supabase.from('profile_progress').select('*'),
      supabase.from('profile_game_state').select('*'),
    ]);

    if (profilesRes.error) throw new Error(profilesRes.error.message);
    if (settingsRes.error) throw new Error(settingsRes.error.message);
    if (progressRes.error) throw new Error(progressRes.error.message);
    if (gameStateRes.error) throw new Error(gameStateRes.error.message);

    const profiles = profilesRes.data || [];
    const settings = settingsRes.data || [];
    const progress = progressRes.data || [];
    const gameState = gameStateRes.data || [];

    // Map profiles into aggregated records
    const users = profiles.map((p) => {
      const pSettings = settings.find((s) => s.profile_id === p.id) || {};
      const pProgress = progress.find((pr) => pr.profile_id === p.id) || {};
      const pGame = gameState.find((g) => g.profile_id === p.id) || {};

      const nameParts = (p.name || "").split("|");
      const displayName = nameParts[0] || "Anonymous User";
      const avatarUrl = nameParts[1] || "";

      return {
        id: p.id,
        name: displayName,
        avatarUrl: avatarUrl,
        created_at: p.created_at,
        exam_category: pSettings.exam_category || null,
        sub_topic: pSettings.sub_topic || null,
        study_style: pSettings.study_style || 'Flashcards',
        difficulty: pSettings.difficulty || 'Beginner',
        total_score: pProgress.total_score || 0,
        current_level: pProgress.current_level || 1,
        lessons_completed: pProgress.lessons_completed || 0,
        streak: pGame.streak || 0,
        streak_freeze_count: pGame.streak_freeze_count || 0,
        hearts: pGame.hearts !== undefined && pGame.hearts !== null ? pGame.hearts : 5,
        gems: pGame.gems !== undefined && pGame.gems !== null ? pGame.gems : 50,
        last_lesson_date: pProgress.last_lesson_date || null,
      };
    });

    // Apply search filter if present
    const filteredUsers = users.filter((u) => {
      const term = search.toLowerCase();
      return (
        u.name.toLowerCase().includes(term) ||
        u.id.toLowerCase().includes(term)
      );
    });

    return NextResponse.json({ users: filteredUsers });
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

    // Update in profiles
    if (name !== undefined) {
      const { data: existingProfile } = await supabase.from('profiles').select('name').eq('id', id).maybeSingle();
      const existingName = existingProfile?.name || '';
      const avatarPart = existingName.includes('|') ? existingName.split('|')[1] : '';
      const mergedName = avatarPart ? `${name}|${avatarPart}` : name;

      const { error } = await supabase.from('profiles').update({ name: mergedName }).eq('id', id);
      if (error) throw new Error(`profiles table: ${error.message}`);
    }

    // Update in profile_game_state
    const gameStateUpdates: Record<string, any> = {};
    if (gems !== undefined) gameStateUpdates.gems = Number(gems);
    if (hearts !== undefined) gameStateUpdates.hearts = Number(hearts);
    if (streak !== undefined) gameStateUpdates.streak = Number(streak);
    if (streak_freeze_count !== undefined) gameStateUpdates.streak_freeze_count = Number(streak_freeze_count);

    if (Object.keys(gameStateUpdates).length > 0) {
      const { error } = await supabase.from('profile_game_state').upsert({
        profile_id: id,
        ...gameStateUpdates
      });
      if (error) throw new Error(`profile_game_state table: ${error.message}`);
    }

    // Update in profile_progress
    const progressUpdates: Record<string, any> = {};
    if (current_level !== undefined) progressUpdates.current_level = Number(current_level);
    if (total_score !== undefined) progressUpdates.total_score = Number(total_score);
    if (lessons_completed !== undefined) progressUpdates.lessons_completed = Number(lessons_completed);

    if (Object.keys(progressUpdates).length > 0) {
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
