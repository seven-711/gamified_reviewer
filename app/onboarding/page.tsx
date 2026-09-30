"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { Button } from "@/components/ui/Button";
import { ProgressBar } from "@/components/ui/ProgressBar";
import { useAuth } from "@/lib/auth";
import { supabase } from "@/lib/supabase";
import { upsertFullProfile } from "@/lib/session";
import { useAlert } from "@/components/ui/AlertContext";
import { RiveScreenLoader } from "@/components/ui/RiveLoader";

type EmailStatus = "idle" | "checking" | "available" | "taken" | "invalid";

interface StepOption {
  id: string;
  label: string;
  description?: string;
}

export default function OnboardingPage() {
  const { showAlert } = useAlert();
  const router = useRouter();
  const { user, isLoaded, isSignedIn } = useAuth();

  // Authentication Phase State (identical UI to app/login/page.tsx & app/signup/page.tsx)
  const [authView, setAuthView] = useState<"signup" | "login">("signup");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);
  const [authLoading, setAuthLoading] = useState(false);
  const [emailSent, setEmailSent] = useState(false);

  // Live email validation state
  const [emailStatus, setEmailStatus] = useState<EmailStatus>("idle");
  const [emailMessage, setEmailMessage] = useState("");
  const debounceRef = useRef<NodeJS.Timeout | null>(null);

  // Preference Phase State (Steps 1 to 3)
  const [currentStep, setCurrentStep] = useState(1);
  const [prefLoading, setPrefLoading] = useState(false);
  const [checkingSession, setCheckingSession] = useState(true);
  const [activeUserId, setActiveUserId] = useState<string | null>(null);

  // Form State - Preferences
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

  // Session Check
  useEffect(() => {
    async function checkSession() {
      if (!isLoaded) return;
      
      if (!isSignedIn || !user) {
        setCheckingSession(false);
        return;
      }

      setActiveUserId(user.id);
      
      const { data: settings } = await supabase
        .from("profile_study_settings")
        .select("exam_category")
        .eq("profile_id", user.id)
        .maybeSingle();

      const isEditing = typeof window !== "undefined" && window.location.search.includes("edit=true");
      if (settings && settings.exam_category && !isEditing) {
        router.replace("/dashboard");
        return;
      }
      
      setCheckingSession(false);
    }
    checkSession();
  }, [router, user, isLoaded, isSignedIn]);

  /** Validate email format client-side */
  const isValidEmail = (val: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val.trim());

  /** Debounced check for duplicate email via Supabase RPC */
  const checkEmailExists = useCallback(async (emailToCheck: string) => {
    const trimmed = emailToCheck.trim().toLowerCase();

    if (!trimmed || !isValidEmail(trimmed)) {
      if (trimmed.length > 0) {
        setEmailStatus("invalid");
        setEmailMessage("Please enter a valid email address.");
      } else {
        setEmailStatus("idle");
        setEmailMessage("");
      }
      return;
    }

    setEmailStatus("checking");
    setEmailMessage("Checking availability\u2026");

    try {
      const { data, error } = await supabase.rpc("check_email_exists", {
        email_input: trimmed,
      });

      if (error) {
        console.error("check_email_exists RPC error:", error.message);
        setEmailStatus("idle");
        setEmailMessage("");
        return;
      }

      if (data === true) {
        setEmailStatus("taken");
        setEmailMessage("An account with this email already exists.");
      } else {
        setEmailStatus("available");
        setEmailMessage("Email is available!");
      }
    } catch {
      setEmailStatus("idle");
      setEmailMessage("");
    }
  }, []);

  /** Debounce email input — wait 600ms after the user stops typing */
  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);

    if (!email.trim()) {
      setEmailStatus("idle");
      setEmailMessage("");
      return;
    }

    if (email.trim().length > 0 && !isValidEmail(email)) {
      if (email.includes("@") && email.split("@")[1]?.length > 0) {
        setEmailStatus("invalid");
        setEmailMessage("Please enter a valid email address.");
      } else {
        setEmailStatus("idle");
        setEmailMessage("");
      }
      return;
    }

    debounceRef.current = setTimeout(() => {
      checkEmailExists(email);
    }, 600);

    return () => { if (debounceRef.current) clearTimeout(debounceRef.current); };
  }, [email, checkEmailExists]);



  /** Email input border color based on validation status */
  const emailBorderClass = (() => {
    switch (emailStatus) {
      case "checking": return "border-[#f5a623]";
      case "available": return "border-[#58cc02]";
      case "taken": case "invalid": return "border-[#ff4b4b]";
      default: return "border-[#2e4057]";
    }
  })();

  const emailMessageColor = (() => {
    switch (emailStatus) {
      case "checking": return "text-[#f5a623]";
      case "available": return "text-[#58cc02]";
      case "taken": case "invalid": return "text-[#ff4b4b]";
      default: return "text-[#6b7f94]";
    }
  })();

  const emailStatusIcon = (() => {
    switch (emailStatus) {
      case "checking":
        return (
          <svg className="animate-spin h-4 w-4 text-[#f5a623]" viewBox="0 0 24 24" fill="none">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
          </svg>
        );
      case "available":
        return (
          <svg className="h-4 w-4 text-[#58cc02]" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
          </svg>
        );
      case "taken": case "invalid":
        return (
          <svg className="h-4 w-4 text-[#ff4b4b]" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
          </svg>
        );
      default: return null;
    }
  })();

  // Handle Signup (Same logic as app/signup/page.tsx)
  async function handleSignup(e: React.FormEvent) {
    e.preventDefault();
    setAuthError(null);

    // Block submission if email is already taken
    if (emailStatus === "taken") {
      setAuthError(null);
      return;
    }

    // Block submission if email format is invalid
    if (emailStatus === "invalid") {
      setAuthError("Please enter a valid email address.");
      return;
    }

    if (password !== confirmPassword) {
      setAuthError("Passwords do not match.");
      return;
    }
    if (password.length < 6) {
      setAuthError("Password must be at least 6 characters.");
      return;
    }

    setAuthLoading(true);
    try {
      const { data, error: signUpError } = await supabase.auth.signUp({
        email: email.trim(),
        password,
        options: {
          data: { full_name: name.trim() },
        },
      });

      if (signUpError) {
        // Check if the error indicates user already exists
        if (
          signUpError.message.toLowerCase().includes("user already registered") ||
          signUpError.message.toLowerCase().includes("already been registered")
        ) {
          setEmailStatus("taken");
          setEmailMessage("An account with this email already exists.");
          setAuthError(null);
          setAuthLoading(false);
          return;
        }

        // If rate limit error occurs, attempt direct sign-in in case the user already exists
        if (signUpError.message.toLowerCase().includes("rate limit") || signUpError.message.toLowerCase().includes("over_email_send_rate_limit")) {
          const { data: loginData } = await supabase.auth.signInWithPassword({
            email: email.trim(),
            password,
          });

          if (loginData?.session && loginData?.user) {
            await upsertFullProfile({
              id: loginData.user.id,
              name: `${name.trim()}|/emoji/profile.webp`,
            });
            setActiveUserId(loginData.user.id);
            setAuthLoading(false);
            return;
          }

          setAuthError("Supabase email rate limit reached. If you already registered, please click LOG IN at the top right.");
          setAuthLoading(false);
          return;
        }

        setAuthError(signUpError.message);
        setAuthLoading(false);
        return;
      }

      // Detect existing account: Supabase returns an empty identities array
      if (
        data.user &&
        Array.isArray(data.user.identities) &&
        data.user.identities.length === 0
      ) {
        setEmailStatus("taken");
        setEmailMessage("An account with this email already exists.");
        setAuthError(null);
        setAuthLoading(false);
        return;
      }

      let activeSession = data.session;
      let activeUser = data.user;

      // If session is null (e.g. Supabase email confirmations enabled), attempt instant login
      if (!activeSession) {
        const { data: loginData } = await supabase.auth.signInWithPassword({
          email: email.trim(),
          password,
        });
        if (loginData?.session) {
          activeSession = loginData.session;
          activeUser = loginData.user;
        }
      }

      if (activeSession && activeUser) {
        // Active session established - initialize profile and advance to test preferences
        await upsertFullProfile({
          id: activeUser.id,
          name: `${name.trim()}|/emoji/profile.webp`,
        });
        setActiveUserId(activeUser.id);
      } else {
        // Email confirmation is required by Supabase project settings
        if (activeUser) {
          try {
            await upsertFullProfile({
              id: activeUser.id,
              name: `${name.trim()}|/emoji/profile.webp`,
            });
          } catch {}
        }
        setEmailSent(true);
      }
    } catch {
      setAuthError("An unexpected error occurred. Please try again.");
    } finally {
      setAuthLoading(false);
    }
  }

  // Handle Login (Same logic as app/login/page.tsx)
  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setAuthError(null);
    setAuthLoading(true);

    try {
      const { data, error: loginError } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      });

      if (loginError) {
        setAuthError(loginError.message);
        setAuthLoading(false);
        return;
      }

      if (data?.user) {
        setActiveUserId(data.user.id);

        // Check if user already has study settings configured
        const { data: settings } = await supabase
          .from("profile_study_settings")
          .select("exam_category")
          .eq("profile_id", data.user.id)
          .maybeSingle();

        const isEditing = typeof window !== "undefined" && window.location.search.includes("edit=true");
        if (settings && settings.exam_category && !isEditing) {
          router.push("/dashboard");
          return;
        }
      }
    } catch {
      setAuthError("An unexpected error occurred. Please try again.");
    } finally {
      setAuthLoading(false);
    }
  }

  // Preference Steps Navigation (Step 1 -> 2 -> 3)
  const handlePrefNext = () => {
    if (currentStep === 1) {
      setTopicPath([]);
      setSubTopic("");
      
      const rootOptions = fileTree[category] || fileTree["Others"];
      const keys = Object.keys(rootOptions);
      if (keys.length === 1 && rootOptions[keys[0]] === null) {
        setSubTopic(keys[0]);
      }
    }

    if (currentStep < 3) {
      setCurrentStep(currentStep + 1);
    } else {
      submitPreferences();
    }
  };

  const handlePrefBack = () => {
    if (currentStep === 2 && topicPath.length > 0) {
      setTopicPath(topicPath.slice(0, -1));
      setSubTopic("");
      return;
    }
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  // Submit preferences to Supabase for the authenticated user
  const submitPreferences = async () => {
    const targetUserId = activeUserId || user?.id;
    if (!targetUserId) return;
    setPrefLoading(true);

    try {
      const { data: existingProgress } = await supabase
        .from("profile_progress")
        .select("total_score")
        .eq("profile_id", targetUserId)
        .maybeSingle();

      if (existingProgress) {
        const { error: settingsError } = await supabase
          .from("profile_study_settings")
          .upsert({
            profile_id: targetUserId,
            exam_category: category,
            sub_topic: subTopic,
            study_style: "Flashcards",
            difficulty: "Beginner",
            timer_duration: timerDuration,
          }, { onConflict: "profile_id" });
        if (settingsError) throw settingsError;
      } else {
        await upsertFullProfile({
          id: targetUserId,
          name: user ? `${user.user_metadata?.full_name || user.email?.split("@")[0] || "Learner"}|/emoji/profile.webp` : null,
          exam_category: category,
          sub_topic: subTopic,
          timer_duration: timerDuration,
          study_style: "Flashcards",
          difficulty: "Beginner",
          total_score: 0,
          current_level: 1,
          lessons_completed: 0,
          streak: 0,
          streak_freeze_count: 1,
          hearts: 5,
          gems: 50,
        });
      }

      localStorage.setItem("timer_duration", timerDuration.toString());
      localStorage.removeItem("onboarding_prefs");
      localStorage.removeItem("guest_session_id");
      if (typeof window !== "undefined") {
        window.dispatchEvent(new CustomEvent("reviewer-db-update"));
      }
      router.push("/dashboard");
    } catch (err: any) {
      console.error("Error updating profile during onboarding:", err);
      await showAlert(`❌ Failed to save preferences: ${err.message || "Unknown error"}. Please try again.`);
      setPrefLoading(false);
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
    return <RiveScreenLoader text="Verifying details..." className="bg-[#131f2e]" />;
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // PHASE 1: LOGIN / SIGNUP SCREEN FIRST (Same UI as login & signup pages)
  // ═══════════════════════════════════════════════════════════════════════════
  const isAuthenticated = isSignedIn || !!activeUserId;

  if (!isAuthenticated) {
    if (emailSent) {
      return (
        <div className="min-h-screen bg-[#131f2e] flex flex-col items-center justify-center px-4" style={{ fontFamily: "'Nunito', 'Varela Round', sans-serif" }}>
          <div className="w-full max-w-[400px] text-center flex flex-col items-center gap-6">
            <div className="text-6xl animate-bounce">📧</div>
            <h1 className="text-white font-extrabold text-[26px]">Check your email!</h1>
            <p className="text-[#6b7f94] text-sm leading-relaxed">
              We&apos;ve sent a confirmation link to <span className="text-[#1cb0f6] font-bold">{email}</span>.
              <br />Click the link to activate your account and configure your exam preferences!
            </p>
            <button
              onClick={() => {
                setEmailSent(false);
                setAuthView("login");
              }}
              className="mt-4 w-full h-[52px] bg-[#1cb0f6] hover:bg-[#18a0e0] text-white font-extrabold text-[15px] tracking-[0.08em] uppercase rounded-xl shadow-[0_4px_0_#0e7ab5] transition-all px-10"
            >
              GO TO LOGIN
            </button>
          </div>
        </div>
      );
    }

    if (authView === "login") {
      // EXACT UI FROM app/login/page.tsx
      return (
        <div className="min-h-screen bg-[#131f2e] flex flex-col" style={{ fontFamily: "'Nunito', 'Varela Round', sans-serif" }}>
          {/* Top Bar */}
          <div className="flex items-center justify-between px-5 pt-5">
            <Link
              href="/"
              className="text-[#afafaf] hover:text-white transition-colors text-xl font-bold leading-none select-none"
              aria-label="Close and go home"
            >
              ✕
            </Link>
            <button
              onClick={() => {
                setAuthView("signup");
                setAuthError(null);
              }}
              className="border-2 border-[#afafaf] text-white font-extrabold text-sm tracking-[0.08em] px-5 py-2 rounded-xl hover:bg-white/10 transition-colors uppercase cursor-pointer"
            >
              SIGN UP
            </button>
          </div>

          {/* Center Card */}
          <div className="flex flex-1 items-center justify-center px-4 py-10">
            <div className="w-full max-w-[400px] flex flex-col items-center gap-5">
              {/* Heading */}
              <h1 className="text-white font-extrabold text-[26px] tracking-wide mb-1">
                Log in
              </h1>

              {/* Error */}
              {authError && (
                <div className="w-full bg-red-500/20 border border-red-500/40 text-red-300 text-sm rounded-xl px-4 py-3 text-center">
                  {authError}
                </div>
              )}

              {/* Form */}
              <form onSubmit={handleLogin} className="w-full flex flex-col gap-3">
                {/* Email */}
                <div className="relative">
                  <input
                    id="login-email"
                    type="email"
                    placeholder="Email or username"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    autoComplete="email"
                    className="w-full bg-[#1f2f40] border-2 border-[#2e4057] text-white placeholder-[#6b7f94] rounded-xl px-4 h-[52px] text-[15px] font-semibold outline-none focus:border-[#1cb0f6] transition-colors"
                  />
                </div>

                {/* Password */}
                <div className="relative">
                  <input
                    id="login-password"
                    type={showPassword ? "text" : "password"}
                    placeholder="Password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    autoComplete="current-password"
                    className="w-full bg-[#1f2f40] border-2 border-[#2e4057] text-white placeholder-[#6b7f94] rounded-xl px-4 pr-24 h-[52px] text-[15px] font-semibold outline-none focus:border-[#1cb0f6] transition-colors"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-[#6b7f94] hover:text-[#1cb0f6] text-xs font-extrabold tracking-widest uppercase transition-colors cursor-pointer"
                  >
                    {showPassword ? "HIDE" : "SHOW"}
                  </button>
                </div>

                {/* Forgot Password */}
                <div className="flex justify-end -mt-1">
                  <Link
                    href="/forgot-password"
                    className="text-[#1cb0f6] text-xs font-bold uppercase tracking-widest hover:underline"
                  >
                    FORGOT?
                  </Link>
                </div>

                {/* Submit */}
                <button
                  id="login-submit"
                  type="submit"
                  disabled={authLoading}
                  className="w-full h-[52px] bg-[#1cb0f6] hover:bg-[#18a0e0] active:translate-y-[2px] text-white font-extrabold text-[15px] tracking-[0.08em] uppercase rounded-xl shadow-[0_4px_0_#0e7ab5] active:shadow-none transition-all disabled:opacity-60 disabled:cursor-not-allowed cursor-pointer"
                >
                  {authLoading ? "LOGGING IN…" : "LOG IN"}
                </button>
              </form>
            </div>
          </div>
        </div>
      );
    }

    // EXACT UI FROM app/signup/page.tsx
    return (
      <div className="min-h-screen bg-[#131f2e] flex flex-col" style={{ fontFamily: "'Nunito', 'Varela Round', sans-serif" }}>
        {/* Top Bar */}
        <div className="flex items-center justify-between px-5 pt-5">
          <Link
            href="/"
            className="text-[#afafaf] hover:text-white transition-colors text-xl font-bold leading-none select-none"
            aria-label="Close and go home"
          >
            ✕
          </Link>
          <button
            onClick={() => {
              setAuthView("login");
              setAuthError(null);
            }}
            className="border-2 border-[#afafaf] text-white font-extrabold text-sm tracking-[0.08em] px-5 py-2 rounded-xl hover:bg-white/10 transition-colors uppercase cursor-pointer"
          >
            LOG IN
          </button>
        </div>

        {/* Center Card */}
        <div className="flex flex-1 items-center justify-center px-4 py-10">
          <div className="w-full max-w-[400px] flex flex-col items-center gap-5">
            {/* Heading */}
            <h1 className="text-white font-extrabold text-[26px] tracking-wide mb-1">
              Create a profile
            </h1>

            {/* Error */}
            {authError && (
              <div className="w-full bg-red-500/20 border border-red-500/40 text-red-300 text-sm rounded-xl px-4 py-3 text-center">
                {authError}
              </div>
            )}

            {/* Form */}
            <form onSubmit={handleSignup} className="w-full flex flex-col gap-3">
              {/* Name */}
              <input
                id="signup-name"
                type="text"
                placeholder="Display name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                autoComplete="name"
                className="w-full bg-[#1f2f40] border-2 border-[#2e4057] text-white placeholder-[#6b7f94] rounded-xl px-4 h-[52px] text-[15px] font-semibold outline-none focus:border-[#1cb0f6] transition-colors"
              />

              {/* Email — with live validation */}
              <div className="flex flex-col gap-1">
                <div className="relative">
                  <input
                    id="signup-email"
                    type="email"
                    placeholder="Email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    autoComplete="email"
                    className={`w-full bg-[#1f2f40] border-2 ${emailBorderClass} text-white placeholder-[#6b7f94] rounded-xl px-4 pr-10 h-[52px] text-[15px] font-semibold outline-none focus:border-[#1cb0f6] transition-colors`}
                  />
                  {/* Status icon inside the input */}
                  {emailStatusIcon && (
                    <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none">
                      {emailStatusIcon}
                    </div>
                  )}
                </div>
                {/* Validation message below the input */}
                {emailMessage && emailStatus !== "taken" && (
                  <div className={`flex items-center gap-1.5 px-1 ${emailMessageColor}`}>
                    <span className="text-xs font-semibold leading-tight">{emailMessage}</span>
                  </div>
                )}
                {/* Prominent banner when email is already taken */}
                {emailStatus === "taken" && (
                  <div className="w-full bg-[#ff4b4b]/10 border border-[#ff4b4b]/30 rounded-xl px-4 py-3 flex flex-col gap-2 mt-1">
                    <div className="flex items-center gap-2">
                      <svg className="h-4 w-4 text-[#ff4b4b] flex-shrink-0" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                      </svg>
                      <span className="text-[#ff4b4b] text-xs font-bold">
                        An account with this email already exists.
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={() => { setAuthView("login"); setAuthError(null); setEmailStatus("idle"); setEmailMessage(""); }}
                      className="w-full h-[38px] bg-[#ff4b4b] hover:bg-[#e03e3e] text-white font-extrabold text-xs tracking-[0.08em] uppercase rounded-lg transition-all cursor-pointer"
                    >
                      LOG IN INSTEAD
                    </button>
                  </div>
                )}
              </div>

              {/* Password */}
              <div className="relative">
                <input
                  id="signup-password"
                  type={showPassword ? "text" : "password"}
                  placeholder="Password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  autoComplete="new-password"
                  className="w-full bg-[#1f2f40] border-2 border-[#2e4057] text-white placeholder-[#6b7f94] rounded-xl px-4 pr-20 h-[52px] text-[15px] font-semibold outline-none focus:border-[#1cb0f6] transition-colors"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-[#6b7f94] hover:text-[#1cb0f6] text-xs font-extrabold tracking-widest uppercase transition-colors cursor-pointer"
                >
                  {showPassword ? "HIDE" : "SHOW"}
                </button>
              </div>

              {/* Confirm Password */}
              <input
                id="signup-confirm-password"
                type={showPassword ? "text" : "password"}
                placeholder="Confirm password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                autoComplete="new-password"
                className="w-full bg-[#1f2f40] border-2 border-[#2e4057] text-white placeholder-[#6b7f94] rounded-xl px-4 h-[52px] text-[15px] font-semibold outline-none focus:border-[#1cb0f6] transition-colors"
              />

              {/* Submit */}
              <button
                id="signup-submit"
                type="submit"
                disabled={authLoading || emailStatus === "taken" || emailStatus === "checking"}
                className="w-full h-[52px] bg-[#1cb0f6] hover:bg-[#18a0e0] active:translate-y-[2px] text-white font-extrabold text-[15px] tracking-[0.08em] uppercase rounded-xl shadow-[0_4px_0_#0e7ab5] active:shadow-none transition-all disabled:opacity-60 disabled:cursor-not-allowed mt-1 cursor-pointer"
              >
                {authLoading ? "CREATING ACCOUNT…" : "GET STARTED"}
              </button>
            </form>
          </div>
        </div>
      </div>
    );
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // PHASE 2: TEST PREFERENCES WIZARD (Steps 1 to 3)
  // ═══════════════════════════════════════════════════════════════════════════
  return (
    <div className="min-h-screen flex flex-col bg-white font-din-round text-almost-black">
      {/* Top Navbar with Progress Bar */}
      <header className="sticky top-0 bg-white border-b-2 border-cloud-gray py-4 px-6 z-30">
        <div className="max-w-[800px] mx-auto flex items-center gap-4">
          {currentStep > 1 ? (
            <button
              onClick={handlePrefBack}
              className="text-silver hover:text-charcoal font-bold text-lg p-2 transition-colors cursor-pointer"
              title="Previous Step"
            >
              ←
            </button>
          ) : (
            <button
              onClick={() => router.push("/")}
              className="text-silver hover:text-charcoal font-bold text-lg p-2 transition-colors cursor-pointer"
              title="Close"
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
              src="/emoji/profile.webp" 
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
          {/* Step 1: Exam Category */}
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

          {/* Step 2: Topic Selection */}
          {currentStep === 2 && renderTopicSelection()}

          {/* Step 3: Timer Duration */}
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
        <div className="max-w-[650px] mx-auto flex items-center justify-between">
          <div className="ml-auto w-full sm:w-auto">
            <Button
              onClick={handlePrefNext}
              disabled={isContinueDisabled() || prefLoading}
              variant="primary"
              className="w-full sm:w-[200px] h-[50px] text-body shadow-[0_4px_0_#3f8f01]"
            >
              {prefLoading ? "Saving..." : currentStep === 3 ? "Complete" : "Continue"}
            </Button>
          </div>
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
