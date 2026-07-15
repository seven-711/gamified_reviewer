"use client";

import React, { useState, useEffect, Suspense } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { useUser } from "@clerk/nextjs";
import { supabase } from "@/lib/supabase";
import { fetchFullProfile } from "@/lib/session";
import { getStreakImage } from "@/lib/streak";

interface UserProfile {
  id: string;
  name: string | null;
  exam_category?: string;
  total_score: number;
  streak: number;
  lessons_completed?: number;
  created_at?: string;
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

function getLeagueInfo(xp: number, lessonsCompleted: number, rank: number) {
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

function UserProfileContent({ userId }: { userId: string }) {
  const router = useRouter();
  const { user: currentUser, isLoaded: isCurrentUserLoaded } = useUser();
  
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [rank, setRank] = useState<number>(1);
  const [totalUsers, setTotalUsers] = useState<number>(1);
  
  const [viewedUserEvents, setViewedUserEvents] = useState<{ created_at: string; score_delta: number }[]>([]);
  const [activeUserEvents, setActiveUserEvents] = useState<{ created_at: string; score_delta: number }[]>([]);
  
  const [isFollowing, setIsFollowing] = useState(false);

  // Toggle follow state
  const handleFollowToggle = () => {
    setIsFollowing(!isFollowing);
  };

  useEffect(() => {
    if (!userId) return;

    async function loadData() {
      try {
        const userProfile = await fetchFullProfile(userId);
        if (!userProfile) {
          router.replace("/leaderboard");
          return;
        }

        setProfile(userProfile as UserProfile);

        // Fetch rank and total users count
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
          setRank((rankCount || 0) + 1);
          setTotalUsers(totalCount || 1);
        } catch (e) {
          console.error("Failed to fetch rank or total users count", e);
        }

        // Fetch user lesson events for weekly graph comparisons & badges
        const currentUserId = currentUser ? currentUser.id : localStorage.getItem("guest_session_id");
        
        try {
          const [viewedRes, activeRes] = await Promise.all([
            supabase
              .from("lesson_events")
              .select("created_at, score_delta")
              .eq("profile_id", userId)
              .eq("event_type", "lesson_completed"),
            currentUserId ? supabase
              .from("lesson_events")
              .select("created_at, score_delta")
              .eq("profile_id", currentUserId)
              .eq("event_type", "lesson_completed") : Promise.resolve({ data: [], error: null })
          ]);

          if (!viewedRes.error && viewedRes.data) {
            setViewedUserEvents(viewedRes.data);
          }
          if (!activeRes.error && activeRes.data) {
            setActiveUserEvents(activeRes.data);
          }
        } catch (e) {
          console.error("Failed to fetch lesson events for charts", e);
        }

        setLoading(false);
      } catch (err) {
        console.error("Failed to load public profile details:", err);
        router.replace("/leaderboard");
      }
    }

    if (isCurrentUserLoaded) {
      loadData();
    }
  }, [userId, isCurrentUserLoaded, currentUser, router]);

  if (loading || !profile) {
    return (
      <main className="flex-1 w-full max-w-[600px] mx-auto pb-24 pt-20 flex flex-col items-center justify-center gap-4">
        <div className="w-12 h-12 border-4 border-sky-blue/30 border-t-sky-blue rounded-full animate-spin"></div>
        <span className="text-silver font-bold">Loading profile...</span>
      </main>
    );
  }

  // Calculate stats
  const xp = profile.total_score || 0;
  const lessonsCompleted = profile.lessons_completed || 0;
  const streak = profile.streak || 0;
  const level = Math.floor(xp / 150) + 1;
  const leagueInfo = getLeagueInfo(xp, lessonsCompleted, rank);

  // Compute achievements
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
      icon: "/img/gen_imgs/achievements/blue_potion.webp",
      target: 1,
      current: lessonsCompleted >= 1 ? 1 : 0,
    },
    {
      id: "blast_off",
      name: "Blast Off!",
      icon: "/img/gen_imgs/achievements/rocket.webp",
      target: 5,
      current: Math.min(5, level),
    },
    {
      id: "rainbow_mind",
      name: "Rainbow Mind",
      icon: "/img/gen_imgs/achievements/rainbow.webp",
      target: 7,
      current: Math.min(7, streak),
    },
    {
      id: "jack_of_all_topics",
      name: "Jack of All Topics",
      icon: "/img/gen_imgs/achievements/dice.webp",
      target: 3,
      current: Math.min(3, lessonsCompleted),
    },
    {
      id: "first_victory",
      name: "First Victory",
      icon: "/img/gen_imgs/achievements/gold_shield.webp",
      target: 1,
      current: lessonsCompleted >= 1 ? 1 : 0,
    },
    {
      id: "curious_explorer",
      name: "Curious Explorer",
      icon: "/img/gen_imgs/achievements/magnifying_glass.webp",
      target: 1,
      current: lessonsCompleted >= 1 ? 1 : 0,
    },
    {
      id: "heart_of_determination",
      name: "Heart of Determination",
      icon: "/img/gen_imgs/achievements/crystal_potion.webp",
      target: 1,
      current: lessonsCompleted >= 2 ? 1 : 0,
    },
    {
      id: "knowledge_magnet",
      name: "Knowledge Magnet",
      icon: "/img/gen_imgs/achievements/magnet.webp",
      target: 100,
      current: Math.min(100, xp),
    },
    {
      id: "growth_spiral",
      name: "Growth Spiral",
      icon: "/img/gen_imgs/achievements/green_spiral.webp",
      target: 10,
      current: Math.min(10, Math.max(0, level - 1)),
    },
    {
      id: "star_student",
      name: "Star Student",
      icon: "/img/gen_imgs/achievements/gold_star.webp",
      target: 1,
      current: lessonsCompleted >= 1 ? 1 : 0,
    },
    {
      id: "quick_learner",
      name: "Quick Learner",
      icon: "/img/gen_imgs/achievements/boots.webp",
      target: 1,
      current: lessonsCompleted >= 1 ? 1 : 0,
    },
    {
      id: "guardian_scholar",
      name: "Guardian Scholar",
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
      if (a.isCompleted && !b.isCompleted) return -1;
      if (!a.isCompleted && b.isCompleted) return 1;
      return 0;
    })
    .slice(0, 4);

  // Compute 7 days Weekly XP Progress comparisons
  const weekdayNames = ["S", "M", "T", "W", "T", "F", "S"];
  const days: { label: string; dateStr: string }[] = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    days.push({
      label: weekdayNames[d.getDay()],
      dateStr: d.toLocaleDateString("en-CA"),
    });
  }

  const viewedXpValues = days.map((day) => {
    return viewedUserEvents
      .filter((e) => new Date(e.created_at).toLocaleDateString("en-CA") === day.dateStr)
      .reduce((acc, curr) => acc + (curr.score_delta || 0), 0);
  });

  const activeXpValues = days.map((day) => {
    return activeUserEvents
      .filter((e) => new Date(e.created_at).toLocaleDateString("en-CA") === day.dateStr)
      .reduce((acc, curr) => acc + (curr.score_delta || 0), 0);
  });

  const viewedTotalWeeklyXp = viewedXpValues.reduce((a, b) => a + b, 0);
  const activeTotalWeeklyXp = activeXpValues.reduce((a, b) => a + b, 0);

  // SVG Chart sizing configurations
  const maxVal = Math.max(10, ...viewedXpValues, ...activeXpValues);
  const chartHeight = 100;
  const chartWidth = 420;
  const paddingLeft = 40;
  const paddingTop = 20;

  const getCoordinates = (values: number[]) => {
    return values.map((val, idx) => {
      const x = paddingLeft + idx * (chartWidth / 6);
      const y = paddingTop + chartHeight - (val / maxVal) * chartHeight;
      return { x, y };
    });
  };

  const viewedCoords = getCoordinates(viewedXpValues);
  const activeCoords = getCoordinates(activeXpValues);

  const getLinePath = (coords: { x: number; y: number }[]) => {
    if (coords.length === 0) return "";
    return `M ${coords[0].x} ${coords[0].y} ` + coords.slice(1).map((c) => `L ${c.x} ${c.y}`).join(" ");
  };

  const viewedPath = getLinePath(viewedCoords);
  const activePath = getLinePath(activeCoords);

  return (
    <main className="flex-1 w-full max-w-[600px] mx-auto pb-24 pt-2 font-din-round min-w-0">
      
      {/* Dynamic Header Row */}
      <div className="flex items-center justify-between gap-4 mb-6">
        <button
          onClick={() => router.push("/leaderboard")}
          className="p-2.5 rounded-xl border-0 border-cloud-gray hover:bg-white/5 text-white transition-all cursor-pointer select-none"
          title="Back to Leaderboard"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
            <path d="M19 12H5M12 19l-7-7 7-7" />
          </svg>
        </button>
        
        <h1 className="font-feather text-lg sm:text-xl text-white font-bold tracking-wide truncate max-w-[200px] sm:max-w-none">
          {profile.name || "Learner"}
        </h1>

        <div className="flex items-center gap-2">
          {/* Share icon */}
          <button className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-white transition-colors cursor-pointer select-none" title="Share Profile">
            <span className="text-lg">📤</span>
          </button>
          
          {/* Super Status Badge if Rank is High */}
          {rank <= 5 && (
            <span className="bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 text-white text-[9px] font-black px-2.5 py-1 rounded-md uppercase tracking-wider shadow-md animate-pulse">
              SUPER
            </span>
          )}
        </div>
      </div>

      {/* Profile Card Banner */}
      <div className="relative w-[calc(100%+2rem)] -mx-4 md:w-[calc(100%+3rem)] md:-mx-6 h-[200px] sm:h-[240px] bg-gradient-to-tr from-[#37464f] to-[#202f36] flex items-center justify-center overflow-hidden mb-6 shadow-sm border-b-2 border-cloud-gray/20 rounded-b-3xl">
        <div className="w-28 h-28 sm:w-36 sm:h-36 rounded-full overflow-hidden border-4 border-white shadow-xl relative bg-[#131f24] shrink-0 hover:scale-105 transition-transform duration-300">
          <img
            src="/emoji/profile.webp"
            alt="Avatar"
            className="object-cover w-full h-full rounded-full scale-[1.7] translate-y-1"
          />
        </div>
      </div>

      {/* User Information */}
      <div className="flex flex-col w-full px-1">
        <div className="flex flex-col items-center sm:items-start">
          <p className="text-silver font-semibold text-xs sm:text-sm">
            @{profile.name?.toLowerCase().replace(/\s+/g, "") || "learner"} • Joined {profile.created_at ? new Date(profile.created_at).getFullYear() : new Date().getFullYear()}
          </p>
        </div>

        {/* Stats Row */}
        <div className="flex items-center justify-around w-full mt-6 py-4 border-t border-b border-cloud-gray/15">
          <div className="flex flex-col items-center">
            <span className="text-base sm:text-lg font-bold text-white flex items-center gap-1.5 select-none">
              <span>🇵🇭</span>
              <span className="bg-sky-blue/20 text-sky-blue text-[10px] font-black px-1.5 py-0.5 rounded uppercase">
                {profile.exam_category?.split(" ")[0] || "CSE"}
              </span>
            </span>
            <span className="text-silver font-extrabold text-[10px] uppercase tracking-wider mt-1">Courses</span>
          </div>

          <div className="flex flex-col items-center">
            <span className="text-base sm:text-lg font-black text-white select-none">5</span>
            <span className="text-silver font-extrabold text-[10px] uppercase tracking-wider mt-1">Following</span>
          </div>

          <div className="flex flex-col items-center">
            <span className="text-base sm:text-lg font-black text-white select-none">7</span>
            <span className="text-silver font-extrabold text-[10px] uppercase tracking-wider mt-1">Followers</span>
          </div>
        </div>

        {/* Dynamic Follow Button */}
        <button
          onClick={handleFollowToggle}
          className={`w-full mt-5 font-extrabold py-3.5 rounded-2xl transition-all uppercase tracking-widest text-xs flex items-center justify-center gap-2 cursor-pointer border-2 active:translate-y-0.5 ${
            isFollowing
              ? "bg-transparent border-cloud-gray text-silver hover:text-white hover:border-white"
              : "bg-duo-green border-duo-green text-white shadow-[0_4px_0_#3f8f01] hover:brightness-105"
          }`}
        >
          {isFollowing ? "✓ Following" : "➕ Follow"}
        </button>
      </div>

      {/* Section: Weekly Progress Graph */}
      <div className="w-full mt-10">
        <h2 className="font-feather text-xs font-black tracking-widest text-silver uppercase mb-5 select-none">
          Weekly Progress
        </h2>

        <div className="border-2 border-cloud-gray rounded-3xl p-5 md:p-6 bg-gradient-to-br from-duo-green-light/5 to-transparent flex flex-col gap-6 relative">
          
          {/* Custom SVG Line Chart */}
          <div className="w-full relative h-[150px]">
            <svg width="100%" height="100%" viewBox="0 0 480 150" className="overflow-visible">
              {/* Grid Lines */}
              {[0, 0.25, 0.5, 0.75, 1].map((ratio, i) => {
                const y = paddingTop + ratio * chartHeight;
                const value = Math.round(maxVal - ratio * maxVal);
                return (
                  <g key={i} className="opacity-15">
                    <line x1={paddingLeft} y1={y} x2={paddingLeft + chartWidth} y2={y} stroke="white" strokeWidth="1" strokeDasharray="4 4" />
                    <text x={paddingLeft - 10} y={y + 4} fill="white" fontSize="10" textAnchor="end" className="font-bold">{value}</text>
                  </g>
                );
              })}

              {/* Viewed User path line */}
              {viewedPath && (
                <>
                  <path d={viewedPath} fill="none" stroke="#1cb0f6" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
                  {viewedCoords.map((c, i) => (
                    <circle key={i} cx={c.x} cy={c.y} r="5" fill="#1cb0f6" stroke="#131f24" strokeWidth="2.5" className="hover:scale-125 transition-transform cursor-pointer" />
                  ))}
                </>
              )}

              {/* Active User (You) path line */}
              {activePath && (
                <>
                  <path d={activePath} fill="none" stroke="#77858c" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="opacity-55" />
                  {activeCoords.map((c, i) => (
                    <circle key={i} cx={c.x} cy={c.y} r="4" fill="#77858c" stroke="#131f24" strokeWidth="2" className="opacity-55 hover:scale-125 transition-transform cursor-pointer" />
                  ))}
                </>
              )}

              {/* Weekday Axis Labels */}
              {days.map((day, idx) => {
                const x = paddingLeft + idx * (chartWidth / 6);
                return (
                  <text key={idx} x={x} y={paddingTop + chartHeight + 20} fill="white" fontSize="11" textAnchor="middle" className="opacity-40 font-bold select-none">
                    {day.label}
                  </text>
                );
              })}
            </svg>
          </div>

          {/* Chart Legends */}
          <div className="flex flex-col gap-2.5 mt-2.5 border-t border-cloud-gray/15 pt-4">
            <div className="flex items-center justify-between text-sm">
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-sky-blue shrink-0"></span>
                <span className="font-bold text-white">{profile.name || "Learner"}</span>
              </div>
              <span className="font-black text-white">{viewedTotalWeeklyXp} XP</span>
            </div>
            
            <div className="flex items-center justify-between text-sm opacity-60">
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-silver shrink-0"></span>
                <span className="font-bold text-white">You</span>
              </div>
              <span className="font-black text-white">{activeTotalWeeklyXp} XP</span>
            </div>
          </div>
        </div>
      </div>

      {/* Section: Overview */}
      <div className="w-full mt-10">
        <h2 className="font-feather text-xs font-black tracking-widest text-silver uppercase mb-5 select-none">
          Overview
        </h2>

        <div className="grid grid-cols-2 gap-4">
          {/* Streak */}
          <div className="border-2 border-cloud-gray rounded-3xl p-5 flex flex-col items-center justify-center text-center gap-2 bg-gradient-to-br from-duo-green-light/5 to-transparent">
            <span className="text-3xl select-none">🔥</span>
            <div className="flex flex-col items-center min-w-0">
              <span className="font-black text-lg text-orange-400 leading-tight">
                {streak} Days
              </span>
              <span className="text-[10px] font-extrabold text-silver uppercase tracking-wider mt-0.5">
                Streak
              </span>
            </div>
          </div>

          {/* Courses / Exam category */}
          <div className="border-2 border-cloud-gray rounded-3xl p-5 flex flex-col items-center justify-center text-center gap-2 bg-gradient-to-br from-duo-green-light/5 to-transparent">
            <span className="text-3xl select-none">🇵🇭</span>
            <div className="flex flex-col items-center min-w-0">
              <span className="font-black text-lg text-white leading-tight truncate">
                {profile.exam_category?.split(" ")[0] || "CSE"}
              </span>
              <span className="text-[10px] font-extrabold text-silver uppercase tracking-wider mt-0.5">
                Exam Course
              </span>
            </div>
          </div>

          {/* League */}
          <div className="border-2 border-cloud-gray rounded-3xl p-5 flex flex-col items-center justify-center text-center gap-2 bg-gradient-to-br from-duo-green-light/5 to-transparent">
            <div className="relative w-9 h-9 shrink-0 select-none">
              <Image src={leagueInfo.image} alt="League" fill className="object-contain" />
            </div>
            <div className="flex flex-col items-center min-w-0">
              <span className="font-black text-lg text-white leading-tight truncate">
                {leagueInfo.name.split(" ")[0]}
              </span>
              <span className="text-[10px] font-extrabold text-silver uppercase tracking-wider mt-0.5">
                Active League
              </span>
            </div>
          </div>

          {/* XP */}
          <div className="border-2 border-cloud-gray rounded-3xl p-5 flex flex-col items-center justify-center text-center gap-2 bg-gradient-to-br from-duo-green-light/5 to-transparent">
            <span className="text-3xl select-none">⚡</span>
            <div className="flex flex-col items-center min-w-0">
              <span className="font-black text-lg text-yellow-400 leading-tight">
                {xp} XP
              </span>
              <span className="text-[10px] font-extrabold text-silver uppercase tracking-wider mt-0.5">
                Total Score
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Section: Achievements */}
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
              <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-cloud-gray/10 to-transparent flex items-center justify-center p-2 relative group-hover:scale-105 transition-all">
                <Image src={ach.icon} alt={ach.name} width={56} height={56} className="object-contain" />
              </div>
              <span className="text-[9px] font-extrabold px-2 py-0.5 rounded-full select-none text-center text-silver bg-cloud-gray/20">
                {ach.name}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Block & Report User Row */}
      <div className="w-full mt-14 flex flex-col gap-3.5 border-t border-cloud-gray/15 pt-8">
        <button className="w-full py-3.5 hover:bg-red-500/5 text-red-500 border border-red-500/20 hover:border-red-500/30 rounded-2xl transition-all font-extrabold uppercase tracking-widest text-[10px] sm:text-xs flex items-center justify-center gap-2 cursor-pointer select-none">
        Report User
        </button>
        <button className="w-full py-3.5 hover:bg-white/5 text-silver hover:text-white border border-cloud-gray rounded-2xl transition-all font-extrabold uppercase tracking-widest text-[10px] sm:text-xs flex items-center justify-center gap-2 cursor-pointer select-none">
          Block User
        </button>
      </div>

    </main>
  );
}

export default function UserProfilePage({ params }: { params: any }) {
  const [resolvedUserId, setResolvedUserId] = useState<string | null>(null);

  useEffect(() => {
    async function unwrap() {
      const resolved = await params;
      if (resolved && resolved.userId) {
        setResolvedUserId(resolved.userId);
      }
    }
    unwrap();
  }, [params]);

  if (!resolvedUserId) {
    return (
      <main className="flex-1 w-full max-w-[600px] mx-auto pb-24 pt-20 flex flex-col items-center justify-center gap-4">
        <div className="w-12 h-12 border-4 border-sky-blue/30 border-t-sky-blue rounded-full animate-spin"></div>
        <span className="text-silver font-bold">Unwrapping parameters...</span>
      </main>
    );
  }

  return (
    <Suspense fallback={
      <main className="flex-1 w-full max-w-[600px] mx-auto pb-24 pt-20 flex flex-col items-center justify-center gap-4">
        <div className="w-12 h-12 border-4 border-sky-blue/30 border-t-sky-blue rounded-full animate-spin"></div>
        <span className="text-silver font-bold">Loading...</span>
      </main>
    }>
      <UserProfileContent userId={resolvedUserId} />
    </Suspense>
  );
}
