"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { supabase } from "@/lib/supabase";
import { useUser } from "@clerk/nextjs";
import RightSidebar from "@/components/ui/RightSidebar";
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
}

export default function DashboardPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const { user, isLoaded, isSignedIn } = useUser();

  const [scores, setScores] = useState<Record<string, {score: number, total: number, previousBest?: number, lastScore?: number, attempts?: number}>>({});
  const [unlockAll, setUnlockAll] = useState(false);
  const [testCount, setTestCount] = useState<number>(0);

  const [selectedTestForTimer, setSelectedTestForTimer] = useState<{ testId: string; testTitle: string } | null>(null);
  const [modalTimerDuration, setModalTimerDuration] = useState<number>(5);
  const [savingTimer, setSavingTimer] = useState(false);

  useEffect(() => {
    async function loadData() {
      if (!isLoaded) return;
      
      try {
        const pendingPrefs = localStorage.getItem("onboarding_prefs");
        let activeProfile: any = null;

        if (!isSignedIn || !user) {
          if (pendingPrefs) {
            const prefs = JSON.parse(pendingPrefs);
            activeProfile = {
              id: "guest",
              email: "",
              exam_category: prefs.category,
              sub_topic: prefs.subTopic,
              study_style: prefs.studyStyle,
              difficulty: prefs.difficulty,
              total_score: 0,
              streak: 0
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
          // Check for pending onboarding preferences from pre-signup flow
          if (pendingPrefs) {
            try {
              const prefs = JSON.parse(pendingPrefs);
              await supabase.from("profiles").upsert({
                id: user.id,
                exam_category: prefs.category,
                sub_topic: prefs.subTopic,
                study_style: prefs.studyStyle,
                difficulty: prefs.difficulty,
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

          activeProfile = userProfile;
          setProfile(userProfile);
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
      setScores(loadedScores);
    }
  }, [profile, testCount]);

  const handleTopicClick = (topicName: string, testId?: string) => {
    if (testId) {
      setSelectedTestForTimer({ testId, testTitle: topicName });
      const saved = localStorage.getItem("timer_duration");
      setModalTimerDuration(saved ? parseInt(saved, 10) : 5);
    } else {
      router.push("/lesson");
    }
  };

  const startTestWithTimer = async () => {
    if (!selectedTestForTimer) return;
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
    
    // Clear in-progress saved state so they start fresh with the new timer
    localStorage.removeItem(`quiz_state_${selectedTestForTimer.testId}`);
    
    router.push(`/lesson?testId=${selectedTestForTimer.testId}`);
    setSelectedTestForTimer(null);
    setSavingTimer(false);
  };

  if (loading) {
    return (
      <>
        <main className="flex-1 w-full max-w-[600px] mx-auto pb-24">
          <div className="flex h-[50vh] items-center justify-center font-din-round">
            <div className="flex flex-col items-center gap-4">
              <div className="h-12 w-12 animate-spin rounded-full border-4 border-cloud-gray border-t-duo-green"></div>
              <p className="text-graphite font-bold">Loading path...</p>
            </div>
          </div>
        </main>
        <aside className="hidden lg:block w-[368px] shrink-0">
          <RightSidebar />
        </aside>
      </>
    );
  }

  // Determine active index based on scores
  const rawSubTopic = profile?.sub_topic || "General Review";
  const fullTopic = rawSubTopic;
  const topicName = fullTopic.split(" > ").pop() || fullTopic;
  const formattedTopic = topicName.toLowerCase().replace(/[^a-z0-9]+/g, '_');
  
  let activeIndex = 0;
  for (let i = 1; i <= testCount; i++) {
    const tId = `${formattedTopic}_test${i}`;
    if (scores[tId] && scores[tId].score === scores[tId].total) {
      activeIndex = i; // Move active to the next test ONLY if perfect
    } else {
      break; // Found an uncompleted or imperfect test
    }
  }
  if (activeIndex >= testCount) activeIndex = testCount - 1; // Cap at the last test if all are completed

  return (
    <>
      <main className="flex-1 w-full max-w-[600px] mx-auto pb-24">
        <div className="flex flex-col gap-6 pt-2 items-center w-full">
          {/* Section Header */}
          <div className="w-full bg-duo-green rounded-2xl p-4 md:p-5 flex items-center justify-between shadow-[0_4px_0_#3f8f01]">
            <div className="flex flex-col text-white">
              <div className="flex items-center gap-2 mb-1">
                <span onClick={() => router.push("/onboarding")} className="text-xl font-bold cursor-pointer hover:opacity-80 transition-opacity">←</span>
                <span className="font-bold text-sm md:text-body tracking-widest uppercase">
                  Section 1, Unit 1
                </span>
              </div>
              <h2 className="font-feather text-xl md:text-2xl font-bold tracking-wide">
                {profile?.exam_category} {fullTopic ? `- ${fullTopic}` : "- Fundamentals"}
              </h2>
            </div>
            <button className="flex items-center w-35 justify-center gap-2 bg-white/20 hover:bg-white/30 text-white font-bold px-4 py-2.5 rounded-2xl transition-colors shadow-[0_2px_0_rgba(255,255,255,0.2)]">
              <Image src="/emoji/guidebook.png" alt="Guidebook" width={24} height={24} className="brightness-0 invert w-auto h-auto" />
              <span className="hidden sm:inline text-sm">GUIDEBOOK</span>
            </button>
          </div>

          {/* Developer Toggle */}
          <div className="flex justify-end w-full px-4 md:px-0">
            <label className="flex items-center cursor-pointer gap-3 opacity-70 hover:opacity-100 transition-opacity">
              <span className="text-silver font-bold text-xs uppercase tracking-wide">Unlock All</span>
              <div className="relative">
                <input type="checkbox" className="sr-only" checked={unlockAll} onChange={() => setUnlockAll(!unlockAll)} />
                <div className={`block w-10 h-6 rounded-full transition-colors ${unlockAll ? 'bg-duo-green' : 'bg-[#29353c]'}`}></div>
                <div className={`absolute left-1 top-1 bg-white w-4 h-4 rounded-full transition-transform ${unlockAll ? 'transform translate-x-4' : ''}`}></div>
              </div>
            </label>
          </div>

          {/* Topic Cards */}
          <div className="flex flex-col w-full gap-4 md:gap-5 pb-24 px-4 md:px-0">
            {Array.from({ length: testCount }, (_, i) => i + 1).map((testNum, index) => {
              const isActive = index === activeIndex;
              const isLocked = !unlockAll && index > activeIndex;
              
              let testTitle = `${topicName} - Test ${testNum}`;
              if (formattedTopic === "quantitative_reasoning") {
                if (testNum === 1) testTitle = "Chapter 1: HCF and LCM";
                else if (testNum === 2) testTitle = "Chapter 2: Permutation and Combination";
                else if (testNum === 3) testTitle = "Chapter 3: Probability";
                else if (testNum === 4) testTitle = "Chapter 4: Ratio and Proportion";
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
                badgeContent = <Image src="/emoji/star.png" alt="Start" width={22} height={22} className="object-contain drop-shadow-md" unoptimized />;
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
                      <Image src="/emoji/awow.png" alt="Mascot" fill className="object-contain drop-shadow-lg" sizes="(max-width: 768px) 100vw, 50vw" />
                    </div>
                  )}
                  
                  <button
                    onClick={() => !isLocked && handleTopicClick(testTitle, testId)}
                    className={`relative z-10 w-full flex items-center justify-between p-5 md:p-6 rounded-2xl transition-all duration-200 text-left ${cardClass}`}
                  >
                    <div className="flex flex-col gap-1.5 font-din-round">
                      <h3 className={`font-feather text-lg md:text-xl font-bold tracking-wide ${titleClass}`}>
                        {testTitle}
                      </h3>
                      <div className={`text-sm ${subtitleClass}`}>
                        {scoreData ? (
                          <div className="flex flex-col gap-1 mt-1">
                            <span>Highest Score: {scoreData.score}/{scoreData.total}</span>
                            {scoreData.attempts ? (
                              <span className="text-xs opacity-80 normal-case tracking-normal">
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
            })}

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
                    <Image src="/emoji/quest.png" alt="Reward Chest" width={24} height={24} className="grayscale opacity-50 w-auto h-auto" unoptimized />
                  </div>
                </div>
              </button>
            </div>
            {/* Reset Progress Button */}
            <div className="w-full mt-8 flex justify-center">
              <button 
                onClick={() => {
                  if (window.confirm("Are you sure you want to reset all your progress? This cannot be undone.")) {
                    const keysToRemove = [];
                    for (let i = 0; i < localStorage.length; i++) {
                      const key = localStorage.key(i);
                      if (key && (key.startsWith("quiz_score_") || key.startsWith("quiz_state_"))) {
                        keysToRemove.push(key);
                      }
                    }
                    keysToRemove.forEach(key => localStorage.removeItem(key));
                    window.location.reload();
                  }
                }}
                className="text-graphite/50 hover:text-[#ea2b2b] font-bold text-sm underline transition-colors"
              >
                Reset All Progress
              </button>
            </div>
          </div>
        </div>
      </main>
      
      <aside className="hidden lg:block w-[368px] shrink-0">
        <RightSidebar />
      </aside>

      {selectedTestForTimer && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-[2px] flex items-center justify-center z-50 p-4 animate-[fadeIn_0.2s_ease-out]">
          <div className="bg-snow-white border-2 border-cloud-gray border-b-8 rounded-[28px] w-full max-w-[520px] p-6 md:p-8 flex flex-col gap-6 shadow-none animate-[scaleIn_0.2s_ease-out] relative">
            
            {/* Mascot & Speech Bubble */}
            <div className="flex gap-4 items-center mb-2">
              <div className="w-[72px] h-[72px] relative shrink-0">
                <Image 
                  src="/emoji/suspicious.png" 
                  alt="Thinking Mascot" 
                  fill 
                  className="object-contain drop-shadow-md"
                  unoptimized
                />
              </div>
              <div className="grow relative bg-snow-white border-2 border-cloud-gray rounded-2xl p-4 before:content-[''] before:absolute before:left-[-10px] before:top-[50%] before:-translate-y-[50%] before:border-y-8 before:border-y-transparent before:border-r-8 before:border-r-cloud-gray after:content-[''] after:absolute after:-left-[8px] after:top-[50%] after:-translate-y-[50%] after:border-y-8 after:border-y-transparent after:border-r-8 after:border-r-snow-white">
                <h3 className="font-feather text-[18px] md:text-[20px] text-charcoal font-bold leading-tight uppercase tracking-wide">
                  {selectedTestForTimer.testTitle}
                </h3>
                <p className="text-graphite text-xs md:text-sm font-din-round mt-1 leading-snug">
                  How long do you want to give yourself for this test session?
                </p>
              </div>
            </div>

            {/* Timer Options List */}
            <div className="flex flex-col gap-4">
              {[5, 10, 15, 30, 60].map((mins) => (
                <div
                  key={mins}
                  onClick={() => setModalTimerDuration(mins)}
                  className={`flex items-center justify-between p-4 rounded-xl border-2 cursor-pointer transition-all duration-150 select-none active:translate-y-[4px] active:shadow-none ${
                    modalTimerDuration === mins
                      ? "border-sky-blue bg-sky-blue/15 shadow-[0_4px_0_#189edc] text-sky-blue"
                      : "border-cloud-gray bg-snow-white shadow-[0_4px_0_var(--color-cloud-gray)] hover:bg-cloud-gray/20 text-almost-black"
                  }`}
                >
                  <div className="flex flex-col font-din-round">
                    <span className="font-bold text-body tracking-wide">
                      {mins === 60 ? "1 Hour" : `${mins} Minutes`}
                    </span>
                    <span className="text-xs text-graphite font-medium opacity-80 mt-0.5">
                      {mins === 5 ? "Quick practice" : mins === 10 ? "Standard session" : mins === 15 ? "Deep focus" : mins === 30 ? "Extended challenge" : "Full simulated exam"}
                    </span>
                  </div>
                  {modalTimerDuration === mins && (
                    <span className="text-sky-blue font-bold text-xl">✓</span>
                  )}
                </div>
              ))}
            </div>

            {/* Modal Actions */}
            <div className="flex items-center gap-4 mt-2">
              <button
                onClick={() => setSelectedTestForTimer(null)}
                className="flex-1 bg-snow-white text-sky-blue border-2 border-cloud-gray font-bold py-3 rounded-xl shadow-[0_4px_0_var(--color-cloud-gray)] active:translate-y-[4px] active:shadow-none hover:bg-cloud-gray/20 transition-all text-body text-center cursor-pointer font-din-round"
              >
                CANCEL
              </button>
              <button
                onClick={startTestWithTimer}
                disabled={savingTimer}
                className="flex-1 bg-duo-green text-white font-bold py-3 rounded-xl shadow-[0_4px_0_#3f8f01] active:translate-y-[4px] active:shadow-none hover:brightness-105 transition-all text-body text-center cursor-pointer font-din-round"
              >
                {savingTimer ? "STARTING..." : "START TEST"}
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
    </>
  );
}
