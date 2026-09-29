"use client";

import React, { useEffect } from "react";
import {
  useRive,
  Layout,
  Fit,
  Alignment,
  RuntimeLoader,
  useViewModel,
  useViewModelInstance,
  useViewModelInstanceNumber,
  EventType,
} from "@rive-app/react-webgl2";

if (typeof window !== "undefined") {
  RuntimeLoader.setWasmUrl("/rive.wasm");
  RuntimeLoader.setWasmFallbackUrl("/rive_fallback.wasm");
}

interface DayStreakRiveProps {
  streak: number;
  width?: number;
  height?: number;
  className?: string;
  style?: React.CSSProperties;
}

export default function DayStreakRive({
  streak,
  width = 180,
  height = 180,
  className = "",
  style,
}: DayStreakRiveProps) {
  const effectiveStreak = Math.max(0, Math.round(Number(streak) || 0));

  const { RiveComponent, setContainerRef, rive } = useRive(
    {
      src: "/emoji/1dayStreak.riv",
      artboard: "streak",
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

  // Hook-based ViewModel binding
  const viewModel = useViewModel(rive, { useDefault: true });
  const viewModelInstance = useViewModelInstance(viewModel, {
    useDefault: true,
    rive,
  });
  const streakProp = useViewModelInstanceNumber("streak", viewModelInstance);

  useEffect(() => {
    if (streakProp && typeof streakProp.setValue === "function") {
      streakProp.setValue(effectiveStreak);
    }
  }, [streakProp, effectiveStreak]);

  // Imperative fallback binding on load / update
  useEffect(() => {
    if (!rive) return;

    const applyStreak = () => {
      try {
        const vm = rive.defaultViewModel
          ? rive.defaultViewModel()
          : (rive as any).viewModelByName
          ? (rive as any).viewModelByName("UserStreakVM")
          : null;

        const inst =
          rive.viewModelInstance ||
          (rive as any).globalViewModelInstance?.("UserStreakVM") ||
          (vm?.defaultInstance ? vm.defaultInstance() : null);

        if (inst) {
          const num = inst.number("streak");
          if (num) {
            num.value = effectiveStreak;
          }
          if (rive.viewModelInstance !== inst && (rive as any).setViewModelInstance) {
            (rive as any).setViewModelInstance(inst);
          }
          if ((rive as any).bind) {
            (rive as any).bind();
          }
        }
      } catch (e) {
        console.error("Error setting Rive streak number:", e);
      }
    };

    applyStreak();
    const raf = requestAnimationFrame(applyStreak);
    const timer = setTimeout(applyStreak, 100);

    rive.on(EventType.Load, applyStreak);

    return () => {
      cancelAnimationFrame(raf);
      clearTimeout(timer);
      rive.off(EventType.Load, applyStreak);
    };
  }, [rive, effectiveStreak]);

  return (
    <div
      ref={setContainerRef}
      className={`relative inline-flex items-center justify-center shrink-0 ${className}`}
      style={{
        width: width ? `${width}px` : undefined,
        height: height ? `${height}px` : undefined,
        ...style,
      }}
    >
      <RiveComponent className="w-full h-full object-contain pointer-events-none" />
    </div>
  );
}
