"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/lib/auth";
import RightSidebar from "@/components/ui/RightSidebar";
import { getOrCreateGuestSessionId, refillHeartsInDb, upsertFullProfile, fetchFullProfile } from "@/lib/session";
import { useAlert } from "@/components/ui/AlertContext";
import { useStats } from "@/components/ui/StatsContext";
import { getCadetRankInfo } from "@/lib/cadetRank";
import dynamic from "next/dynamic";
import Rive from "@rive-app/react-canvas";

const DotLottieReact = dynamic(
  () => import("@lottiefiles/dotlottie-react").then((mod) => {
    if (typeof window !== "undefined" && mod.setWasmUrl) {
      mod.setWasmUrl("/dotlottie-player.wasm");
    }
    return mod.DotLottieReact;
  }),
  { ssr: false }
);

function getRankLottieConfig(level: number): { src: string } {
  switch (level) {
    case 1:
      return { src: "/firstRank.lottie" };
    case 2:
      return { src: "/secondRank.lottie" };
    case 3:
      return { src: "/thirdRank.lottie" };
    default:
      return { src: "/fourthRankBeyond.lottie" };
  }
}

function RiveCharacter() {
  return (
    <div className="w-[110px] h-[110px] select-none">
      <Rive
        src="/emoji/reviewqo.riv"
        className="w-full h-full"
      />
    </div>
  );
}


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
  if (!dbProfile) return { streak: 0, last_lesson_date: null };
  const profileId = typeof dbProfile?.id === "string" ? dbProfile.id : String(dbProfile?.id || "");
  const isGuest = profileId ? profileId.startsWith("guest_") : false;
  const currentStreak = dbProfile.streak || 0;
  const lastLessonDateStr = dbProfile.last_lesson_date || null;

  // Make sure we have a local streak freeze initialized in localStorage
  if (typeof window !== "undefined" && profileId) {
    const localFreeze = localStorage.getItem("streak_freeze_count");
    if (localFreeze === null) {
      const dbFreeze = dbProfile.streak_freeze_count !== undefined && dbProfile.streak_freeze_count !== null ? dbProfile.streak_freeze_count : 1;
      localStorage.setItem("streak_freeze_count", dbFreeze.toString());
      await supabase.from("profile_game_state").update({ streak_freeze_count: dbFreeze }).eq("profile_id", profileId);
    }
  }

  if (!lastLessonDateStr) {
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayStr = yesterday.toLocaleDateString("en-CA");
    if (typeof window !== "undefined") {
      localStorage.setItem("last_lesson_completed_date", yesterdayStr);
      if (currentStreak > 0) {
        const storedRecord = parseInt(localStorage.getItem("record_longest_streak") || "0", 10);
        if (currentStreak > storedRecord) {
          localStorage.setItem("record_longest_streak", currentStreak.toString());
        }
      }
    }
    if (profileId) {
      await supabase.from("profile_progress").upsert({
        profile_id: profileId,
        last_lesson_date: yesterdayStr,
      }, { onConflict: "profile_id" });
    }
    return { streak: currentStreak, last_lesson_date: yesterdayStr };
  }

  if (typeof window !== "undefined" && currentStreak > 0) {
    const storedRecord = parseInt(localStorage.getItem("record_longest_streak") || "0", 10);
    if (currentStreak > storedRecord) {
      localStorage.setItem("record_longest_streak", currentStreak.toString());
    }
  }

  let effectiveLastDateStr = lastLessonDateStr;
  if (typeof window !== "undefined") {
    const localLastDate = localStorage.getItem("last_lesson_completed_date");
    if (localLastDate && (!effectiveLastDateStr || localLastDate > effectiveLastDateStr)) {
      effectiveLastDateStr = localLastDate;
    }
  }

  const todayStr = new Date().toLocaleDateString("en-CA");
  const [y1, m1, d1] = todayStr.split("-").map(Number);
  const cleanLastDate = (effectiveLastDateStr || "").slice(0, 10);
  const [y2, m2, d2] = cleanLastDate.split("-").map(Number);
  const todayDate = new Date(y1, m1 - 1, d1);
  const lastDate = new Date(y2, m2 - 1, d2);
  const diffTime = todayDate.getTime() - lastDate.getTime();
  const diffDays = Math.round(diffTime / (1000 * 60 * 60 * 24));

  if (typeof window !== "undefined" && effectiveLastDateStr) {
    localStorage.setItem("last_lesson_completed_date", effectiveLastDateStr);
  }

  if (diffDays <= 1) {
    return { streak: currentStreak, last_lesson_date: effectiveLastDateStr };
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

    const yesterday = new Date(todayDate);
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayStr = yesterday.toLocaleDateString("en-CA");

    if (typeof window !== "undefined") {
      localStorage.setItem("last_lesson_completed_date", yesterdayStr);
    }

    await supabase
      .from("profile_game_state")
      .update({ streak_freeze_count: newFreezes })
      .eq("profile_id", profileId);
    await supabase
      .from("profile_progress")
      .update({ last_lesson_date: yesterdayStr })
      .eq("profile_id", profileId);

    if (!isGuest) {
      await showAlert("Streak Freeze used! Your daily streak was saved from resetting.");
    }
    return { streak: currentStreak, last_lesson_date: yesterdayStr };
  } else {
    await supabase
      .from("profile_game_state")
      .update({ streak: 0, streak_freeze_count: 0 })
      .eq("profile_id", profileId);

    if (!isGuest) {
      await showAlert("Oh no! 😢  You missed a day and your streak reset to 0.");
    }
    return { streak: 0, last_lesson_date: lastLessonDateStr };
  }
}

async function checkDailyLoginReward(
  profileId: string,
  currentGems: number,
  showAlert: (msg: string, options?: any) => Promise<void>
): Promise<number> {
  if (typeof window === "undefined") return currentGems;
  const todayStr = new Date().toLocaleDateString("en-CA");
  const lastLoginRewardDate = localStorage.getItem("last_login_reward_date");
  if (lastLoginRewardDate !== todayStr) {
    const newGems = currentGems + 10;
  try {
    await supabase
      .from("profile_game_state")
      .update({ gems: newGems })
      .eq("profile_id", profileId);
    localStorage.setItem("last_login_reward_date", todayStr);
    await showAlert("Daily Login Reward! You received 💎 10 Gems.", {
      title: "Daily Login Reward",
      image: "/img/gen_imgs/achievements/gift_box.webp"
    });
    return newGems;
  } catch (e) {
    console.error("Failed to update daily login gems reward", e);
  }
  }
  return currentGems;
}

async function checkHeartsRegeneration(dbProfile: any): Promise<{ hearts: number; last_heart_lost_at: string | null }> {
  if (!dbProfile) return { hearts: 5, last_heart_lost_at: null };
  const profileId = typeof dbProfile?.id === "string" ? dbProfile.id : String(dbProfile?.id || "");
  let currentHearts = dbProfile.hearts !== undefined && dbProfile.hearts !== null ? dbProfile.hearts : 5;
  let lastHeartLostAt = dbProfile.last_heart_lost_at || null;

  if (profileId && currentHearts < 5 && lastHeartLostAt) {
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
        .from("profile_game_state")
        .update({
          hearts: newHearts,
          last_heart_lost_at: newLastHeartLostAt
        })
        .eq("profile_id", profileId);

      return { hearts: newHearts, last_heart_lost_at: newLastHeartLostAt };
    }
  }

  return { hearts: currentHearts, last_heart_lost_at: lastHeartLostAt };
}

