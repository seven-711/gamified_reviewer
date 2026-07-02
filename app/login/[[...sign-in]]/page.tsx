"use client";

import { SignIn } from "@clerk/nextjs";
import Link from "next/link";

export default function LoginPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-white px-6 py-12 font-din-round">
      <div className="w-full max-w-[400px] flex flex-col items-center">
        {/* Logo/Title */}
        <Link href="/" className="mb-8 flex items-center gap-2 transition-transform hover:scale-105">
          <h1 className="font-feather text-3xl font-bold text-duo-green tracking-wide">
            ALL IN ONE
          </h1>
        </Link>
        
        <SignIn 
          routing="path"
          path="/login"
          appearance={{
            elements: {
              card: "rounded-2xl border-2 border-[#e5e5e5] shadow-sm",
              headerTitle: "text-2xl font-bold text-[#3c3c3c]",
              headerSubtitle: "text-[#777777]",
              formButtonPrimary: "bg-[#58cc02] hover:bg-[#46a302] text-white shadow-[0_4px_0_#3f8f01] rounded-xl h-[50px] font-bold text-body",
              formFieldInput: "rounded-xl border-2 border-[#e5e5e5] h-[50px] px-4 font-medium",
              formFieldLabel: "font-bold text-[#4b4b4b] uppercase tracking-wider text-sm",
              footerActionLink: "text-[#1cb0f6] hover:underline font-bold",
            }
          }}
        />
      </div>
    </div>
  );
}
