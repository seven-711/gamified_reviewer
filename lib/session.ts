import { supabase } from "./supabase";

/**
 * Gets or creates a unique guest session ID.
 */
export function getOrCreateGuestSessionId(): string {
  if (typeof window === "undefined") return "";
  let id = localStorage.getItem("guest_session_id");
  if (!id) {
    id = "guest_" + Math.random().toString(36).substring(2, 15);
    localStorage.setItem("guest_session_id", id);
  }
  return id;
}

/**
 * Upserts a full profile row + all 3 child table rows.
 * Safe to call on both insert (new profile) and update (existing).
 */
export async function upsertFullProfile(params: {
  id: string;
  name?: string | null;
  // study settings
  exam_category?: string | null;
  sub_topic?: string | null;
  study_style?: string | null;
  difficulty?: string | null;
  timer_duration?: number;
  // progress
  total_score?: number;
  current_level?: number;
  lessons_completed?: number;
  last_lesson_date?: string | null;
  // game state
  streak?: number;
  streak_freeze_count?: number;
  hearts?: number;
  last_heart_lost_at?: string | null;
  gems?: number;
}): Promise<void> {
  const { id, name } = params;

  const res1 = await supabase.from("profiles").upsert({ id, name: name ?? null });
  if (res1.error) {
    console.error("Error upserting profiles:", res1.error);
    throw new Error(`profiles table: ${res1.error.message}`);
  }

  const res2 = await supabase.from("profile_study_settings").upsert({
    profile_id: id,
    exam_category: params.exam_category ?? null,
    sub_topic: params.sub_topic ?? null,
    study_style: params.study_style ?? "Flashcards",
    difficulty: params.difficulty ?? "Beginner",
    timer_duration: params.timer_duration ?? 5,
  });
  if (res2.error) {
    console.error("Error upserting profile_study_settings:", res2.error);
    throw new Error(`profile_study_settings table: ${res2.error.message}`);
  }

  const res3 = await supabase.from("profile_progress").upsert({
    profile_id: id,
    total_score: params.total_score ?? 0,
    current_level: params.current_level ?? 1,
    lessons_completed: params.lessons_completed ?? 0,
    last_lesson_date: params.last_lesson_date ?? null,
  });
  if (res3.error) {
    console.error("Error upserting profile_progress:", res3.error);
    throw new Error(`profile_progress table: ${res3.error.message}`);
  }

  const res4 = await supabase.from("profile_game_state").upsert({
    profile_id: id,
    streak: params.streak ?? 0,
    streak_freeze_count: params.streak_freeze_count ?? 1,
    hearts: params.hearts ?? 5,
    last_heart_lost_at: params.last_heart_lost_at ?? null,
    gems: params.gems ?? 50,
  });
  if (res4.error) {
    console.error("Error upserting profile_game_state:", res4.error);
    throw new Error(`profile_game_state table: ${res4.error.message}`);
  }
}

/**
 * Fetches a full merged profile object for a given profile ID.
 * Returns null if not found.
 */


export async function fetchFullProfile(profileId: string): Promise<Record<string, any> | null> {
  try {
    const [profileRes, settingsRes, progressRes, gameStateRes] = await Promise.all([
      supabase.from("profiles").select("id, name, created_at").eq("id", profileId).maybeSingle(),
      supabase.from("profile_study_settings").select("*").eq("profile_id", profileId).maybeSingle(),
      supabase.from("profile_progress").select("*").eq("profile_id", profileId).maybeSingle(),
      supabase.from("profile_game_state").select("*").eq("profile_id", profileId).maybeSingle(),
    ]);

    if (profileRes.error) {
      console.error("fetchFullProfile profiles query error:", profileRes.error.message);
      return null;
    }
    if (!profileRes.data) return null;

    return {
      id: profileRes.data.id,
      name: profileRes.data.name,
      created_at: profileRes.data.created_at,
      ...(settingsRes.data || {}),
      ...(progressRes.data || {}),
      ...(gameStateRes.data || {}),
    };
  } catch (err) {
    console.error("fetchFullProfile unexpected error:", err);
    return null;
  }
}

