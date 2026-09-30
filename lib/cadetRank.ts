/**
 * Cadet Rank helper module matching the Database Business Rule Trigger
 * `trg_enforce_cadet_progression_rules` / `fn_trg_enforce_cadet_progression_rules`.
 *
 * XP Milestones enforced by PostgreSQL trigger on profile_progress:
 * - Level 1: 0 - 19,999 XP (Cadet Recruit)
 * - Level 2: 20,000 - 39,999 XP (Junior Cadet)
 * - Level 3: 40,000 - 59,999 XP (Senior Cadet)
 * - Level 4: 60,000 - 79,999 XP (Officer Cadet)
 * - Level 5: 80,000 - 99,999 XP (Master Cadet)
 * - Level 6: 100,000 - 119,999 XP (Lieutenant Cadet)
 * - Level 7+: 120,000+ XP (Captain Cadet)
 */

export interface CadetRankInfo {
  level: number;
  title: string;
  badgeName: string;
  badgeIcon: string;
  minXp: number;
  nextLevelXp: number | null;
  color: string;
  chipClass: string;
}

export function getCadetRankInfo(level: number): CadetRankInfo {
  const safeLevel = Math.max(1, Number(level) || 1);
  switch (safeLevel) {
    case 1:
      return {
        level: 1,
        title: "Cadet Recruit",
        badgeName: "Recruit",
        badgeIcon: "🎖️",
        minXp: 0,
        nextLevelXp: 20000,
        color: "text-amber-600 border-amber-300 bg-amber-50 dark:bg-amber-950/30",
        chipClass: "bg-amber-100 dark:bg-amber-900/30 text-amber-800 dark:text-amber-200 border-amber-300 dark:border-amber-700/50",
      };
    case 2:
      return {
        level: 2,
        title: "Junior Cadet",
        badgeName: "Junior",
        badgeIcon: "🥉",
        minXp: 20000,
        nextLevelXp: 40000,
        color: "text-emerald-600 border-emerald-300 bg-emerald-50 dark:bg-emerald-950/30",
        chipClass: "bg-emerald-100 dark:bg-emerald-900/30 text-emerald-800 dark:text-emerald-200 border-emerald-300 dark:border-emerald-700/50",
      };
    case 3:
      return {
        level: 3,
        title: "Senior Cadet",
        badgeName: "Senior",
        badgeIcon: "🥈",
        minXp: 40000,
        nextLevelXp: 60000,
        color: "text-sky-600 border-sky-300 bg-sky-50 dark:bg-sky-950/30",
        chipClass: "bg-sky-100 dark:bg-sky-900/30 text-sky-800 dark:text-sky-200 border-sky-300 dark:border-sky-700/50",
      };
    case 4:
      return {
        level: 4,
        title: "Officer Cadet",
        badgeName: "Officer",
        badgeIcon: "🥇",
        minXp: 60000,
        nextLevelXp: 80000,
        color: "text-purple-600 border-purple-300 bg-purple-50 dark:bg-purple-950/30",
        chipClass: "bg-purple-100 dark:bg-purple-900/30 text-purple-800 dark:text-purple-200 border-purple-300 dark:border-purple-700/50",
      };
    case 5:
      return {
        level: 5,
        title: "Master Cadet",
        badgeName: "Master",
        badgeIcon: "⭐",
        minXp: 80000,
        nextLevelXp: 100000,
        color: "text-rose-600 border-rose-300 bg-rose-50 dark:bg-rose-950/30",
        chipClass: "bg-rose-100 dark:bg-rose-900/30 text-rose-800 dark:text-rose-200 border-rose-300 dark:border-rose-700/50",
      };
    case 6:
      return {
        level: 6,
        title: "Lieutenant Cadet",
        badgeName: "Lieutenant",
        badgeIcon: "🌟",
        minXp: 100000,
        nextLevelXp: 120000,
        color: "text-indigo-600 border-indigo-300 bg-indigo-50 dark:bg-indigo-950/30",
        chipClass: "bg-indigo-100 dark:bg-indigo-900/30 text-indigo-800 dark:text-indigo-200 border-indigo-300 dark:border-indigo-700/50",
      };
    default: {
      const minXp = (safeLevel - 1) * 20000;
      const nextThreshold = safeLevel * 20000;
      return {
        level: safeLevel,
        title: safeLevel === 7 ? "Captain Cadet" : `Cadet Commander Lvl ${safeLevel}`,
        badgeName: "Captain",
        badgeIcon: "👑",
        minXp,
        nextLevelXp: nextThreshold,
        color: "text-yellow-600 border-yellow-300 bg-yellow-50 dark:bg-yellow-950/30",
        chipClass: "bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-200 border-yellow-300 dark:border-yellow-700/50",
      };
    }
  }
}

export function getLevelFromXp(xp: number): number {
  const safeXp = Math.max(0, Number(xp) || 0);
  return Math.floor(safeXp / 20000) + 1;
}
