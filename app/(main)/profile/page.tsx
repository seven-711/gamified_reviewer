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
          <Image src="/emoji/profile.png" alt="Profile" fill className="object-contain" unoptimized />
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
      <main className="flex-1 w-full max-w-[600px] mx-auto pb-24 pt-6 md:pt-10">
        
        {/* Profile Header section */}
        <div className="flex flex-col md:flex-row items-center md:items-start gap-6 border-b-2 border-cloud-gray pb-8 mb-8">
          <div className="w-24 h-24 md:w-32 md:h-32 rounded-full overflow-hidden border-2 border-cloud-gray relative bg-duo-green-light shrink-0">
            {(!isLoaded || !user) ? (
              <div className="w-full h-full bg-cloud-gray/20 animate-pulse rounded-full" />
            ) : (
              <img src="/emoji/profile.png" alt="Avatar" className="object-cover w-full h-full rounded-full scale-[1.7] translate-y-1" />
            )}
          </div>
          <div className="flex flex-col flex-1 items-center md:items-start text-center md:text-left gap-2 w-full font-din-round">
            {(!isLoaded || !user) ? (
              <div className="flex flex-col gap-2.5 w-full items-center md:items-start">
                <div className="h-7 bg-cloud-gray/20 rounded w-1/2 animate-pulse animate-[fadeIn_0.3s_ease-out]" />
                <div className="h-4 bg-cloud-gray/10 rounded w-1/3 animate-pulse animate-[fadeIn_0.3s_ease-out]" />
                <div className="h-4 bg-cloud-gray/10 rounded w-1/4 animate-pulse mt-1 animate-[fadeIn_0.3s_ease-out]" />
              </div>
            ) : (
              <>
                <h1 className="font-feather text-2xl md:text-3xl font-bold text-white mb-1 animate-[fadeIn_0.3s_ease-out]">{user.fullName || "Learner"}</h1>
                <p className="text-silver font-medium text-sm md:text-body animate-[fadeIn_0.3s_ease-out]">{user.primaryEmailAddress?.emailAddress}</p>
                {loading || !profile ? (
                  <div className="h-4 bg-cloud-gray/10 rounded w-1/4 animate-pulse mt-1 animate-[fadeIn_0.3s_ease-out]" />
                ) : (
                  <p className="text-sky-blue font-bold text-sm md:text-body tracking-wide uppercase mt-1 animate-[fadeIn_0.3s_ease-out]">
                     {profile.exam_category} • {profile.study_style}
                  </p>
                )}
              </>
            )}
          </div>
           <div className="flex flex-col items-center gap-3 shrink-0">
              <button onClick={() => router.push("/onboarding")} className="w-full bg-transparent border-2 border-cloud-gray text-sky-blue font-bold px-6 py-2.5 rounded-2xl hover:bg-duo-green-light transition-colors uppercase tracking-widest text-caption">
                Edit Profile
              </button>
              <SignOutButton>
                <div className="flex items-center justify-center gap-3 bg-transparent border-2 border-red-500/50 px-4 py-2.5 rounded-2xl cursor-pointer hover:bg-red-500/10 transition-colors w-full mt-2">
                  <div className="w-6 h-6 rounded-full overflow-hidden bg-duo-green-light shrink-0 border border-red-500/30">
                    <img src={(user && user.hasImage) ? user.imageUrl : "/emoji/profile.png"} alt="Profile" className={`object-cover w-full h-full scale-[1.3] ${(user && !user.hasImage) && 'rounded-full translate-y-[2px]'}`} />
                  </div>
                  <span className="text-red-500 font-bold uppercase tracking-widest text-caption">
                    Sign Out
                  </span>
                </div>
              </SignOutButton>
           </div>
        </div>

        {/* Stats Section */}
        <h2 className="font-feather text-xl md:text-2xl font-bold text-white mb-4">Statistics</h2>
        <div className="grid grid-cols-2 gap-4 mb-10">
          <div className="border-2 border-cloud-gray rounded-2xl p-4 flex items-center gap-4">
             <div className="text-3xl">🔥</div>
             <div className="flex flex-col">
               {loading || !profile ? (
                 <div className="h-6 w-12 bg-cloud-gray/20 rounded animate-pulse" />
               ) : (
                 <span className="font-bold text-xl text-white animate-[fadeIn_0.3s_ease-out]">{profile.streak || 0}</span>
               )}
               <span className="text-silver font-medium text-caption uppercase tracking-wide">Day Streak</span>
             </div>
          </div>
          <div className="border-2 border-cloud-gray rounded-2xl p-4 flex items-center gap-4">
             <div className="text-3xl">⚡</div>
             <div className="flex flex-col">
               {loading || !profile ? (
                 <div className="h-6 w-12 bg-cloud-gray/20 rounded animate-pulse" />
               ) : (
                 <span className="font-bold text-xl text-white animate-[fadeIn_0.3s_ease-out]">{profile.total_score || 0}</span>
               )}
               <span className="text-silver font-medium text-caption uppercase tracking-wide">Total XP</span>
             </div>
          </div>
          <div className="border-2 border-cloud-gray rounded-2xl p-4 flex items-center gap-4">
             <div className="text-3xl">🛡️</div>
             <div className="flex flex-col">
               <span className="font-bold text-xl text-white">Bronze</span>
               <span className="text-silver font-medium text-caption uppercase tracking-wide">Current League</span>
             </div>
          </div>
          <div className="border-2 border-cloud-gray rounded-2xl p-4 flex items-center gap-4">
             <div className="text-3xl">🎯</div>
             <div className="flex flex-col">
               <span className="font-bold text-xl text-white">Top 20%</span>
               <span className="text-silver font-medium text-caption uppercase tracking-wide">Rank</span>
             </div>
          </div>
        </div>

        {/* Preferences Section */}
        <h2 className="font-feather text-xl md:text-2xl font-bold text-white mb-4">Preferences</h2>
        <div className="border-2 border-cloud-gray rounded-2xl p-4 md:p-6 flex flex-col sm:flex-row items-center justify-between gap-4 bg-duo-green-light/10 mb-8">
           <div className="flex items-center gap-4 text-left w-full sm:w-auto">
              <div className="text-3xl shrink-0 select-none">⏱️</div>
              <div className="flex flex-col gap-0.5">
                 <h3 className="font-bold text-[17px] text-white">Default Timer Duration</h3>
                 <p className="text-silver text-xs font-medium leading-tight">
                   {savingTimer ? "Saving changes..." : "Adjust your practice exam length"}
                 </p>
              </div>
           </div>
           
           <div className="relative w-full sm:w-[160px] shrink-0">
             <select 
               value={timerDuration}
               onChange={handleTimerChange}
               disabled={savingTimer}
               className="w-full bg-[#131f24] text-white border-2 border-cloud-gray rounded-xl px-3 py-2.5 font-bold text-sm tracking-wide select-none cursor-pointer focus:outline-none focus:border-sky-blue transition-colors appearance-none shadow-[0_4px_0_var(--color-cloud-gray)] active:translate-y-[2px] active:shadow-[0_2px_0_var(--color-cloud-gray)]"
             >
               <option value={5}>5 Minutes</option>
               <option value={10}>10 Minutes</option>
               <option value={15}>15 Minutes</option>
               <option value={30}>30 Minutes</option>
               <option value={60}>1 Hour</option>
             </select>
             <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-4 text-white font-bold">
               ▼
             </div>
           </div>
        </div>

        {/* Achievements Section Mock */}
        <h2 className="font-feather text-xl md:text-2xl font-bold text-white mb-4">Achievements</h2>
        <div className="border-2 border-cloud-gray rounded-2xl p-6 flex items-center justify-between opacity-50">
           <div className="flex items-center gap-4">
              <Image src="/emoji/quest.png" alt="Quest" width={48} height={48} className="grayscale w-auto h-auto" unoptimized />
              <div className="flex flex-col gap-1">
                 <h3 className="font-bold text-lg text-white">First Steps</h3>
                 <p className="text-silver text-body font-medium">Complete your first lesson</p>
              </div>
           </div>
           <span className="text-silver font-bold">0 / 1</span>
        </div>

      </main>

      {/* Right Sidebar - Friends Widget */}
      <aside className="hidden lg:block w-[368px] shrink-0 pt-6 md:pt-10">
        <div className="border-2 border-cloud-gray rounded-2xl p-6 flex flex-col gap-5">
          <h3 className="font-extrabold text-[17px] text-silver uppercase tracking-wider">Friends</h3>
          <h2 className="font-feather text-2xl text-duo-green font-bold leading-snug">
            Follow friends to compete and celebrate together!
          </h2>
          <button className="bg-duo-green text-white font-bold px-4 py-3 rounded-2xl hover:brightness-110 transition-colors shadow-[0_4px_0_#3f8f01] active:shadow-[0_0px_0_#3f8f01] active:translate-y-1 uppercase tracking-widest text-body mt-2">
            Find Friends
          </button>
          <div className="w-full flex justify-center mt-4">
            <div className="w-32 h-32 relative">
              <Image src="/emoji/hmm.png" alt="Friends" fill className="object-contain" unoptimized />
            </div>
          </div>
        </div>
      </aside>
    </>
  );
}
