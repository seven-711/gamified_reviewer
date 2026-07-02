"use client";

import React, { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { UserButton, useUser } from "@clerk/nextjs";
import { supabase } from "@/lib/supabase";

export default function RightSidebar() {
  const { user, isLoaded, isSignedIn } = useUser();
  const [streak, setStreak] = useState(0);
  const [xp, setXp] = useState(0);

  useEffect(() => {
    async function loadStats() {
      if (!isLoaded || !user) return;
      const { data } = await supabase
        .from("profiles")
        .select("streak, total_score")
        .eq("id", user.id)
        .single();
      
      if (data) {
        setStreak(data.streak || 0);
        setXp(data.total_score || 0);
      }
    }
    loadStats();
  }, [user, isLoaded]);

  return (
    <div className="flex flex-col gap-6 pt-8">
      {/* Top Stats Bar */}
      <div className="flex items-center justify-between px-2 text-charcoal font-bold text-body">
        {/* Country/Language placeholder */}
        <div className="flex items-center gap-2 cursor-pointer hover:bg-duo-green-light p-2 rounded-xl transition-colors">
          <span className="text-xl">🇵🇭</span>
        </div>
        {/* Streak */}
        <div className="flex items-center gap-2 text-orange-500 cursor-pointer hover:bg-duo-green-light p-2 rounded-xl transition-colors">
          <span className="text-xl">🔥</span>
          <span>{streak}</span>
        </div>
        {/* XP / Gems */}
        <div className="flex items-center gap-2 text-blue-400 cursor-pointer hover:bg-duo-green-light p-2 rounded-xl transition-colors">
          <span className="text-xl">💎</span>
          <span>{xp}</span>
        </div>
        {/* Hearts */}
        <div className="flex items-center gap-2 text-red-500 cursor-pointer hover:bg-duo-green-light p-2 rounded-xl transition-colors">
          <span className="text-xl">❤️</span>
          <span>5</span>
        </div>
      </div>

      {/* Unlock Leaderboards Widget */}
      <div className="border-2 border-cloud-gray rounded-2xl p-5 flex flex-col gap-4">
        <div className="flex justify-between items-center border-b-2 border-cloud-gray pb-3">
          <h3 className="font-bold text-[17px] text-charcoal">Unlock Leaderboards!</h3>
        </div>
        <div className="flex items-center gap-4 mt-2">
          <div className="w-20 h-20 relative shrink-0">
            <Image src="/emoji/unlockleaderboard.png" alt="Leaderboard Locked" fill className="object-contain" unoptimized />
          </div>
          <p className="text-silver text-body font-medium leading-tight">
            Complete 1 more lesson to start competing
          </p>
        </div>
      </div>

      {/* Daily Quests Widget */}
      <div className="border-2 border-cloud-gray rounded-2xl p-5 flex flex-col gap-4">
        <div className="flex justify-between items-center">
          <h3 className="font-bold text-[17px] text-charcoal">Daily Quests</h3>
          <span className="text-sky-blue font-bold text-xs uppercase tracking-wider cursor-pointer hover:text-blue-400">View All</span>
        </div>
        
        <div className="flex items-center gap-4 mt-4">
          <div className="w-20 h-20 relative shrink-0">
            <Image src="/emoji/quest.png" alt="Quest" fill className="object-contain" unoptimized />
          </div>
          <div className="flex flex-col w-full gap-2">
            <span className="font-bold text-body text-charcoal">Earn 10 XP</span>
            <div className="w-full flex items-center gap-3">
              <div className="h-4 w-full bg-cloud-gray rounded-full overflow-hidden">
                <div className="h-full bg-sunshine-yellow w-[40%] rounded-full"></div>
              </div>
              <span className="text-silver text-xs font-bold shrink-0">4 / 10</span>
            </div>
          </div>
        </div>
      </div>

      {/* Profile / Auth Widget */}
      {!isSignedIn && (
        <div className="border-2 border-cloud-gray rounded-2xl p-5 flex flex-col gap-4">
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
