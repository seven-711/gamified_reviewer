"use client";

import React from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";

const NAV_ITEMS = [
  { name: "LEARN", href: "/dashboard", icon: "/emoji/learn.webp" },
  { name: "LEADERBOARDS", href: "/leaderboard", icon: "/emoji/leaderboard.webp" },
  { name: "QUESTS", href: "/quests", icon: "/emoji/quest.webp" },
  { name: "SHOP", href: "/shop", icon: "/emoji/shop.webp" },
  { name: "PROFILE", href: "/profile", icon: "/emoji/profile.webp" },
];

export default function MobileNavbar() {
  const pathname = usePathname();

  return (
    <div className="md:hidden fixed bottom-0 left-0 right-0 h-[68px] bg-snow-white border-t-2 border-cloud-gray z-40 flex items-center justify-around px-2 pb-safe">
      {NAV_ITEMS.map((item) => {
        const isActive = pathname === item.href;
        return (
          <Link
            key={item.name}
            href={item.href}
            className="flex flex-col items-center justify-center grow py-1 relative cursor-pointer"
          >
            <div className={`relative transition-all duration-150 ${
              isActive ? "w-8 h-8 scale-110" : "w-7 h-7 hover:scale-105"
            }`}>
              <Image
                src={item.icon}
                alt={item.name}
                fill
                className="object-contain"
                unoptimized
              />
            </div>
            
            {/* Active Indicator Bar */}
            {isActive && (
              <div className="absolute bottom-0 w-8 h-1 bg-sky-blue rounded-full"></div>
            )}
          </Link>
        );
      })}
    </div>
  );
}
