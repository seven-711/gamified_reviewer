"use client";

import React from "react";
import Link from "next/link";
import { RiveSad } from "@/components/ui/RiveSad";

export default function NotFound() {
  return (
    <div className="flex-1 w-full min-h-screen flex flex-col items-center justify-center text-center px-4 font-din-round bg-[#131f2e] text-white">
      <div className="flex flex-col items-center justify-center">
        <RiveSad />
        <h1 className="text-4xl md:text-6xl font-black text-white tracking-tight font-feather mt-[-2rem]">
          404
        </h1>
        <h2 className="text-xl md:text-2xl font-bold text-[#6b7f94] mt-2">
          Page Not Found
        </h2>
        <p className="text-sm md:text-base text-[#6b7f94] mt-1 max-w-sm">
          Oops! Looks like you got lost. The page you are looking for doesn't exist.
        </p>
        <Link
          href="/"
          className="mt-8 bg-[#1cb0f6] hover:bg-[#18a0e0] active:translate-y-[2px] text-white font-extrabold text-[15px] tracking-[0.08em] uppercase rounded-xl px-8 h-[52px] shadow-[0_4px_0_#0e7ab5] active:shadow-none transition-all cursor-pointer flex items-center justify-center"
        >
          GO HOME
        </Link>
      </div>
    </div>
  );
}
