"use client";

import React from "react";
import Image from "next/image";
import Link from "next/link";
import { useStats } from "@/components/ui/StatsContext";
import { useUser, UserButton } from "@clerk/nextjs";
import { StreakAsset } from "@/components/ui/StreakAsset";

export default function MobileHeader() {
  const { streak, hearts, gems, isLoaded: isStatsLoaded } = useStats();
  const { user, isLoaded, isSignedIn } = useUser();

  return (
    <header className="md:hidden fixed top-0 left-0 right-0 h-14 bg-snow-white dark:bg-[#202f36] border-b-2 border-cloud-gray dark:border-cloud-gray/15 z-40 flex items-center justify-between px-4 shadow-sm font-din-round">
      {/* Left: Brand Logo & Title */}
      <Link href="/dashboard" className="flex items-center gap-1.5 active:scale-95 transition-transform">
        <span className="font-feather text-lg text-duo-green tracking-wide">
          REVIEWQO
        </span>
      </Link>

      {/* Right: Stats (Streak, Hearts, Gems, Profile) */}
      <div className="flex items-center gap-3.5 font-bold text-sm select-none">
        {isStatsLoaded && (
          <>
            {/* Streak */}
            <div title="Streak" className="flex items-center gap-1">
              <StreakAsset
                streak={streak}
                width={22}
                height={22}
                className="object-contain"
              />
              <span className="text-orange-500 font-extrabold text-sm">{streak}</span>
            </div>

            {/* Hearts */}
            <div title="Hearts" className="flex items-center gap-1 text-red-500">
              <Image
                src="/img/gen_imgs/user_life.webp"
                alt="Hearts"
                width={18}
                height={18}
                className="object-contain"
                style={{ height: 'auto' }}
              />
              <span className="font-extrabold text-sm">{hearts}</span>
            </div>

            {/* Gems */}
            <div title="Gems" className="flex items-center gap-1">
              <Image
                src="/img/gen_imgs/diamond.webp"
                alt="Gems"
                width={22}
                height={22}
                className="object-contain"
              />
              <span className="text-blue-400 font-extrabold text-sm">{gems}</span>
            </div>
          </>
        )}

        {/* Profile Avatar */}
        {isLoaded && isSignedIn && user ? (
          <div className="relative w-7 h-7 shrink-0 cursor-pointer">
            <div className="absolute inset-0 rounded-full overflow-hidden border border-cloud-gray dark:border-cloud-gray/25 bg-duo-green-light p-0.5 flex items-center justify-center">
              <img src={user.imageUrl} alt="Profile" className="object-cover w-full h-full rounded-full" />
            </div>
            <div className="absolute inset-0 opacity-0 z-10">
              <UserButton appearance={{ elements: { rootBox: "w-full h-full flex", userButtonTrigger: "w-full h-full flex", userButtonAvatarBox: "w-full h-full" } }} />
            </div>
          </div>
        ) : (
          <Link href="/profile" className="relative w-7 h-7 shrink-0 block">
            <div className="absolute inset-0 rounded-full overflow-hidden border border-cloud-gray dark:border-cloud-gray/25 bg-duo-green-light p-0.5 flex items-center justify-center">
              <img src="/emoji/profile.webp" alt="Guest" className="object-cover w-full h-full rounded-full" />
            </div>
          </Link>
        )}
      </div>
    </header>
  );
}
