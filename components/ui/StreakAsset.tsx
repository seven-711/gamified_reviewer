"use client";

import React from "react";
import Image from "next/image";
import { getStreakImage } from "@/lib/streak";
import { StatsContext } from "@/components/ui/StatsContext";

interface StreakAssetProps {
  streak: number;
  lastLessonDate?: string | null;
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
  width,
  height,
  fill,
  className = "object-contain",
  alt = "Streak",
  unoptimized,
  style,
}: StreakAssetProps) {
  const stats = React.useContext(StatsContext);
  const contextLastLessonDate = stats ? stats.lastLessonDate : null;
  const effectiveLastLessonDate = lastLessonDate !== undefined ? lastLessonDate : contextLastLessonDate;
  const src = getStreakImage(streak, effectiveLastLessonDate);
  const isVideo = src.endsWith(".webm");

  const [isSafari, setIsSafari] = React.useState(false);

  React.useEffect(() => {
    if (typeof window !== "undefined") {
      const ua = navigator.userAgent.toLowerCase();
      const isSaf = ua.indexOf('safari') !== -1 && ua.indexOf('chrome') === -1;
      const isIOS = /ipad|iphone|ipod/.test(ua) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
      if (isSaf || isIOS) {
        setIsSafari(true);
      }
    }
  }, []);

  if (isVideo) {
    if (fill) {
      return (
        <video
          src={src}
          autoPlay
          loop
          muted
          playsInline
          className={`absolute inset-0 w-full h-full ${className}`}
          style={{
            mixBlendMode: isSafari ? "screen" : undefined,
            ...style,
          }}
        />
      );
    }

    return (
      <video
        src={src}
        autoPlay
        loop
        muted
        playsInline
        width={width}
        height={height}
        className={className}
        style={{
          width: width ? `${width}px` : undefined,
          height: height ? `${height}px` : "auto",
          mixBlendMode: isSafari ? "screen" : undefined,
          ...style,
        }}
      />
    );
  }

  return (
    <Image
      src={src}
      alt={alt}
      width={fill ? undefined : width}
      height={fill ? undefined : height}
      fill={fill}
      className={className}
      unoptimized={unoptimized}
      style={style}
    />
  );
}
