"use client";

import React, { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useUser } from "@clerk/nextjs";
import { supabase } from "@/lib/supabase";

interface LeaderboardUser {
  id: string;
  name: string | null;
  total_score: number;
  streak: number;
}

export default function LeaderboardPage() {
  const { user, isLoaded } = useUser();
  const [profiles, setProfiles] = useState<LeaderboardUser[]>([]);
  const [currentUserProfile, setCurrentUserProfile] = useState<LeaderboardUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchLeaderboard() {
      if (!isLoaded) return;
      try {
        const { data, error } = await supabase
          .from("profiles")
          .select("id, name, total_score, streak")
          .order("total_score", { ascending: false });

        if (error) {
          console.error("Error fetching profiles:", error);
        } else if (data) {
          setProfiles(data);
          
          const profileId = user ? user.id : (typeof window !== "undefined" ? localStorage.getItem("guest_session_id") : null);
          if (profileId) {
            const current = data.find((p) => p.id === profileId);
            if (current) {
              setCurrentUserProfile(current);
            }
          }
        }
      } catch (err) {
        console.error("Failed to load leaderboard:", err);
      } finally {
        setLoading(false);
      }
    }
    fetchLeaderboard();
  }, [user, isLoaded]);

  // Determine if unlocked (has at least 1 lesson completed -> total_score > 0)
  const isUnlocked = currentUserProfile ? currentUserProfile.total_score > 0 : false;

  return (
    <>
      {/* Center Column */}
      <main className="flex-1 w-full max-w-[600px] mx-auto pb-24 flex flex-col items-center pt-6 md:pt-10 px-4 font-din-round">
        
        {loading ? (
          /* Shimmering Loading State */
          <div className="w-full flex flex-col items-center gap-6">
            <div className="w-48 h-48 rounded-full bg-cloud-gray/20 animate-pulse shrink-0" />
            <div className="h-6 bg-cloud-gray/20 rounded w-1/2 animate-pulse" />
            <div className="h-4 bg-cloud-gray/15 rounded w-1/3 animate-pulse mb-8" />
            <div className="w-full max-w-[400px] flex flex-col gap-6">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="flex items-center gap-6 border-b-2 border-cloud-gray pb-4 animate-pulse">
                  <div className="w-12 h-12 rounded-full bg-cloud-gray/20 shrink-0"></div>
                  <div className="h-4 w-32 bg-cloud-gray/20 rounded-full"></div>
                </div>
              ))}
            </div>
          </div>
        ) : !isUnlocked ? (
          /* Locked Leaderboard State */
          <div className="w-full flex flex-col items-center">
            <div className="w-full flex justify-center mb-6 relative">
              <div className="w-48 h-48 relative">
                <Image src="/emoji/unlockleaderboard.webp" alt="Unlock Leaderboard" fill className="object-contain" unoptimized />
              </div>
            </div>
            
            <h2 className="font-feather text-xl md:text-2xl text-almost-black font-bold mb-3 text-center">
              Unlock Leaderboards!
            </h2>
            
            <p className="text-silver text-sm md:text-base font-semibold mb-8 text-center max-w-[340px] leading-relaxed">
              Complete your first lesson or chapter test to start competing with others!
            </p>
            
            <Link href="/dashboard" className="w-full max-w-[280px]">
              <button className="w-full bg-duo-green hover:bg-duo-green/95 text-white font-extrabold py-3.5 rounded-xl shadow-[0_4px_0_#3f8f01] active:translate-y-[4px] active:shadow-none transition-all uppercase tracking-widest text-sm font-din-round cursor-pointer text-center">
                Start a Lesson
              </button>
            </Link>
     
            {/* Blurred Mock Leaderboard rankings underneath */}
            <div className="w-full max-w-[420px] mt-16 flex flex-col gap-5 opacity-30 pointer-events-none filter blur-[2px]">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="flex items-center justify-between border-b-2 border-cloud-gray pb-4 px-4 bg-snow-white rounded-xl py-3 border">
                  <div className="flex items-center gap-4">
                    <span className="font-bold text-silver w-6">#{i + 1}</span>
                    <div className="w-10 h-10 rounded-full bg-cloud-gray shrink-0"></div>
                    <span className="font-extrabold text-silver">Player_{1000 + i}</span>
                  </div>
                  <span className="font-bold text-silver">0 XP</span>
                </div>
              ))}
            </div>
          </div>
        ) : (
          /* Active Leaderboard State */
          <div className="w-full flex flex-col items-center">
            {/* Header Shield */}
            <div className="w-full flex justify-center mb-6 relative">
              <div className="w-32 h-32 relative">
                <Image src="/emoji/leaderboard.webp" alt="Leaderboard Logo" fill className="object-contain" unoptimized />
              </div>
            </div>
            
            <h2 className="font-feather text-2xl md:text-3xl text-almost-black font-bold mb-2 text-center tracking-wide">
              Weekly Rankings
            </h2>
            <p className="text-silver text-xs md:text-sm font-bold tracking-wider uppercase mb-8">
              XP Leaderboard
            </p>

            {/* Rankings List */}
            <div className="w-full max-w-[480px] flex flex-col gap-3">
              {profiles.slice(0, 10).map((profile, index) => {
                const rank = index + 1;
                const activeProfileId = user ? user.id : (typeof window !== "undefined" ? localStorage.getItem("guest_session_id") : null);
                const isSelf = activeProfileId === profile.id;
                
                // Get display username from name or fallback to profile ID substring
                let displayName = "Anonymous User";
                if (profile.name) {
                  displayName = profile.name;
                } else if (profile.id.startsWith("guest_")) {
                  displayName = `Guest_${profile.id.substring(6, 11)}`;
                } else {
                  displayName = `Reviewer_${profile.id.substring(5, 10)}`;
                }

                // Rank specific badge background
                let rankBadge = (
                  <span className="font-bold text-silver w-8 text-center text-sm md:text-base">
                    {rank}
                  </span>
                );
                if (rank === 1) {
                  rankBadge = <span className="text-xl md:text-2xl w-8 text-center">🥇</span>;
                } else if (rank === 2) {
                  rankBadge = <span className="text-xl md:text-2xl w-8 text-center">🥈</span>;
                } else if (rank === 3) {
                  rankBadge = <span className="text-xl md:text-2xl w-8 text-center">🥉</span>;
                }

                return (
                  <div 
                    key={profile.id}
                    className={`flex items-center justify-between border-2 rounded-2xl p-4 transition-all duration-150 ${
                      isSelf 
                        ? "border-sky-blue bg-sky-blue/10 shadow-[0_4px_0_#189edc] -translate-y-0.5" 
                        : "border-cloud-gray bg-snow-white shadow-none"
                    }`}
                  >
                    <div className="flex items-center gap-3 md:gap-4 overflow-hidden">
                      {rankBadge}
                      {/* Avatar container */}
                      <div className="w-10 h-10 rounded-full bg-duo-green-light flex items-center justify-center border-2 border-cloud-gray p-0.5 shrink-0 overflow-hidden">
                        <img 
                          src={isSelf && user?.imageUrl ? user.imageUrl : "/emoji/profile.webp"} 
                          alt={displayName} 
                          className="object-cover w-full h-full rounded-full" 
                        />
                      </div>
                      <span className={`font-extrabold text-sm md:text-base truncate max-w-[160px] md:max-w-[220px] ${
                        isSelf ? "text-sky-blue" : "text-almost-black"
                      }`}>
                        {displayName} {isSelf && <span className="text-[10px] font-bold bg-sky-blue text-white px-2 py-0.5 rounded-full uppercase ml-1">You</span>}
                      </span>
                    </div>

                    <div className="flex items-center gap-3 shrink-0">
                      {profile.streak > 0 && (
                        <span title={`${profile.streak} Day Streak`} className="text-orange-500 font-bold text-xs md:text-sm flex items-center gap-0.5 select-none">
                          🔥 {profile.streak}
                        </span>
                      )}
                      <span className="font-extrabold text-sm md:text-base text-almost-black flex items-center gap-1">
                        🏆 {profile.total_score} <span className="text-[10px] md:text-xs text-silver font-bold uppercase">XP</span>
                      </span>
                    </div>
                  </div>
                );
              })}

              {profiles.length === 0 && (
                <p className="text-silver font-bold text-sm text-center py-6">
                  No active rankings yet. Be the first to join!
                </p>
              )}
            </div>
          </div>
        )}
      </main>
 
      {/* Right Sidebar */}
      <aside className="hidden lg:block w-[368px] shrink-0 pt-4 md:pt-8 font-din-round">
        <div className="border-2 border-cloud-gray rounded-2xl p-6 flex flex-col gap-5 bg-snow-white">
          <h3 className="font-extrabold text-xs md:text-sm text-silver uppercase tracking-wider">
            What are Leaderboards?
          </h3>
          <h2 className="font-feather text-xl md:text-2xl text-duo-green font-bold leading-snug">
            Do lessons. Earn XP. Compete.
          </h2>
          <p className="text-silver text-xs md:text-sm font-semibold leading-relaxed">
            Earn XP by completing simulated exam chapters, then climb the ladder to compete with players in the weekly leaderboard rankings.
          </p>
          <div className="w-full flex justify-end mt-4">
            <div className="w-36 h-36 relative mt-2 animate-[bounce_4s_infinite]">
              <Image src="/emoji/hmm.webp" alt="Mascot" fill className="object-contain" unoptimized />
            </div>
          </div>
        </div>
      </aside>
    </>
  );
}
