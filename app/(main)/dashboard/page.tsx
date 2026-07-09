"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { supabase } from "@/lib/supabase";
import { useUser } from "@clerk/nextjs";
import RightSidebar from "@/components/ui/RightSidebar";
import { getOrCreateGuestSessionId, refillHeartsInDb } from "@/lib/session";
import { useAlert } from "@/components/ui/AlertContext";
import { useStats } from "@/components/ui/StatsContext";
// Data metadata fetched via API

interface UserProfile {
  id: string;
  email: string;
  exam_category: string;
  sub_topic?: string;
  study_style: string;
  difficulty: string;
  total_score: number;
  streak: number;
  hearts: number;
  gems: number;
}

async function checkDailyStreakValidation(
  dbProfile: any,
  showAlert: (msg: string) => Promise<void>
): Promise<{ streak: number; last_lesson_date: string | null }> {
  const profileId = dbProfile.id;
  const currentStreak = dbProfile.streak || 0;
  const lastLessonDateStr = dbProfile.last_lesson_date || null;
  
  // Make sure we have a local streak freeze initialized in localStorage
  if (typeof window !== "undefined") {
    const localFreeze = localStorage.getItem("streak_freeze_count");
    if (localFreeze === null) {
      const dbFreeze = dbProfile.streak_freeze_count !== undefined && dbProfile.streak_freeze_count !== null ? dbProfile.streak_freeze_count : 1;
      localStorage.setItem("streak_freeze_count", dbFreeze.toString());
      await supabase.from("profiles").update({ streak_freeze_count: dbFreeze }).eq("id", profileId);
    }
  }

  if (!lastLessonDateStr) {
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayStr = yesterday.toLocaleDateString("en-CA");
    if (typeof window !== "undefined") {
      localStorage.setItem("last_lesson_completed_date", yesterdayStr);
    }
    return { streak: currentStreak, last_lesson_date: yesterdayStr };
  }

  const todayStr = new Date().toLocaleDateString("en-CA");
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const lastDate = new Date(lastLessonDateStr + "T00:00:00");
  const diffTime = today.getTime() - lastDate.getTime();
  const diffDays = Math.round(diffTime / (1000 * 60 * 60 * 24));

  if (typeof window !== "undefined") {
    localStorage.setItem("last_lesson_completed_date", lastLessonDateStr);
  }

  if (diffDays <= 1) {
    return { streak: currentStreak, last_lesson_date: lastLessonDateStr };
  }

  // diffDays > 1: they missed a day
  let freezes = 0;
  if (typeof window !== "undefined") {
    freezes = parseInt(localStorage.getItem("streak_freeze_count") || "0", 10);
  } else {
    freezes = dbProfile.streak_freeze_count || 0;
  }

  if (freezes > 0) {
    const newFreezes = freezes - 1;
    if (typeof window !== "undefined") {
      localStorage.setItem("streak_freeze_count", newFreezes.toString());
    }
    
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayStr = yesterday.toLocaleDateString("en-CA");
    
    if (typeof window !== "undefined") {
      localStorage.setItem("last_lesson_completed_date", yesterdayStr);
    }

    await supabase
      .from("profiles")
      .update({ 
        streak_freeze_count: newFreezes,
        last_lesson_date: yesterdayStr
      })
      .eq("id", profileId);

    await showAlert("❄️ Streak Freeze used! Your daily streak was saved from resetting.");
    return { streak: currentStreak, last_lesson_date: yesterdayStr };
  } else {
    await supabase
      .from("profiles")
      .update({ 
        streak: 0,
        streak_freeze_count: 0
      })
      .eq("id", profileId);

    await showAlert("😢 Oh no! You missed a day and your streak reset to 0.");
    return { streak: 0, last_lesson_date: lastLessonDateStr };
  }
}

async function checkDailyLoginReward(
  profileId: string,
  currentGems: number,
  showAlert: (msg: string) => Promise<void>
): Promise<number> {
  if (typeof window === "undefined") return currentGems;
  const todayStr = new Date().toLocaleDateString("en-CA");
  const lastLoginRewardDate = localStorage.getItem("last_login_reward_date");
  if (lastLoginRewardDate !== todayStr) {
    const newGems = currentGems + 10;
    try {
      await supabase
        .from("profiles")
        .update({ gems: newGems })
        .eq("id", profileId);
      localStorage.setItem("last_login_reward_date", todayStr);
      await showAlert("🌅 Daily Login Reward! You received 💎 10 Gems.");
      return newGems;
    } catch (e) {
      console.error("Failed to update daily login gems reward", e);
    }
  }
  return currentGems;
}

async function checkHeartsRegeneration(dbProfile: any): Promise<{ hearts: number; last_heart_lost_at: string | null }> {
  const profileId = dbProfile.id;
  let currentHearts = dbProfile.hearts !== undefined && dbProfile.hearts !== null ? dbProfile.hearts : 5;
  let lastHeartLostAt = dbProfile.last_heart_lost_at || null;

  if (currentHearts < 5 && lastHeartLostAt) {
    const now = new Date().getTime();
    const lastLost = new Date(lastHeartLostAt).getTime();
    const hoursPassed = (now - lastLost) / (1000 * 60 * 60);
    const regenerated = Math.floor(hoursPassed / 4);

    if (regenerated > 0) {
      const newHearts = Math.min(5, currentHearts + regenerated);
      let newLastHeartLostAt = lastHeartLostAt;

      if (newHearts === 5) {
        newLastHeartLostAt = null;
      } else {
        newLastHeartLostAt = new Date(lastLost + regenerated * 4 * 60 * 60 * 1000).toISOString();
      }

      await supabase
        .from("profiles")
        .update({
          hearts: newHearts,
          last_heart_lost_at: newLastHeartLostAt
        })
        .eq("id", profileId);

      return { hearts: newHearts, last_heart_lost_at: newLastHeartLostAt };
    }
  }

  return { hearts: currentHearts, last_heart_lost_at: lastHeartLostAt };
}

