"use client";

import React from "react";
import { useRive, Layout, Fit, Alignment, RuntimeLoader } from "@rive-app/react-webgl2";

if (typeof window !== "undefined") {
  RuntimeLoader.setWasmUrl("/rive.wasm");
  RuntimeLoader.setWasmFallbackUrl("/rive_fallback.wasm");
}

interface StreakRiveProps {
  src: string;
  width?: number;
  height?: number;
  fill?: boolean;
  className?: string;
  style?: React.CSSProperties;
}

export default function StreakRive({
  src,
  width,
  height,
  fill,
  className = "",
  style,
}: StreakRiveProps) {
  const { RiveComponent, setContainerRef } = useRive(
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

  return (
    <div
      ref={setContainerRef}
      className={fill ? `relative w-full h-full flex items-center justify-center ${className}` : `relative inline-flex items-center justify-center shrink-0 ${className}`}
      style={{
        width: !fill && width ? `${width}px` : undefined,
        height: !fill && height ? `${height}px` : undefined,
        ...style,
      }}
    >
      <RiveComponent className="w-full h-full object-contain pointer-events-none" />
    </div>
  );
}
