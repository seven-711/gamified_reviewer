"use client";

import React from "react";
import Image from "next/image";
import Link from "next/link";

export default function LeaderboardPage() {
  return (
    <>
      {/* Center Column */}
      <main className="flex-1 w-full max-w-[600px] mx-auto pb-24 flex flex-col items-center pt-10 md:pt-20 px-4">
        <div className="w-full flex justify-center mb-6 relative">
           <div className="w-48 h-48 relative">
             <Image src="/emoji/unlockleaderboard.webp" alt="Unlock Leaderboard" fill className="object-contain" unoptimized />
           </div>
        </div>
        
        <h2 className="font-feather text-xl md:text-2xl text-white font-bold mb-4 text-center">Unlock Leaderboards!</h2>
        
        <p className="text-silver text-[14px] md:text-[17px] font-medium mb-8 text-center">
          Complete 1 more lesson to start competing
        </p>
        
        <Link 
          href="/dashboard"
          className="bg-duo-green-light border-2 border-cloud-gray text-sky-blue font-bold px-10 py-3.5 rounded-2xl hover:bg-[#293c45] transition-colors shadow-[0_3px_0_#131f24] uppercase tracking-widest text-body"
        >
          Start a Lesson
        </Link>
 
        {/* Mock Leaderboard list */}
        <div className="w-full max-w-[400px] mt-16 flex flex-col gap-6 opacity-40 pointer-events-none">
           {[...Array(5)].map((_, i) => (
             <div key={i} className="flex items-center gap-6 border-b-2 border-cloud-gray pb-4">
                <div className="w-12 h-12 rounded-full bg-cloud-gray shrink-0"></div>
                <div className="h-4 w-32 bg-cloud-gray rounded-full"></div>
             </div>
           ))}
        </div>
      </main>
 
      {/* Right Sidebar */}
      <aside className="hidden lg:block w-[368px] shrink-0 pt-8">
        <div className="border-2 border-cloud-gray rounded-2xl p-6 flex flex-col gap-5">
          <h3 className="font-extrabold text-[17px] text-silver uppercase tracking-wider">What are Leaderboards?</h3>
          <h2 className="font-feather text-2xl text-duo-green font-bold leading-snug">
            Do lessons. Earn XP. Compete.
          </h2>
          <p className="text-silver text-body font-medium leading-relaxed">
            Earn XP through lessons, then compete with players in a weekly leaderboard
          </p>
          <div className="w-full flex justify-end mt-4">
            <div className="w-36 h-36 relative mt-2">
              <Image src="/emoji/hmm.webp" alt="Mascot" fill className="object-contain" unoptimized />
            </div>
          </div>
        </div>
      </aside>
    </>
  );
}
