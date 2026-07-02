"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { Button } from "@/components/ui/Button";
import { ProgressBar } from "@/components/ui/ProgressBar";
import { useUser } from "@clerk/nextjs";
import { supabase } from "@/lib/supabase";
interface StepOption {
  id: string;
  label: string;
  description?: string;
}

export default function OnboardingPage() {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [checkingSession, setCheckingSession] = useState(true);
  const [userId, setUserId] = useState<string | null>(null);

  // Form State
  const [category, setCategory] = useState<string>("");
  const [topicPath, setTopicPath] = useState<string[]>([]);
  const [subTopic, setSubTopic] = useState<string>("");
  const [timerDuration, setTimerDuration] = useState<number>(5);

  // Options
  const categories: StepOption[] = [
    { id: "Civil Service", label: "Civil Service", description: "Professional & Subprofessional levels" },
    { id: "NAPOLCOM", label: "NAPOLCOM", description: "National Police Commission Exam" },
    { id: "AFP", label: "AFP (AFPSAT)", description: "Armed Forces Aptitude Test" },
    { id: "CET", label: "CET", description: "College Entrance Exams" },
    { id: "LET", label: "LET", description: "Licensure Exam for Teachers" },
    { id: "Others", label: "Others", description: "General Aptitude and IQ tests" },
  ];

  type TopicTree = { [key: string]: TopicTree | null };

  const fileTree: Record<string, TopicTree> = {
    "AFP": {
      "Reasoning Files": {
        "Abstract Reasoning": null,
        "Logical Reasoning": null,
        "Numerical Reasoning": null,
        "Quantitative Reasoning": null,
        "Verbal Reasoning": null
      }
    },
    "CET": {
      "ACET": null,
      "DCAT": null,
      "DOST REVIEWER": null,
      "ENGLISH": {
        "Essay": null,
        "Grammar": null,
        "Reading Comprehension": null,
        "Vocabulary": null
      },
      "FILIPINO": null,
      "GENERAL INFORMATION": null,
      "MATHEMATICS": null,
      "PUPCET": null,
      "SCIENCE": {
        "BIOLOGY": null,
        "CHEMISTRY": null,
        "EARTH SCIENCE": null,
        "PHYSICS": null
      },
      "UPCAT": {
        "ALL SUBJECT": null
      },
      "USTET": null
    },
    "Civil Service": {
      "Masterclass Reviewers": {
        "Abstract Reasoning": null,
        "English, Grammar and related": null,
        "Environmental Protection and Management": null,
        "Labor Code": null,
        "Numerical Reasoning": null,
        "Test Drills with Answers": {
          "1 Taker Drill": null,
          "5-Part CSE Drill": null,
          "More Drills": null,
          "PDF": null
        },
        "Tips": null
      },
      "Practice Tests": null,
      "Forms & Printables": null,
      "Compilations (2017-2022)": {
        "2017": null,
        "2018": null,
        "2019": null,
        "2020": null,
        "2022": {
          "free": null
        }
      },
      "Current Events": null,
      "Additional Reviewers": {
        "Civil Service Exam Reviewers (2017-2020)": null
      },
      "Ebooks": null
    },
    "NAPOLCOM": {
      "General Information": null,
      "Reasoning Files": {
        "Abstract Reasoning": null,
        "Logical Reasoning": null,
        "Numerical Reasoning": null,
        "Quantitative Reasoning": null,
        "Verbal Reasoning": null
      }
    },
    "LET": {
      "General Review": null
    },
    "Others": {
      "General Review": null
    }
  };

  const { user, isLoaded, isSignedIn } = useUser();

  // Session Check
  useEffect(() => {
    async function checkSession() {
      if (!isLoaded) return;
      
      if (!isSignedIn || !user) {
        setCheckingSession(false);
        return;
      }

      setUserId(user.id);
      
      const { data: profile } = await supabase
        .from("profiles")
        .select("exam_category")
        .eq("id", user.id)
        .single();

      // Let user do onboarding again if they manually navigate here
      setCheckingSession(false);
    }
    checkSession();
  }, [router, user, isLoaded, isSignedIn]);

  const handleNext = () => {
    if (currentStep === 1) {
      // Initialize topic path
      setTopicPath([]);
      setSubTopic("");
      
      // Auto-select subTopic if there is only 1 leaf node and no children
      const rootOptions = fileTree[category] || fileTree["Others"];
      const keys = Object.keys(rootOptions);
      if (keys.length === 1 && rootOptions[keys[0]] === null) {
        setSubTopic(keys[0]);
      }
    }

    if (currentStep < 3) {
      setCurrentStep(currentStep + 1);
    } else {
      submitOnboarding();
    }
  };

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const submitOnboarding = async () => {
    setLoading(true);

    if (isSignedIn && userId) {
      try {
        const { error } = await supabase
          .from("profiles")
          .upsert({
            id: userId,
            exam_category: category,
            sub_topic: subTopic,
            timer_duration: timerDuration,
          });

        if (error) {
          console.error("Error updating profile during onboarding", error);
          alert("Failed to save preferences. Please try again.");
          setLoading(false);
          return;
        }

        localStorage.setItem("timer_duration", timerDuration.toString());
        router.push("/dashboard");
      } catch (err) {
        console.error(err);
        setLoading(false);
      }
    } else {
      localStorage.setItem("timer_duration", timerDuration.toString());
      localStorage.setItem("onboarding_prefs", JSON.stringify({
        category,
        subTopic,
        timerDuration
      }));
      router.push("/dashboard");
    }
  };

  const getStepProgress = () => {
    return (currentStep / 3) * 100;
  };

  const getStepQuestion = () => {
    switch (currentStep) {
      case 1:
        return "What exam are you currently reviewing for?";
      case 2:
        return "What specific topic do you want to start with?";
      case 3:
        return "How long do you want your test timer to be?";
      default:
        return "";
    }
  };

  const isContinueDisabled = () => {
    if (currentStep === 1 && !category) return true;
    if (currentStep === 2 && !subTopic) return true;
    if (currentStep === 3 && !timerDuration) return true;
    return false;
  };

  const renderTopicSelection = () => {
    const rootOptions = fileTree[category] || fileTree["Others"];
    let currentNode: TopicTree | null = rootOptions;
    
    // Traverse to current path
    for (const p of topicPath) {
      if (currentNode && currentNode[p]) {
        currentNode = currentNode[p];
      } else {
        currentNode = null;
      }
    }

    if (!currentNode) return null;

    const keys = Object.keys(currentNode);

    return (
      <div className="flex flex-col gap-4 animate-[slideIn_0.3s_ease-out]">
        {topicPath.length > 0 && (
          <button 
            onClick={() => {
              setTopicPath(topicPath.slice(0, -1));
              setSubTopic("");
            }} 
            className="self-start text-sky-blue font-bold mb-2 flex items-center gap-1 hover:opacity-80"
          >
            ← Back to {topicPath.length === 1 ? category : topicPath[topicPath.length - 2]}
          </button>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {keys.map((topic) => {
            const isLeaf = currentNode![topic] === null;
            const fullPath = [...topicPath, topic].join(" > ");
            const isSelected = subTopic === fullPath;

            return (
              <div
                key={topic}
                onClick={() => {
                  if (isLeaf) {
                    setSubTopic(fullPath);
                  } else {
                    setTopicPath([...topicPath, topic]);
                    setSubTopic("");
                  }
                }}
                className={`flex items-center justify-between p-4 rounded-2xl border-2 cursor-pointer transition-all duration-150 active:translate-y-0.5 select-none ${
                  isSelected
                    ? "border-sky-blue bg-[#ddf4ff] shadow-[0_4px_0_#189edc] text-sky-blue"
                    : "border-cloud-gray hover:bg-gray-50 shadow-[0_4px_0_var(--color-cloud-gray)]"
                }`}
              >
                <div className="flex flex-col pr-4">
                  <span className="font-bold text-[16px]">{topic}</span>
                  {!isLeaf && (
                    <span className="text-xs text-graphite mt-0.5 font-medium leading-tight">
                      Contains subfolders
                    </span>
                  )}
                </div>
                {!isLeaf && (
                  <span className="text-silver font-bold text-xl shrink-0">→</span>
                )}
                {isSelected && (
                  <span className="text-sky-blue font-bold text-xl shrink-0">✓</span>
                )}
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  if (checkingSession) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-white font-din-round">
        <div className="flex flex-col items-center gap-4">
          <div className="h-12 w-12 animate-spin rounded-full border-4 border-cloud-gray border-t-duo-green"></div>
          <p className="text-graphite font-bold">Verifying details...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-white font-din-round text-almost-black">
      {/* Top Navbar with Progress Bar */}
      <header className="sticky top-0 bg-white border-b-2 border-cloud-gray py-4 px-6 z-30">
        <div className="max-w-[800px] mx-auto flex items-center gap-4">
          {currentStep > 1 ? (
            <button
              onClick={handleBack}
              className="text-silver hover:text-charcoal font-bold text-lg p-2 transition-colors cursor-pointer"
            >
              ←
            </button>
          ) : (
            <button
              onClick={() => router.push("/")}
              className="text-silver hover:text-charcoal font-bold text-lg p-2 transition-colors cursor-pointer"
            >
              ✕
            </button>
          )}

          <div className="grow">
            <ProgressBar progress={getStepProgress()} />
          </div>

          <span className="text-sm font-bold text-graphite shrink-0">
            Step {currentStep} of 3
          </span>
        </div>
      </header>

      {/* Onboarding Wizard Body */}
      <main className="grow flex flex-col justify-center px-6 py-12 max-w-[650px] w-full mx-auto">
        {/* Character speech bubble */}
        <div className="flex gap-4 items-center mb-8 animate-[fadeIn_0.4s_ease-out]">
          <div className="w-28 h-28 md:w-36 md:h-36 rounded-full overflow-hidden border-2 border-cloud-gray relative bg-duo-green-light shrink-0">
            <Image 
              src="/emoji/profile.png" 
              alt="Mascot Profile" 
              fill 
              className="object-cover scale-[1.7] translate-y-1"
              unoptimized
            />
          </div>
          <div className="relative bg-white border-2 border-cloud-gray rounded-2xl p-4 shadow-sm before:content-[''] before:absolute before:left-[-10px] before:top-[50%] before:-translate-y-[50%] before:border-y-8 before:border-y-transparent before:border-r-8 before:border-r-cloud-gray after:content-[''] after:absolute after:-left-[8px] after:top-[50%] after:-translate-y-[50%] after:border-y-8 after:border-y-transparent after:border-r-8 after:border-r-white grow">
            <h2 className="font-feather text-lg md:text-[20px] text-charcoal leading-snug font-bold">
              {getStepQuestion()}
            </h2>
          </div>
        </div>

        {/* Step Content */}
        <div className="grow">
          {currentStep === 1 && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 animate-[slideIn_0.3s_ease-out]">
              {categories.map((opt) => (
                <div
                  key={opt.id}
                  onClick={() => { setCategory(opt.id); setTopicPath([]); setSubTopic(""); }}
                  className={`flex flex-col p-5 rounded-2xl border-2 cursor-pointer transition-all duration-150 active:translate-y-0.5 select-none ${
                    category === opt.id
                      ? "border-sky-blue bg-[#ddf4ff] shadow-[0_4px_0_#189edc] text-sky-blue"
                      : "border-cloud-gray hover:bg-gray-50 shadow-[0_4px_0_var(--color-cloud-gray)]"
                  }`}
                >
                  <div className="flex flex-col font-din-round">
                    <span className="font-feather text-lg md:text-xl font-extrabold tracking-wide mb-1 uppercase text-charcoal">
                      {opt.label}
                    </span>
                    <span className="text-xs text-graphite font-medium leading-normal">
                      {opt.description}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}

          {currentStep === 2 && renderTopicSelection()}

          {currentStep === 3 && (
            <div className="flex flex-col gap-4 animate-[slideIn_0.3s_ease-out]">
              {[5, 10, 15, 30, 60].map((mins) => (
                <div
                  key={mins}
                  onClick={() => setTimerDuration(mins)}
                  className={`flex items-center justify-between p-5 rounded-2xl border-2 cursor-pointer transition-all duration-150 active:translate-y-0.5 select-none ${
                    timerDuration === mins
                      ? "border-sky-blue bg-[#ddf4ff] shadow-[0_4px_0_#189edc] text-sky-blue"
                      : "border-cloud-gray hover:bg-gray-50 shadow-[0_4px_0_var(--color-cloud-gray)]"
                  }`}
                >
                  <div className="flex flex-col">
                    <span className="font-bold text-[20px]">
                      {mins === 60 ? "1 Hour" : `${mins} Minutes`}
                    </span>
                    <span className="text-xs text-graphite mt-0.5 font-medium">
                      {mins === 5 ? "Quick practice" : mins === 10 ? "Standard session" : mins === 15 ? "Deep focus" : mins === 30 ? "Extended challenge" : "Full simulated exam"}
                    </span>
                  </div>
                  {timerDuration === mins && (
                    <span className="text-sky-blue font-bold text-2xl">✓</span>
                  )}
                </div>
              ))}
            </div>
          )}

        </div>
      </main>

      {/* Sticky Bottom Actions Bar */}
      <footer className="sticky bottom-0 bg-white border-t-2 border-cloud-gray py-6 px-6 z-20">
        <div className="max-w-[650px] mx-auto flex items-center justify-end">
          <Button
            onClick={handleNext}
            disabled={isContinueDisabled() || loading}
            variant="primary"
            className="w-full sm:w-[180px] h-[50px] text-body shadow-[0_4px_0_#3f8f01]"
          >
            {loading ? "Saving..." : currentStep === 3 ? "Complete" : "Continue"}
          </Button>
        </div>
      </footer>

      {/* Page transitions */}
      <style jsx global>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(5px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes slideIn {
          from { opacity: 0; transform: translateX(10px); }
          to { opacity: 1; transform: translateX(0); }
        }
      `}</style>
    </div>
  );
}
