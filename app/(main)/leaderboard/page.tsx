"use client";

import React, { useEffect, useState, useCallback } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useUser } from "@clerk/nextjs";
import { supabase } from "@/lib/supabase";
import { StreakAsset } from "@/components/ui/StreakAsset";

const LEAGUES = [
  { name: "Bronze League", image: "/img/gen_imgs/league_/bronze_league.webp" },
  { name: "Silver League", image: "/img/gen_imgs/league_/silver_league.webp" },
  { name: "Gold League", image: "/img/gen_imgs/league_/gold_league.webp" },
  { name: "Crystal League", image: "/img/gen_imgs/league_/crystal_league.webp" },
  { name: "Master League", image: "/img/gen_imgs/league_/master_league.webp" },
  { name: "Diamond League", image: "/img/gen_imgs/league_/diamond_league.webp" },
  { name: "Champion League", image: "/img/gen_imgs/league_/champion league.webp" },
  { name: "Legend League", image: "/img/gen_imgs/league_/legend_league.webp" },
];

const getLeagueBrandColor = (name: string) => {
  switch (name) {
    case "Legend League": return "text-red-600 dark:text-red-500";
    case "Champion League": return "text-pink-600 dark:text-pink-500";
    case "Master League": return "text-purple-600 dark:text-purple-500";
    case "Diamond League": return "text-blue-500 dark:text-blue-400";
    case "Crystal League": return "text-teal-600 dark:text-teal-400";
    case "Gold League": return "text-amber-600 dark:text-amber-500";
    case "Silver League": return "text-gray-500 dark:text-gray-400";
    case "Bronze League":
    default: return "text-[#cc348d] dark:text-[#cc348d]";
  }
};

interface LeaderboardUser {
  id: string;
  name: string | null;
  total_score: number;
  streak: number;
  lessons_completed?: number;
  last_lesson_date?: string | null;
}

interface LeagueInfo {
  name: string;
  image: string;
}

