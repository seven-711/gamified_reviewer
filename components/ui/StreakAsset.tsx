"use client";

import React from "react";
import dynamic from "next/dynamic";
import { StatsContext } from "@/components/ui/StatsContext";

const StreakRive = dynamic(() => import("@/components/ui/StreakRive"), {
  ssr: false,
});

interface StreakAssetProps {
  streak: number;
  lastLessonDate?: string | null;
  active?: boolean;
  forceActive?: boolean;
  width?: number;
  height?: number;
  fill?: boolean;
  className?: string;
  alt?: string;
  unoptimized?: boolean;
  style?: React.CSSProperties;
}

export function StreakAsset({
  streak,
  lastLessonDate,
  active,
  forceActive,
  width = 28,
  height = 28,
  fill,
  className = "object-contain",
  alt = "Streak",
  unoptimized,
  style,
}: StreakAssetProps) {
  const stats = React.useContext(StatsContext);
  const contextLastLessonDate = stats ? stats.lastLessonDate : null;
  const effectiveLastLessonDate = lastLessonDate !== undefined ? lastLessonDate : contextLastLessonDate;

  const todayStr = React.useMemo(() => new Date().toLocaleDateString("en-CA"), []);
  const isStreakActive = active !== undefined
    ? active
    : (forceActive || (streak > 0 && (effectiveLastLessonDate === undefined || effectiveLastLessonDate === null || effectiveLastLessonDate === todayStr)));

  const riveSrc = isStreakActive ? "/emoji/activeStreak.riv" : "/emoji/inactiveStreak.riv";

  return (
    <StreakRive
      key={riveSrc}
      src={riveSrc}
      width={fill ? undefined : width}
      height={fill ? undefined : height}
      fill={fill}
      className={className}
      style={style}
    />
  );
}
