"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { supabase } from "@/lib/supabase";
import { useUser, UserButton, SignOutButton } from "@clerk/nextjs";

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
}

export default function ProfilePage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [timerDuration, setTimerDuration] = useState<number>(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("timer_duration");
      if (saved) return parseInt(saved, 10);
    }
    return 5;
  });
  const [savingTimer, setSavingTimer] = useState(false);
  const { user, isLoaded, isSignedIn } = useUser();

  useEffect(() => {
    async function loadData() {
      if (!isLoaded) return;
      if (!isSignedIn || !user) {
        const saved = localStorage.getItem("timer_duration");
        if (saved) {
          setTimerDuration(parseInt(saved, 10));
        }
        setLoading(false);
        return;
      }
      
      try {
        const { data: userProfile, error } = await supabase
          .from("profiles")
          .select("*")
          .eq("id", user.id)
          .single();

        if (error || !userProfile) {
          router.replace("/onboarding");
          return;
        }

        setProfile(userProfile);
        if (userProfile.timer_duration) {
          setTimerDuration(userProfile.timer_duration);
          localStorage.setItem("timer_duration", userProfile.timer_duration.toString());
        } else {
          const saved = localStorage.getItem("timer_duration");
          if (saved) {
            setTimerDuration(parseInt(saved, 10));
          }
        }
        setLoading(false);
      } catch (err) {
        console.error("Profile load failed", err);
        router.replace("/login");
      }
    }
    loadData();
  }, [router, user, isLoaded, isSignedIn]);

  const handleTimerChange = async (e: React.ChangeEvent<HTMLSelectElement>) => {
    const value = parseInt(e.target.value, 10);
    setTimerDuration(value);
    localStorage.setItem("timer_duration", value.toString());
    
    if (isSignedIn && user) {
      setSavingTimer(true);
      try {
        await supabase
          .from("profiles")
          .update({ timer_duration: value })
          .eq("id", user.id);
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
        <div className="w-32 h-32 relative mb-6 opacity-80">
          <Image src="/emoji/profile.webp" alt="Profile" fill className="object-contain" unoptimized />
        </div>
        <h2 className="font-feather text-3xl font-bold text-duo-green mb-4">Create a Profile!</h2>
        <p className="text-silver font-din-round text-[17px] mb-8 max-w-[400px]">Sign up to track your streak, earn XP, and compete on the leaderboards.</p>
        <button onClick={() => router.push("/signup")} className="bg-duo-green text-white font-bold px-8 py-4 rounded-2xl hover:brightness-110 transition-colors shadow-[0_4px_0_#3f8f01] active:shadow-[0_0px_0_#3f8f01] active:translate-y-1 uppercase tracking-widest text-body w-full max-w-[300px]">
          Sign Up Now
        </button>
      </main>
    );
  }

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
              onClick={() => router.push("/onboarding")} 
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
                <span>🇵🇭</span>
                <span className="bg-sky-blue/20 text-sky-blue text-[10px] font-black px-1.5 py-0.5 rounded uppercase">
                  {profile?.exam_category.split(" ")[0] || "CSE"}
                </span>
              </span>
              <span className="text-silver font-extrabold text-[10px] uppercase tracking-wider mt-1">Courses</span>
            </div>
            
            <div className="flex flex-col items-center">
              <span className="text-base sm:text-lg font-black text-white select-none">11</span>
              <span className="text-silver font-extrabold text-[10px] uppercase tracking-wider mt-1">Following</span>
            </div>

            <div className="flex flex-col items-center">
              <span className="text-base sm:text-lg font-black text-white select-none">10</span>
              <span className="text-silver font-extrabold text-[10px] uppercase tracking-wider mt-1">Followers</span>
            </div>
          </div>

          {/* Add Friends Button */}
          <button className="w-full mt-5 bg-transparent hover:bg-white/5 border-2 border-cloud-gray hover:border-white text-white font-extrabold py-3 rounded-2xl transition-all uppercase tracking-widest text-xs flex items-center justify-center gap-2 cursor-pointer active:translate-y-0.5">
            <span>👤➕</span> Add Friends
          </button>
        </div>

        {/* Overview Section */}
        <div className="w-full mt-10">
          <h2 className="font-feather text-xs font-black tracking-widest text-silver uppercase mb-5 select-none">
            Overview
          </h2>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Streak */}
            <div className="flex items-center gap-3 bg-gradient-to-br from-orange-500/5 to-transparent border border-orange-500/10 rounded-2xl p-3 hover:-translate-y-0.5 transition-transform">
              <Image src="/img/gen_imgs/streak.webp" alt="Streak" width={28} height={28} className="object-contain" />
              <span className="font-extrabold text-[16px] text-white">
                {profile?.streak || 0} days
              </span>
            </div>

            {/* XP */}
            <div className="flex items-center gap-3 bg-gradient-to-br from-yellow-500/5 to-transparent border border-yellow-500/10 rounded-2xl p-3 hover:-translate-y-0.5 transition-transform">
              <Image src="/img/gen_imgs/trophy.webp" alt="XP" width={28} height={28} className="object-contain" />
              <span className="font-extrabold text-[16px] text-white">
                {profile?.total_score || 0} XP
              </span>
            </div>

            {/* League */}
            <div className="flex items-center gap-3 bg-gradient-to-br from-amber-500/5 to-transparent border border-amber-500/10 rounded-2xl p-3 hover:-translate-y-0.5 transition-transform">
              <span className="text-xl w-[28px] h-[28px] flex items-center justify-center select-none">🛡️</span>
              <span className="font-extrabold text-[16px] text-white">
                Bronze League
              </span>
            </div>

            {/* Rank */}
            <div className="flex items-center gap-3 bg-gradient-to-br from-sky-blue/5 to-transparent border border-sky-blue/10 rounded-2xl p-3 hover:-translate-y-0.5 transition-transform">
              <span className="text-xl w-[28px] h-[28px] flex items-center justify-center select-none">🎯</span>
              <span className="font-extrabold text-[16px] text-white">
                Top 20%
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
            <span className="text-sky-blue font-bold text-xs uppercase tracking-wider cursor-pointer hover:underline select-none">
              View All &gt;
            </span>
          </div>
          
          <div className="flex items-center gap-5">
            <div className="w-14 h-14 rounded-full overflow-hidden bg-gradient-to-tr from-orange-500/20 to-yellow-500/20 border border-orange-500/30 flex items-center justify-center p-2 relative shadow-md hover:scale-105 transition-transform duration-300">
              <Image src="/img/gen_imgs/trophy.webp" alt="Badge" width={36} height={36} className="object-contain" />
            </div>
            <div className="w-14 h-14 rounded-full overflow-hidden bg-gradient-to-tr from-sky-blue/20 to-blue-500/20 border border-sky-blue/30 flex items-center justify-center p-2 relative shadow-md hover:scale-105 transition-transform duration-300">
              <Image src="/img/gen_imgs/diamond.webp" alt="Badge" width={36} height={36} className="object-contain" />
            </div>
            <div className="w-14 h-14 rounded-full overflow-hidden bg-gradient-to-tr from-duo-green/20 to-emerald-500/20 border border-duo-green/30 flex items-center justify-center p-2 relative shadow-md hover:scale-105 transition-transform duration-300">
              <Image src="/img/gen_imgs/streak.webp" alt="Badge" width={36} height={36} className="object-contain" />
            </div>
            <div className="w-14 h-14 rounded-full bg-cloud-gray/10 border border-cloud-gray/30 flex items-center justify-center text-silver text-xl select-none grayscale opacity-30">
              🔒
            </div>
          </div>
        </div>

        {/* Achievements Section */}
        <div className="w-full mt-10">
          <div className="flex justify-between items-center mb-5">
            <h2 className="font-feather text-xs font-black tracking-widest text-silver uppercase select-none">
              Achievements
            </h2>
            <span className="text-sky-blue font-bold text-xs uppercase tracking-wider cursor-pointer hover:underline select-none">
              View All &gt;
            </span>
          </div>
          
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {/* Achievement 1 */}
            <div className="flex flex-col items-center gap-2 relative group cursor-pointer">
              <span className="absolute -top-1.5 bg-[#ff4b4b] text-white text-[7px] font-black px-1.5 py-0.5 rounded uppercase tracking-wider scale-90 z-10 select-none shadow-sm">
                NEW
              </span>
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-duo-green/10 to-transparent border-2 border-duo-green/30 flex items-center justify-center p-2 relative group-hover:scale-105 transition-all">
                <Image src="/emoji/quest.webp" alt="Quest" width={36} height={36} className="object-contain" unoptimized />
              </div>
              <span className="text-[9px] font-extrabold text-[#58cc02] bg-[#58cc02]/15 px-2 py-0.5 rounded-full select-none">
                Lvl 1
              </span>
            </div>

            {/* Achievement 2 */}
            <div className="flex flex-col items-center gap-2 relative group cursor-pointer">
              <span className="absolute -top-1.5 bg-[#ff4b4b] text-white text-[7px] font-black px-1.5 py-0.5 rounded uppercase tracking-wider scale-90 z-10 select-none shadow-sm">
                NEW
              </span>
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-yellow-500/10 to-transparent border-2 border-yellow-500/30 flex items-center justify-center p-2 relative group-hover:scale-105 transition-all">
                <Image src="/img/gen_imgs/trophy.webp" alt="Trophy" width={36} height={36} className="object-contain" />
              </div>
              <span className="text-[9px] font-extrabold text-yellow-500 bg-yellow-500/15 px-2 py-0.5 rounded-full select-none">
                {profile?.total_score || 0} XP
              </span>
            </div>

            {/* Achievement 3 */}
            <div className="flex flex-col items-center gap-2 relative group cursor-pointer">
              <span className="absolute -top-1.5 bg-[#ff4b4b] text-white text-[7px] font-black px-1.5 py-0.5 rounded uppercase tracking-wider scale-90 z-10 select-none shadow-sm">
                NEW
              </span>
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-orange-500/10 to-transparent border-2 border-orange-500/30 flex items-center justify-center p-2 relative group-hover:scale-105 transition-all">
                <Image src="/img/gen_imgs/streak.webp" alt="Streak" width={36} height={36} className="object-contain" />
              </div>
              <span className="text-[9px] font-extrabold text-orange-500 bg-orange-500/15 px-2 py-0.5 rounded-full select-none">
                {profile?.streak || 0} days
              </span>
            </div>

            {/* Achievement 4 */}
            <div className="flex flex-col items-center gap-2 relative group cursor-pointer grayscale opacity-45">
              <div className="w-14 h-14 rounded-2xl bg-cloud-gray/10 border-2 border-cloud-gray/30 flex items-center justify-center p-2 relative">
                <span className="text-lg">🏆</span>
              </div>
              <span className="text-[9px] font-extrabold text-silver bg-cloud-gray/20 px-2 py-0.5 rounded-full select-none">
                Locked
              </span>
            </div>
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
      <aside className="hidden lg:block w-[368px] shrink-0 pt-6 md:pt-10 font-din-round">
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
