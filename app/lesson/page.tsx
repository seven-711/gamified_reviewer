"use client";

import React, { useState, Suspense, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { ProgressBar } from "@/components/ui/ProgressBar";
import { QuizFooter } from "@/components/ui/QuizFooter";
import { StreakAsset } from "@/components/ui/StreakAsset";
// Data fetched via API to improve client bundle performance
import Image from "next/image";
import { parseMathText } from "@/lib/mathUtils";
import { useUser } from "@clerk/nextjs";
import { getOrCreateGuestSessionId, updateProfileStats, refillHeartsInDb, upsertFullProfile } from "@/lib/session";
import { supabase } from "@/lib/supabase";
import { useAlert } from "@/components/ui/AlertContext";
import { useStats } from "@/components/ui/StatsContext";
import dynamic from "next/dynamic";

const DotLottiePlayer = dynamic(
  () => import("@dotlottie/react-player").then((mod) => mod.DotLottiePlayer),
  { ssr: false }
);

type QuizStatus = "none" | "selected" | "correct" | "wrong" | "completed";

function shuffleArray<T>(array: T[], indices: number[]): T[] {
  return indices.map(i => array[i]);
}

function generateShuffledIndices(length: number): number[] {
  const indices = Array.from({ length }, (_, i) => i);
  for (let i = indices.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [indices[i], indices[j]] = [indices[j], indices[i]];
  }
  return indices;
}

const playSound = (src: string) => {
  if (typeof window !== "undefined") {
    const enabled = localStorage.getItem("lesson_sfx_enabled") !== "false";
    if (!enabled) return;
    const audio = new Audio(src);
    audio.play().catch((err) => console.error("Error playing audio:", err));
  }
};

function LessonContent() {
  const { showAlert } = useAlert();
  const { updateStatsLocally, refreshStats } = useStats();
  const router = useRouter();
  const searchParams = useSearchParams();
  const testId = searchParams.get("testId") || "abstract_reasoning_test1";

  const { user, isSignedIn } = useUser();

  const [questions, setQuestions] = useState<any[]>([]);
  const [shuffledIndices, setShuffledIndices] = useState<number[]>([]);
  const [testExamples, setTestExamples] = useState<any[]>([]);
  const [loadingData, setLoadingData] = useState(true);

  const [phase, setPhase] = useState<"examples" | "quiz" | "completed">("quiz");
  const [currentExampleIndex, setCurrentExampleIndex] = useState(0);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [status, setStatus] = useState<QuizStatus>("none");
  const [timeLeft, setTimeLeft] = useState<number>(300);
  const [correctAnswers, setCorrectAnswers] = useState(0);
  const [consecutiveCorrect, setConsecutiveCorrect] = useState<number>(0);
  const [streakOverlay, setStreakOverlay] = useState<{ src: string; title: string; color: string } | null>(null);

  useEffect(() => {
    if (streakOverlay) {
      const timer = setTimeout(() => {
        setStreakOverlay(null);
      }, 2000); // 1.7s stay + 300ms fade-out
      return () => clearTimeout(timer);
    }
  }, [streakOverlay]);

  const triggerStreakOverlay = (next: number) => {
    if (next === 3) {
      setStreakOverlay({
        src: "/img/gen_imgs/Streak/10_day_streak.webp",
        title: "3 STRAIGHT!",
        color: "text-[#ffc700]"
      });
    } else if (next === 5) {
      setStreakOverlay({
        src: "/img/gen_imgs/Streak/30_day_streak.webp",
        title: "5 STRAIGHT!",
        color: "text-[#ff5e00]"
      });
    } else if (next === 10) {
      setStreakOverlay({
        src: "/img/gen_imgs/Streak/50_day_streak.webp",
        title: "10 STRAIGHT!",
        color: "text-[#ff2e63]"
      });
    } else if (next === 15) {
      setStreakOverlay({
        src: "/img/gen_imgs/Streak/100_day_streak.webp",
        title: "15 STRAIGHT!",
        color: "text-[#a570ff]"
      });
    } else if (next === 20) {
      setStreakOverlay({
        src: "/img/gen_imgs/Streak/150_day_streak.webp",
        title: "20 STRAIGHT!",
        color: "text-[#1cb0f6]"
      });
    } else if (next === 25) {
      setStreakOverlay({
        src: "/img/gen_imgs/Streak/200_day_streak.webp",
        title: "25 STRAIGHT!",
        color: "text-[#58cc02]"
      });
    }
  };
  const [showHowToAnswer, setShowHowToAnswer] = useState(true);
  const [isLoaded, setIsLoaded] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showExitModal, setShowExitModal] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(true);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("lesson_sfx_enabled");
      if (saved !== null) {
        setSoundEnabled(saved === "true");
      }
    }
  }, []);

  const toggleSound = () => {
    const nextVal = !soundEnabled;
    setSoundEnabled(nextVal);
    if (typeof window !== "undefined") {
      localStorage.setItem("lesson_sfx_enabled", nextVal.toString());
    }
  };

  const keyBufferRef = React.useRef<string>("");
  const keyTimeoutRef = React.useRef<ReturnType<typeof setTimeout> | null>(null);
  const scoreSavedRef = React.useRef<boolean>(false);
  const [xpBreakdown, setXpBreakdown] = useState<{ base: number; speed: number; duration: number; total: number; } | null>(null);
  const [hearts, setHearts] = useState<number>(5);
  const [isHeartsInitialized, setIsHeartsInitialized] = useState<boolean>(false);
  const [showOutOfHeartsModal, setShowOutOfHeartsModal] = useState<boolean>(false);
  const [profileXp, setProfileXp] = useState<number>(0);
  const [profileGems, setProfileGems] = useState<number>(50);
  const [refilling, setRefilling] = useState<boolean>(false);

  // Power-Ups inventory states
  const [doubleXpExpiresAt, setDoubleXpExpiresAt] = useState<number>(0);
  const [card5050Count, setCard5050Count] = useState<number>(0);
  const [skipCardCount, setSkipCardCount] = useState<number>(0);
  const [hintCardCount, setHintCardCount] = useState<number>(0);

  // Power-up active states for current question
  const [eliminatedOptions, setEliminatedOptions] = useState<number[]>([]);
  const [hintRevealed, setHintRevealed] = useState<boolean>(false);
  const [isDoubleXpActive, setIsDoubleXpActive] = useState<boolean>(false);

  useEffect(() => {
    if (typeof window !== "undefined") {
      setDoubleXpExpiresAt(parseInt(localStorage.getItem("double_xp_expires_at") || "0", 10));
      setCard5050Count(parseInt(localStorage.getItem("powerup_5050_card_count") || "0", 10));
      setSkipCardCount(parseInt(localStorage.getItem("powerup_skip_card_count") || "0", 10));
      setHintCardCount(parseInt(localStorage.getItem("powerup_hint_card_count") || "0", 10));
    }
  }, []);

  useEffect(() => {
    const checkDoubleXp = () => {
      const expiresAt = parseInt(localStorage.getItem("double_xp_expires_at") || "0", 10);
      setIsDoubleXpActive(Date.now() < expiresAt);
    };
    checkDoubleXp();
    const interval = setInterval(checkDoubleXp, 5000);
    return () => clearInterval(interval);
  }, []);

  const handleUse5050Card = () => {
    if (card5050Count <= 0 || status === "correct" || status === "wrong" || eliminatedOptions.length > 0) return;
    const nextCount = card5050Count - 1;
    setCard5050Count(nextCount);
    localStorage.setItem("powerup_5050_card_count", nextCount.toString());

    const incorrects = Array.from({ length: question.options.length }, (_, i) => i)
      .filter(idx => idx !== question.correctIndex);
    const toEliminate = incorrects.sort(() => 0.5 - Math.random()).slice(0, 2);
    setEliminatedOptions(toEliminate);

    if (selectedOption !== null && toEliminate.includes(selectedOption)) {
      setSelectedOption(null);
      setStatus("none");
    }
    showAlert("🌓 Eliminated two wrong choices!");
  };

  const handleUseSkipCard = () => {
    if (skipCardCount <= 0) return;
    const nextCount = skipCardCount - 1;
    setSkipCardCount(nextCount);
    localStorage.setItem("powerup_skip_card_count", nextCount.toString());

    setEliminatedOptions([]);
    setHintRevealed(false);

    if (currentIndex < questions.length - 1) {
      setCurrentIndex((prev) => prev + 1);
      setSelectedOption(null);
      setStatus("none");
    } else {
      setStatus("completed");
      localStorage.removeItem(`quiz_state_${testId}`);
    }
    showAlert("⏭️ Question skipped using Skip Card!");
  };

  const handleUseHintCard = () => {
    if (hintCardCount <= 0 || status === "correct" || status === "wrong" || hintRevealed) return;
    const nextCount = hintCardCount - 1;
    setHintCardCount(nextCount);
    localStorage.setItem("powerup_hint_card_count", nextCount.toString());
    setHintRevealed(true);
    showAlert("💡 Hint unlocked for this question!");
  };

  const [gemsEarnedSummary, setGemsEarnedSummary] = useState<{
    lesson: number;
    pass: number;
    perfect: number;
    streakBonus: number;
    total: number;
  } | null>(null);

  const [economyConfig, setEconomyConfig] = useState<{
    baseReward: number;
    passingBonus: number;
    perfectBonus: number;
  }>({
    baseReward: 5,
    passingBonus: 10,
    perfectBonus: 5,
  });

  useEffect(() => {
    fetch("/api/admin/economy")
      .then((res) => res.json())
      .then((data) => {
        if (data && !data.error) {
          setEconomyConfig({
            baseReward: Number(data.baseReward ?? 5),
            passingBonus: Number(data.passingBonus ?? 10),
            perfectBonus: Number(data.perfectBonus ?? 5),
          });
        }
      })
      .catch((err) => console.error("Error loading lesson economy config:", err));
  }, []);

  const [showStreakPage, setShowStreakPage] = useState<boolean>(false);
  const [streakIncreased, setStreakIncreased] = useState<boolean>(false);
  const [newStreakCount, setNewStreakCount] = useState<number>(0);
  const [weekProgress, setWeekProgress] = useState<boolean[]>([false, false, false, false, false, false, false]);

  const handleRefillHearts = async () => {
    if (profileGems < 50) return;
    setRefilling(true);
    const profileId = isSignedIn && user ? user.id : getOrCreateGuestSessionId();
    if (profileId) {
      const res = await refillHeartsInDb(profileId);
      if (res.success) {
        setHearts(5);
        setProfileGems((prev) => Math.max(0, prev - 50));
        setShowOutOfHeartsModal(false);
      } else {
        await showAlert("Refill failed: " + res.error);
      }
    }
    setRefilling(false);
  };

  // Confirmation on window reload/close
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (status !== "completed" && phase !== "completed" && isLoaded) {
        e.preventDefault();
        e.returnValue = "Are you sure you want to leave? Your progress will be lost.";
        return e.returnValue;
      }
    };
    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, [status, phase, isLoaded]);

  // Fetch data and load state from localStorage on mount
  useEffect(() => {
    async function init() {
      setLoadingData(true);
      setError(null);
      try {
        const res = await fetch(`/api/tests?testId=${testId}`);
        if (!res.ok) throw new Error("Failed to load test data");
        const data = await res.json();
        const loadedQuestions = data.questions || [];
        if (loadedQuestions.length === 0) {
          throw new Error("No questions found for this test");
        }
        const loadedExamples = data.examples || [];
        setTestExamples(loadedExamples);

        const savedState = localStorage.getItem(`quiz_state_${testId}`);
        let activeIndices: number[] = [];

        if (savedState) {
          try {
            const parsed = JSON.parse(savedState);
            if (parsed.shuffledIndices && parsed.shuffledIndices.length === loadedQuestions.length) {
              activeIndices = parsed.shuffledIndices;
            } else {
              activeIndices = generateShuffledIndices(loadedQuestions.length);
            }
            setShuffledIndices(activeIndices);
            setQuestions(shuffleArray(loadedQuestions, activeIndices));

            setPhase(parsed.phase || (loadedExamples.length > 0 && !parsed.phase ? "examples" : "quiz"));
            const savedExampleIndex = parsed.currentExampleIndex || 0;
            setCurrentExampleIndex(savedExampleIndex < loadedExamples.length ? savedExampleIndex : 0);
            setCurrentIndex(parsed.currentIndex ?? 0);
            setSelectedOption(parsed.selectedOption ?? null);
            setStatus(parsed.status ?? "none");
            if (parsed.timeLeft !== undefined) {
              setTimeLeft(parsed.timeLeft);
            } else {
              const savedDuration = localStorage.getItem("timer_duration");
              setTimeLeft((savedDuration ? parseInt(savedDuration, 10) : 5) * 60);
            }
            setCorrectAnswers(parsed.correctAnswers ?? 0);
            setConsecutiveCorrect(parsed.consecutiveCorrect ?? 0);
            if (parsed.showHowToAnswer !== undefined) {
              setShowHowToAnswer(parsed.showHowToAnswer);
            }
          } catch (e) {
            console.error("Failed to parse saved quiz state", e);
            activeIndices = generateShuffledIndices(loadedQuestions.length);
            setShuffledIndices(activeIndices);
            setQuestions(shuffleArray(loadedQuestions, activeIndices));
            setPhase(loadedExamples.length > 0 ? "examples" : "quiz");
            const savedDuration = localStorage.getItem("timer_duration");
            setTimeLeft((savedDuration ? parseInt(savedDuration, 10) : 5) * 60);
          }
        } else {
          activeIndices = generateShuffledIndices(loadedQuestions.length);
          setShuffledIndices(activeIndices);
          setQuestions(shuffleArray(loadedQuestions, activeIndices));
          setPhase(loadedExamples.length > 0 ? "examples" : "quiz");
          const savedDuration = localStorage.getItem("timer_duration");
          setTimeLeft((savedDuration ? parseInt(savedDuration, 10) : 5) * 60);
        }
        const profileId = isSignedIn && user ? user.id : getOrCreateGuestSessionId();
        if (profileId) {
          try {
          const [gameStateRes, progressRes] = await Promise.all([
            supabase
              .from("profile_game_state")
              .select("hearts, gems")
              .eq("profile_id", profileId)
              .single(),
            supabase
              .from("profile_progress")
              .select("total_score")
              .eq("profile_id", profileId)
              .single(),
          ]);
          const dbGameState = gameStateRes.data;
          const dbProgress = progressRes.data;
          if (dbGameState) {
            const currentHearts = dbGameState.hearts !== undefined && dbGameState.hearts !== null ? dbGameState.hearts : 5;
            setHearts(currentHearts);
            setProfileGems(dbGameState.gems !== undefined && dbGameState.gems !== null ? dbGameState.gems : 50);
            setProfileXp(dbProgress?.total_score || 0);
            setIsHeartsInitialized(true);
            if (currentHearts === 0) {
              setShowOutOfHeartsModal(true);
            }
          } else {
              if (!isSignedIn) {
                // Create guest profile if it does not exist in Supabase
                await upsertFullProfile({
                  id: profileId,
                  name: "Guest",
                  exam_category: "General Review",
                  study_style: "Flashcards",
                  difficulty: "Beginner",
                  total_score: 0,
                  lessons_completed: 0,
                  streak: 0,
                  hearts: 5,
                  gems: 50,
                });
              }
              setHearts(5);
              setIsHeartsInitialized(true);
            }
          } catch (dbErr) {
            console.error("Failed to fetch hearts from Supabase", dbErr);
            // Fallback initialization to not break the page if supabase throws
            setHearts(5);
            setIsHeartsInitialized(true);
          }
        }

        setIsLoaded(true);
      } catch (err: any) {
        console.error("Failed to initialize test", err);
        setError(err.message || "Failed to load test data");
      } finally {
        setLoadingData(false);
      }
    }
    init();
  }, [testId, isSignedIn, user]);

  // Synchronize hearts changes during the quiz back to Supabase
  useEffect(() => {
    if (!isLoaded || !isHeartsInitialized) return;

    const profileId = isSignedIn && user ? user.id : getOrCreateGuestSessionId();
    if (!profileId) return;

    const syncHearts = async () => {
      try {
        const lastHeartLostAt = hearts < 5 ? new Date().toISOString() : null;
        await supabase
          .from("profile_game_state")
          .update({
            hearts,
            last_heart_lost_at: lastHeartLostAt
          })
          .eq("profile_id", profileId);

        updateStatsLocally({ hearts });
      } catch (err) {
        console.error("Failed to sync hearts to Supabase:", err);
      }
    };

    syncHearts();
  }, [hearts, isLoaded, isHeartsInitialized, isSignedIn, user, updateStatsLocally]);

  // Save state to localStorage whenever it changes
  useEffect(() => {
    if (isLoaded) {
      localStorage.setItem(`quiz_state_${testId}`, JSON.stringify({
        phase,
        currentExampleIndex,
        currentIndex,
        selectedOption,
        status,
        timeLeft,
        correctAnswers,
        showHowToAnswer,
        shuffledIndices,
        consecutiveCorrect
      }));
    }
  }, [phase, currentExampleIndex, currentIndex, selectedOption, status, timeLeft, correctAnswers, showHowToAnswer, isLoaded, testId, shuffledIndices, consecutiveCorrect]);

  // Timer logic
  useEffect(() => {
    if (!isLoaded || status === "completed" || phase !== "quiz" || showOutOfHeartsModal || hearts === 0) return;

    const interval = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          clearInterval(interval);
          setStatus("completed");
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [isLoaded, status, phase, showOutOfHeartsModal, hearts]);

  // Automatically transition to quiz phase if example index goes out of bounds or examples are empty
  useEffect(() => {
    if (phase === "examples" && (testExamples.length === 0 || currentExampleIndex >= testExamples.length)) {
      setPhase("quiz");
    }
  }, [currentExampleIndex, testExamples.length, phase]);

  // Save highest score when test is completed
  useEffect(() => {
    if (status === "completed" && !scoreSavedRef.current) {
      scoreSavedRef.current = true;
      const existingScore = localStorage.getItem(`quiz_score_${testId}`);
      let maxScore = correctAnswers;
      let previousBest = 0;
      let attempts = 1;

      if (existingScore) {
        try {
          const parsed = JSON.parse(existingScore);
          attempts = (parsed.attempts || 0) + 1;

          // If the test length changed, invalidate the old score.
          if (parsed.total === questions.length) {
            previousBest = parsed.score || 0;
            if (parsed.score > maxScore) {
              maxScore = parsed.score;
            }
          }
        } catch (e) { }
      }

      localStorage.setItem(`quiz_score_${testId}`, JSON.stringify({
        score: maxScore,
        previousBest: previousBest,
        lastScore: correctAnswers,
        attempts: attempts,
        total: questions.length
      }));

      // Calculate new cumulative XP formula
      const savedDurationStr = localStorage.getItem("timer_duration");
      const timerDurationMinutes = savedDurationStr ? parseInt(savedDurationStr, 10) : 5;
      const totalSeconds = timerDurationMinutes * 60;
      const baseScoreXp = correctAnswers * 15;
      const speedFactor = totalSeconds > 0 ? (timeLeft / totalSeconds) : 0;
      const speedBonus = Math.floor(speedFactor * timerDurationMinutes * 8);
      const durationBaseXp = timerDurationMinutes * 5;
      
      let baseTotalXp = baseScoreXp + speedBonus + durationBaseXp;
      const doubleXpExpiry = typeof window !== "undefined" ? parseInt(localStorage.getItem("double_xp_expires_at") || "0", 10) : 0;
      const isDoubleActive = Date.now() < doubleXpExpiry;
      const totalXp = isDoubleActive ? baseTotalXp * 2 : baseTotalXp;

      setXpBreakdown({
        base: baseScoreXp,
        speed: speedBonus,
        duration: durationBaseXp,
        total: totalXp
      });

      // Update database profile stats (XP and completed lessons count)
      const profileId = isSignedIn && user ? user.id : getOrCreateGuestSessionId();
      if (profileId) {
        // Reset daily stats if date changed
        const todayStr = new Date().toLocaleDateString("en-CA");
        const lastResetDate = localStorage.getItem("last_quest_reset_date");
        if (lastResetDate !== todayStr) {
          localStorage.setItem("last_quest_reset_date", todayStr);
          localStorage.setItem("daily_xp_earned", "0");
          localStorage.setItem("daily_lessons_completed", "0");
          localStorage.setItem("daily_passed_completed", "0");
          localStorage.setItem("quest_1_claimed", "false");
          localStorage.setItem("quest_2_claimed", "false");
          localStorage.setItem("quest_3_claimed", "false");
        }

        const xpEarned = totalXp;
        const currentDailyXp = parseInt(localStorage.getItem("daily_xp_earned") || "0", 10);
        const currentDailyLessons = parseInt(localStorage.getItem("daily_lessons_completed") || "0", 10);
        const currentDailyPassed = parseInt(localStorage.getItem("daily_passed_completed") || "0", 10);

        const isPassed = (correctAnswers / questions.length) >= 0.8;

        localStorage.setItem("daily_xp_earned", (currentDailyXp + xpEarned).toString());
        localStorage.setItem("daily_lessons_completed", (currentDailyLessons + 1).toString());
        if (isPassed) {
          localStorage.setItem("daily_passed_completed", (currentDailyPassed + 1).toString());
        }

        const saveStats = async () => {
          const res = await updateProfileStats(profileId, correctAnswers, timeLeft, timerDurationMinutes, hearts, questions.length, economyConfig);
          if (res) {
            const baseG = economyConfig.baseReward;
            const passG = isPassed ? economyConfig.passingBonus : 0;
            const perfG = correctAnswers === questions.length ? economyConfig.perfectBonus : 0;
            setGemsEarnedSummary({
              lesson: baseG,
              pass: passG,
              perfect: perfG,
              streakBonus: Math.max(0, res.gemsEarned - baseG - passG - perfG),
              total: res.gemsEarned
            });
            setStreakIncreased(res.streakIncreased);
            setNewStreakCount(res.newStreak);

            // Fetch weekly progress
            const today = new Date();
            const currentDayOfWeek = today.getDay(); // 0 is Sunday, 1 is Monday, etc.
            const startOfWeek = new Date(today);
            startOfWeek.setDate(today.getDate() - currentDayOfWeek);
            startOfWeek.setHours(0, 0, 0, 0);

            const endOfWeek = new Date(startOfWeek);
            endOfWeek.setDate(startOfWeek.getDate() + 6);
            endOfWeek.setHours(23, 59, 59, 999);

            try {
              const { data, error: err } = await supabase
                .from("lesson_events")
                .select("created_at")
                .eq("profile_id", profileId)
                .eq("event_type", "lesson_completed")
                .gte("created_at", startOfWeek.toISOString())
                .lte("created_at", endOfWeek.toISOString());

              if (!err && data) {
                const progress = [false, false, false, false, false, false, false];
                data.forEach((evt: any) => {
                  const d = new Date(evt.created_at);
                  progress[d.getDay()] = true;
                });
                progress[today.getDay()] = true; // Make sure today is checked since we just finished
                setWeekProgress(progress);
              } else {
                // fallback: check only today as true
                const progress = [false, false, false, false, false, false, false];
                progress[today.getDay()] = true;
                setWeekProgress(progress);
              }
            } catch (e) {
              const progress = [false, false, false, false, false, false, false];
              progress[today.getDay()] = true;
              setWeekProgress(progress);
            }

            await refreshStats();
            if (typeof window !== "undefined") {
              window.dispatchEvent(new CustomEvent("reviewer-db-update"));
            }
          }
        };
        saveStats();
      }
    }
  }, [status, correctAnswers, questions.length, testId, isSignedIn, user, timeLeft, hearts]);

  console.log('Quiz Render Diagnostics:', {
    phase,
    currentIndex,
    questionsLength: questions.length,
    status,
    currentExampleIndex,
    testExamplesLength: testExamples.length,
    hasExample: !!testExamples[currentExampleIndex]
  });
  const question = questions[currentIndex];
  const progress = (currentIndex / questions.length) * 100;

  // Keyboard Shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ignore if user is typing in an input
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;

      if (streakOverlay) {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          setStreakOverlay(null);
        }
        return;
      }

      // Ignore keyboard shortcuts if modal alerts are visible or the user is out of hearts
      if (showOutOfHeartsModal || showExitModal || hearts === 0) return;

      // Handle Option Selection (1-12+ dynamically)
      if (status === "none" || status === "selected") {
        if (/^[0-9]$/.test(e.key)) {
          keyBufferRef.current += e.key;

          if (keyTimeoutRef.current) {
            clearTimeout(keyTimeoutRef.current);
          }

          const val = parseInt(keyBufferRef.current, 10);
          if (val >= 1 && val <= question.options.length) {
            setSelectedOption(val - 1);
            setStatus("selected");
          } else if (val > question.options.length) {
            // If they typed something out of bounds (e.g. 52), reset buffer to just the last key typed if valid
            const lastDigit = parseInt(e.key, 10);
            if (lastDigit >= 1 && lastDigit <= question.options.length) {
              keyBufferRef.current = e.key;
              setSelectedOption(lastDigit - 1);
              setStatus("selected");
            } else {
              keyBufferRef.current = "";
            }
          }

          keyTimeoutRef.current = setTimeout(() => {
            keyBufferRef.current = "";
          }, 400); // 400ms window for multi-digit numbers
        } else if (/^[a-zA-Z]$/.test(e.key)) {
          const char = e.key.toUpperCase();
          const charCode = char.charCodeAt(0) - 65; // A=0, B=1, C=2, D=3, E=4...
          if (charCode >= 0 && charCode < question.options.length) {
            setSelectedOption(charCode);
            setStatus("selected");
          }
        }
      }

      // Handle Enter Key
      if (e.key === "Enter") {
        if (phase === "examples") {
          if (currentExampleIndex < testExamples.length - 1) {
            setCurrentExampleIndex(prev => prev + 1);
          } else {
            setPhase("quiz");
          }
          return;
        }
        if (status === "selected" && selectedOption !== null) {
          // Equivalent to handleCheck logic, using functional state updates where possible
          if (selectedOption === question.correctIndex) {
            playSound("/videos/correct.mp3");
            setStatus("correct");
            setCorrectAnswers((prev) => prev + 1);
            setConsecutiveCorrect((prev) => {
              const next = prev + 1;
              triggerStreakOverlay(next);
              return next;
            });
          } else {
            playSound("/videos/wrong.mp3");
            setStatus("wrong");
            setConsecutiveCorrect(0);
            setHearts((prev) => {
              const nextHearts = Math.max(0, prev - 1);
              if (nextHearts === 0) {
                setShowOutOfHeartsModal(true);
              }
              return nextHearts;
            });
          }
        } else if (status === "correct" || status === "wrong") {
          // Equivalent to handleContinue logic
          setEliminatedOptions([]);
          setHintRevealed(false);
          if (currentIndex < questions.length - 1) {
            setCurrentIndex((prev) => prev + 1);
            setSelectedOption(null);
            setStatus("none");
          } else {
            setStatus("completed");
            localStorage.removeItem(`quiz_state_${testId}`);
          }
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [
    status,
    selectedOption,
    currentIndex,
    question,
    correctAnswers,
    testId,
    questions,
    phase,
    currentExampleIndex,
    testExamples,
    showOutOfHeartsModal,
    showExitModal,
    hearts,
    streakOverlay
  ]);

  const handleOptionSelect = (index: number) => {
    if (status === "none" || status === "selected") {
      setSelectedOption(index);
      setStatus("selected");
    }
  };

  const handleCheck = () => {
    if (selectedOption === null) return;

    if (selectedOption === question.correctIndex) {
      playSound("/videos/correct.mp3");
      setStatus("correct");
      setCorrectAnswers((prev) => prev + 1);
      setConsecutiveCorrect((prev) => {
        const next = prev + 1;
        triggerStreakOverlay(next);
        return next;
      });
    } else {
      playSound("/videos/wrong.mp3");
      setStatus("wrong");
      setConsecutiveCorrect(0);
      setHearts((prev) => {
        const nextHearts = Math.max(0, prev - 1);
        if (nextHearts === 0) {
          setShowOutOfHeartsModal(true);
        }
        return nextHearts;
      });
    }
  };

  const handleContinue = () => {
    setEliminatedOptions([]);
    setHintRevealed(false);
    if (currentIndex < questions.length - 1) {
      setCurrentIndex((prev) => prev + 1);
      setSelectedOption(null);
      setStatus("none");
    } else {
      setStatus("completed");
      // Clear in-progress state so they can retake it later
      localStorage.removeItem(`quiz_state_${testId}`);
    }
  };

  const handleRetake = () => {
    if (hearts === 0) {
      setShowOutOfHeartsModal(true);
      return;
    }
    localStorage.removeItem(`quiz_state_${testId}`);
    setPhase(testExamples.length > 0 ? "examples" : "quiz");
    setCurrentExampleIndex(0);
    setCurrentIndex(0);
    setSelectedOption(null);
    setStatus("none");
    setCorrectAnswers(0);
    setConsecutiveCorrect(0);
    setEliminatedOptions([]);
    setHintRevealed(false);
    scoreSavedRef.current = false;
    const savedDuration = localStorage.getItem("timer_duration");
    setTimeLeft((savedDuration ? parseInt(savedDuration, 10) : 5) * 60);
  };

  if (showStreakPage) {
    return (
      <StreakPage
        streak={newStreakCount}
        weekProgress={weekProgress}
        onContinue={() => router.push("/dashboard")}
      />
    );
  }

  if (error) {
    return (
      <div className="dark-mode min-h-screen flex flex-col items-center justify-center bg-snow-white font-din-round text-almost-black px-6 text-center">
        <div className="w-48 h-48 relative mb-4">
          <Image src="/emoji/wahhh.webp" alt="Error face" fill sizes="192px" className="object-contain drop-shadow-lg mx-auto" />
        </div>
        <h1 className="font-feather text-3xl mb-4 text-[#ea2b2b]">Content Under Construction</h1>
        <p className="text-[17px] text-graphite mb-4 max-w-md">
          Sorry! The reviewer questions for <strong>{testId.replace(/_/g, ' ')}</strong> are currently under construction or not yet uploaded.
        </p>
        <p className="text-[15px] text-silver mb-8 max-w-md">
          Currently available reviewers: Abstract Reasoning, Logical Reasoning, Numerical Reasoning, and Quantitative Reasoning.
        </p>
        <button
          onClick={() => router.push("/dashboard")}
          className="bg-duo-green text-white font-bold text-[17px] h-[50px] px-8 rounded-2xl shadow-[0_4px_0_#3f8f01] active:translate-y-1 active:shadow-none transition-all cursor-pointer"
        >
          BACK TO DASHBOARD
        </button>
      </div>
    );
  }

  if (!isLoaded || loadingData) return (
    <div className="dark-mode min-h-screen flex items-center justify-center bg-snow-white font-din-round transition-colors duration-300">
      <div className="flex flex-col items-center gap-4 text-center px-6 animate-[fadeIn_0.5s_ease-out]">
        <div className="relative flex items-center justify-center">
          <div className="absolute h-8 w-8 rounded-full bg-duo-green/20 animate-ping"></div>
          <div className="h-12 w-12 animate-spin rounded-full border-4 border-cloud-gray dark:border-cloud-gray/10 border-t-duo-green"></div>
        </div>
        <p className="text-[15px] font-bold text-charcoal dark:text-white tracking-wide mt-2">
          Loading test...
        </p>
      </div>
    </div>
  );

  if (phase === "examples") {
    const example = testExamples[currentExampleIndex];
    if (!example) {
      if (typeof window !== "undefined") {
        localStorage.removeItem(`quiz_state_${testId}`);
      }
      return (
        <div className="dark-mode min-h-screen flex flex-col items-center justify-center bg-snow-white font-din-round text-almost-black px-6 text-center transition-colors duration-300">
          <div className="flex flex-col items-center gap-4 animate-[fadeIn_0.5s_ease-out]">
            <div className="relative flex items-center justify-center">
              <div className="absolute h-8 w-8 rounded-full bg-duo-green/20 animate-ping"></div>
              <div className="h-12 w-12 animate-spin rounded-full border-4 border-cloud-gray dark:border-cloud-gray/10 border-t-duo-green"></div>
            </div>
            <p className="text-[15px] font-bold text-charcoal dark:text-white tracking-wide mt-2">
              Recovering test session...
            </p>
          </div>
          <button
            onClick={() => window.location.reload()}
            className="mt-6 bg-duo-green hover:bg-duo-green/95 text-white font-extrabold px-6 py-3.5 rounded-2xl shadow-[0_4px_0_#3f8f01] active:translate-y-[4px] active:shadow-none transition-all cursor-pointer uppercase tracking-widest text-sm"
          >
            RELOAD SESSION
          </button>
        </div>
      );
    }
    return (
      <div className="dark-mode min-h-dvh flex flex-col bg-snow-white font-din-round text-almost-black pb-[120px] transition-colors duration-300">
        <header className="sticky top-0 bg-snow-white border-b border-transparent dark:border-cloud-gray/15 py-4 px-4 md:px-6 z-30 transition-colors duration-300">
          <div className="max-w-[1024px] mx-auto flex items-center gap-4">
            <button
              onClick={() => setShowExitModal(true)}
              className="text-silver hover:text-charcoal font-bold text-2xl p-2 transition-colors cursor-pointer"
            >
              ✕
            </button>
            <button
              onClick={toggleSound}
              className="text-silver hover:text-charcoal font-bold text-xl p-2 transition-colors cursor-pointer flex items-center justify-center min-w-[40px]"
              title={soundEnabled ? "Disable SFX" : "Enable SFX"}
            >
              {soundEnabled ? "🔊" : "🔇"}
            </button>
            <div className="grow max-w-[800px]">
              <ProgressBar progress={(currentExampleIndex / testExamples.length) * 100} />
            </div>
            <div className="font-bold text-sky-blue">
              Example {currentExampleIndex + 1}/{testExamples.length}
            </div>
          </div>
        </header>

        <main className="grow flex flex-col max-w-[800px] w-full mx-auto px-4 md:px-6 py-4 md:py-6">
          <h2 className="font-feather text-[22px] md:text-[28px] text-charcoal dark:text-white mb-4 leading-snug">
            {parseMathText(example.prompt)}
          </h2>
          <div className="bg-sky-blue/10 dark:bg-sky-blue/5 rounded-2xl p-6 border-2 border-sky-blue/20 dark:border-sky-blue/10">
            <p className="text-sky-blue font-bold mb-2 uppercase text-sm tracking-wider">Solution / Explanation</p>
            <div className="text-[14px] md:text-[17px] text-almost-black dark:text-[#f1f5f9] whitespace-pre-wrap leading-relaxed">
              {parseMathText(example.explanation)}
            </div>
          </div>
        </main>

        <div className="fixed bottom-0 left-0 right-0 bg-snow-white border-t-2 border-cloud-gray dark:border-cloud-gray/15 p-4 md:p-6 z-40 transition-colors duration-300">
          <div className="max-w-[1024px] mx-auto flex justify-end">
            <button
              onClick={() => {
                if (currentExampleIndex < testExamples.length - 1) {
                  setCurrentExampleIndex(prev => prev + 1);
                } else {
                  setPhase("quiz");
                }
              }}
              className="bg-duo-green text-white font-bold text-[17px] h-[50px] w-[200px] p-8 rounded-2xl shadow-[0_4px_0_#3f8f01] active:translate-y-1 active:shadow-none transition-all"
            >
              {currentExampleIndex < testExamples.length - 1 ? "NEXT" : "START"}
            </button>
          </div>
        </div>

        {showExitModal && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-[2px] flex items-center justify-center z-50 p-4 animate-[fadeIn_0.2s_ease-out]">
            <div className="bg-snow-white border-2 border-cloud-gray border-b-8 rounded-[24px] w-full max-w-[460px] p-6 md:p-8 flex flex-col gap-6 md:gap-8 shadow-none animate-[scaleIn_0.2s_ease-out] relative">

              {/* Mascot & Dialogue */}
              <div className="flex flex-col items-center text-center gap-5">
                <div className="w-[96px] h-[96px] relative shrink-0">
                  <Image
                    src="/emoji/wahhh.webp"
                    alt="Sad Mascot"
                    fill
                    sizes="96px"
                    className="object-contain drop-shadow-md"
                    unoptimized
                  />
                </div>
                <div className="flex flex-col gap-3 font-din-round">
                  <h3 className="font-feather text-2xl md:text-[28px] text-charcoal font-bold leading-tight tracking-wide">
                    Wait, don&apos;t go!
                  </h3>
                  <p className="text-graphite text-body leading-relaxed max-w-[360px] mx-auto tracking-wide">
                    You&apos;re in the middle of a test. If you quit now, you will lose your progress on this attempt!
                  </p>
                </div>
              </div>

              {/* Actions */}
              <div className="flex flex-col sm:flex-row items-center gap-3 w-full mt-2">
                <button
                  onClick={() => {
                    localStorage.removeItem(`quiz_state_${testId}`);
                    router.push("/dashboard");
                  }}
                  className="w-full sm:flex-1 bg-white text-[#ff4b4b] border-2 border-cloud-gray font-bold py-3 px-6 rounded-2xl shadow-[0_4px_0_var(--color-cloud-gray)] active:translate-y-[4px] active:shadow-none hover:bg-gray-50 transition-all text-body text-center cursor-pointer font-din-round"
                >
                  QUIT TEST
                </button>
                <button
                  onClick={() => setShowExitModal(false)}
                  className="w-full sm:flex-1 bg-duo-green text-white font-bold py-3 px-6 rounded-2xl shadow-[0_4px_0_#3f8f01] active:translate-y-[4px] active:shadow-none hover:brightness-105 transition-all text-body text-center cursor-pointer font-din-round"
                >
                  KEEP LEARNING
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
          `
        }} />
      </div>
    );
  }

  if (phase === "quiz" && !question) {
    if (typeof window !== "undefined") {
      localStorage.removeItem(`quiz_state_${testId}`);
      window.location.reload();
    }
    return (
      <div className="dark-mode min-h-screen flex items-center justify-center font-din-round bg-snow-white">
        <div className="flex flex-col items-center gap-4">
          <div className="h-12 w-12 animate-spin rounded-full border-4 border-cloud-gray border-t-duo-green"></div>
          <p className="text-graphite font-bold">Resetting corrupted session...</p>
        </div>
      </div>
    );
  }

  if (status === "completed" || phase === "completed") {
    const isPerfect = correctAnswers === questions.length;
    const isPassed = (correctAnswers / questions.length) >= 0.8;
    const isTimeUp = timeLeft === 0;
    const percentage = (correctAnswers / questions.length) * 100;

    let emojiSrc = "/emoji/naysu.webp";
    if (percentage === 100) {
      emojiSrc = "/emoji/awow.webp";
    } else if (percentage >= 80) {
      emojiSrc = "/emoji/naysu.webp";
    } else if (percentage >= 50) {
      emojiSrc = "/emoji/hmm.webp";
    } else {
      emojiSrc = "/emoji/wahhh.webp";
    }

    return (
      <div className="dark-mode min-h-screen flex flex-col items-center justify-center bg-snow-white font-din-round text-almost-black px-4 py-6 md:px-6 text-center transition-colors duration-300">
        <h1 className={`font-feather text-2xl md:text-4xl mb-3 md:mb-4 ${isTimeUp ? "text-[#ea2b2b]" : "text-duo-green"}`}>
          {isTimeUp ? "Time's Up!" : "Lesson Complete!"}
        </h1>

        <div className="bg-cloud-gray/10 dark:bg-cloud-gray/5 border-2 border-cloud-gray/20 dark:border-cloud-gray/10 rounded-2xl md:rounded-3xl p-4 md:p-6 mb-4 md:mb-6 w-full max-w-[340px] md:max-w-sm flex flex-col gap-3 md:gap-4">
          <div>
            <p className="text-graphite dark:text-silver font-bold text-xs md:text-base mb-0.5 md:mb-1 uppercase tracking-wide opacity-70">Your Score</p>
            <p className={`text-3xl md:text-5xl font-feather ${isPassed ? "text-duo-green" : "text-sky-blue"}`}>
              {correctAnswers} <span className="text-xl md:text-3xl text-graphite/50 dark:text-silver/30 font-din-round">/ {questions.length}</span>
            </p>
          </div>

          {xpBreakdown && (
            <div className="border-t-2 border-cloud-gray/30 pt-3 md:pt-4 mt-1 md:mt-2 flex flex-col gap-1.5 md:gap-2 text-left text-[11px] md:text-sm font-din-round font-bold text-graphite dark:text-silver">
              <div className="flex justify-between items-center">
                <span className="opacity-70">Base Score XP (+15/correct):</span>
                <span>+{xpBreakdown.base} XP</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="opacity-70">Speed Bonus (time remaining):</span>
                <span>+{xpBreakdown.speed} XP</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="opacity-70">Duration Bonus (timer weight):</span>
                <span>+{xpBreakdown.duration} XP</span>
              </div>
              {isDoubleXpActive && (
                <div className="flex justify-between items-center text-amber-500">
                  <span className="opacity-70">Double XP Boost:</span>
                  <span className="font-extrabold flex items-center gap-1">
                    <span>⚡ x2 Active</span>
                  </span>
                </div>
              )}
              <div className="flex justify-between items-center border-t border-dashed border-cloud-gray/50 dark:border-cloud-gray/10 pt-2 mt-1 text-xs md:text-sm">
                <span className="text-almost-black dark:text-white">Total XP Earned:</span>
                <span className="text-amber-500 font-black text-sm md:text-lg flex items-center">
                  <Image
                    src="/img/gen_imgs/exp.webp"
                    alt="exp icon"
                    width={26}
                    height={26}
                    className="inline mr-1 object-contain"
                  />{xpBreakdown.total} XP</span>
              </div>
            </div>
          )}

          {gemsEarnedSummary && (
            <div className="border-t-2 border-cloud-gray/30 pt-3 md:pt-4 mt-1 md:mt-2 flex flex-col gap-1.5 md:gap-2 text-left text-[11px] md:text-sm font-din-round font-bold text-graphite dark:text-silver">
              <div className="flex justify-between items-center">
                <span className="opacity-70">Lesson Completion:</span>
                <span>+{gemsEarnedSummary.lesson} Gems</span>
              </div>
              {gemsEarnedSummary.pass > 0 && (
                <div className="flex justify-between items-center">
                  <span className="opacity-70">Pass Bonus (≥80%):</span>
                  <span>+{gemsEarnedSummary.pass} Gems</span>
                </div>
              )}
              {gemsEarnedSummary.perfect > 0 && (
                <div className="flex justify-between items-center">
                  <span className="opacity-70">Perfect Score Bonus:</span>
                  <span>+{gemsEarnedSummary.perfect} Gems</span>
                </div>
              )}
              {gemsEarnedSummary.streakBonus > 0 && (
                <div className="flex justify-between items-center">
                  <span className="opacity-70">7-Day Streak Milestone:</span>
                  <span>+{gemsEarnedSummary.streakBonus} Gems</span>
                </div>
              )}
              <div className="flex justify-between items-center border-t border-dashed border-cloud-gray/50 dark:border-cloud-gray/10 pt-2 mt-1 text-xs md:text-sm">
                <span className="text-almost-black dark:text-white">Total Gems Earned:</span>
                <span className="text-blue-500 font-black text-sm md:text-lg flex items-center gap-1">
                  <Image src="/img/gen_imgs/diamond.webp" alt="Gems" width={26} height={26} className="object-contain" />
                  <span>{gemsEarnedSummary.total} Gems</span>
                </span>
              </div>
            </div>
          )}
        </div>

        <p className="text-xs md:text-[17px] text-graphite dark:text-silver mb-4 md:mb-8 max-w-xs md:max-w-md px-2 leading-relaxed">
          {isPassed
            ? (isPerfect ? "Perfect score! You've successfully finished this practice set and unlocked the next one." : "Great job! You've successfully finished this practice set and unlocked the next one.")
            : `Great effort! However, you need to score at least 80% (${Math.ceil(questions.length * 0.8)}/${questions.length}) to unlock the next test.`}
        </p>

        <div className="flex flex-col gap-3 w-full max-w-[280px] md:max-w-xs px-2">
          <button
            onClick={() => {
              if (streakIncreased) {
                setShowStreakPage(true);
              } else {
                router.push("/dashboard");
              }
            }}
            className="bg-duo-green text-white font-bold text-sm md:text-[17px] h-[46px] md:h-[50px] px-6 md:px-8 rounded-2xl shadow-[0_4px_0_#3f8f01] active:translate-y-1 active:shadow-none transition-all"
          >
            BACK TO DASHBOARD
          </button>
          <button
            onClick={handleRetake}
            className="bg-white dark:bg-transparent text-sky-blue border-2 border-sky-blue font-bold text-sm md:text-[17px] h-[46px] md:h-[50px] px-6 md:px-8 rounded-2xl shadow-[0_4px_0_#189edc] dark:shadow-none active:translate-y-1 active:shadow-none transition-all cursor-pointer"
          >
            RETAKE TEST
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className={`dark-mode min-h-dvh flex flex-col bg-snow-white font-din-round text-almost-black transition-colors duration-300 ${status === "correct" || status === "wrong" ? "pb-[250px] md:pb-[200px]" : "pb-[120px] md:pb-80px"
      }`}>
      {/* Header */}
      <header className="sticky top-0 bg-snow-white border-b border-transparent dark:border-cloud-gray/15 py-4 px-4 md:px-6 z-30 transition-colors duration-300">
        <div className="max-w-[1024px] mx-auto flex items-center gap-4">
          <button
            onClick={() => setShowExitModal(true)}
            className="text-silver hover:text-charcoal font-bold text-2xl p-2 transition-colors cursor-pointer"
          >
            ✕
          </button>
          <button
            onClick={toggleSound}
            className="text-silver hover:text-charcoal font-bold text-xl p-2 transition-colors cursor-pointer flex items-center justify-center min-w-[40px]"
            title={soundEnabled ? "Disable SFX" : "Enable SFX"}
          >
            {soundEnabled ? "🔊" : "🔇"}
          </button>

          <div className="grow max-w-[800px]">
            <ProgressBar progress={progress} />
          </div>

          <div className="flex items-center gap-2 select-none">
            {/* Double XP Indicator */}
            {isDoubleXpActive && (
              <div className="flex items-center gap-1 font-bold bg-amber-500/10 text-amber-500 text-[11px] px-2.5 py-1.5 rounded-xl border border-amber-500/20 animate-pulse shrink-0">
                <span>⚡</span>
                <span className="hidden sm:inline font-extrabold uppercase">XP Boost</span>
              </div>
            )}

            {/* Hearts Indicator */}
            <div className="flex items-center gap-1.5 font-bold shrink-0 px-3 py-1.5 rounded-xl text-red-500">
              <Image
                src="/img/gen_imgs/user_life.webp"
                alt="Hearts"
                width={20}
                height={20}
                className="object-contain"
              />
              <span className="text-[17px]">{hearts}</span>
            </div>

            {/* Timer */}
            <div className={`flex items-center gap-1.5 font-bold shrink-0 px-3 py-1.5 rounded-xl transition-colors ${timeLeft < 60 ? 'text-[#ea2b2b] animate-pulse border-[#ea2b2b]/40 bg-[#ea2b2b]/10' : 'text-graphite dark:text-silver'}`}>
              <span className="text-[17px] font-mono">
                {Math.floor(timeLeft / 60)}:{(timeLeft % 60).toString().padStart(2, '0')}
              </span>
            </div>
          </div>
        </div>
      </header>

      {/* Main Quiz Area */}
      <main className="grow flex flex-col max-w-[800px] w-full mx-auto px-4 md:px-6 py-4 md:py-6">
        <h2 className="font-feather text-[22px] md:text-[28px] text-charcoal dark:text-white mb-4 leading-snug">
          {parseMathText(question.prompt)}
        </h2>

        {/* Question Image */}
        {question.type === "image" && question.image && (
          <div className="w-full flex flex-col items-center justify-center mb-4 relative min-h-[150px]">
            <img
              src={question.image}
              alt="Question"
              className="max-w-full w-full h-auto max-h-[60vh] md:max-h-[500px] object-contain border-2 border-cloud-gray rounded-xl"
            />
            {testId.includes("logical_reasoning") && question.options.length === 12 && (
              showHowToAnswer ? (
                <div className="mt-2 md:mt-4 relative bg-sky-blue/10 text-sky-blue px-3 py-2 md:px-4 md:py-2 rounded-xl border-2 border-sky-blue/20 text-xs md:text-[14px] font-bold text-center max-w-[600px] flex items-start md:items-center gap-2 md:gap-3">
                  <span className="text-lg md:text-2xl shrink-0 mt-1 md:mt-0">💡</span>
                  <div className="text-left leading-tight pr-6">
                    <span className="text-sky-blue/80 uppercase text-[10px] md:text-xs tracking-wider block mb-0.5">How to answer</span>
                    The options (1-12) correspond to the boxes in the answer area, ordered from left to right, top to bottom.
                  </div>
                  <button
                    onClick={() => setShowHowToAnswer(false)}
                    className="absolute top-2 right-2 md:top-1/2 md:-translate-y-1/2 md:right-3 p-1 hover:bg-sky-blue/20 rounded-full transition-colors text-sky-blue"
                    aria-label="Hide hint"
                  >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => setShowHowToAnswer(true)}
                  className="mt-2 md:mt-4 text-sky-blue text-caption md:text-sm font-bold flex items-center gap-1.5 hover:opacity-80 transition-opacity bg-sky-blue/10 px-3 py-1.5 rounded-lg border-2 border-sky-blue/20"
                >
                  <span className="text-base">💡</span> Show how to answer
                </button>
              )
            )}
          </div>
        )}

        {hintRevealed && (
          <div className="bg-amber-500/10 border-2 border-amber-500/20 rounded-2xl p-4 mb-4 text-xs md:text-sm font-bold text-amber-600 dark:text-amber-400">
            <span className="text-lg mr-1.5">💡</span>
            {question.explanation || "No hint available for this question."}
          </div>
        )}

        {/* Power-Ups Toolbar */}
        {phase === "quiz" && (status === "none" || status === "selected") && (
          <div className="flex items-center justify-center gap-4 mb-4 select-none">
            <button
              disabled={card5050Count <= 0 || eliminatedOptions.length > 0}
              onClick={handleUse5050Card}
              className="flex items-center gap-1.5 bg-white dark:bg-[#202f36] border-2 border-cloud-gray dark:border-cloud-gray/10 hover:bg-cloud-gray/10 dark:hover:bg-slate-800/40 px-3.5 py-2 rounded-2xl text-xs md:text-sm font-bold text-charcoal dark:text-silver transition-all shadow-[0_3px_0_var(--color-cloud-gray)] dark:shadow-none active:translate-y-[3px] active:shadow-none disabled:opacity-40 disabled:cursor-not-allowed disabled:shadow-none disabled:translate-y-0"
              title="Eliminate 2 wrong answers"
            >
              <span className="text-base md:text-lg">🌓</span>
              <span>50/50</span>
              <span className="bg-sky-blue/10 text-sky-blue text-[10px] px-1.5 py-0.5 rounded-md font-extrabold">{card5050Count}</span>
            </button>

            <button
              disabled={skipCardCount <= 0}
              onClick={handleUseSkipCard}
              className="flex items-center gap-1.5 bg-white dark:bg-[#202f36] border-2 border-cloud-gray dark:border-cloud-gray/10 hover:bg-cloud-gray/10 dark:hover:bg-slate-800/40 px-3.5 py-2 rounded-2xl text-xs md:text-sm font-bold text-charcoal dark:text-silver transition-all shadow-[0_3px_0_var(--color-cloud-gray)] dark:shadow-none active:translate-y-[3px] active:shadow-none disabled:opacity-40 disabled:cursor-not-allowed disabled:shadow-none disabled:translate-y-0"
              title="Skip this question"
            >
              <span className="text-base md:text-lg">⏭️</span>
              <span>Skip</span>
              <span className="bg-duo-green/10 text-duo-green text-[10px] px-1.5 py-0.5 rounded-md font-extrabold">{skipCardCount}</span>
            </button>

            <button
              disabled={hintCardCount <= 0 || hintRevealed}
              onClick={handleUseHintCard}
              className="flex items-center gap-1.5 bg-white dark:bg-[#202f36] border-2 border-cloud-gray dark:border-cloud-gray/10 hover:bg-cloud-gray/10 dark:hover:bg-slate-800/40 px-3.5 py-2 rounded-2xl text-xs md:text-sm font-bold text-charcoal dark:text-silver transition-all shadow-[0_3px_0_var(--color-cloud-gray)] dark:shadow-none active:translate-y-[3px] active:shadow-none disabled:opacity-40 disabled:cursor-not-allowed disabled:shadow-none disabled:translate-y-0"
              title="Show numerical explainer"
            >
              <span className="text-base md:text-lg">💡</span>
              <span>Hint</span>
              <span className="bg-amber-500/10 text-amber-500 text-[10px] px-1.5 py-0.5 rounded-md font-extrabold">{hintCardCount}</span>
            </button>
          </div>
        )}

        {/* Options Grid */}
        <div className={`grid gap-2 md:gap-3 w-full mt-auto mb-6 ${question.options.length > 5 ? 'grid-cols-4 md:grid-cols-6' : 'grid-cols-2 md:grid-cols-2'}`}>
          {question.options.map((opt: string, idx: number) => {
            const isSelected = selectedOption === idx;
            const isCorrect = idx === question.correctIndex;
            const isEliminated = eliminatedOptions.includes(idx);

            // Highlight styling based on status
            let cardClass = "border-cloud-gray dark:border-cloud-gray/15 hover:bg-gray-50 dark:hover:bg-slate-800/40 bg-white dark:bg-[#202f36] shadow-[0_4px_0_var(--color-cloud-gray)] dark:shadow-none";
            let textClass = "text-almost-black dark:text-[#f1f5f9]";

            if (isEliminated) {
              cardClass = "border-cloud-gray dark:border-cloud-gray/15 opacity-20 pointer-events-none line-through shadow-none";
            } else if (isSelected) {
              if (status === "none" || status === "selected") {
                cardClass = "border-sky-blue bg-[#ddf4ff] dark:bg-[#ddf4ff]/10 shadow-[0_4px_0_#189edc] dark:shadow-none";
                textClass = "text-sky-blue";
              } else if (status === "correct") {
                cardClass = "border-duo-green bg-[#d7ffb8] dark:bg-[#d7ffb8]/10 shadow-[0_4px_0_#3f8f01] dark:shadow-none";
                textClass = "text-duo-green dark:text-[#58cc02]";
              } else if (status === "wrong") {
                cardClass = "border-[#ea2b2b] bg-[#ffdfe0] dark:bg-[#ffdfe0]/10 shadow-[0_4px_0_#ba1c1c] dark:shadow-none";
                textClass = "text-[#ea2b2b]";
              }
            } else if (status === "wrong" && isCorrect) {
              // Highlight the correct answer if they got it wrong
              cardClass = "border-duo-green bg-[#d7ffb8] dark:bg-[#d7ffb8]/10 shadow-[0_4px_0_#3f8f01] dark:shadow-none opacity-70";
              textClass = "text-duo-green dark:text-[#58cc02]";
            } else if (status === "correct" || status === "wrong") {
              // Dim unselected options
              cardClass = "border-cloud-gray dark:border-cloud-gray/15 opacity-40 shadow-none";
            }

            return (
              <button
                key={idx}
                onClick={() => handleOptionSelect(idx)}
                disabled={status === "correct" || status === "wrong" || isEliminated}
                className={`py-4 px-3 md:p-4 rounded-2xl border-2 flex items-center justify-center transition-all duration-150 relative ${cardClass}`}
              >
                <div className="hidden md:flex absolute left-4 w-7 h-7 bg-cloud-gray/20 dark:bg-cloud-gray/5 rounded-md items-center justify-center text-graphite dark:text-silver text-xs font-bold border-b-2 border-cloud-gray/40 dark:border-cloud-gray/10">
                  {idx + 1}
                </div>
                <span className={`font-bold text-[17px] md:text-xl w-full text-center ${textClass}`}>
                  {parseMathText(opt)}
                </span>
              </button>
            );
          })}
        </div>
      </main>

      <QuizFooter
        status={status}
        onCheck={handleCheck}
        onContinue={handleContinue}
        explanation={question.explanation}
        correctAnswer={question.options[question.correctIndex]}
      />

      {showExitModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-[2px] flex items-center justify-center z-50 p-4 animate-[fadeIn_0.2s_ease-out]">
          <div className="bg-snow-white border-2 border-cloud-gray dark:border-cloud-gray/15 border-b-8 rounded-[24px] w-full max-w-[460px] p-6 md:p-8 flex flex-col gap-6 md:gap-8 shadow-none animate-[scaleIn_0.2s_ease-out] relative">

            {/* Mascot & Dialogue */}
            <div className="flex flex-col items-center text-center gap-5">
              <div className="w-[96px] h-[96px] relative shrink-0">
                <Image
                  src="/emoji/wahhh.webp"
                  alt="Sad Mascot"
                  fill
                  sizes="56px"
                  className="object-contain drop-shadow-md"
                  unoptimized
                />
              </div>
              <div className="flex flex-col gap-3 font-din-round">
                <h3 className="font-feather text-2xl md:text-[28px] text-charcoal dark:text-[#f1f5f9] font-bold leading-tight tracking-wide">
                  Wait, don&apos;t go!
                </h3>
                <p className="text-graphite dark:text-silver text-body leading-relaxed max-w-[360px] mx-auto tracking-wide">
                  You&apos;re in the middle of a test. If you quit now, you will lose your progress on this attempt!
                </p>
              </div>
            </div>

            {/* Actions */}
            <div className="flex flex-col sm:flex-row items-center gap-3 w-full mt-2">
              <button
                onClick={() => {
                  localStorage.removeItem(`quiz_state_${testId}`);
                  router.push("/dashboard");
                }}
                className="w-full sm:flex-1 bg-white dark:bg-transparent text-[#ff4b4b] border-2 border-cloud-gray dark:border-cloud-gray/15 font-bold py-3 px-6 rounded-2xl shadow-[0_4px_0_var(--color-cloud-gray)] dark:shadow-none active:translate-y-[4px] active:shadow-none hover:bg-gray-50 dark:hover:bg-slate-800/40 transition-all text-body text-center cursor-pointer font-din-round"
              >
                QUIT TEST
              </button>
              <button
                onClick={() => setShowExitModal(false)}
                className="w-full sm:flex-1 bg-duo-green text-white font-bold py-3 px-6 rounded-2xl shadow-[0_4px_0_#3f8f01] active:translate-y-[4px] active:shadow-none hover:brightness-105 transition-all text-body text-center cursor-pointer font-din-round"
              >
                KEEP LEARNING
              </button>
            </div>
          </div>
        </div>
      )}

      {showOutOfHeartsModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-[2px] flex items-center justify-center z-50 p-4 animate-[fadeIn_0.2s_ease-out]">
          <div className="bg-snow-white dark:bg-[#202f36] border-2 border-cloud-gray dark:border-cloud-gray/15 border-b-8 rounded-[24px] w-full max-w-[460px] p-6 md:p-8 flex flex-col gap-6 md:gap-8 shadow-none animate-[scaleIn_0.2s_ease-out] relative">

            {/* Crying Mascot & Broken Heart Overlay */}
            <div className="flex flex-col items-center text-center gap-5">
              <div className="w-[110px] h-[110px] relative shrink-0">
                <Image
                  src="/emoji/wahhh.webp"
                  alt="Sad Mascot"
                  fill
                  sizes="110px"
                  className="object-contain drop-shadow-md"
                  unoptimized
                />
                <span className="absolute -bottom-2 -right-2 text-3xl bg-snow-white dark:bg-[#1a2529] p-2 rounded-full border-2 border-cloud-gray dark:border-cloud-gray/15 shadow-sm">
                  💔
                </span>
              </div>

              <div className="flex flex-col gap-3 font-din-round">
                <h3 className="font-feather text-2xl md:text-[28px] text-charcoal dark:text-[#f1f5f9] font-bold leading-tight tracking-wide">
                  Out of Hearts!
                </h3>
                <p className="text-graphite dark:text-silver text-body leading-relaxed max-w-[360px] mx-auto tracking-wide">
                  You made too many mistakes in this session. Refill to continue practicing, or exit back to the dashboard!
                </p>
                <div className="text-xs md:text-sm font-extrabold text-[#1cb0f6] mt-1 flex items-center justify-center gap-1">
                  <Image src="/img/gen_imgs/diamond.webp" alt="Gems" width={16} height={16} className="object-contain" />
                  <span>Current Balance: {profileGems} Gems</span>
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="flex flex-col items-center gap-3 w-full mt-2 font-din-round">
              <button
                disabled={profileGems < 50 || refilling}
                onClick={handleRefillHearts}
                className={`w-full bg-duo-green text-white font-bold py-3 px-6 rounded-2xl shadow-[0_4px_0_#3f8f01] active:translate-y-[4px] active:shadow-none hover:brightness-105 transition-all text-body text-center cursor-pointer ${(profileGems < 50 || refilling) ? "opacity-50 cursor-not-allowed shadow-none active:translate-y-0" : ""
                  }`}
              >
                {refilling ? (
                  "REFILLING..."
                ) : (
                  <span className="flex items-center justify-center gap-1">
                    REFILL (
                    <Image src="/img/gen_imgs/diamond.webp" alt="Gems" width={16} height={16} className="inline object-contain" />
                    50)
                  </span>
                )}
              </button>

              {profileGems < 50 && (
                <span className="text-[11px] text-red-500 font-bold -mt-1 leading-none text-center">
                  You need 50 Gems to refill. Try again once you earn more XP!
                </span>
              )}

              <button
                onClick={() => {
                  localStorage.removeItem(`quiz_state_${testId}`);
                  router.push("/dashboard");
                }}
                className="w-full bg-white dark:bg-transparent text-graphite dark:text-silver border-2 border-cloud-gray dark:border-cloud-gray/15 hover:bg-gray-50 dark:hover:bg-slate-800/40 hover:text-almost-black dark:hover:text-white font-bold py-3 px-6 rounded-2xl shadow-[0_4px_0_var(--color-cloud-gray)] dark:shadow-none active:translate-y-[4px] active:shadow-none transition-all text-body text-center cursor-pointer"
              >
                EXIT QUIZ
              </button>
            </div>
          </div>
        </div>
      )}

      {streakOverlay && (
        <div 
          onClick={() => setStreakOverlay(null)}
          className="fixed inset-0 bg-black/35 backdrop-blur-[1px] flex flex-col items-center justify-center z-[100] p-4 animate-[fadeIn_0.2s_ease-out] cursor-pointer"
        >
          <div className="flex flex-col items-center gap-6 select-none pointer-events-none animate-[streakFade_2.0s_ease-in-out_forwards]">
            <div className="w-[300px] h-[300px] md:w-[400px] md:h-[400px] relative flex items-center justify-center">
              <Image
                src={streakOverlay.src}
                alt={streakOverlay.title}
                fill
                sizes="(max-width: 768px) 300px, 400px"
                className="object-contain drop-shadow-2xl"
                priority
              />
            </div>
            <h3 
              className={`font-feather font-black text-3xl md:text-5xl tracking-wider uppercase select-none ${streakOverlay.color}`}
              style={{
                textShadow: "0 4px 0 #000, 0 -4px 0 #000, 4px 0 0 #000, -4px 0 0 #000, 4px 4px 0 #000, -4px -4px 0 #000, 4px -4px 0 #000, -4px 4px 0 #000",
              }}
            >
              {streakOverlay.title}
            </h3>
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
          @keyframes streakFade {
            0% { opacity: 0; transform: scale(0.85); }
            10% { opacity: 1; transform: scale(1.05); }
            15% { opacity: 1; transform: scale(1); }
            85% { opacity: 1; transform: scale(1); }
            100% { opacity: 0; transform: scale(0.95); }
          }
        `
      }} />
    </div>
  );
}