export default function DashboardPage() {
  const { showAlert } = useAlert();
  const router = useRouter();
  const { streak, xp, gems, hearts, refreshStats } = useStats();
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState<UserProfile | null>(() => {
    if (typeof window !== "undefined") {
      const pendingPrefs = localStorage.getItem("onboarding_prefs");
      if (pendingPrefs) {
        try {
          const prefs = JSON.parse(pendingPrefs);
          return {
            id: "guest",
            email: "",
            exam_category: prefs.category,
            sub_topic: prefs.subTopic,
            study_style: prefs.studyStyle,
            difficulty: prefs.difficulty,
            total_score: 0,
            streak: 0,
            hearts: 5,
            gems: 50
          };
        } catch (e) {}
      }
    }
    return null;
  });
  const { user, isLoaded, isSignedIn } = useUser();

  const [scores, setScores] = useState<Record<string, {score: number, total: number, previousBest?: number, lastScore?: number, attempts?: number}>>({});
  const [unlockAll, setUnlockAll] = useState(false);
  const [testCount, setTestCount] = useState<number>(0);

  const [selectedTestForTimer, setSelectedTestForTimer] = useState<{ testId: string; testTitle: string } | null>(null);
  const [modalTimerDuration, setModalTimerDuration] = useState<number>(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("timer_duration");
      if (saved) return parseInt(saved, 10);
    }
    return 5;
  });
  const [savingTimer, setSavingTimer] = useState(false);
  const [quantSection, setQuantSection] = useState<string | null>(() => {
    if (typeof window !== "undefined") {
      return localStorage.getItem("quant_reasoning_section");
    }
    return null;
  });
  const [showHeartsBlocker, setShowHeartsBlocker] = useState(false);
  const [refillingHearts, setRefillingHearts] = useState(false);

  useEffect(() => {
    if (profile) {
      setProfile((prev) => {
        if (!prev) return null;
        if (
          prev.gems === gems &&
          prev.hearts === hearts &&
          prev.total_score === xp &&
          prev.streak === streak
        ) {
          return prev;
        }
        return {
          ...prev,
          gems,
          hearts,
          total_score: xp,
          streak,
        };
      });
    }
  }, [gems, hearts, xp, streak, profile]);

  useEffect(() => {
    async function loadData() {
      if (!isLoaded) return;
      
      try {
        const pendingPrefs = localStorage.getItem("onboarding_prefs");
        let activeProfile: UserProfile | null = null;
        if (!isSignedIn || !user) {
          const guestSessionId = getOrCreateGuestSessionId();
          // Query the guest profile from Supabase profiles
          const { data: guestDbProfile } = await supabase
            .from("profiles")
            .select("*")
            .eq("id", guestSessionId)
            .single();

          if (guestDbProfile) {
            const streakInfo = await checkDailyStreakValidation(guestDbProfile, showAlert);
            const heartsInfo = await checkHeartsRegeneration(guestDbProfile);
            
            let gGems = guestDbProfile.gems !== undefined && guestDbProfile.gems !== null ? guestDbProfile.gems : 50;
            gGems = await checkDailyLoginReward(guestSessionId, gGems, showAlert);

            activeProfile = {
              id: guestSessionId,
              email: "",
              exam_category: guestDbProfile.exam_category,
              sub_topic: guestDbProfile.sub_topic,
              study_style: guestDbProfile.study_style,
              difficulty: guestDbProfile.difficulty,
              total_score: guestDbProfile.total_score || 0,
              streak: streakInfo.streak,
              hearts: heartsInfo.hearts,
              gems: gGems
            };
            setProfile(activeProfile);
            if (guestDbProfile.timer_duration) {
              localStorage.setItem("timer_duration", guestDbProfile.timer_duration.toString());
            }
          } else if (pendingPrefs) {
            const prefs = JSON.parse(pendingPrefs);
            activeProfile = {
              id: guestSessionId,
              email: "",
              exam_category: prefs.category,
              sub_topic: prefs.subTopic,
              study_style: prefs.studyStyle,
              difficulty: prefs.difficulty,
              total_score: 0,
              streak: 0,
              hearts: 5,
              gems: 50
            };
            setProfile(activeProfile);
            if (prefs.timerDuration) {
              localStorage.setItem("timer_duration", prefs.timerDuration.toString());
            }
          } else {
            router.replace("/onboarding");
            return;
          }
        } else {
          // Check if there is a guest session to merge
          const guestSessionId = localStorage.getItem("guest_session_id");
          if (guestSessionId) {
            try {
              // 1. Fetch guest profile stats from Supabase
              const { data: guestProfile } = await supabase
                .from("profiles")
                .select("*")
                .eq("id", guestSessionId)
                .single();

              // 2. Fetch registered user profile if it already exists
              const { data: userProfile } = await supabase
                .from("profiles")
                .select("*")
                .eq("id", user.id)
                .single();

              const mergedXp = (userProfile?.total_score || 0) + (guestProfile?.total_score || 0);
              const mergedLessons = (userProfile?.lessons_completed || 0) + (guestProfile?.lessons_completed || 0);
              const mergedStreak = Math.max(userProfile?.streak || 0, guestProfile?.streak || 0);
              const mergedGems = (userProfile?.gems || 50) + (guestProfile?.gems || 0);

              const category = userProfile?.exam_category || guestProfile?.exam_category || (pendingPrefs ? JSON.parse(pendingPrefs).category : null);
              const subTopic = userProfile?.sub_topic || guestProfile?.sub_topic || (pendingPrefs ? JSON.parse(pendingPrefs).subTopic : null);
              const timerDuration = userProfile?.timer_duration || guestProfile?.timer_duration || (pendingPrefs ? JSON.parse(pendingPrefs).timerDuration : 5);

              // Merge last_lesson_date (use the newer one)
              let mergedLastLessonDate = userProfile?.last_lesson_date || guestProfile?.last_lesson_date || null;
              if (userProfile?.last_lesson_date && guestProfile?.last_lesson_date) {
                const userDate = new Date(userProfile.last_lesson_date);
                const guestDate = new Date(guestProfile.last_lesson_date);
                mergedLastLessonDate = userDate.getTime() > guestDate.getTime() ? userProfile.last_lesson_date : guestProfile.last_lesson_date;
              }

              // Merge streak freezes (max or sum up to 2)
              const mergedFreezes = Math.min(
                Math.max(userProfile?.streak_freeze_count ?? 1, guestProfile?.streak_freeze_count ?? 1),
                2
              );

              const guestHearts = guestProfile?.hearts !== undefined && guestProfile?.hearts !== null ? guestProfile.hearts : null;
              const guestLastHeartLostAt = guestProfile?.last_heart_lost_at || null;

              // Merge hearts (prioritize guest hearts since they represent the active quiz state, falling back to registered user's)
              const mergedHearts = guestHearts !== null ? guestHearts : (userProfile?.hearts ?? 5);
              const mergedLastHeartLostAt = guestHearts !== null ? guestLastHeartLostAt : (userProfile?.last_heart_lost_at || null);

              if (category) {
                await supabase.from("profiles").upsert({
                  id: user.id,
                  name: user.fullName || user.username || null,
                  exam_category: category,
                  sub_topic: subTopic,
                  timer_duration: timerDuration,
                  study_style: "Flashcards",
                  difficulty: "Beginner",
                  total_score: mergedXp,
                  lessons_completed: mergedLessons,
                  streak: mergedStreak,
                  last_lesson_date: mergedLastLessonDate,
                  streak_freeze_count: mergedFreezes,
                  gems: mergedGems,
                  hearts: mergedHearts,
                  last_heart_lost_at: mergedLastHeartLostAt
                });
                
                // Update local storage freeze count
                localStorage.setItem("streak_freeze_count", mergedFreezes.toString());
              }

              // Cleanup guest session
              localStorage.removeItem("guest_session_id");
              localStorage.removeItem("onboarding_prefs");
              
              // Delete guest profile from Supabase to keep DB clean
              await supabase.from("profiles").delete().eq("id", guestSessionId);
            } catch (mergeErr) {
              console.error("Failed to merge guest session into registered account:", mergeErr);
            }
          } else if (pendingPrefs) {
            // Check for pending onboarding preferences from pre-signup flow (fallback if guestSessionId was missing)
            try {
              const prefs = JSON.parse(pendingPrefs);
              await supabase.from("profiles").upsert({
                id: user.id,
                name: user.fullName || user.username || null,
                exam_category: prefs.category,
                sub_topic: prefs.subTopic,
                study_style: prefs.studyStyle || "Flashcards",
                difficulty: prefs.difficulty || "Beginner",
                timer_duration: prefs.timerDuration || 5,
              });
              localStorage.removeItem("onboarding_prefs");
            } catch (e) {
              console.error("Error saving pending prefs", e);
            }
          }

          const { data: userProfile, error } = await supabase
            .from("profiles")
            .select("*")
            .eq("id", user.id)
            .single();

          if (error || !userProfile || !userProfile.exam_category) {
            router.replace("/onboarding");
            return;
          }

          const streakInfo = await checkDailyStreakValidation(userProfile, showAlert);
          const heartsInfo = await checkHeartsRegeneration(userProfile);
          
          let uGems = userProfile.gems !== undefined && userProfile.gems !== null ? userProfile.gems : 50;
          uGems = await checkDailyLoginReward(userProfile.id, uGems, showAlert);

          activeProfile = {
            id: userProfile.id,
            email: "",
            exam_category: userProfile.exam_category,
            sub_topic: userProfile.sub_topic,
            study_style: userProfile.study_style,
            difficulty: userProfile.difficulty,
            total_score: userProfile.total_score || 0,
            streak: streakInfo.streak,
            hearts: heartsInfo.hearts,
            gems: uGems
          };
          setProfile(activeProfile);
          if (userProfile?.timer_duration) {
            localStorage.setItem("timer_duration", userProfile.timer_duration.toString());
          }
        }
        // Fetch metadata for activeProfile (guest or signed-in)
        if (activeProfile) {
          try {
            const res = await fetch('/api/tests?action=metadata');
            if (res.ok) {
              const data = await res.json();
              const availableTestsKeys = data.availableTests || [];
              const fullTopic = activeProfile.sub_topic || "General Review";
              const topicName = fullTopic.split(" > ").pop() || fullTopic;
              const formattedTopic = topicName.toLowerCase().replace(/[^a-z0-9]+/g, '_');
              
              const filtered = availableTestsKeys.filter((key: string) => key.startsWith(formattedTopic));
              setTestCount(Math.max(filtered.length, 1));
            } else {
              setTestCount(1);
            }
          } catch (e) {
            console.error("Failed to load test metadata", e);
            setTestCount(1);
          }
        }

        const saved = localStorage.getItem("timer_duration");
        if (saved) {
          setModalTimerDuration(parseInt(saved, 10));
        }

        setLoading(false);
      } catch (err) {
        console.error("Dashboard load failed", err);
        router.replace("/onboarding");
      }
    }
    loadData();
  }, [router, user, isLoaded, isSignedIn]);

  // Load scores from localStorage
  useEffect(() => {
    if (profile && testCount > 0) {
      const fullTopic = profile?.sub_topic || "General Review";
      const topicName = fullTopic.split(" > ").pop() || fullTopic;
      const formattedTopic = topicName.toLowerCase().replace(/[^a-z0-9]+/g, '_');
      
      const loadedScores: Record<string, {score: number, total: number, previousBest?: number, lastScore?: number, attempts?: number}> = {};
      for (let i = 1; i <= testCount; i++) {
        const testId = `${formattedTopic}_test${i}`;
        const scoreData = localStorage.getItem(`quiz_score_${testId}`);
        if (scoreData) {
          try {
            const parsed = JSON.parse(scoreData);
            if (parsed.score > parsed.total) {
              parsed.score = parsed.total;
            }
            loadedScores[testId] = parsed;
          } catch(e){}
        }
      }
      setTimeout(() => {
        setScores(loadedScores);
      }, 0);
    }
  }, [profile, testCount]);

  const handleTopicClick = (topicName: string, testId?: string) => {
    if (testId) {
      if (profile && profile.hearts === 0) {
        setShowHeartsBlocker(true);
        return;
      }
      const saved = localStorage.getItem("timer_duration");
      if (saved) {
        // Clear in-progress saved state so they start fresh with the new/existing timer
        localStorage.removeItem(`quiz_state_${testId}`);
        router.push(`/lesson?testId=${testId}`);
      } else {
        setSelectedTestForTimer({ testId, testTitle: topicName });
        setModalTimerDuration(5);
      }
    } else {
      router.push("/lesson");
    }
  };

  const startTestWithTimer = async () => {
    if (!selectedTestForTimer) return;
    if (profile && profile.hearts === 0) {
      setShowHeartsBlocker(true);
      return;
    }
    setSavingTimer(true);
    
    // Save to local storage
    localStorage.setItem("timer_duration", modalTimerDuration.toString());
    
    // If signed in, update Supabase in the background
    if (isSignedIn && user) {
      try {
        await supabase
          .from("profiles")
          .update({ timer_duration: modalTimerDuration })
          .eq("id", user.id);
      } catch (e) {
        console.error("Failed to update profile timer_duration in DB", e);
      }
    }
    
    if (selectedTestForTimer.testId !== "settings") {
      // Clear in-progress saved state so they start fresh with the new timer
      localStorage.removeItem(`quiz_state_${selectedTestForTimer.testId}`);
      router.push(`/lesson?testId=${selectedTestForTimer.testId}`);
    }
    
    setSelectedTestForTimer(null);
    setSavingTimer(false);
  };

  const handleRefillHeartsDashboard = async () => {
    if (!profile || profile.gems < 50) return;
    setRefillingHearts(true);
    const res = await refillHeartsInDb(profile.id);
    if (res.success) {
      setProfile((prev) => {
        if (!prev) return null;
        return {
          ...prev,
          gems: Math.max(0, prev.gems - 50),
          hearts: 5
        };
      });
      setShowHeartsBlocker(false);
      await refreshStats();
    } else {
      await showAlert("❌ Refill failed: " + res.error);
    }
    setRefillingHearts(false);
  };
  // Determine active index based on scores
  const rawSubTopic = profile?.sub_topic || "General Review";
  const fullTopic = rawSubTopic;
  const topicName = fullTopic.split(" > ").pop() || fullTopic;
  const formattedTopic = topicName.toLowerCase().replace(/[^a-z0-9]+/g, '_');
  
  let activeIndex = 0;
  for (let i = 1; i <= testCount; i++) {
    const tId = `${formattedTopic}_test${i}`;
    // Unlock next test if previous test exists and score is >= 80% of total
    if (scores[tId] && scores[tId].total > 0 && (scores[tId].score / scores[tId].total) >= 0.8) {
      activeIndex = i; // Move active to the next test
    } else {
      break; // Found an uncompleted or failed (<80%) test
    }
  }
  if (activeIndex >= testCount) activeIndex = testCount - 1; // Cap at the last test if all are completed
  const isQuantTopic = formattedTopic === "quantitative_reasoning";
  const showSubOnboarding = isQuantTopic && !quantSection;
  const showComingSoon = isQuantTopic && quantSection && quantSection !== "part1";

  return (
    <>
      <main className="flex-1 w-full max-w-[600px] mx-auto pb-24">
        <div className="flex flex-col gap-6 pt-2 items-center w-full">
          {/* Section Header */}
          <div className="w-full px-4 md:px-0 sticky top-3 md:top-6 z-30">
            <div className="w-full bg-duo-green rounded-2xl p-3 md:p-5 flex items-center justify-between shadow-[0_4px_0_#3f8f01]">
              <div className="flex flex-col text-white min-w-0 pr-2">
                <div className="flex items-center gap-2 mb-0.5">
                  <span onClick={() => router.push("/onboarding")} className="text-lg font-bold cursor-pointer hover:opacity-80 transition-opacity">←</span>
                  <span className="font-bold text-[10px] md:text-sm tracking-widest uppercase">
                    Section 1, Unit 1
                  </span>
                </div>
                <h2 className="font-feather text-base md:text-2xl font-bold tracking-wide leading-tight truncate">
                  {profile ? (
                    `${profile.exam_category} ${topicName ? `- ${topicName}` : ""}`
                  ) : (
                    <div className="h-6 w-48 bg-white/20 rounded animate-pulse mt-1" />
                  )}
                </h2>
              </div>
              <button className="flex items-center justify-center gap-2 bg-white/20 hover:bg-white/30 text-white font-bold p-2.5 sm:px-4 sm:py-2.5 rounded-2xl transition-colors shadow-[0_2px_0_rgba(255,255,255,0.2)] shrink-0">
                <Image src="/emoji/guidebook.webp" alt="Guidebook" width={24} height={24} className="brightness-0 invert w-auto h-auto" />
                <span className="hidden sm:inline text-sm">GUIDEBOOK</span>
              </button>
            </div>
          </div>

          {/* Quantitative Reasoning Active Section Banner */}
          {isQuantTopic && quantSection && (
            <div className="w-full flex items-center justify-between bg-sky-blue/10 border-2 border-sky-blue/20 rounded-2xl p-4 font-din-round animate-[fadeIn_0.3s_ease-out]">
              <div className="flex flex-col text-left">
                <span className="text-[10px] text-silver font-black uppercase tracking-wider">Current Focus Area</span>
                <span className="text-sm font-extrabold text-sky-blue uppercase">
                  {quantSection === "part1" 
                    ? "Part 1: Quantitative Aptitude" 
                    : quantSection === "part2_secA" 
                    ? "Part 2: Reasoning - Section A"
                    : quantSection === "part2_secB"
                    ? "Part 2: Reasoning - Section B"
                    : "Part 2: Reasoning - Section C"}
                </span>
              </div>
              <button
                onClick={() => {
                  setQuantSection(null);
                  localStorage.removeItem("quant_reasoning_section");
                }}
                className="bg-sky-blue hover:bg-sky-blue/95 hover:brightness-105 text-white font-extrabold text-[11px] px-3.5 py-2 rounded-xl shadow-[0_3px_0_#107cb0] active:translate-y-[2px] active:shadow-none transition-all cursor-pointer font-din-round uppercase tracking-wider"
              >
                Change
              </button>
            </div>
          )}

          {showSubOnboarding ? (
            /* Sub-onboarding Selector */
            <div className="flex flex-col gap-6 w-full px-4 md:px-0 animate-[fadeIn_0.3s_ease-out]">
              {/* Character mascot card */}
              <div className="flex gap-4 items-center bg-sky-blue/5 border-2 border-sky-blue/20 rounded-2xl p-4 md:p-5 shadow-sm text-left">
                <div className="w-20 h-20 relative shrink-0">
                  <Image 
                    src="/emoji/suspicious.webp" 
                    alt="Thinking Mascot" 
                    fill 
                    className="object-contain drop-shadow-md"
                    unoptimized
                  />
                </div>
                <div className="grow">
                  <h3 className="font-feather text-base md:text-lg font-bold text-charcoal leading-snug">
                    Choose Your Focus Area
                  </h3>
                  <p className="text-xs md:text-sm text-graphite font-medium mt-1 leading-relaxed">
                    Quantitative Reasoning contains a large question pool. Select a section below to get started:
                  </p>
                </div>
              </div>

              {/* 4 Cards selection */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 w-full">
                {/* Card 1: Part 1 */}
                <div
                  onClick={() => {
                    setQuantSection("part1");
                    localStorage.setItem("quant_reasoning_section", "part1");
                  }}
                  className="flex flex-col justify-between p-5 rounded-2xl border-2 border-cloud-gray hover:border-sky-blue bg-snow-white hover:bg-sky-blue/5 shadow-[0_4px_0_var(--color-cloud-gray)] hover:shadow-[0_4px_0_#189edc] cursor-pointer transition-all duration-150 active:translate-y-0.5 select-none text-left"
                >
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-2xl">📈</span>
                      <span className="bg-duo-green/10 text-duo-green text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider">
                        Ready (7 Chapters)
                      </span>
                    </div>
                    <h4 className="font-feather text-base md:text-lg font-bold text-charcoal">
                      Part 1: Quantitative Aptitude
                    </h4>
                    <p className="text-xs text-graphite font-medium mt-1 leading-normal">
                      Covers HCF/LCM, Permutations, Probability, Ratios, and Percentages.
                    </p>
                  </div>
                  <div className="mt-4 text-sky-blue font-bold text-xs flex items-center gap-1">
                    Start Learning →
                  </div>
                </div>

                {/* Card 2: Part 2 Sec A */}
                <div
                  onClick={() => {
                    setQuantSection("part2_secA");
                    localStorage.setItem("quant_reasoning_section", "part2_secA");
                  }}
                  className="flex flex-col justify-between p-5 rounded-2xl border-2 border-cloud-gray hover:border-sky-blue bg-snow-white hover:bg-sky-blue/5 shadow-[0_4px_0_var(--color-cloud-gray)] hover:shadow-[0_4px_0_#189edc] cursor-pointer transition-all duration-150 active:translate-y-0.5 select-none text-left opacity-75"
                >
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-2xl">🧠</span>
                      <span className="bg-silver/10 text-silver text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider">
                        Coming Soon
                      </span>
                    </div>
                    <h4 className="font-feather text-base md:text-lg font-bold text-charcoal">
                      Part 2: Reasoning (Sec A)
                    </h4>
                    <p className="text-xs text-graphite font-medium mt-1 leading-normal">
                      Logical deductions, analytical scenarios, and verbal-logical relations.
                    </p>
                  </div>
                  <div className="mt-4 text-silver font-bold text-xs">
                    Explore Preview →
                  </div>
                </div>

                {/* Card 3: Part 2 Sec B */}
                <div
                  onClick={() => {
                    setQuantSection("part2_secB");
                    localStorage.setItem("quant_reasoning_section", "part2_secB");
                  }}
                  className="flex flex-col justify-between p-5 rounded-2xl border-2 border-cloud-gray hover:border-sky-blue bg-snow-white hover:bg-sky-blue/5 shadow-[0_4px_0_var(--color-cloud-gray)] hover:shadow-[0_4px_0_#189edc] cursor-pointer transition-all duration-150 active:translate-y-0.5 select-none text-left opacity-75"
                >
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-2xl">🔍</span>
                      <span className="bg-silver/10 text-silver text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider">
                        Coming Soon
                      </span>
                    </div>
                    <h4 className="font-feather text-base md:text-lg font-bold text-charcoal">
                      Part 2: Reasoning (Sec B)
                    </h4>
                    <p className="text-xs text-graphite font-medium mt-1 leading-normal">
                      Number series, coding-decoding, and puzzle-based analytical tasks.
                    </p>
                  </div>
                  <div className="mt-4 text-silver font-bold text-xs">
                    Explore Preview →
                  </div>
                </div>

                {/* Card 4: Part 2 Sec C */}
                <div
                  onClick={() => {
                    setQuantSection("part2_secC");
                    localStorage.setItem("quant_reasoning_section", "part2_secC");
                  }}
                  className="flex flex-col justify-between p-5 rounded-2xl border-2 border-cloud-gray hover:border-sky-blue bg-snow-white hover:bg-sky-blue/5 shadow-[0_4px_0_var(--color-cloud-gray)] hover:shadow-[0_4px_0_#189edc] cursor-pointer transition-all duration-150 active:translate-y-0.5 select-none text-left opacity-75"
                >
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-2xl">🧩</span>
                      <span className="bg-silver/10 text-silver text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider">
                        Coming Soon
                      </span>
                    </div>
                    <h4 className="font-feather text-base md:text-lg font-bold text-charcoal">
                      Part 2: Reasoning (Sec C)
                    </h4>
                    <p className="text-xs text-graphite font-medium mt-1 leading-normal">
                      Spatial reasoning, pattern completion, and abstract diagrams.
                    </p>
                  </div>
                  <div className="mt-4 text-silver font-bold text-xs">
                    Explore Preview →
                  </div>
                </div>
              </div>
            </div>
          ) : showComingSoon ? (
            /* Coming Soon Placeholder */
            <div className="flex flex-col gap-6 items-center text-center py-10 px-4 md:px-0 animate-[fadeIn_0.3s_ease-out] w-full">
              <div className="flex flex-col items-center gap-4 max-w-[450px]">
                {/* Floating Mascot with shadow */}
                <div className="w-28 h-28 relative shrink-0 animate-[float_3s_infinite] drop-shadow-[0_6px_12px_rgba(0,0,0,0.1)]">
                  <Image 
                    src="/emoji/hmm.webp" 
                    alt="Thinking Mascot" 
                    fill 
                    className="object-contain"
                    unoptimized
                  />
                </div>
                
                {/* Dialogue Speech Bubble with bottom pop-border */}
                <div className="relative bg-snow-white border-2 border-cloud-gray border-b-8 rounded-[24px] p-6 shadow-none max-w-full text-center mt-2 before:content-[''] before:absolute before:top-[-10px] before:left-1/2 before:-translate-x-1/2 before:border-x-8 before:border-x-transparent before:border-b-8 before:border-b-cloud-gray after:content-[''] after:absolute after:-top-[8px] after:left-1/2 after:-translate-x-1/2 after:border-x-8 after:border-x-transparent after:border-b-8 after:border-b-snow-white">
                  <h3 className="font-feather text-lg md:text-xl font-black text-charcoal uppercase tracking-wider mb-2">
                    Coming Soon!
                  </h3>
                  <p className="text-xs md:text-sm text-graphite leading-relaxed font-semibold">
                    We&apos;re still curating the database for this section. You can practice <span className="text-sky-blue font-black">Part 1</span> in the meantime!
                  </p>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row gap-3 w-full max-w-[400px] mt-4">
                <button
                  onClick={() => {
                    setQuantSection("part1");
                    localStorage.setItem("quant_reasoning_section", "part1");
                  }}
                  className="flex-1 bg-duo-green hover:bg-duo-green/90 text-white font-bold py-3 rounded-2xl shadow-[0_4px_0_#3f8f01] active:translate-y-[4px] active:shadow-none transition-all text-sm font-din-round uppercase tracking-wide cursor-pointer"
                >
                  Switch to Part 1
                </button>
                <button
                  onClick={() => {
                    setQuantSection(null);
                    localStorage.removeItem("quant_reasoning_section");
                  }}
                  className="flex-1 bg-snow-white text-sky-blue border-2 border-cloud-gray font-bold py-3 rounded-2xl shadow-[0_4px_0_var(--color-cloud-gray)] active:translate-y-[4px] active:shadow-none hover:bg-cloud-gray/25 transition-all text-sm font-din-round uppercase tracking-wide cursor-pointer"
                >
                  Other Sections
                </button>
              </div>
            </div>
          ) : (
            /* Standard Dashboard Content */
            <>
              {/* Settings / Controls Row */}
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between w-full px-4 md:px-0 gap-3">
                <div 
                  onClick={() => {
                    setSelectedTestForTimer({ testId: "settings", testTitle: "Practice Timer Settings" });
                    const saved = localStorage.getItem("timer_duration");
                    setModalTimerDuration(saved ? parseInt(saved, 10) : 5);
                  }}
                  className="flex items-center justify-center sm:justify-start gap-2 bg-duo-green-light/10 hover:bg-duo-green-light/20 border-2 border-cloud-gray rounded-2xl sm:rounded-full py-2.5 px-4 cursor-pointer select-none transition-all shadow-[0_3px_0_var(--color-cloud-gray)] active:translate-y-[3px] active:shadow-none active:scale-[0.98] group text-almost-black font-din-round text-sm"
                >
                  <span className="text-base shrink-0">⏱️</span>
                  <span className="font-extrabold tracking-wider uppercase text-silver group-hover:text-almost-black transition-colors flex items-center gap-1.5">
                    <span>Timer:</span>
                    <span className="text-sky-blue font-black">{modalTimerDuration === 60 ? "1 Hour" : `${modalTimerDuration} Mins`}</span>
                  </span>
                  <span className="bg-sky-blue/15 text-sky-blue font-bold px-2.5 py-0.5 rounded-full text-[10px] tracking-wider uppercase transition-all group-hover:bg-sky-blue group-hover:text-white shrink-0">
                    Change
                  </span>
                </div>

                <label className="flex items-center justify-between sm:justify-end cursor-pointer gap-4 opacity-80 hover:opacity-100 transition-opacity bg-cloud-gray/10 sm:bg-transparent border-2 border-cloud-gray/20 sm:border-0 rounded-2xl py-2.5 px-4 sm:p-0 shrink-0 select-none">
                  <span className="text-charcoal font-bold text-xs uppercase tracking-wide whitespace-nowrap">Unlock All Reviewers</span>
                  <div className="relative shrink-0">
                    <input type="checkbox" className="sr-only" checked={unlockAll} onChange={() => setUnlockAll(!unlockAll)} />
                    <div className={`block w-10 h-6 rounded-full transition-colors ${unlockAll ? 'bg-duo-green' : 'bg-[#29353c]'}`}></div>
                    <div className={`absolute left-1 top-1 bg-white w-4 h-4 rounded-full transition-transform ${unlockAll ? 'transform translate-x-4' : ''}`}></div>
                  </div>
                </label>
              </div>

              {/* Topic Cards */}
              <div className="flex flex-col w-full gap-4 md:gap-5 pb-24 px-4 md:px-0">
                {loading ? (
                  /* Shimmering Skeleton Loader Cards representing progressive loading */
                  [...Array(4)].map((_, i) => (
                    <div key={i} className="w-full relative animate-pulse">
                      <div className="w-full flex items-center justify-between p-5 md:p-6 rounded-2xl border-2 border-cloud-gray/70 bg-cloud-gray/10 shadow-[0_6px_0_rgba(229,229,229,0.3)]">
                        <div className="flex flex-col gap-2.5 w-2/3">
                          <div className="h-5 bg-cloud-gray/20 rounded w-5/6" />
                          <div className="h-3.5 bg-cloud-gray/15 rounded w-1/2" />
                        </div>
                        <div className="w-10 h-10 rounded-full bg-cloud-gray/20 shrink-0" />
                      </div>
                    </div>
                  ))
                ) : (
                  Array.from({ length: testCount }, (_, i) => i + 1).map((testNum, index) => {
                  const isActive = index === activeIndex;
                  const isLocked = !unlockAll && index > activeIndex;
                  
                  let testTitle = `${topicName} - Test ${testNum}`;
                  if (formattedTopic === "quantitative_reasoning") {
                    if (testNum === 1) testTitle = "Chapter 1: HCF and LCM";
                    else if (testNum === 2) testTitle = "Chapter 2: Permutation and Combination";
                    else if (testNum === 3) testTitle = "Chapter 3: Probability";
                    else if (testNum === 4) testTitle = "Chapter 4: Ratio and Proportion";
                    else if (testNum === 5) testTitle = "Chapter 5: Percentage";
                    else if (testNum === 6) testTitle = "Chapter 6: Average";
                    else if (testNum === 7) testTitle = "Chapter 7: Problems on Ages";
                    else testTitle = `Chapter ${testNum}`;
                  }
                  const testId = `${formattedTopic}_test${testNum}`;
                  const scoreData = scores[testId];
              
              let cardClass = "";
              let titleClass = "";
              let subtitleClass = "";
              let badgeClass = "";
              let badgeContent = null;

              if (isActive) {
                cardClass = "bg-duo-green border-2 border-transparent shadow-[0_6px_0_#3f8f01] hover:-translate-y-1 hover:shadow-[0_8px_0_#3f8f01] hover:brightness-105 active:translate-y-1 active:shadow-[0_2px_0_#3f8f01] text-white cursor-pointer";
                titleClass = "text-white";
                subtitleClass = "text-white/80";
                badgeClass = "bg-white shadow-[0_4px_0_#e5e5e5]";
                badgeContent = <Image src="/emoji/star.webp" alt="Start" width={22} height={22} className="object-contain drop-shadow-md" unoptimized />;
              } else if (isLocked) {
                cardClass = "bg-snow-white border-2 border-cloud-gray shadow-[0_6px_0_var(--color-cloud-gray)] opacity-50 cursor-not-allowed text-silver";
                titleClass = "text-silver";
                subtitleClass = "text-silver/60";
                badgeClass = "bg-cloud-gray/20 border border-cloud-gray";
                badgeContent = <span className="text-sm">🔒</span>;
              } else {
                cardClass = "bg-snow-white border-2 border-cloud-gray shadow-[0_6px_0_var(--color-cloud-gray)] hover:-translate-y-0.5 hover:shadow-[0_8px_0_var(--color-cloud-gray)] active:translate-y-1 active:shadow-[0_2px_0_var(--color-cloud-gray)] text-almost-black hover:bg-cloud-gray/10 cursor-pointer";
                titleClass = "text-almost-black";
                subtitleClass = "text-duo-green font-bold";
                badgeClass = "bg-duo-green/10 border border-duo-green/30 text-duo-green";
                badgeContent = <span className="font-bold text-base">✓</span>;
              }

              return (
                <div key={index} className="relative w-full">
                  {/* Mascot near active node */}
                  {isActive && (
                    <div className="absolute -top-12 -right-2 md:-right-6 w-[70px] h-[70px] animate-[bounce_2.5s_infinite] z-20">
                      <Image src="/emoji/awow.webp" alt="Mascot" fill className="object-contain drop-shadow-lg" sizes="(max-width: 768px) 100vw, 50vw" />
                    </div>
                  )}
                  
                  <button
                    onClick={() => !isLocked && handleTopicClick(testTitle, testId)}
                    className={`relative z-10 w-full flex items-center justify-between p-5 md:p-6 rounded-2xl transition-all duration-200 text-left ${cardClass}`}
                  >
                    <div className="flex flex-col gap-1.5 font-din-round">
                      <h3 className={`font-feather text-base md:text-xl font-bold tracking-wide ${titleClass}`}>
                        {testTitle}
                      </h3>
                      <div className={`text-xs md:text-sm ${subtitleClass}`}>
                        {scoreData ? (
                          <div className="flex flex-col gap-1 mt-1">
                            <span>Highest Score: {scoreData.score}/{scoreData.total}</span>
                            {scoreData.attempts ? (
                              <span className="text-[10px] md:text-xs opacity-80 normal-case tracking-normal">
                                Prev Best: {scoreData.previousBest || 0} | Last: {scoreData.lastScore || 0} | Attempts: {scoreData.attempts}
                              </span>
                            ) : null}
                          </div>
                        ) : (
                          <span>{profile?.difficulty || "Medium"}</span>
                        )}
                      </div>
                    </div>
                    
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${badgeClass}`}>
                      {badgeContent}
                    </div>
                  </button>
                </div>
              );
            })
            )}

            {/* Chest reward node mock */}
            <div className="relative w-full mt-2">
              <button className="relative z-10 w-full flex items-center justify-between p-5 md:p-6 rounded-2xl bg-snow-white text-silver border-2 border-cloud-gray shadow-[0_6px_0_var(--color-cloud-gray)] opacity-50 cursor-not-allowed">
                <div className="flex flex-col gap-1.5 font-din-round">
                  <h3 className="font-feather text-lg md:text-xl font-bold tracking-wide text-silver">
                    Bonus Reward
                  </h3>
                  <span className="text-sm font-bold uppercase tracking-wider text-silver opacity-60">
                    Complete all to unlock
                  </span>
                </div>
                <div className="flex-shrink-0 ml-4">
                  <div className="w-10 h-10 bg-cloud-gray/20 border border-cloud-gray rounded-full flex items-center justify-center">
                    <Image src="/emoji/quest.webp" alt="Reward Chest" width={24} height={24} className="grayscale opacity-50 w-auto h-auto" unoptimized />
                  </div>
                </div>
              </button>
            </div>
            {/* Reset Progress Button */}
            <div className="w-full mt-8 flex justify-center">
              <button 
                onClick={async () => {
                  if (window.confirm("Are you sure you want to reset all your progress? This cannot be undone.")) {
                    const keysToRemove = [];
                    for (let i = 0; i < localStorage.length; i++) {
                      const key = localStorage.key(i);
                      if (key && (key.startsWith("quiz_score_") || key.startsWith("quiz_state_"))) {
                        keysToRemove.push(key);
                      }
                    }
                    keysToRemove.forEach(key => localStorage.removeItem(key));
                    setScores({});
                    await refreshStats();
                  }
                }}
                className="text-graphite/50 hover:text-[#ea2b2b] font-bold text-sm underline transition-colors"
              >
                Reset All Progress
              </button>
            </div>
          </div>
          </>
          )}
        </div>
      </main>
      
      <aside className="hidden lg:block w-[368px] shrink-0">
        <RightSidebar />
      </aside>

      {selectedTestForTimer && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-[2px] flex items-center justify-center z-50 p-4 animate-[fadeIn_0.2s_ease-out]">
          <div className="bg-snow-white border-2 border-cloud-gray border-b-8 rounded-[24px] w-full max-w-[460px] p-4 md:p-6 flex flex-col gap-4 shadow-none animate-[scaleIn_0.2s_ease-out] relative">
            
            {/* Mascot & Speech Bubble */}
            <div className="flex gap-3 md:gap-4 items-center mb-1">
              <div className="w-[56px] h-[56px] md:w-[72px] md:h-[72px] relative shrink-0">
                <Image 
                  src="/emoji/suspicious.webp" 
                  alt="Thinking Mascot" 
                  fill 
                  className="object-contain drop-shadow-md"
                  unoptimized
                />
              </div>
              <div className="grow relative bg-snow-white border-2 border-cloud-gray rounded-xl p-3 before:content-[''] before:absolute before:left-[-10px] before:top-[50%] before:-translate-y-[50%] before:border-y-8 before:border-y-transparent before:border-r-8 before:border-r-cloud-gray after:content-[''] after:absolute after:-left-[8px] after:top-[50%] after:-translate-y-[50%] after:border-y-8 after:border-y-transparent after:border-r-8 after:border-r-snow-white">
                <h3 className="font-feather text-sm md:text-base text-charcoal font-bold leading-tight uppercase tracking-wide">
                  {selectedTestForTimer.testTitle}
                </h3>
                <p className="text-graphite text-[10px] md:text-xs font-din-round mt-0.5 leading-snug">
                  {selectedTestForTimer.testId === "settings" 
                    ? "Set the default duration for your practice tests."
                    : "How long do you want to give yourself for this test session?"}
                </p>
              </div>
            </div>

            {/* Timer Options List */}
            <div className="flex flex-col gap-2 md:gap-3">
              {[5, 10, 15, 30, 60].map((mins) => (
                <div
                  key={mins}
                  onClick={() => setModalTimerDuration(mins)}
                  className={`flex items-center justify-between py-2.5 px-4 rounded-xl border-2 cursor-pointer transition-all duration-150 select-none active:translate-y-[4px] active:shadow-none ${
                    modalTimerDuration === mins
                      ? "border-sky-blue bg-sky-blue/15 shadow-[0_4px_0_#189edc] text-sky-blue"
                      : "border-cloud-gray bg-snow-white shadow-[0_4px_0_var(--color-cloud-gray)] hover:bg-cloud-gray/20 text-almost-black"
                  }`}
                >
                  <div className="flex flex-col font-din-round">
                    <span className="font-bold text-xs md:text-sm tracking-wide">
                      {mins === 60 ? "1 Hour" : `${mins} Minutes`}
                    </span>
                    <span className="text-[10px] md:text-xs text-graphite font-medium opacity-80 mt-0.5">
                      {mins === 5 ? "Quick practice" : mins === 10 ? "Standard session" : mins === 15 ? "Deep focus" : mins === 30 ? "Extended challenge" : "Full simulated exam"}
                    </span>
                  </div>
                  {modalTimerDuration === mins && (
                    <span className="text-sky-blue font-bold text-lg">✓</span>
                  )}
                </div>
              ))}
            </div>

            {/* Modal Actions */}
            <div className="flex items-center gap-3 mt-1">
              <button
                onClick={() => setSelectedTestForTimer(null)}
                className="flex-1 bg-snow-white text-sky-blue border-2 border-cloud-gray font-bold py-2 md:py-3 rounded-xl shadow-[0_4px_0_var(--color-cloud-gray)] active:translate-y-[4px] active:shadow-none hover:bg-cloud-gray/20 transition-all text-xs md:text-sm text-center cursor-pointer font-din-round"
              >
                CANCEL
              </button>
              <button
                onClick={startTestWithTimer}
                disabled={savingTimer}
                className="flex-1 bg-duo-green text-white font-bold py-2 md:py-3 rounded-xl shadow-[0_4px_0_#3f8f01] active:translate-y-[4px] active:shadow-none hover:brightness-105 transition-all text-xs md:text-sm text-center cursor-pointer font-din-round"
              >
                {savingTimer 
                  ? (selectedTestForTimer.testId === "settings" ? "SAVING..." : "STARTING...") 
                  : (selectedTestForTimer.testId === "settings" ? "SAVE SETTING" : "START TEST")}
              </button>
            </div>
          </div>
        </div>
      )}

      {showHeartsBlocker && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-[2px] flex items-center justify-center z-50 p-4 animate-[fadeIn_0.2s_ease-out]">
          <div className="bg-snow-white border-2 border-cloud-gray border-b-8 rounded-[24px] w-full max-w-[440px] p-6 md:p-8 flex flex-col gap-6 md:gap-8 shadow-none animate-[scaleIn_0.2s_ease-out] relative">
            
            {/* Mascot / Broken Heart */}
            <div className="flex flex-col items-center text-center gap-5">
              <div className="w-[100px] h-[100px] bg-red-50 rounded-full flex items-center justify-center text-5xl relative shrink-0 shadow-inner">
                💔
              </div>
              
              <div className="flex flex-col gap-3 font-din-round">
                <h3 className="font-feather text-2xl md:text-[28px] text-charcoal font-bold leading-tight tracking-wide">
                  Need Hearts to Practice!
                </h3>
                <p className="text-graphite text-body leading-relaxed max-w-[340px] mx-auto tracking-wide">
                  You have 0 hearts. Wait for regeneration (1 heart every 4 hours), or refill instantly using Gems!
                </p>
                {profile && (
                  <div className="text-xs md:text-sm font-extrabold text-[#1cb0f6] mt-1">
                    💎 Current Balance: {profile.gems} Gems
                  </div>
                )}
              </div>
            </div>

            {/* Modal Actions */}
            <div className="flex flex-col gap-3 mt-1 font-din-round">
              <button
                disabled={!profile || profile.gems < 50 || refillingHearts}
                onClick={handleRefillHeartsDashboard}
                className={`w-full bg-[#1cb0f6] text-white font-bold py-3 rounded-2xl shadow-[0_4px_0_#189edc] active:translate-y-[4px] active:shadow-none hover:brightness-105 transition-all text-sm uppercase tracking-wide cursor-pointer ${
                  (!profile || profile.gems < 50 || refillingHearts) ? "opacity-50 cursor-not-allowed shadow-none active:translate-y-0" : ""
                }`}
              >
                {refillingHearts ? "Refilling..." : "Refill to 5 Hearts (💎 50)"}
              </button>
              
              {profile && profile.gems < 50 && (
                <span className="text-[11px] text-[#ff4b4b] font-bold text-center -mt-1 leading-normal">
                  Requires 50 Gems. Practice lessons later as hearts regenerate automatically!
                </span>
              )}

              <button
                onClick={() => setShowHeartsBlocker(false)}
                className="w-full bg-snow-white text-[#1cb0f6] border-2 border-cloud-gray font-bold py-3 rounded-2xl shadow-[0_4px_0_var(--color-cloud-gray)] active:translate-y-[4px] active:shadow-none hover:bg-cloud-gray/25 transition-all text-sm uppercase tracking-wide cursor-pointer"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      <style dangerouslySetInnerHTML={{
        __html: `
          @keyframes fadeIn {
            from { opacity: 0; }
            to { opacity: 1; }
          }
          @keyframes scaleIn {
            from { opacity: 0; transform: scale(0.95); }
            to { opacity: 1; transform: scale(1); }
          }
          @keyframes float {
            0%, 100% { transform: translateY(0); }
            50% { transform: translateY(-8px); }
          }
        `
      }} />
    </>
  );
}
