"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { supabase } from "@/lib/supabase";
import { useUser, UserButton, SignOutButton } from "@clerk/nextjs";
import { StreakAsset } from "@/components/ui/StreakAsset";
import { fetchFullProfile } from "@/lib/session";
import { getProfileCache, setProfileCache } from "@/lib/profileCache";
import dynamic from "next/dynamic";

const DotLottiePlayer = dynamic(
  () => import("@dotlottie/react-player").then((mod) => mod.DotLottiePlayer),
  { ssr: false }
);

interface UserProfile {
  id: string;
  email: string;
  exam_category: string;
  sub_topic?: string;
  study_style: string;
  difficulty: string;
  total_score: number;
  streak: number;
  timer_duration?: number;
  lessons_completed?: number;
  last_lesson_date?: string | null;
}

interface LeagueInfo {
  name: string;
  image: string;
}

export function getLeagueInfo(xp: number, lessonsCompleted: number, rank: number): LeagueInfo {
  if (xp >= 8000 && rank === 1) {
    return {
      name: "Legend League",
      image: "/img/gen_imgs/league_/legend_league.webp",
    };
  }
  if (xp >= 6000 && rank <= 3) {
    return {
      name: "Champion League",
      image: "/img/gen_imgs/league_/champion league.webp",
    };
  }
  if (xp >= 4000 && rank <= 3) {
    return {
      name: "Master League",
      image: "/img/gen_imgs/league_/master_league.webp",
    };
  }
  if (xp >= 2500 && rank <= 5) {
    return {
      name: "Diamond League",
      image: "/img/gen_imgs/league_/diamond_league.webp",
    };
  }
  if (xp >= 1500 && rank <= 7) {
    return {
      name: "Crystal League",
      image: "/img/gen_imgs/league_/crystal_league.webp",
    };
  }
  if (xp >= 800 && rank <= 10) {
    return {
      name: "Gold League",
      image: "/img/gen_imgs/league_/gold_league.webp",
    };
  }
  if (xp >= 300 || lessonsCompleted >= 5) {
    return {
      name: "Silver League",
      image: "/img/gen_imgs/league_/silver_league.webp",
    };
  }
  return {
    name: "Bronze League",
    image: "/img/gen_imgs/league_/bronze_league.webp",
  };
}

export function getPerformanceBadge(percentile: number): string {
  if (percentile <= 1) return "/img/gen_imgs/performance_percentile_badge/legend.webp";
  if (percentile <= 10) return "/img/gen_imgs/performance_percentile_badge/master.webp";
  if (percentile <= 25) return "/img/gen_imgs/performance_percentile_badge/elite.webp";
  if (percentile <= 50) return "/img/gen_imgs/performance_percentile_badge/skilled.webp";
  if (percentile <= 75) return "/img/gen_imgs/performance_percentile_badge/rising_.webp";
  return "/img/gen_imgs/performance_percentile_badge/participant.webp";
}

interface MonthlyBadge {
  monthIndex: number;
  monthName: string;
  badgeName: string;
  description: string;
  image: string;
  target: number;
}

const MONTHLY_BADGES: MonthlyBadge[] = [
  {
    monthIndex: 0,
    monthName: "January",
    badgeName: "Fresh Start",
    description: "Complete at least one lesson during January.",
    image: "/img/gen_imgs/monthly_badge/january.webp",
    target: 1,
  },
  {
    monthIndex: 1,
    monthName: "February",
    badgeName: "Steady Heart",
    description: "Stay consistent throughout February.",
    image: "/img/gen_imgs/monthly_badge/february.webp",
    target: 3,
  },
  {
    monthIndex: 2,
    monthName: "March",
    badgeName: "Spring Scholar",
    description: "Continue your learning journey in March.",
    image: "/img/gen_imgs/monthly_badge/march.webp",
    target: 1,
  },
  {
    monthIndex: 3,
    monthName: "April",
    badgeName: "Blooming Mind",
    description: "Complete your monthly learning goal.",
    image: "/img/gen_imgs/monthly_badge/april.webp",
    target: 5,
  },
  {
    monthIndex: 4,
    monthName: "May",
    badgeName: "Knowledge Blossom",
    description: "Keep your streak alive throughout May.",
    image: "/img/gen_imgs/monthly_badge/may.webp",
    target: 3,
  },
  {
    monthIndex: 5,
    monthName: "June",
    badgeName: "Midyear Momentum",
    description: "Reach your June activity target.",
    image: "/img/gen_imgs/monthly_badge/june.webp",
    target: 4,
  },
  {
    monthIndex: 6,
    monthName: "July",
    badgeName: "Summer Sprint",
    description: "Stay active during July.",
    image: "/img/gen_imgs/monthly_badge/july.webp",
    target: 2,
  },
  {
    monthIndex: 7,
    monthName: "August",
    badgeName: "Back to Learning",
    description: "Return stronger and complete August challenges.",
    image: "/img/gen_imgs/monthly_badge/august.webp",
    target: 3,
  },
  {
    monthIndex: 8,
    monthName: "September",
    badgeName: "Peak Performer",
    description: "Finish your September goals.",
    image: "/img/gen_imgs/monthly_badge/september_.webp",
    target: 5,
  },
  {
    monthIndex: 9,
    monthName: "October",
    badgeName: "Master Explorer",
    description: "Continue exploring new lessons.",
    image: "/img/gen_imgs/monthly_badge/october.webp",
    target: 3,
  },
  {
    monthIndex: 10,
    monthName: "November",
    badgeName: "Wisdom Harvest",
    description: "Collect your November learning rewards.",
    image: "/img/gen_imgs/monthly_badge/november.webp",
    target: 3,
  },
  {
    monthIndex: 11,
    monthName: "December",
    badgeName: "Year-End Champion",
    description: "Finish the year with consistent learning.",
    image: "/img/gen_imgs/monthly_badge/december.webp",
    target: 5,
  },
];

