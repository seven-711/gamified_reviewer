"use client";

import React from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";

const NAV_ITEMS = [
  { name: "LEARN", href: "/dashboard", icon: "/emoji/learn.png" },
  { name: "LEADERBOARDS", href: "/leaderboard", icon: "/emoji/leaderboard.png" },
  { name: "QUESTS", href: "#", icon: "/emoji/quest.png" },
  { name: "SHOP", href: "#", icon: "/emoji/shop.png" },
  { name: "PROFILE", href: "/profile", icon: "/emoji/profile.png" },
];

export default function LeftSidebar() {
  const pathname = usePathname();

  return (
    <div className="flex flex-col w-full h-full pt-8 px-4">
      <div className="pl-4 mb-5 mt-5">
        <h1 className="font-feather text-[28px] font-bold text-duo-green tracking-wide">
          REVIEWQO
        </h1>
      </div>

      <nav className="flex flex-col gap-2">
        {NAV_ITEMS.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.name}
              href={item.href}
              className={`flex items-center gap-4 px-4 py-3 rounded-2xl border-2 transition-colors ${
                isActive
                  ? "bg-duo-green-light border-sky-blue text-sky-blue"
                  : "border-transparent text-charcoal hover:bg-duo-green-light hover:border-cloud-gray"
              }`}
            >
              <div className="w-13 h-13 relative shrink-0">
                <Image
                  src={item.icon}
                  alt={item.name}
                  fill
                  className="object-contain"
                  unoptimized
                />
              </div>
              <span className="font-extrabold tracking-wider text-[12px]">
                {item.name}
              </span>
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
