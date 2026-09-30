"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { upsertFullProfile } from "@/lib/session";

type EmailStatus = "idle" | "checking" | "available" | "taken" | "invalid";

export default function SignupPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  // Live email validation state
  const [emailStatus, setEmailStatus] = useState<EmailStatus>("idle");
  const [emailMessage, setEmailMessage] = useState("");
  const debounceRef = useRef<NodeJS.Timeout | null>(null);

  /** Validate email format client-side */
  const isValidEmail = (val: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val.trim());

  /** Debounced check for duplicate email via Supabase RPC */
  const checkEmailExists = useCallback(async (emailToCheck: string) => {
    const trimmed = emailToCheck.trim().toLowerCase();

    // Skip empty or invalid emails
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
        // Don't block signup on RPC errors — just reset
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
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }

    // Reset if empty
    if (!email.trim()) {
      setEmailStatus("idle");
      setEmailMessage("");
      return;
    }

    // Quick client-side format check while typing
    if (email.trim().length > 0 && !isValidEmail(email)) {
      // Don't show invalid message until they've typed enough (has @ and domain)
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

    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }
    };
  }, [email, checkEmailExists]);



  /** Get the border color class for the email input */
  const emailBorderClass = (() => {
    switch (emailStatus) {
      case "checking": return "border-[#f5a623]";
      case "available": return "border-[#58cc02]";
      case "taken": return "border-[#ff4b4b]";
      case "invalid": return "border-[#ff4b4b]";
      default: return "border-[#2e4057]";
    }
  })();

  /** Get the message color for email status */
  const emailMessageColor = (() => {
    switch (emailStatus) {
      case "checking": return "text-[#f5a623]";
      case "available": return "text-[#58cc02]";
      case "taken": return "text-[#ff4b4b]";
      case "invalid": return "text-[#ff4b4b]";
      default: return "text-[#6b7f94]";
    }
  })();

  /** Get the status icon for email validation */
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
      case "taken":
      case "invalid":
        return (
          <svg className="h-4 w-4 text-[#ff4b4b]" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
          </svg>
        );
      default:
        return null;
    }
  })();

  async function handleSignup(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    // Block submission if email is already taken
    if (emailStatus === "taken") {
      setError("This email is already registered. Please log in instead.");
      return;
    }

    // Block submission if email format is invalid
    if (emailStatus === "invalid") {
      setError("Please enter a valid email address.");
      return;
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }
    if (password.length < 6) {
      setError("Password must be at least 6 characters.");
      return;
    }

    setLoading(true);
    try {
      const { data, error: authError } = await supabase.auth.signUp({
        email: email.trim(),
        password,
        options: {
          data: { full_name: name.trim() },
        },
      });

      if (authError) {
        // Check if the error message indicates the user already exists
        if (
          authError.message.toLowerCase().includes("user already registered") ||
          authError.message.toLowerCase().includes("already been registered")
        ) {
          setEmailStatus("taken");
          setEmailMessage("An account with this email already exists.");
          setError(null);
          return;
        }

        // If rate limit error occurs, attempt direct sign-in in case the user already exists
        if (authError.message.toLowerCase().includes("rate limit") || authError.message.toLowerCase().includes("over_email_send_rate_limit")) {
          const { data: loginData } = await supabase.auth.signInWithPassword({
            email: email.trim(),
            password,
          });

          if (loginData?.session && loginData?.user) {
            await upsertFullProfile({
              id: loginData.user.id,
              name: name.trim(),
            });
            router.push("/onboarding");
            return;
          }

          setError("Supabase email rate limit reached. To bypass this for testing: in your Supabase Dashboard, go to Authentication > Providers > Email and toggle OFF 'Confirm email'.");
          return;
        }

        setError(authError.message);
        return;
      }

      // Detect existing account: Supabase returns an empty identities array
      // when signUp is called with an already-registered email
      if (
        data.user &&
        Array.isArray(data.user.identities) &&
        data.user.identities.length === 0
      ) {
        setEmailStatus("taken");
        setEmailMessage("An account with this email already exists.");
        setError(null);
        return;
      }

      let activeSession = data.session;

      // If session is null (e.g., Supabase email confirmations enabled), attempt instant login
      if (!activeSession) {
        const { data: loginData } = await supabase.auth.signInWithPassword({
          email: email.trim(),
          password,
        });
        if (loginData?.session) {
          activeSession = loginData.session;
        }
      }

      if (activeSession && data.user) {
        // Active session established - initialize profile and proceed
        await upsertFullProfile({
          id: data.user.id,
          name: name.trim(),
        });
        router.push("/onboarding");
      } else {
        // Email confirmation is required by Supabase project settings
        if (data.user) {
          try {
            await upsertFullProfile({
              id: data.user.id,
              name: name.trim(),
            });
          } catch {}
        }
        setSuccess(true);
      }
    } catch {
      setError("An unexpected error occurred. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  if (success) {
    return (
      <div className="min-h-screen bg-[#131f2e] flex flex-col items-center justify-center px-4" style={{ fontFamily: "'Nunito', 'Varela Round', sans-serif" }}>
        <div className="w-full max-w-[400px] text-center flex flex-col items-center gap-6">
          <div className="text-6xl">📧</div>
          <h1 className="text-white font-extrabold text-[26px]">Check your email!</h1>
          <p className="text-[#6b7f94] text-sm leading-relaxed">
            We&apos;ve sent a confirmation link to <span className="text-[#1cb0f6] font-bold">{email}</span>.
            <br />Click the link to activate your account and start learning!
          </p>
          <Link href="/login">
            <button className="mt-4 w-full h-[52px] bg-[#1cb0f6] hover:bg-[#18a0e0] text-white font-extrabold text-[15px] tracking-[0.08em] uppercase rounded-xl shadow-[0_4px_0_#0e7ab5] transition-all px-10">
              GO TO LOGIN
            </button>
          </Link>
        </div>
      </div>
    );
  }

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
        <Link href="/login">
          <button className="border-2 border-[#afafaf] text-white font-extrabold text-sm tracking-[0.08em] px-5 py-2 rounded-xl hover:bg-white/10 transition-colors uppercase">
            LOG IN
          </button>
        </Link>
      </div>

      {/* Center Card */}
      <div className="flex flex-1 items-center justify-center px-4 py-10">
        <div className="w-full max-w-[400px] flex flex-col items-center gap-5">

          {/* Heading */}
          <h1 className="text-white font-extrabold text-[26px] tracking-wide mb-1">
            Create a profile
          </h1>

          {/* Error */}
          {error && (
            <div className="w-full bg-red-500/20 border border-red-500/40 text-red-300 text-sm rounded-xl px-4 py-3 text-center">
              {error}
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
                  <Link href="/login" className="w-full">
                    <button
                      type="button"
                      className="w-full h-[38px] bg-[#ff4b4b] hover:bg-[#e03e3e] text-white font-extrabold text-xs tracking-[0.08em] uppercase rounded-lg transition-all"
                    >
                      LOG IN INSTEAD
                    </button>
                  </Link>
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
                className="absolute right-4 top-1/2 -translate-y-1/2 text-[#6b7f94] hover:text-[#1cb0f6] text-xs font-extrabold tracking-widest uppercase transition-colors"
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
              disabled={loading || emailStatus === "taken" || emailStatus === "checking"}
              className="w-full h-[52px] bg-[#1cb0f6] hover:bg-[#18a0e0] active:translate-y-[2px] text-white font-extrabold text-[15px] tracking-[0.08em] uppercase rounded-xl shadow-[0_4px_0_#0e7ab5] active:shadow-none transition-all disabled:opacity-60 disabled:cursor-not-allowed mt-1"
            >
              {loading ? "CREATING ACCOUNT…" : "GET STARTED"}
            </button>
          </form>

          {/* OR divider */}
          <div className="flex items-center gap-3 w-full my-1">
            <div className="flex-1 h-px bg-[#2e4057]" />
            <span className="text-[#6b7f94] text-xs font-bold uppercase tracking-widest">OR</span>
            <div className="flex-1 h-px bg-[#2e4057]" />
          </div>

          {/* Social Buttons — Not functional yet / Coming Soon */}
          <div className="w-full flex flex-col gap-2">
            <div className="flex items-center justify-center gap-1.5 text-[#6b7f94] text-[11px] font-bold uppercase tracking-wider">
              <span>Social Signup</span>
              <span className="bg-[#2e4057] text-[#afafaf] text-[9px] px-2 py-0.5 rounded-full font-extrabold">
                Not Functional Yet
              </span>
            </div>

            <div className="flex gap-3 w-full">
              <button
                type="button"
                className="flex-1 flex items-center justify-center gap-2 h-[48px] bg-transparent border-2 border-[#2e4057] rounded-xl text-[#6b7f94] font-bold text-xs tracking-wide cursor-not-allowed opacity-60 select-none"
                disabled
                title="Google signup is not functional yet (Coming Soon)"
              >
                <svg width="18" height="18" viewBox="0 0 18 18" fill="none" className="opacity-60">
                  <path d="M17.64 9.205c0-.638-.057-1.252-.164-1.841H9v3.481h4.844a4.14 4.14 0 0 1-1.796 2.716v2.259h2.908c1.702-1.567 2.684-3.875 2.684-6.615z" fill="#4285F4"/>
                  <path d="M9 18c2.43 0 4.467-.806 5.956-2.18l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 0 0 9 18z" fill="#34A853"/>
                  <path d="M3.964 10.71A5.41 5.41 0 0 1 3.682 9c0-.593.102-1.17.282-1.71V4.958H.957A8.996 8.996 0 0 0 0 9c0 1.452.348 2.827.957 4.042l3.007-2.332z" fill="#FBBC05"/>
                  <path d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 0 0 .957 4.958L3.964 7.29C4.672 5.163 6.656 3.58 9 3.58z" fill="#EA4335"/>
                </svg>
                GOOGLE
              </button>
              <button
                type="button"
                className="flex-1 flex items-center justify-center gap-2 h-[48px] bg-transparent border-2 border-[#2e4057] rounded-xl text-[#6b7f94] font-bold text-xs tracking-wide cursor-not-allowed opacity-60 select-none"
                disabled
                title="Facebook signup is not functional yet (Coming Soon)"
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="#1877F2" className="opacity-60">
                  <path d="M24 12.073C24 5.405 18.627 0 12 0S0 5.405 0 12.073C0 18.1 4.388 23.094 10.125 24v-8.437H7.078v-3.49h3.047V9.41c0-3.025 1.792-4.697 4.533-4.697 1.312 0 2.686.236 2.686.236v2.97h-1.513c-1.491 0-1.956.93-1.956 1.886v2.267h3.328l-.532 3.49h-2.796V24C19.612 23.094 24 18.1 24 12.073z"/>
                </svg>
                FACEBOOK
              </button>
            </div>
          </div>

          {/* Legal */}
          <p className="text-center text-[#6b7f94] text-xs leading-relaxed mt-1">
            By signing up, you agree to our{" "}
            <Link href="/terms" className="text-[#1cb0f6] hover:underline">Terms</Link>{" "}
            and{" "}
            <Link href="/privacy" className="text-[#1cb0f6] hover:underline">Privacy Policy</Link>.
          </p>
          <p className="text-center text-[#6b7f94] text-xs leading-relaxed">
            This site is protected by reCAPTCHA Enterprise and the Google{" "}
            <Link href="https://policies.google.com/privacy" className="text-[#1cb0f6] hover:underline">Privacy Policy</Link>{" "}
            and{" "}
            <Link href="https://policies.google.com/terms" className="text-[#1cb0f6] hover:underline">Terms of Service</Link>{" "}
            apply.
          </p>
        </div>
      </div>
    </div>
  );
}
