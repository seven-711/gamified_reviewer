"use client";

import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import { useUser } from "@clerk/nextjs";
import { supabase } from "@/lib/supabase";

interface StatsContextProps {
  streak: number;
  xp: number;
  gems: number;
  hearts: number;
  streakFreezeCount: number;
  isLoaded: boolean;
  refreshStats: () => Promise<void>;
  updateStatsLocally: (updates: Partial<{
    streak: number;
    xp: number;
    gems: number;
    hearts: number;
    streakFreezeCount: number;
  }>) => void;
}

const StatsContext = createContext<StatsContextProps | undefined>(undefined);

export const useStats = () => {
  const context = useContext(StatsContext);
  if (!context) {
    throw new Error("useStats must be used within a StatsProvider");
  }
  return context;
};

export const StatsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, isLoaded: isUserLoaded, isSignedIn } = useUser();
  const [streak, setStreak] = useState(0);
  const [xp, setXp] = useState(0);
  const [gems, setGems] = useState(50);
  const [hearts, setHearts] = useState(5);
  const [streakFreezeCount, setStreakFreezeCount] = useState(0);
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
      setStreakFreezeCount(0);
      setIsLoaded(true);
      return;
    }

    try {
      const { data, error } = await supabase
        .from("profiles")
        .select("streak, total_score, hearts, last_heart_lost_at, gems, streak_freeze_count")
        .eq("id", profileId)
        .single();

      if (!error && data) {
        setStreak(data.streak || 0);
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
    } catch (err) {
      console.error("Error loading stats in StatsProvider:", err);
    } finally {
      setIsLoaded(true);
    }
  }, [user, isUserLoaded, isSignedIn]);

  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  const updateStatsLocally = useCallback((updates: Partial<{
    streak: number;
    xp: number;
    gems: number;
    hearts: number;
    streakFreezeCount: number;
  }>) => {
    if (updates.streak !== undefined) setStreak(updates.streak);
    if (updates.xp !== undefined) setXp(updates.xp);
    if (updates.gems !== undefined) setGems(updates.gems);
    if (updates.hearts !== undefined) setHearts(updates.hearts);
    if (updates.streakFreezeCount !== undefined) setStreakFreezeCount(updates.streakFreezeCount);
  }, []);

  return (
    <StatsContext.Provider
      value={{
        streak,
        xp,
        gems,
        hearts,
        streakFreezeCount,
        isLoaded,
        refreshStats: fetchStats,
        updateStatsLocally,
      }}
    >
      {children}
    </StatsContext.Provider>
  );
};