/**
 * Updates a profile's XP and lesson counts in Supabase.
 * Works for both registered user IDs and guest session IDs.
 * Returns the calculated XP earned.
 */
export async function updateProfileStats(
  profileId: string,
  correctAnswers: number,
  timeLeft: number,
  timerDurationMinutes: number,
  heartsRemaining?: number,
  totalQuestions?: number,
  economyConfig?: {
    baseReward: number;
    passingBonus: number;
    perfectBonus: number;
  }
): Promise<{ xpEarned: number; gemsEarned: number; streakIncreased: boolean; newStreak: number }> {
  // Calculate XP using the cumulative formula:
  const totalSeconds = timerDurationMinutes * 60;
  const baseScoreXp = correctAnswers * 15;
  const speedFactor = totalSeconds > 0 ? (timeLeft / totalSeconds) : 0;
  const speedBonus = Math.floor(speedFactor * timerDurationMinutes * 8);
  const durationBaseXp = timerDurationMinutes * 5;
  const xpEarned = baseScoreXp + speedBonus + durationBaseXp;

  let streakIncreased = false;
  let finalStreakVal = 0;

  // Calculate Gems using the new rewards schedule
  const questionsCount = totalQuestions || 10;
  const isPassed = (correctAnswers / questionsCount) >= 0.8;
  const isPerfect = correctAnswers === questionsCount;

  const baseReward = economyConfig?.baseReward ?? 5;
  const passingBonus = economyConfig?.passingBonus ?? 10;
  const perfectBonus = economyConfig?.perfectBonus ?? 5;

  let gemsEarned = baseReward; // Base reward for completing a lesson
  if (isPassed) {
    gemsEarned += passingBonus;
  }
  if (isPerfect) {
    gemsEarned += perfectBonus;
  }

  try {
    // 1. Fetch current stats from the two child tables
    const [progressRes, gameStateRes] = await Promise.all([
      supabase
        .from("profile_progress")
        .select("total_score, lessons_completed, last_lesson_date")
        .eq("profile_id", profileId)
        .single(),
      supabase
        .from("profile_game_state")
        .select("streak, streak_freeze_count, hearts, last_heart_lost_at, gems")
        .eq("profile_id", profileId)
        .single(),
    ]);

    let currentScore = 0;
    let currentLessons = 0;
    let currentStreak = 0;
    let lastLessonDateStr: string | null = null;
    let currentHearts = 5;
    let lastHeartLostAt: string | null = null;
    let currentGems = 50;
    let currentFreezes = 1;

    if (!progressRes.error && progressRes.data) {
      currentScore = progressRes.data.total_score || 0;
      currentLessons = progressRes.data.lessons_completed || 0;
      lastLessonDateStr = progressRes.data.last_lesson_date || null;
    }

    if (!gameStateRes.error && gameStateRes.data) {
      currentStreak = gameStateRes.data.streak || 0;
      currentHearts = gameStateRes.data.hearts !== undefined && gameStateRes.data.hearts !== null ? gameStateRes.data.hearts : 5;
      lastHeartLostAt = gameStateRes.data.last_heart_lost_at || null;
      currentGems = gameStateRes.data.gems !== undefined && gameStateRes.data.gems !== null ? gameStateRes.data.gems : 50;
      currentFreezes = gameStateRes.data.streak_freeze_count !== undefined && gameStateRes.data.streak_freeze_count !== null ? gameStateRes.data.streak_freeze_count : 1;
    }

    const todayStr = new Date().toLocaleDateString("en-CA"); // "YYYY-MM-DD"
    const isGuest = profileId.startsWith("guest_");
    let newStreak = currentStreak;
    let finalFreezes = currentFreezes;

    if (lastLessonDateStr) {
      const [y1, m1, d1] = todayStr.split("-").map(Number);
      const [y2, m2, d2] = lastLessonDateStr.split("-").map(Number);
      const todayDate = new Date(y1, m1 - 1, d1);
      const lastDate = new Date(y2, m2 - 1, d2);
      const diffTime = todayDate.getTime() - lastDate.getTime();
      const diffDays = Math.round(diffTime / (1000 * 60 * 60 * 24));

      if (diffDays === 1) {
        newStreak = currentStreak + 1;
      } else if (diffDays === 0) {
        newStreak = currentStreak === 0 ? 1 : currentStreak;
      } else if (diffDays > 1) {
        if (currentFreezes > 0) {
          finalFreezes = currentFreezes - 1;
          newStreak = currentStreak + 1;
          if (typeof window !== "undefined") {
            localStorage.setItem("streak_freeze_count", finalFreezes.toString());
          }
        } else {
          newStreak = 1;
        }
      }
    } else {
      newStreak = 1;
    }

    streakIncreased = newStreak > currentStreak;
    finalStreakVal = newStreak;

    // 7-day streak milestone check
    if (newStreak > 0 && newStreak % 7 === 0 && (lastLessonDateStr !== todayStr)) {
      gemsEarned += 50;
    }

    const newScore = currentScore + xpEarned;
    const newLessons = currentLessons + 1;

    let finalHearts = heartsRemaining !== undefined ? heartsRemaining : currentHearts;
    let finalLastHeartLostAt = lastHeartLostAt;

    if (heartsRemaining !== undefined) {
      if (heartsRemaining < 5) {
        if (!lastHeartLostAt) {
          finalLastHeartLostAt = new Date().toISOString();
        }
      } else {
        finalLastHeartLostAt = null;
      }
    }

    // 2. Update profile_progress
    const { error: progressError } = await supabase
      .from("profile_progress")
      .update({
        total_score: newScore,
        lessons_completed: newLessons,
        last_lesson_date: todayStr,
      })
      .eq("profile_id", profileId);

    if (progressError) {
      console.error("Failed to update profile_progress:", progressError);
    }

    // 3. Update profile_game_state
    const { error: gameError } = await supabase
      .from("profile_game_state")
      .update({
        streak: newStreak,
        hearts: finalHearts,
        last_heart_lost_at: finalLastHeartLostAt,
        gems: currentGems + gemsEarned,
        streak_freeze_count: finalFreezes,
      })
      .eq("profile_id", profileId);

    if (gameError) {
      console.error("Failed to update profile_game_state:", gameError);
    }

    if (!progressError && !gameError) {
      if (typeof window !== "undefined") {
        localStorage.setItem("last_lesson_completed_date", todayStr);
      }

      // Write a lesson_events audit record
      await supabase.from("lesson_events").insert({
        profile_id: profileId,
        event_type: "lesson_completed",
        score_delta: xpEarned,
        level_delta: 0,
      });
    }
  } catch (err) {
    console.error("Error in updateProfileStats:", err);
  }

  return { xpEarned, gemsEarned, streakIncreased, newStreak: finalStreakVal };
}

/**
 * Refills hearts to 5 for a profile, deducting 50 Gems.
 */
export async function refillHeartsInDb(profileId: string): Promise<{ success: boolean; error?: string }> {
  try {
    const { data, error } = await supabase
      .from("profile_game_state")
      .select("gems")
      .eq("profile_id", profileId)
      .single();

    if (error || !data) {
      return { success: false, error: error?.message || "Profile not found" };
    }

    const currentGems = data.gems !== undefined && data.gems !== null ? data.gems : 50;
    if (currentGems < 50) {
      return { success: false, error: "Not enough gems" };
    }
    const newGems = Math.max(0, currentGems - 50);

    const { error: updateError } = await supabase
      .from("profile_game_state")
      .update({
        gems: newGems,
        hearts: 5,
        last_heart_lost_at: null,
      })
      .eq("profile_id", profileId);

    if (updateError) {
      return { success: false, error: updateError.message };
    }

    return { success: true };
  } catch (err: any) {
    return { success: false, error: err.message || "An unexpected error occurred" };
  }
}
