"use client";

import React from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";

const NAV_ITEMS = [
  { name: "LEARN", href: "/dashboard", icon: "/emoji/learn.webp" },
  { name: "LEADERBOARD", href: "/leaderboard", icon: "/emoji/leaderboard.webp" },
  { name: "QUESTS", href: "/quests", icon: "/emoji/quest.webp" },
  { name: "SHOP", href: "/shop", icon: "/emoji/shop.webp" },
  { name: "PROFILE", href: "/profile", icon: "/emoji/profile.webp" },
  { name: "ADMIN", href: "/admin", icon: "/emoji/guidebook.webp" },
];

export default function MobileNavbar() {
  const pathname = usePathname();

  return (
    <div className="md:hidden fixed bottom-0 left-0 right-0 h-[72px] bg-snow-white border-t-2 border-cloud-gray z-40 flex items-center justify-around px-2 pb-safe">
      {NAV_ITEMS.map((item) => {
        const isActive = pathname === item.href;
        return (
          <Link
            key={item.name}
            href={item.href}
            className="flex flex-col items-center justify-center grow py-1 relative cursor-pointer gap-0.5"
          >
            <div className={`relative transition-all duration-150 ${
              isActive ? "w-7 h-7 scale-110" : "w-6 h-6 grayscale opacity-50 hover:grayscale-0 hover:opacity-85"
            }`}>
              <Image
                src={item.icon}
                alt={item.name}
                fill
                className="object-contain"
                unoptimized
              />
            </div>
            
            <span className={`text-[8px] min-[360px]:text-[9px] font-extrabold tracking-tight min-[360px]:tracking-wider uppercase transition-all duration-150 ${
              isActive ? "text-sky-blue font-black scale-105" : "text-silver"
            }`}>
              {item.name}
            </span>

            {/* Active Indicator Bar */}
            {isActive && (
              <div className="absolute bottom-0 w-10 h-1 bg-sky-blue rounded-full"></div>
            )}
          </Link>
        );
      })}
    </div>
  );
}
