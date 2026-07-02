import React from "react";

interface ProgressBarProps {
  progress: number; // 0 to 100
}

export function ProgressBar({ progress }: ProgressBarProps) {
  const clampedProgress = Math.max(0, Math.min(100, progress));

  return (
    <div className="h-4 w-full rounded-full bg-cloud-gray overflow-hidden">
      <div
        className="h-full bg-duo-green rounded-full transition-all duration-300 ease-out"
        style={{ width: `${clampedProgress}%` }}
      />
    </div>
  );
}
