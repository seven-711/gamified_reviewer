"use client";

import React from "react";
import Rive from "@rive-app/react-canvas";

interface RiveSadProps {
  className?: string;
}

export function RiveSad({ className = "" }: RiveSadProps) {
  return (
    <div className={`flex flex-col items-center justify-center ${className}`}>
      <div className="w-124 h-124 md:w-96 md:h-96">
        <Rive src="/emoji/sad.riv" />
      </div>
    </div>
  );
}