export function getLeagueInfo(xp: number, lessonsCompleted: number, rank: number): LeagueInfo {
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

interface LeagueStyle {
  bgClass: string;
  borderClass: string;
  shadowColor: string;
  textColor: string;
  glowColor: string;
}

export function getLeagueStyle(leagueName: string): LeagueStyle {
  switch (leagueName) {
    case "Legend League":
      return {
        bgClass: "bg-gradient-to-r from-red-600 to-rose-700",
        borderClass: "border-red-800",
        shadowColor: "#450a0a",
        textColor: "text-red-100",
        glowColor: "rgba(239, 68, 68, 0.4)",
      };
    case "Champion League":
      return {
        bgClass: "bg-gradient-to-r from-pink-500 to-rose-600",
        borderClass: "border-pink-700",
        shadowColor: "#500724",
        textColor: "text-pink-100",
        glowColor: "rgba(236, 72, 153, 0.4)",
      };
    case "Master League":
      return {
        bgClass: "bg-gradient-to-r from-purple-600 to-indigo-700",
        borderClass: "border-purple-800",
        shadowColor: "#3b0764",
        textColor: "text-purple-100",
        glowColor: "rgba(168, 85, 247, 0.4)",
      };
    case "Diamond League":
      return {
        bgClass: "bg-gradient-to-r from-blue-500 to-sky-600",
        borderClass: "border-blue-700",
        shadowColor: "#172554",
        textColor: "text-blue-100",
        glowColor: "rgba(59, 130, 246, 0.4)",
      };
    case "Crystal League":
      return {
        bgClass: "bg-gradient-to-r from-cyan-400 to-teal-500",
        borderClass: "border-cyan-700",
        shadowColor: "#083344",
        textColor: "text-cyan-950 dark:text-cyan-100 font-extrabold",
        glowColor: "rgba(34, 211, 238, 0.4)",
      };
    case "Gold League":
      return {
        bgClass: "bg-gradient-to-r from-amber-400 to-yellow-500",
        borderClass: "border-amber-600",
        shadowColor: "#78350f",
        textColor: "text-amber-950",
        glowColor: "rgba(245, 158, 11, 0.4)",
      };
    case "Silver League":
      return {
        bgClass: "bg-gradient-to-r from-zinc-400 to-slate-500",
        borderClass: "border-zinc-600",
        shadowColor: "#27272a",
        textColor: "text-zinc-100",
        glowColor: "rgba(156, 163, 175, 0.4)",
      };
    case "Bronze League":
    default:
      return {
        bgClass: "bg-gradient-to-r from-[#cc348d] to-[#cc348d]",
        borderClass: "border-[#b3247a]",
        shadowColor: "#8c1c5e",
        textColor: "text-pink-100",
        glowColor: "rgba(204, 52, 141, 0.4)",
      };
  }
}

function getLeaderboardUserData(
  p: LeaderboardUser | undefined,
  currentUserId: string | null,
  currentUserImageUrl: string | undefined
) {
  if (!p) return { displayName: "", avatarUrl: "/emoji/profile.webp" };

  let displayName = "Anonymous User";
  let avatarUrl = "/emoji/profile.webp";

  if (p.name) {
    if (p.name.includes("|")) {
      const parts = p.name.split("|");
      displayName = parts[0] || "Anonymous User";
      avatarUrl = parts[1] || "/emoji/profile.webp";
    } else {
      displayName = p.name;
    }
  } else if (p.id.startsWith("guest_")) {
    displayName = `Guest_${p.id.substring(6, 11)}`;
  } else {
    displayName = `Reviewer_${p.id.substring(5, 10)}`;
  }

  if (p.id === currentUserId) {
    displayName = "You";
    if (currentUserImageUrl) {
      avatarUrl = currentUserImageUrl;
    }
  }
  return { displayName, avatarUrl };
}

export default function LeaderboardPage() {
  const router = useRouter();
  const { user, isLoaded } = useUser();
  const [profiles, setProfiles] = useState<LeaderboardUser[]>([]);
  const [currentUserProfile, setCurrentUserProfile] = useState<LeaderboardUser | null>(null);
  const [currentUserRank, setCurrentUserRank] = useState<number>(1);
  const [loading, setLoading] = useState(true);
  const [isMounted, setIsMounted] = useState(false);
  const activeRef = React.useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  const fetchLeaderboard = useCallback(async () => {
    if (!isLoaded) return;
    try {
      const [profilesRes, progressRes, gameStateRes] = await Promise.all([
        supabase.from("profiles").select("id, name"),
        supabase.from("profile_progress").select("profile_id, total_score, lessons_completed, last_lesson_date"),
        supabase.from("profile_game_state").select("profile_id, streak"),
      ]);

      if (profilesRes.error) {
        console.error("Error fetching profiles:", profilesRes.error);
      } else if (profilesRes.data) {
        const progressMap = new Map(
          progressRes.data?.map(p => [p.profile_id, { 
            total_score: p.total_score, 
            lessons_completed: p.lessons_completed, 
            last_lesson_date: p.last_lesson_date 
          }]) || []
        );
        const streakMap = new Map(gameStateRes.data?.map(s => [s.profile_id, s.streak]) || []);

        const mapped = profilesRes.data.map((p: any) => {
          const prog = progressMap.get(p.id) || { total_score: 0, lessons_completed: 0, last_lesson_date: null };
          return {
            id: p.id,
            name: p.name,
            total_score: prog.total_score,
            lessons_completed: prog.lessons_completed,
            streak: streakMap.get(p.id) || 0,
            last_lesson_date: prog.last_lesson_date || null,
          };
        }).sort((a, b) => b.total_score - a.total_score);

        // Filter out guest accounts from public leaderboard rankings
        const registeredProfiles = mapped.filter((p) => !p.id.startsWith("guest_"));
        setProfiles(registeredProfiles);

        // In the background, fetch other users' images from Clerk API
        const registeredIds = registeredProfiles.map((p) => p.id);
        if (registeredIds.length > 0) {
          fetch("/api/users/avatars", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ userIds: registeredIds }),
          })
            .then((res) => res.json())
            .then((avatarData) => {
              if (avatarData && avatarData.users) {
                // Merge avatar info into local profile state
                setProfiles((prev) =>
                  prev.map((p) => {
                    const uInfo = avatarData.users[p.id];
                    if (uInfo) {
                      const combinedName = `${uInfo.name || p.name || "Learner"}|${uInfo.imageUrl}`;
                      return {
                        ...p,
                        name: combinedName,
                      };
                    }
                    return p;
                  })
                );
              }
            })
            .catch((err) => console.error("Error fetching avatars:", err));
        }

        const profileId = user ? user.id : (typeof window !== "undefined" ? localStorage.getItem("guest_session_id") : null);
        if (profileId) {
          const current = mapped.find((p) => p.id === profileId);
          if (current) {
            setCurrentUserProfile(current);
          }
          const rankIdx = registeredProfiles.findIndex((p) => p.id === profileId);
          if (rankIdx !== -1) {
            setCurrentUserRank(rankIdx + 1);
          }
        }
      }
    } catch (err) {
      console.error("Failed to load leaderboard:", err);
    } finally {
      setLoading(false);
    }
  }, [user, isLoaded]);

  useEffect(() => {
    fetchLeaderboard();

    // Listen to local update events
    const handleUpdate = () => {
      fetchLeaderboard();
    };
    window.addEventListener("reviewer-db-update", handleUpdate);

    // Listen to global changes in progress or game state for real-time leaderboard rankings
    const progressChannel = supabase
      .channel("realtime:leaderboard_progress")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "profile_progress" },
        () => {
          fetchLeaderboard();
        }
      )
      .subscribe();

    const gameStateChannel = supabase
      .channel("realtime:leaderboard_game")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "profile_game_state" },
        () => {
          fetchLeaderboard();
        }
      )
      .subscribe();

    return () => {
      window.removeEventListener("reviewer-db-update", handleUpdate);
      supabase.removeChannel(progressChannel);
      supabase.removeChannel(gameStateChannel);
    };
  }, [fetchLeaderboard]);

  // Determine if unlocked (must be logged in AND has at least 1 lesson completed -> total_score > 0)
  const isUnlocked = !!user && currentUserProfile ? currentUserProfile.total_score > 0 : false;

  const currentUserId = user ? user.id : (typeof window !== "undefined" ? localStorage.getItem("guest_session_id") : null);

  const leagueInfo = currentUserProfile 
    ? getLeagueInfo(currentUserProfile.total_score, currentUserProfile.lessons_completed || 0, currentUserRank)
    : { name: "Bronze League", image: "/img/gen_imgs/league_/bronze_league.webp" };

  const leagueStyle = getLeagueStyle(leagueInfo.name);
  const activeIndex = LEAGUES.findIndex((l) => l.name === leagueInfo.name);

  const [activeTab, setActiveTab] = useState<"league" | "global">("league");

  useEffect(() => {
    if (!loading && activeRef.current) {
      const timer = setTimeout(() => {
        activeRef.current?.scrollIntoView({
          behavior: "smooth",
          block: "nearest",
          inline: "center",
        });
      }, 300);
      return () => clearTimeout(timer);
    }
  }, [loading, leagueInfo.name]);

  return (
    <>
      {/* Center Column */}
      <main className="flex-1 w-full max-w-[600px] mx-auto px-0 sm:px-4 font-din-round">

        {!isMounted || loading ? (
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
              <div className="w-68 h-68 relative">
                <Image src="/emoji/unlockleaderboard.webp" alt="Unlock Leaderboard" fill className="object-contain" unoptimized />
              </div>
            </div>

            {!user ? (
              <>
                <h2 className="font-feather text-xl md:text-2xl text-almost-black font-bold mb-3 text-center">
                  Join the Leaderboard!
                </h2>

                <p className="text-silver text-sm md:text-base font-semibold mb-8 text-center max-w-[340px] leading-relaxed">
                  You are currently playing as a guest. Log in or create a profile to compete in leaderboards!
                  {currentUserProfile && currentUserProfile.total_score > 0 && (
                    <span className="block mt-3 text-duo-green font-bold text-center">
                      Current Accumulated XP: {currentUserProfile.total_score} XP
                    </span>
                  )}
                </p>

                <Link href="/signup" className="w-full max-w-[280px]">
                  <button className="w-full bg-duo-green hover:bg-duo-green/95 text-white font-extrabold py-3.5 rounded-xl shadow-[0_4px_0_#3f8f01] active:translate-y-[4px] active:shadow-none transition-all uppercase tracking-widest text-sm font-din-round cursor-pointer text-center">
                    Create a Profile
                  </button>
                </Link>
              </>
            ) : (
              <>
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
              </>
            )}

            {/* Blurred Mock Leaderboard rankings underneath */}
            <div className="w-full max-w-[420px] mt-16 flex flex-col gap-5 opacity-30 pointer-events-none filter blur-[3px]">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="flex items-center justify-between border-b-2 border-cloud-gray px-4 bg-snow-white rounded-xl py-3 border">
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
          /* Active Redesigned Gamified Leaderboard State */
          <div className="w-full flex flex-col items-center">

            {/* League Title & Rankings Horizontal Navigation */}
            <div className="text-center flex flex-col items-center w-full">
              <h2 className="font-feather text-2xl text-almost-black font-extrabold tracking-wide dark:text-snow-white">
                {leagueInfo.name}
              </h2>
              <p className="text-silver text-xs font-semibold uppercase tracking-wider dark:text-silver/80">
                You are ranked <span className={`font-black ${getLeagueBrandColor(leagueInfo.name)}`}>#{currentUserRank}</span> this week
              </p>
            </div>

            <div className="w-full max-w-[540px] px-4 py-2 mt-2 mb-6">
              <div className="relative w-full">
                <div className="flex gap-6 overflow-x-auto py-4 px-6 items-center [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none] [mask-image:linear-gradient(to_right,transparent,black_32px,black_calc(100%-32px),transparent)] [webkit-mask-image:linear-gradient(to_right,transparent,black_32px,black_calc(100%-32px),transparent)]">
                  {/* Left Spacer to allow centering first items */}
                  <div className="w-[calc(50%-44px)] shrink-0" />

                  {LEAGUES.map((lg, i) => {
                    const isActive = i === activeIndex;
                    const isPrevious = i < activeIndex;
                    const isBeyond = i > activeIndex;

                    return (
                      <div
                        key={lg.name}
                        ref={isActive ? activeRef : undefined}
                        className={`flex flex-col items-center gap-1.5 shrink-0 transition-all duration-300 ${
                          isActive 
                            ? "scale-110 opacity-100 font-extrabold" 
                            : isPrevious 
                            ? "scale-95 opacity-50 filter grayscale" 
                            : "scale-90 opacity-20 filter grayscale blur-[1.5px]"
                        }`}
                      >
                        <div className="w-16 h-16 relative flex items-center justify-center shrink-0">
                          {isActive && (
                            <div 
                              className="absolute w-14 h-14 rounded-full blur-lg pointer-events-none"
                              style={{ background: `radial-gradient(circle, ${leagueStyle.glowColor} 0%, transparent 70%)` }}
                            />
                          )}
                          <div className="w-14 h-14 relative shrink-0 drop-shadow-[0_2px_4px_rgba(0,0,0,0.15)]">
                            <Image 
                              src={lg.image} 
                              alt={lg.name} 
                              fill 
                              className="object-contain" 
                              unoptimized 
                            />
                          </div>
                        </div>
                        <span className={`text-[10px] font-black uppercase tracking-wider ${
                          isActive 
                            ? getLeagueBrandColor(lg.name) 
                            : isPrevious 
                            ? "text-silver" 
                            : "text-silver/50"
                        }`}>
                          {lg.name.split(" ")[0]}
                        </span>
                      </div>
                    );
                  })}

                  {/* Right Spacer to allow centering last items */}
                  <div className="w-[calc(50%-44px)] shrink-0" />
                </div>
              </div>
            </div>

            {/* Podium Columns Container */}
            <div className="w-full max-w-[440px] flex items-end justify-center gap-2 mt-8 mb-6 z-10 border-b border-cloud-gray/20 dark:border-cloud-gray/10 pb-4">

              {/* Rank 3 Podium (Left Column - Bubblegum Pink) */}
              <div className="flex-1 flex flex-col items-center min-w-0">
                {profiles[2] ? (
                  (() => {
                    const { displayName, avatarUrl } = getLeaderboardUserData(profiles[2], currentUserId, user?.imageUrl);
                    return (
                      <>
                        <span className="font-din-round font-bold text-[10px] text-charcoal dark:text-silver truncate max-w-full mb-1">
                          {displayName}
                        </span>
                        <div 
                          onClick={() => router.push(`/profile/${profiles[2].id}`)}
                          className="w-20 h-20 rounded-full overflow-hidden border-2 border-[#b3247a] bg-purple-900/40 p-0.5 mb-1.5 relative shadow-md shrink-0 cursor-pointer hover:scale-105 active:scale-95 transition-all"
                        >
                          <img
                            src={avatarUrl}
                            alt="Rank 3"
                            className="object-cover w-full h-full rounded-full"
                          />
                        </div>
                      </>
                    );
                  })()
                ) : (
                  <div className="w-20 h-20 rounded-full border-2 border-dashed border-purple-800 flex items-center justify-center text-purple-600 mb-2">3</div>
                )}
                {/* Podium Block */}
                <div 
                  onClick={() => profiles[2] && router.push(`/profile/${profiles[2].id}`)}
                  className="w-full bg-gradient-to-t from-[#b3247a] to-[#cc348d] border-t-4 border-[#e066b1] rounded-t-xl py-2 flex flex-col items-center shadow-lg h-[110px] justify-end pb-3 relative cursor-pointer hover:brightness-105 active:scale-[0.99] transition-all"
                >
                  <div className="absolute -top-3.5 bg-[#8c1c5e]/80 text-[#fecdd3] text-[8px] font-black px-2 py-0.5 rounded-full select-none flex items-center gap-0.5 border border-[#cc348d]/40 uppercase tracking-wider">
                    {profiles[2]?.total_score || 0} XP
                  </div>
                  <div className="w-20 h-20 relative shrink-0">
                    <Image src="/img/gen_imgs/top3.webp" alt="3" fill className="object-contain" unoptimized />
                  </div>
                </div>
              </div>

              {/* Rank 1 Podium (Center Column - Sunshine Yellow) */}
              <div className="flex-1 flex flex-col items-center min-w-0 z-10 scale-105">
                {profiles[0] ? (
                  (() => {
                    const { displayName, avatarUrl } = getLeaderboardUserData(profiles[0], currentUserId, user?.imageUrl);
                    return (
                      <>
                        <span className="font-din-round font-bold text-[11px] text-[#ffc700] truncate max-w-full mb-1 flex items-center gap-0.5">
                          👑 {displayName}
                        </span>
                        <div 
                          onClick={() => router.push(`/profile/${profiles[0].id}`)}
                          className="w-20 h-20 rounded-full overflow-hidden border-4 border-[#ffc700] bg-purple-900/40 p-0.5 mb-1.5 relative shadow-xl shrink-0 cursor-pointer hover:scale-105 active:scale-95 transition-all"
                        >
                          <img
                            src={avatarUrl}
                            alt="Rank 1"
                            className="object-cover w-full h-full rounded-full"
                          />
                        </div>
                      </>
                    );
                  })()
                ) : (
                  <div className="w-20 h-20 rounded-full border-2 border-dashed border-purple-800 flex items-center justify-center text-purple-600 mb-2">1</div>
                )}
                {/* Podium Block */}
                <div 
                  onClick={() => profiles[0] && router.push(`/profile/${profiles[0].id}`)}
                  className="w-full bg-gradient-to-t from-[#d97706] to-[#ffc700] border-t-4 border-[#ffe066] rounded-t-xl py-3 flex flex-col items-center shadow-2xl h-[140px] justify-end pb-3 relative cursor-pointer hover:brightness-105 active:scale-[0.99] transition-all"
                >
                  <div className="absolute -top-3.5 bg-[#ffc700] text-purple-950 text-[9px] font-black px-2.5 py-0.5 rounded-full select-none flex items-center gap-0.5 shadow-md uppercase tracking-wider">
                    {profiles[0]?.total_score || 0} XP
                  </div>
                  <div className="w-20 h-20 relative shrink-0">
                    <Image src="/img/gen_imgs/top1.webp" alt="1" fill className="object-contain" unoptimized />
                  </div>
                </div>
              </div>

              {/* Rank 2 Podium (Right Column - Sky Blue) */}
              <div className="flex-1 flex flex-col items-center min-w-0">
                {profiles[1] ? (
                  (() => {
                    const { displayName, avatarUrl } = getLeaderboardUserData(profiles[1], currentUserId, user?.imageUrl);
                    return (
                      <>
                        <span className="font-din-round font-bold text-[10px] text-charcoal dark:text-silver truncate max-w-full mb-1">
                          {displayName}
                        </span>
                        <div 
                          onClick={() => router.push(`/profile/${profiles[1].id}`)}
                          className="w-20 h-20 rounded-full overflow-hidden border-2 border-[#1085ba] bg-purple-900/40 p-0.5 mb-1.5 relative shadow-md shrink-0 cursor-pointer hover:scale-105 active:scale-95 transition-all"
                        >
                          <img
                            src={avatarUrl}
                            alt="Rank 2"
                            className="object-cover w-full h-full rounded-full"
                          />
                        </div>
                      </>
                    );
                  })()
                ) : (
                  <div className="w-20 h-20 rounded-full border-2 border-dashed border-purple-800 flex items-center justify-center text-[#1085ba] mb-2">2</div>
                )}
                {/* Podium Block */}
                <div 
                  onClick={() => profiles[1] && router.push(`/profile/${profiles[1].id}`)}
                  className="w-full bg-gradient-to-t from-[#1085ba] to-[#1cb0f6] border-t-4 border-[#6bcaf6] rounded-t-xl py-2 flex flex-col items-center shadow-lg h-[125px] justify-end pb-3 relative cursor-pointer hover:brightness-105 active:scale-[0.99] transition-all"
                >
                  <div className="absolute -top-3.5 bg-[#0c9bdc] text-white text-[8px] font-black px-2 py-0.5 rounded-full select-none flex items-center gap-0.5 border border-[#1cb0f6]/40 uppercase tracking-wider">
                    {profiles[1]?.total_score || 0} XP
                  </div>
                  <div className="w-20 h-20 relative shrink-0">
                    <Image src="/img/gen_imgs/top2.webp" alt="2" fill className="object-contain" unoptimized />
                  </div>
                </div>
              </div>

            </div>

            {/* Rankings List */}
            <div className="w-full max-w-[540px] flex flex-col z-10">
              {profiles.slice(3).map((profile, index) => {
                const rank = index + 4;
                const { displayName, avatarUrl } = getLeaderboardUserData(profile, currentUserId, user?.imageUrl);

                // Rank specific badge background (Rank >= 4)
                const rankBadge = (
                  <span className="font-bold text-duo-green w-12 sm:w-20 text-center text-base sm:text-2xl shrink-0 select-none">
                    {rank}
                  </span>
                );

                // Pill styling for Rank 4+ (Default White/Gray adapting to dark mode)
                let rowBgClass = "border-transparent bg-transparent text-[#3c3c3c] dark:text-[#f1f5f9] shadow-none";

                return (
                  <div
                    key={profile.id}
                    onClick={() => router.push(`/profile/${profile.id}`)}
                    className={`flex items-center justify-between border-2 rounded-xl sm:p-4.5 transition-all duration-150 cursor-pointer hover:bg-white/5 active:scale-[0.99] ${rowBgClass}`}
                  >
                    <div className="flex items-center gap-4 sm:gap-6 overflow-hidden">
                      {rankBadge}
                      <div className="w-10 h-10 rounded-full overflow-hidden bg-purple-900/40 shrink-0 border border-cloud-gray/20">
                        <img
                          src={avatarUrl}
                          alt={displayName}
                          className="object-cover w-full h-full rounded-full"
                        />
                      </div>
                      <span className="font-din-round font-bold text-xs sm:text-sm md:text-base truncate max-w-[90px] min-[380px]:max-w-[120px] sm:max-w-[160px] md:max-w-[220px] tracking-[0.053em]">
                        {displayName}
                      </span>
                    </div>

                    <div className="flex items-center gap-1.5 sm:gap-3 shrink-0">
                      {profile.streak > 0 && (() => {
                        const todayStr = new Date().toLocaleDateString("en-CA");
                        const isStreakActive = profile.streak > 0 && profile.last_lesson_date === todayStr;
                        return (
                          <span title={`${profile.streak} Day Streak`} className={`font-din-round font-bold text-[10px] sm:text-xs md:text-sm flex items-center gap-0.5 sm:gap-1 select-none tracking-[0.053em] ${isStreakActive ? "text-[#f97316]" : "text-silver"}`}>
                            <StreakAsset
                              streak={profile.streak}
                              lastLessonDate={profile.last_lesson_date}
                              width={20}
                              height={20}
                              className="object-contain"
                            />
                            <span>{profile.streak}</span>
                          </span>
                        );
                      })()}
                      <span className="font-din-round font-bold text-xs sm:text-sm md:text-base flex items-center gap-1 select-none tracking-[0.053em]">
                        <Image src="/img/gen_imgs/exp.webp" alt="XP" width={20} height={20} className="object-contain" style={{ height: 'auto' }} />
                        <span>{profile.total_score} <span className="text-[9px] sm:text-[10px] md:text-xs font-bold uppercase tracking-normal">XP</span></span>
                      </span>
                    </div>
                  </div>
                );
              })}

              {profiles.length === 0 && (
                <p className="text-[#8c1c5e] font-din-round font-bold text-sm text-center py-6">
                  No active rankings yet. Be the first to join!
                </p>
              )}
            </div>
          </div>
        )}
      </main>

      {/* Right Sidebar */}
      <aside className="hidden lg:block w-[368px] shrink-0 pt-4 md:pt-8 font-din-round lg:sticky lg:top-6 lg:self-start lg:h-fit">
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
        </div>
      </aside>
    </>
  );
}
