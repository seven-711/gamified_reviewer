"use client";

import React, { useState, useEffect } from "react";
import { useRive, Layout, Fit, Alignment, RuntimeLoader } from "@rive-app/react-webgl2";

if (typeof window !== "undefined") {
  RuntimeLoader.setWasmUrl("/rive.wasm");
  RuntimeLoader.setWasmFallbackUrl("/rive_fallback.wasm");
}

interface FiveStreakRiveProps {
  src?: string;
  onContinue: () => void;
}

export default function FiveStreakRive({ src = "/emoji/5streak.riv", onContinue }: FiveStreakRiveProps) {
  const [showButton, setShowButton] = useState(false);

  const { RiveComponent, setContainerRef, rive } = useRive(
    {
      src,
      stateMachine: "State Machine 1",
      autoplay: true,
      layout: new Layout({
        fit: Fit.Contain,
        alignment: Alignment.Center,
      }),
    },
    {
      shouldResizeCanvasToContainer: true,
    }
  );

  // Update layout fit for mobile vs desktop screen proportions
  useEffect(() => {
    if (!rive || typeof window === "undefined") return;

    const updateFit = () => {
      const isMobile = window.innerWidth <= 768;
      rive.layout = new Layout({
        fit: isMobile ? Fit.Cover : Fit.Contain,
        alignment: Alignment.Center,
      });
    };

    updateFit();
    window.addEventListener("resize", updateFit);
    return () => window.removeEventListener("resize", updateFit);
  }, [rive]);

  // Ensure button appears after 2.5s
  useEffect(() => {
    const timer = setTimeout(() => {
      setShowButton(true);
    }, 2500);

    return () => clearTimeout(timer);
  }, []);

  // Keyboard shortcut to continue with Enter or Space once button appears
  useEffect(() => {
    if (!showButton) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        onContinue();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [showButton, onContinue]);

  return (
    <div className="fixed inset-0 h-[100dvh] w-full z-[150] bg-black flex flex-col items-center justify-center overflow-hidden animate-[fadeIn_0.25s_ease-out]">
      {/* Whole screen Rive canvas */}
      <div
        ref={setContainerRef}
        className="absolute inset-0 w-full h-full flex items-center justify-center pointer-events-none"
      >
        <RiveComponent className="w-full h-full object-contain" />
      </div>

      {/* Continue button at the bottom of the screen in mobile UI */}
      {showButton && (
        <div className="absolute bottom-0 left-0 right-0 p-4 pb-[max(1.25rem,env(safe-area-inset-bottom,20px))] flex justify-center z-50 bg-gradient-to-t from-black/90 via-black/50 to-transparent animate-[slideUp_0.35s_ease-out]">
          <div className="w-full max-w-md px-2">
            <button
              onClick={onContinue}
              className="w-full h-14 min-h-[56px] bg-[#00FFFA] hover:brightness-110 active:translate-y-1 active:shadow-none text-white font-din-round font-extrabold text-[16px] md:text-[18px] tracking-wider uppercase rounded-2xl shadow-[0_4px_0_#00c2bb] transition-all flex items-center justify-center cursor-pointer select-none"
            >
              Continue
            </button>
          </div>
        </div>
      )}

      <style jsx global>{`
        @keyframes fadeIn {
          from {
            opacity: 0;
          }
          to {
            opacity: 1;
          }
        }
        @keyframes slideUp {
          from {
            opacity: 0;
            transform: translateY(24px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
      `}</style>
    </div>
  );
}
