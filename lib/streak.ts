export function getStreakImage(streak: number, lastLessonDate?: string | null): string {
  if (streak < 1) {
    return "/img/gen_imgs/Streak/streak_freeze.webp";
  }

  if (lastLessonDate) {
    const todayStr = new Date().toLocaleDateString("en-CA");
    if (lastLessonDate !== todayStr) {
      return "/img/gen_imgs/Streak/off_streak.webp";
    }
  }

  if (streak >= 200) return "/img/gen_imgs/Streak/200_day_streak.webp";
  if (streak >= 150) return "/img/gen_imgs/Streak/150_day_streak.webp";
  if (streak >= 100) return "/img/gen_imgs/Streak/100_day_streak.webp";
  if (streak >= 50) return "/img/gen_imgs/Streak/50_day_streak.webp";
  if (streak >= 30) return "/img/gen_imgs/Streak/30_day_streak.webp";
  if (streak >= 10) return "/img/gen_imgs/Streak/10_day_streak.webp";
  return "/img/gen_imgs/Streak/1-9_day_streak.webm";
}
