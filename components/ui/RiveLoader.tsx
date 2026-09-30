"use client";

import React from "react";
import Rive from "@rive-app/react-canvas";

interface RiveLoaderProps {
  text?: string;
  className?: string;
}

export function RiveLoader({ text = "Loading...", className = "" }: RiveLoaderProps) {
  return (
    <div className={`flex flex-col items-center justify-center gap-6 ${className}`}>
      <div className="w-64 h-64 md:w-96 md:h-96">
        <Rive src="/emoji/reviewqo.riv" style={{ width: "100%", height: "100%" }} />
      </div>
      {text && <p className="text-[#6b7f94] font-bold text-xl md:text-2xl animate-pulse">{text}</p>}
    </div>
  );
}

export function RiveScreenLoader({ text = "Loading...", className = "" }: { text?: string, className?: string }) {
  return (
    <div className={`flex min-h-[100dvh] w-full items-center justify-center font-din-round text-white ${className}`}>
      <RiveLoader text={text} />
    </div>
  );
}
