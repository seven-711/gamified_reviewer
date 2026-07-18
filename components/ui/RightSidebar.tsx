"use client";

import React, { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { UserButton, useUser } from "@clerk/nextjs";
import { useRouter } from "next/navigation";
import { useStats } from "@/components/ui/StatsContext";
import { StreakAsset } from "@/components/ui/StreakAsset";
import { supabase } from "@/lib/supabase";
import { useAlert } from "@/components/ui/AlertContext";

const playSound = (src: string) => {
  if (typeof window !== "undefined") {
    const audio = new Audio(src);
    audio.play().catch((err) => console.error("Error playing audio:", err));
  }
};

interface LeagueInfo {
  name: string;
  image: string;
}

function getLeagueInfo(xp: number, lessonsCompleted: number, rank: number): LeagueInfo {
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

export default function RightSidebar() {
  const router = useRouter();
  const { user, isLoaded, isSignedIn } = useUser();
  const { streak, xp, hearts, gems, lastLessonDate, refreshStats, updateStatsLocally } = useStats();
  const { showAlert } = useAlert();
  const todayStr = new Date().toLocaleDateString("en-CA");

  const [claiming, setClaiming] = useState<number | null>(null);
  const isStreakActive = streak > 0 && lastLessonDate === todayStr;

  // Leaderboard / ranking state
  const [userRank, setUserRank] = useState<number | null>(null);
  const [totalScore, setTotalScore] = useState<number>(0);
  const [lessonsCompletedCount, setLessonsCompletedCount] = useState<number>(0);

  // Daily Quests state
  const [dailyXp, setDailyXp] = useState<number>(0);
  const [dailyLessons, setDailyLessons] = useState<number>(0);
  const [dailyPassed, setDailyPassed] = useState<number>(0);
  const [quest1Claimed, setQuest1Claimed] = useState<boolean>(false);
  const [quest2Claimed, setQuest2Claimed] = useState<boolean>(false);
  const [quest3Claimed, setQuest3Claimed] = useState<boolean>(false);

  const fetchRank = async () => {
    if (!isSignedIn || !user) {
      setUserRank(null);
      return;
    }
    try {
      const [profilesRes, progressRes] = await Promise.all([
        supabase.from("profiles").select("id"),
        supabase.from("profile_progress").select("profile_id, total_score, lessons_completed"),
      ]);

      if (profilesRes.data && progressRes.data) {
        const progressMap = new Map(
          progressRes.data.map((p) => [
            p.profile_id,
            { total_score: p.total_score, lessons_completed: p.lessons_completed },
          ])
        );

        const mapped = profilesRes.data
          .map((p: any) => {
            const prog = progressMap.get(p.id) || { total_score: 0, lessons_completed: 0 };
            return {
              id: p.id,
              total_score: prog.total_score,
              lessons_completed: prog.lessons_completed,
            };
          })
          .sort((a, b) => b.total_score - a.total_score);

        // Filter out guest accounts
        const registeredProfiles = mapped.filter((p) => !p.id.startsWith("guest_"));
        const rankIdx = registeredProfiles.findIndex((p) => p.id === user.id);
        if (rankIdx !== -1) {
          setUserRank(rankIdx + 1);
        }

        const userProg = progressMap.get(user.id);
        if (userProg) {
          setTotalScore(userProg.total_score);
          setLessonsCompletedCount(userProg.lessons_completed || 0);
        }
      }
    } catch (err) {
      console.error("Failed to load user rank for sidebar:", err);
    }
  };

  const fetchQuestsData = () => {
    if (typeof window !== "undefined") {
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
  };

  useEffect(() => {
    fetchRank();
    fetchQuestsData();

    const handleUpdate = () => {
      fetchRank();
      fetchQuestsData();
    };

    window.addEventListener("reviewer-db-update", handleUpdate);
    return () => {
      window.removeEventListener("reviewer-db-update", handleUpdate);
    };
  }, [user, isSignedIn]);

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

  const isLeaderboardUnlocked = isSignedIn && userRank !== null && totalScore > 0;

  const quests = [
    {
      title: "Earn 3000 XP",
      current: dailyXp,
      target: 3000,
      isCompleted: dailyXp >= 3000,
      isClaimed: quest1Claimed,
      color: "bg-sunshine-yellow",
      image: "/img/gen_imgs/exp.webp",
    },
    {
      title: "Complete 3 lessons",
      current: dailyLessons,
      target: 3,
      isCompleted: dailyLessons >= 3,
      isClaimed: quest2Claimed,
      color: "bg-duo-green",
      image: "/img/gen_imgs/achievements/gold_star.webp",
    },
    {
      title: "Pass test with 80%",
      current: dailyPassed,
      target: 1,
      isCompleted: dailyPassed >= 1,
      isClaimed: quest3Claimed,
      color: "bg-sky-blue",
      image: "/img/gen_imgs/trophy.webp",
    },
  ];

  return (
    <div className="lg:sticky lg:top-6 flex flex-col gap-6 pt-4 lg:pt-8 pb-10 lg:pb-0">
      {/* Top Stats Bar */}
      <div className="hidden lg:flex items-center justify-between px-2 text-charcoal font-bold text-body">
        {/* Country/Language placeholder */}
        <div className="flex items-center gap-2 cursor-pointer hover:bg-duo-green-light p-2 rounded-xl transition-colors">
          <span className="text-xl">🇵🇭</span>
        </div>
        {/* Streak */}
        <div 
          onClick={() => {
            if (streak > 0) {
              router.push('/streak');
            } else {
              showAlert("Complete a lesson today to start your streak!");
            }
          }}
          className={`flex items-center gap-2 ${isStreakActive ? "text-orange-500" : "text-silver opacity-80"} cursor-pointer hover:bg-duo-green-light p-2 rounded-xl transition-colors`}
          title="View Streak Calendar"
        >
          <StreakAsset
            streak={streak}
            width={28}
            height={28}
            className="object-contain"
          />
          <span>{streak}</span>
        </div>
        {/* XP / Gems */}
        <div className="flex items-center gap-2 text-blue-400 cursor-pointer hover:bg-duo-green-light p-2 rounded-xl transition-colors" title="Gems">
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
        <div className="flex items-center gap-2 text-red-500 cursor-pointer hover:bg-duo-green-light p-2 rounded-xl transition-colors">
          <Image
            src="/img/gen_imgs/user_life.webp"
            alt="Hearts"
            width={23}
            height={23}
            className="object-contain"
            style={{ height: 'auto' }}
          />
          <span>{hearts}</span>
        </div>
      </div>

      {/* Leaderboard Widget */}
      {isLeaderboardUnlocked && userRank !== null ? (
        (() => {
          const leagueInfo = getLeagueInfo(totalScore, lessonsCompletedCount, userRank);
          return (
            <div className="border-2 border-cloud-gray rounded-2xl p-5 flex flex-col gap-4 bg-snow-white">
              <div className="flex justify-between items-center border-b-2 border-cloud-gray pb-3">
                <h3 className="font-bold text-[17px] text-charcoal">{leagueInfo.name}</h3>
                <Link href="/leaderboard" className="text-sky-blue font-bold text-xs uppercase tracking-wider cursor-pointer hover:text-blue-400">
                  View League
                </Link>
              </div>
              <div className="flex items-center gap-4 mt-2">
                <div className="w-26 h-26 relative shrink-0">
                  <Image
                    src={leagueInfo.image}
                    alt={leagueInfo.name}
                    fill
                    className="object-contain"
                    unoptimized
                  />
                </div>
                <div className="flex flex-col">
                  <p className="text-charcoal text-body font-extrabold leading-tight">
                    You&apos;re ranked <span className="text-duo-green">#{userRank}</span>
                  </p>
                  <p className="text-silver text-xs font-medium leading-normal mt-1">
                    {userRank === 1 ? "Keep it up to stay on top!" : "Keep it up to stay in the top 3!"}
                  </p>
                </div>
              </div>
            </div>
          );
        })()
      ) : (
        /* Unlock Leaderboards Widget */
        <div className="border-2 border-cloud-gray rounded-2xl p-5 flex flex-col gap-4 bg-snow-white">
          <div className="flex justify-between items-center border-b-2 border-cloud-gray pb-3">
            <h3 className="font-bold text-[17px] text-charcoal">Unlock Leaderboards!</h3>
          </div>
          <div className="flex items-center gap-4 mt-2">
            <div className="w-20 h-20 relative shrink-0">
              <Image src="/emoji/unlockleaderboard.webp" alt="Leaderboard Locked" fill className="object-contain" unoptimized />
            </div>
            <p className="text-silver text-body font-medium leading-tight">
              Complete 1 more lesson to start competing
            </p>
          </div>
        </div>
      )}

      {/* Daily Quests Widget */}
      <div className="border-2 border-cloud-gray rounded-2xl p-5 flex flex-col gap-4 bg-snow-white">
        <div className="flex justify-between items-center border-b-2 border-cloud-gray pb-3">
          <h3 className="font-bold text-[17px] text-charcoal">Daily Quests</h3>
          <Link href="/quests" className="text-sky-blue font-bold text-xs uppercase tracking-wider cursor-pointer hover:text-blue-400">
            View All
          </Link>
        </div>

        <div className="flex flex-col gap-4 mt-2">
          {quests.map((quest, index) => {
            return (
              <div key={index} className="flex items-center gap-4">
                <div className="w-10 h-10 relative shrink-0 select-none">
                  <Image
                    src={quest.image}
                    alt={quest.title}
                    fill
                    className="object-contain"
                    unoptimized
                  />
                </div>
                <div className="flex flex-col w-full gap-1.5 min-w-0">
                  <span className="font-bold text-[13px] md:text-sm text-charcoal leading-none">
                    {quest.title}
                  </span>
                  <div className="flex items-center gap-3">
                    <div className="h-5 grow bg-cloud-gray rounded-full relative flex items-center justify-center overflow-hidden">
                      <div
                        className={`h-full absolute left-0 top-0 rounded-full transition-all duration-300 ${quest.color}`}
                        style={{ width: `${Math.min(100, (quest.current / quest.target) * 100)}%` }}
                      />
                      <span className="relative z-10 text-charcoal font-black text-[10px]">
                        {quest.current} / {quest.target}
                      </span>
                    </div>
                    {quest.isClaimed ? (
                      <span className="text-duo-green font-extrabold text-sm shrink-0">✓</span>
                    ) : quest.isCompleted ? (
                      <button
                        disabled={claiming !== null}
                        onClick={() => handleClaimQuest(index + 1, index === 2 ? 10 : 5)}
                        className="bg-duo-green hover:brightness-105 disabled:opacity-60 disabled:cursor-not-allowed text-white font-extrabold text-[10px] uppercase tracking-wider px-2.5 py-1.5 rounded-xl shadow-[0_3px_0_#3f8f01] active:translate-y-[3px] active:shadow-none transition-all cursor-pointer shrink-0"
                      >
                        {claiming === index + 1 ? "..." : "Claim"}
                      </button>
                    ) : (
                      <div className="shrink-0 opacity-70 select-none">
                        <Image src="/emoji/quest.webp" alt="Quest Chest" width={28} height={28} className="object-contain grayscale" unoptimized />
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Profile / Auth Widget */}
      {!isSignedIn && (
        <div className="border-2 border-cloud-gray rounded-2xl p-5 flex flex-col gap-4 bg-snow-white">
          <h3 className="font-bold text-[17px] text-charcoal">Create a profile to save your progress!</h3>
          <div className="flex flex-col gap-3">
            <Link href="/signup" className="w-full">
              <button className="w-full bg-duo-green text-white font-bold py-3 rounded-xl hover:brightness-110 transition-colors shadow-[0_4px_0_#3f8f01] active:shadow-[0_0px_0_#3f8f01] active:translate-y-1 uppercase tracking-widest text-body">
                Sign Up
              </button>
            </Link>
          </div>
        </div>
      )}

    </div>
  );
}
