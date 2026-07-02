"use client";

import React, { useState, Suspense, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { ProgressBar } from "@/components/ui/ProgressBar";
import { QuizFooter } from "@/components/ui/QuizFooter";
// Data fetched via API to improve client bundle performance
import Image from "next/image";

type QuizStatus = "none" | "selected" | "correct" | "wrong" | "completed";

function LessonContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const testId = searchParams.get("testId") || "abstract_reasoning_test1";
  
  const [questions, setQuestions] = useState<any[]>([]);
  const [testExamples, setTestExamples] = useState<any[]>([]);
  const [loadingData, setLoadingData] = useState(true);

  const [phase, setPhase] = useState<"examples" | "quiz" | "completed">("quiz");
  const [currentExampleIndex, setCurrentExampleIndex] = useState(0);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [status, setStatus] = useState<QuizStatus>("none");
  const [timeLeft, setTimeLeft] = useState<number>(300);
  const [correctAnswers, setCorrectAnswers] = useState(0);
  const [showHowToAnswer, setShowHowToAnswer] = useState(true);
  const [isLoaded, setIsLoaded] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showExitModal, setShowExitModal] = useState(false);

  const keyBufferRef = React.useRef<string>("");
  const keyTimeoutRef = React.useRef<ReturnType<typeof setTimeout> | null>(null);
  const scoreSavedRef = React.useRef<boolean>(false);

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
        setQuestions(loadedQuestions);
        setTestExamples(loadedExamples);

        const savedState = localStorage.getItem(`quiz_state_${testId}`);
        if (savedState) {
          try {
            const parsed = JSON.parse(savedState);
            setPhase(parsed.phase || (loadedExamples.length > 0 && !parsed.phase ? "examples" : "quiz"));
            setCurrentExampleIndex(parsed.currentExampleIndex || 0);
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
            if (parsed.showHowToAnswer !== undefined) {
              setShowHowToAnswer(parsed.showHowToAnswer);
            }
          } catch (e) {
            console.error("Failed to parse saved quiz state", e);
          }
        } else {
          setPhase(loadedExamples.length > 0 ? "examples" : "quiz");
          const savedDuration = localStorage.getItem("timer_duration");
          setTimeLeft((savedDuration ? parseInt(savedDuration, 10) : 5) * 60);
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
  }, [testId]);

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
        showHowToAnswer
      }));
    }
  }, [phase, currentExampleIndex, currentIndex, selectedOption, status, timeLeft, correctAnswers, showHowToAnswer, isLoaded, testId]);

  // Timer logic
  // Timer logic
  useEffect(() => {
    if (!isLoaded || status === "completed" || phase !== "quiz") return;
    
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
  }, [isLoaded, status]);

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
    }
  }, [status, correctAnswers, questions.length, testId]);

  const question = questions[currentIndex];
  const progress = (currentIndex / questions.length) * 100;

  // Keyboard Shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ignore if user is typing in an input
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
      
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
          } else {
            setStatus("wrong");
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
  }, [status, selectedOption, currentIndex, question, correctAnswers, testId, questions.length]);

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
    } else {
      setStatus("wrong");
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
    localStorage.removeItem(`quiz_state_${testId}`);
    setPhase(testExamples.length > 0 ? "examples" : "quiz");
    setCurrentExampleIndex(0);
    setCurrentIndex(0);
    setSelectedOption(null);
    setStatus("none");
    setCorrectAnswers(0);
    scoreSavedRef.current = false;
    const savedDuration = localStorage.getItem("timer_duration");
    setTimeLeft((savedDuration ? parseInt(savedDuration, 10) : 5) * 60);
  };

  if (error) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-white font-din-round text-almost-black px-6 text-center">
        <div className="w-48 h-48 relative mb-4">
          <Image src="/emoji/wahhh.png" alt="Error face" fill className="object-contain drop-shadow-lg mx-auto" />
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
    if (!example) return null;
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
          <h2 className="font-feather text-[20px] md:text-[28px] text-charcoal mb-4 leading-snug">
            {example.prompt}
          </h2>
          <div className="bg-sky-blue/10 rounded-2xl p-6 border-2 border-sky-blue/20">
            <p className="text-sky-blue font-bold mb-2 uppercase text-sm tracking-wider">Solution / Explanation</p>
            <div className="text-[17px] text-almost-black whitespace-pre-wrap leading-relaxed">
              {example.explanation}
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
      </div>
    );
  }

  if (status === "completed" || phase === "completed") {
    const isPerfect = correctAnswers === questions.length;
    const isTimeUp = timeLeft === 0;
    const percentage = (correctAnswers / questions.length) * 100;
    
    let emojiSrc = "/emoji/naysu.png";
    if (percentage === 100) {
      emojiSrc = "/emoji/awow.png";
    } else if (percentage >= 80) {
      emojiSrc = "/emoji/naysu.png";
    } else if (percentage >= 50) {
      emojiSrc = "/emoji/hmm.png";
    } else {
      emojiSrc = "/emoji/wahhh.png";
    }
    
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-white font-din-round text-almost-black px-6 text-center">
        <div className="w-48 h-48 md:w-56 md:h-56 relative mb-4">
          <Image src={emojiSrc} alt="Score reaction" fill className="object-contain drop-shadow-lg" />
        </div>
        
        <h1 className={`font-feather text-4xl mb-4 ${isTimeUp ? "text-[#ea2b2b]" : "text-duo-green"}`}>
          {isTimeUp ? "Time's Up!" : "Lesson Complete!"}
        </h1>
        
        <div className="bg-cloud-gray/20 rounded-2xl p-6 mb-8 w-full max-w-sm">
          <p className="text-graphite font-bold text-lg mb-2">Your Score</p>
          <p className={`text-5xl font-feather ${isPerfect ? "text-duo-green" : "text-sky-blue"}`}>
            {correctAnswers} <span className="text-3xl text-graphite/50">/ {questions.length}</span>
          </p>
        </div>
        
        <p className="text-[17px] text-graphite mb-8 max-w-md">
          {isPerfect 
            ? "Perfect score! You've successfully finished this practice set and unlocked the next one." 
            : "Great effort! However, you need a perfect score to unlock the next test."}
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

          <div className={`flex items-center gap-1.5 font-bold shrink-0 bg-cloud-gray/20 px-3 py-1.5 rounded-xl border-2 border-cloud-gray/40 transition-colors ${timeLeft < 60 ? 'text-[#ea2b2b] animate-pulse border-[#ea2b2b]/40 bg-[#ea2b2b]/10' : 'text-graphite'}`}>
            <span className="text-lg">⏱️</span>
            <span className="text-[17px] font-mono">
              {Math.floor(timeLeft / 60)}:{(timeLeft % 60).toString().padStart(2, '0')}
            </span>
          </div>
        </div>
      </header>

      {/* Main Quiz Area */}
      <main className="grow flex flex-col max-w-[800px] w-full mx-auto px-4 md:px-6 py-4 md:py-6">
        <h2 className="font-feather text-[20px] md:text-[28px] text-charcoal mb-4 leading-snug">
          {question.prompt}
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
                className={`p-2 md:p-4 rounded-2xl border-2 flex items-center justify-center transition-all duration-150 relative ${cardClass}`}
              >
                <div className="hidden md:flex absolute left-4 w-7 h-7 bg-cloud-gray/20 rounded-md items-center justify-center text-graphite text-xs font-bold border-b-2 border-cloud-gray/40">
                  {idx + 1}
                </div>
                <span className={`font-bold text-base md:text-xl w-full text-center ${textClass}`}>
                  {opt}
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
          <div className="bg-white border-2 border-cloud-gray border-b-8 rounded-[28px] w-full max-w-[480px] p-6 md:p-8 flex flex-col gap-6 shadow-none animate-[scaleIn_0.2s_ease-out] relative">
            
            {/* Mascot & Dialogue */}
            <div className="flex flex-col items-center text-center gap-4">
              <div className="w-[84px] h-[84px] relative shrink-0">
                <Image 
                  src="/emoji/wahhh.png" 
                  alt="Sad Mascot" 
                  fill 
                  className="object-contain drop-shadow-md"
                  unoptimized
                />
              </div>
              <div className="flex flex-col gap-2 font-din-round">
                <h3 className="font-feather text-2xl text-charcoal font-bold leading-tight">
                  Wait, don't go!
                </h3>
                <p className="text-graphite text-body leading-relaxed">
                  You're in the middle of a test. If you quit now, you will lose your progress on this attempt!
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
                className="w-full sm:flex-1 bg-white text-[#ea2b2b] border-2 border-cloud-gray font-bold py-3 rounded-xl shadow-[0_4px_0_var(--color-cloud-gray)] active:translate-y-[4px] active:shadow-none hover:bg-[#ea2b2b]/5 transition-all text-body text-center cursor-pointer font-din-round border-b-4"
              >
                QUIT TEST
              </button>
              <button
                onClick={() => setShowExitModal(false)}
                className="w-full sm:flex-1 bg-duo-green text-white font-bold py-3 rounded-xl shadow-[0_4px_0_#3f8f01] active:translate-y-[4px] active:shadow-none hover:brightness-105 transition-all text-body text-center cursor-pointer font-din-round border-b-4"
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

export default function LessonPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center font-din-round">Loading...</div>}>
      <LessonContent />
    </Suspense>
  );
}
