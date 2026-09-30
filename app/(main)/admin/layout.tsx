"use client";

import React from "react";
import Link from "next/link";
import { useAuth } from "@/lib/auth";
import { checkIsAdmin } from "@/lib/admin";
import Rive from "@rive-app/react-canvas";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, isLoaded, isSignedIn } = useAuth();

  if (!isLoaded) {
    return null;
  }

  const isAdmin = isSignedIn && checkIsAdmin(user);

  // 403 Forbidden Error Code & Message
  if (!isAdmin) {
    return (
      <div className="flex-1 w-full min-h-[60vh] flex flex-col items-center justify-center text-center px-4 font-din-round">
        
        <h1 className="text-4xl md:text-6xl font-black text-charcoal tracking-tight font-feather mt-[-2rem]">
          403
        </h1>
        <h2 className="text-xl md:text-2xl font-bold text-graphite mt-2">
          Forbidden
        </h2>
        <p className="text-sm md:text-base text-silver mt-1">
          Access to this page is restricted.
        </p>
      </div>
    );
  }

  return (
    <div className="w-full flex flex-col">
      {/* Admin Personnel Badge Top Bar */}
      <div className="w-full bg-[#131f2e] text-white border-b-2 border-[#2e4057] px-4 py-2 flex items-center justify-between text-xs font-bold tracking-wide">
        <div className="flex items-center gap-2">
          <span className="bg-duo-green text-white text-[10px] font-black uppercase px-2 py-0.5 rounded shadow-sm">
            ADMIN
          </span>
          <span className="text-slate-300">
            System Administration Console
          </span>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-slate-400 font-mono text-[11px] hidden sm:inline-block">
            {user?.email}
          </span>
          <Link
            href="/dashboard"
            className="text-sky-blue hover:underline text-[11px] uppercase tracking-wider"
          >
            Exit to Learn →
          </Link>
        </div>
      </div>

      {children}
    </div>
  );
}

