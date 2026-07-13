"use client";

import React, { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Image from "next/image";
import { useUser } from "@clerk/nextjs";
import { supabase } from "@/lib/supabase";
import { useStats } from "@/components/ui/StatsContext";
import { getStreakImage } from "@/lib/streak";

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

function AchievementsContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const tabParam = searchParams.get("tab") || "badges";
  const [activeTab, setActiveTab] = useState<"badges" | "achievements">(
    tabParam === "achievements" ? "achievements" : "badges"
  );

  const { user, isLoaded: isUserLoaded, isSignedIn } = useUser();
  const { streak, xp, lessonsCompleted } = useStats();
  const [lessonEvents, setLessonEvents] = useState<{ created_at: string }[]>([]);
  const [loading, setLoading] = useState(true);

  // Sync tab with URL search parameter
  useEffect(() => {
    if (tabParam === "achievements" || tabParam === "badges") {
      setActiveTab(tabParam);
    }
  }, [tabParam]);

  useEffect(() => {
    async function loadEvents() {
      if (!isUserLoaded) return;
      
      let profileId: string | null = null;
      if (isSignedIn && user) {
        profileId = user.id;
      } else if (typeof window !== "undefined") {
        profileId = localStorage.getItem("guest_session_id");
      }

      if (!profileId) {
        setLoading(false);
        return;
      }

      try {
        const { data, error } = await supabase
          .from("lesson_events")
          .select("created_at")
          .eq("profile_id", profileId)
          .eq("event_type", "lesson_completed");

        if (!error && data) {
          setLessonEvents(data);
        }
      } catch (err) {
        console.error("Error loading achievements events:", err);
      } finally {
        setLoading(false);
      }
    }
    loadEvents();
  }, [user, isUserLoaded, isSignedIn]);

  // Compute monthly badge unlock status & progress
  const getMonthlyBadgeStatus = (badge: MonthlyBadge) => {
    const currentMonthIndex = new Date().getMonth();
    const currentYear = new Date().getFullYear();

    // Group events for this month index by year
    const eventsInMonth = lessonEvents.filter(
      (e) => new Date(e.created_at).getMonth() === badge.monthIndex
    );

    const countsByYear: { [year: number]: number } = {};
    eventsInMonth.forEach((e) => {
      const yr = new Date(e.created_at).getFullYear();
      countsByYear[yr] = (countsByYear[yr] || 0) + 1;
    });

    const isAchieved = Object.values(countsByYear).some((cnt) => cnt >= badge.target);

    // Get progress specifically for the current month/year
    const currentMonthCount = lessonEvents.filter((e) => {
      const d = new Date(e.created_at);
      return d.getMonth() === badge.monthIndex && d.getFullYear() === currentYear;
    }).length;

    const isCurrentMonth = badge.monthIndex === currentMonthIndex;

    return {
      isAchieved,
      currentMonthCount,
      isCurrentMonth,
      progressPercent: Math.min(100, (currentMonthCount / badge.target) * 100),
    };
  };

  // Standard achievements calculation
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

  return (
    <main className="flex-1 w-full max-w-[800px] mx-auto pb-24 pt-4 px-4 font-din-round min-w-0">
      {/* Header back button */}
      <div className="flex items-center gap-3 mb-6">
        <button
          onClick={() => router.push("/profile")}
          className="p-2.5 rounded-xl border-0 border-cloud-gray hover:bg-white/5 text-white transition-all cursor-pointer select-none"
          title="Back to Profile"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
            <path d="M19 12H5M12 19l-7-7 7-7" />
          </svg>
        </button>
        <h1 className="font-feather text-2xl md:text-3xl text-white font-bold tracking-wide">
          Achievements Collection
        </h1>
      </div>

      {/* Tabs Row */}
      <div className="flex border-b-2 border-cloud-gray mb-8">
        <button
          onClick={() => {
            setActiveTab("badges");
            router.replace("/profile/achievements?tab=badges");
          }}
          className={`flex-1 py-4 text-center font-extrabold text-sm md:text-base uppercase tracking-wider transition-all select-none border-b-4 -mb-[4px] cursor-pointer ${
            activeTab === "badges"
              ? "border-sky-blue text-sky-blue"
              : "border-transparent text-silver hover:text-white"
          }`}
        >
          Monthly Badges
        </button>
        <button
          onClick={() => {
            setActiveTab("achievements");
            router.replace("/profile/achievements?tab=achievements");
          }}
          className={`flex-1 py-4 text-center font-extrabold text-sm md:text-base uppercase tracking-wider transition-all select-none border-b-4 -mb-[4px] cursor-pointer ${
            activeTab === "achievements"
              ? "border-sky-blue text-sky-blue"
              : "border-transparent text-silver hover:text-white"
          }`}
        >
          General Achievements
        </button>
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center py-20 gap-4">
          <div className="w-12 h-12 border-4 border-sky-blue/30 border-t-sky-blue rounded-full animate-spin"></div>
          <span className="text-silver font-bold">Loading your achievements...</span>
        </div>
      ) : activeTab === "badges" ? (
        /* Monthly Badges Grid */
        <div className="grid grid-cols-2 gap-4 sm:gap-5">
          {MONTHLY_BADGES.map((badge) => {
            const { isAchieved, currentMonthCount, isCurrentMonth, progressPercent } =
              getMonthlyBadgeStatus(badge);

            return (
              <div
                key={badge.monthIndex}
                className="border-0 rounded-3xl p-5 bg-gradient-to-br from-duo-green-light/5 to-transparent flex flex-col items-center text-center relative hover:border-sky-blue transition-all duration-300 group"
              >
                {/* Badge Image */}
                <div
                  className={`relative w-28 h-28 my-3 shrink-0 transition-transform group-hover:scale-110 duration-300 ${
                    !isAchieved
                      ? "grayscale opacity-35"
                      : "drop-shadow-[0_0_12px_rgba(253,164,175,0.25)]"
                  }`}
                >
                  <Image
                    src={badge.image}
                    alt={badge.badgeName}
                    fill
                    sizes="(max-width: 768px) 112px, 112px"
                    className="object-contain"
                  />
                </div>

                {/* Details */}
                <div className="flex flex-col flex-1 items-center w-full mt-2">
                  <span className="text-[10px] font-black text-silver tracking-widest uppercase">
                    {badge.monthName}
                  </span>
                  <h3 className="font-feather text-lg text-white font-bold leading-tight mt-1">
                    {badge.badgeName}
                  </h3>
                  <p className="text-silver/80 text-xs font-semibold leading-snug mt-2 grow line-clamp-3">
                    {badge.description}
                  </p>

                  {/* Progress info for current active month or show locked requirements */}
                  {isCurrentMonth && !isAchieved ? (
                    <div className="w-full mt-4">
                      <div className="flex justify-between items-center text-[10px] font-bold text-silver mb-1.5 uppercase">
                        <span>Current Month Progress</span>
                        <span>
                          {currentMonthCount} / {badge.target}
                        </span>
                      </div>
                      <div className="h-2.5 w-full bg-cloud-gray/25 rounded-full overflow-hidden relative">
                        <div
                          className="absolute left-0 top-0 h-full bg-sky-blue rounded-full transition-all duration-300"
                          style={{ width: `${progressPercent}%` }}
                        ></div>
                      </div>
                    </div>
                  ) : !isAchieved ? (
                    <span className="text-[10px] font-black text-silver/60 uppercase tracking-wide mt-4 bg-cloud-gray/10 px-3 py-1 rounded-lg">
                      Requires: {badge.target} lesson{badge.target > 1 ? "s" : ""}
                    </span>
                  ) : (
                    <span className="text-[11px] font-black text-duo-green uppercase tracking-wide mt-4 flex items-center gap-1">
                      Unlocked
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* Standard Achievements Grid */
        <div className="grid grid-cols-2 gap-4 sm:gap-5">
          {rawAchievements.map((ach) => {
            const isCompleted = ach.current >= ach.target;
            const percent = Math.min(100, (ach.current / ach.target) * 100);

            return (
              <div
                key={ach.id}
                className="border-0 border-cloud-gray rounded-3xl p-5 bg-gradient-to-br from-duo-green-light/5 to-transparent flex flex-col items-center text-center relative hover:border-sky-blue transition-all duration-300 group"
              >
                {/* Status indicator */}
                <span
                  className={`absolute top-4 right-4 text-[9px] font-black px-2.5 py-0.5 rounded-full uppercase ${
                    isCompleted
                      ? "bg-duo-green/20 text-duo-green border border-duo-green/30"
                      : "bg-cloud-gray/20 text-silver border border-cloud-gray/30"
                  }`}
                >
                  {isCompleted ? "Completed" : "In Progress"}
                </span>

                {/* Achievement Badge Icon */}
                <div
                  className={`relative w-44 h-44 my-3 shrink-0 transition-transform group-hover:scale-110 duration-300 ${
                    !isCompleted ? "grayscale opacity-35" : ""
                  }`}
                >
                  <Image
                    src={ach.icon}
                    alt={ach.name}
                    fill
                    sizes="(max-width: 768px) 96px, 96px"
                    className="object-contain"
                  />
                </div>

                {/* Details */}
                <div className="flex flex-col flex-1 items-center w-full mt-2">
                  <h3 className="font-feather text-lg text-white font-bold leading-tight">
                    {ach.name}
                  </h3>
                  <span className="text-[10px] font-bold text-silver mt-1">
                    {ach.current} of {ach.target}
                  </span>
                  <p className="text-silver/80 text-xs font-semibold leading-snug mt-2 grow line-clamp-3">
                    {ach.condition}
                  </p>

                  {/* Progress bar */}
                  <div className="w-full mt-4">
                    <div className="h-2.5 w-full bg-cloud-gray/25 rounded-full overflow-hidden relative">
                      <div
                        className={`absolute left-0 top-0 h-full rounded-full transition-all duration-300 ${
                          isCompleted ? "bg-duo-green" : "bg-sky-blue"
                        }`}
                        style={{ width: `${percent}%` }}
                      ></div>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </main>
  );
}

export default function AchievementsPage() {
  return (
    <Suspense fallback={
      <div className="flex flex-col items-center justify-center py-20 gap-4">
        <div className="w-12 h-12 border-4 border-sky-blue/30 border-t-sky-blue rounded-full animate-spin"></div>
        <span className="text-silver font-bold">Loading...</span>
      </div>
    }>
      <AchievementsContent />
    </Suspense>
  );
}