export default function LessonPage() {
  return (
    <Suspense fallback={
      <div className="dark-mode min-h-screen flex items-center justify-center bg-snow-white font-din-round transition-colors duration-300">
        <div className="flex flex-col items-center gap-4 text-center px-6 animate-[fadeIn_0.5s_ease-out]">
          <div className="relative flex items-center justify-center">
            <div className="absolute h-8 w-8 rounded-full bg-duo-green/20 animate-ping"></div>
            <div className="h-12 w-12 animate-spin rounded-full border-4 border-cloud-gray dark:border-cloud-gray/10 border-t-duo-green"></div>
          </div>
          <p className="text-[15px] font-bold text-charcoal dark:text-white tracking-wide mt-2">
            Loading...
          </p>
        </div>
      </div>
    }>
      <LessonContent />
    </Suspense>
  );
}

interface StreakPageProps {
  streak: number;
  weekProgress: boolean[];
  onContinue: () => void;
}

function StreakPage({ streak, weekProgress, onContinue }: StreakPageProps) {
  const daysOfWeek = ["Su", "M", "Tu", "W", "Th", "F", "Sa"];
  const [todayIndex, setTodayIndex] = useState<number | null>(null);

  useEffect(() => {
    setTodayIndex(new Date().getDay());
  }, []);

  const isHydrated = todayIndex !== null;

  return (
    <div className="min-h-screen flex flex-col items-center justify-between bg-[#131f24] text-white font-din-round px-6 py-8 transition-colors duration-300 relative select-none animate-[fadeIn_0.3s_ease-out] w-full">
      {/* Top Left Close Button */}
      <button
        onClick={onContinue}
        className="absolute top-6 left-6 text-gray-500 hover:text-white transition-colors duration-200 p-2 text-2xl font-bold focus:outline-none cursor-pointer z-50"
        aria-label="Close"
      >
        ✕
      </button>

      {/* Spacer / Center container */}
      <div className="grow flex flex-col items-center justify-center w-full max-w-md gap-6 md:mt-0">
        
        {/* Flame Animation & Streak Number */}
        <div className="relative w-84 h-84 md:w-72 md:h-72 flex items-center justify-center">
          <DotLottiePlayer
            src="/img/gen_imgs/Streak/Flame - Streak.lottie"
            autoplay
            loop
            className="w-full h-full object-contain"
          />
          {/* Streak Number Overlayed on the flame/video */}
          <div className="absolute bottom-12 flex flex-col items-center justify-center">
            <span 
              className="text-7xl md:text-8xl font-black text-white font-feather select-none tracking-tighter"
              style={{
                textShadow: "0 4px 0 #000, 0 -4px 0 #000, 4px 0 0 #000, -4px 0 0 #000, 4px 4px 0 #000, -4px -4px 0 #000, 4px -4px 0 #000, -4px 4px 0 #000",
              }}
            >
              {streak}
            </span>
          </div>
        </div>

        {/* X Day Streak Text */}
        <h2 className="text-[#f89e1b] font-feather text-2xl md:text-3xl font-extrabold tracking-wide uppercase text-center animate-[scaleIn_0.4s_ease-out]">
          day streak!
        </h2>

        {/* Calendar Tracker Card */}
        <div className="w-full bg-[#18252d] border border-[#35454e] rounded-[24px] p-4 md:p-6 flex flex-col gap-5 shadow-2xl">
          {/* Days row */}
          <div className="flex justify-between items-center px-1 w-full">
            {daysOfWeek.map((day, index) => {
              const isToday = isHydrated && index === todayIndex;
              const isCompleted = weekProgress[index];
              return (
                <div key={day} className="flex flex-col items-center gap-3 flex-1">
                  {/* Day Name Label */}
                  <span
                    className={`text-xs md:text-sm font-bold tracking-wider ${
                      isToday ? "text-[#f89e1b] font-black" : "text-gray-400"
                    }`}
                  >
                    {day}
                  </span>

                  {/* Icon Checkmark Container */}
                  <div className="w-10 h-10 md:w-12 md:h-12 flex items-center justify-center relative shrink-0">
                    {isToday && isCompleted ? (
                      /* Today Completed: Flame outline with streak.webp checkmark inside */
                      <>
                        <StreakAsset
                          streak={1}
                          className="absolute w-90 h-90 md:w-28 md:h-28 object-contain shrink-0 scale-120 md:scale-510 pointer-events-none z-10"
                        />
                      </>
                    ) : isCompleted ? (
                      /* Previous Day Completed: Gold circle with checkmark */
                      <div className="w-9 h-9 md:w-10 md:h-10 rounded-full bg-[#f89e1b] border-2 border-[#d77800] flex items-center justify-center shadow-lg shrink-0">
                        <svg
                          viewBox="0 0 24 24"
                          className="w-4 h-4 md:w-5 md:h-5 text-white stroke-white stroke-[4] fill-none shrink-0"
                        >
                          <polyline points="20 6 9 17 4 12" />
                        </svg>
                      </div>
                    ) : (
                      /* Not Completed: Dark empty circle */
                      <div className="w-9 h-9 md:w-10 md:h-10 rounded-full bg-[#202f36] border-2 border-[#35454e] flex items-center justify-center shrink-0" />
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Transparent Line Divider */}
          <div className="w-full h-[1px] bg-[#35454e]/50" />

          {/* Description Text */}
          <p className="text-center text-xs md:text-sm text-gray-300 leading-relaxed font-din-round tracking-wide">
            A <span className="text-[#f89e1b] font-bold">streak </span> counts how many days you&apos;ve practiced in a row
          </p>
        </div>
      </div>

      {/* Bottom Button */}
      <div className="w-full max-w-sm mt-8 pb-4">
        <button
          onClick={onContinue}
          className="w-full bg-[#49c0f8] text-white font-extrabold text-lg py-4 rounded-[18px] shadow-[0_5px_0_#189edc] active:translate-y-[5px] active:shadow-none hover:brightness-105 transition-all tracking-wider uppercase font-din-round cursor-pointer"
        >
          Continue
        </button>
      </div>

      <style dangerouslySetInnerHTML={{
        __html: `
          @keyframes fadeIn {
            from { opacity: 0; }
            to { opacity: 1; }
          }
          @keyframes scaleIn {
            from { opacity: 0; transform: scale(0.9); }
            to { opacity: 1; transform: scale(1); }
          }
        `
      }} />
    </div>
  );
}