export default function DashboardPage() {
  const { showAlert } = useAlert();
  const router = useRouter();
  const { streak, xp, gems, hearts, currentLevel, lastLessonDate, refreshStats, updateStatsLocally } = useStats();

  // Track all-time record streak (localStorage-persisted)
  const [recordStreak, setRecordStreak] = useState(streak);
  useEffect(() => {
    if (typeof window !== "undefined") {
      const stored = parseInt(localStorage.getItem("record_longest_streak") || "0", 10);
      const maxStreak = Math.max(streak, stored);
      setRecordStreak(maxStreak);
      if (maxStreak > stored) {
        localStorage.setItem("record_longest_streak", maxStreak.toString());
      }
    } else {
      setRecordStreak(streak);
    }
  }, [streak]);
  const rankInfo = getCadetRankInfo(currentLevel);
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
        } catch (e) { }
      }
    }
    return null;
  });
  const { user, isLoaded, isSignedIn } = useAuth();

  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    setMounted(true);
  }, []);

  const [scores, setScores] = useState<Record<string, { score: number, total: number, previousBest?: number, lastScore?: number, attempts?: number }>>({});
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
  const [selectedMobileNode, setSelectedMobileNode] = useState<number | null>(null);

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
          const guestDbProfile = await fetchFullProfile(guestSessionId);

          if (guestDbProfile) {
            const streakInfo = await checkDailyStreakValidation(guestDbProfile, showAlert);
            const heartsInfo = await checkHeartsRegeneration(guestDbProfile);
            await refreshStats();

            let gGems = guestDbProfile.gems !== undefined && guestDbProfile.gems !== null ? guestDbProfile.gems : 50;
            gGems = await checkDailyLoginReward(guestSessionId, gGems, showAlert);

            let examCategory = guestDbProfile.exam_category;
            let currentSubTopic = guestDbProfile.sub_topic;

            if (pendingPrefs) {
              try {
                const prefs = JSON.parse(pendingPrefs);
                if (prefs.category) examCategory = prefs.category;
                if (prefs.subTopic) currentSubTopic = prefs.subTopic;
                if (prefs.timerDuration) {
                  localStorage.setItem("timer_duration", prefs.timerDuration.toString());
                }
                if (guestDbProfile.exam_category !== examCategory || guestDbProfile.sub_topic !== currentSubTopic) {
                  await supabase.from("profile_study_settings").upsert({
                    profile_id: guestSessionId,
                    exam_category: examCategory,
                    sub_topic: currentSubTopic,
                    study_style: prefs.studyStyle || "Flashcards",
                    difficulty: prefs.difficulty || "Beginner",
                    timer_duration: prefs.timerDuration || 5,
                  }, { onConflict: "profile_id" });
                }
              } catch (e) {
                console.error("Error applying pendingPrefs to guest profile:", e);
              }
            }

            activeProfile = {
              id: guestSessionId,
              email: "",
              exam_category: examCategory,
              sub_topic: currentSubTopic,
              study_style: guestDbProfile.study_style,
              difficulty: guestDbProfile.difficulty,
              total_score: guestDbProfile.total_score || 0,
              streak: streakInfo.streak,
              hearts: heartsInfo.hearts,
              gems: gGems
            };
            setProfile(activeProfile);
            if (guestDbProfile.timer_duration && !pendingPrefs) {
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
              const guestFlat = await fetchFullProfile(guestSessionId);

              // 2. Fetch registered user profile if it already exists
              const userProfile = await fetchFullProfile(user.id);

              const mergedXp = (userProfile?.total_score || 0) + (guestFlat?.total_score || 0);
              const mergedLessons = (userProfile?.lessons_completed || 0) + (guestFlat?.lessons_completed || 0);
              const mergedStreak = Math.max(userProfile?.streak || 0, guestFlat?.streak || 0);
              const mergedGems = (userProfile?.gems || 50) + (guestFlat?.gems || 0);

              const parsedPending = pendingPrefs ? (() => { try { return JSON.parse(pendingPrefs); } catch { return null; } })() : null;
              const category = parsedPending?.category || userProfile?.exam_category || guestFlat?.exam_category || null;
              const subTopic = parsedPending?.subTopic || userProfile?.sub_topic || guestFlat?.sub_topic || null;
              const timerDuration = parsedPending?.timerDuration || userProfile?.timer_duration || guestFlat?.timer_duration || 5;

              // Merge last_lesson_date (use the newer one)
              let mergedLastLessonDate = userProfile?.last_lesson_date || guestFlat?.last_lesson_date || null;
              if (userProfile?.last_lesson_date && guestFlat?.last_lesson_date) {
                const userDate = new Date(userProfile.last_lesson_date);
                const guestDate = new Date(guestFlat.last_lesson_date);
                mergedLastLessonDate = userDate.getTime() > guestDate.getTime() ? userProfile.last_lesson_date : guestFlat.last_lesson_date;
              }

              // Merge streak freezes (max or sum up to 2)
              const mergedFreezes = Math.min(
                Math.max(userProfile?.streak_freeze_count ?? 1, guestFlat?.streak_freeze_count ?? 1),
                2
              );

              const guestHearts = guestFlat?.hearts !== undefined && guestFlat?.hearts !== null ? guestFlat.hearts : null;
              const guestLastHeartLostAt = guestFlat?.last_heart_lost_at || null;

              // Merge hearts (prioritize guest hearts since they represent the active quiz state)
              const mergedHearts = guestHearts !== null ? guestHearts : (userProfile?.hearts ?? 5);
              const mergedLastHeartLostAt = guestHearts !== null ? guestLastHeartLostAt : (userProfile?.last_heart_lost_at || null);

              if (category) {
                const combinedName = `${user.user_metadata?.full_name || user.email?.split("@")[0] || "Learner"}|/emoji/profile.webp`;
                await upsertFullProfile({
                  id: user.id,
                  name: combinedName,
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
                  last_heart_lost_at: mergedLastHeartLostAt,
                });
                localStorage.setItem("streak_freeze_count", mergedFreezes.toString());
              }

              // Merge claimed achievements from guest session
              const guestClaimedStr = localStorage.getItem("guest_claimed_achievements");
              if (guestClaimedStr) {
                try {
                  const guestClaimedIds = JSON.parse(guestClaimedStr) as string[];
                  if (guestClaimedIds.length > 0) {
                    const inserts = guestClaimedIds.map(achId => ({
                      profile_id: user.id,
                      event_type: `claimed_achievement_${achId}`,
                      score_delta: 0,
                      level_delta: 0
                    }));
                    await supabase.from("lesson_events").insert(inserts);
                  }
                } catch (e) {
                  console.error("Error merging guest claimed achievements:", e);
                }
                localStorage.removeItem("guest_claimed_achievements");
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
              await supabase.from("profile_study_settings").upsert({
                profile_id: user.id,
                exam_category: prefs.category,
                sub_topic: prefs.subTopic,
                study_style: prefs.studyStyle || "Flashcards",
                difficulty: prefs.difficulty || "Beginner",
                timer_duration: prefs.timerDuration || 5,
              }, { onConflict: "profile_id" });
              localStorage.removeItem("onboarding_prefs");
            } catch (e) {
              console.error("Error saving pending prefs", e);
            }
          }

          const userProfile = await fetchFullProfile(user.id);

          if (userProfile && user) {
            const currentCombinedName = `${user.user_metadata?.full_name || user.email?.split("@")[0] || "Learner"}|/emoji/profile.webp`;
            if (userProfile.name !== currentCombinedName && !userProfile.name?.includes("|")) {
              await supabase.from("profiles").update({ name: currentCombinedName }).eq("id", user.id);
              userProfile.name = currentCombinedName;
            }
          }

          if (!userProfile || !userProfile.exam_category) {
            router.replace("/onboarding");
            return;
          }

          const streakInfo = await checkDailyStreakValidation(userProfile, showAlert);
          const heartsInfo = await checkHeartsRegeneration(userProfile);
          await refreshStats();

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

              let filtered = availableTestsKeys.filter((key: string) => key.startsWith(formattedTopic));
              if (formattedTopic === "practice_tests") {
                // Practice tests currently comprises 2 tests: Word Problems and Operations (Test 1) and Data Sufficiency (Test 2)
                setTestCount(2);
              } else {
                setTestCount(filtered.length);
              }
            } else {
              setTestCount(0);
            }
          } catch (e) {
            console.error("Failed to load test metadata", e);
            setTestCount(0);
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

    const handleUpdate = () => {
      loadData();
    };
    window.addEventListener("reviewer-db-update", handleUpdate);
    return () => {
      window.removeEventListener("reviewer-db-update", handleUpdate);
    };
  }, [router, user, isLoaded, isSignedIn]);

  // Load scores from localStorage
  useEffect(() => {
    if (profile && testCount > 0) {
      const fullTopic = profile?.sub_topic || "General Review";
      const topicName = fullTopic.split(" > ").pop() || fullTopic;
      const formattedTopic = topicName.toLowerCase().replace(/[^a-z0-9]+/g, '_');
      const isQuantTopic = formattedTopic === "quantitative_reasoning";
      const isPart2SecA = isQuantTopic && quantSection === "part2_secA";
      const isPart2SecB = isQuantTopic && quantSection === "part2_secB";

      const loadedScores: Record<string, { score: number, total: number, previousBest?: number, lastScore?: number, attempts?: number }> = {};
      const currentTestCount = isPart2SecA ? 33 : isPart2SecB ? 1 : testCount;
      for (let i = 1; i <= currentTestCount; i++) {
        let testId = isPart2SecA ? `part2_secA_test${i}` : isPart2SecB ? `part2_secB_test${i}` : `${formattedTopic}_test${i}`;
        if (formattedTopic === "practice_tests") {
          if (i === 1) testId = "word_problems_and_operations_test1";
          else if (i === 2) testId = "data_sufficiency_test1";
        }
        let scoreData = localStorage.getItem(`quiz_score_${testId}`);
        if (!scoreData && formattedTopic === "practice_tests") {
          scoreData = localStorage.getItem(`quiz_score_practice_tests_test${i}`);
        }
        if (scoreData) {
          try {
            const parsed = JSON.parse(scoreData);
            if (parsed.score > parsed.total) {
              parsed.score = parsed.total;
            }
            loadedScores[testId] = parsed;
          } catch (e) { }
        }
      }
      setTimeout(() => {
        setScores(loadedScores);
      }, 0);
    }
  }, [profile, testCount, quantSection]);

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
          .from("profile_study_settings")
          .update({ timer_duration: modalTimerDuration })
          .eq("profile_id", user.id);
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
    const profileId = (isSignedIn && user ? user.id : null) || (typeof profile?.id === "string" ? profile.id : null) || getOrCreateGuestSessionId();
    if (!profileId) return;
    if (profile && profile.gems < 50) return;
    setRefillingHearts(true);
    const res = await refillHeartsInDb(profileId, 50);
    if (res.success) {
      setProfile((prev) => {
        if (!prev) return null;
        return {
          ...prev,
          gems: Math.max(0, (prev.gems || 0) - 50),
          hearts: 5
        };
      });
      updateStatsLocally({ hearts: 5, gems: Math.max(0, (gems || 50) - 50) });
      setShowHeartsBlocker(false);
      await refreshStats();
      if (typeof window !== "undefined") {
        window.dispatchEvent(new CustomEvent("reviewer-db-update"));
      }
    } else {
      await showAlert("Refill failed: " + res.error);
    }
    setRefillingHearts(false);
  };
  // Determine active index based on scores
  const rawSubTopic = profile?.sub_topic || "General Review";
  const fullTopic = rawSubTopic;
  const topicName = fullTopic.split(" > ").pop() || fullTopic;
  const formattedTopic = topicName.toLowerCase().replace(/[^a-z0-9]+/g, '_');
  const isQuantTopic = formattedTopic === "quantitative_reasoning";
  const isPart2SecA = isQuantTopic && quantSection === "part2_secA";
  const isPart2SecB = isQuantTopic && quantSection === "part2_secB";

  let activeIndex = 0;
  const renderCount = isPart2SecA ? 33 : isPart2SecB ? 1 : testCount;
  for (let i = 1; i <= renderCount; i++) {
    const tId = isPart2SecA 
      ? `part2_secA_test${i}` 
      : isPart2SecB 
        ? `part2_secB_test${i}` 
        : formattedTopic === "practice_tests" 
          ? (i === 1 ? "word_problems_and_operations_test1" : "data_sufficiency_test1") 
          : `${formattedTopic}_test${i}`;
    const scoreItem = scores[tId] || (formattedTopic === "practice_tests" ? scores[`practice_tests_test${i}`] : undefined);
    // Unlock next test if previous test exists and score is >= 80% of total
    if (scoreItem && scoreItem.total > 0 && (scoreItem.score / scoreItem.total) >= 0.8) {
      activeIndex = i; // Move active to the next test
    } else {
      break; // Found an uncompleted or failed (<80%) test
    }
  }
  if (activeIndex >= renderCount) activeIndex = renderCount - 1; // Cap at the last test if all are completed

  // Helper for test metadata and titles
  const getTestInfo = (testNum: number) => {
    let testTitle = `${topicName} - Test ${testNum}`;
    if (formattedTopic === "practice_tests") {
      if (testNum === 1) testTitle = "Word Problems and Operations";
      else if (testNum === 2) testTitle = "Data Sufficiency";
      else testTitle = `Practice Test ${testNum}`;
    } else if (formattedTopic === "word_problems_and_operations") {
      testTitle = "Word Problems and Operations";
    } else if (formattedTopic === "data_sufficiency") {
      testTitle = "Data Sufficiency";
    } else if (formattedTopic === "quantitative_reasoning") {
      if (quantSection === "part2_secA") {
        if (testNum === 1) testTitle = "Chapter 1: Analogy (Exercise 1)";
        else if (testNum === 2) testTitle = "Chapter 1: Analogy (Exercise 2)";
        else if (testNum === 3) testTitle = "Chapter 1: Analogy (Exercise 3)";
        else if (testNum === 4) testTitle = "Chapter 1: Analogy (Exercise 4)";
        else if (testNum === 5) testTitle = "Chapter 1: Analogy (Exercise 5)";
        else if (testNum === 6) testTitle = "Chapter 1: Analogy (Exercise 6)";
        else if (testNum === 7) testTitle = "Chapter 1: Analogy (Exercise 7)";
        else if (testNum === 8) testTitle = "Chapter 1: Analogy (Exercise 8)";
        else if (testNum === 9) testTitle = "Chapter 1: Analogy (Exercise 9)";
        else if (testNum === 10) testTitle = "Chapter 2: Classification Reasoning";
        else if (testNum === 11) testTitle = "Chapter 3: Series Completion (Exercise 1)";
        else if (testNum === 12) testTitle = "Chapter 3: Series Completion (Exercise 2)";
        else if (testNum === 13) testTitle = "Chapter 3: Series Completion (Exercise 3)";
        else if (testNum === 14) testTitle = "Chapter 3: Series Completion (Exercise 4)";
        else if (testNum === 15) testTitle = "Chapter 4: Coding and Decoding (Exercise 1)";
        else if (testNum === 16) testTitle = "Chapter 4: Coding and Decoding (Exercise 2)";
        else if (testNum === 17) testTitle = "Chapter 4: Coding and Decoding (Exercise 3)";
        else if (testNum === 18) testTitle = "Chapter 5: Blood Relations (Exercise 1)";
        else if (testNum === 19) testTitle = "Chapter 5: Blood Relations (Exercise 2)";
        else if (testNum === 20) testTitle = "Chapter 5: Blood Relations (Exercise 3)";
        else if (testNum === 21) testTitle = "Chapter 6: Puzzle Test (Exercise 1)";
        else if (testNum === 22) testTitle = "Chapter 6: Puzzle Test (Exercise 2)";
        else if (testNum === 23) testTitle = "Chapter 7: Direction Sense Test (Exercise 1)";
        else if (testNum === 24) testTitle = "Chapter 7: Direction Sense Test (Exercise 2)";
        else if (testNum === 25) testTitle = "Chapter 8: Logical Venn Diagrams (Exercise 1)";
        else if (testNum === 26) testTitle = "Chapter 9: Number Ranking and Time Sequence Test (Exercise 1)";
        else if (testNum === 27) testTitle = "Chapter 10: Decision Making (Exercise 1)";
        else if (testNum === 28) testTitle = "Chapter 10: Decision Making (Exercise 2)";
        else if (testNum === 29) testTitle = "Chapter 11: Assertion and Reason (Exercise 1)";
        else if (testNum === 30) testTitle = "Chapter 12: Situation Reaction Test (Exercise 1)";
        else if (testNum === 31) testTitle = "Chapter 13: Mathematical Operations (Exercise 1)";
        else if (testNum === 32) testTitle = "Chapter 14: Inserting the Missing One (Exercise 1)";
        else if (testNum === 33) testTitle = "Chapter 15: Logical Sequence of Words (Exercise 1)";
        else testTitle = `Chapter ${testNum}`;
      } else if (quantSection === "part2_secB") {
        if (testNum === 1) testTitle = "Chapter 16: Logic (Exercise 1)";
        else testTitle = `Chapter ${testNum}`;
      } else {
        if (testNum === 1) testTitle = "Chapter 1: HCF and LCM";
        else if (testNum === 2) testTitle = "Chapter 2: Permutation and Combination";
        else if (testNum === 3) testTitle = "Chapter 3: Probability";
        else if (testNum === 4) testTitle = "Chapter 4: Ratio and Proportion";
        else if (testNum === 5) testTitle = "Chapter 5: Percentage";
        else if (testNum === 6) testTitle = "Chapter 6: Average";
        else if (testNum === 7) testTitle = "Chapter 7: Problems on Ages";
        else if (testNum === 8) testTitle = "Chapter 8: Profit and Loss";
        else if (testNum === 9) testTitle = "Chapter 9: Squares and Square Roots";
        else if (testNum === 10) testTitle = "Chapter 10: Cubes and Cube Roots";
        else if (testNum === 11) testTitle = "Chapter 11: Series";
        else if (testNum === 12) testTitle = "Chapter 12: Progression and Sequence";
        else if (testNum === 13) testTitle = "Chapter 13: Fractions";
        else if (testNum === 14) testTitle = "Chapter 14: Elementary Algebra I";
        else if (testNum === 15) testTitle = "Chapter 15: Elementary Algebra II";
        else if (testNum === 16) testTitle = "Chapter 16: Partnership";
        else if (testNum === 17) testTitle = "Chapter 17: Simple Interest";
        else if (testNum === 18) testTitle = "Chapter 18: Compound Interest";
        else if (testNum === 19) testTitle = "Chapter 19: Time and Work";
        else if (testNum === 20) testTitle = "Chapter 20: Work and Wages";
        else if (testNum === 21) testTitle = "Chapter 21: Pipes and Cistern";
        else if (testNum === 22) testTitle = "Chapter 22: Alligation";
        else if (testNum === 23) testTitle = "Chapter 23: Problems on Trains";
        else if (testNum === 24) testTitle = "Chapter 24: Boats and Streams";
        else if (testNum === 25) testTitle = "Chapter 25: Elementary Mensuration I (Measurement of Area)";
        else if (testNum === 26) testTitle = "Chapter 26: Elementary Mensuration II (Measurement of Volume and Surface Area)";
        else if (testNum === 27) testTitle = "Chapter 27: Problems on Clock";
        else if (testNum === 28) testTitle = "Chapter 28: Problems on Calendar";
        else if (testNum === 29) testTitle = "Chapter 29: Time and Distance";
        else if (testNum === 30) testTitle = "Chapter 30: Heights and Distances";
        else if (testNum === 31) testTitle = "Chapter 31: Trigonometry";
        else if (testNum === 32) testTitle = "Chapter 32: Odd man out and series";
        else if (testNum === 33) testTitle = "Chapter 33: Data Sufficiency";
        else if (testNum === 34) testTitle = "Chapter 34: Data Analysis";
        else if (testNum === 35) testTitle = "Chapter 35: Mathematical Operations";
        else if (testNum === 36) testTitle = "Chapter 36: Number System";
        else if (testNum === 37) testTitle = "Chapter 37: Arithmetic Reasoning";
        else if (testNum === 38) testTitle = "Chapter 38: Simplification";
        else if (testNum === 39) testTitle = "Chapter 39: Races and Games";
        else if (testNum === 40) testTitle = "Chapter 40: Stocks and Shares";
        else if (testNum === 41) testTitle = "Chapter 41: Discount";
        else if (testNum === 42) testTitle = "Chapter 42: Logarithm";
        else testTitle = `Chapter ${testNum}`;
      }
    }
    const testId = isPart2SecA 
      ? `part2_secA_test${testNum}` 
      : isPart2SecB 
        ? `part2_secB_test${testNum}` 
        : (formattedTopic === "practice_tests")
          ? (testNum === 1 ? "word_problems_and_operations_test1" : "data_sufficiency_test1")
          : `${formattedTopic}_test${testNum}`;
    const scoreData = scores[testId] || (formattedTopic === "practice_tests" ? scores[`practice_tests_test${testNum}`] : undefined);
    return { testTitle, testId, scoreData };
  };

  const renderNodeIcon = (pos: number) => {
    switch (pos) {
      case 0: // Level 1: Star
        return (
          <svg className="w-9 h-9 fill-white drop-shadow-md transform group-hover:scale-110 transition duration-150" viewBox="0 0 24 24">
            <path d="M12 1.5l3.2 6.5 7.17 1.04-5.19 5.06 1.23 7.14L12 17.87 5.59 21.24l1.23-7.14L1.63 9.04l7.17-1.04L12 1.5z"></path>
          </svg>
        );
      case 1: // Level 2: Book
        return (
          <svg className="w-9 h-9 fill-white drop-shadow-md transform group-hover:scale-110 transition duration-150" viewBox="0 0 24 24">
            <path d="M21 5c-1.11-.35-2.33-.5-3.5-.5-1.95 0-4.05.4-5.5 1.5-1.45-1.1-3.55-1.5-5.5-1.5S2.45 4.9 1 6v14.65c0 .25.25.5.5.5.1 0 .15-.05.25-.05C3.1 20.45 5.05 20 6.5 20c1.95 0 4.05.4 5.5 1.5 1.35-.85 3.8-1.5 5.5-1.5 1.65 0 3.35.3 4.75 1.05.1.05.15.05.25.05.25 0 .5-.25.5-.5V6c-.6-.45-1.25-.75-2-1zm-1 13c-1.05-.3-2.2-.45-3.5-.45-1.75 0-3.65.45-4.5 1.35V7.5c.85-.9 2.75-1.35 4.5-1.35 1.3 0 2.45.15 3.5.45v11.4z"></path>
          </svg>
        );
      case 2: // Level 3: Microphone
        return (
          <svg className="w-9 h-9 fill-white drop-shadow-md transform group-hover:scale-110 transition duration-150" viewBox="0 0 24 24">
            <path d="M12 14c1.66 0 3-1.34 3-3V5c0-1.66-1.34-3-3-3S9 3.34 9 5v6c0 1.66 1.34 3 3 3z"></path>
            <path d="M17 11c0 2.76-2.24 5-5 5s-5-2.24-5-5H5c0 3.53 2.61 6.43 6 6.92V21h2v-3.08c3.39-.49 6-3.39 6-6.92h-2z"></path>
          </svg>
        );
      case 3: // Level 4: Dumbbell
        return (
          <svg className="w-8 h-8 fill-white drop-shadow-md transform group-hover:scale-110 transition duration-150 rotate-45" viewBox="0 0 24 24">
            <path d="M20.57 14.86L22 13.43 20.57 12 17 15.57 8.43 7 12 3.43 10.57 2 9.14 3.43 7.71 2 5.57 4.14 4.14 2.71 2.71 4.14l1.43 1.43L2 7.71l1.43 1.43L2 10.57 3.43 12 7 8.43 15.57 17 12 20.57 13.43 22l1.43-1.43L16.29 22l2.14-2.14 1.43 1.43 1.43-1.43-1.43-1.43L22 16.29z"></path>
          </svg>
        );
      case 4: // Level 5: Video Camera
        return (
          <svg className="w-9 h-9 fill-white drop-shadow-md transform group-hover:scale-110 transition duration-150" viewBox="0 0 24 24">
            <path d="M17 10.5V7c0-.55-.45-1-1-1H4c-.55 0-1 .45-1 1v10c0 .55.45 1 1 1h12c.55 0 1-.45 1-1v-3.5l4 4v-11l-4 4z"></path>
          </svg>
        );
      case 5: // Level 6: Headphones
      default:
        return (
          <svg className="w-9 h-9 fill-white drop-shadow-md transform group-hover:scale-110 transition duration-150" viewBox="0 0 24 24">
            <path d="M12 3c-4.97 0-9 4.03-9 9v7c0 1.1.9 2 2 2h4v-8H5v-1c0-3.87 3.13-7 7-7s7 3.13 7 7v1h-4v8h4c1.1 0 2-.9 2-2v-7c0-4.97-4.03-9-9-9z"></path>
          </svg>
        );
    }
  };

  const renderLockedIcon = () => (
    <svg className="w-8 h-8 fill-[#afafaf] drop-shadow-sm" viewBox="0 0 24 24">
      <path d="M18 8h-1V6c0-2.76-2.24-5-5-5S7 3.24 7 6v2H6c-1.1 0-2 .9-2 2v10c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V10c0-1.1-.9-2-2-2zm-6 9c-1.1 0-2-.9-2-2s.9-2 2-2 2 .9 2 2-.9 2-2 2zm3.1-9H8.9V6c0-1.71 1.39-3.1 3.1-3.1 1.71 0 3.1 1.39 3.1 3.1v2z" />
    </svg>
  );

  const renderNodeButton = (index: number) => {
    const testNum = index + 1;
    const { testTitle, testId, scoreData } = getTestInfo(testNum);
    const isActive = index === activeIndex;
    const isLocked = !unlockAll && index > activeIndex;
    const isPassed = !isLocked && Boolean(scoreData && scoreData.total > 0 && (scoreData.score / scoreData.total) >= 0.8);
    const pos = index % 6;
    const isSelected = selectedMobileNode === index;

    const btnClass = isLocked
      ? "btn-3d-gray cursor-not-allowed"
      : isPassed
        ? "btn-3d-gold cursor-pointer"
        : "btn-3d-green cursor-pointer";

    return (
      <div key={index} className="relative flex flex-col items-center">
        {/* Floating Bouncing START Badge for Active Node */}
        {isActive && !isSelected && (
          <div className="absolute -top-11 left-1/2 -translate-x-1/2 z-30 animate-bounce pointer-events-none">
            <div className="bg-white text-[#58cc02] font-black text-[11px] px-3.5 py-1 rounded-xl shadow-[0_3px_0_#e5e5e5] uppercase tracking-wider border-2 border-[#e5e5e5] whitespace-nowrap">
              START
            </div>
            <div className="w-0 h-0 border-x-5 border-x-transparent border-t-5 border-t-white mx-auto -mt-[1px]"></div>
          </div>
        )}

        {/* Floating Popover Speech Bubble when Tapped */}
        {isSelected && (
          <div className="fixed left-1/2 -translate-x-1/2 bottom-28 z-50 animate-[scaleIn_0.15s_ease-out] w-[220px] bg-white rounded-xl border border-[#e5e5e5] px-3 py-2.5 shadow-lg text-center font-din-round">
            <h4 className="font-feather font-bold text-xs text-black leading-snug break-words whitespace-normal line-clamp-3">{testTitle}</h4>
            <p className="text-[10px] text-graphite font-semibold mt-0.5">
              {scoreData ? `Best: ${scoreData.score}/${scoreData.total}` : isLocked ? "Locked" : "Not started"}
            </p>
            <div className="mt-2 flex items-center justify-center">
              {isLocked ? (
                <span className="text-[10px] text-silver font-extrabold uppercase tracking-wide">Pass previous to unlock</span>
              ) : (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setSelectedMobileNode(null);
                    handleTopicClick(testTitle, testId);
                  }}
                  className="w-full bg-[#58cc02] hover:bg-[#46a302] text-white font-black text-[11px] py-1.5 px-3 rounded-lg shadow-[0_3px_0_#46a302] active:translate-y-[2px] active:shadow-none uppercase tracking-wider transition cursor-pointer"
                >
                  {isPassed ? "Practice" : "Start"}
                </button>
              )}
            </div>
          </div>
        )}

        {/* Main 3D Node Button */}
        <button
          onClick={() => {
            if (isLocked) {
              showAlert("🔒 This lesson is locked! Complete preceding lessons with 80% or toggle 'Unlock All' to access.");
              return;
            }
            if (isSelected) {
              setSelectedMobileNode(null);
              handleTopicClick(testTitle, testId);
            } else {
              setSelectedMobileNode(index);
            }
          }}
          aria-label={`${testTitle} - ${isLocked ? "Locked" : isPassed ? "Completed" : "Active"}`}
          className={`w-[74px] h-[74px] rounded-full relative flex items-center justify-center group active:outline-none select-none ${btnClass}`}
        >
          <div className="absolute inset-0 rounded-full btn-inner-shine pointer-events-none"></div>
          {isLocked ? renderLockedIcon() : renderNodeIcon(pos)}

          {/* Completed Gold Checkmark Badge */}
          {isPassed && (
            <div className="absolute -bottom-0.5 -right-0.5 w-6 h-6 rounded-full bg-[#ffc800] border-2 border-white flex items-center justify-center shadow-md">
              <span className="text-white text-xs font-black">✓</span>
            </div>
          )}
        </button>
      </div>
    );
  };

  const showSubOnboarding = isQuantTopic && !quantSection;
  const showComingSoon = (isQuantTopic && quantSection && quantSection !== "part1" && quantSection !== "part2_secA" && quantSection !== "part2_secB") || (!isQuantTopic && testCount === 0 && !loading);

  return (
    <>
      <main className="flex-1 w-full max-w-[600px] mx-auto pb-24">
        <div className="flex flex-col gap-3 md:gap-6 pt-1 md:pt-2 items-center w-full">
          {/* Desktop Section Header */}
          <div className="hidden md:block w-full md:px-0 sticky top-6 z-30">
            <div className="w-full bg-duo-green rounded-2xl p-5 flex items-center justify-between shadow-[0_4px_0_#3f8f01]">
              <div className="flex flex-col text-white min-w-0 pr-2">
                <div className="flex items-center gap-2 mb-0.5">
                  <span onClick={() => router.push("/onboarding?edit=true")} className="text-lg font-bold cursor-pointer hover:opacity-80 transition-opacity">←</span>
                  <span className="font-bold text-sm tracking-widest uppercase">
                    Section 1, Unit 1
                  </span>
                </div>
                <h2 className="font-feather text-2xl font-bold tracking-wide leading-tight truncate">
                  {mounted && profile ? (
                    `${profile.exam_category} ${topicName ? `- ${topicName}` : ""}`
                  ) : (
                    <span className="inline-block h-6 w-48 bg-white/20 rounded animate-pulse mt-1" />
                  )}
                </h2>
              </div>
            </div>
          </div>

          {/* Mobile SectionHeaderCard (Unit Banner Card) */}
          <div className="block md:hidden w-full px-1 sticky top-15 z-30" data-purpose="unit-header-card">
            <div className="w-full bg-[#58cc02] rounded-2xl p-4 shadow-[0_5px_0_#46a302] flex items-center justify-between text-white border border-[#68d712]">
              <div className="space-y-0.5 min-w-0 pr-2">
                <p className="text-[12px] font-black tracking-wider uppercase opacity-90">SECTION 1, UNIT 1</p>
                <h1 className="text-[19px] font-extrabold tracking-tight truncate">
                  {mounted && profile ? `${profile.exam_category}${topicName ? ` - ${topicName}` : ""}` : "Loading Topic..."}
                </h1>
              </div>
              {/* Guidebook / Change Topic Button */}
              <button
                onClick={() => router.push("/onboarding?edit=true")}
                className="p-2.5 rounded-xl bg-[#58cc02] hover:bg-[#61e002]/30 active:bg-[#46a302] border-2 border-white/30 text-white shadow-inner flex items-center justify-center transition cursor-pointer shrink-0"
                title="Guidebook / Change Topic"
              >
                <svg className="w-6 h-6 stroke-white fill-none stroke-[2.5]" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
                  <rect height="18" rx="2" strokeWidth="2.5" width="15" x="6" y="3"></rect>
                  <line x1="10" x2="17" y1="8" y2="8"></line>
                  <line x1="10" x2="17" y1="12" y2="12"></line>
                  <line x1="10" x2="14" y1="16" y2="16"></line>
                  <circle cx="3.5" cy="7" fill="white" r="1.5"></circle>
                  <circle cx="3.5" cy="12" fill="white" r="1.5"></circle>
                  <circle cx="3.5" cy="17" fill="white" r="1.5"></circle>
                </svg>
              </button>
            </div>
          </div>

          
          {/* Quantitative Reasoning Active Section Banner */}
          {isQuantTopic && quantSection && (
            <div className="w-full flex items-center justify-between bg-sky-blue/10 border-2 border-sky-blue/20 rounded-xl md:rounded-2xl p-3 md:p-4 font-din-round animate-[fadeIn_0.3s_ease-out]">
              <div className="flex flex-col text-left">
                <span className="text-[10px] text-silver font-black uppercase tracking-wider">Current Focus Area</span>
                <span className="text-sm font-extrabold text-sky-blue uppercase">
                  {quantSection === "part1"
                    ? "Part 1: Quantitative Aptitude"
                    : quantSection === "part2_secA"
                      ? "Part 2: Reasoning - Sec A (General Mental Ability)"
                      : quantSection === "part2_secB"
                        ? "Part 2: Reasoning - Sec B (Logical Deduction)"
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
                        Ready (42 Chapters)
                      </span>
                    </div>
                    <h4 className="font-feather text-base md:text-lg font-bold text-charcoal">
                      Part 1: Quantitative Aptitude
                    </h4>
                    <p className="text-xs text-graphite font-medium mt-1 leading-normal">
                      Covers HCF/LCM, Permutations, Probability, Ratios, Percentages, Ages, and Profit & Loss.
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
                  className="flex flex-col justify-between p-5 rounded-2xl border-2 border-cloud-gray hover:border-sky-blue bg-snow-white hover:bg-sky-blue/5 shadow-[0_4px_0_var(--color-cloud-gray)] hover:shadow-[0_4px_0_#189edc] cursor-pointer transition-all duration-150 active:translate-y-0.5 select-none text-left"
                >
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-2xl">🧠</span>
                      <span className="bg-duo-green/10 text-duo-green text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider">
                        Ready (33 Exercises)
                      </span>
                    </div>
                    <h4 className="font-feather text-base md:text-lg font-bold text-charcoal">
                      Part 2: Reasoning (Sec A: General Mental Ability)
                    </h4>
                    <p className="text-xs text-graphite font-medium mt-1 leading-normal">
                      <span className="font-bold text-sky-blue">General Mental Ability:</span> Analogy, Classification, logical deductions, and verbal-logical relations.
                    </p>
                  </div>
                  <div className="mt-4 text-sky-blue font-bold text-xs flex items-center gap-1">
                    Start Learning →
                  </div>
                </div>

                {/* Card 3: Part 2 Sec B */}
                <div
                  onClick={() => {
                    setQuantSection("part2_secB");
                    localStorage.setItem("quant_reasoning_section", "part2_secB");
                  }}
                  className="flex flex-col justify-between p-5 rounded-2xl border-2 border-cloud-gray hover:border-sky-blue bg-snow-white hover:bg-sky-blue/5 shadow-[0_4px_0_var(--color-cloud-gray)] hover:shadow-[0_4px_0_#189edc] cursor-pointer transition-all duration-150 active:translate-y-0.5 select-none text-left"
                >
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-2xl">🔍</span>
                      <span className="bg-duo-green/10 text-duo-green text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider">
                        Ready (1 Exercise)
                      </span>
                    </div>
                    <h4 className="font-feather text-base md:text-lg font-bold text-charcoal">
                      Part 2: Reasoning (Sec B: Logical Deduction)
                    </h4>
                    <p className="text-xs text-graphite font-medium mt-1 leading-normal">
                      <span className="font-bold text-sky-blue">Logical Deduction:</span> Logic, statement-conclusions, syllogism, and deductive reasoning.
                    </p>
                  </div>
                  <div className="mt-4 text-sky-blue font-bold text-xs flex items-center gap-1">
                    Start Learning →
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
                    {isQuantTopic ? (
                      <>We&apos;re still curating the database for this section. You can practice <span className="text-sky-blue font-black">Part 1</span> in the meantime!</>
                    ) : (
                      <>We&apos;re currently curating test questions for <span className="text-sky-blue font-black">{topicName}</span>. Choose another topic or check back soon!</>
                    )}
                  </p>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row gap-3 w-full max-w-[400px] mt-4">
                {isQuantTopic ? (
                  <>
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
                  </>
                ) : (
                  <button
                    onClick={() => router.push("/onboarding?edit=true")}
                    className="flex-1 bg-duo-green hover:bg-duo-green/90 text-white font-bold py-3 px-6 rounded-2xl shadow-[0_4px_0_#3f8f01] active:translate-y-[4px] active:shadow-none transition-all text-sm font-din-round uppercase tracking-wide cursor-pointer"
                  >
                    Select Another Topic
                  </button>
                )}
              </div>
            </div>
          ) : (
            /* Standard Dashboard Content */
            <>
              {/* DESKTOP VIEW: Topic Cards List */}
              <div className="hidden md:flex flex-col w-full gap-4 md:gap-5 pb-24 px-4 md:px-0">
                {/* Desktop Settings / Controls Row */}
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between w-full gap-3">
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

                {/* Desktop Cards */}
                {loading ? (
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
                  Array.from({ length: isPart2SecA ? 33 : isPart2SecB ? 1 : testCount }, (_, i) => i + 1).map((testNum, index) => {
                    const isActive = index === activeIndex;
                    const isLocked = !unlockAll && index > activeIndex;
                    const { testTitle, testId, scoreData } = getTestInfo(testNum);

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

              {/* MOBILE VIEW: Stepping Stones Zigzag Learning Path */}
              <div className="block md:hidden w-full px-2 pb-16">
                {/* Backdrop dismisser when popover is open */}
                {selectedMobileNode !== null && (
                  <div
                    className="fixed inset-0 z-30 pointer-events-auto"
                    onClick={() => setSelectedMobileNode(null)}
                  />
                )}

                {/* Mobile Controls Strip (Timer & Unlock All) */}
                <div className="flex items-center justify-between gap-2 px-1 mb-3 mt-1">
                  <div
                    onClick={() => {
                      setSelectedTestForTimer({ testId: "settings", testTitle: "Practice Timer Settings" });
                      const saved = localStorage.getItem("timer_duration");
                      setModalTimerDuration(saved ? parseInt(saved, 10) : 5);
                    }}
                    className="flex items-center gap-1.5 bg-snow-white border-2 border-cloud-gray rounded-xl py-2 px-3 cursor-pointer shadow-[0_2px_0_var(--color-cloud-gray)] active:translate-y-[1px] active:shadow-none select-none"
                  >
                    <span className="text-sm">⏱️</span>
                    <span className="font-bold text-silver uppercase text-[10px] tracking-wide">Timer:</span>
                    <span className="text-sky-blue font-black text-xs">{modalTimerDuration === 60 ? "1 hr" : `${modalTimerDuration}m`}</span>
                  </div>

                  <label className="flex items-center gap-2.5 cursor-pointer select-none bg-snow-white border-2 border-cloud-gray rounded-xl py-2 px-3 shadow-[0_2px_0_var(--color-cloud-gray)]">
                    <span className="text-charcoal font-bold text-[10px] uppercase tracking-wide whitespace-nowrap">Unlock All</span>
                    <div className="relative shrink-0">
                      <input type="checkbox" className="sr-only" checked={unlockAll} onChange={() => setUnlockAll(!unlockAll)} />
                      <div className={`w-9 h-5 rounded-full transition-colors duration-200 ${unlockAll ? 'bg-duo-green' : 'bg-[#c8c8c8]'}`} />
                      <div className={`absolute top-0.5 bg-white w-4 h-4 rounded-full shadow-sm transition-all duration-200 ${unlockAll ? 'left-[calc(100%-18px)]' : 'left-0.5'}`} />
                    </div>
                  </label>
                </div>

                {loading ? (
                  <div className="w-full flex flex-col items-center gap-6 py-12 animate-pulse">
                    <div className="w-20 h-20 rounded-full bg-cloud-gray/30" />
                    <div className="w-20 h-20 rounded-full bg-cloud-gray/30" />
                    <div className="w-20 h-20 rounded-full bg-cloud-gray/30" />
                  </div>
                ) : (
                  <div className="relative w-full max-w-[370px] mx-auto mt-6 flex flex-col items-center select-none" data-purpose="zigzag-path-nodes">
                    {/* ROW 1: Character Placeholder (Reading) + Level 1 Node (Star) */}
                    {renderCount >= 1 && (
                      <div className="w-full flex justify-between items-center px-4 relative mt-1 min-h-[125px]">
                        {/* Mascot / Character Placeholder Slot (Upper Left) */}
                        <div className="flex flex-col items-center" data-purpose="mascot-placeholder-slot-top">
                          <Image
                            src="/emoji/guidebook.webp"
                            alt="Character reading guidebook"
                            width={100}
                            height={100}
                            className="object-contain drop-shadow-md select-none"
                            priority
                          />
                        </div>
                        {/* Level 1: Star Node (Right side) */}
                        <div className="mr-4 mt-2">
                          {renderNodeButton(0)}
                        </div>
                      </div>
                    )}

                    {/* ROW 2: Level 2 Node (Book) */}
                    {renderCount >= 2 && (
                      <div className="w-full flex justify-end pr-14 mt-3">
                        {renderNodeButton(1)}
                      </div>
                    )}

                    {/* ROW 3: Golden Treasure Chest (Center) */}
                    <div className="w-full flex justify-center mt-3" data-purpose="reward-chest-node">
                      <div className="relative flex flex-col items-center">
                        <div className="w-20 h-5 bg-gray-200/90 rounded-full blur-[2px] absolute -bottom-1"></div>
                        <button
                          onClick={() => {
                            const canOpen = activeIndex >= 2 || unlockAll;
                            if (canOpen) {
                              showAlert("🎉 Milestone Chest Unlocked! You've made outstanding progress!");
                            } else {
                              showAlert("Complete preceding lessons to unlock this milestone chest!");
                            }
                          }}
                          aria-label="Milestone Treasure Chest"
                          className="relative w-[76px] h-[66px] flex flex-col items-center group active:scale-95 transition cursor-pointer"
                        >
                          {/* Chest Lid */}
                          <div className="w-[74px] h-[34px] bg-gradient-to-b from-[#ffd633] via-[#ffc800] to-[#e6a800] rounded-t-xl border-t-2 border-x-2 border-[#d99200] shadow-sm relative flex items-center justify-center">
                            <div className="w-full h-2 bg-[#d99200]/30 absolute top-2"></div>
                            <div className="w-5 h-6 bg-[#b87700] rounded-b-md border border-[#915800] flex flex-col items-center justify-center absolute -bottom-2 z-10 shadow-md">
                              <div className="w-1.5 h-1.5 bg-black rounded-full"></div>
                              <div className="w-1 h-2 bg-black rounded-b-xs"></div>
                            </div>
                          </div>
                          {/* Chest Base / Trunk */}
                          <div className="w-[70px] h-[30px] bg-gradient-to-b from-[#e09800] to-[#b87700] rounded-b-lg border-b-4 border-x-2 border-[#915800] flex items-center justify-between px-2">
                            <div className="w-1.5 h-full bg-[#915800]/40"></div>
                            <div className="w-1.5 h-full bg-[#915800]/40"></div>
                          </div>
                        </button>
                      </div>
                    </div>

                    {/* ROW 4: Level 3 Node (Microphone) */}
                    {renderCount >= 3 && (
                      <div className="w-full flex justify-start pl-28 mt-4">
                        {renderNodeButton(2)}
                      </div>
                    )}

                    {/* ROW 5: Level 4 Node (Dumbbell) + Cheering Character Placeholder (Right) */}
                    {renderCount >= 4 && (
                      <div className="w-full flex justify-between items-center px-8 mt-2 min-h-[110px]">
                        <div className="ml-10">
                          {renderNodeButton(3)}
                        </div>
                        {/* Rive animated character (lower right) */}
                        <div className="flex flex-col items-center mr-2 relative" data-purpose="mascot-placeholder-slot-bottom">
                          <RiveCharacter />
                        </div>
                      </div>
                    )}

                    {/* ROW 6: Level 5 Node (Video Camera) */}
                    {renderCount >= 5 && (
                      <div className="w-full flex justify-start pl-28 mt-1">
                        {renderNodeButton(4)}
                      </div>
                    )}

                    {/* ROW 7: Level 6 Node (Headphones) & Floating Return Button */}
                    {renderCount >= 6 && (
                      <div className="w-full flex justify-between items-center px-10 mt-3 relative">
                        <div className="w-12"></div>
                        {renderNodeButton(5)}
                        <button
                          onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
                          className="w-12 h-12 bg-white rounded-2xl border-2 border-gray-200 shadow-[0_4px_0_#e5e5e5] active:shadow-none active:translate-y-1 flex items-center justify-center text-[#1cb0f6] hover:bg-gray-50 transition cursor-pointer"
                          title="Scroll to active lesson"
                        >
                          <svg className="w-6 h-6 stroke-[#1cb0f6] fill-none stroke-[3.5]" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
                            <line x1="12" x2="12" y1="19" y2="5"></line>
                            <polyline points="5 12 12 5 19 12"></polyline>
                          </svg>
                        </button>
                      </div>
                    )}

                    {/* Additional rows for tests beyond level 6 */}
                    {renderCount > 6 && Array.from({ length: renderCount - 6 }, (_, offset) => {
                      const index = offset + 6;
                      const pos = index % 6;
                      return (
                        <React.Fragment key={index}>
                          {pos === 0 && (
                            <div className="w-full flex justify-end pr-10 mt-4">
                              {renderNodeButton(index)}
                            </div>
                          )}
                          {pos === 1 && (
                            <>
                              <div className="w-full flex justify-end pr-14 mt-3">
                                {renderNodeButton(index)}
                              </div>
                              <div className="w-full flex justify-center mt-3" data-purpose="reward-chest-node">
                                <div className="relative flex flex-col items-center">
                                  <div className="w-20 h-5 bg-gray-200/90 rounded-full blur-[2px] absolute -bottom-1"></div>
                                  <button
                                    onClick={() => {
                                      const canOpen = activeIndex >= index || unlockAll;
                                      if (canOpen) {
                                        showAlert("🎉 Milestone Chest Unlocked! Outstanding work!");
                                      } else {
                                        showAlert("Complete preceding lessons to unlock this milestone chest!");
                                      }
                                    }}
                                    className="relative w-[76px] h-[66px] flex flex-col items-center group active:scale-95 transition cursor-pointer"
                                  >
                                    <div className="w-[74px] h-[34px] bg-gradient-to-b from-[#ffd633] via-[#ffc800] to-[#e6a800] rounded-t-xl border-t-2 border-x-2 border-[#d99200] shadow-sm relative flex items-center justify-center">
                                      <div className="w-full h-2 bg-[#d99200]/30 absolute top-2"></div>
                                      <div className="w-5 h-6 bg-[#b87700] rounded-b-md border border-[#915800] flex flex-col items-center justify-center absolute -bottom-2 z-10 shadow-md">
                                        <div className="w-1.5 h-1.5 bg-black rounded-full"></div>
                                        <div className="w-1 h-2 bg-black rounded-b-xs"></div>
                                      </div>
                                    </div>
                                    <div className="w-[70px] h-[30px] bg-gradient-to-b from-[#e09800] to-[#b87700] rounded-b-lg border-b-4 border-x-2 border-[#915800] flex items-center justify-between px-2">
                                      <div className="w-1.5 h-full bg-[#915800]/40"></div>
                                      <div className="w-1.5 h-full bg-[#915800]/40"></div>
                                    </div>
                                  </button>
                                </div>
                              </div>
                            </>
                          )}
                          {pos === 2 && (
                            <div className="w-full flex justify-start pl-28 mt-4">
                              {renderNodeButton(index)}
                            </div>
                          )}
                          {pos === 3 && (
                            <div className="w-full flex justify-start pl-10 mt-2">
                              {renderNodeButton(index)}
                            </div>
                          )}
                          {pos === 4 && (
                            <div className="w-full flex justify-start pl-28 mt-1">
                              {renderNodeButton(index)}
                            </div>
                          )}
                          {pos === 5 && (
                            <div className="w-full flex justify-center mt-3">
                              {renderNodeButton(index)}
                            </div>
                          )}
                        </React.Fragment>
                      );
                    })}

                    {/* Floating return button at bottom if fewer than 6 or greater than 6 */}
                    {(renderCount < 6 || renderCount > 6) && (
                      <div className="w-full flex justify-end pr-6 mt-4">
                        <button
                          onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
                          className="w-11 h-11 bg-white rounded-2xl border-2 border-[#e5e5e5] shadow-[0_3px_0_#e5e5e5] active:shadow-none active:translate-y-[3px] flex items-center justify-center hover:bg-gray-50 transition-all cursor-pointer"
                          title="Scroll to active lesson"
                        >
                          <svg
                            className="w-5 h-5 text-[#1cb0f6]"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth={2.5}
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            viewBox="0 0 24 24"
                          >
                            <line x1="12" x2="12" y1="19" y2="5" />
                            <polyline points="5 12 12 5 19 12" />
                          </svg>
                        </button>
                      </div>
                    )}

                    {/* Mobile Reset Progress Button */}
                    <div className="w-full mt-8 flex justify-center pb-6">
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
                        className="text-graphite/50 hover:text-[#ea2b2b] font-bold text-xs underline transition-colors"
                      >
                        Reset All Progress
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      </main>

      <aside className="hidden lg:block w-full lg:w-[368px] shrink-0 lg:sticky lg:top-6 lg:self-start lg:h-fit">
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
                  className={`flex items-center justify-between py-2.5 px-4 rounded-xl border-2 cursor-pointer transition-all duration-150 select-none active:translate-y-[4px] active:shadow-none ${modalTimerDuration === mins
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
                  <div className="text-xs md:text-sm font-extrabold text-[#1cb0f6] mt-1 flex items-center justify-center gap-1">
                    <Image src="/img/gen_imgs/diamond.webp" alt="Gems" width={16} height={16} className="object-contain" />
                    <span>Current Balance: {profile.gems} Gems</span>
                  </div>
                )}
              </div>
            </div>

            {/* Modal Actions */}
            <div className="flex flex-col gap-3 mt-1 font-din-round">
              <button
                disabled={!profile || profile.gems < 50 || refillingHearts}
                onClick={handleRefillHeartsDashboard}
                className={`w-full bg-[#1cb0f6] text-white font-bold py-3 rounded-2xl shadow-[0_4px_0_#189edc] active:translate-y-[4px] active:shadow-none hover:brightness-105 transition-all text-sm uppercase tracking-wide cursor-pointer ${(!profile || profile.gems < 50 || refillingHearts) ? "opacity-50 cursor-not-allowed shadow-none active:translate-y-0" : ""
                  }`}
              >
                {refillingHearts ? (
                  "Refilling..."
                ) : (
                  <span className="flex items-center justify-center gap-1">
                    Refill to 5 Hearts (
                    <Image src="/img/gen_imgs/diamond.webp" alt="Gems" width={16} height={16} className="inline object-contain" />
                    50)
                  </span>
                )}
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
