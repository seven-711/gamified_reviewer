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

  const containerElementRef = React.useRef<HTMLDivElement | null>(null);

  const handleContainerRef = (el: HTMLDivElement | null) => {
    containerElementRef.current = el;
    setContainerRef(el);
  };

  // Automate full playback and streak progression without requiring user clicks
  useEffect(() => {
    if (!rive || typeof window === "undefined") return;

    const autoPlayStreak = () => {
      // 1. Activate ViewModel properties and trigger if available (for 15correctStreak.riv)
      try {
        const vms = (rive as any).viewModelByName?.("VMStreak");
        if (vms) {
          const inst = vms.defaultInstance?.();
          if (inst) {
            if ((rive as any).bindViewModelInstance) {
              (rive as any).bindViewModelInstance(inst);
            }
            const num = inst.number?.("streakNumber");
            if (num) num.value = 15;
            const counter = inst.number?.("counter");
            if (counter) counter.value = 15;
            const str = inst.string?.("displayedText");
            if (str) str.value = "15 Correct Streak";
            const boo = inst.boolean?.("booStreak");
            if (boo) boo.value = true;
            const trig = inst.trigger?.("trigStreak");
            if (trig && typeof trig.trigger === "function") {
              trig.trigger();
            }
          }
        }
      } catch (err) {
        console.warn("ViewModel auto-trigger notice:", err);
      }

      // 2. Fire any state machine triggers or boolean/number inputs
      try {
        const inputs = rive.stateMachineInputs("State Machine 1") || [];
        for (const input of inputs) {
          if (input.name === "trigStreak" || input.name === "Click" || input.name === "trigSphere") {
            input.fire();
          } else if (input.name === "booStreak" || input.name === "boolSphere") {
            input.value = true;
          } else if (input.name === "streakNumber" || input.name === "numStates") {
            input.value = 15;
          }
        }
      } catch (err) {
        console.warn("State machine input notice:", err);
      }

      // 3. Update artboard text value runs (e.g. replace '30' with '15' and 'day streak' with 'correct streak')
      try {
        const ab = (rive as any).activeArtboard;
        if (ab && typeof ab.textValueRunCount === "function") {
          for (let i = 0; i < ab.textValueRunCount(); i++) {
            const run = ab.textValueRunByIndex(i);
            if (run) {
              if (run.text === "30") {
                run.text = "15";
              } else if (run.text.toLowerCase().includes("streak")) {
                run.text = "correct streak";
              }
            }
          }
        }
      } catch (err) {
        console.warn("Text run update notice:", err);
      }

      // 4. Dispatch synthetic pointer click to canvas in case state machine relies on pointer listener
      try {
        const canvas = containerElementRef.current?.querySelector("canvas");
        if (canvas) {
          const rect = canvas.getBoundingClientRect();
          const x = rect.left + rect.width / 2;
          const y = rect.top + rect.height / 2;
          canvas.dispatchEvent(new PointerEvent("pointerdown", { clientX: x, clientY: y, bubbles: true }));
          canvas.dispatchEvent(new PointerEvent("pointerup", { clientX: x, clientY: y, bubbles: true }));
        }
      } catch (err) {
        console.warn("Synthetic pointer event notice:", err);
      }

      // 5. Ensure rive runtime is playing
      if (typeof rive.play === "function" && !rive.isPlaying) {
        rive.play();
      }
    };

    // Run immediately and after a short tick to handle initialization frames
    autoPlayStreak();
    const tick1 = setTimeout(autoPlayStreak, 50);
    const tick2 = setTimeout(autoPlayStreak, 180);

    return () => {
      clearTimeout(tick1);
      clearTimeout(tick2);
    };
  }, [rive, src]);

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

  // Ensure button appears after 3s to let the full animation play
  useEffect(() => {
    const timer = setTimeout(() => {
      setShowButton(true);
    }, 3000);

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
        ref={handleContainerRef}
        className="absolute inset-0 w-full h-full flex items-center justify-center cursor-pointer"
        onClick={() => {
          // If the user clicks anywhere on the canvas area, trigger progression as a fallback
          try {
            const canvas = containerElementRef.current?.querySelector("canvas");
            if (canvas) {
              const rect = canvas.getBoundingClientRect();
              canvas.dispatchEvent(new PointerEvent("pointerdown", { clientX: rect.left + rect.width / 2, clientY: rect.top + rect.height / 2, bubbles: true }));
              canvas.dispatchEvent(new PointerEvent("pointerup", { clientX: rect.left + rect.width / 2, clientY: rect.top + rect.height / 2, bubbles: true }));
            }
          } catch (e) {}
        }}
      >
        <RiveComponent className="w-full h-full object-contain pointer-events-auto" />
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
