"use client";

import React, { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useUser } from "@clerk/nextjs";
import { supabase } from "@/lib/supabase";
import { refillHeartsInDb } from "@/lib/session";
import { useAlert } from "@/components/ui/AlertContext";
import { useStats } from "@/components/ui/StatsContext";
import { StreakAsset } from "@/components/ui/StreakAsset";

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
      image: "/img/gen_imgs/silver_league.webp",
    };
  }
  return {
    name: "Bronze League",
    image: "/img/gen_imgs/league_/bronze_league.webp",
  };
}

export default function ShopPage() {
  const { showAlert } = useAlert();
  const { user, isLoaded, isSignedIn } = useUser();
  const { streak, xp, hearts, gems, streakFreezeCount, refreshStats, updateStatsLocally } = useStats();

  const [purchasingHeart, setPurchasingHeart] = useState(false);
  const [purchasingFreeze, setPurchasingFreeze] = useState(false);
  const [heartCost, setHeartCost] = useState(50);
  const [streakFreezeCost, setStreakFreezeCost] = useState(200);

  // Power-Ups counts
  const [doubleXpCount, setDoubleXpCount] = useState(0);
  const [card5050Count, setCard5050Count] = useState(0);
  const [skipCardCount, setSkipCardCount] = useState(0);
  const [hintCardCount, setHintCardCount] = useState(0);

  const [doubleXpExpiresAt, setDoubleXpExpiresAt] = useState<number>(0);
  const [doubleXpTimeLeft, setDoubleXpTimeLeft] = useState<string>("");

  // Premium Study Resources unlock flags
  const [mockExamsUnlocked, setMockExamsUnlocked] = useState(false);
  const [focusPacksUnlocked, setFocusPacksUnlocked] = useState(false);
  const [pdfCheatSheetsUnlocked, setPdfCheatSheetsUnlocked] = useState(false);

  // Cosmetics unlock flags & equipment
  const [neonThemeUnlocked, setNeonThemeUnlocked] = useState(false);
  const [sakuraThemeUnlocked, setSakuraThemeUnlocked] = useState(false);
  const [goldenFrameUnlocked, setGoldenFrameUnlocked] = useState(false);
  const [civilServantBadgeUnlocked, setCivilServantBadgeUnlocked] = useState(false);

  const [equippedTheme, setEquippedTheme] = useState("default");
  const [equippedFrame, setEquippedFrame] = useState("none");
  const [equippedBadge, setEquippedBadge] = useState("none");

  const [purchasingItemId, setPurchasingItemId] = useState<string | null>(null);

  // Leaderboard data states
  const [userRank, setUserRank] = useState<number | null>(null);
  const [totalScore, setTotalScore] = useState(0);
  const [lessonsCompletedCount, setLessonsCompletedCount] = useState(0);

  // Daily Quests states
  const [dailyXp, setDailyXp] = useState(0);
  const [dailyLessons, setDailyLessons] = useState(0);
  const [dailyPassed, setDailyPassed] = useState(0);

  const [quest1Claimed, setQuest1Claimed] = useState(false);
  const [quest2Claimed, setQuest2Claimed] = useState(false);
  const [quest3Claimed, setQuest3Claimed] = useState(false);

  const [claimingQuest, setClaimingQuest] = useState<number | null>(null);

  useEffect(() => {
    fetch("/api/admin/economy")
      .then((res) => res.json())
      .then((data) => {
        if (data && !data.error) {
          if (data.heartCost) setHeartCost(data.heartCost);
          if (data.streakFreezeCost) setStreakFreezeCost(data.streakFreezeCost);
        }
      })
      .catch((err) => console.error("Error loading shop economy config:", err));

    if (typeof window !== "undefined") {
      setDoubleXpCount(parseInt(localStorage.getItem("powerup_double_xp_count") || "0", 10));
      setCard5050Count(parseInt(localStorage.getItem("powerup_5050_card_count") || "0", 10));
      setSkipCardCount(parseInt(localStorage.getItem("powerup_skip_card_count") || "0", 10));
      setHintCardCount(parseInt(localStorage.getItem("powerup_hint_card_count") || "0", 10));
      setDoubleXpExpiresAt(parseInt(localStorage.getItem("double_xp_expires_at") || "0", 10));

      setMockExamsUnlocked(localStorage.getItem("resource_premium_mock_exams_unlocked") === "true");
      setFocusPacksUnlocked(localStorage.getItem("resource_focus_study_packs_unlocked") === "true");
      setPdfCheatSheetsUnlocked(localStorage.getItem("resource_pdf_cheat_sheets_unlocked") === "true");

      setNeonThemeUnlocked(localStorage.getItem("cosmetic_theme_neon_unlocked") === "true");
      setSakuraThemeUnlocked(localStorage.getItem("cosmetic_theme_sakura_unlocked") === "true");
      setGoldenFrameUnlocked(localStorage.getItem("cosmetic_frame_golden_unlocked") === "true");
      setCivilServantBadgeUnlocked(localStorage.getItem("cosmetic_badge_civil_servant_unlocked") === "true");

      setEquippedTheme(localStorage.getItem("cosmetics_selected_theme") || "default");
      setEquippedFrame(localStorage.getItem("cosmetics_selected_frame") || "none");
      setEquippedBadge(localStorage.getItem("cosmetics_selected_badge") || "none");
    }
  }, []);

  useEffect(() => {
    const updateTimer = () => {
      const now = Date.now();
      if (now < doubleXpExpiresAt) {
        const diff = doubleXpExpiresAt - now;
        const minutes = Math.floor(diff / 60000);
        const seconds = Math.floor((diff % 60000) / 1000);
        setDoubleXpTimeLeft(`${minutes}:${seconds.toString().padStart(2, "0")} LEFT`);
      } else {
        setDoubleXpTimeLeft("");
      }
    };
    updateTimer();
    const interval = setInterval(updateTimer, 1000);
    return () => clearInterval(interval);
  }, [doubleXpExpiresAt]);

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
    fetchQuestsData();
    window.addEventListener("reviewer-db-update", fetchQuestsData);
    return () => {
      window.removeEventListener("reviewer-db-update", fetchQuestsData);
    };
  }, []);

  useEffect(() => {
    if (!isSignedIn || !user) return;

    const fetchRank = async () => {
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
        console.error("Failed to load user rank for shop:", err);
      }
    };

    fetchRank();
    window.addEventListener("reviewer-db-update", fetchRank);
    return () => {
      window.removeEventListener("reviewer-db-update", fetchRank);
    };
  }, [user, isSignedIn]);

  const handleClaimQuest = async (questNum: number, gemReward: number) => {
    setClaimingQuest(questNum);
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
          localStorage.setItem(`quest_${questNum}_claimed`, "true");
          updateStatsLocally({ gems: gems + gemReward });
          await refreshStats();
          if (questNum === 1) setQuest1Claimed(true);
          if (questNum === 2) setQuest2Claimed(true);
          if (questNum === 3) setQuest3Claimed(true);
          if (typeof window !== "undefined") {
            window.dispatchEvent(new CustomEvent("reviewer-db-update"));
          }
          await showAlert(`🎉 Quest completed! You received 💎 ${gemReward} Gems.`);
        } else {
          await showAlert("❌ Claim failed: " + error.message);
        }
      } catch (err) {
        console.error(err);
      }
    }
    setClaimingQuest(null);
  };

  const handleBuyItem = async (
    itemId: string,
    cost: number,
    updateState: () => void,
    onSuccessMsg: string
  ) => {
    if (gems < cost) {
      await showAlert(`❌ Not enough Gems! You need ${cost} Gems.`);
      return;
    }

    setPurchasingItemId(itemId);
    let profileId: string | null = null;
    if (user) {
      profileId = user.id;
    }

    if (profileId) {
      try {
        const nextGems = Math.max(0, gems - cost);
        const { error } = await supabase
          .from("profile_game_state")
          .update({
            gems: nextGems
          })
          .eq("profile_id", profileId);

        if (!error) {
          updateStatsLocally({ gems: nextGems });
          await refreshStats();
          updateState();
          if (typeof window !== "undefined") {
            window.dispatchEvent(new CustomEvent("reviewer-db-update"));
          }
          await showAlert(`🎉 ${onSuccessMsg}`);
        } else {
          await showAlert("❌ Purchase failed: " + error.message);
        }
      } catch (err: any) {
        await showAlert("❌ An error occurred: " + err.message);
      }
    } else {
      await showAlert("❌ You must be signed in to purchase items.");
    }
    setPurchasingItemId(null);
  };

  const handleEquipCosmetic = (type: "theme" | "frame" | "badge", value: string) => {
    if (type === "theme") {
      setEquippedTheme(value);
      localStorage.setItem("cosmetics_selected_theme", value);
      window.dispatchEvent(new CustomEvent("cosmetics-update", { detail: { type, value } }));
    } else if (type === "frame") {
      setEquippedFrame(value);
      localStorage.setItem("cosmetics_selected_frame", value);
      window.dispatchEvent(new CustomEvent("cosmetics-update", { detail: { type, value } }));
    } else if (type === "badge") {
      setEquippedBadge(value);
      localStorage.setItem("cosmetics_selected_badge", value);
      window.dispatchEvent(new CustomEvent("cosmetics-update", { detail: { type, value } }));
    }
  };

  const handleBuyHeart = async () => {
    if (gems < heartCost) {
      await showAlert(`❌ Not enough Gems! You need ${heartCost} Gems to refill hearts.`);
      return;
    }
    if (hearts === 5) {
      await showAlert("❤️ Your hearts are already full!");
      return;
    }

    setPurchasingHeart(true);
    let profileId: string | null = null;
    if (user) {
      profileId = user.id;
    }

    if (profileId) {
      const res = await refillHeartsInDb(profileId);
      if (res.success) {
        updateStatsLocally({ gems: Math.max(0, gems - heartCost), hearts: 5 });
        await refreshStats();
        if (typeof window !== "undefined") {
          window.dispatchEvent(new CustomEvent("reviewer-db-update"));
        }
        await showAlert("❤️ Hearts refilled successfully!");
      } else {
        await showAlert("❌ Purchase failed: " + res.error);
      }
    }
    setPurchasingHeart(false);
  };

  const handleBuyFreeze = async () => {
    if (gems < streakFreezeCost) {
      await showAlert(`❌ Not enough Gems! You need ${streakFreezeCost} Gems to buy a Streak Freeze.`);
      return;
    }
    if (streakFreezeCount >= 2) {
      await showAlert("❄️ You can only equip a maximum of 2 Streak Freezes!");
      return;
    }

    setPurchasingFreeze(true);
    let profileId: string | null = null;
    if (user) {
      profileId = user.id;
    }

    if (profileId) {
      try {
        const nextGems = Math.max(0, gems - streakFreezeCost);
        const nextFreeze = streakFreezeCount + 1;
        const { error } = await supabase
          .from("profile_game_state")
          .update({
            gems: nextGems,
            streak_freeze_count: nextFreeze
          })
          .eq("profile_id", profileId);

        if (!error) {
          updateStatsLocally({ gems: nextGems, streakFreezeCount: nextFreeze });
          await refreshStats();
          localStorage.setItem("streak_freeze_count", nextFreeze.toString());
          if (typeof window !== "undefined") {
            window.dispatchEvent(new CustomEvent("reviewer-db-update"));
          }
          await showAlert("❄️ Streak Freeze purchased! Equipped.");
        } else {
          await showAlert("❌ Purchase failed: " + error.message);
        }
      } catch (err: any) {
        await showAlert("❌ An error occurred: " + err.message);
      }
    }
    setPurchasingFreeze(false);
  };

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
    <>
      {/* Center Column */}
      <main className="flex-1 w-full max-w-[600px] mx-auto pb-24 flex flex-col gap-8 pt-4 md:pt-8 px-4 font-din-round relative">

        {/* Shop Content Container */}
        <div className={`flex flex-col gap-8 w-full ${(!isSignedIn || !user) ? "select-none pointer-events-none filter blur-[3px] opacity-40" : ""}`}>

          {/* Hearts Section */}
          <div className="flex flex-col gap-4">
            <h2 className="font-feather text-xl md:text-2xl text-almost-black font-bold tracking-wide border-b-2 border-cloud-gray pb-2">
              Hearts
            </h2>

            <div className="flex flex-col md:flex-row items-center md:justify-between text-center md:text-left p-3 md:p-4 rounded-2xl bg-snow-white gap-3 md:gap-4 h-full md:h-auto min-w-0 border-none">
              <div className="flex flex-col md:flex-row items-center gap-2 md:gap-4 w-full md:w-auto min-w-0">
                <div className="w-22 h-14 flex items-center justify-center shrink-0 relative">
                  <Image
                    src="/img/gen_imgs/user_life.webp"
                    alt="Life"
                    width={42}
                    height={42}
                    className="object-contain"
                  />
                </div>
                <div className="flex flex-col items-center md:items-start text-center md:text-left min-w-0">
                  <span className="font-bold text-sm md:text-lg text-almost-black leading-tight">Refill Hearts</span>
                  <span className="hidden md:block text-silver text-xs font-semibold leading-normal max-w-[320px]">
                    Get full hearts so you can worry less about making mistakes.
                  </span>
                </div>
              </div>
              <button
                disabled={hearts === 5 || purchasingHeart}
                onClick={handleBuyHeart}
                className="w-full md:w-auto bg-duo-green hover:bg-duo-green/95 text-white font-extrabold px-3 md:px-4 py-2.5 rounded-xl text-[10px] md:text-xs uppercase tracking-wider shrink-0 cursor-pointer shadow-[0_4px_0_#3f8f01] active:translate-y-[4px] active:shadow-none transition-all disabled:opacity-50 disabled:cursor-not-allowed disabled:bg-cloud-gray disabled:text-silver disabled:shadow-none"
              >
                {hearts === 5 ? (
                  "FULL"
                ) : purchasingHeart ? (
                  "BUYING..."
                ) : (
                  <span className="flex items-center justify-center gap-1">
                    GET FOR <Image src="/img/gen_imgs/diamond.webp" alt="Gems" width={16} height={16} className="inline object-contain" /> {heartCost}
                  </span>
                )}
              </button>
            </div>
          </div>

          {/* Power-Ups Section */}
          <div className="flex flex-col gap-4">
            <h2 className="font-feather text-xl md:text-2xl text-almost-black font-bold tracking-wide border-b-2 border-cloud-gray pb-2">
              Power-Ups
            </h2>

            <div className="grid grid-cols-2 md:grid-cols-1 gap-4">
              {/* Streak Freeze */}
              <div className="flex flex-col md:flex-row items-center md:justify-between text-center md:text-left p-3 md:p-4 rounded-2xl bg-snow-white gap-3 md:gap-4 h-full md:h-auto min-w-0 border-none">
                <div className="flex flex-col md:flex-row items-center gap-2 md:gap-4 w-full md:w-auto min-w-0">
                  <div className="w-22 h-14 flex items-center justify-center shrink-0 relative">
                    <Image
                      src="/img/gen_imgs/Streak/streak_freeze.webp"
                      alt="Streak Freeze"
                      width={42}
                      height={42}
                      className="object-contain"
                    />
                  </div>
                  <div className="flex flex-col items-center md:items-start text-center md:text-left min-w-0">
                    <div className="flex flex-col md:flex-row items-center gap-1 md:gap-2">
                      <span className="font-bold text-sm md:text-lg text-almost-black leading-tight">Streak Freeze</span>
                      <span className="bg-duo-green/10 text-duo-green text-[9px] md:text-[10px] font-black px-1.5 py-0.5 md:px-2 rounded-full uppercase tracking-wider shrink-0">
                        <span className="inline md:hidden">{streakFreezeCount}/2 EQ</span>
                        <span className="hidden md:inline">{streakFreezeCount} / 2 EQUIPPED</span>
                      </span>
                    </div>
                    <span className="hidden md:block text-silver text-xs font-semibold leading-normal max-w-[320px]">
                      Streak Freeze allows your streak to remain in place for one full day of inactivity.
                    </span>
                  </div>
                </div>
                <button
                  disabled={streakFreezeCount >= 2 || purchasingFreeze}
                  onClick={handleBuyFreeze}
                  className="w-full md:w-auto bg-duo-green hover:bg-duo-green/95 text-white font-extrabold px-3 md:px-4 py-2.5 rounded-xl text-[10px] md:text-xs uppercase tracking-wider shrink-0 cursor-pointer shadow-[0_4px_0_#3f8f01] active:translate-y-[4px] active:shadow-none transition-all disabled:opacity-50 disabled:cursor-not-allowed disabled:bg-cloud-gray disabled:text-silver disabled:shadow-none"
                >
                  {streakFreezeCount >= 2 ? (
                    "EQUIPPED"
                  ) : purchasingFreeze ? (
                    "BUYING..."
                  ) : (
                    <span className="flex items-center justify-center gap-1">
                      GET FOR <Image src="/img/gen_imgs/diamond.webp" alt="Gems" width={16} height={16} className="inline object-contain" /> {streakFreezeCost}
                    </span>
                  )}
                </button>
              </div>

              {/* Double XP */}
              <div className="flex flex-col md:flex-row items-center md:justify-between text-center md:text-left p-3 md:p-4 rounded-2xl bg-snow-white gap-3 md:gap-4 h-full md:h-auto min-w-0 border-none">
                <div className="flex flex-col md:flex-row items-center gap-2 md:gap-4 w-full md:w-auto min-w-0">
                  <div className="w-22 h-14 flex items-center justify-center shrink-0 relative">
                    <Image
                      src="/img/gen_imgs/exp.webp"
                      alt="Double XP"
                      width={42}
                      height={42}
                      className="object-contain"
                    />
                  </div>
                  <div className="flex flex-col items-center md:items-start text-center md:text-left min-w-0">
                    <div className="flex flex-col md:flex-row items-center gap-1 md:gap-2">
                      <span className="font-bold text-sm md:text-lg text-almost-black leading-tight">Double XP</span>
                      {doubleXpTimeLeft ? (
                        <span className="bg-amber-500/10 text-amber-500 text-[9px] md:text-[10px] font-black px-1.5 py-0.5 md:px-2 rounded-full uppercase tracking-wider shrink-0 animate-pulse">
                          ACTIVE • {doubleXpTimeLeft}
                        </span>
                      ) : (
                        <span className="bg-duo-green/10 text-duo-green text-[9px] md:text-[10px] font-black px-1.5 py-0.5 md:px-2 rounded-full uppercase tracking-wider shrink-0">
                          {doubleXpCount} OWNED
                        </span>
                      )}
                    </div>
                    <span className="hidden md:block text-silver text-xs font-semibold leading-normal max-w-[320px]">
                      Get double XP for the next 30 minutes of studying.
                    </span>
                  </div>
                </div>
                <button
                  disabled={purchasingItemId !== null}
                  onClick={() =>
                    handleBuyItem(
                      "double_xp",
                      150,
                      () => {
                        const currentExpiry = Math.max(Date.now(), doubleXpExpiresAt);
                        const nextExpiry = currentExpiry + 30 * 60 * 1000;
                        setDoubleXpExpiresAt(nextExpiry);
                        localStorage.setItem("double_xp_expires_at", nextExpiry.toString());
                        const nextCount = doubleXpCount + 1;
                        setDoubleXpCount(nextCount);
                        localStorage.setItem("powerup_double_xp_count", nextCount.toString());
                      },
                      "Double XP Booster purchased & activated!"
                    )
                  }
                  className="w-full md:w-auto bg-duo-green hover:bg-duo-green/95 text-white font-extrabold px-3 md:px-4 py-2.5 rounded-xl text-[10px] md:text-xs uppercase tracking-wider shrink-0 cursor-pointer shadow-[0_4px_0_#3f8f01] active:translate-y-[4px] active:shadow-none transition-all disabled:opacity-50 disabled:cursor-not-allowed disabled:bg-cloud-gray disabled:text-silver disabled:shadow-none"
                >
                  {purchasingItemId === "double_xp" ? (
                    "BUYING..."
                  ) : (
                    <span className="flex items-center justify-center gap-1">
                      GET FOR <Image src="/img/gen_imgs/diamond.webp" alt="Gems" width={16} height={16} className="inline object-contain" /> 150
                    </span>
                  )}
                </button>
              </div>

              {/* 50/50 Card */}
              <div className="flex flex-col md:flex-row items-center md:justify-between text-center md:text-left p-3 md:p-4 rounded-2xl bg-snow-white gap-3 md:gap-4 h-full md:h-auto min-w-0 border-none">
                <div className="flex flex-col md:flex-row items-center gap-2 md:gap-4 w-full md:w-auto min-w-0">
                  <div className="w-22 h-14 flex items-center justify-center shrink-0">
                    <span className="text-3xl">🌓</span>
                  </div>
                  <div className="flex flex-col items-center md:items-start text-center md:text-left min-w-0">
                    <div className="flex flex-col md:flex-row items-center gap-1 md:gap-2">
                      <span className="font-bold text-sm md:text-lg text-almost-black leading-tight">50/50 Card</span>
                      <span className="bg-duo-green/10 text-duo-green text-[9px] md:text-[10px] font-black px-1.5 py-0.5 md:px-2 rounded-full uppercase tracking-wider shrink-0">
                        {card5050Count} OWNED
                      </span>
                    </div>
                    <span className="hidden md:block text-silver text-xs font-semibold leading-normal max-w-[320px]">
                      Eliminates two incorrect options from a multiple-choice question.
                    </span>
                  </div>
                </div>
                <button
                  disabled={purchasingItemId !== null}
                  onClick={() =>
                    handleBuyItem(
                      "5050_card",
                      75,
                      () => {
                        const next = card5050Count + 1;
                        setCard5050Count(next);
                        localStorage.setItem("powerup_5050_card_count", next.toString());
                      },
                      "50/50 Card purchased!"
                    )
                  }
                  className="w-full md:w-auto bg-duo-green hover:bg-duo-green/95 text-white font-extrabold px-3 md:px-4 py-2.5 rounded-xl text-[10px] md:text-xs uppercase tracking-wider shrink-0 cursor-pointer shadow-[0_4px_0_#3f8f01] active:translate-y-[4px] active:shadow-none transition-all disabled:opacity-50 disabled:cursor-not-allowed disabled:bg-cloud-gray disabled:text-silver disabled:shadow-none"
                >
                  {purchasingItemId === "5050_card" ? (
                    "BUYING..."
                  ) : (
                    <span className="flex items-center justify-center gap-1">
                      GET FOR <Image src="/img/gen_imgs/diamond.webp" alt="Gems" width={16} height={16} className="inline object-contain" /> 75
                    </span>
                  )}
                </button>
              </div>

              {/* Skip Card */}
              <div className="flex flex-col md:flex-row items-center md:justify-between text-center md:text-left p-3 md:p-4 rounded-2xl bg-snow-white gap-3 md:gap-4 h-full md:h-auto min-w-0 border-none">
                <div className="flex flex-col md:flex-row items-center gap-2 md:gap-4 w-full md:w-auto min-w-0">
                  <div className="w-22 h-14 flex items-center justify-center shrink-0">
                    <span className="text-3xl">⏭️</span>
                  </div>
                  <div className="flex flex-col items-center md:items-start text-center md:text-left min-w-0">
                    <div className="flex flex-col md:flex-row items-center gap-1 md:gap-2">
                      <span className="font-bold text-sm md:text-lg text-almost-black leading-tight">Skip Card</span>
                      <span className="bg-duo-green/10 text-duo-green text-[9px] md:text-[10px] font-black px-1.5 py-0.5 md:px-2 rounded-full uppercase tracking-wider shrink-0">
                        {skipCardCount} OWNED
                      </span>
                    </div>
                    <span className="hidden md:block text-silver text-xs font-semibold leading-normal max-w-[320px]">
                      Allows you to skip a question without losing a heart.
                    </span>
                  </div>
                </div>
                <button
                  disabled={purchasingItemId !== null}
                  onClick={() =>
                    handleBuyItem(
                      "skip_card",
                      100,
                      () => {
                        const next = skipCardCount + 1;
                        setSkipCardCount(next);
                        localStorage.setItem("powerup_skip_card_count", next.toString());
                      },
                      "Question Skip Card purchased!"
                    )
                  }
                  className="w-full md:w-auto bg-duo-green hover:bg-duo-green/95 text-white font-extrabold px-3 md:px-4 py-2.5 rounded-xl text-[10px] md:text-xs uppercase tracking-wider shrink-0 cursor-pointer shadow-[0_4px_0_#3f8f01] active:translate-y-[4px] active:shadow-none transition-all disabled:opacity-50 disabled:cursor-not-allowed disabled:bg-cloud-gray disabled:text-silver disabled:shadow-none"
                >
                  {purchasingItemId === "skip_card" ? (
                    "BUYING..."
                  ) : (
                    <span className="flex items-center justify-center gap-1">
                      GET FOR <Image src="/img/gen_imgs/diamond.webp" alt="Gems" width={16} height={16} className="inline object-contain" /> 100
                    </span>
                  )}
                </button>
              </div>

              {/* Hint Card */}
              <div className="flex flex-col md:flex-row items-center md:justify-between text-center md:text-left p-3 md:p-4 rounded-2xl bg-snow-white gap-3 md:gap-4 h-full md:h-auto min-w-0 border-none">
                <div className="flex flex-col md:flex-row items-center gap-2 md:gap-4 w-full md:w-auto min-w-0">
                  <div className="w-22 h-14 flex items-center justify-center shrink-0">
                    <span className="text-3xl">💡</span>
                  </div>
                  <div className="flex flex-col items-center md:items-start text-center md:text-left min-w-0">
                    <div className="flex flex-col md:flex-row items-center gap-1 md:gap-2">
                      <span className="font-bold text-sm md:text-lg text-almost-black leading-tight">Hint Card</span>
                      <span className="bg-duo-green/10 text-duo-green text-[9px] md:text-[10px] font-black px-1.5 py-0.5 md:px-2 rounded-full uppercase tracking-wider shrink-0">
                        {hintCardCount} OWNED
                      </span>
                    </div>
                    <span className="hidden md:block text-silver text-xs font-semibold leading-normal max-w-[320px]">
                      Unlocks detailed formulas/explainers for numerical reasoning questions.
                    </span>
                  </div>
                </div>
                <button
                  disabled={purchasingItemId !== null}
                  onClick={() =>
                    handleBuyItem(
                      "hint_card",
                      40,
                      () => {
                        const next = hintCardCount + 1;
                        setHintCardCount(next);
                        localStorage.setItem("powerup_hint_card_count", next.toString());
                      },
                      "Hint Card purchased!"
                    )
                  }
                  className="w-full md:w-auto bg-duo-green hover:bg-duo-green/95 text-white font-extrabold px-3 md:px-4 py-2.5 rounded-xl text-[10px] md:text-xs uppercase tracking-wider shrink-0 cursor-pointer shadow-[0_4px_0_#3f8f01] active:translate-y-[4px] active:shadow-none transition-all disabled:opacity-50 disabled:cursor-not-allowed disabled:bg-cloud-gray disabled:text-silver disabled:shadow-none"
                >
                  {purchasingItemId === "hint_card" ? (
                    "BUYING..."
                  ) : (
                    <span className="flex items-center justify-center gap-1">
                      GET FOR <Image src="/img/gen_imgs/diamond.webp" alt="Gems" width={16} height={16} className="inline object-contain" /> 40
                    </span>
                  )}
                </button>
              </div>
            </div>
          </div>

          {/* Premium Study Resources Section */}
          <div className="flex flex-col gap-4">
            <h2 className="font-feather text-xl md:text-2xl text-almost-black font-bold tracking-wide border-b-2 border-cloud-gray pb-2">
              Premium Study Resources
            </h2>

            <div className="grid grid-cols-2 md:grid-cols-1 gap-4">
              {/* Premium Mock Exam Packs */}
              <div className="flex flex-col md:flex-row items-center md:justify-between text-center md:text-left p-3 md:p-4 rounded-2xl bg-snow-white gap-3 md:gap-4 h-full md:h-auto min-w-0 border-none">
                <div className="flex flex-col md:flex-row items-center gap-2 md:gap-4 w-full md:w-auto min-w-0">
                  <div className="w-22 h-14 flex items-center justify-center shrink-0">
                    <span className="text-2xl md:text-3xl">📚</span>
                  </div>
                  <div className="flex flex-col items-center md:items-start text-center md:text-left min-w-0">
                    <div className="flex flex-col md:flex-row items-center gap-1 md:gap-2">
                      <span className="font-bold text-sm md:text-lg text-almost-black leading-tight">Mock Exams</span>
                      {mockExamsUnlocked && (
                        <span className="bg-duo-green/10 text-duo-green text-[9px] md:text-[10px] font-black px-1.5 py-0.5 md:px-2 rounded-full uppercase tracking-wider shrink-0">
                          UNLOCKED
                        </span>
                      )}
                    </div>
                    <span className="hidden md:block text-silver text-xs font-semibold leading-normal max-w-[320px]">
                      Unlock full-length, 150-question simulated CSE exams.
                    </span>
                  </div>
                </div>
                <button
                  disabled
                  className="w-full md:w-auto bg-cloud-gray text-silver font-extrabold px-4 py-2.5 rounded-xl text-[10px] md:text-xs uppercase tracking-wider shrink-0 cursor-not-allowed border-none shadow-none"
                >
                  COMING SOON
                </button>
              </div>

              {/* Focus Study Packs */}
              <div className="flex flex-col md:flex-row items-center md:justify-between text-center md:text-left p-3 md:p-4 rounded-2xl bg-snow-white gap-3 md:gap-4 h-full md:h-auto min-w-0 border-none">
                <div className="flex flex-col md:flex-row items-center gap-2 md:gap-4 w-full md:w-auto min-w-0">
                  <div className="w-22 h-14 flex items-center justify-center shrink-0">
                    <span className="text-3xl">🎯</span>
                  </div>
                  <div className="flex flex-col items-center md:items-start text-center md:text-left min-w-0">
                    <div className="flex flex-col md:flex-row items-center gap-1 md:gap-2">
                      <span className="font-bold text-sm md:text-lg text-almost-black leading-tight">Focus Packs</span>
                      {focusPacksUnlocked && (
                        <span className="bg-duo-green/10 text-duo-green text-[9px] md:text-[10px] font-black px-1.5 py-0.5 md:px-2 rounded-full uppercase tracking-wider shrink-0">
                          UNLOCKED
                        </span>
                      )}
                    </div>
                    <span className="hidden md:block text-silver text-xs font-semibold leading-normal max-w-[320px]">
                      Practice target sub-topics: Constitution, Numerical, or Vocabulary.
                    </span>
                  </div>
                </div>
                <button
                  disabled
                  className="w-full md:w-auto bg-cloud-gray text-silver font-extrabold px-4 py-2.5 rounded-xl text-[10px] md:text-xs uppercase tracking-wider shrink-0 cursor-not-allowed border-none shadow-none"
                >
                  COMING SOON
                </button>
              </div>

              {/* Downloadable PDF Cheat Sheets */}
              <div className="flex flex-col md:flex-row items-center md:justify-between text-center md:text-left p-3 md:p-4 rounded-2xl bg-snow-white gap-3 md:gap-4 h-full md:h-auto min-w-0 border-none">
                <div className="flex flex-col md:flex-row items-center gap-2 md:gap-4 w-full md:w-auto min-w-0">
                  <div className="w-22 h-14 flex items-center justify-center shrink-0">
                    <span className="text-3xl">📄</span>
                  </div>
                  <div className="flex flex-col items-center md:items-start text-center md:text-left min-w-0">
                    <div className="flex flex-col md:flex-row items-center gap-1 md:gap-2">
                      <span className="font-bold text-sm md:text-lg text-almost-black leading-tight">PDF Sheets</span>
                      {pdfCheatSheetsUnlocked && (
                        <span className="bg-duo-green/10 text-duo-green text-[9px] md:text-[10px] font-black px-1.5 py-0.5 md:px-2 rounded-full uppercase tracking-wider shrink-0">
                          UNLOCKED
                        </span>
                      )}
                    </div>
                    <span className="hidden md:block text-silver text-xs font-semibold leading-normal max-w-[320px]">
                      Download printable cheat sheets with formulas, vocabulary, and exam tips.
                    </span>
                  </div>
                </div>
                <button
                  disabled
                  className="w-full md:w-auto bg-cloud-gray text-silver font-extrabold px-4 py-2.5 rounded-xl text-[10px] md:text-xs uppercase tracking-wider shrink-0 cursor-not-allowed border-none shadow-none"
                >
                  COMING SOON
                </button>
              </div>
            </div>
          </div>

          {/* Cosmetics & Personalization Section */}
          <div className="flex flex-col gap-4">
            <h2 className="font-feather text-xl md:text-2xl text-almost-black font-bold tracking-wide border-b-2 border-cloud-gray pb-2">
              Cosmetics & Personalization
            </h2>

            <div className="grid grid-cols-2 md:grid-cols-1 gap-4">
              {/* Neon Glow Theme */}
              <div className="flex flex-col md:flex-row items-center md:justify-between text-center md:text-left p-3 md:p-4 rounded-2xl bg-snow-white gap-3 md:gap-4 h-full md:h-auto min-w-0 border-none">
                <div className="flex flex-col md:flex-row items-center gap-2 md:gap-4 w-full md:w-auto min-w-0">
                  <div className="w-22 h-14 flex items-center justify-center shrink-0">
                    <span className="text-3xl">🎨</span>
                  </div>
                  <div className="flex flex-col items-center md:items-start text-center md:text-left min-w-0">
                    <div className="flex flex-col md:flex-row items-center gap-1 md:gap-2">
                      <span className="font-bold text-sm md:text-lg text-almost-black leading-tight">Neon Theme</span>
                      {equippedTheme === "neon" && (
                        <span className="bg-duo-green/10 text-duo-green text-[9px] md:text-[10px] font-black px-1.5 py-0.5 md:px-2 rounded-full uppercase tracking-wider shrink-0">
                          EQUIPPED
                        </span>
                      )}
                    </div>
                    <span className="hidden md:block text-silver text-xs font-semibold leading-normal max-w-[320px]">
                      Give your application a dark, sleek design with vibrant neon highlights.
                    </span>
                  </div>
                </div>
                <button
                  disabled
                  className="w-full md:w-auto bg-cloud-gray text-silver font-extrabold px-4 py-2.5 rounded-xl text-[10px] md:text-xs uppercase tracking-wider shrink-0 cursor-not-allowed border-none shadow-none"
                >
                  COMING SOON
                </button>
              </div>

              {/* Sakura Theme */}
              <div className="flex flex-col md:flex-row items-center md:justify-between text-center md:text-left p-3 md:p-4 rounded-2xl bg-snow-white gap-3 md:gap-4 h-full md:h-auto min-w-0 border-none">
                <div className="flex flex-col md:flex-row items-center gap-2 md:gap-4 w-full md:w-auto min-w-0">
                  <div className="w-22 h-14 flex items-center justify-center shrink-0">
                    <span className="text-3xl">🌸</span>
                  </div>
                  <div className="flex flex-col items-center md:items-start text-center md:text-left min-w-0">
                    <div className="flex flex-col md:flex-row items-center gap-1 md:gap-2">
                      <span className="font-bold text-sm md:text-lg text-almost-black leading-tight">Sakura Theme</span>
                      {equippedTheme === "sakura" && (
                        <span className="bg-duo-green/10 text-duo-green text-[9px] md:text-[10px] font-black px-1.5 py-0.5 md:px-2 rounded-full uppercase tracking-wider shrink-0">
                          EQUIPPED
                        </span>
                      )}
                    </div>
                    <span className="hidden md:block text-silver text-xs font-semibold leading-normal max-w-[320px]">
                      Decorate the interface in a calming cherry blossom theme.
                    </span>
                  </div>
                </div>
                <button
                  disabled
                  className="w-full md:w-auto bg-cloud-gray text-silver font-extrabold px-4 py-2.5 rounded-xl text-[10px] md:text-xs uppercase tracking-wider shrink-0 cursor-not-allowed border-none shadow-none"
                >
                  COMING SOON
                </button>
              </div>

              {/* Golden Avatar Frame */}
              <div className="flex flex-col md:flex-row items-center md:justify-between text-center md:text-left p-3 md:p-4 rounded-2xl bg-snow-white gap-3 md:gap-4 h-full md:h-auto min-w-0 border-none">
                <div className="flex flex-col md:flex-row items-center gap-2 md:gap-4 w-full md:w-auto min-w-0">
                  <div className="w-22 h-14 flex items-center justify-center shrink-0">
                    <span className="text-3xl">🖼️</span>
                  </div>
                  <div className="flex flex-col items-center md:items-start text-center md:text-left min-w-0">
                    <div className="flex flex-col md:flex-row items-center gap-1 md:gap-2">
                      <span className="font-bold text-sm md:text-lg text-almost-black leading-tight">Golden Frame</span>
                      {equippedFrame === "golden" && (
                        <span className="bg-duo-green/10 text-duo-green text-[9px] md:text-[10px] font-black px-1.5 py-0.5 md:px-2 rounded-full uppercase tracking-wider shrink-0">
                          EQUIPPED
                        </span>
                      )}
                    </div>
                    <span className="hidden md:block text-silver text-xs font-semibold leading-normal max-w-[320px]">
                      Decorate your profile picture with a luxurious golden border on leaderboards.
                    </span>
                  </div>
                </div>
                <button
                  disabled
                  className="w-full md:w-auto bg-cloud-gray text-silver font-extrabold px-4 py-2.5 rounded-xl text-[10px] md:text-xs uppercase tracking-wider shrink-0 cursor-not-allowed border-none shadow-none"
                >
                  COMING SOON
                </button>
              </div>

              {/* "Civil Servant" Profile Badge */}
              <div className="flex flex-col md:flex-row items-center md:justify-between text-center md:text-left p-3 md:p-4 rounded-2xl bg-snow-white gap-3 md:gap-4 h-full md:h-auto min-w-0 border-none">
                <div className="flex flex-col md:flex-row items-center gap-2 md:gap-4 w-full md:w-auto min-w-0">
                  <div className="w-22 h-14 flex items-center justify-center shrink-0">
                    <span className="text-3xl">🏅</span>
                  </div>
                  <div className="flex flex-col items-center md:items-start text-center md:text-left min-w-0">
                    <div className="flex flex-col md:flex-row items-center gap-1 md:gap-2">
                      <span className="font-bold text-sm md:text-lg text-almost-black leading-tight">Servant Badge</span>
                      {equippedBadge === "civil_servant" && (
                        <span className="bg-duo-green/10 text-duo-green text-[9px] md:text-[10px] font-black px-1.5 py-0.5 md:px-2 rounded-full uppercase tracking-wider shrink-0">
                          EQUIPPED
                        </span>
                      )}
                    </div>
                    <span className="hidden md:block text-silver text-xs font-semibold leading-normal max-w-[320px]">
                      Display an honor badge next to your username to show your dedication.
                    </span>
                  </div>
                </div>
                <button
                  disabled
                  className="w-full md:w-auto bg-cloud-gray text-silver font-extrabold px-4 py-2.5 rounded-xl text-[10px] md:text-xs uppercase tracking-wider shrink-0 cursor-not-allowed border-none shadow-none"
                >
                  COMING SOON
                </button>
              </div>

              {/* Clear Selection Option */}
              <div className="flex flex-col md:flex-row items-center md:justify-between text-center md:text-left p-3 md:p-4 rounded-2xl bg-snow-white gap-3 md:gap-4 h-full md:h-auto min-w-0 border-none">
                <div className="flex flex-col md:flex-row items-center gap-2 md:gap-4 w-full md:w-auto min-w-0">
                  <div className="w-22 h-14 flex items-center justify-center shrink-0">
                    <span className="text-3xl">🧹</span>
                  </div>
                  <div className="flex flex-col items-center md:items-start text-center md:text-left min-w-0">
                    <span className="font-bold text-sm md:text-lg text-almost-black leading-tight">Default Styles</span>
                    <span className="hidden md:block text-silver text-xs font-semibold leading-normal max-w-[320px]">
                      Reset your theme, avatar frame, and profile badges to default settings.
                    </span>
                  </div>
                </div>
                <button
                  disabled={equippedTheme === "default" && equippedFrame === "none" && equippedBadge === "none"}
                  onClick={() => {
                    handleEquipCosmetic("theme", "default");
                    handleEquipCosmetic("frame", "none");
                    handleEquipCosmetic("badge", "none");
                  }}
                  className="w-full md:w-auto bg-duo-green hover:bg-duo-green/95 text-white font-extrabold px-3 md:px-4 py-2.5 rounded-xl text-[10px] md:text-xs uppercase tracking-wider shrink-0 cursor-pointer shadow-[0_4px_0_#3f8f01] active:translate-y-[4px] active:shadow-none transition-all disabled:opacity-50 disabled:cursor-not-allowed disabled:bg-cloud-gray disabled:text-silver disabled:shadow-none"
                >
                  RESET
                </button>
              </div>
            </div>
          </div>
        </div>

        {(!isSignedIn || !user) && (
          /* Create Profile Overlay Modal */
          <div className="fixed inset-0 flex items-center justify-center z-20 px-4">
            <div className="bg-snow-white border-2 border-cloud-gray border-b-8 rounded-[24px] w-full max-w-[420px] p-6 md:p-8 flex flex-col gap-6 text-center shadow-lg">
              {/* Animated coins/chest display */}
              <div className="w-full flex justify-center gap-2">
                <div className="w-28 h-28 relative">
                  <Image src="/emoji/quest.webp" alt="Treasure Chest" fill className="object-contain drop-shadow-md" unoptimized />
                </div>
              </div>

              <div className="flex flex-col gap-2">
                <h3 className="font-feather text-xl md:text-2xl text-almost-black font-bold tracking-wide">
                  You earned {gems} gems!
                </h3>
                <p className="text-silver text-xs md:text-sm font-semibold leading-relaxed px-2">
                  Create a profile to spend them in the store!
                </p>
              </div>

              <Link href="/signup" className="w-full">
                <button className="w-full bg-duo-green hover:bg-duo-green/90 text-white font-extrabold py-3.5 rounded-xl shadow-[0_4px_0_#3f8f01] active:translate-y-[4px] active:shadow-none transition-all uppercase tracking-widest text-sm font-din-round cursor-pointer">
                  CREATE A PROFILE
                </button>
              </Link>
            </div>
          </div>
        )}

      </main>

      {/* Right Sidebar */}
      <aside className="hidden lg:block w-[368px] shrink-0 pt-4 md:pt-8 font-din-round lg:sticky lg:top-6 lg:self-start lg:h-fit">
        <div className="flex flex-col gap-6">

          {/* Top Stats Bar */}
          <div className="flex items-center justify-between px-2 text-almost-black font-bold text-sm md:text-base">
            {/* Flag / Language */}
            <div className="flex items-center gap-1.5 cursor-pointer hover:bg-duo-green-light p-2 rounded-xl transition-colors">
              <span className="text-xl">🇵🇭</span>
              <span className="text-[12px] font-extrabold">1</span>
            </div>

            {/* Streak */}
            <div className="flex items-center gap-1.5 text-orange-500 cursor-pointer hover:bg-duo-green-light p-2 rounded-xl transition-colors">
              <StreakAsset
                streak={streak}
                width={28}
                height={28}
                className="object-contain"
              />
              <span>{streak}</span>
            </div>

            {/* XP / Gems */}
            <div className="flex items-center gap-1.5 text-blue-400 cursor-pointer hover:bg-duo-green-light p-2 rounded-xl transition-colors" title="Gems">
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
            <div className="flex items-center gap-1.5 text-red-500 cursor-pointer hover:bg-duo-green-light p-2 rounded-xl transition-colors">
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

          {/* Leaderboard / Unlock Leaderboards Widget */}
          {(() => {
            if (isSignedIn && user && userRank !== null) {
              const leagueInfo = getLeagueInfo(totalScore, lessonsCompletedCount, userRank);
              return (
                <div className="border-2 border-cloud-gray rounded-2xl p-5 flex flex-col gap-4 bg-snow-white">
                  <div className="flex justify-between items-center border-b-2 border-cloud-gray pb-2">
                    <h3 className="font-bold text-[17px] text-almost-black">{leagueInfo.name}</h3>
                    <Link href="/leaderboard" className="text-sky-blue font-bold text-xs uppercase tracking-wider cursor-pointer hover:underline">
                      View League
                    </Link>
                  </div>
                  <div className="flex items-center gap-4 mt-2">
                    <div className="w-20 h-20 relative shrink-0">
                      <Image
                        src={leagueInfo.image}
                        alt={leagueInfo.name}
                        fill
                        className="object-contain"
                        unoptimized
                      />
                    </div>
                    <div className="flex flex-col">
                      <p className="text-almost-black text-sm font-extrabold leading-tight">
                        You&apos;re ranked <span className="text-duo-green">#{userRank}</span>
                      </p>
                      <p className="text-silver text-[11px] font-semibold leading-normal mt-1">
                        {userRank === 1 ? "Keep it up to stay on top!" : "Keep it up to stay in the top 3!"}
                      </p>
                    </div>
                  </div>
                </div>
              );
            }

            return (
              <div className="border-2 border-cloud-gray rounded-2xl p-5 flex flex-col gap-4 bg-snow-white">
                <h3 className="font-bold text-[17px] text-almost-black border-b-2 border-cloud-gray pb-2">
                  Unlock Leaderboards!
                </h3>
                <div className="flex items-center gap-4 mt-1">
                  <div className="w-28 h-28 relative shrink-0">
                    <Image src="/emoji/unlockleaderboard.webp" alt="Leaderboard Locked" fill className="object-contain" unoptimized />
                  </div>
                  <p className="text-silver text-xs font-semibold leading-normal">
                    Complete 2 more lessons to start competing
                  </p>
                </div>
              </div>
            );
          })()}

          {/* Daily Quests Widget */}
          <div className="border-2 border-cloud-gray rounded-2xl p-5 flex flex-col gap-4 bg-snow-white">
            <div className="flex justify-between items-center border-b-2 border-cloud-gray pb-3">
              <h3 className="font-bold text-[17px] text-almost-black">Daily Quests</h3>
              <Link href="/quests" className="text-sky-blue font-bold text-xs uppercase tracking-wider cursor-pointer hover:underline">
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
                      <span className="font-bold text-[13px] md:text-sm text-almost-black leading-none">
                        {quest.title}
                      </span>
                      <div className="flex items-center gap-3">
                        <div className="h-5 grow bg-cloud-gray rounded-full relative flex items-center justify-center overflow-hidden">
                          <div
                            className={`h-full absolute left-0 top-0 rounded-full transition-all duration-300 ${quest.color}`}
                            style={{ width: `${Math.min(100, (quest.current / quest.target) * 100)}%` }}
                          />
                          <span className="relative z-10 text-almost-black font-black text-[10px]">
                            {quest.current} / {quest.target}
                          </span>
                        </div>
                        {quest.isClaimed ? (
                          <span className="text-duo-green font-extrabold text-sm shrink-0">✓</span>
                        ) : quest.isCompleted ? (
                          <button
                            disabled={claimingQuest !== null}
                            onClick={() => handleClaimQuest(index + 1, index === 2 ? 10 : 5)}
                            className="bg-duo-green hover:brightness-105 disabled:opacity-60 disabled:cursor-not-allowed text-white font-extrabold text-[10px] uppercase tracking-wider px-2.5 py-1.5 rounded-xl shadow-[0_3px_0_#3f8f01] active:translate-y-[3px] active:shadow-none transition-all cursor-pointer shrink-0"
                          >
                            {claimingQuest === index + 1 ? "..." : "Claim"}
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

          {/* Create Profile / Sign In Widget */}
          <div className="border-2 border-cloud-gray rounded-2xl p-5 flex flex-col gap-4 bg-snow-white">
            <h3 className="font-bold text-[17px] text-almost-black leading-snug">
              Create a profile to save your progress!
            </h3>

            <div className="flex flex-col gap-3 w-full">
              <Link href="/signup" className="w-full">
                <button className="w-full bg-duo-green hover:bg-duo-green/95 text-white font-extrabold py-3 rounded-xl shadow-[0_4px_0_#3f8f01] active:translate-y-[4px] active:shadow-none transition-all uppercase tracking-widest text-xs md:text-sm cursor-pointer">
                  CREATE A PROFILE
                </button>
              </Link>

              <Link href="/login" className="w-full">
                <button className="w-full bg-sky-blue hover:bg-sky-blue/95 text-white font-extrabold py-3 rounded-xl shadow-[0_4px_0_#189edc] active:translate-y-[4px] active:shadow-none transition-all uppercase tracking-widest text-xs md:text-sm cursor-pointer">
                  SIGN IN
                </button>
              </Link>
            </div>
          </div>

          {/* Footer Links */}
          <div className="flex flex-wrap gap-x-3 gap-y-1.5 px-2 text-[10px] md:text-[11px] font-bold text-silver uppercase tracking-wider">
            <span className="cursor-pointer hover:text-almost-black transition-colors">About</span>
            <span className="cursor-pointer hover:text-almost-black transition-colors">Blog</span>
            <span className="cursor-pointer hover:text-almost-black transition-colors">Store</span>
            <span className="cursor-pointer hover:text-almost-black transition-colors">Efficacy</span>
            <span className="cursor-pointer hover:text-almost-black transition-colors">Careers</span>
            <span className="cursor-pointer hover:text-almost-black transition-colors">Investors</span>
            <span className="cursor-pointer hover:text-almost-black transition-colors">Terms</span>
            <span className="cursor-pointer hover:text-almost-black transition-colors">Privacy</span>
          </div>

        </div>
      </aside>
    </>
  );
}
