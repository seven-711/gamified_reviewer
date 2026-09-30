"use client";

import React, { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import { useAuth } from "@/lib/auth";
import { checkIsAdmin } from "@/lib/admin";
import { RiveLoader } from "@/components/ui/RiveLoader";

// ─── Types ────────────────────────────────────────────────────────────────────

interface View1Row {
  profile_id: string;
  display_name: string;
  registered_at: string;
  exam_category: string | null;
  sub_topic: string | null;
  study_style: string;
  difficulty: string;
  timer_duration: number;
  total_score: number;
  current_level: number;
  lessons_completed: number;
  last_lesson_date: string | null;
}

interface View2Row {
  profile_id: string;
  display_name: string;
  total_score: number;
  lessons_completed: number;
  last_lesson_date: string | null;
  streak: number;
  streak_freeze_count: number;
  hearts: number;
  gems: number;
  last_heart_lost_at: string | null;
  league_name: string;
}

interface View3Row {
  profile_id: string;
  display_name: string;
  registered_at: string;
  exam_category: string | null;
  sub_topic: string | null;
  total_events: number;
  total_xp_earned: number;
  last_activity_at: string | null;
  first_activity_at: string | null;
}

interface ViewsData {
  viewSql: Record<string, string>;
  view1: View1Row[];
  view2: View2Row[];
  view3: View3Row[];
}

type ReportType = "view1" | "view2" | "view3";

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatDate(dateStr: string | null): string {
  if (!dateStr) return "—";
  const d = new Date(dateStr);
  return isNaN(d.getTime()) ? "—" : d.toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" });
}

function truncateText(s: string | null, maxLen = 22): string {
  if (!s) return "—";
  return s.length > maxLen ? s.slice(0, maxLen) + "…" : s;
}

const LEAGUE_BADGES: Record<string, { bg: string; text: string; border: string }> = {
  "Legend League": { bg: "bg-red-500/10", text: "text-red-600", border: "border-red-500/25" },
  "Champion League": { bg: "bg-pink-500/10", text: "text-pink-600", border: "border-pink-500/25" },
  "Master League": { bg: "bg-purple-500/10", text: "text-purple-600", border: "border-purple-500/25" },
  "Diamond League": { bg: "bg-sky-500/10", text: "text-sky-600", border: "border-sky-500/25" },
  "Crystal League": { bg: "bg-teal-500/10", text: "text-teal-600", border: "border-teal-500/25" },
  "Gold League": { bg: "bg-amber-500/10", text: "text-amber-600", border: "border-amber-500/25" },
  "Silver League": { bg: "bg-slate-500/10", text: "text-slate-600", border: "border-slate-500/25" },
  "Bronze League": { bg: "bg-rose-500/10", text: "text-rose-600", border: "border-rose-500/25" },
};

function getLeagueStyle(league: string) {
  return LEAGUE_BADGES[league] || { bg: "bg-cloud-gray/20", text: "text-silver", border: "border-cloud-gray" };
}

const REPORT_INFO: Record<
  ReportType,
  {
    title: string;
    viewName: string;
    description: string;
    sourceTables: string[];
    featureContext: string;
    accentColor: string;
  }
> = {
  view1: {
    title: "Full Profile Snapshot",
    viewName: "vw_user_full_profile",
    description: "Consolidates reviewer identity, study configuration, and module completion history into an operational summary.",
    sourceTables: ["profiles", "profile_study_settings", "profile_progress"],
    featureContext: "Profile management & learning analytics",
    accentColor: "sky-blue",
  },
  view2: {
    title: "Game Economy & Status",
    viewName: "vw_user_game_status",
    description: "Tracks active daily streaks, currency balances, life counters, and competitive league tiers across all candidates.",
    sourceTables: ["profiles", "profile_game_state", "profile_progress"],
    featureContext: "Economy balance & leaderboard standings",
    accentColor: "duo-green",
  },
  view3: {
    title: "Lesson Activity Audit",
    viewName: "vw_lesson_activity_summary",
    description: "Aggregates historical review event logs, drill volume, and XP progression with first and latest timestamps.",
    sourceTables: ["profiles", "lesson_events", "profile_study_settings"],
    featureContext: "Audit logs & syllabus completion telemetry",
    accentColor: "bubblegum-pink",
  },
};

// ─── Subcomponents ────────────────────────────────────────────────────────────

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);
  const handleCopy = () => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };
  return (
    <button
      onClick={handleCopy}
      className="px-2.5 py-1 text-[11px] font-extrabold rounded-lg bg-cloud-gray/20 hover:bg-cloud-gray/30 text-silver hover:text-charcoal border border-cloud-gray/40 transition-colors cursor-pointer shrink-0"
    >
      {copied ? "Copied" : "Copy SQL"}
    </button>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function SystemReportsPage() {
  const { user, isLoaded } = useAuth();
  const isAdmin = checkIsAdmin(user);

  const [data, setData] = useState<ViewsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [mainTab, setMainTab] = useState<"reports" | "definitions">("reports");
  const [activeReport, setActiveReport] = useState<ReportType>("view1");
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    if (!isLoaded || !isAdmin) return;
    setLoading(true);
    fetch("/api/admin/views")
      .then((res) => res.json())
      .then((d) => setData(d))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [isLoaded, isAdmin]);

  const currentMeta = REPORT_INFO[activeReport];

  // ── Filtered Records ───────────────────────────────────────────────────────
  const filteredView1 = useMemo(() => {
    if (!data?.view1) return [];
    if (!searchQuery.trim()) return data.view1;
    const q = searchQuery.toLowerCase();
    return data.view1.filter(
      (r) =>
        r.display_name.toLowerCase().includes(q) ||
        (r.exam_category && r.exam_category.toLowerCase().includes(q)) ||
        (r.sub_topic && r.sub_topic.toLowerCase().includes(q)) ||
        r.profile_id.toLowerCase().includes(q)
    );
  }, [data?.view1, searchQuery]);

  const filteredView2 = useMemo(() => {
    if (!data?.view2) return [];
    if (!searchQuery.trim()) return data.view2;
    const q = searchQuery.toLowerCase();
    return data.view2.filter(
      (r) =>
        r.display_name.toLowerCase().includes(q) ||
        r.league_name.toLowerCase().includes(q) ||
        r.profile_id.toLowerCase().includes(q)
    );
  }, [data?.view2, searchQuery]);

  const filteredView3 = useMemo(() => {
    if (!data?.view3) return [];
    if (!searchQuery.trim()) return data.view3;
    const q = searchQuery.toLowerCase();
    return data.view3.filter(
      (r) =>
        r.display_name.toLowerCase().includes(q) ||
        (r.exam_category && r.exam_category.toLowerCase().includes(q)) ||
        (r.sub_topic && r.sub_topic.toLowerCase().includes(q)) ||
        r.profile_id.toLowerCase().includes(q)
    );
  }, [data?.view3, searchQuery]);

  // ── Summary KPI Calculations ───────────────────────────────────────────────
  const summaryStats = useMemo(() => {
    if (!data) return { stat1: "0", stat2: "0", stat3: "0", stat4: "0" };

    if (activeReport === "view1") {
      const rows = data.view1 || [];
      const total = rows.length;
      const active = rows.filter((r) => r.total_score > 0).length;
      const avgLessons = total > 0 ? (rows.reduce((acc, r) => acc + r.lessons_completed, 0) / total).toFixed(1) : "0";
      const totalXp = rows.reduce((acc, r) => acc + r.total_score, 0);
      return {
        label1: "Total Reviewers",
        stat1: total.toString(),
        sub1: `${active} active`,
        label2: "Active Learners",
        stat2: active.toString(),
        sub2: `${total > 0 ? Math.round((active / total) * 100) : 0}% active rate`,
        label3: "Avg Lessons Finished",
        stat3: avgLessons,
        sub3: "per candidate",
        label4: "Total Score Recorded",
        stat4: totalXp.toLocaleString(),
        sub4: "cumulative XP",
      };
    } else if (activeReport === "view2") {
      const rows = data.view2 || [];
      const total = rows.length;
      const totalGems = rows.reduce((acc, r) => acc + r.gems, 0);
      const activeStreaks = rows.filter((r) => r.streak > 0).length;
      const maxStreak = rows.length > 0 ? Math.max(...rows.map((r) => r.streak)) : 0;
      return {
        label1: "Total Reviewers",
        stat1: total.toString(),
        sub1: "audited accounts",
        label2: "Gems Active",
        stat2: totalGems.toLocaleString(),
        sub2: "economy vault",
        label3: "Active Streaks",
        stat3: activeStreaks.toString(),
        sub3: `${total > 0 ? Math.round((activeStreaks / total) * 100) : 0}% retention`,
        label4: "Top Streak Record",
        stat4: `${maxStreak}d`,
        sub4: "consecutive days",
      };
    } else {
      const rows = data.view3 || [];
      const totalEvents = rows.reduce((acc, r) => acc + r.total_events, 0);
      const totalXp = rows.reduce((acc, r) => acc + r.total_xp_earned, 0);
      const activeCandidates = rows.filter((r) => r.total_events > 0).length;
      return {
        label1: "Completed Drills",
        stat1: totalEvents.toString(),
        sub1: "total events logged",
        label2: "Drill XP Earned",
        stat2: totalXp.toLocaleString(),
        sub2: "awarded from sessions",
        label3: "Active Candidates",
        stat3: activeCandidates.toString(),
        sub3: "with recorded activity",
        label4: "Drills / Active User",
        stat4: activeCandidates > 0 ? (totalEvents / activeCandidates).toFixed(1) : "0",
        sub4: "average throughput",
      };
    }
  }, [data, activeReport]);

  return (
    <main className="flex-1 w-full max-w-[1000px] mx-auto pb-24 flex flex-col gap-6 pt-4 md:pt-8 px-4 font-din-round relative">
      {/* Page Header */}
      <div className="mt-4">
        <h1 className="font-feather text-heading text-almost-black tracking-tight uppercase">
          System Reports
        </h1>
        <p className="text-graphite text-body mt-1 max-w-2xl">
          Unified database view reports combining candidate registration, gamification economy, and practice audit logs.
        </p>
      </div>

      {/* Main Tabs */}
      <div className="flex border-b-2 border-cloud-gray overflow-x-auto gap-2 sm:gap-6 pt-2 pb-0 scrollbar-none">
        <button
          onClick={() => setMainTab("reports")}
          className={`pb-3 font-extrabold text-[15px] tracking-wider uppercase border-b-4 transition-all shrink-0 px-2 cursor-pointer ${
            mainTab === "reports"
              ? "border-sky-blue text-sky-blue"
              : "border-transparent text-silver hover:text-charcoal hover:border-cloud-gray"
          }`}
        >
          View Reports
        </button>
        <button
          onClick={() => setMainTab("definitions")}
          className={`pb-3 font-extrabold text-[15px] tracking-wider uppercase border-b-4 transition-all shrink-0 px-2 cursor-pointer ${
            mainTab === "definitions"
              ? "border-sky-blue text-sky-blue"
              : "border-transparent text-silver hover:text-charcoal hover:border-cloud-gray"
          }`}
        >
          SQL View Definitions
        </button>

        <div className="flex items-center gap-4 ml-auto">
          <Link
            href="/admin/functions"
            className="pb-3 font-extrabold text-[15px] tracking-wider uppercase border-b-4 transition-all shrink-0 px-2 cursor-pointer border-transparent text-silver hover:text-sky-blue hover:border-sky-blue"
          >
            Performance
          </Link>
          <Link
            href="/admin"
            className="pb-3 font-extrabold text-[15px] tracking-wider uppercase border-b-4 transition-all shrink-0 px-2 cursor-pointer border-transparent text-silver hover:text-charcoal hover:border-cloud-gray"
          >
            Dashboard
          </Link>
        </div>
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center py-24 gap-3">
          <RiveLoader text="Loading system reports..." className="[&_p]:text-silver" />
        </div>
      ) : (
        <>
          {/* ═══════════════════════════════════════════════════════════════════
              TAB 1: VIEW REPORTS
          ═══════════════════════════════════════════════════════════════════ */}
          {mainTab === "reports" && (
            <div className="flex flex-col gap-6 animate-fade-in">
              {/* Report Selector Pills */}
              <div className="bg-snow-white border-2 border-cloud-gray p-2 rounded-2xl flex flex-wrap gap-2">
                {(["view1", "view2", "view3"] as const).map((key) => {
                  const info = REPORT_INFO[key];
                  const isSelected = activeReport === key;
                  return (
                    <button
                      key={key}
                      onClick={() => {
                        setActiveReport(key);
                        setSearchQuery("");
                      }}
                      className={`flex-1 min-w-[200px] text-left px-4 py-3 rounded-xl transition-all border-2 cursor-pointer ${
                        isSelected
                          ? "bg-sky-blue/10 border-sky-blue text-sky-blue shadow-sm"
                          : "bg-transparent border-transparent text-charcoal hover:bg-cloud-gray/10"
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-extrabold text-sm">{info.title}</span>
                        <span className="text-[10px] font-mono uppercase text-silver font-bold">{info.viewName}</span>
                      </div>
                      <p className="text-xs text-silver mt-0.5 truncate">{info.featureContext}</p>
                    </button>
                  );
                })}
              </div>

              {/* KPI Summary Cards */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-snow-white border-2 border-cloud-gray p-5 rounded-2xl hover:border-sky-blue transition-colors">
                  <p className="text-silver font-bold uppercase text-[11px] tracking-wider">{summaryStats.label1}</p>
                  <h2 className="text-heading font-extrabold mt-1 text-almost-black">{summaryStats.stat1}</h2>
                  <p className="text-xs text-silver mt-0.5">{summaryStats.sub1}</p>
                </div>
                <div className="bg-snow-white border-2 border-cloud-gray p-5 rounded-2xl hover:border-duo-green transition-colors">
                  <p className="text-silver font-bold uppercase text-[11px] tracking-wider">{summaryStats.label2}</p>
                  <h2 className="text-heading font-extrabold mt-1 text-duo-green">{summaryStats.stat2}</h2>
                  <p className="text-xs text-silver mt-0.5">{summaryStats.sub2}</p>
                </div>
                <div className="bg-snow-white border-2 border-cloud-gray p-5 rounded-2xl hover:border-sunshine-yellow transition-colors">
                  <p className="text-silver font-bold uppercase text-[11px] tracking-wider">{summaryStats.label3}</p>
                  <h2 className="text-heading font-extrabold mt-1 text-almost-black">{summaryStats.stat3}</h2>
                  <p className="text-xs text-silver mt-0.5">{summaryStats.sub3}</p>
                </div>
                <div className="bg-snow-white border-2 border-cloud-gray p-5 rounded-2xl hover:border-bubblegum-pink transition-colors">
                  <p className="text-silver font-bold uppercase text-[11px] tracking-wider">{summaryStats.label4}</p>
                  <h2 className="text-heading font-extrabold mt-1 text-almost-black">{summaryStats.stat4}</h2>
                  <p className="text-xs text-silver mt-0.5">{summaryStats.sub4}</p>
                </div>
              </div>

              {/* Report Description & Filter Bar */}
              <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 bg-snow-white border-2 border-cloud-gray p-4 rounded-2xl">
                <div className="flex flex-col min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-extrabold text-almost-black text-sm">{currentMeta.title}</span>
                    <span className="text-[11px] font-mono text-silver">({currentMeta.viewName})</span>
                  </div>
                  <div className="flex items-center gap-2 mt-1 flex-wrap">
                    <span className="text-xs text-silver">Source tables:</span>
                    {currentMeta.sourceTables.map((t) => (
                      <span key={t} className="px-2 py-0.5 rounded bg-cloud-gray/20 font-mono text-[11px] text-charcoal font-bold">
                        {t}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="relative min-w-[240px]">
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search records..."
                    className="w-full border-2 border-cloud-gray focus:border-sky-blue rounded-xl py-2 px-3 text-xs font-bold text-almost-black outline-none transition-colors"
                  />
                  {searchQuery && (
                    <button
                      onClick={() => setSearchQuery("")}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 text-silver hover:text-charcoal text-xs font-bold"
                    >
                      Clear
                    </button>
                  )}
                </div>
              </div>

              {/* ── Table for VIEW 1: Full Profile ── */}
              {activeReport === "view1" && (
                <div className="bg-snow-white border-2 border-cloud-gray rounded-2xl overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="w-full border-collapse text-left min-w-[850px]">
                      <thead>
                        <tr className="border-b-2 border-cloud-gray bg-cloud-gray/10 text-silver font-extrabold text-[12px] uppercase tracking-wider">
                          <th className="p-4 whitespace-nowrap">Reviewer</th>
                          <th className="p-4 whitespace-nowrap">Exam Category</th>
                          <th className="p-4 whitespace-nowrap">Sub-Topic</th>
                          <th className="p-4 whitespace-nowrap">Difficulty</th>
                          <th className="p-4 whitespace-nowrap">Style</th>
                          <th className="p-4 whitespace-nowrap">Score</th>
                          <th className="p-4 whitespace-nowrap">Lessons</th>
                          <th className="p-4 whitespace-nowrap">Last Lesson</th>
                          <th className="p-4 whitespace-nowrap text-right">Action</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y-2 divide-cloud-gray font-bold text-[14px]">
                        {filteredView1.length === 0 ? (
                          <tr>
                            <td colSpan={9} className="p-8 text-center text-silver font-bold">
                              No reviewer records found.
                            </td>
                          </tr>
                        ) : (
                          filteredView1.map((r) => (
                            <tr key={r.profile_id} className="hover:bg-cloud-gray/5 text-charcoal">
                              <td className="p-4 whitespace-nowrap">
                                <div className="flex flex-col min-w-0">
                                  <span className="text-almost-black font-extrabold text-sm">{r.display_name}</span>
                                  <span className="text-[11px] text-silver font-mono font-medium truncate max-w-[160px]">
                                    {r.profile_id}
                                  </span>
                                </div>
                              </td>
                              <td className="p-4 whitespace-nowrap text-almost-black">
                                <span className="px-2.5 py-1 rounded-lg bg-sky-blue/10 text-sky-blue border border-sky-blue/20 text-xs font-extrabold">
                                  {r.exam_category || "General"}
                                </span>
                              </td>
                              <td className="p-4 whitespace-nowrap text-silver text-xs">
                                {truncateText(r.sub_topic, 24)}
                              </td>
                              <td className="p-4 whitespace-nowrap">
                                <span
                                  className={`px-2 py-0.5 rounded-full text-xs font-bold ${
                                    r.difficulty === "Advanced"
                                      ? "bg-rose-500/10 text-rose-600"
                                      : r.difficulty === "Intermediate"
                                      ? "bg-amber-500/10 text-amber-600"
                                      : "bg-duo-green/10 text-duo-green"
                                  }`}
                                >
                                  {r.difficulty}
                                </span>
                              </td>
                              <td className="p-4 whitespace-nowrap text-silver text-xs">{r.study_style}</td>
                              <td className="p-4 whitespace-nowrap text-almost-black font-extrabold">
                                {r.total_score.toLocaleString()} <span className="text-silver text-xs font-medium">XP</span>
                              </td>
                              <td className="p-4 whitespace-nowrap text-almost-black">{r.lessons_completed}</td>
                              <td className="p-4 whitespace-nowrap text-silver text-xs font-mono">
                                {formatDate(r.last_lesson_date)}
                              </td>
                              <td className="p-4 whitespace-nowrap text-right">
                                <Link
                                  href="/admin/functions"
                                  className="text-sky-blue hover:bg-sky-blue/10 px-3 py-1.5 rounded-xl border-2 border-sky-blue/20 transition-all text-xs font-extrabold inline-block"
                                >
                                  Performance
                                </Link>
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* ── Table for VIEW 2: Game Status ── */}
              {activeReport === "view2" && (
                <div className="bg-snow-white border-2 border-cloud-gray rounded-2xl overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="w-full border-collapse text-left min-w-[850px]">
                      <thead>
                        <tr className="border-b-2 border-cloud-gray bg-cloud-gray/10 text-silver font-extrabold text-[12px] uppercase tracking-wider">
                          <th className="p-4 whitespace-nowrap">Reviewer</th>
                          <th className="p-4 whitespace-nowrap">League Standing</th>
                          <th className="p-4 whitespace-nowrap">Score</th>
                          <th className="p-4 whitespace-nowrap">Lessons</th>
                          <th className="p-4 whitespace-nowrap">Streak</th>
                          <th className="p-4 whitespace-nowrap">Streak Freeze</th>
                          <th className="p-4 whitespace-nowrap">Hearts</th>
                          <th className="p-4 whitespace-nowrap">Gems</th>
                          <th className="p-4 whitespace-nowrap text-right">Action</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y-2 divide-cloud-gray font-bold text-[14px]">
                        {filteredView2.length === 0 ? (
                          <tr>
                            <td colSpan={9} className="p-8 text-center text-silver font-bold">
                              No game status records found.
                            </td>
                          </tr>
                        ) : (
                          filteredView2.map((r) => {
                            const league = getLeagueStyle(r.league_name);
                            return (
                              <tr key={r.profile_id} className="hover:bg-cloud-gray/5 text-charcoal">
                                <td className="p-4 whitespace-nowrap">
                                  <div className="flex flex-col min-w-0">
                                    <span className="text-almost-black font-extrabold text-sm">{r.display_name}</span>
                                    <span className="text-[11px] text-silver font-mono font-medium truncate max-w-[160px]">
                                      {r.profile_id}
                                    </span>
                                  </div>
                                </td>
                                <td className="p-4 whitespace-nowrap">
                                  <span className={`px-2.5 py-1 rounded-lg text-xs font-extrabold border ${league.bg} ${league.text} ${league.border}`}>
                                    {r.league_name}
                                  </span>
                                </td>
                                <td className="p-4 whitespace-nowrap text-almost-black font-extrabold">
                                  {r.total_score.toLocaleString()} <span className="text-silver text-xs font-medium">XP</span>
                                </td>
                                <td className="p-4 whitespace-nowrap text-almost-black">{r.lessons_completed}</td>
                                <td className="p-4 whitespace-nowrap">
                                  <span className={`font-extrabold ${r.streak > 0 ? "text-[#ff5e00]" : "text-silver"}`}>
                                    {r.streak}d
                                  </span>
                                </td>
                                <td className="p-4 whitespace-nowrap text-silver text-xs">
                                  {r.streak_freeze_count} remaining
                                </td>
                                <td className="p-4 whitespace-nowrap text-rose-500 font-extrabold">
                                  {r.hearts}/5
                                </td>
                                <td className="p-4 whitespace-nowrap text-amber-500 font-extrabold">
                                  {r.gems.toLocaleString()}
                                </td>
                                <td className="p-4 whitespace-nowrap text-right">
                                  <Link
                                    href="/admin/functions"
                                    className="text-sky-blue hover:bg-sky-blue/10 px-3 py-1.5 rounded-xl border-2 border-sky-blue/20 transition-all text-xs font-extrabold inline-block"
                                  >
                                    Performance
                                  </Link>
                                </td>
                              </tr>
                            );
                          })
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* ── Table for VIEW 3: Activity Summary ── */}
              {activeReport === "view3" && (
                <div className="bg-snow-white border-2 border-cloud-gray rounded-2xl overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="w-full border-collapse text-left min-w-[850px]">
                      <thead>
                        <tr className="border-b-2 border-cloud-gray bg-cloud-gray/10 text-silver font-extrabold text-[12px] uppercase tracking-wider">
                          <th className="p-4 whitespace-nowrap">Reviewer</th>
                          <th className="p-4 whitespace-nowrap">Exam Category</th>
                          <th className="p-4 whitespace-nowrap">Sub-Topic</th>
                          <th className="p-4 whitespace-nowrap">Drills Logged</th>
                          <th className="p-4 whitespace-nowrap">XP Awarded</th>
                          <th className="p-4 whitespace-nowrap">First Activity</th>
                          <th className="p-4 whitespace-nowrap">Latest Activity</th>
                          <th className="p-4 whitespace-nowrap text-right">Action</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y-2 divide-cloud-gray font-bold text-[14px]">
                        {filteredView3.length === 0 ? (
                          <tr>
                            <td colSpan={8} className="p-8 text-center text-silver font-bold">
                              No lesson events logged yet.
                            </td>
                          </tr>
                        ) : (
                          filteredView3.map((r) => (
                            <tr key={r.profile_id} className="hover:bg-cloud-gray/5 text-charcoal">
                              <td className="p-4 whitespace-nowrap">
                                <div className="flex flex-col min-w-0">
                                  <span className="text-almost-black font-extrabold text-sm">{r.display_name}</span>
                                  <span className="text-[11px] text-silver font-mono font-medium truncate max-w-[160px]">
                                    {r.profile_id}
                                  </span>
                                </div>
                              </td>
                              <td className="p-4 whitespace-nowrap">
                                <span className="px-2.5 py-1 rounded-lg bg-sky-blue/10 text-sky-blue border border-sky-blue/20 text-xs font-extrabold">
                                  {r.exam_category || "General"}
                                </span>
                              </td>
                              <td className="p-4 whitespace-nowrap text-silver text-xs">
                                {truncateText(r.sub_topic, 24)}
                              </td>
                              <td className="p-4 whitespace-nowrap text-almost-black font-extrabold">
                                {r.total_events}
                              </td>
                              <td className="p-4 whitespace-nowrap text-duo-green font-extrabold">
                                {(r.total_xp_earned || 0).toLocaleString()} <span className="text-silver text-xs font-medium">XP</span>
                              </td>
                              <td className="p-4 whitespace-nowrap text-silver text-xs font-mono">
                                {formatDate(r.first_activity_at)}
                              </td>
                              <td className="p-4 whitespace-nowrap text-silver text-xs font-mono">
                                {formatDate(r.last_activity_at)}
                              </td>
                              <td className="p-4 whitespace-nowrap text-right">
                                <Link
                                  href="/admin/functions"
                                  className="text-sky-blue hover:bg-sky-blue/10 px-3 py-1.5 rounded-xl border-2 border-sky-blue/20 transition-all text-xs font-extrabold inline-block"
                                >
                                  Performance
                                </Link>
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ═══════════════════════════════════════════════════════════════════
              TAB 2: SQL DEFINITIONS
          ═══════════════════════════════════════════════════════════════════ */}
          {mainTab === "definitions" && (
            <div className="flex flex-col gap-6 animate-fade-in">
              <div className="bg-snow-white border-2 border-cloud-gray p-5 rounded-2xl">
                <h3 className="font-extrabold text-heading-sm text-almost-black">
                  SQL View Declarations
                </h3>
                <p className="text-xs text-silver mt-1">
                  These database views run directly in PostgreSQL / Supabase, encapsulating complex relational joins, aggregations, and league calculations into virtual tables.
                </p>
              </div>

              {(["view1", "view2", "view3"] as const).map((key) => {
                const info = REPORT_INFO[key];
                const sql = data?.viewSql?.[info.viewName] || "";
                return (
                  <div key={key} className="bg-snow-white border-2 border-cloud-gray rounded-2xl overflow-hidden">
                    <div className="p-4 bg-cloud-gray/10 border-b-2 border-cloud-gray flex items-center justify-between gap-3">
                      <div>
                        <span className="font-mono font-extrabold text-sm text-almost-black">{info.viewName}</span>
                        <span className="text-xs text-silver ml-2">— {info.title}</span>
                      </div>
                      <CopyButton text={sql} />
                    </div>

                    <div className="p-4 flex flex-col gap-2">
                      <p className="text-xs text-charcoal font-medium">{info.description}</p>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-[11px] font-bold text-silver">Joined tables:</span>
                        {info.sourceTables.map((tbl) => (
                          <span key={tbl} className="px-2 py-0.5 bg-cloud-gray/20 rounded font-mono text-[11px] text-charcoal font-bold">
                            {tbl}
                          </span>
                        ))}
                      </div>
                    </div>

                    <pre className="p-4 bg-[#1e1e2e] text-[#c8d3f5] font-mono text-xs overflow-x-auto leading-relaxed border-t border-cloud-gray/20 m-0">
                      <code>{sql}</code>
                    </pre>
                  </div>
                );
              })}
            </div>
          )}
        </>
      )}
    </main>
  );
}
