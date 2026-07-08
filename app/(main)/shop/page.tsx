"use client";

import React, { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useUser } from "@clerk/nextjs";
import { supabase } from "@/lib/supabase";
import { refillHeartsInDb } from "@/lib/session";

export default function ShopPage() {
  const { user, isLoaded, isSignedIn } = useUser();
  const [streak, setStreak] = useState(1);
  const [xp, setXp] = useState(0);
  const [hearts, setHearts] = useState(5);
  const [gems, setGems] = useState(50);
  const [streakFreezeCount, setStreakFreezeCount] = useState(0);
  
  const [purchasingHeart, setPurchasingHeart] = useState(false);
  const [purchasingFreeze, setPurchasingFreeze] = useState(false);

  useEffect(() => {
    async function loadStats() {
      if (!isLoaded) return;
      
      let profileId: string | null = null;
      if (user) {
        profileId = user.id;
      } else if (typeof window !== "undefined") {
        profileId = localStorage.getItem("guest_session_id");
      }

      if (!profileId) {
        setStreak(1);
        setXp(0);
        setHearts(5);
        setGems(50);
        setStreakFreezeCount(0);
        return;
      }

      const { data } = await supabase
        .from("profiles")
        .select("streak, total_score, hearts, last_heart_lost_at, gems, streak_freeze_count")
        .eq("id", profileId)
        .single();
      
      if (data) {
        setStreak(data.streak || 1);
        setXp(data.total_score || 0);
        setGems(data.gems !== undefined && data.gems !== null ? data.gems : 50);
        setStreakFreezeCount(data.streak_freeze_count || 0);
        
        let h = data.hearts !== undefined && data.hearts !== null ? data.hearts : 5;
        if (h < 5 && data.last_heart_lost_at) {
          const now = new Date().getTime();
          const lastLost = new Date(data.last_heart_lost_at).getTime();
          const hoursPassed = (now - lastLost) / (1000 * 60 * 60);
          const regenerated = Math.floor(hoursPassed / 4);
          if (regenerated > 0) {
            h = Math.min(5, h + regenerated);
          }
        }
        setHearts(h);
      }
    }
    loadStats();
  }, [user, isLoaded]);

  const handleBuyHeart = async () => {
    if (gems < 50) {
      alert("❌ Not enough Gems! You need 50 Gems to refill hearts.");
      return;
    }
    if (hearts === 5) {
      alert("❤️ Your hearts are already full!");
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
        setGems(prev => Math.max(0, prev - 50));
        setHearts(5);
        alert("❤️ Hearts refilled successfully!");
      } else {
        alert("Purchase failed: " + res.error);
      }
    }
    setPurchasingHeart(false);
  };

  const handleBuyFreeze = async () => {
    if (gems < 200) {
      alert("❌ Not enough Gems! You need 200 Gems to buy a Streak Freeze.");
      return;
    }
    if (streakFreezeCount >= 2) {
      alert("❄️ You can only equip a maximum of 2 Streak Freezes!");
      return;
    }
    
    setPurchasingFreeze(true);
    let profileId: string | null = null;
    if (user) {
      profileId = user.id;
    }
    
    if (profileId) {
      try {
        const nextGems = Math.max(0, gems - 200);
        const nextFreeze = streakFreezeCount + 1;
        const { error } = await supabase
          .from("profiles")
          .update({
            gems: nextGems,
            streak_freeze_count: nextFreeze
          })
          .eq("id", profileId);
          
        if (!error) {
          setGems(nextGems);
          setStreakFreezeCount(nextFreeze);
          localStorage.setItem("streak_freeze_count", nextFreeze.toString());
          alert("❄️ Streak Freeze purchased! Equipped.");
        } else {
          alert("Purchase failed: " + error.message);
        }
      } catch (err: any) {
        alert("An error occurred: " + err.message);
      }
    }
    setPurchasingFreeze(false);
  };

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
            
            <div className="flex items-center justify-between p-4 rounded-2xl border-2 border-cloud-gray bg-snow-white">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 rounded-2xl bg-red-500/10 flex items-center justify-center text-3xl shadow-sm shrink-0">
                  ❤️
                </div>
                <div className="flex flex-col gap-1">
                  <span className="font-bold text-lg text-almost-black">Refill Hearts</span>
                  <span className="text-silver text-xs font-semibold leading-normal max-w-[320px]">
                    Get full hearts so you can worry less about making mistakes.
                  </span>
                </div>
              </div>
              <button
                disabled={purchasingHeart}
                onClick={handleBuyHeart}
                className="bg-transparent text-blue-400 hover:bg-blue-50 border-2 border-cloud-gray font-extrabold px-4 py-2.5 rounded-xl text-xs uppercase tracking-wider shrink-0 cursor-pointer active:scale-95 transition-all disabled:opacity-50"
              >
                {hearts === 5 ? "FULL" : purchasingHeart ? "BUYING..." : "GET FOR 💎 50"}
              </button>
            </div>
          </div>

          {/* Power-Ups Section */}
          <div className="flex flex-col gap-4">
            <h2 className="font-feather text-xl md:text-2xl text-almost-black font-bold tracking-wide border-b-2 border-cloud-gray pb-2">
              Power-Ups
            </h2>
            
            <div className="flex items-center justify-between p-4 rounded-2xl border-2 border-cloud-gray bg-snow-white">
              <div className="flex items-center gap-4">
                {/* Frozen blue fire crystal badge */}
                <div className="w-14 h-14 rounded-2xl bg-sky-blue/15 border-2 border-sky-blue/30 flex items-center justify-center shrink-0 shadow-sm relative">
                  <span className="text-3xl filter drop-shadow-[0_2px_4px_rgba(28,176,246,0.3)]">❄️</span>
                </div>
                <div className="flex flex-col gap-1">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-lg text-almost-black">Streak Freeze</span>
                    <span className="bg-duo-green/10 text-duo-green text-[10px] font-black px-2 py-0.5 rounded-full uppercase tracking-wider">
                      {streakFreezeCount} / 2 EQUIPPED
                    </span>
                  </div>
                  <span className="text-silver text-xs font-semibold leading-normal max-w-[320px]">
                    Streak Freeze allows your streak to remain in place for one full day of inactivity.
                  </span>
                </div>
              </div>
              <button
                disabled={streakFreezeCount >= 2 || purchasingFreeze}
                onClick={handleBuyFreeze}
                className="border-2 border-cloud-gray hover:bg-gray-50 text-almost-black font-extrabold px-4 py-2.5 rounded-xl text-xs uppercase tracking-wider shrink-0 cursor-pointer active:scale-95 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {streakFreezeCount >= 2 ? "EQUIPPED" : purchasingFreeze ? "BUYING..." : "GET FOR 💎 200"}
              </button>
            </div>
          </div>

        </div>

        {(!isSignedIn || !user) && (
          /* Create Profile Overlay Modal */
          <div className="absolute inset-0 flex items-center justify-center z-20 px-4 mt-8 md:mt-16">
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
              <span className="text-xl">🔥</span>
              <span>{streak}</span>
            </div>
            
            {/* XP / Gems */}
            <div className="flex items-center gap-1.5 text-blue-400 cursor-pointer hover:bg-duo-green-light p-2 rounded-xl transition-colors" title="Gems">
              <span className="text-xl">💎</span>
              <span>{gems}</span>
            </div>
            
            {/* Hearts */}
            <div className="flex items-center gap-1.5 text-red-500 cursor-pointer hover:bg-duo-green-light p-2 rounded-xl transition-colors">
              <span className="text-xl">❤️</span>
              <span>{hearts}</span>
            </div>
          </div>

          {/* Unlock Leaderboards Widget */}
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

          {/* Daily Quests Widget */}
          <div className="border-2 border-cloud-gray rounded-2xl p-5 flex flex-col gap-3 bg-snow-white">
            <div className="flex justify-between items-center">
              <h3 className="font-bold text-[17px] text-almost-black">Daily Quests</h3>
              <Link href="/quests" className="text-sky-blue font-bold text-xs uppercase tracking-wider cursor-pointer hover:underline">
                View All
              </Link>
            </div>
            
            <div className="flex items-center gap-4 mt-2">
              <div className="w-16 h-16 relative shrink-0 bg-sunshine-yellow rounded-xl flex items-center justify-center text-2xl text-white font-bold">
                ⚡
              </div>
              <div className="flex flex-col w-full gap-2">
                <span className="font-bold text-sm text-almost-black">Earn 10 XP</span>
                <div className="w-full flex items-center gap-3">
                  <div className="h-4 w-full bg-cloud-gray rounded-full overflow-hidden relative flex items-center justify-center">
                    <div className="absolute left-0 top-0 h-full bg-sunshine-yellow w-full rounded-full"></div>
                    <span className="relative z-10 text-white font-bold text-[10px]">10 / 10</span>
                  </div>
                </div>
              </div>
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
