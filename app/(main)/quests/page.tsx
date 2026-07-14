"use client";

import React, { useEffect, useState, useRef, useCallback } from "react";
import Image from "next/image";
import Link from "next/link";
import { useUser } from "@clerk/nextjs";
import { supabase } from "@/lib/supabase";
import { useAlert } from "@/components/ui/AlertContext";
import { useStats } from "@/components/ui/StatsContext";
import { StreakAsset } from "@/components/ui/StreakAsset";

const playSound = (src: string) => {
  if (typeof window !== "undefined") {
    const audio = new Audio(src);
    audio.play().catch((err) => console.error("Error playing audio:", err));
  }
};

export default function QuestsPage() {
  const { showAlert } = useAlert();
  const { user } = useUser();
  const { streak, xp, hearts, gems, lessonsCompleted, refreshStats, updateStatsLocally } = useStats();

  const [activeTab, setActiveTab] = useState<"achievements" | "quests">("achievements");
  const [dailyRewardsCount, setDailyRewardsCount] = useState(1);
  const personalRecordsRef = useRef<HTMLDivElement>(null);

  const scrollPersonalRecords = (direction: "left" | "right") => {
    if (personalRecordsRef.current) {
      const { scrollLeft, clientWidth } = personalRecordsRef.current;
      const scrollAmount = clientWidth * 0.75;
      personalRecordsRef.current.scrollTo({
        left: direction === "left" ? scrollLeft - scrollAmount : scrollLeft + scrollAmount,
        behavior: "smooth"
      });
    }
  };

  const [dailyXp, setDailyXp] = useState(0);
  const [dailyLessons, setDailyLessons] = useState(0);
  const [dailyPassed, setDailyPassed] = useState(0);

  const [quest1Claimed, setQuest1Claimed] = useState(false);
  const [quest2Claimed, setQuest2Claimed] = useState(false);
  const [quest3Claimed, setQuest3Claimed] = useState(false);

  const [claiming, setClaiming] = useState<number | null>(null);

  const [claimedAchievements, setClaimedAchievements] = useState<string[]>([]);
  const [claimingAchievementId, setClaimingAchievementId] = useState<string | null>(null);

  const fetchClaimedAchievements = useCallback(async () => {
    let profileId: string | null = null;
    if (user) {
      profileId = user.id;
    } else if (typeof window !== "undefined") {
      profileId = localStorage.getItem("guest_session_id");
    }

    if (!profileId) return;

    const isGuest = profileId.startsWith("guest_");

    if (isGuest) {
      if (typeof window !== "undefined") {
        const stored = localStorage.getItem("guest_claimed_achievements");
        if (stored) {
          try {
            setClaimedAchievements(JSON.parse(stored));
          } catch (e) {
            setClaimedAchievements([]);
          }
        }
      }
    } else {
      try {
        const { data, error } = await supabase
          .from("lesson_events")
          .select("event_type")
          .eq("profile_id", profileId)
          .like("event_type", "claimed_achievement_%");

        if (!error && data) {
          const claimedIds = data.map((evt: any) => evt.event_type.replace("claimed_achievement_", ""));
          setClaimedAchievements(claimedIds);
        }
      } catch (err) {
        console.error("Error fetching claimed achievements:", err);
      }
    }
  }, [user]);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const stored = localStorage.getItem("daily_rewards_claimed_count");
      if (stored) {
        setDailyRewardsCount(parseInt(stored, 10));
      } else {
        localStorage.setItem("daily_rewards_claimed_count", "1");
        setDailyRewardsCount(1);
      }

      const todayStr = new Date().toLocaleDateString("en-CA");
      const lastResetDate = localStorage.getItem("last_quest_reset_date");
      if (lastResetDate !== todayStr) {
        localStorage.setItem("last_quest_reset_date", todayStr);
        localStorage.setItem("daily_xp_earned", "0");
        localStorage.setItem("daily_lessons_completed", "0");
        localStorage.setItem("daily_passed_completed", "0");
        localStorage.setItem("quest_1_claimed", "false");
        localStorage.setItem("quest_2_claimed", "false");
        localStorage.setItem("quest_3_claimed", "false");
      }

      setDailyXp(parseInt(localStorage.getItem("daily_xp_earned") || "0", 10));
      setDailyLessons(parseInt(localStorage.getItem("daily_lessons_completed") || "0", 10));
      setDailyPassed(parseInt(localStorage.getItem("daily_passed_completed") || "0", 10));

      setQuest1Claimed(localStorage.getItem("quest_1_claimed") === "true");
      setQuest2Claimed(localStorage.getItem("quest_2_claimed") === "true");
      setQuest3Claimed(localStorage.getItem("quest_3_claimed") === "true");
    }
    fetchClaimedAchievements();
  }, [fetchClaimedAchievements]);

  const handleClaimQuest = async (questNum: number, gemReward: number) => {
    setClaiming(questNum);
    let profileId: string | null = null;
    if (user) {
      profileId = user.id;
    } else if (typeof window !== "undefined") {
      profileId = localStorage.getItem("guest_session_id");
    }

    if (profileId) {
      try {
        const { error } = await supabase
          .from("profile_game_state")
          .update({
            gems: gems + gemReward
          })
          .eq("profile_id", profileId);

        if (!error) {
          playSound("/videos/claimed_reward.webm");
          localStorage.setItem(`quest_${questNum}_claimed`, "true");
          updateStatsLocally({ gems: gems + gemReward });
          await refreshStats();
          if (questNum === 1) setQuest1Claimed(true);
          if (questNum === 2) setQuest2Claimed(true);
          if (questNum === 3) setQuest3Claimed(true);
          await showAlert(`🎉 Quest completed! You received 💎 ${gemReward} Gems.`);
        } else {
          await showAlert("❌ Claim failed: " + error.message);
        }
      } catch (err) {
        console.error(err);
      }
    }
    setClaiming(null);
  };

  const handleClaimAchievement = async (achievementId: string, gemReward: number) => {
    setClaimingAchievementId(achievementId);
    let profileId: string | null = null;
    if (user) {
      profileId = user.id;
    } else if (typeof window !== "undefined") {
      profileId = localStorage.getItem("guest_session_id");
    }

    if (profileId) {
      const isGuest = profileId.startsWith("guest_");
      try {
        const { error: gameError } = await supabase
          .from("profile_game_state")
          .update({
            gems: gems + gemReward
          })
          .eq("profile_id", profileId);

        if (!gameError) {
          playSound("/videos/claimed_reward.webm");
          if (isGuest) {
            if (typeof window !== "undefined") {
              const currentClaimed = localStorage.getItem("guest_claimed_achievements");
              let claimedList: string[] = [];
              if (currentClaimed) {
                try { claimedList = JSON.parse(currentClaimed); } catch (e) {}
              }
              if (!claimedList.includes(achievementId)) {
                claimedList.push(achievementId);
              }
              localStorage.setItem("guest_claimed_achievements", JSON.stringify(claimedList));
              setClaimedAchievements(claimedList);
            }
          } else {
            const { error: eventError } = await supabase
              .from("lesson_events")
              .insert({
                profile_id: profileId,
                event_type: `claimed_achievement_${achievementId}`,
                score_delta: 0,
                level_delta: 0
              });

            if (eventError) {
              console.error("Failed to insert claim audit event:", eventError);
            }
            setClaimedAchievements(prev => [...prev, achievementId]);
          }

          updateStatsLocally({ gems: gems + gemReward });
          await refreshStats();
          await showAlert(`🎉 Achievement completed! You received 💎 ${gemReward} Gems.`);
        } else {
          await showAlert("❌ Claim failed: " + gameError.message);
        }
      } catch (err) {
        console.error(err);
        await showAlert("❌ Unexpected error occurred. Please try again.");
      }
    }
    setClaimingAchievementId(null);
  };

  const level = Math.floor(xp / 150) + 1;
  const kbCompleted = lessonsCompleted >= 1;
  const boCompleted = level >= 5;
  const fvCompleted = lessonsCompleted >= 1;
  const ceCompleted = lessonsCompleted >= 1;
  const kmCompleted = xp >= 100;
  const guardianProgress = [kbCompleted, boCompleted, fvCompleted, ceCompleted, kmCompleted].filter(Boolean).length;

  const todayDateStr = new Date().toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });

  const rawAchievements = [
    {
      id: "knowledge_brew",
      name: "Knowledge Brew",
      condition: "Complete your first lesson.",
      icon: "/img/gen_imgs/achievements/blue_potion.webp",
      target: 1,
      current: lessonsCompleted >= 1 ? 1 : 0,
      reward: 30,
    },
    {
      id: "blast_off",
      name: "Blast Off!",
      condition: "Reach Level 5.",
      icon: "/img/gen_imgs/achievements/rocket.webp",
      target: 5,
      current: Math.min(5, level),
      reward: 100,
    },
    {
      id: "rainbow_mind",
      name: "Rainbow Mind",
      condition: "Study 7 consecutive days.",
      icon: "/img/gen_imgs/achievements/rainbow.webp",
      target: 7,
      current: Math.min(7, streak),
      reward: 100,
    },
    {
      id: "jack_of_all_topics",
      name: "Jack of All Topics",
      condition: "Complete lessons from every subject.",
      icon: "/img/gen_imgs/achievements/dice.webp",
      target: 3,
      current: Math.min(3, lessonsCompleted),
      reward: 100,
    },
    {
      id: "first_victory",
      name: "First Victory",
      condition: "Pass your first quiz.",
      icon: "/img/gen_imgs/achievements/gold_shield.webp",
      target: 1,
      current: lessonsCompleted >= 1 ? 1 : 0,
      reward: 30,
    },
    {
      id: "curious_explorer",
      name: "Curious Explorer",
      condition: "View all learning materials in one lesson.",
      icon: "/img/gen_imgs/achievements/magnifying_glass.webp",
      target: 1,
      current: lessonsCompleted >= 1 ? 1 : 0,
      reward: 30,
    },
    {
      id: "heart_of_determination",
      name: "Heart of Determination",
      condition: "Finish a difficult challenge.",
      icon: "/img/gen_imgs/achievements/crystal_potion.webp",
      target: 1,
      current: lessonsCompleted >= 2 ? 1 : 0,
      reward: 100,
    },
    {
      id: "knowledge_magnet",
      name: "Knowledge Magnet",
      condition: "Collect 100 Learning Points (LP).",
      icon: "/img/gen_imgs/achievements/magnet.webp",
      target: 100,
      current: Math.min(100, xp),
      reward: 30,
    },
    {
      id: "growth_spiral",
      name: "Growth Spiral",
      condition: "Level up 10 times.",
      icon: "/img/gen_imgs/achievements/green_spiral.webp",
      target: 10,
      current: Math.min(10, Math.max(0, level - 1)),
      reward: 100,
    },
    {
      id: "star_student",
      name: "Star Student",
      condition: "Earn a perfect score on any quiz.",
      icon: "/img/gen_imgs/achievements/gold_star.webp",
      target: 1,
      current: lessonsCompleted >= 1 ? 1 : 0,
      reward: 30,
    },
    {
      id: "daily_reward_hunter",
      name: "Daily Reward Hunter",
      condition: "Claim daily rewards for 7 days.",
      icon: "/img/gen_imgs/achievements/gift_box.webp",
      target: 7,
      current: Math.min(7, dailyRewardsCount),
      reward: 100,
    },
    {
      id: "quick_learner",
      name: "Quick Learner",
      condition: "Finish a lesson within the target time.",
      icon: "/img/gen_imgs/achievements/boots.webp",
      target: 1,
      current: lessonsCompleted >= 1 ? 1 : 0,
      reward: 30,
    },
    {
      id: "coin_collector",
      name: "Coin Collector",
      condition: "Earn 500 coins.",
      icon: "/img/gen_imgs/achievements/silver_coin.webp",
      target: 500,
      current: Math.min(500, gems),
      reward: 100,
    },
    {
      id: "treasure_hunter",
      name: "Treasure Hunter",
      condition: "Earn 5,000 coins.",
      icon: "/img/gen_imgs/achievements/gold_coin.webp",
      target: 5000,
      current: Math.min(5000, gems),
      reward: 100,
    },
    {
      id: "guardian_scholar",
      name: "Guardian Scholar",
      condition: "Complete all beginner achievements.",
      icon: "/img/gen_imgs/achievements/blue_shield.webp",
      target: 5,
      current: guardianProgress,
      reward: 100,
    },
  ];

  const achievements = rawAchievements
    .map((ach) => {
      const isCompleted = ach.current >= ach.target;
      const isClaimed = claimedAchievements.includes(ach.id);
      let weight = 0;
      if (isCompleted && !isClaimed) {
        weight = 4; // Finished & Claimable
      } else if (isCompleted && isClaimed) {
        weight = 3; // Finished & Claimed
      } else if (ach.current > 0) {
        weight = 2; // Ongoing / In Progress
      } else {
        weight = 1; // Locked / No progress
      }
      return {
        ...ach,
        isCompleted,
        isClaimed,
        weight,
      };
    })
    .sort((a, b) => b.weight - a.weight);

  return (
    <>
      {/* Center Column */}
      <main className="flex-1 w-full max-w-[600px] mx-auto pb-24 flex flex-col gap-8 pt-4 md:pt-8 px-4 font-din-round min-w-0">
        {/* Page Header */}
        <div className="w-full flex items-center gap-4 pb-2 border-b border-cloud-gray dark:border-cloud-gray/15">
          <h1 className="font-feather text-xl md:text-2xl text-almost-black dark:text-white font-bold tracking-wide">
            Quests
          </h1>
        </div>

        {/* 1. Daily Quests Section */}
        <div className="flex flex-col gap-4 w-full">
          {/* Welcome Card */}
          <div className="w-full bg-[#58cc02] rounded-3xl p-6 relative overflow-hidden flex items-center justify-between min-h-[160px]">
            <div className="flex flex-col text-white max-w-[60%] z-10">
              <h2 className="font-feather text-2xl md:text-3xl font-bold tracking-wide mb-2">
                Welcome!
              </h2>
              <p className="text-white/90 text-sm md:text-base font-semibold leading-relaxed">
                Complete quests to earn rewards! Quests refresh every day.
              </p>
            </div>

            <div className="absolute -right-2 -bottom-2 w-36 h-36 sm:w-32 sm:h-32 md:w-36 md:h-36 z-0 flex items-end">
              <div className="relative w-full h-full">
                <Image
                  src="/emoji/ohyeah.webp"
                  alt="Welcome mascot"
                  fill
                  className="object-contain drop-shadow-lg"
                  unoptimized
                />
              </div>
            </div>
          </div>

          {/* Daily Quests Sub-Header */}
          <div className="w-full flex items-center justify-between mt-2">
            <h2 className="font-feather text-[17px] md:text-lg text-almost-black dark:text-white font-bold tracking-wide">
              Daily Quests
            </h2>
            <div className="flex items-center gap-1.5 text-orange-500 font-bold text-xs md:text-sm tracking-wide">
              <span>14 HOURS LEFT</span>
            </div>
          </div>

          {/* Quest 1: Earn 30 XP */}
          <div className="p-4 flex items-center gap-4 bg-snow-white rounded-2xl w-full">
            <div className="w-22 h-22 flex items-center justify-center shrink-0 relative">
              <Image src="/img/gen_imgs/exp.webp" alt="Most XP" fill className="object-contain" unoptimized />
            </div>

            <div className="flex flex-col w-full gap-2 min-w-0">
              <div className="flex justify-between items-start gap-2 w-full">
                <div className="flex flex-col min-w-0">
                  <span className="font-bold text-sm sm:text-base md:text-lg text-almost-black dark:text-white truncate">Daily Sprint</span>
                  <div className="text-[10px] sm:text-xs text-silver font-semibold flex flex-wrap items-center gap-1.5 mt-0.5 leading-tight">
                    <span>Earn 30 XP today </span>
                    <span className="inline-flex items-center gap-1">
                      <Image src="/img/gen_imgs/diamond.webp" alt="Gems" width={12} height={12} className="object-contain" />
                      <span>5 Gems</span>
                    </span>
                  </div>
                </div>
                {dailyXp >= 30 && !quest1Claimed && (
                  <button
                    disabled={claiming !== null}
                    onClick={() => handleClaimQuest(1, 5)}
                    className="bg-duo-green hover:brightness-105 text-white font-bold text-[10px] sm:text-xs uppercase tracking-wide px-2.5 py-1.5 sm:px-3 sm:py-1.5 rounded-xl shadow-[0_3px_0_#3f8f01] active:translate-y-[3px] active:shadow-none transition-all cursor-pointer shrink-0"
                  >
                    {claiming === 1 ? "Claiming..." : "Claim"}
                  </button>
                )}
                {quest1Claimed && (
                  <span className="bg-duo-green/15 text-duo-green text-[10px] sm:text-xs font-bold px-2.5 py-1 rounded-xl shrink-0">
                    Claimed 
                  </span>
                )}
              </div>

              {!quest1Claimed && (
                <div className="w-full flex items-center gap-4">
                  <div className="h-6 w-full bg-cloud-gray dark:bg-cloud-gray/10 rounded-full overflow-hidden relative flex items-center justify-center">
                    <div
                      className="absolute left-0 top-0 h-full bg-sunshine-yellow rounded-full transition-all duration-300"
                      style={{ width: `${Math.min(100, (dailyXp / 30) * 100)}%` }}
                    ></div>
                    <span className="relative z-10 text-almost-black dark:text-white font-extrabold text-xs">
                      {Math.min(30, dailyXp)} / 30
                    </span>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Quest 2: Complete 1 Lesson */}
          <div className="p-4 flex items-center gap-4 bg-snow-white rounded-2xl w-full">
            <div className="w-22 h-22 flex items-center justify-center shrink-0 relative">
              <Image src="/img/gen_imgs/achievements/gold_star.webp" alt="Complete 1 Lesson" fill className="object-contain" unoptimized />
            </div>

            <div className="flex flex-col w-full gap-2 min-w-0">
              <div className="flex justify-between items-start gap-2 w-full">
                <div className="flex flex-col min-w-0">
                  <span className="font-bold text-sm sm:text-base md:text-lg text-almost-black dark:text-white truncate">First Steps</span>
                  <div className="text-[10px] sm:text-xs text-silver font-semibold flex flex-wrap items-center gap-1.5 mt-0.5 leading-tight">
                    <span>Complete 1 lesson today </span>
                    <span className="inline-flex items-center gap-1">
                      <Image src="/img/gen_imgs/diamond.webp" alt="Gems" width={12} height={12} className="object-contain" />
                      <span>5 Gems</span>
                    </span>
                  </div>
                </div>
                {dailyLessons >= 1 && !quest2Claimed && (
                  <button
                    disabled={claiming !== null}
                    onClick={() => handleClaimQuest(2, 5)}
                    className="bg-duo-green hover:brightness-105 text-white font-bold text-[10px] sm:text-xs uppercase tracking-wide px-2.5 py-1.5 sm:px-3 sm:py-1.5 rounded-xl shadow-[0_3px_0_#3f8f01] active:translate-y-[3px] active:shadow-none transition-all cursor-pointer shrink-0"
                  >
                    {claiming === 2 ? "Claiming..." : "Claim"}
                  </button>
                )}
                {quest2Claimed && (
                  <span className="bg-duo-green/15 text-duo-green text-[10px] sm:text-xs font-bold px-2.5 py-1 rounded-xl shrink-0">
                    Claimed 
                  </span>
                )}
              </div>

              {!quest2Claimed && (
                <div className="w-full flex items-center gap-4">
                  <div className="h-6 w-full bg-cloud-gray dark:bg-cloud-gray/10 rounded-full overflow-hidden relative flex items-center justify-center">
                    <div
                      className="absolute left-0 top-0 h-full bg-duo-green rounded-full transition-all duration-300"
                      style={{ width: `${Math.min(100, (dailyLessons / 1) * 100)}%` }}
                    ></div>
                    <span className="relative z-10 text-almost-black dark:text-white font-extrabold text-xs">
                      {Math.min(1, dailyLessons)} / 1
                    </span>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Quest 3: Pass a test with >= 80% */}
          <div className="p-4 flex items-center gap-4 bg-snow-white rounded-2xl w-full">
            <div className="w-22 h-22 flex items-center justify-center shrink-0 relative">
              <Image src="/img/gen_imgs/trophy.webp" alt="Complete 1 Lesson" fill className="object-contain" unoptimized />
            </div>

            <div className="flex flex-col w-full gap-2 min-w-0">
              <div className="flex justify-between items-start gap-2 w-full">
                <div className="flex flex-col min-w-0">
                  <span className="font-bold text-sm sm:text-base md:text-lg text-almost-black dark:text-white truncate">High Achiever</span>
                  <div className="text-[10px] sm:text-xs text-silver font-semibold flex flex-wrap items-center gap-1.5 mt-0.5 leading-tight">
                    <span>Pass a test with 80% score</span>
                    <span className="inline-flex items-center gap-1">
                      <Image src="/img/gen_imgs/diamond.webp" alt="Gems" width={12} height={12} className="object-contain" />
                      <span>10 Gems</span>
                    </span>
                  </div>
                </div>
                {dailyPassed >= 1 && !quest3Claimed && (
                  <button
                    disabled={claiming !== null}
                    onClick={() => handleClaimQuest(3, 10)}
                    className="relative overflow-hidden
                              bg-gradient-to-b from-[#58cc02] to-[#46a302]
                              hover:brightness-110
                              text-white
                              font-extrabold
                              text-[10px] sm:text-xs
                              uppercase
                              tracking-wide
                              px-3 py-1.5 sm:px-4 sm:py-2
                              rounded-xl
                              border-b-[4px] border-[#3f8f01]
                              shadow-[0_2px_0_rgba(0,0,0,0.15)]
                              transition-all duration-150
                              active:border-b-0
                              active:translate-y-[4px]
                              disabled:opacity-60
                              disabled:cursor-not-allowed
                              shrink-0
                              flex items-center gap-1
                            "
                  >
                    {claiming === 3 ? "Claiming..." : "Claim"}
                  </button>
                )}
                {quest3Claimed && (
                  <span className="bg-duo-green/15 text-duo-green text-[10px] sm:text-xs font-bold px-2.5 py-1 rounded-xl shrink-0">
                    Claimed
                  </span>
                )}
              </div>

              {!quest3Claimed && (
                <div className="w-full flex items-center gap-4">
                  <div className="h-6 w-full bg-cloud-gray dark:bg-cloud-gray/10 rounded-full overflow-hidden relative flex items-center justify-center">
                    <div
                      className="absolute left-0 top-0 h-full bg-sky-blue rounded-full transition-all duration-300"
                      style={{ width: `${Math.min(100, (dailyPassed / 1) * 100)}%` }}
                    ></div>
                    <span className="relative z-10 text-almost-black dark:text-white font-extrabold text-xs">
                      {Math.min(1, dailyPassed)} / 1
                    </span>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* 2. Personal Records Section */}
        <div className="flex flex-col gap-3 w-full min-w-0">
          <h2 className="font-feather text-[17px] md:text-lg text-almost-black dark:text-white font-bold tracking-wide">
            Personal Records
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3 w-full">
            {/* Card 1: Perfect Lessons */}
            <div className="col-span-1 p-4 bg-snow-white rounded-2xl flex flex-col items-center text-center">
              <div className="w-25 h-25 relative mb-3">
                <Image src="/img/gen_imgs/achievements/green_spiral.webp" alt="Perfect Lessons" fill className="object-contain" unoptimized />
              </div>
              <span className="text-xl md:text-2xl font-black text-duo-green">{lessonsCompleted}</span>
              <span className="text-[11px] md:text-[12px] font-extrabold text-charcoal dark:text-white mt-1.5 leading-tight">Lessons Completed</span>
              <span className="text-[9px] md:text-[10px] text-silver font-semibold mt-1 uppercase">{todayDateStr}</span>
            </div>

            {/* Card 2: Most XP */}
            <div className="col-span-1 p-4 bg-snow-white rounded-2xl flex flex-col items-center text-center">
              <div className="w-25 h-25 relative mb-3">
                <Image src="/img/gen_imgs/achievements/gold_star.webp" alt="Most XP" fill className="object-contain" unoptimized />
              </div>
              <span className="text-xl md:text-2xl font-black text-sunshine-yellow">{xp}</span>
              <span className="text-[11px] md:text-[12px] font-extrabold text-charcoal dark:text-white mt-1.5 leading-tight">Total XP Earned</span>
              <span className="text-[9px] md:text-[10px] text-silver font-semibold mt-1 uppercase">{todayDateStr}</span>
            </div>

            {/* Card 3: Longest Streak */}
            <div className="col-span-2 md:col-span-1 p-4 bg-snow-white rounded-2xl flex flex-col items-center text-center">
              <div className="w-25 h-25 relative">
                <StreakAsset streak={streak} alt="Longest Streak" fill className="object-contain" unoptimized />
              </div>
              <span className="text-xl md:text-2xl font-black text-orange-500">{streak}</span>
              <span className="text-[11px] md:text-[12px] font-extrabold text-charcoal dark:text-white mt-1.5 leading-tight">Longest Streak</span>
              <span className="text-[9px] md:text-[10px] text-silver font-semibold mt-1 uppercase">{todayDateStr}</span>
            </div>
          </div>
        </div>

        {/* 3. Awards Section */}
        <div className="flex flex-col gap-4 w-full">
          <h2 className="font-feather text-[17px] md:text-lg text-almost-black dark:text-white font-bold tracking-wide">
            Awards
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3 w-full">
            {achievements.map((achievement) => {
              const percent = Math.min(100, (achievement.current / achievement.target) * 100);
              const isCompleted = achievement.current >= achievement.target;

              return (
                <div
                  key={achievement.id}
                  className="flex flex-col items-center text-center rounded-2xl p-4 bg-snow-white transition-all select-none hover:bg-cloud-gray/5 dark:hover:bg-white/5 w-full"
                >
                  {/* Badge */}
                  <div className="relative w-26 h-26 md:w-28 md:h-28 flex items-center justify-center mb-3 shrink-0">
                    <div className={`w-full h-full relative transition-all duration-300 ${!isCompleted ? "grayscale opacity-40" : "drop-shadow-md"}`}>
                      <Image
                        src={achievement.icon}
                        alt={achievement.name}
                        fill
                        sizes="(max-width: 768px) 64px, 112px"
                        className="object-contain"
                        unoptimized
                      />
                    </div>
                  </div>

                  {/* Text stacked below badge */}
                  <div className="flex flex-col items-center w-full gap-1 grow">
                    <span className="font-extrabold text-xs md:text-sm text-charcoal dark:text-white leading-tight w-full">
                      {achievement.name}
                    </span>
                    <span className="text-[10px] md:text-xs font-bold text-silver tracking-tight">
                      {achievement.current} of {achievement.target}
                    </span>
                    <p className="text-[10px] md:text-xs text-silver dark:text-silver/60 leading-snug mt-1 line-clamp-2 w-full">
                      {achievement.condition}
                    </p>
                  </div>
                  {/* Progress bar or Claim Button */}
                  {achievement.isCompleted && !achievement.isClaimed ? (
                    <button
                      disabled={claimingAchievementId !== null}
                      onClick={(e) => {
                        e.stopPropagation();
                        handleClaimAchievement(achievement.id, achievement.reward);
                      }}
                      className="mt-3 relative overflow-hidden w-full
                                 bg-gradient-to-b from-[#58cc02] to-[#46a302]
                                 hover:brightness-110
                                 text-white
                                 font-extrabold
                                 text-[10px] md:text-xs
                                 uppercase
                                 tracking-wide
                                 py-1.5 rounded-xl
                                 border-b-[4px] border-[#3f8f01]
                                 shadow-[0_2px_0_rgba(0,0,0,0.15)]
                                 transition-all duration-150
                                 active:border-b-0
                                 active:translate-y-[4px]
                                 disabled:opacity-60
                                 disabled:cursor-not-allowed
                                 shrink-0
                                 flex items-center justify-center gap-1"
                    >
                      {claimingAchievementId === achievement.id ? "Claiming..." : (
                        <>
                          <span className="text-[13px] md:text-xs font-bold text-white tracking-tight">Claim </span> 
                        </>
                      )}
                    </button>
                  ) : achievement.isCompleted && achievement.isClaimed ? (
                    <div className="mt-3 w-full text-center py-1.5 bg-duo-green/15 text-duo-green text-[10px] md:text-xs font-bold rounded-xl shrink-0">
                      Claimed
                    </div>
                  ) : (
                    <div className="w-full bg-cloud-gray dark:bg-cloud-gray/15 h-1.5 rounded-full overflow-hidden mt-3 shrink-0">
                      <div
                        className="h-full rounded-full transition-all duration-300 bg-sky-blue"
                        style={{ width: `${percent}%` }}
                      />
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </main>

      {/* Right Sidebar */}
      <aside className="hidden lg:block w-[368px] shrink-0 pt-4 md:pt-8 font-din-round">
        <div className="flex flex-col gap-6">

          {/* Top Stats Bar */}
          <div className="flex items-center justify-between px-2 text-almost-black dark:text-white font-bold text-sm md:text-base">
            {/* Flag / Language */}
            <div className="flex items-center gap-1.5 cursor-pointer hover:bg-duo-green-light dark:hover:bg-white/5 p-2 rounded-xl transition-colors">
              <span className="text-xl">🇵🇭</span>
              <span className="text-[12px] font-extrabold">1</span>
            </div>

            {/* Streak */}
            <div className="flex items-center gap-1.5 text-orange-500 cursor-pointer hover:bg-duo-green-light dark:hover:bg-white/5 p-2 rounded-xl transition-colors">
              <StreakAsset
                streak={streak}
                width={28}
                height={28}
                className="object-contain"
              />
              <span>{streak}</span>
            </div>

            {/* XP / Gems */}
            <div className="flex items-center gap-1.5 text-blue-400 cursor-pointer hover:bg-duo-green-light dark:hover:bg-white/5 p-2 rounded-xl transition-colors" title="Gems">
              <Image
                src="/img/gen_imgs/diamond.webp"
                alt="Gems"
                width={28}
                height={28}
                className="object-contain"
              />
              <span>{gems}</span>
            </div>

            {/* Hearts */}
            <div className="flex items-center gap-1.5 text-red-500 cursor-pointer hover:bg-duo-green-light dark:hover:bg-white/5 p-2 rounded-xl transition-colors">
              <Image
                src="/img/gen_imgs/user_life.webp"
                alt="Hearts"
                width={24}
                height={24}
                className="object-contain"
                style={{ height: 'auto' }}
              />
              <span>{hearts}</span>
            </div>
          </div>

          {/* Monthly Challenge Widget */}
          <div className="p-5 flex flex-col gap-5 bg-snow-white">
            <div className="flex gap-4 items-start">
              <div className="grow flex flex-col gap-2">
                <h3 className="font-bold text-[17px] leading-tight text-almost-black dark:text-white">
                  Monthly challenges unlock soon!
                </h3>
                <p className="text-silver text-xs font-semibold leading-normal">
                  Complete each month&apos;s challenge to earn exclusive badges
                </p>
              </div>

              <div className="w-20 h-20 relative shrink-0">
                <Image
                  src="/img/gen_imgs/exp.webp"
                  alt="Monthly Challenge"
                  fill
                  sizes="80px"
                  className="object-contain"
                  unoptimized
                />
              </div>
            </div>

            <Link href="/dashboard" className="w-full">
              <button className="w-full bg-duo-green hover:brightness-105 text-white font-extrabold py-3 rounded-xl transition-all shadow-[0_4px_0_#3f8f01] active:translate-y-[4px] active:shadow-none uppercase tracking-widest text-xs md:text-sm cursor-pointer">
                START A LESSON
              </button>
            </Link>
          </div>

          {/* Footer Links */}
          <div className="flex flex-wrap gap-x-3 gap-y-1.5 px-2 text-[10px] md:text-[11px] font-bold text-silver uppercase tracking-wider">
            <span className="cursor-pointer hover:text-almost-black dark:hover:text-white transition-colors">About</span>
            <span className="cursor-pointer hover:text-almost-black dark:hover:text-white transition-colors">Blog</span>
            <span className="cursor-pointer hover:text-almost-black dark:hover:text-white transition-colors">Store</span>
            <span className="cursor-pointer hover:text-almost-black dark:hover:text-white transition-colors">Efficacy</span>
            <span className="cursor-pointer hover:text-almost-black dark:hover:text-white transition-colors">Careers</span>
            <span className="cursor-pointer hover:text-almost-black dark:hover:text-white transition-colors">Investors</span>
            <span className="cursor-pointer hover:text-almost-black dark:hover:text-white transition-colors">Terms</span>
            <span className="cursor-pointer hover:text-almost-black dark:hover:text-white transition-colors">Privacy</span>
          </div>

        </div>
      </aside>
    </>
  );
}
