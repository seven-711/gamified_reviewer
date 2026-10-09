"use client";

import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import { useAuth } from "@/lib/auth";
import { supabase } from "@/lib/supabase";
import { getLevelFromXp } from "@/lib/cadetRank";

interface StatsContextProps {
  streak: number;
  xp: number;
  gems: number;
  hearts: number;
  currentLevel: number;
  streakFreezeCount: number;
  lessonsCompleted: number;
  lastLessonDate: string | null;
  isLoaded: boolean;
  refreshStats: () => Promise<void>;
  updateStatsLocally: (updates: Partial<{
    streak: number;
    xp: number;
    gems: number;
    hearts: number;
    currentLevel: number;
    streakFreezeCount: number;
    lessonsCompleted: number;
    lastLessonDate: string | null;
  }>) => void;
}

export const StatsContext = createContext<StatsContextProps | undefined>(undefined);

export const useStats = () => {
  const context = useContext(StatsContext);
  if (!context) {
    throw new Error("useStats must be used within a StatsProvider");
  }
  return context;
};

export const StatsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, isLoaded: isUserLoaded, isSignedIn } = useAuth();
  const [streak, setStreak] = useState(0);
  const [xp, setXp] = useState(0);
  const [gems, setGems] = useState(50);
  const [hearts, setHearts] = useState(5);
  const [currentLevel, setCurrentLevel] = useState(1);
  const [streakFreezeCount, setStreakFreezeCount] = useState(0);
  const [lessonsCompleted, setLessonsCompleted] = useState(0);
  const [lastLessonDate, setLastLessonDate] = useState<string | null>(null);
  const [isLoaded, setIsLoaded] = useState(false);

  const fetchStats = useCallback(async () => {
    if (!isUserLoaded) return;

    let profileId: string | null = null;
    if (isSignedIn && user) {
      profileId = user.id;
    } else if (typeof window !== "undefined") {
      profileId = localStorage.getItem("guest_session_id");
    }

    if (!profileId) {
      setStreak(0);
      setXp(0);
      setGems(50);
      setHearts(5);
      setCurrentLevel(1);
      setStreakFreezeCount(0);
      setLessonsCompleted(0);
      setIsLoaded(true);
      return;
    }

    try {
      const [gameStateRes, progressRes] = await Promise.all([
        supabase
          .from("profile_game_state")
          .select("streak, hearts, last_heart_lost_at, gems, streak_freeze_count")
          .eq("profile_id", profileId)
          .maybeSingle(),
        supabase
          .from("profile_progress")
          .select("total_score, current_level, lessons_completed, last_lesson_date")
          .eq("profile_id", profileId)
          .maybeSingle(),
      ]);

      const gameState = gameStateRes.data;
      const progress = progressRes.data;

      if (gameState) {
        setStreak(gameState.streak || 0);
        setGems(gameState.gems !== undefined && gameState.gems !== null ? gameState.gems : 50);
        setStreakFreezeCount(gameState.streak_freeze_count || 0);

        let h = gameState.hearts !== undefined && gameState.hearts !== null ? gameState.hearts : 5;
        if (h < 5 && gameState.last_heart_lost_at) {
          const now = new Date().getTime();
          const lastLost = new Date(gameState.last_heart_lost_at).getTime();
          const hoursPassed = (now - lastLost) / (1000 * 60 * 60);
          const regenerated = Math.floor(hoursPassed / 4);
          if (regenerated > 0) {
            h = Math.min(5, h + regenerated);
          }
        }
        setHearts(h);
      }

      if (progress) {
        const score = progress.total_score || 0;
        setXp(score);
        setCurrentLevel(getLevelFromXp(score));
        let effDate = progress.last_lesson_date || null;
        if (typeof window !== "undefined") {
          const local = localStorage.getItem("last_lesson_completed_date");
          if (local && (!effDate || local > effDate)) effDate = local;
        }
        setLastLessonDate(effDate);
      }
    } catch (err) {
      console.error("Error loading stats in StatsProvider:", err);
    } finally {
      setIsLoaded(true);
    }
  }, [user, isUserLoaded, isSignedIn]);

  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  useEffect(() => {
    if (typeof window === "undefined") return;

    const channel = new BroadcastChannel("reviewer_channel");
    const handleBroadcastMessage = (event: MessageEvent) => {
      if (event.data === "reviewer-db-update") {
        fetchStats();
        window.dispatchEvent(new CustomEvent("reviewer-db-update", { detail: { fromBroadcast: true } }));
      }
    };
    channel.addEventListener("message", handleBroadcastMessage);

    const handleLocalUpdate = (e: Event) => {
      const customEvent = e as CustomEvent;
      if (!customEvent.detail?.fromBroadcast) {
        channel.postMessage("reviewer-db-update");
      }
    };
    window.addEventListener("reviewer-db-update", handleLocalUpdate);

    return () => {
      channel.removeEventListener("message", handleBroadcastMessage);
      channel.close();
      window.removeEventListener("reviewer-db-update", handleLocalUpdate);
    };
  }, [fetchStats]);

  useEffect(() => {
    if (!isLoaded) return;
    
    let profileId: string | null = null;
    if (isSignedIn && user) {
      profileId = user.id;
    } else if (typeof window !== "undefined") {
      profileId = localStorage.getItem("guest_session_id");
    }

    if (!profileId) return;

    const gameStateChannel = supabase
      .channel(`realtime:profile_game_state:${profileId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "profile_game_state",
          filter: `profile_id=eq.${profileId}`,
        },
        () => {
          fetchStats();
          window.dispatchEvent(new CustomEvent("reviewer-db-update"));
        }
      )
      .subscribe();

    const progressChannel = supabase
      .channel(`realtime:profile_progress:${profileId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "profile_progress",
          filter: `profile_id=eq.${profileId}`,
        },
        () => {
          fetchStats();
          window.dispatchEvent(new CustomEvent("reviewer-db-update"));
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(gameStateChannel);
      supabase.removeChannel(progressChannel);
    };
  }, [isLoaded, fetchStats, isSignedIn, user]);

  const updateStatsLocally = useCallback((updates: Partial<{
    streak: number;
    xp: number;
    gems: number;
    hearts: number;
    currentLevel: number;
    streakFreezeCount: number;
    lessonsCompleted: number;
    lastLessonDate: string | null;
  }>) => {
    if (updates.streak !== undefined) setStreak(updates.streak);
    if (updates.xp !== undefined) setXp(updates.xp);
    if (updates.gems !== undefined) setGems(updates.gems);
    if (updates.hearts !== undefined) setHearts(updates.hearts);
    if (updates.currentLevel !== undefined) setCurrentLevel(updates.currentLevel);
    if (updates.streakFreezeCount !== undefined) setStreakFreezeCount(updates.streakFreezeCount);
    if (updates.lessonsCompleted !== undefined) setLessonsCompleted(updates.lessonsCompleted);
    if (updates.lastLessonDate !== undefined) setLastLessonDate(updates.lastLessonDate);
  }, []);

  return (
    <StatsContext.Provider
      value={{
        streak,
        xp,
        gems,
        hearts,
        currentLevel,
        streakFreezeCount,
        lessonsCompleted,
        lastLessonDate,
        isLoaded,
        refreshStats: fetchStats,
        updateStatsLocally,
      }}
    >
      {children}
    </StatsContext.Provider>
  );
};
