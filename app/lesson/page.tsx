"use client";

import React, { useState, Suspense, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { ProgressBar } from "@/components/ui/ProgressBar";
import { QuizFooter } from "@/components/ui/QuizFooter";
// Data fetched via API to improve client bundle performance
import Image from "next/image";
import { parseMathText } from "@/lib/mathUtils";
import { useUser } from "@clerk/nextjs";
import { getOrCreateGuestSessionId, updateProfileStats, refillHeartsInDb } from "@/lib/session";
import { supabase } from "@/lib/supabase";
import { useAlert } from "@/components/ui/AlertContext";
import { useStats } from "@/components/ui/StatsContext";

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
  const [showAwoooVideo, setShowAwoooVideo] = useState<boolean>(false);
  const [showHowToAnswer, setShowHowToAnswer] = useState(true);
  const [isLoaded, setIsLoaded] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showExitModal, setShowExitModal] = useState(false);

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
  const [gemsEarnedSummary, setGemsEarnedSummary] = useState<{
    lesson: number;
    pass: number;
    perfect: number;
    streakBonus: number;
    total: number;
  } | null>(null);

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
            const { data: dbProfile } = await supabase
              .from("profiles")
              .select("hearts, total_score, gems")
              .eq("id", profileId)
              .single();
            if (dbProfile) {
              const currentHearts = dbProfile.hearts !== undefined && dbProfile.hearts !== null ? dbProfile.hearts : 5;
              setHearts(currentHearts);
              setProfileXp(dbProfile.total_score || 0);
              setProfileGems(dbProfile.gems !== undefined && dbProfile.gems !== null ? dbProfile.gems : 50);
              setIsHeartsInitialized(true);
              if (currentHearts === 0) {
                setShowOutOfHeartsModal(true);
              }
            } else {
              if (!isSignedIn) {
                // Create guest profile if it does not exist in Supabase
                await supabase.from("profiles").upsert({
                  id: profileId,
                  name: "Guest",
                  exam_category: "General Review",
                  study_style: "Flashcards",
                  difficulty: "Beginner",
                  total_score: 0,
                  lessons_completed: 0,
                  streak: 0,
                  hearts: 5,
                  gems: 50
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
          .from("profiles")
          .update({
            hearts,
            last_heart_lost_at: lastHeartLostAt
          })
          .eq("id", profileId);
        
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
        } catch(e) {}
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
      const totalXp = baseScoreXp + speedBonus + durationBaseXp;

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
          const res = await updateProfileStats(profileId, correctAnswers, timeLeft, timerDurationMinutes, hearts, questions.length);
          if (res) {
            setGemsEarnedSummary({
              lesson: 5,
              pass: isPassed ? 10 : 0,
              perfect: correctAnswers === questions.length ? 5 : 0,
              streakBonus: (res.gemsEarned - 5 - (isPassed ? 10 : 0) - (correctAnswers === questions.length ? 5 : 0)),
              total: res.gemsEarned
            });
            await refreshStats();
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

      if (showAwoooVideo) {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          setShowAwoooVideo(false);
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
            setStatus("correct");
            setCorrectAnswers((prev) => prev + 1);
            setConsecutiveCorrect((prev) => {
              const next = prev + 1;
              if (next === 3) {
                setShowAwoooVideo(true);
                return 0;
              }
              return next;
            });
          } else {
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
    showAwoooVideo
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
      setStatus("correct");
      setCorrectAnswers((prev) => prev + 1);
      setConsecutiveCorrect((prev) => {
        const next = prev + 1;
        if (next === 3) {
          setShowAwoooVideo(true);
          return 0;
        }
        return next;
      });
    } else {
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
    scoreSavedRef.current = false;
    const savedDuration = localStorage.getItem("timer_duration");
    setTimeLeft((savedDuration ? parseInt(savedDuration, 10) : 5) * 60);
  };

  if (error) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-white font-din-round text-almost-black px-6 text-center">
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
    <div className="min-h-screen flex items-center justify-center font-din-round">
      <div className="flex flex-col items-center gap-4">
        <div className="h-12 w-12 animate-spin rounded-full border-4 border-cloud-gray border-t-duo-green"></div>
        <p className="text-graphite font-bold">Loading test...</p>
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
        <div className="min-h-screen flex flex-col items-center justify-center bg-white font-din-round text-almost-black px-6 text-center">
          <div className="flex flex-col items-center gap-4">
            <div className="h-12 w-12 animate-spin rounded-full border-4 border-cloud-gray border-t-duo-green"></div>
            <p className="text-graphite font-bold">Recovering test session...</p>
          </div>
          <button
            onClick={() => window.location.reload()}
            className="mt-6 bg-duo-green text-white font-bold px-6 py-3 rounded-2xl shadow-[0_4px_0_#3f8f01] active:translate-y-1 active:shadow-none transition-all cursor-pointer"
          >
            RELOAD SESSION
          </button>
        </div>
      );
    }
    return (
      <div className="min-h-dvh flex flex-col bg-white font-din-round text-almost-black pb-[120px]">
        <header className="sticky top-0 bg-white py-4 px-4 md:px-6 z-30">
          <div className="max-w-[1024px] mx-auto flex items-center gap-4">
            <button
              onClick={() => setShowExitModal(true)}
              className="text-silver hover:text-charcoal font-bold text-2xl p-2 transition-colors cursor-pointer"
            >
              ✕
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
          <h2 className="font-feather text-[22px] md:text-[28px] text-charcoal mb-4 leading-snug">
            {parseMathText(example.prompt)}
          </h2>
          <div className="bg-sky-blue/10 rounded-2xl p-6 border-2 border-sky-blue/20">
            <p className="text-sky-blue font-bold mb-2 uppercase text-sm tracking-wider">Solution / Explanation</p>
            <div className="text-[14px] md:text-[17px] text-almost-black whitespace-pre-wrap leading-relaxed">
              {parseMathText(example.explanation)}
            </div>
          </div>
        </main>
        
        <div className="fixed bottom-0 left-0 right-0 bg-white border-t-2 border-cloud-gray p-4 md:p-6 z-40">
          <div className="max-w-[1024px] mx-auto flex justify-end">
            <button
              onClick={() => {
                if (currentExampleIndex < testExamples.length - 1) {
                  setCurrentExampleIndex(prev => prev + 1);
                } else {
                  setPhase("quiz");
                }
              }}
              className="bg-duo-green text-white font-bold text-[17px] h-[50px] px-8 rounded-2xl shadow-[0_4px_0_#3f8f01] active:translate-y-1 active:shadow-none transition-all"
            >
              {currentExampleIndex < testExamples.length - 1 ? "NEXT EXAMPLE" : "START TEST"}
            </button>
          </div>
        </div>

        {showExitModal && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-[2px] flex items-center justify-center z-50 p-4 animate-[fadeIn_0.2s_ease-out]">
            <div className="bg-white border-2 border-cloud-gray border-b-8 rounded-[24px] w-full max-w-[460px] p-6 md:p-8 flex flex-col gap-6 md:gap-8 shadow-none animate-[scaleIn_0.2s_ease-out] relative">
              
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
      <div className="min-h-screen flex items-center justify-center font-din-round">
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
      <div className="min-h-screen flex flex-col items-center justify-center bg-white font-din-round text-almost-black px-6 text-center">
        <div className="w-48 h-48 md:w-56 md:h-56 relative mb-4">
          <Image src={emojiSrc} alt="Score reaction" fill className="object-contain drop-shadow-lg" />
        </div>
        
        <h1 className={`font-feather text-4xl mb-4 ${isTimeUp ? "text-[#ea2b2b]" : "text-duo-green"}`}>
          {isTimeUp ? "Time's Up!" : "Lesson Complete!"}
        </h1>
        
        <div className="bg-cloud-gray/10 border-2 border-cloud-gray/20 rounded-3xl p-6 mb-6 w-full max-w-sm flex flex-col gap-4">
          <div>
            <p className="text-graphite font-bold text-base mb-1 uppercase tracking-wide opacity-70">Your Score</p>
            <p className={`text-5xl font-feather ${isPassed ? "text-duo-green" : "text-sky-blue"}`}>
              {correctAnswers} <span className="text-3xl text-graphite/50 font-din-round">/ {questions.length}</span>
            </p>
          </div>
          
          {xpBreakdown && (
            <div className="border-t-2 border-cloud-gray/30 pt-4 mt-2 flex flex-col gap-2 text-left text-xs md:text-sm font-din-round font-bold text-graphite">
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
              <div className="flex justify-between items-center border-t border-dashed border-cloud-gray/50 pt-2 mt-1 text-sm">
                <span className="text-almost-black">Total XP Earned:</span>
                <span className="text-amber-500 font-black text-base md:text-lg">🏆 +{xpBreakdown.total} XP</span>
              </div>
            </div>
          )}

          {gemsEarnedSummary && (
            <div className="border-t-2 border-cloud-gray/30 pt-4 mt-2 flex flex-col gap-2 text-left text-xs md:text-sm font-din-round font-bold text-graphite">
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
              <div className="flex justify-between items-center border-t border-dashed border-cloud-gray/50 pt-2 mt-1 text-sm">
                <span className="text-almost-black">Total Gems Earned:</span>
                <span className="text-blue-500 font-black text-base md:text-lg flex items-center gap-1">
                  <Image src="/img/gen_imgs/diamond.webp" alt="Gems" width={18} height={18} className="object-contain" />
                  <span>+{gemsEarnedSummary.total} Gems</span>
                </span>
              </div>
            </div>
          )}
        </div>
        
        <p className="text-[17px] text-graphite mb-8 max-w-md">
          {isPassed 
            ? (isPerfect ? "Perfect score! You've successfully finished this practice set and unlocked the next one." : "Great job! You've successfully finished this practice set and unlocked the next one.")
            : `Great effort! However, you need to score at least 80% (${Math.ceil(questions.length * 0.8)}/${questions.length}) to unlock the next test.`}
        </p>
        
        <div className="flex flex-col gap-4 w-full max-w-xs">
          <button
            onClick={() => router.push("/dashboard")}
            className="bg-duo-green text-white font-bold text-[17px] h-[50px] px-8 rounded-2xl shadow-[0_4px_0_#3f8f01] active:translate-y-1 active:shadow-none transition-all"
          >
            BACK TO DASHBOARD
          </button>
          <button
            onClick={handleRetake}
            className="bg-white text-sky-blue border-2 border-sky-blue font-bold text-[17px] h-[50px] px-8 rounded-2xl shadow-[0_4px_0_#189edc] active:translate-y-1 active:shadow-none transition-all cursor-pointer"
          >
            RETAKE TEST
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className={`min-h-dvh flex flex-col bg-white font-din-round text-almost-black ${
      status === "correct" || status === "wrong" ? "pb-[250px] md:pb-[200px]" : "pb-[120px] md:pb-80px"
    }`}>
      {/* Header */}
      <header className="sticky top-0 bg-white py-4 px-4 md:px-6 z-30">
        <div className="max-w-[1024px] mx-auto flex items-center gap-4">
          <button
            onClick={() => setShowExitModal(true)}
            className="text-silver hover:text-charcoal font-bold text-2xl p-2 transition-colors cursor-pointer"
          >
            ✕
          </button>
          
          <div className="grow max-w-[800px]">
            <ProgressBar progress={progress} />
          </div>

          <div className="flex items-center gap-2 select-none">
            {/* Hearts Indicator */}
            <div className="flex items-center gap-1.5 font-bold shrink-0 bg-cloud-gray/20 dark:bg-[#202f36] px-3 py-1.5 rounded-xl border-2 border-cloud-gray/40 dark:border-cloud-gray/15 text-red-500">
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
            <div className={`flex items-center gap-1.5 font-bold shrink-0 bg-cloud-gray/20 px-3 py-1.5 rounded-xl border-2 border-cloud-gray/40 transition-colors ${timeLeft < 60 ? 'text-[#ea2b2b] animate-pulse border-[#ea2b2b]/40 bg-[#ea2b2b]/10' : 'text-graphite'}`}>
              <span className="text-lg">⏱️</span>
              <span className="text-[17px] font-mono">
                {Math.floor(timeLeft / 60)}:{(timeLeft % 60).toString().padStart(2, '0')}
              </span>
            </div>
          </div>
        </div>
      </header>

      {/* Main Quiz Area */}
      <main className="grow flex flex-col max-w-[800px] w-full mx-auto px-4 md:px-6 py-4 md:py-6">
        <h2 className="font-feather text-[22px] md:text-[28px] text-charcoal mb-4 leading-snug">
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

        {/* Options Grid */}
        <div className={`grid gap-2 md:gap-3 w-full mt-auto mb-6 ${question.options.length > 5 ? 'grid-cols-4 md:grid-cols-6' : 'grid-cols-2 md:grid-cols-2'}`}>
          {question.options.map((opt: string, idx: number) => {
            const isSelected = selectedOption === idx;
            const isCorrect = idx === question.correctIndex;
            
            // Highlight styling based on status
            let cardClass = "border-cloud-gray hover:bg-gray-50 shadow-[0_4px_0_var(--color-cloud-gray)]";
            let textClass = "text-almost-black";

            if (isSelected) {
              if (status === "none" || status === "selected") {
                cardClass = "border-sky-blue bg-[#ddf4ff] shadow-[0_4px_0_#189edc]";
                textClass = "text-sky-blue";
              } else if (status === "correct") {
                cardClass = "border-duo-green bg-[#d7ffb8] shadow-[0_4px_0_#3f8f01]";
                textClass = "text-duo-green";
              } else if (status === "wrong") {
                cardClass = "border-[#ea2b2b] bg-[#ffdfe0] shadow-[0_4px_0_#ba1c1c]";
                textClass = "text-[#ea2b2b]";
              }
            } else if (status === "wrong" && isCorrect) {
              // Highlight the correct answer if they got it wrong
              cardClass = "border-duo-green bg-[#d7ffb8] shadow-[0_4px_0_#3f8f01] opacity-70";
              textClass = "text-duo-green";
            } else if (status === "correct" || status === "wrong") {
              // Dim unselected options
              cardClass = "border-cloud-gray opacity-40 shadow-none";
            }

            return (
              <button
                key={idx}
                onClick={() => handleOptionSelect(idx)}
                disabled={status === "correct" || status === "wrong"}
                className={`py-4 px-3 md:p-4 rounded-2xl border-2 flex items-center justify-center transition-all duration-150 relative ${cardClass}`}
              >
                <div className="hidden md:flex absolute left-4 w-7 h-7 bg-cloud-gray/20 rounded-md items-center justify-center text-graphite text-xs font-bold border-b-2 border-cloud-gray/40">
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
          <div className="bg-white dark:bg-[#202f36] border-2 border-cloud-gray dark:border-cloud-gray/15 border-b-8 rounded-[24px] w-full max-w-[460px] p-6 md:p-8 flex flex-col gap-6 md:gap-8 shadow-none animate-[scaleIn_0.2s_ease-out] relative">
            
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
                className={`w-full bg-duo-green text-white font-bold py-3 px-6 rounded-2xl shadow-[0_4px_0_#3f8f01] active:translate-y-[4px] active:shadow-none hover:brightness-105 transition-all text-body text-center cursor-pointer ${
                  (profileGems < 50 || refilling) ? "opacity-50 cursor-not-allowed shadow-none active:translate-y-0" : ""
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

      {showAwoooVideo && (
        <div className="fixed inset-0 bg-black flex flex-col items-center justify-center z-[100] p-4 animate-[fadeIn_0.2s_ease-out]">
          <div className="w-full max-w-[480px] flex flex-col items-center gap-6 animate-[scaleIn_0.2s_ease-out]">
            <div className="flex flex-col items-center text-center gap-2">
              <h3 className="font-feather font-black text-3xl md:text-4xl text-[#ffc700] tracking-wide uppercase select-none">
                3 Correct Streak! 🔥
              </h3>
            </div>
            
            <div className="w-full aspect-video relative bg-black flex items-center justify-center">
              <video
                src="/videos/awooo.webm"
                autoPlay
                playsInline
                className="w-full h-full object-contain"
                onEnded={() => setShowAwoooVideo(false)}
                onError={(e) => {
                  console.error("Awooo video failed to play:", e);
                }}
              />
            </div>
            
            <button
              onClick={() => setShowAwoooVideo(false)}
              className="w-full max-w-[240px] bg-duo-green text-white font-bold py-3 px-6 rounded-2xl shadow-[0_4px_0_#3f8f01] active:translate-y-[4px] active:shadow-none hover:brightness-105 transition-all text-body text-center cursor-pointer font-din-round"
            >
              CONTINUE
            </button>
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

export default function LessonPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center font-din-round">Loading...</div>}>
      <LessonContent />
    </Suspense>
  );
}
