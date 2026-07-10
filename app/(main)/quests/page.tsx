"use client";

import React, { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useUser } from "@clerk/nextjs";
import { supabase } from "@/lib/supabase";
import { useAlert } from "@/components/ui/AlertContext";
import { useStats } from "@/components/ui/StatsContext";

export default function QuestsPage() {
  const { showAlert } = useAlert();
  const { user, isLoaded } = useUser();
  const { streak, xp, hearts, gems, refreshStats, updateStatsLocally } = useStats();

  const [dailyXp, setDailyXp] = useState(0);
  const [dailyLessons, setDailyLessons] = useState(0);
  const [dailyPassed, setDailyPassed] = useState(0);

  const [quest1Claimed, setQuest1Claimed] = useState(false);
  const [quest2Claimed, setQuest2Claimed] = useState(false);
  const [quest3Claimed, setQuest3Claimed] = useState(false);
  
  const [claiming, setClaiming] = useState<number | null>(null);

  useEffect(() => {
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
  }, []);

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
          .from("profiles")
          .update({
            gems: gems + gemReward
          })
          .eq("id", profileId);

        if (!error) {
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

  return (
    <>
      {/* Center Column */}
      <main className="flex-1 w-full max-w-[600px] mx-auto pb-24 flex flex-col gap-6 pt-4 md:pt-8 px-4 font-din-round">

        {/* Welcome Card */}
        <div className="w-full bg-[#a570ff] rounded-3xl p-6 relative overflow-hidden flex items-center justify-between shadow-sm min-h-[160px]">
          {/* Left Content */}
          <div className="flex flex-col text-white max-w-[60%] z-10">
            <h2 className="font-feather text-2xl md:text-3xl font-bold tracking-wide mb-2">
              Welcome!
            </h2>
            <p className="text-white/90 text-sm md:text-base font-semibold leading-relaxed">
              Complete quests to earn rewards! Quests refresh every day.
            </p>
          </div>

          {/* Mascot holding chest */}
          <div className="absolute right-4 bottom-2 w-32 h-32 md:w-36 md:h-36 z-0 flex items-end">
            <div className="relative w-full h-[90%]">
              <Image
                src="/emoji/ohyeah.webp"
                alt="Welcome mascot"
                fill
                className="object-contain drop-shadow-lg"
                unoptimized
              />
            </div>
            {/* Chest overlay floating */}
            <div className="absolute -left-2 top-4 w-12 h-12 animate-[bounce_3s_infinite] drop-shadow-md">
              <Image
                src="/emoji/quest.webp"
                alt="Treasure Chest"
                fill
                className="object-contain"
                unoptimized
              />
            </div>
          </div>
        </div>

        {/* Daily Quests Header */}
        <div className="w-full flex items-center justify-between mt-4">
          <h2 className="font-feather text-xl md:text-2xl text-almost-black font-bold tracking-wide">
            Daily Quests
          </h2>
          <div className="flex items-center gap-1.5 text-orange-500 font-bold text-xs md:text-sm tracking-wide">
            <span>⏱️</span>
            <span>14 HOURS</span>
          </div>
        </div>

        {/* Quests List */}
        <div className="flex flex-col gap-4 w-full">

          {/* Quest 1: Earn 30 XP */}
          <div className="border-2 border-cloud-gray rounded-2xl p-5 flex items-center gap-5 bg-snow-white">
            <div className="w-12 h-12 rounded-xl bg-sunshine-yellow flex items-center justify-center shrink-0 shadow-sm relative">
              <span className="text-2xl text-white font-bold">⚡</span>
            </div>

            <div className="flex flex-col w-full gap-2">
              <div className="flex justify-between items-start">
                <div className="flex flex-col">
                  <span className="font-bold text-base md:text-lg text-almost-black">Daily Sprint</span>
                  <span className="text-xs text-silver font-semibold flex items-center gap-1.5 mt-0.5">
                    <span>Earn 30 XP today • Reward:</span>
                    <Image src="/img/gen_imgs/diamond.webp" alt="Gems" width={14} height={14} className="object-contain" />
                    <span>5 Gems</span>
                  </span>
                </div>
                {dailyXp >= 30 && !quest1Claimed && (
                  <button
                    disabled={claiming !== null}
                    onClick={() => handleClaimQuest(1, 5)}
                    className="bg-duo-green hover:brightness-105 text-white font-bold text-xs uppercase tracking-wide px-3 py-1.5 rounded-xl shadow-[0_3px_0_#3f8f01] active:translate-y-[3px] active:shadow-none transition-all cursor-pointer shrink-0"
                  >
                    {claiming === 1 ? "Claiming..." : "Claim"}
                  </button>
                )}
                {quest1Claimed && (
                  <span className="bg-duo-green/15 text-duo-green text-xs font-bold px-2.5 py-1 rounded-xl shrink-0">
                    Claimed ✓
                  </span>
                )}
              </div>
              
              {!quest1Claimed && (
                <div className="w-full flex items-center gap-4">
                  <div className="h-6 w-full bg-cloud-gray rounded-full overflow-hidden relative flex items-center justify-center">
                    <div 
                      className="absolute left-0 top-0 h-full bg-sunshine-yellow rounded-full transition-all duration-300"
                      style={{ width: `${Math.min(100, (dailyXp / 30) * 100)}%` }}
                    ></div>
                    <span className="relative z-10 text-almost-black font-extrabold text-xs">
                      {Math.min(30, dailyXp)} / 30
                    </span>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Quest 2: Complete 1 Lesson */}
          <div className="border-2 border-cloud-gray rounded-2xl p-5 flex items-center gap-5 bg-snow-white">
            <div className="w-12 h-12 rounded-xl bg-duo-green flex items-center justify-center shrink-0 shadow-sm relative">
              <span className="text-2xl text-white font-bold">📚</span>
            </div>

            <div className="flex flex-col w-full gap-2">
              <div className="flex justify-between items-start">
                <div className="flex flex-col">
                  <span className="font-bold text-base md:text-lg text-almost-black">First Steps</span>
                  <span className="text-xs text-silver font-semibold flex items-center gap-1.5 mt-0.5">
                    <span>Complete 1 lesson today • Reward:</span>
                    <Image src="/img/gen_imgs/diamond.webp" alt="Gems" width={14} height={14} className="object-contain" />
                    <span>5 Gems</span>
                  </span>
                </div>
                {dailyLessons >= 1 && !quest2Claimed && (
                  <button
                    disabled={claiming !== null}
                    onClick={() => handleClaimQuest(2, 5)}
                    className="bg-duo-green hover:brightness-105 text-white font-bold text-xs uppercase tracking-wide px-3 py-1.5 rounded-xl shadow-[0_3px_0_#3f8f01] active:translate-y-[3px] active:shadow-none transition-all cursor-pointer shrink-0"
                  >
                    {claiming === 2 ? "Claiming..." : "Claim"}
                  </button>
                )}
                {quest2Claimed && (
                  <span className="bg-duo-green/15 text-duo-green text-xs font-bold px-2.5 py-1 rounded-xl shrink-0">
                    Claimed ✓
                  </span>
                )}
              </div>
              
              {!quest2Claimed && (
                <div className="w-full flex items-center gap-4">
                  <div className="h-6 w-full bg-cloud-gray rounded-full overflow-hidden relative flex items-center justify-center">
                    <div 
                      className="absolute left-0 top-0 h-full bg-duo-green rounded-full transition-all duration-300"
                      style={{ width: `${Math.min(100, (dailyLessons / 1) * 100)}%` }}
                    ></div>
                    <span className="relative z-10 text-almost-black font-extrabold text-xs">
                      {Math.min(1, dailyLessons)} / 1
                    </span>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Quest 3: Pass a test with >= 80% */}
          <div className="border-2 border-cloud-gray rounded-2xl p-5 flex items-center gap-5 bg-snow-white">
            <div className="w-12 h-12 rounded-xl bg-sky-blue flex items-center justify-center shrink-0 shadow-sm relative">
              <span className="text-2xl text-white font-bold">🏆</span>
            </div>

            <div className="flex flex-col w-full gap-2">
              <div className="flex justify-between items-start">
                <div className="flex flex-col">
                  <span className="font-bold text-base md:text-lg text-almost-black">High Achiever</span>
                  <span className="text-xs text-silver font-semibold flex items-center gap-1.5 mt-0.5">
                    <span>Pass a test with &gt;= 80% score • Reward:</span>
                    <Image src="/img/gen_imgs/diamond.webp" alt="Gems" width={14} height={14} className="object-contain" />
                    <span>10 Gems</span>
                  </span>
                </div>
                {dailyPassed >= 1 && !quest3Claimed && (
                  <button
                    disabled={claiming !== null}
                    onClick={() => handleClaimQuest(3, 10)}
                    className="bg-duo-green hover:brightness-105 text-white font-bold text-xs uppercase tracking-wide px-3 py-1.5 rounded-xl shadow-[0_3px_0_#3f8f01] active:translate-y-[3px] active:shadow-none transition-all cursor-pointer shrink-0"
                  >
                    {claiming === 3 ? "Claiming..." : "Claim"}
                  </button>
                )}
                {quest3Claimed && (
                  <span className="bg-duo-green/15 text-duo-green text-xs font-bold px-2.5 py-1 rounded-xl shrink-0">
                    Claimed ✓
                  </span>
                )}
              </div>
              
              {!quest3Claimed && (
                <div className="w-full flex items-center gap-4">
                  <div className="h-6 w-full bg-cloud-gray rounded-full overflow-hidden relative flex items-center justify-center">
                    <div 
                      className="absolute left-0 top-0 h-full bg-sky-blue rounded-full transition-all duration-300"
                      style={{ width: `${Math.min(100, (dailyPassed / 1) * 100)}%` }}
                    ></div>
                    <span className="relative z-10 text-almost-black font-extrabold text-xs">
                      {Math.min(1, dailyPassed)} / 1
                    </span>
                  </div>
                </div>
              )}
            </div>
          </div>

        </div>

      </main>

      {/* Right Sidebar */}
      <aside className="hidden lg:block w-[368px] shrink-0 pt-4 md:pt-8 font-din-round">
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
              <Image
                src="/img/gen_imgs/streak.webp"
                alt="Streak"
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
              <span className="text-xl">❤️</span>
              <span>{hearts}</span>
            </div>
          </div>

          {/* Monthly Challenge Widget */}
          <div className="border-2 border-cloud-gray rounded-2xl p-5 flex flex-col gap-5 bg-snow-white">
            <div className="flex gap-4 items-start">
              <div className="grow flex flex-col gap-2">
                <h3 className="font-bold text-[17px] leading-tight text-almost-black">
                  Monthly challenges unlock soon!
                </h3>
                <p className="text-silver text-xs font-semibold leading-normal">
                  Complete each month&apos;s challenge to earn exclusive badges
                </p>
              </div>

              {/* Gold Medal CSS illustration */}
              <div className="w-20 h-20 relative shrink-0 flex items-center justify-center">
                <div className="absolute w-16 h-16 rounded-full bg-gradient-to-br from-amber-400 via-yellow-500 to-amber-600 flex items-center justify-center shadow-md animate-[spin_8s_linear_infinite]">
                  {/* Decorative outer stars or rays */}
                  <div className="absolute w-14 h-14 rounded-full border-2 border-dashed border-white/30"></div>
                </div>
                {/* Central lightning badge */}
                <div className="absolute z-10 w-11 h-11 rounded-full bg-gradient-to-br from-amber-200 to-yellow-400 flex items-center justify-center border-2 border-amber-500">
                  <span className="text-xl text-amber-700 drop-shadow-sm">⚡</span>
                </div>
                {/* Green ribbon/leaves decoration behind */}
                <div className="absolute -bottom-1 -left-1 w-6 h-6 bg-duo-green rotate-45 rounded-sm -z-10 shadow-sm"></div>
                <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-duo-green -rotate-45 rounded-sm -z-10 shadow-sm"></div>
              </div>
            </div>

            <Link href="/dashboard" className="w-full">
              <button className="w-full bg-transparent hover:bg-cloud-gray/10 text-almost-black font-extrabold py-3 border-2 border-cloud-gray rounded-xl transition-all shadow-[0_4px_0_var(--color-cloud-gray)] active:translate-y-1 active:shadow-none uppercase tracking-widest text-xs md:text-sm">
                START A LESSON
              </button>
            </Link>
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
