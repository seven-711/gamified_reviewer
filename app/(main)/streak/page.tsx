"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { useStats } from "@/components/ui/StatsContext";
import { useUser } from "@clerk/nextjs";
import { supabase } from "@/lib/supabase";

export default function StreakPage() {
  const router = useRouter();
  const { streak, lastLessonDate, refreshStats } = useStats();
  const { user, isLoaded, isSignedIn } = useUser();
  const [createdAt, setCreatedAt] = useState<Date | null>(null);

  // Calendar state
  const [currentMonth, setCurrentMonth] = useState(new Date());

  useEffect(() => {
    async function fetchCreatedAt() {
      if (isSignedIn && user) {
        const { data, error } = await supabase
          .from("profiles")
          .select("created_at")
          .eq("id", user.id)
          .maybeSingle();
        if (data && data.created_at) {
          setCreatedAt(new Date(data.created_at));
        } else {
          setCreatedAt(new Date()); // fallback
        }
      }
    }
    fetchCreatedAt();
  }, [isSignedIn, user]);

  // Compute the set of Date strings (YYYY-MM-DD) that are part of the active streak
  const activeStreakDays = new Set<string>();
  if (streak > 0 && lastLessonDate) {
    const end = new Date(lastLessonDate);
    const [y, m, d] = lastLessonDate.split("-").map(Number);
    const endDt = new Date(y, m - 1, d);
    
    for (let i = 0; i < streak; i++) {
      const dt = new Date(endDt);
      dt.setDate(dt.getDate() - i);
      const str = `${dt.getFullYear()}-${String(dt.getMonth() + 1).padStart(2, '0')}-${String(dt.getDate()).padStart(2, '0')}`;
      activeStreakDays.add(str);
    }
  }

  const handlePrevMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1));
  };

  const handleNextMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1));
  };

  const getDaysInMonth = (year: number, month: number) => {
    return new Date(year, month + 1, 0).getDate();
  };

  const generateCalendar = () => {
    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth();
    const daysInMonth = getDaysInMonth(year, month);
    const firstDay = new Date(year, month, 1).getDay();

    const days = [];
    for (let i = 0; i < firstDay; i++) {
      days.push(null);
    }
    for (let i = 1; i <= daysInMonth; i++) {
      days.push(new Date(year, month, i));
    }
    return days;
  };

  const daysOfWeek = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"];
  const monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

  return (
    <main className="min-h-screen bg-[#131f24] text-white flex flex-col font-din-round pb-16 w-full max-w-[600px] mx-auto animate-[fadeIn_0.3s_ease-out]">
      {/* Orange Header Area */}
      <div className="bg-[#f89e1b] flex flex-col items-center justify-center pt-8 pb-10 px-6 rounded-b-[40px] shadow-lg relative">
        <button 
          onClick={() => router.back()} 
          className="absolute top-6 left-6 text-white hover:opacity-80 transition-opacity font-bold text-xl p-2 z-10 cursor-pointer"
        >
          ✕
        </button>
        <div className="absolute top-6 right-6 text-white hover:opacity-80 transition-opacity p-2 z-10 cursor-pointer">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8"></path>
            <polyline points="16 6 12 2 8 6"></polyline>
            <line x1="12" y1="2" x2="12" y2="15"></line>
          </svg>
        </div>

        <div className="bg-white/20 text-white font-bold text-[10px] uppercase tracking-widest px-3 py-1 rounded-full mb-6">
          Streak Society
        </div>

        <div className="flex items-center gap-6 mb-4">
          <div className="flex flex-col items-center">
            <span className="text-6xl font-feather font-black text-white drop-shadow-md tracking-tighter">
              {streak}
            </span>
            <span className="text-xl font-bold font-feather tracking-wide">
              day streak!
            </span>
          </div>
          <div className="w-24 h-24 relative drop-shadow-xl animate-[pulse_3s_infinite]">
            <Image
              src="/img/gen_imgs/Streak/streak_freeze.webp" // fallback if flame isn't perfect
              alt="Streak Flame"
              fill
              className="object-contain filter sepia hue-rotate-[-30deg] saturate-[3] contrast-[1.2]" 
              unoptimized
              onError={(e) => {
                e.currentTarget.style.display = 'none';
              }}
            />
            {/* Visual fallback flame icon if image not found */}
            <div className="absolute inset-0 bg-orange-400 rounded-full blur-xl opacity-50 z-[-1]" />
          </div>
        </div>

        {/* Milestone Card */}
        <div className="bg-[#18252d] w-full rounded-2xl p-4 mt-2 flex items-center gap-3 border border-[#35454e] shadow-xl transform translate-y-8 relative z-20">
          <div className="text-2xl">🌟</div>
          <p className="text-sm font-semibold text-gray-200">
            You've extended your streak consistently! Keep up the great work this week!
          </p>
        </div>
      </div>

      <div className="px-5 pt-16 flex flex-col gap-8">
        
        {/* Streak Calendar */}
        <div className="flex flex-col gap-4">
          <h2 className="text-xl font-bold font-feather tracking-wide text-white">Streak Calendar</h2>
          <div className="bg-[#18252d] border border-[#35454e] rounded-[24px] p-5 shadow-sm">
            
            <div className="flex items-center justify-between mb-4">
              <button onClick={handlePrevMonth} className="text-gray-400 hover:text-white p-2">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6"></polyline></svg>
              </button>
              <h3 className="font-bold text-sm tracking-wider uppercase text-gray-200">
                {monthNames[currentMonth.getMonth()]} {currentMonth.getFullYear()}
              </h3>
              <button onClick={handleNextMonth} className="text-gray-400 hover:text-white p-2">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 18 15 12 9 6"></polyline></svg>
              </button>
            </div>

            <div className="grid grid-cols-7 gap-1 text-center mb-2">
              {daysOfWeek.map((day) => (
                <div key={day} className="text-xs font-bold text-gray-500 uppercase">{day}</div>
              ))}
            </div>

            <div className="grid grid-cols-7 gap-y-3 gap-x-1">
              {generateCalendar().map((date, i) => {
                if (!date) return <div key={i} className="h-8"></div>;

                const dateStr = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
                const isActive = activeStreakDays.has(dateStr);
                const isFuture = date.getTime() > new Date().getTime();

                return (
                  <div key={i} className="flex justify-center items-center h-8 relative">
                    {/* Continuous pill background for adjacent active days could be added here, but simple circles for now */}
                    <div 
                      className={`w-8 h-8 flex items-center justify-center rounded-full font-bold text-sm z-10 transition-colors ${
                        isActive 
                          ? "bg-[#f89e1b] text-white border-2 border-[#d77800] shadow-[0_2px_0_#d77800]" 
                          : isFuture 
                            ? "text-gray-600" 
                            : "text-gray-400"
                      }`}
                    >
                      {date.getDate()}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Streak Challenge */}
        <div className="flex flex-col gap-4">
          <h2 className="text-xl font-bold font-feather tracking-wide text-white">Streak Challenge</h2>
          <div className="bg-[#18252d] border border-[#35454e] rounded-[24px] p-5 shadow-sm">
            <div className="flex justify-between items-center mb-3">
              <span className="font-bold text-sm text-gray-200">14-day Challenge</span>
              <span className="text-xs font-bold text-gray-400">Day {streak % 14 || (streak > 0 ? 14 : 0)} of 14</span>
            </div>
            <div className="w-full bg-[#202f36] rounded-full h-4 border border-[#35454e] overflow-hidden relative">
              <div 
                className="bg-[#f89e1b] h-full transition-all duration-500"
                style={{ width: `${((streak % 14 || (streak > 0 ? 14 : 0)) / 14) * 100}%` }}
              ></div>
            </div>
          </div>
        </div>

        {/* Streak Society */}
        <div className="flex flex-col gap-4 pb-6">
          <h2 className="text-xl font-bold font-feather tracking-wide text-white">Streak Society</h2>
          <div className="flex flex-col gap-3">
            
            <div className="bg-[#18252d] border border-[#35454e] rounded-[24px] p-4 flex gap-4 items-center shadow-sm cursor-pointer hover:bg-[#1d2d36] transition-colors" onClick={() => router.push('/shop')}>
              <div className="w-14 h-14 bg-gradient-to-br from-[#ff8c00] to-[#ff5000] rounded-xl flex items-center justify-center shrink-0 shadow-inner">
                <span className="text-3xl">🔥</span>
              </div>
              <div className="flex flex-col">
                <h4 className="font-bold text-white text-sm">New App Icon</h4>
                <p className="text-xs text-gray-400 mt-1">Show off your streak status with this app icon.</p>
                <span className="text-[#38bdf8] font-bold text-xs uppercase tracking-wider mt-2">Turn Off</span>
              </div>
            </div>

            <div className="bg-[#18252d] border border-[#35454e] rounded-[24px] p-4 flex gap-4 items-center shadow-sm cursor-pointer hover:bg-[#1d2d36] transition-colors" onClick={() => router.push('/shop')}>
              <div className="w-14 h-14 relative shrink-0">
                <Image
                  src="/img/gen_imgs/Streak/streak_freeze.webp"
                  alt="Extra Freezes"
                  fill
                  className="object-contain"
                  unoptimized
                />
              </div>
              <div className="flex flex-col">
                <h4 className="font-bold text-white text-sm">3 Extra Freezes</h4>
                <p className="text-xs text-gray-400 mt-1">Additional protection for your streak if you miss a day.</p>
                <span className="text-orange-400 font-bold text-xs uppercase tracking-wider mt-2">Refills in 20 days</span>
              </div>
            </div>

          </div>
        </div>

      </div>
    </main>
  );
}
