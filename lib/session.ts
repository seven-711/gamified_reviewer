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
  totalQuestions?: number
): Promise<{ xpEarned: number; gemsEarned: number }> {
  // Calculate XP using the cumulative formula:
  const totalSeconds = timerDurationMinutes * 60;
  const baseScoreXp = correctAnswers * 15;
  const speedFactor = totalSeconds > 0 ? (timeLeft / totalSeconds) : 0;
  const speedBonus = Math.floor(speedFactor * timerDurationMinutes * 8);
  const durationBaseXp = timerDurationMinutes * 5;
  const xpEarned = baseScoreXp + speedBonus + durationBaseXp;

  // Calculate Gems using the new rewards schedule
  const questionsCount = totalQuestions || 10;
  const isPassed = (correctAnswers / questionsCount) >= 0.8;
  const isPerfect = correctAnswers === questionsCount;

  let gemsEarned = 5; // Base reward for completing a lesson
  if (isPassed) {
    gemsEarned += 10;
  }
  if (isPerfect) {
    gemsEarned += 5;
  }

  try {
    // 1. Fetch current stats (including the new streak and heart/gems columns)
    const { data, error } = await supabase
      .from("profiles")
      .select("total_score, lessons_completed, streak, last_lesson_date, hearts, last_heart_lost_at, gems")
      .eq("id", profileId)
      .single();

    let currentScore = 0;
    let currentLessons = 0;
    let currentStreak = 0;
    let lastLessonDateStr: string | null = null;
    let currentHearts = 5;
    let lastHeartLostAt: string | null = null;
    let currentGems = 50;

    if (!error && data) {
      currentScore = data.total_score || 0;
      currentLessons = data.lessons_completed || 0;
      currentStreak = data.streak || 0;
      lastLessonDateStr = data.last_lesson_date || null;
      currentHearts = data.hearts !== undefined && data.hearts !== null ? data.hearts : 5;
      lastHeartLostAt = data.last_heart_lost_at || null;
      currentGems = data.gems !== undefined && data.gems !== null ? data.gems : 50;
    }

    const todayStr = new Date().toLocaleDateString("en-CA"); // "YYYY-MM-DD"
    let newStreak = currentStreak;

    if (lastLessonDateStr) {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const lastDate = new Date(lastLessonDateStr + "T00:00:00");
      const diffTime = today.getTime() - lastDate.getTime();
      const diffDays = Math.round(diffTime / (1000 * 60 * 60 * 24));

      if (diffDays === 1) {
        // First completion of the new day increments the streak
        newStreak = currentStreak + 1;
      } else if (diffDays > 1) {
        // Missed days reset the streak
        newStreak = 1;
      } else if (diffDays === 0) {
        // Already completed a lesson today, keep streak the same
        newStreak = currentStreak === 0 ? 1 : currentStreak;
      }
    } else {
      // First completed lesson
      newStreak = 1;
    }

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

    // 2. Update stats back to database
    const { error: updateError } = await supabase
      .from("profiles")
      .update({
        total_score: newScore,
        lessons_completed: newLessons,
        streak: newStreak,
        last_lesson_date: todayStr,
        hearts: finalHearts,
        last_heart_lost_at: finalLastHeartLostAt,
        gems: currentGems + gemsEarned
      })
      .eq("id", profileId);

    if (updateError) {
      console.error("Failed to update profile stats in database:", updateError);
    } else {
      // Sync to local storage
      if (typeof window !== "undefined") {
        localStorage.setItem("last_lesson_completed_date", todayStr);
      }
    }
  } catch (err) {
    console.error("Error in updateProfileStats:", err);
  }

  return { xpEarned, gemsEarned };
}

/**
 * Refills hearts to 5 for a profile, deducting 50 Gems from their gems column.
 */
export async function refillHeartsInDb(profileId: string): Promise<{ success: boolean; error?: string }> {
  try {
    const { data, error } = await supabase
      .from("profiles")
      .select("gems")
      .eq("id", profileId)
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
      .from("profiles")
      .update({
        gems: newGems,
        hearts: 5,
        last_heart_lost_at: null
      })
      .eq("id", profileId);

    if (updateError) {
      return { success: false, error: updateError.message };
    }

    return { success: true };
  } catch (err: any) {
    return { success: false, error: err.message || "An unexpected error occurred" };
  }
}
