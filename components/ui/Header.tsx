"use client";

import Image from "next/image";
import Link from "next/link";
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/Button";
import { useUser, UserButton } from "@clerk/nextjs";
import { useStats } from "@/components/ui/StatsContext";
import { usePathname } from "next/navigation";

export function Header() {
  const pathname = usePathname();
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMounted, setIsMounted] = useState(false);
  const { streak, xp, hearts, gems, isLoaded: isStatsLoaded } = useStats();
  const { user, isLoaded, isSignedIn } = useUser();

  useEffect(() => {
    setIsMounted(true);
  }, []);

  const hasGuestSession = typeof window !== "undefined" && !!localStorage.getItem("guest_session_id");
  const showStats = isMounted && isLoaded && (isSignedIn || hasGuestSession);

  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 350) {
        setIsScrolled(true);
      } else {
        setIsScrolled(false);
      }
    };

    window.addEventListener("scroll", handleScroll);
    handleScroll();
    return () => {
      window.removeEventListener("scroll", handleScroll);
    };
  }, []);

  return (
    <header className="sticky top-0 z-50 w-full bg-snow-white shadow-sm border-b-2 border-cloud-gray">
      <div className="w-full flex items-center justify-between px-5 max-w-[1200px] mx-auto py-2">
        <Link href={isSignedIn ? "/dashboard" : "/"} className="flex items-center gap-2 hover:opacity-90 transition-opacity">
          {/* Logo */}
          <div className="relative w-18 h-18 sm:w-20 sm:h-20 shrink-0">
            <Image
              src="/reviewer_logo.webp"
              alt="ReviewQo Logo"
              fill
              sizes="(max-width: 640px) 72px, 80px"
              className="object-contain drop-shadow-sm hover:scale-105 transition-transform"
            />
          </div>
          {/* Desktop Title */}
          <h1 className="hidden md:block font-feather text-xl sm:text-2xl text-duo-green tracking-wide">
            REVIEWQO
          </h1>
          {/* Mobile Title */}
          {!isScrolled && (
            <h1 className="md:hidden font-feather text-xl sm:text-2xl text-duo-green tracking-wide">
              REVIEWQO
            </h1>
          )}
        </Link>
        {!isMounted ? null : (
          <div className="grid grid-cols-1 grid-rows-1 items-center justify-items-end">
            {/* Button (Fades in when scrolled) */}
            <div className={`col-start-1 row-start-1 transition-all duration-300 transform ${isScrolled ? 'opacity-100 translate-y-0 pointer-events-auto' : 'opacity-0 -translate-y-2 pointer-events-none'}`}>
              {isLoaded && isSignedIn ? (
                <Link href="/dashboard">
                  <Button variant="primary" className="text-caption sm:text-body h-[40px] w-[150px] sm:h-[46px] px-6 sm:px-8 tracking-normal shadow-[0_4px_0_#3f8f01]">
                    DASHBOARD
                  </Button>
                </Link>
              ) : isLoaded ? (
                <Link href="/onboarding">
                  <Button variant="primary" className="text-caption sm:text-body h-[40px] w-[150px] sm:h-[46px] px-6 sm:px-8 tracking-normal shadow-[0_4px_0_#3f8f01]">
                    GET STARTED
                  </Button>
                </Link>
              ) : null}
            </div>

            {/* Right Action/Stats (Fades out when scrolled) */}
            <div className={`col-start-1 row-start-1 flex items-center gap-4 transition-all duration-300 transform ${isScrolled ? 'opacity-0 translate-y-2 pointer-events-none' : 'opacity-100 translate-y-0 pointer-events-auto'}`}>
              {showStats ? (
                <div className="flex items-center gap-3 sm:gap-4 font-bold text-sm tracking-wide">
                  {isStatsLoaded && (
                    <>
                      {/* Mobile stats (visible on mobile only, hidden on desktop, except on landing page) */}
                      {pathname !== "/" && (
                        <div className="flex sm:hidden items-center gap-3 mr-1">
                          <div title="Streak" className="flex items-center gap-1 cursor-help select-none">
                            <Image
                              src="/img/gen_imgs/streak.webp"
                              alt="Streak"
                              width={22}
                              height={22}
                              className="object-contain"
                            />
                            <span className="text-orange-500 font-extrabold text-sm">{streak}</span>
                          </div>
                          <div title="Hearts" className="flex items-center gap-1 cursor-help select-none text-red-500">
                            <Image
                              src="/img/gen_imgs/user_life.webp"
                              alt="Hearts"
                              width={22}
                              height={22}
                              className="object-contain"
                            />
                            <span className="font-extrabold text-sm">{hearts}</span>
                          </div>
                          <div title="Gems" className="flex items-center gap-1 cursor-help select-none">
                            <Image
                              src="/img/gen_imgs/diamond.webp"
                              alt="Gems"
                              width={22}
                              height={22}
                              className="object-contain"
                            />
                            <span className="text-blue-400 font-extrabold text-sm">{gems}</span>
                          </div>
                        </div>
                      )}

                      {/* Desktop stats (hidden on mobile, visible on desktop) */}
                      <div className="hidden sm:flex items-center gap-6 border-l pl-5 border-cloud-gray">
                        <div title="Streak" className="flex items-center gap-2 cursor-help select-none">
                          <Image
                            src="/img/gen_imgs/streak.webp"
                            alt="Streak"
                            width={32}
                            height={32}
                            className="object-contain"
                          />
                          <span className="text-orange-500 font-black text-lg">{streak}</span>
                        </div>
                        <div title="XP" className="flex items-center gap-2 cursor-help select-none">
                          <Image
                            src="/img/gen_imgs/exp.webp"
                            alt="XP"
                            width={32}
                            height={32}
                            className="object-contain"
                          />
                          <span className="text-amber-500 font-black text-lg">{xp} XP</span>
                        </div>
                        <div title="Gems" className="flex items-center gap-2 cursor-help select-none">
                          <Image
                            src="/img/gen_imgs/diamond.webp"
                            alt="Gems"
                            width={32}
                            height={32}
                            className="object-contain"
                          />
                          <span className="text-blue-400 font-black text-lg">{gems}</span>
                        </div>
                      </div>
                    </>
                  )}
                  {isSignedIn && user ? (
                    <div className="relative w-9 h-9 sm:w-10 sm:h-10 cursor-pointer">
                      {/* Custom gamified avatar */}
                      <div className="absolute inset-0 rounded-full overflow-hidden border-2 border-cloud-gray hover:border-sky-blue transition-colors bg-duo-green-light p-0.5 flex items-center justify-center">
                        <img src={user.hasImage ? user.imageUrl : "/emoji/profile.webp"} alt="Profile" className={`object-cover w-full h-full ${!user.hasImage && 'rounded-full'}`} />
                      </div>
                      {/* Invisible Clerk UserButton overlay to capture clicks and show the dropdown popup */}
                      <div className="absolute inset-0 opacity-0 z-10">
                        <UserButton appearance={{ elements: { rootBox: "w-full h-full flex", userButtonTrigger: "w-full h-full flex", userButtonAvatarBox: "w-full h-full" } }} />
                      </div>
                    </div>
                  ) : (
                    <Link href="/signup" title="Create a profile to save progress!" className="relative w-9 h-9 sm:w-10 sm:h-10 cursor-pointer block hover:scale-105 transition-transform">
                      <div className="absolute inset-0 rounded-full overflow-hidden border-2 border-cloud-gray hover:border-sky-blue transition-colors bg-duo-green-light p-0.5 flex items-center justify-center">
                        <img src="/emoji/profile.webp" alt="Guest Profile" className="object-cover w-full h-full rounded-full" />
                      </div>
                    </Link>
                  )}
                </div>
              ) : isLoaded ? (
                <div className="hidden sm:flex items-center gap-2 text-silver font-bold text-sm tracking-wide cursor-pointer hover:text-graphite">
                  <span>SITE LANGUAGE: ENGLISH</span>
                  <span className="text-xs">▼</span>
                </div>
              ) : null}
            </div>
          </div>
        )}
      </div>
    </header>
  );
}