export default function ProfilePage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [timerDuration, setTimerDuration] = useState<number>(5);
  const [savingTimer, setSavingTimer] = useState(false);
  const [rank, setRank] = useState<number>(1);
  const [totalUsers, setTotalUsers] = useState<number>(1);
  const [lessonEvents, setLessonEvents] = useState<{ created_at: string }[]>([]);
  const [followingCount, setFollowingCount] = useState(0);
  const [followersCount, setFollowersCount] = useState(0);

  const { user, isLoaded, isSignedIn } = useUser();

  const loadData = useCallback(async (bypassCache = false) => {
    if (!isLoaded) return;
    if (!isSignedIn || !user) {
      const saved = localStorage.getItem("timer_duration");
      if (saved) {
        setTimerDuration(parseInt(saved, 10));
      }
      setLoading(false);
      return;
    }

    const currentUserId = user ? user.id : (typeof window !== "undefined" ? localStorage.getItem("guest_session_id") : null);
    let hasLoadedFromCache = false;
    if (currentUserId && !bypassCache) {
      const cache = getProfileCache(currentUserId);
      if (cache) {
        setProfile(cache.profile);
        setRank(cache.rank);
        setTotalUsers(cache.totalUsers);
        setFollowingCount(cache.followingCount);
        setFollowersCount(cache.followersCount);
        if (cache.viewedUserEvents) setLessonEvents(cache.viewedUserEvents);
        setLoading(false);
        hasLoadedFromCache = true;
      }
    }

    try {
      const userProfile = await fetchFullProfile(user.id);

      if (!userProfile) {
        router.replace("/onboarding");
        return;
      }

      const freshProfile = userProfile as UserProfile;
      setProfile(freshProfile);
      
      if (userProfile.timer_duration) {
        setTimerDuration(userProfile.timer_duration);
        localStorage.setItem("timer_duration", userProfile.timer_duration.toString());
      } else {
        const saved = localStorage.getItem("timer_duration");
        if (saved) {
          setTimerDuration(parseInt(saved, 10));
        }
      }

      // Fetch rank and total users count
      let freshRank = 1;
      let freshTotalUsers = 1;
      try {
        const [{ count: rankCount }, { count: totalCount }] = await Promise.all([
          supabase
            .from("profile_progress")
            .select("*", { count: "exact", head: true })
            .gt("total_score", userProfile.total_score || 0),
          supabase
            .from("profile_progress")
            .select("*", { count: "exact", head: true })
        ]);
        freshRank = (rankCount || 0) + 1;
        freshTotalUsers = totalCount || 1;
        setRank(freshRank);
        setTotalUsers(freshTotalUsers);
      } catch (e) {
        console.error("Failed to fetch rank or total users count", e);
      }

      // Fetch completed lesson events
      let freshLessonEvents: any[] = [];
      try {
        const { data: eventsData, error: eventsError } = await supabase
          .from("lesson_events")
          .select("created_at")
          .eq("profile_id", user.id)
          .eq("event_type", "lesson_completed");

        if (!eventsError && eventsData) {
          freshLessonEvents = eventsData || [];
          setLessonEvents(freshLessonEvents);
        }
      } catch (e) {
        console.error("Failed to fetch lesson events", e);
      }

      // Fetch following and followers count
      let freshFollowingCount = 0;
      let freshFollowersCount = 0;
      try {
        if (currentUserId) {
          const [followingRes, followersRes] = await Promise.all([
            supabase
              .from("lesson_events")
              .select("id", { count: "exact", head: true })
              .eq("profile_id", currentUserId)
              .like("event_type", "claimed_achievement_follow:%"),
            supabase
              .from("lesson_events")
              .select("id", { count: "exact", head: true })
              .eq("event_type", `claimed_achievement_follow:${currentUserId}`),
          ]);
          freshFollowingCount = followingRes.count || 0;
          freshFollowersCount = followersRes.count || 0;
          setFollowingCount(freshFollowingCount);
          setFollowersCount(freshFollowersCount);
        }
      } catch (e) {
        console.error("Failed to fetch own follows count", e);
      }

      // Save to cache
      if (currentUserId) {
        setProfileCache(currentUserId, {
          profile: freshProfile,
          rank: freshRank,
          totalUsers: freshTotalUsers,
          followingCount: freshFollowingCount,
          followersCount: freshFollowersCount,
          viewedUserEvents: freshLessonEvents
        });
      }

      setLoading(false);
    } catch (err) {
      console.error("Profile load failed", err);
      if (!hasLoadedFromCache) {
        router.replace("/login");
      }
    }
  }, [router, user, isLoaded, isSignedIn]);

  useEffect(() => {
    loadData(false);

    const handleUpdate = () => {
      loadData(true);
    };
    window.addEventListener("reviewer-db-update", handleUpdate);
    return () => {
      window.removeEventListener("reviewer-db-update", handleUpdate);
    };
  }, [loadData]);

  const handleTimerChange = async (e: React.ChangeEvent<HTMLSelectElement>) => {
    const value = parseInt(e.target.value, 10);
    setTimerDuration(value);
    localStorage.setItem("timer_duration", value.toString());

    if (isSignedIn && user) {
      setSavingTimer(true);
      try {
        await supabase
          .from("profile_study_settings")
          .update({ timer_duration: value })
          .eq("profile_id", user.id);
      } catch (err) {
        console.error("Failed to update profile timer duration in DB", err);
      } finally {
        setSavingTimer(false);
      }
    }
  };

  if (isLoaded && (!isSignedIn || !user)) {
    return (
      <main className="flex-1 w-full max-w-[600px] mx-auto pb-24 pt-12 flex flex-col items-center text-center px-6">
        <div className="w-52 h-52 relative mb-6 opacity-80">
          <Image src="/emoji/profile.webp" alt="Profile" fill className="object-contain" unoptimized />
        </div>
        <h2 className="font-feather text-3xl font-bold text-duo-green mb-4">Create a Profile!</h2>
        <p className="text-silver font-din-rou1nd text-[17px] mb-8 max-w-[400px]">Sign up to track your streak, earn XP, and compete on the leaderboards.</p>
        <button onClick={() => router.push("/signup")} className="bg-duo-green text-white font-bold px-8 py-4 rounded-2xl hover:brightness-110 transition-colors shadow-[0_4px_0_#3f8f01] active:shadow-[0_0px_0_#3f8f01] active:translate-y-1 uppercase tracking-widest text-body w-full max-w-[300px]">
          Sign Up Now
        </button>
      </main>
    );
  }

  const currentMonthIndex = new Date().getMonth();
  const currentYear = new Date().getFullYear();
  const currentBadge = MONTHLY_BADGES[currentMonthIndex];
  const currentMonthLessons = lessonEvents.filter((event) => {
    const d = new Date(event.created_at);
    return d.getMonth() === currentMonthIndex && d.getFullYear() === currentYear;
  });
  const currentMonthCount = currentMonthLessons.length;
  const isBadgeAchieved = currentMonthCount >= currentBadge.target;

  // Compute achievements
  const xp = profile?.total_score || 0;
  const lessonsCompleted = profile?.lessons_completed || 0;
  const streak = profile?.streak || 0;
  const level = Math.floor(xp / 150) + 1;

  const kbCompleted = lessonsCompleted >= 1;
  const boCompleted = level >= 5;
  const fvCompleted = lessonsCompleted >= 1;
  const ceCompleted = lessonsCompleted >= 1;
  const kmCompleted = xp >= 100;
  const guardianProgress = [kbCompleted, boCompleted, fvCompleted, ceCompleted, kmCompleted].filter(Boolean).length;

  const rawAchievements = [
    {
      id: "knowledge_brew",
      name: "Knowledge Brew",
      condition: "Complete your first lesson.",
      icon: "/img/gen_imgs/achievements/blue_potion.webp",
      target: 1,
      current: lessonsCompleted >= 1 ? 1 : 0,
    },
    {
      id: "blast_off",
      name: "Blast Off!",
      condition: "Reach Level 5.",
      icon: "/img/gen_imgs/achievements/rocket.webp",
      target: 5,
      current: Math.min(5, level),
    },
    {
      id: "rainbow_mind",
      name: "Rainbow Mind",
      condition: "Study 7 consecutive days.",
      icon: "/img/gen_imgs/achievements/rainbow.webp",
      target: 7,
      current: Math.min(7, streak),
    },
    {
      id: "jack_of_all_topics",
      name: "Jack of All Topics",
      condition: "Complete lessons from every subject.",
      icon: "/img/gen_imgs/achievements/dice.webp",
      target: 3,
      current: Math.min(3, lessonsCompleted),
    },
    {
      id: "first_victory",
      name: "First Victory",
      condition: "Pass your first quiz.",
      icon: "/img/gen_imgs/achievements/gold_shield.webp",
      target: 1,
      current: lessonsCompleted >= 1 ? 1 : 0,
    },
    {
      id: "curious_explorer",
      name: "Curious Explorer",
      condition: "View all learning materials in one lesson.",
      icon: "/img/gen_imgs/achievements/magnifying_glass.webp",
      target: 1,
      current: lessonsCompleted >= 1 ? 1 : 0,
    },
    {
      id: "heart_of_determination",
      name: "Heart of Determination",
      condition: "Finish a difficult challenge.",
      icon: "/img/gen_imgs/achievements/crystal_potion.webp",
      target: 1,
      current: lessonsCompleted >= 2 ? 1 : 0,
    },
    {
      id: "knowledge_magnet",
      name: "Knowledge Magnet",
      condition: "Collect 100 Learning Points (LP).",
      icon: "/img/gen_imgs/achievements/magnet.webp",
      target: 100,
      current: Math.min(100, xp),
    },
    {
      id: "growth_spiral",
      name: "Growth Spiral",
      condition: "Level up 10 times.",
      icon: "/img/gen_imgs/achievements/green_spiral.webp",
      target: 10,
      current: Math.min(10, Math.max(0, level - 1)),
    },
    {
      id: "star_student",
      name: "Star Student",
      condition: "Earn a perfect score on any quiz.",
      icon: "/img/gen_imgs/achievements/gold_star.webp",
      target: 1,
      current: lessonsCompleted >= 1 ? 1 : 0,
    },
    {
      id: "quick_learner",
      name: "Quick Learner",
      condition: "Finish a lesson within the target time.",
      icon: "/img/gen_imgs/achievements/boots.webp",
      target: 1,
      current: lessonsCompleted >= 1 ? 1 : 0,
    },
    {
      id: "guardian_scholar",
      name: "Guardian Scholar",
      condition: "Complete all beginner achievements.",
      icon: "/img/gen_imgs/achievements/blue_shield.webp",
      target: 5,
      current: guardianProgress,
    },
  ];

  const userAchievements = rawAchievements
    .map((ach) => ({
      ...ach,
      isCompleted: ach.current >= ach.target,
    }))
    .sort((a, b) => {
      // Completed achievements first
      if (a.isCompleted && !b.isCompleted) return -1;
      if (!a.isCompleted && b.isCompleted) return 1;
      return 0;
    })
    .slice(0, 4);

  return (
    <>
      <main className="flex-1 w-full max-w-[600px] mx-auto pb-16 pt-2 font-din-round">

        {/* Top Header Row: Name & Action Buttons */}
        <div className="flex items-center justify-between gap-4 mb-4">
          <h1 className="font-feather text-2xl sm:text-3xl font-black text-white tracking-wide truncate max-w-[200px] sm:max-w-none">
            {user?.fullName || "Learner"}
          </h1>
          <div className="flex items-center gap-3 shrink-0">
            <button className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-white transition-colors cursor-pointer select-none" title="Share Profile">
              <span className="text-lg">📤</span>
            </button>
            <button
              onClick={() => router.push("/onboarding?edit=true")}
              className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-white transition-colors cursor-pointer select-none"
              title="Settings"
            >
              <span className="text-lg">⚙️</span>
            </button>
          </div>
        </div>

        {/* Profile Banner (Stretches to edges of viewport) */}
        <div className="relative w-[calc(100%+2rem)] -mx-4 md:w-[calc(100%+3rem)] md:-mx-6 h-[200px] sm:h-[240px] bg-gradient-to-tr from-[#fecdd3] to-[#fda4af] flex items-center justify-center overflow-hidden mb-6 shadow-sm border-b-2 border-cloud-gray/20">
          {/* Avatar (Large, centered) */}
          <div className="w-28 h-28 sm:w-36 sm:h-36 rounded-full overflow-hidden border-4 border-white shadow-xl relative bg-white shrink-0 hover:scale-105 transition-transform duration-300">
            {(!isLoaded || !user) ? (
              <div className="w-full h-full bg-cloud-gray/20 animate-pulse rounded-full" />
            ) : (
              <img
                src={(user && user.imageUrl) ? user.imageUrl : "/emoji/profile.webp"}
                alt="Avatar"
                className={`object-cover w-full h-full rounded-full ${(!user || !user.imageUrl) ? "scale-[1.7] translate-y-1" : ""}`}
              />
            )}
          </div>
        </div>

        {/* User Info & Details */}
        <div className="flex flex-col w-full">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex flex-col min-w-0">
              <p className="text-silver font-semibold text-xs sm:text-sm truncate">
                @{user?.primaryEmailAddress?.emailAddress.split("@")[0] || "learner"} • Joined {new Date(user?.createdAt || Date.now()).getFullYear()}
              </p>
            </div>

            <div className="self-start sm:self-auto shrink-0">
              <SignOutButton>
                <button className="flex items-center gap-1.5 border-2 border-red-500/30 hover:border-red-500/50 hover:bg-red-500/10 px-3 py-1.5 rounded-xl transition-all cursor-pointer">
                  <span className="text-red-500 font-extrabold uppercase tracking-widest text-[10px] select-none">
                    Sign Out
                  </span>
                </button>
              </SignOutButton>
            </div>
          </div>

          {/* Details Grid: Course, Following, Followers */}
          <div className="flex items-center justify-around w-full mt-6 py-4 border-t border-b border-cloud-gray/15">
            <div className="flex flex-col items-center">
              <span className="text-base sm:text-lg font-bold text-white flex items-center gap-1.5 select-none">
                <svg viewBox="0 0 120 60" className="w-5 h-3.5 object-contain rounded-xs shadow-xs border border-white/10 select-none shrink-0 inline-block align-middle">
                <rect width="120" height="30" fill="#0038A8" />
                <rect y="30" width="120" height="30" fill="#CE1126" />
                <polygon points="0,0 51.96,30 0,60" fill="#FFFFFF" />
                {/* Sun */}
                <circle cx="17.32" cy="30" r="5.5" fill="#FCD116" />
                {/* Stars */}
                <polygon points="5,7 6,9 8,9 6.5,10 7,12 5,11 3,12 3.5,10 2,9 4,9" fill="#FCD116" />
                <polygon points="5,47 6,49 8,49 6.5,50 7,52 5,51 3,52 3.5,50 2,49 4,49" fill="#FCD116" />
                <polygon points="45,27 46,29 48,29 46.5,30 47,32 45,31 43,32 43.5,30 42,29 44,29" fill="#FCD116" />
              </svg>
                <span className="bg-sky-blue/20 text-sky-blue text-[10px] font-black px-1.5 py-0.5 rounded uppercase">
                  {profile?.exam_category.split(" ")[0] || "CSE"}
                </span>
              </span>
              <span className="text-silver font-extrabold text-[10px] uppercase tracking-wider mt-1">Courses</span>
            </div>

            <div 
              onClick={() => router.push(`/profile/${profile?.id || user?.id}/following`)}
              className="flex flex-col items-center cursor-pointer hover:bg-white/5 p-2 px-3 rounded-2xl transition-all select-none"
            >
              <span className="text-base sm:text-lg font-black text-white">{followingCount}</span>
              <span className="text-silver font-extrabold text-[10px] uppercase tracking-wider mt-1">Following</span>
            </div>

            <div 
              onClick={() => router.push(`/profile/${profile?.id || user?.id}/followers`)}
              className="flex flex-col items-center cursor-pointer hover:bg-white/5 p-2 px-3 rounded-2xl transition-all select-none"
            >
              <span className="text-base sm:text-lg font-black text-white">{followersCount}</span>
              <span className="text-silver font-extrabold text-[10px] uppercase tracking-wider mt-1">Followers</span>
            </div>
          </div>

          {/* Add Friends Button */}
          <button 
            onClick={() => router.push("/leaderboard")}
            className="w-full mt-5 bg-transparent hover:bg-white/5 border-2 border-cloud-gray hover:border-white text-white font-extrabold py-3 rounded-2xl transition-all uppercase tracking-widest text-xs flex items-center justify-center gap-2 cursor-pointer active:translate-y-0.5"
          >
            Add Friends
          </button>
        </div>

        {/* Overview Section */}
        <div className="w-full mt-10">
          <h2 className="font-feather text-xs font-black tracking-widest text-silver uppercase mb-5 select-none">
            Overview
          </h2>

          <div className="grid grid-cols-2 gap-4">
            {/* Streak */}
            <div className="flex flex-col items-center justify-center p-5 hover:-translate-y-0.5 transition-transform text-center gap-1.5">
              <div className="w-[100px] h-[100px] flex items-center justify-center shrink-0 select-none">
                {(() => {
                  const todayStr = new Date().toLocaleDateString("en-CA");
                  const isStreakActive = !!(profile?.streak && profile.streak > 0 && profile.last_lesson_date === todayStr);
                  const isStreakFrozenOrMissed = !profile?.streak || profile.streak < 1;
                  
                  if (isStreakActive) {
                    return (
                      <DotLottiePlayer
                        src={profile?.streak && profile.streak >= 10 ? "/img/gen_imgs/Streak/Fire.lottie" : "/img/gen_imgs/Streak/Flame - Streak.lottie"}
                        autoplay
                        loop
                        className="w-full h-full object-contain"
                      />
                    );
                  } else if (isStreakFrozenOrMissed) {
                    return (
                      <Image
                        src="/img/gen_imgs/Streak/streak_freeze.webp"
                        alt="Streak Missed"
                        width={90}
                        height={90}
                        className="object-contain"
                      />
                    );
                  } else {
                    return (
                      <Image
                        src="/img/gen_imgs/Streak/off_streak.webp"
                        alt="Streak Unactivated"
                        width={90}
                        height={90}
                        className="object-contain"
                      />
                    );
                  }
                })()}
              </div>
              <span className={`font-black text-2xl ${(() => {
                const todayStr = new Date().toLocaleDateString("en-CA");
                const isStreakActive = !!(profile?.streak && profile.streak > 0 && profile.last_lesson_date === todayStr);
                return isStreakActive ? "text-orange-400 dark:text-orange-500" : "text-gray-400";
              })()}`}>
                {profile?.streak || 0} Days
              </span>
              <span className="text-[11px] font-extrabold text-silver uppercase tracking-wider">
                Daily Streak
              </span>
            </div>

            {/* XP */}
            <div className="flex flex-col items-center justify-center p-5 hover:-translate-y-0.5 transition-transform text-center gap-1.5">
              <Image src="/img/gen_imgs/exp.webp" alt="XP" width={90} height={90} className="object-contain" />
              <span className="font-black text-2xl text-yellow-400">
                {profile?.total_score || 0} XP
              </span>
              <span className="text-[11px] font-extrabold text-silver uppercase tracking-wider">
                Total Score
              </span>
            </div>

            {/* League */}
            <div className="flex flex-col items-center justify-center p-5 hover:-translate-y-0.5 transition-transform text-center gap-1.5">
              <span className="text-2xl w-[90px] h-[90px] flex items-center justify-center select-none">
                <Image 
                  src={getLeagueInfo(profile?.total_score || 0, profile?.lessons_completed || 0, rank).image} 
                  alt="League" 
                  width={90} 
                  height={90} 
                  className="object-contain" 
                />
              </span>
              <span className="font-black text-2xl text-white tracking-wide">
                {getLeagueInfo(profile?.total_score || 0, profile?.lessons_completed || 0, rank).name}
              </span>
              <span className="text-[11px] font-extrabold text-silver uppercase tracking-wider">
                Active League
              </span>
            </div>

            {/* Rank */}
            <div className="flex flex-col items-center justify-center p-5 hover:-translate-y-0.5 transition-transform text-center gap-1.5">
              <span className="text-4xl w-[80px] h-[80px] flex items-center justify-center select-none">
                <Image 
                  src={getPerformanceBadge(Math.max(1, Math.min(100, Math.round((rank / totalUsers) * 100))))} 
                  alt="Rank Badge" 
                  width={70} 
                  height={70} 
                  className="object-contain" 
                />
              </span>
              <span className="font-black text-2xl text-sky-400">
                {rank <= 3 ? `Rank #${rank}` : `Top ${Math.max(1, Math.min(100, Math.round((rank / totalUsers) * 100)))}%`}
              </span>
              <span className="text-[11px] font-extrabold text-silver uppercase tracking-wider">
                Global Standing
              </span>
            </div>
          </div>
        </div>

        {/* Friend Streaks */}
        <div className="w-full mt-10">
          <h2 className="font-feather text-xs font-black tracking-widest text-silver uppercase mb-5 select-none">
            Friend Streaks
          </h2>

          <div className="flex items-center gap-5 overflow-x-auto pb-2">
            {/* Friend 1 */}
            <div className="flex flex-col items-center gap-1.5 shrink-0">
              <div className="w-14 h-14 rounded-full overflow-hidden border-2 border-cloud-gray p-0.5 bg-[#d7ffb8]">
                <img src="/emoji/sorrytoomad.webp" alt="Friend 1" className="w-full h-full object-cover rounded-full" />
              </div>
              <span className="text-[10px] font-extrabold text-silver flex items-center gap-0.5 select-none">
                🔥 157
              </span>
            </div>

            {/* Friend 2 */}
            <div className="flex flex-col items-center gap-1.5 shrink-0">
              <div className="w-14 h-14 rounded-full overflow-hidden border-2 border-cloud-gray p-0.5 bg-[#fecdd3]">
                <img src="/emoji/ohyeah.webp" alt="Friend 2" className="w-full h-full object-cover rounded-full" />
              </div>
              <span className="text-[10px] font-extrabold text-silver flex items-center gap-0.5 select-none">
                🔥 148
              </span>
            </div>

            {/* Empty Slot 1 */}
            <div className="w-14 h-14 rounded-full border-2 border-dashed border-cloud-gray flex items-center justify-center cursor-pointer text-silver hover:border-white transition-colors shrink-0 select-none">
              <span className="text-lg">+</span>
            </div>

            {/* Empty Slot 2 */}
            <div className="w-14 h-14 rounded-full border-2 border-dashed border-cloud-gray flex items-center justify-center cursor-pointer text-silver hover:border-white transition-colors shrink-0 select-none">
              <span className="text-lg">+</span>
            </div>
          </div>
        </div>

        {/* Monthly Badges */}
        <div className="w-full mt-10">
          <div className="flex justify-between items-center mb-5">
            <h2 className="font-feather text-xs font-black tracking-widest text-silver uppercase select-none">
              Monthly Badges
            </h2>
            <span 
              onClick={() => router.push("/profile/achievements?tab=badges")}
              className="text-sky-blue font-bold text-xs uppercase tracking-wider cursor-pointer hover:text-white hover:-translate-y-0.5 transition-all duration-300 select-none"
            >
              View All
            </span>
          </div>

          <div className="border-0 border-cloud-gray rounded-3xl p-5 md:p-6 bg-gradient-to-br from-duo-green-light/10 to-transparent flex flex-col sm:flex-row items-center gap-5 sm:gap-6 relative hover:border-duo-green transition-all duration-300">
            {/* Badge Icon */}
            <div className={`relative w-34 h-34 sm:w-32 sm:h-32 md:w-36 md:h-36 shrink-0 transition-transform hover:scale-105 duration-300 ${!isBadgeAchieved ? "grayscale opacity-40" : "drop-shadow-[0_0_15px_rgba(253,164,175,0.35)] animate-[pulse_4s_infinite]"}`}>
              <Image
                src={currentBadge.image}
                alt={currentBadge.badgeName}
                width={144}
                height={144}
                className="object-contain"
              />
            </div>

            {/* Info details */}
            <div className="flex flex-col items-center sm:items-start text-center sm:text-left flex-1 min-w-0 w-full">
              <div className="flex items-center justify-between w-full gap-2">
                <span className="text-[10px] font-black text-sunshine-yellow tracking-widest uppercase">
                  {currentBadge.monthName} Badge
                </span>
                <span className={`text-[10px] font-black px-2 py-0.5 rounded-full uppercase ${isBadgeAchieved ? "bg-duo-green/20 text-duo-green border border-duo-green/30" : "bg-cloud-gray/20 text-silver border border-cloud-gray/30"}`}>
                  {isBadgeAchieved ? "Achieved" : "In Progress"}
                </span>
              </div>
              <h3 className="font-feather text-lg sm:text-xl text-white font-bold tracking-wide mt-0.5 leading-tight">
                {currentBadge.badgeName}
              </h3>
              <p className="text-silver text-xs sm:text-sm font-semibold mt-1 leading-tight">
                {currentBadge.description}
              </p>

              {/* Progress bar */}
              <div className="mt-3.5 w-full flex items-center gap-3">
                <div className="h-4 flex-1 bg-cloud-gray/20 dark:bg-cloud-gray/10 rounded-full overflow-hidden relative flex items-center justify-center border border-cloud-gray/30">
                  <div
                    className={`absolute left-0 top-0 h-full rounded-full transition-all duration-500 bg-gradient-to-r ${isBadgeAchieved ? "from-[#58cc02] to-[#46a302]" : "from-sky-blue to-sky-blue/80"}`}
                    style={{ width: `${Math.min(100, (currentMonthCount / currentBadge.target) * 100)}%` }}
                  ></div>
                  <span className="relative z-10 text-white font-black text-[9px] sm:text-[10px]">
                    {currentMonthCount} / {currentBadge.target}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Achievements Section */}
        <div className="w-full mt-10">
          <div className="flex justify-between items-center mb-5">
            <h2 className="font-feather text-xs font-black tracking-widest text-silver uppercase select-none">
              Achievements
            </h2>
            <span 
              onClick={() => router.push("/profile/achievements?tab=achievements")}
              className="text-sky-blue font-bold text-xs uppercase tracking-wider cursor-pointer hover:text-white hover:-translate-y-0.5 transition-all select-none"
            >
              View All
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {userAchievements.map((ach) => (
              <div 
                key={ach.id} 
                onClick={() => router.push("/profile/achievements?tab=achievements")}
                className={`flex flex-col items-center gap-2 relative group cursor-pointer ${!ach.isCompleted ? "grayscale opacity-45" : ""}`}
              >
                {ach.isCompleted && (
                  <span className="absolute -top-1.5 bg-duo-green text-white text-[7px] font-black px-1.5 py-0.5 rounded uppercase tracking-wider scale-90 z-10 select-none shadow-sm">
                    Done
                  </span>
                )}
                <div className={`w-35 h-30 rounded-2xl bg-gradient-to-br ${ach.isCompleted ? "from-sunshine-green/10 to-transparent" : "from-cloud-gray/10 to-transparent"} flex items-center justify-center p-2 relative group-hover:scale-105 transition-all`}>
                  <Image src={ach.icon} alt={ach.name} width={106} height={106} className="object-contain" />
                </div>
                <span className={`text-[9px] font-extrabold px-2 py-0.5 rounded-full select-none text-center ${ach.isCompleted ? "text-sunshine-white bg-sunshine-green/15" : "text-silver bg-cloud-gray/20"}`}>
                  {ach.name}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Preferences Section */}
        <div className="w-full mt-10">
          <h2 className="font-feather text-xs font-black tracking-widest text-silver uppercase mb-5 select-none">
            Preferences
          </h2>
          <div className="border-2 border-cloud-gray rounded-3xl p-5 md:p-6 flex flex-col sm:flex-row items-center justify-between gap-6 bg-gradient-to-br from-duo-green-light/10 to-transparent mb-8">
            <div className="flex items-center gap-4 text-left w-full sm:w-auto">
              <div className="text-4xl shrink-0 select-none animate-[pulse_3s_infinite]">⏱️</div>
              <div className="flex flex-col gap-0.5">
                <h3 className="font-bold text-[18px] text-white">Default Timer Duration</h3>
                <p className="text-silver text-xs font-semibold leading-tight">
                  {savingTimer ? "Saving changes..." : "Adjust your practice exam length"}
                </p>
              </div>
            </div>

            <div className="relative w-full sm:w-[180px] shrink-0">
              <select
                value={timerDuration}
                onChange={handleTimerChange}
                disabled={savingTimer}
                className="w-full bg-[#131f24] text-white border-2 border-cloud-gray hover:border-sky-blue rounded-2xl px-4 py-3 font-bold text-sm tracking-wide select-none cursor-pointer focus:outline-none focus:border-sky-blue transition-colors appearance-none shadow-[0_4px_0_var(--color-cloud-gray)] active:translate-y-[2px] active:shadow-[0_2px_0_var(--color-cloud-gray)]"
              >
                <option value={5}>5 Minutes</option>
                <option value={10}>10 Minutes</option>
                <option value={15}>15 Minutes</option>
                <option value={30}>30 Minutes</option>
                <option value={60}>1 Hour</option>
              </select>
              <div className="pointer-events-none absolute inset-y-0 right-4 flex items-center text-silver font-bold text-[10px]">
                ▼
              </div>
            </div>
          </div>
        </div>

      </main>

      {/* Right Sidebar - Friends Widget */}
      <aside className="hidden lg:block w-[368px] shrink-0 pt-6 md:pt-10 font-din-round lg:sticky lg:top-6 lg:self-start lg:h-fit">
        <div className="bg-[#131f24] border-2 border-cloud-gray rounded-3xl p-6 flex flex-col gap-5 shadow-sm hover:border-duo-green transition-colors duration-300 ml-6">
          <h3 className="font-extrabold text-xs md:text-sm text-silver uppercase tracking-wider select-none">Friends</h3>
          <h2 className="font-feather text-2xl text-duo-green font-bold leading-snug">
            Follow friends to compete and celebrate together!
          </h2>
          <button className="bg-duo-green hover:brightness-110 text-white font-bold px-4 py-3.5 rounded-2xl transition-colors shadow-[0_4px_0_#3f8f01] active:shadow-[0_0px_0_#3f8f01] active:translate-y-1 uppercase tracking-widest text-body mt-2 cursor-pointer">
            Find Friends
          </button>
          <div className="w-full flex justify-center mt-4">
            <div className="w-32 h-32 relative animate-[bounce_4s_infinite]">
              <Image src="/emoji/hmm.webp" alt="Friends" fill className="object-contain" unoptimized />
            </div>
          </div>
        </div>
      </aside>
    </>
  );
}
