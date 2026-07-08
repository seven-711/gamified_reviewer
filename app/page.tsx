"use client";

import React from "react";
import Link from "next/link";
import { Button } from "@/components/ui/Button";
import Image from "next/image";
import { Header } from "@/components/ui/Header";
import { useUser } from "@clerk/nextjs";

export default function LandingPage() {
  const { isSignedIn, isLoaded } = useUser();

  return (
    <div className="flex flex-col min-h-screen bg-snow-white text-almost-black font-din-round">
      <Header />

      {/* Hero Wrapper to fill screen */}
      <div className="flex flex-col min-h-[calc(100vh-72px)] w-full">
        {/* Main Hero Section */}
        <main className="grow flex flex-col items-center justify-center w-full px-6 py-6 sm:py-12 md:py-0 relative">
          <div className="max-w-[1024px] w-full mx-auto grid grid-cols-1 md:grid-cols-2 gap-6 sm:gap-12 items-center">

            {/* Left Column: Illustration */}
            <div className="flex justify-center md:justify-end items-center relative h-[220px] sm:h-[300px] md:h-[400px] w-full">
              <Image
                src="/hero_img.webp"
                alt="Playful floating characters"
                fill
                sizes="(max-width: 768px) 100vw, 500px"
                className="object-contain"
                priority
              />
            </div>

            {/* Right Column: Copy & Actions */}
            <div className="flex flex-col items-center text-center max-w-[420px] mx-auto md:mx-0">
              <h1 className="font-din-round font-black text-[38px] sm:text-3xl md:text-heading text-charcoal leading-tight mb-6 sm:mb-10 px-2 sm:px-0">
                The free, fun, and effective way to pass the Civil Service Exam!
              </h1>

            <div className="flex flex-col w-full gap-4 max-w-[330px]">
              {isLoaded && isSignedIn ? (
                <Link href="/dashboard" className="w-full pb-6">
                  <Button variant="primary" fullWidth className="text-body h-[50px] shadow-[0_4px_0_#3f8f01]">
                    GO TO DASHBOARD
                  </Button>
                </Link>
              ) : isLoaded ? (
                <>
                  <Link href="/onboarding" className="w-full">
                    <Button variant="primary" fullWidth className="text-body h-[50px] tracking-normal shadow-[0_4px_0_#3f8f01]">
                      GET STARTED
                    </Button>
                  </Link>

                  <Link href="/login" className="w-full pb-6">
                    <Button variant="secondary" fullWidth className="text-body h-[50px] border-2 tracking-normal border-cloud-gray text-sky-blue shadow-[0_4px_0_var(--color-cloud-gray)]">
                      I ALREADY HAVE AN ACCOUNT
                    </Button>
                  </Link>
                </>
              ) : null}
            </div>
          </div>
        </div>
      </main>

      {/* Hero Section Footer Carousel / Subjects */}
      <footer className="w-full border-t-2 mb-7 border-cloud-gray bg-white shrink-0">
        <div className="max-w-[1200px] mx-auto px-6 py-6 overflow-x-auto whitespace-nowrap hide-scrollbar flex items-center justify-center gap-8 md:gap-12">
          {/* Left Arrow */}
          <button className="text-cloud-gray hover:text-silver transition-colors px-2 hidden md:block">
            <span className="text-xl font-bold">{"<"}</span>
          </button>

          {/* Subject Items */}
          <div className="flex items-center gap-8 md:gap-12">
            <div className="flex items-center gap-2 cursor-pointer opacity-70 hover:opacity-100 transition-opacity">
              <Image
                src="/img/gen_imgs/language.webp"
                alt="English Icon"
                width={28}
                height={28}
                className="object-contain"
              />
              <span className="font-din-round font-bold text-graphite uppercase tracking-wide text-sm">ENGLISH</span>
            </div>

            <div className="flex items-center gap-2 cursor-pointer opacity-70 hover:opacity-100 transition-opacity">
              <Image
                src="/img/gen_imgs/math.webp"
                alt="Math Icon"
                width={28}
                height={28}
                className="object-contain"
              />
              <span className="font-din-round font-bold text-graphite uppercase tracking-wide text-sm">MATH</span>
            </div>

            <div className="flex items-center gap-2 cursor-pointer opacity-70 hover:opacity-100 transition-opacity">
              <Image
                src="/img/gen_imgs/logical.webp"
                alt="Logic Icon"
                width={28}
                height={28}
                className="object-contain"
              />
              <span className="font-din-round font-bold text-graphite uppercase tracking-wide text-sm">LOGIC</span>
            </div>

            <div className="flex items-center gap-2 cursor-pointer opacity-70 hover:opacity-100 transition-opacity">
              <Image
                src="/img/gen_imgs/gen_info.webp"
                alt="General Info Icon"
                width={28}
                height={28}
                className="object-contain"
              />
              <span className="font-din-round font-bold text-graphite uppercase tracking-wide text-sm">GEN INFO</span>
            </div>
          </div>

          {/* Right Arrow */}
          <button className="text-cloud-gray hover:text-silver transition-colors px-2 hidden md:block">
            <span className="text-xl font-bold">{">"}</span>
          </button>
        </div>
      </footer>
      </div>

      {/* "Free. Fun. Effective." Section */}
      <section className="w-full py-16 md:py-32 px-6 max-w-[1024px] mx-auto overflow-x-hidden">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-12 md:gap-24 items-center">
          
          {/* Left Text Column */}
          <div className="flex flex-col text-center md:text-left order-2 md:order-1 max-w-[540px] mx-auto md:mx-0">
            <h2 className="font-feather text-heading-lg text-duo-green leading-[1.1] mb-6 tracking-wide">
              Smart. Simple. Free.
            </h2>
            <p className="font-din-round text-[17px] text-graphite leading-relaxed">
              Learning becomes more engaging when it feels <span className="text-sky-blue font-bold hover:underline">interactive and rewarding</span>. With quick, bite-sized lessons, you can earn points, unlock new levels, and build real knowledge and skills along the way.
            </p>
          </div>

          {/* Right Phone Mockup Column */}
          <div className="flex justify-center items-center order-1 md:order-2 relative h-[400px]">
            {/* Phone Body */}
            <div className="w-[240px] h-[360px] bg-white border-4 border-[#e9ce75] rounded-[32px] shadow-[0_12px_24px_rgba(0,0,0,0.08)] relative p-5 flex flex-col gap-6 z-10">
              
              {/* Progress Bar */}
              <div className="w-full h-3 bg-cloud-gray rounded-full overflow-hidden mt-1">
                <div className="h-full bg-duo-green w-[40%] rounded-full shadow-inner"></div>
              </div>

              {/* Grid Items */}
              <div className="grid grid-cols-2 gap-4 grow mb-4">
                <div className="bg-[#f0f9ff] border-2 border-[#bae6fd] rounded-2xl flex items-center justify-center text-[40px] shadow-[0_4px_0_#bae6fd] transform transition-transform hover:-translate-y-1 cursor-pointer">📚</div>
                <div className="bg-[#f0fdf4] border-2 border-[#bbf7d0] rounded-2xl flex items-center justify-center text-[40px] shadow-[0_4px_0_#bbf7d0] transform transition-transform hover:-translate-y-1 cursor-pointer">🧠</div>
                <div className="bg-[#fefce8] border-2 border-[#fef08a] rounded-2xl flex items-center justify-center text-[40px] shadow-[0_4px_0_#fef08a] transform transition-transform hover:-translate-y-1 cursor-pointer">📝</div>
                <div className="bg-[#fff1f2] border-2 border-[#fecdd3] rounded-2xl flex items-center justify-center text-[40px] shadow-[0_4px_0_#fecdd3] transform transition-transform hover:-translate-y-1 cursor-pointer">⏱️</div>
              </div>
            </div>

            {/* VIP Barrier Element (Absolute positioned behind/next to phone) */}
            <div className="absolute bottom-2 right-[10%] sm:right-[5%] md:-right-4 flex flex-col items-center z-20 pointer-events-none">
               <div className="bg-sunshine-yellow text-snow-white font-feather font-bold px-6 py-2 rounded-xl text-2xl shadow-[0_4px_0_#d6a700] transform rotate-3 z-10 border-2 border-snow-white">
                 #1
               </div>
               <div className="w-24 h-3 bg-[#ff7b7b] rounded-full mt-2 transform rotate-[-15deg] shadow-sm relative left-10 z-0"></div>
               <div className="w-5 h-16 bg-sunshine-yellow rounded-t-full mt-[-10px] shadow-[0_2px_0_#d6a700] relative left-20 z-0 border-x-2 border-t-2 border-snow-white"></div>
            </div>
          </div>
        </div>
      </section>

      {/* "Trusted by Users" Section */}
      <section className="w-full py-18 mt-18 md:py-32 px-6 max-w-[1024px] mx-auto overflow-x-hidden">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-12 md:gap-24 items-center">
          
          {/* Left Illustration Column */}
          <div className="flex justify-center items-center order-1 relative h-[300px] md:h-[400px] w-full">
              <Image
                src="/trusted_users.webp"
                alt="Trusted by users illustration"
                fill
                sizes="(max-width: 768px) 100vw, 500px"
                className="object-contain"
              />
            </div>

          {/* Right Text Column */}
          <div className="flex flex-col text-center md:text-left order-2 max-w-[540px] mx-auto md:mx-0">
            <h2 className="font-feather text-heading-lg text-duo-green leading-[1.1] mb-6 tracking-wide">
              trusted by users
            </h2>
            <p className="font-din-round text-[17px] text-graphite leading-relaxed">
              Join thousands of aspiring professionals who are building real knowledge and mastering their exams with our engaging, community-loved content! Whether you&apos;re preparing for the Civil Service, AFPSAT, CET, or NAPOLCOM, we&apos;ve got you covered.
            </p>
          </div>

        </div>
      </section>

      {/* "Study Now" Final CTA Section */}
      <section className="w-full mt-30 md:pt-32 mb-30 flex flex-col items-center justify-center text-center overflow-hidden relative">
        <h2 className="font-feather text-heading sm:text-heading-lg md:text-display text-duo-green leading-[1.1] tracking-wide mb-8 z-10 px-6">
          Study now with<br/>REVIEWQO
        </h2>
        
        <Link href={isSignedIn ? "/dashboard" : "/signup"} className="z-10 mt-16 mb-8 w-[90%] max-w-[400px] sm:w-auto">
          <Button variant="primary" className="w-full sm:w-auto text-[17px] h-[54px] px-12 shadow-[0_4px_0_#3f8f01]">
            {isSignedIn ? "GO TO DASHBOARD" : "GET STARTED"}
          </Button>
        </Link>
      </section>
      
      {/* Hide scrollbar styles for footer */}
      <style dangerouslySetInnerHTML={{
        __html: `
        .hide-scrollbar::-webkit-scrollbar {
          display: none;
        }
        .hide-scrollbar {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
      `}} />
    </div>
  );
}
