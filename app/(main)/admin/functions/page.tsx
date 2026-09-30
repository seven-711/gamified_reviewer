"use client";

import React, { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import { useAuth } from "@/lib/auth";
import { checkIsAdmin } from "@/lib/admin";
import { RiveLoader } from "@/components/ui/RiveLoader";

// ─── Types ────────────────────────────────────────────────────────────────────

interface FunctionParam {
  name: string;
  type: string;
  description: string;
}

interface FunctionMeta {
  id: string;
  category: string;
  name: string;
  returns: string;
  parameters: FunctionParam[];
  purpose: string;
  postgresSql: string;
  mysqlSql: string;
  sampleCall: string;
}

interface EvaluatedRecord {
  profile_id: string;
  raw_name: string | null;
  current_level: number;
  total_score: number;
  lessons_completed: number;
  streak: number;
  fn_format_reviewer_title: string;
  fn_calculate_mastery_rate: number;
  fn_determine_exam_readiness: string;
}

interface FunctionsApiResponse {
  functions: FunctionMeta[];
  unifiedSystemQuery: string;
  records: EvaluatedRecord[];
  rpcSupported: boolean;
  totalRecords: number;
}

// ─── Readiness Tier Styling ───────────────────────────────────────────────────

const TIER_STYLES: Record<string, { label: string; bg: string; text: string; border: string }> = {
  EXCELLENT: { label: "Exam Ready", bg: "bg-duo-green/15", text: "text-duo-green", border: "border-duo-green/30" },
  QUALIFIED: { label: "Qualified", bg: "bg-sky-blue/15", text: "text-sky-blue", border: "border-sky-blue/30" },
  "IN PROGRESS": { label: "In Progress", bg: "bg-grape-soda/15", text: "text-grape-soda", border: "border-grape-soda/30" },
  DEVELOPING: { label: "Developing", bg: "bg-sunshine-yellow/15", text: "text-sunshine-yellow", border: "border-sunshine-yellow/30" },
  "NEEDS PRACTICE": { label: "Novice", bg: "bg-cloud-gray/30", text: "text-silver", border: "border-cloud-gray" },
};

function getTierStyle(status: string) {
  for (const key of Object.keys(TIER_STYLES)) {
    if (status.includes(key)) return TIER_STYLES[key];
  }
  return TIER_STYLES["NEEDS PRACTICE"];
}

// ─── Copy Helper ──────────────────────────────────────────────────────────────

function CopyButton({ text, label = "Copy" }: { text: string; label?: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <button
      onClick={() => { navigator.clipboard.writeText(text); setCopied(true); setTimeout(() => setCopied(false), 1500); }}
      className="px-2 py-0.5 text-[11px] font-bold rounded-lg bg-cloud-gray/20 hover:bg-cloud-gray/40 text-silver hover:text-charcoal border border-cloud-gray/40 transition-colors cursor-pointer shrink-0"
    >
      {copied ? "Copied" : label}
    </button>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function ReviewerPerformancePage() {
  const { user, isLoaded } = useAuth();
  const isAdmin = checkIsAdmin(user);

  const [data, setData] = useState<FunctionsApiResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"performance" | "simulator" | "reference">("performance");
  const [sqlDialect, setSqlDialect] = useState<"postgres" | "mysql">("postgres");

  // Simulator States
  const [simName, setSimName] = useState("JulyFranz|avatar_4.png");
  const [simLevel, setSimLevel] = useState(5);
  const [simScore, setSimScore] = useState(3250);
  const [simLessons, setSimLessons] = useState(15);
  const [simStreak, setSimStreak] = useState(8);
  const [simResults, setSimResults] = useState<{
    title: string | null;
    mastery: number | null;
    readiness: string | null;
  }>({ title: null, mastery: null, readiness: null });
  const [simulating, setSimulating] = useState(false);

  // Reference: which function is expanded
  const [expandedFn, setExpandedFn] = useState<string | null>(null);

  // ── Click-to-simulate: fill inputs from a record and auto-run ─────────────
  const simulateReviewer = (r: EvaluatedRecord) => {
    setSimName(r.raw_name || "");
    setSimLevel(r.current_level);
    setSimScore(r.total_score);
    setSimLessons(r.lessons_completed);
    setSimStreak(r.streak);
    setSimResults({ title: null, mastery: null, readiness: null });
    setActiveTab("simulator");
    // Auto-run after a tick so state settles
    setTimeout(() => {
      runSimulationWith(r.raw_name || "", r.current_level, r.total_score, r.lessons_completed, r.streak);
    }, 50);
  };

  useEffect(() => {
    if (!isLoaded || !isAdmin) return;
    setLoading(true);
    fetch("/api/admin/functions")
      .then((res) => res.json())
      .then((d) => setData(d))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [isLoaded, isAdmin]);

  // ── Compute summary stats from records ────────────────────────────────────
  const stats = useMemo(() => {
    if (!data?.records || data.records.length === 0) {
      return { total: 0, avgMastery: 0, examReady: 0, topStreak: 0 };
    }
    const recs = data.records;
    const total = recs.length;
    const avgMastery = recs.reduce((s, r) => s + (Number(r.fn_calculate_mastery_rate) || 0), 0) / total;
    const examReady = recs.filter((r) =>
      r.fn_determine_exam_readiness.includes("EXCELLENT") || r.fn_determine_exam_readiness.includes("QUALIFIED")
    ).length;
    const topStreak = Math.max(...recs.map((r) => r.streak));
    return { total, avgMastery, examReady, topStreak };
  }, [data]);

  // ── Run all 3 functions as a combined simulation ──────────────────────────
  const runSimulationWith = async (name: string, level: number, score: number, lessons: number, streak: number) => {
    setSimulating(true);
    try {
      const [titleRes, masteryRes, readinessRes] = await Promise.all([
        fetch("/api/admin/functions", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ functionId: "fn_format_reviewer_title", params: { name, level } }),
        }).then((r) => r.json()),
        fetch("/api/admin/functions", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ functionId: "fn_calculate_mastery_rate", params: { total_score: score, lessons_completed: lessons } }),
        }).then((r) => r.json()),
        fetch("/api/admin/functions", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ functionId: "fn_determine_exam_readiness", params: { total_score: score, lessons_completed: lessons, streak } }),
        }).then((r) => r.json()),
      ]);
      setSimResults({
        title: titleRes.result,
        mastery: Number(masteryRes.result),
        readiness: readinessRes.result,
      });
    } catch (err) {
      console.error(err);
    } finally {
      setSimulating(false);
    }
  };

  const runSimulation = () => runSimulationWith(simName, simLevel, simScore, simLessons, simStreak);

  const getFunctionMeta = (id: string) => data?.functions.find((f) => f.id === id);

  // ── Tier distribution for the mini-bar ────────────────────────────────────
  const tierDistribution = useMemo(() => {
    if (!data?.records) return [];
    const counts: Record<string, number> = {};
    data.records.forEach((r) => {
      const key = Object.keys(TIER_STYLES).find((k) => r.fn_determine_exam_readiness.includes(k)) || "NEEDS PRACTICE";
      counts[key] = (counts[key] || 0) + 1;
    });
    return Object.entries(TIER_STYLES).map(([key, style]) => ({
      key,
      label: style.label,
      count: counts[key] || 0,
    }));
  }, [data]);

  return (
    <main className="flex-1 w-full max-w-[1000px] mx-auto pb-24 flex flex-col gap-6 pt-4 md:pt-8 px-4 font-din-round relative">
      {/* Page Title — matches admin dashboard pattern */}
      <div className="mt-4">
        <h1 className="font-feather text-heading text-almost-black tracking-tight uppercase">
          Reviewer Performance
        </h1>
        <p className="text-graphite text-body mt-1 max-w-xl">
          Evaluate reviewer readiness, mastery rates, and formatted display titles across all registered profiles.
        </p>
      </div>

      {/* Tabs — same visual pattern as admin dashboard */}
      <div className="flex border-b-2 border-cloud-gray overflow-x-auto gap-2 sm:gap-6 pt-2 pb-0 scrollbar-none">
        {([
          { id: "performance" as const, label: "Performance Table" },
          { id: "simulator" as const, label: "Readiness Simulator" },
          { id: "reference" as const, label: "SQL Reference" },
        ]).map((tab) => {
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`pb-3 font-extrabold text-[15px] tracking-wider uppercase border-b-4 transition-all shrink-0 px-2 cursor-pointer ${
                isActive
                  ? "border-sky-blue text-sky-blue"
                  : "border-transparent text-silver hover:text-charcoal hover:border-cloud-gray"
              }`}
            >
              {tab.label}
            </button>
          );
        })}

        <div className="flex items-center gap-4 ml-auto">
          <Link
            href="/admin/views"
            className="pb-3 font-extrabold text-[15px] tracking-wider uppercase border-b-4 transition-all shrink-0 px-2 cursor-pointer border-transparent text-silver hover:text-[#a570ff] hover:border-[#a570ff]"
          >
            Reports
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
          <RiveLoader text="Loading reviewer analytics..." className="[&_p]:text-silver" />
        </div>
      ) : (
        <>
          {/* ═══════════════════════════════════════════════════════════════════
              TAB 1: PERFORMANCE TABLE
          ═══════════════════════════════════════════════════════════════════ */}
          {activeTab === "performance" && (
            <div className="flex flex-col gap-6 animate-fade-in">
              {/* Summary Stat Cards */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-snow-white border-2 border-cloud-gray p-5 rounded-2xl hover:border-sky-blue transition-colors">
                  <p className="text-silver font-bold uppercase text-[12px] tracking-wider">Total Reviewers</p>
                  <h2 className="text-heading font-extrabold mt-1 text-almost-black leading-none">{stats.total}</h2>
                  <p className="text-xs text-sky-blue font-bold mt-1">Profiles evaluated</p>
                </div>
                <div className="bg-snow-white border-2 border-cloud-gray p-5 rounded-2xl hover:border-duo-green transition-colors">
                  <p className="text-silver font-bold uppercase text-[12px] tracking-wider">Avg. Mastery Rate</p>
                  <h2 className="text-heading font-extrabold mt-1 text-almost-black leading-none">
                    {stats.avgMastery.toFixed(1)}
                  </h2>
                  <p className="text-xs text-duo-green font-bold mt-1">XP per lesson</p>
                </div>
                <div className="bg-snow-white border-2 border-cloud-gray p-5 rounded-2xl hover:border-grape-soda transition-colors">
                  <p className="text-silver font-bold uppercase text-[12px] tracking-wider">Exam Ready</p>
                  <h2 className="text-heading font-extrabold mt-1 text-almost-black leading-none">{stats.examReady}</h2>
                  <p className="text-xs text-grape-soda font-bold mt-1">Qualified or above</p>
                </div>
                <div className="bg-snow-white border-2 border-cloud-gray p-5 rounded-2xl hover:border-sunshine-yellow transition-colors">
                  <p className="text-silver font-bold uppercase text-[12px] tracking-wider">Top Streak</p>
                  <h2 className="text-heading font-extrabold mt-1 text-almost-black leading-none">{stats.topStreak}d</h2>
                  <p className="text-xs text-sunshine-yellow font-bold mt-1">Consecutive days</p>
                </div>
              </div>

              {/* Tier Distribution Bar */}
              {tierDistribution.length > 0 && stats.total > 0 && (
                <div className="bg-snow-white border-2 border-cloud-gray rounded-2xl p-5">
                  <p className="text-silver font-bold uppercase text-[12px] tracking-wider mb-3">Readiness Distribution</p>
                  <div className="w-full h-6 bg-cloud-gray rounded-full overflow-hidden flex">
                    {tierDistribution.map((t) => {
                      const pct = stats.total > 0 ? (t.count / stats.total) * 100 : 0;
                      if (pct === 0) return null;
                      const colors: Record<string, string> = {
                        EXCELLENT: "#58cc02",
                        QUALIFIED: "#1cb0f6",
                        "IN PROGRESS": "#a570ff",
                        DEVELOPING: "#ffc700",
                        "NEEDS PRACTICE": "#afafaf",
                      };
                      return (
                        <div
                          key={t.key}
                          style={{ width: `${pct}%`, backgroundColor: colors[t.key] || "#afafaf" }}
                          className="h-full transition-all duration-500 first:rounded-l-full last:rounded-r-full"
                          title={`${t.label}: ${t.count} reviewers (${pct.toFixed(0)}%)`}
                        />
                      );
                    })}
                  </div>
                  <div className="flex flex-wrap gap-x-5 gap-y-1 mt-2.5">
                    {tierDistribution.map((t) => (
                      <div key={t.key} className="flex items-center gap-1.5 text-[12px]">
                        <span
                          className="w-2.5 h-2.5 rounded-full shrink-0"
                          style={{
                            backgroundColor:
                              { EXCELLENT: "#58cc02", QUALIFIED: "#1cb0f6", "IN PROGRESS": "#a570ff", DEVELOPING: "#ffc700", "NEEDS PRACTICE": "#afafaf" }[t.key] || "#afafaf",
                          }}
                        />
                        <span className="font-bold text-charcoal">{t.label}</span>
                        <span className="text-silver">({t.count})</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Reviewer Performance Data Table */}
              <div className="bg-snow-white border-2 border-cloud-gray rounded-2xl overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full border-collapse text-left min-w-[800px]">
                    <thead>
                      <tr className="border-b-2 border-cloud-gray bg-cloud-gray/10 text-silver font-extrabold text-[12px] uppercase tracking-wider">
                        <th className="p-4 whitespace-nowrap">Reviewer</th>
                        <th className="p-4 whitespace-nowrap">Display Title</th>
                        <th className="p-4 whitespace-nowrap">Score</th>
                        <th className="p-4 whitespace-nowrap">Lessons</th>
                        <th className="p-4 whitespace-nowrap">Streak</th>
                        <th className="p-4 whitespace-nowrap">Mastery Rate</th>
                        <th className="p-4 whitespace-nowrap">Readiness Tier</th>
                        <th className="p-4 whitespace-nowrap text-right">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y-2 divide-cloud-gray font-bold text-[14px]">
                      {data?.records && data.records.length > 0 ? (
                        data.records.map((r) => {
                          const tier = getTierStyle(r.fn_determine_exam_readiness);
                          return (
                            <tr key={r.profile_id} className="hover:bg-cloud-gray/5 text-charcoal cursor-pointer group" onClick={() => simulateReviewer(r)}>
                              <td className="p-4 whitespace-nowrap">
                                <div className="flex flex-col min-w-0">
                                  <span className="text-almost-black font-extrabold text-sm truncate group-hover:text-sky-blue transition-colors">
                                    {r.raw_name ? r.raw_name.split("|")[0] : "—"}
                                  </span>
                                  <span className="text-[11px] text-silver font-medium font-mono truncate">{r.profile_id}</span>
                                </div>
                              </td>
                              <td className="p-4 whitespace-nowrap">
                                <span className="bg-sky-blue/10 text-sky-blue px-2.5 py-1 rounded-lg text-xs font-extrabold border border-sky-blue/20">
                                  {r.fn_format_reviewer_title}
                                </span>
                              </td>
                              <td className="p-4 whitespace-nowrap text-almost-black">
                                {r.total_score.toLocaleString()} <span className="text-silver text-xs font-medium">XP</span>
                              </td>
                              <td className="p-4 whitespace-nowrap text-almost-black">{r.lessons_completed}</td>
                              <td className="p-4 whitespace-nowrap">
                                <span className={`font-extrabold ${r.streak > 0 ? "text-[#ff5e00]" : "text-silver"}`}>
                                  {r.streak}d
                                </span>
                              </td>
                              <td className="p-4 whitespace-nowrap">
                                <span className="text-duo-green font-extrabold">{(Number(r.fn_calculate_mastery_rate) || 0).toFixed(2)}</span>
                                <span className="text-silver text-[11px] ml-1 font-medium">XP/lesson</span>
                              </td>
                              <td className="p-4 whitespace-nowrap">
                                <span className={`px-2.5 py-1 rounded-lg text-xs font-extrabold border ${tier.bg} ${tier.text} ${tier.border}`}>
                                  {r.fn_determine_exam_readiness}
                                </span>
                              </td>
                              <td className="p-4 whitespace-nowrap text-right">
                                <span className="text-sky-blue hover:bg-sky-blue/10 px-3 py-1.5 rounded-xl border-2 border-sky-blue/20 transition-all text-xs font-extrabold inline-block">
                                  Simulate
                                </span>
                              </td>
                            </tr>
                          );
                        })
                      ) : (
                        <tr>
                          <td colSpan={8} className="p-8 text-center text-silver font-bold">
                            No reviewer records found.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* ═══════════════════════════════════════════════════════════════════
              TAB 2: READINESS SIMULATOR
          ═══════════════════════════════════════════════════════════════════ */}
          {activeTab === "simulator" && (
            <div className="flex flex-col gap-6 animate-fade-in">
              <div className="bg-snow-white border-2 border-cloud-gray rounded-2xl p-6">
                <h2 className="font-extrabold text-heading-sm text-almost-black">Readiness Simulator</h2>
                <p className="text-graphite text-sm mt-1 max-w-xl">
                  Enter any reviewer profile values to simulate the system&apos;s computed display title,
                  mastery rate, and exam readiness tier in real time.
                </p>

                {/* Input Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mt-6">
                  <div className="flex flex-col gap-1">
                    <label className="text-xs uppercase font-extrabold text-silver tracking-wider">
                      Username (raw)
                    </label>
                    <input
                      type="text"
                      value={simName}
                      onChange={(e) => setSimName(e.target.value)}
                      className="border-2 border-cloud-gray focus:border-sky-blue rounded-xl p-2.5 outline-none font-bold text-almost-black text-sm bg-snow-white"
                      placeholder="e.g. JulyFranz|avatar_4.png"
                    />
                  </div>
                  <div className="flex flex-col gap-1">
                    <label className="text-xs uppercase font-extrabold text-silver tracking-wider">
                      Level
                    </label>
                    <input
                      type="number"
                      value={simLevel}
                      onChange={(e) => setSimLevel(parseInt(e.target.value) || 1)}
                      className="border-2 border-cloud-gray focus:border-sky-blue rounded-xl p-2.5 outline-none font-bold text-almost-black text-sm bg-snow-white"
                      min={1}
                      max={100}
                    />
                  </div>
                  <div className="flex flex-col gap-1">
                    <label className="text-xs uppercase font-extrabold text-silver tracking-wider">
                      Total Score (XP)
                    </label>
                    <input
                      type="number"
                      value={simScore}
                      onChange={(e) => setSimScore(parseInt(e.target.value) || 0)}
                      className="border-2 border-cloud-gray focus:border-sky-blue rounded-xl p-2.5 outline-none font-bold text-almost-black text-sm bg-snow-white"
                      min={0}
                    />
                  </div>
                  <div className="flex flex-col gap-1">
                    <label className="text-xs uppercase font-extrabold text-silver tracking-wider">
                      Lessons Completed
                    </label>
                    <input
                      type="number"
                      value={simLessons}
                      onChange={(e) => setSimLessons(parseInt(e.target.value) || 0)}
                      className="border-2 border-cloud-gray focus:border-sky-blue rounded-xl p-2.5 outline-none font-bold text-almost-black text-sm bg-snow-white"
                      min={0}
                    />
                  </div>
                  <div className="flex flex-col gap-1">
                    <label className="text-xs uppercase font-extrabold text-silver tracking-wider">
                      Daily Streak
                    </label>
                    <input
                      type="number"
                      value={simStreak}
                      onChange={(e) => setSimStreak(parseInt(e.target.value) || 0)}
                      className="border-2 border-cloud-gray focus:border-sky-blue rounded-xl p-2.5 outline-none font-bold text-almost-black text-sm bg-snow-white"
                      min={0}
                    />
                  </div>
                  <div className="flex flex-col gap-1 justify-end">
                    <button
                      onClick={runSimulation}
                      disabled={simulating}
                      className="bg-sky-blue text-white font-extrabold px-6 py-2.5 rounded-xl shadow-[0_4px_0_#0f9cdb] active:translate-y-1 active:shadow-none transition-all hover:bg-sky-blue/90 disabled:opacity-50 uppercase text-xs tracking-wider cursor-pointer"
                    >
                      {simulating ? "Computing..." : "Run Simulation"}
                    </button>
                  </div>
                </div>

                {/* Results Card */}
                {simResults.title !== null && (
                  <div className="mt-6 border-t-2 border-cloud-gray pt-6">
                    <p className="text-silver font-bold uppercase text-[12px] tracking-wider mb-4">Computed Results</p>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      {/* Display Title */}
                      <div className="bg-cloud-gray/10 border-2 border-cloud-gray rounded-2xl p-4 flex flex-col gap-2">
                        <span className="text-[11px] font-bold text-silver uppercase tracking-wider">Display Title</span>
                        <span className="text-sky-blue font-extrabold text-base break-words">
                          {simResults.title}
                        </span>
                        <span className="text-[11px] text-silver font-mono mt-auto">
                          fn_format_reviewer_title()
                        </span>
                      </div>

                      {/* Mastery Rate */}
                      <div className="bg-cloud-gray/10 border-2 border-cloud-gray rounded-2xl p-4 flex flex-col gap-2">
                        <span className="text-[11px] font-bold text-silver uppercase tracking-wider">Mastery Rate</span>
                        <div>
                          <span className="text-duo-green font-extrabold text-heading">
                            {simResults.mastery !== null ? simResults.mastery.toFixed(2) : "—"}
                          </span>
                          <span className="text-silver text-sm ml-1.5 font-bold">XP/lesson</span>
                        </div>
                        <span className="text-[11px] text-silver font-mono mt-auto">
                          fn_calculate_mastery_rate()
                        </span>
                      </div>

                      {/* Readiness Tier */}
                      <div className="bg-cloud-gray/10 border-2 border-cloud-gray rounded-2xl p-4 flex flex-col gap-2">
                        <span className="text-[11px] font-bold text-silver uppercase tracking-wider">Readiness Tier</span>
                        {simResults.readiness && (() => {
                          const tier = getTierStyle(simResults.readiness);
                          return (
                            <span className={`px-3 py-1.5 rounded-xl text-xs font-extrabold border self-start ${tier.bg} ${tier.text} ${tier.border}`}>
                              {simResults.readiness}
                            </span>
                          );
                        })()}
                        <span className="text-[11px] text-silver font-mono mt-auto">
                          fn_determine_exam_readiness()
                        </span>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Readiness Tier Criteria Reference */}
              <div className="bg-snow-white border-2 border-cloud-gray rounded-2xl p-6">
                <h3 className="font-extrabold text-[15px] text-almost-black tracking-wide uppercase mb-4">
                  Readiness Tier Criteria
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="flex items-start gap-3 p-3 bg-duo-green/5 border border-duo-green/20 rounded-xl">
                    <span className="w-2.5 h-2.5 rounded-full bg-duo-green mt-1 shrink-0" />
                    <div>
                      <span className="font-extrabold text-sm text-almost-black block">Excellent — Exam Ready</span>
                      <span className="text-graphite text-xs">Score ≥ 5,000 AND Lessons ≥ 20 AND Streak ≥ 7 days</span>
                    </div>
                  </div>
                  <div className="flex items-start gap-3 p-3 bg-sky-blue/5 border border-sky-blue/20 rounded-xl">
                    <span className="w-2.5 h-2.5 rounded-full bg-sky-blue mt-1 shrink-0" />
                    <div>
                      <span className="font-extrabold text-sm text-almost-black block">Qualified — Passing Tier</span>
                      <span className="text-graphite text-xs">Score ≥ 2,500 AND Lessons ≥ 10</span>
                    </div>
                  </div>
                  <div className="flex items-start gap-3 p-3 bg-grape-soda/5 border border-grape-soda/20 rounded-xl">
                    <span className="w-2.5 h-2.5 rounded-full bg-grape-soda mt-1 shrink-0" />
                    <div>
                      <span className="font-extrabold text-sm text-almost-black block">In Progress — Intermediate</span>
                      <span className="text-graphite text-xs">Score ≥ 1,000 AND Lessons ≥ 5</span>
                    </div>
                  </div>
                  <div className="flex items-start gap-3 p-3 bg-sunshine-yellow/5 border border-sunshine-yellow/20 rounded-xl">
                    <span className="w-2.5 h-2.5 rounded-full bg-sunshine-yellow mt-1 shrink-0" />
                    <div>
                      <span className="font-extrabold text-sm text-almost-black block">Developing — Basic Competency</span>
                      <span className="text-graphite text-xs">Score ≥ 300 OR Lessons ≥ 2</span>
                    </div>
                  </div>
                  <div className="flex items-start gap-3 p-3 bg-cloud-gray/10 border border-cloud-gray rounded-xl sm:col-span-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-silver mt-1 shrink-0" />
                    <div>
                      <span className="font-extrabold text-sm text-almost-black block">Needs Practice — Novice</span>
                      <span className="text-graphite text-xs">Default tier for new or inactive reviewers</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ═══════════════════════════════════════════════════════════════════
              TAB 3: SQL REFERENCE
          ═══════════════════════════════════════════════════════════════════ */}
          {activeTab === "reference" && (
            <div className="flex flex-col gap-4 animate-fade-in">
              <div className="flex items-center justify-between">
                <p className="text-graphite text-sm">
                  Three stored SQL functions powering the reviewer analytics system.
                </p>
                {/* Dialect toggle */}
                <div className="flex items-center bg-cloud-gray/20 p-0.5 rounded-xl border border-cloud-gray shrink-0">
                  <button
                    className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-colors cursor-pointer ${
                      sqlDialect === "postgres"
                        ? "bg-snow-white text-almost-black shadow-sm border border-cloud-gray"
                        : "text-silver hover:text-charcoal"
                    }`}
                    onClick={() => setSqlDialect("postgres")}
                  >
                    PostgreSQL
                  </button>
                  <button
                    className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-colors cursor-pointer ${
                      sqlDialect === "mysql"
                        ? "bg-snow-white text-almost-black shadow-sm border border-cloud-gray"
                        : "text-silver hover:text-charcoal"
                    }`}
                    onClick={() => setSqlDialect("mysql")}
                  >
                    MySQL
                  </button>
                </div>
              </div>

              {/* Unified Query */}
              <div className="bg-snow-white border-2 border-cloud-gray rounded-2xl overflow-hidden">
                <div className="px-5 py-4 border-b-2 border-cloud-gray flex items-center justify-between">
                  <div>
                    <h3 className="font-extrabold text-[15px] text-almost-black">Unified System Query</h3>
                    <p className="text-graphite text-xs mt-0.5">
                      The query that powers the Performance Table — calls all 3 functions over live data.
                    </p>
                  </div>
                  <CopyButton text={data?.unifiedSystemQuery || ""} label="Copy SQL" />
                </div>
                <pre className="bg-[#1e1e2e] text-[#c8d3f5] p-4 font-mono text-xs sm:text-sm leading-relaxed overflow-x-auto whitespace-pre selection:bg-sky-blue/30">
                  {data?.unifiedSystemQuery || ""}
                </pre>
              </div>

              {/* Function DDL Accordions */}
              {[
                { id: "fn_format_reviewer_title", color: "#1cb0f6", label: "String" },
                { id: "fn_calculate_mastery_rate", color: "#58cc02", label: "Numeric" },
                { id: "fn_determine_exam_readiness", color: "#a570ff", label: "Business Rule" },
              ].map((fn) => {
                const meta = getFunctionMeta(fn.id);
                if (!meta) return null;
                const isOpen = expandedFn === fn.id;
                const sql = sqlDialect === "postgres" ? meta.postgresSql : meta.mysqlSql;

                return (
                  <div key={fn.id} className="bg-snow-white border-2 border-cloud-gray rounded-2xl overflow-hidden">
                    <button
                      onClick={() => setExpandedFn(isOpen ? null : fn.id)}
                      className="w-full px-5 py-4 flex items-center justify-between hover:bg-cloud-gray/5 transition-colors cursor-pointer"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <span className="w-3 h-3 rounded-full shrink-0" style={{ backgroundColor: fn.color }} />
                        <div className="text-left min-w-0">
                          <span className="font-extrabold text-almost-black text-sm block font-mono truncate">
                            {meta.name}()
                          </span>
                          <span className="text-graphite text-xs block truncate">{meta.purpose}</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 shrink-0 ml-3">
                        <span className="text-[11px] font-bold text-silver bg-cloud-gray/30 px-2 py-0.5 rounded uppercase tracking-wider">
                          {fn.label}
                        </span>
                        <span className="text-silver font-bold text-sm transition-transform" style={{ transform: isOpen ? "rotate(180deg)" : "" }}>
                          ▾
                        </span>
                      </div>
                    </button>

                    {isOpen && (
                      <div className="border-t-2 border-cloud-gray">
                        {/* Parameters */}
                        <div className="px-5 py-3 border-b border-cloud-gray/60">
                          <div className="flex flex-wrap gap-3 text-xs">
                            <span className="text-silver font-bold uppercase tracking-wider shrink-0">Parameters:</span>
                            {meta.parameters.map((p) => (
                              <span key={p.name} className="font-mono font-bold text-charcoal">
                                {p.name} <span className="text-silver font-normal">{p.type}</span>
                              </span>
                            ))}
                            <span className="text-silver font-bold">→</span>
                            <span className="font-mono font-bold text-charcoal">
                              RETURNS <span className="text-silver font-normal">{meta.returns}</span>
                            </span>
                          </div>
                        </div>

                        {/* SQL DDL */}
                        <div className="relative">
                          <div className="absolute top-3 right-3 z-10">
                            <CopyButton text={sql} label="Copy DDL" />
                          </div>
                          <pre className="bg-[#1e1e2e] text-[#c8d3f5] p-4 pr-24 font-mono text-xs leading-relaxed overflow-x-auto whitespace-pre selection:bg-sky-blue/30">
                            {sql}
                          </pre>
                        </div>

                        {/* Sample Call */}
                        <div className="px-5 py-3 bg-cloud-gray/10 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
                          <div className="flex items-center gap-2 flex-wrap min-w-0">
                            <span className="text-silver font-bold uppercase tracking-wider shrink-0">Sample call:</span>
                            <code className="font-mono font-bold text-almost-black break-all">{meta.sampleCall}</code>
                          </div>
                          <CopyButton text={meta.sampleCall} label="Copy" />
                        </div>
                      </div>
                    )}
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
