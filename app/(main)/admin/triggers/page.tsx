"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useAuth } from "@/lib/auth";
import { checkIsAdmin } from "@/lib/admin";

interface TriggerMeta {
  id: string;
  name: string;
  functionName: string;
  table: string;
  timing: string;
  event: string;
  category: string;
  purpose: string;
  postgresSql: string;
  mysqlSql: string;
  sampleDml: string;
  expectedOutcome: string;
}

interface AuditRecord {
  id: number;
  profile_id: string;
  old_score: number;
  new_score: number;
  score_delta: number;
  old_level: number;
  new_level: number;
  changed_at: string;
}

function CopyButton({ text, label = "Copy SQL" }: { text: string; label?: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <button
      onClick={() => {
        navigator.clipboard.writeText(text);
        setCopied(true);
        setTimeout(() => setCopied(false), 1500);
      }}
      className="px-2.5 py-1 text-xs font-bold rounded-xl bg-cloud-gray/20 hover:bg-cloud-gray/40 text-silver hover:text-charcoal border border-cloud-gray/40 transition-colors cursor-pointer shrink-0"
    >
      {copied ? "Copied!" : label}
    </button>
  );
}

export default function AdminTriggersPage() {
  const { user, isLoaded } = useAuth();
  const isAdmin = checkIsAdmin(user);

  const [triggers, setTriggers] = useState<TriggerMeta[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"catalog" | "simulator" | "ddl" | "audit">("catalog");
  const [sqlDialect, setSqlDialect] = useState<"postgres" | "mysql">("postgres");
  const [expandedTrigger, setExpandedTrigger] = useState<string | null>("trg_validate_game_economy");

  // Simulator 1: Economy Validation Trigger (trg_validate_game_economy)
  const [simGems, setSimGems] = useState<number>(-200);
  const [simHearts, setSimHearts] = useState<number>(5);
  const [simFreezes, setSimFreezes] = useState<number>(1);
  const [sim1Result, setSim1Result] = useState<any>(null);
  const [sim1Loading, setSim1Loading] = useState(false);

  // Simulator 2: Cadet Rank Level Calculation (trg_enforce_cadet_progression_rules)
  const [simScore, setSimScore] = useState<number>(3250);
  const [simLessons, setSimLessons] = useState<number>(15);
  const [sim2Result, setSim2Result] = useState<any>(null);
  const [sim2Loading, setSim2Loading] = useState(false);

  // Simulator 3: Automatic Lesson Activity Log & Cascade (trg_auto_log_cadet_activity)
  const [simOldScore, setSimOldScore] = useState<number>(1800);
  const [simOldLessons, setSimOldLessons] = useState<number>(8);
  const [simDelta, setSimDelta] = useState<number>(500);
  const [sim3Result, setSim3Result] = useState<any>(null);
  const [sim3Loading, setSim3Loading] = useState(false);

  useEffect(() => {
    if (isLoaded && isAdmin) {
      fetchTriggers();
    }
  }, [isLoaded, isAdmin]);

  const fetchTriggers = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/triggers");
      const data = await res.json();
      if (data.triggers) setTriggers(data.triggers);
      if (data.auditLogs) setAuditLogs(data.auditLogs);
    } catch (err) {
      console.error("Error fetching triggers:", err);
    } finally {
      setLoading(false);
    }
  };

  const runSim1 = async () => {
    setSim1Loading(true);
    try {
      const res = await fetch("/api/admin/triggers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "simulate_economy_validation",
          params: { gems: simGems, hearts: simHearts, streak_freeze_count: simFreezes },
        }),
      });
      const data = await res.json();
      if (data.simulationResult) setSim1Result(data.simulationResult);
    } catch (err) {
      console.error(err);
    } finally {
      setSim1Loading(false);
    }
  };

  const runSim2 = async () => {
    setSim2Loading(true);
    try {
      const res = await fetch("/api/admin/triggers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "simulate_level_calc",
          params: { total_score: simScore, lessons_completed: simLessons },
        }),
      });
      const data = await res.json();
      if (data.simulationResult) setSim2Result(data.simulationResult);
    } catch (err) {
      console.error(err);
    } finally {
      setSim2Loading(false);
    }
  };

  const runSim3 = async () => {
    setSim3Loading(true);
    try {
      const res = await fetch("/api/admin/triggers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "simulate_lesson_sync",
          params: { old_score: simOldScore, old_lessons: simOldLessons, score_delta: simDelta },
        }),
      });
      const data = await res.json();
      if (data.simulationResult) setSim3Result(data.simulationResult);
    } catch (err) {
      console.error(err);
    } finally {
      setSim3Loading(false);
    }
  };

  return (
    <main className="flex-1 w-full max-w-[1060px] mx-auto pb-24 flex flex-col gap-6 pt-4 md:pt-8 px-4 font-din-round text-almost-black">
      {/* Breadcrumb Navigation */}
      <div className="flex items-center gap-2 text-xs font-bold text-silver">
        <Link href="/admin" className="hover:text-sky-blue transition-colors">
          Admin Dashboard
        </Link>
        <span>/</span>
        <span className="text-charcoal">SQL Triggers</span>
      </div>

      {/* Header Banner */}
      <div className="bg-gradient-to-r from-[#1cb0f6]/10 via-[#a570ff]/10 to-[#58cc02]/10 border-2 border-sky-blue/30 rounded-3xl p-6 sm:p-8 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6 shadow-sm">
        <div className="flex flex-col gap-2 max-w-[620px]">
          <div className="flex flex-wrap items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full text-xs font-extrabold bg-sky-blue/20 text-sky-blue border border-sky-blue/30 uppercase tracking-wider">
              DBMS Laboratory Requirement
            </span>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-extrabold bg-duo-green/20 text-duo-green border border-duo-green/30 uppercase tracking-wider">
              4 Traditional SQL Triggers
            </span>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-extrabold bg-[#a570ff]/20 text-[#a570ff] border border-[#a570ff]/30 uppercase tracking-wider">
              PostgreSQL & MySQL
            </span>
          </div>
          <h1 className="font-feather text-heading text-almost-black tracking-tight mt-1">
            Traditional SQL Triggers
          </h1>
          <p className="text-graphite text-sm leading-relaxed">
            Automated database-tier validation triggers (preventing negative balances/quantities), cadet rank business rules, immutable audit ledgers, and automated activity logging for the Civil Service Examination Reviewer.
          </p>
        </div>

        <div className="flex flex-col gap-2 shrink-0">
          <div className="bg-snow-white border-2 border-cloud-gray rounded-2xl p-4 flex items-center gap-4">
            <div className="w-10 h-10 rounded-full bg-duo-green/20 text-duo-green flex items-center justify-center font-extrabold text-xl">
              ⚡
            </div>
            <div>
              <p className="text-[11px] font-extrabold text-silver uppercase tracking-wider">Active Triggers</p>
              <p className="text-xl font-extrabold text-almost-black">4 Operational</p>
            </div>
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex border-b-2 border-cloud-gray overflow-x-auto gap-2 sm:gap-6 pt-2 pb-0 scrollbar-none">
        {[
          { key: "catalog", label: "Trigger Catalog" },
          { key: "simulator", label: "Live Trigger Simulator" },
          { key: "ddl", label: "SQL DDL & Script" },
          { key: "audit", label: "Score Audit Ledger" },
        ].map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key as any)}
            className={`pb-3 font-extrabold text-[15px] tracking-wider uppercase border-b-4 transition-all shrink-0 px-2 cursor-pointer ${
              activeTab === tab.key
                ? "border-sky-blue text-sky-blue"
                : "border-transparent text-silver hover:text-charcoal hover:border-cloud-gray"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* ══════════════════════════ TAB 1: TRIGGER CATALOG ══════════════════════════ */}
      {activeTab === "catalog" && (
        <div className="flex flex-col gap-5 animate-fadeIn">
          {triggers.map((trg, idx) => {
            const isExpanded = expandedTrigger === trg.id;
            return (
              <div
                key={trg.id}
                className="bg-snow-white border-2 border-cloud-gray rounded-2xl overflow-hidden hover:border-sky-blue/50 transition-all"
              >
                <div
                  onClick={() => setExpandedTrigger(isExpanded ? null : trg.id)}
                  className="p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 cursor-pointer hover:bg-cloud-gray/5"
                >
                  <div className="flex items-start sm:items-center gap-4">
                    <span className="w-9 h-9 rounded-xl bg-sky-blue/15 text-sky-blue font-extrabold flex items-center justify-center shrink-0 text-sm">
                      #{idx + 1}
                    </span>
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className="font-extrabold text-base text-almost-black font-mono">{trg.name}</h3>
                        <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-[#ffc700]/15 text-[#b38600] border border-[#ffc700]/30">
                          {trg.timing} {trg.event}
                        </span>
                        <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-[#a570ff]/15 text-[#a570ff] border border-[#a570ff]/30">
                          ON {trg.table}
                        </span>
                      </div>
                      <p className="text-graphite text-xs mt-1">{trg.purpose}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 shrink-0 self-end sm:self-auto">
                    <span className="text-xs font-bold text-silver">
                      {isExpanded ? "▲ Collapse" : "▼ View DDL"}
                    </span>
                  </div>
                </div>

                {isExpanded && (
                  <div className="border-t-2 border-cloud-gray p-5 bg-[#fafafa] flex flex-col gap-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs font-bold">
                      <div className="bg-snow-white border border-cloud-gray p-3 rounded-xl">
                        <span className="text-silver block text-[10px] uppercase tracking-wider">Trigger Function</span>
                        <code className="text-sky-blue font-mono">{trg.functionName}()</code>
                      </div>
                      <div className="bg-snow-white border border-cloud-gray p-3 rounded-xl">
                        <span className="text-silver block text-[10px] uppercase tracking-wider">Category</span>
                        <span className="text-charcoal">{trg.category}</span>
                      </div>
                      <div className="bg-snow-white border border-cloud-gray p-3 rounded-xl md:col-span-2">
                        <span className="text-silver block text-[10px] uppercase tracking-wider">Verification Sample DML</span>
                        <code className="text-[#58cc02] font-mono block mt-0.5">{trg.sampleDml}</code>
                      </div>
                    </div>

                    <div className="relative">
                      <div className="flex items-center justify-between pb-2">
                        <span className="text-xs font-bold text-silver uppercase tracking-wider">
                          PostgreSQL (Supabase) Implementation
                        </span>
                        <CopyButton text={trg.postgresSql} />
                      </div>
                      <pre className="bg-[#1e1e2e] text-[#c8d3f5] p-4 rounded-xl font-mono text-xs overflow-x-auto leading-relaxed border border-cloud-gray/20">
                        <code>{trg.postgresSql}</code>
                      </pre>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* ══════════════════════════ TAB 2: LIVE SIMULATOR ══════════════════════════ */}
      {activeTab === "simulator" && (
        <div className="flex flex-col gap-8 animate-fadeIn">
          {/* SIMULATOR 1: VALIDATION TRIGGER */}
          <div className="bg-snow-white border-2 border-cloud-gray rounded-3xl p-6 flex flex-col gap-5">
            <div className="flex flex-col gap-1 border-b border-cloud-gray pb-3">
              <div className="flex items-center gap-2">
                <span className="px-2 py-0.5 rounded-full text-[11px] font-extrabold bg-red-500/20 text-red-600">
                  TRIGGER 1
                </span>
                <h3 className="font-extrabold text-lg text-almost-black">
                  Validation Trigger: Prevent Invalid Quantities & Balances
                </h3>
              </div>
              <p className="text-graphite text-xs">
                Tests <code>trg_validate_game_economy</code> on <code>profile_game_state</code>: Enter negative gems (e.g. -200 from shop purchase), hearts overflow (&gt; 5), or streak freeze overflow (&gt; 2). Verifies database aborts with <code>P0001 (Validation Trigger Error)</code>.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-extrabold text-silver uppercase tracking-wider">
                  Attempted Gems Balance
                </label>
                <input
                  type="number"
                  value={simGems}
                  onChange={(e) => setSimGems(Number(e.target.value))}
                  className="border-2 border-cloud-gray focus:border-red-500 rounded-xl p-3 font-bold text-almost-black text-sm outline-none"
                  placeholder="e.g. -200"
                />
                <span className="text-[10px] text-silver font-bold">Negative = insufficient shop funds</span>
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-extrabold text-silver uppercase tracking-wider">
                  Attempted Hearts
                </label>
                <input
                  type="number"
                  value={simHearts}
                  onChange={(e) => setSimHearts(Number(e.target.value))}
                  className="border-2 border-cloud-gray focus:border-red-500 rounded-xl p-3 font-bold text-almost-black text-sm outline-none"
                  placeholder="e.g. 5"
                />
                <span className="text-[10px] text-silver font-bold">Max allowed: 5</span>
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-extrabold text-silver uppercase tracking-wider">
                  Equipped Streak Freezes
                </label>
                <input
                  type="number"
                  value={simFreezes}
                  onChange={(e) => setSimFreezes(Number(e.target.value))}
                  className="border-2 border-cloud-gray focus:border-red-500 rounded-xl p-3 font-bold text-almost-black text-sm outline-none"
                  placeholder="e.g. 1"
                />
                <span className="text-[10px] text-silver font-bold">Max allowed: 2</span>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <button
                onClick={runSim1}
                disabled={sim1Loading}
                className="bg-red-500 hover:bg-red-600 text-white font-extrabold px-6 py-3 rounded-2xl shadow-[0_4px_0_#b91c1c] active:translate-y-1 active:shadow-none transition-all uppercase text-xs tracking-wider cursor-pointer"
              >
                {sim1Loading ? "Triggering..." : "⚡ Execute Validation Trigger"}
              </button>
            </div>

            {sim1Result && (
              <div className={`border-2 rounded-2xl p-5 flex flex-col gap-3 animate-fadeIn ${sim1Result.output.rejected ? "bg-red-50/70 border-red-300" : "bg-[#f0fdf4] border-duo-green/30"}`}>
                <div className="flex items-center justify-between">
                  <span className={`font-extrabold text-xs uppercase tracking-wider ${sim1Result.output.rejected ? "text-red-600" : "text-duo-green"}`}>
                    Database Trigger Execution Status
                  </span>
                  <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-extrabold ${sim1Result.output.rejected ? "bg-red-600 text-white" : "bg-duo-green text-white"}`}>
                    {sim1Result.output.rejected ? "❌ EXCEPTION P0001 (ABORTED)" : "✅ TRANSACTION COMMITTED"}
                  </span>
                </div>

                <div className="p-4 rounded-xl bg-white border border-cloud-gray/40 font-mono text-xs flex flex-col gap-2">
                  <span className="text-silver text-[10px] uppercase font-bold tracking-wider">Database Response to GUI:</span>
                  <p className={sim1Result.output.rejected ? "text-red-600 font-bold" : "text-duo-green font-bold"}>
                    {sim1Result.output.rejected ? `❌ ${sim1Result.output.error}` : "✅ Transaction committed successfully: data integrity validated."}
                  </p>
                </div>

                <p className="text-graphite text-xs mt-1">
                  <strong>Trigger Pipeline:</strong> {sim1Result.explanation}
                </p>
              </div>
            )}
          </div>

          {/* SIMULATOR 2: BUSINESS RULES TRIGGER */}
          <div className="bg-snow-white border-2 border-cloud-gray rounded-3xl p-6 flex flex-col gap-5">
            <div className="flex flex-col gap-1 border-b border-cloud-gray pb-3">
              <div className="flex items-center gap-2">
                <span className="px-2 py-0.5 rounded-full text-[11px] font-extrabold bg-sky-blue/20 text-sky-blue">
                  TRIGGER 2
                </span>
                <h3 className="font-extrabold text-lg text-almost-black">
                  Enforcing Business Rules: Cadet Rank Calculation & Date Sync
                </h3>
              </div>
              <p className="text-graphite text-xs">
                Tests <code>trg_enforce_cadet_progression_rules</code> on <code>profile_progress</code>: Cumulative total score (XP) determines Cadet Rank Tier without client-side calculation.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-extrabold text-silver uppercase tracking-wider">
                  Total Score (XP)
                </label>
                <input
                  type="number"
                  value={simScore}
                  onChange={(e) => setSimScore(Number(e.target.value))}
                  className="border-2 border-cloud-gray focus:border-sky-blue rounded-xl p-3 font-bold text-almost-black text-sm outline-none"
                  placeholder="e.g. 3250"
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-extrabold text-silver uppercase tracking-wider">
                  Completed Lessons
                </label>
                <input
                  type="number"
                  value={simLessons}
                  onChange={(e) => setSimLessons(Number(e.target.value))}
                  className="border-2 border-cloud-gray focus:border-sky-blue rounded-xl p-3 font-bold text-almost-black text-sm outline-none"
                  placeholder="e.g. 15"
                />
              </div>
            </div>

            <div className="flex items-center gap-3">
              <button
                onClick={runSim2}
                disabled={sim2Loading}
                className="bg-sky-blue text-white font-extrabold px-6 py-3 rounded-2xl shadow-[0_4px_0_#0f9cdb] active:translate-y-1 active:shadow-none transition-all uppercase text-xs tracking-wider cursor-pointer"
              >
                {sim2Loading ? "Triggering..." : "⚡ Execute Business Rules Trigger"}
              </button>
            </div>

            {sim2Result && (
              <div className="bg-[#f0f9ff] border-2 border-sky-blue/30 rounded-2xl p-5 flex flex-col gap-3 animate-fadeIn">
                <div className="flex items-center justify-between">
                  <span className="font-extrabold text-xs text-sky-blue uppercase tracking-wider">
                    Trigger Output (BEFORE INSERT OR UPDATE ON profile_progress)
                  </span>
                  <span className="text-[11px] font-mono font-bold text-silver">
                    {sim2Result.sqlFired}
                  </span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 font-bold text-sm">
                  <div className="bg-snow-white p-3 rounded-xl border border-sky-blue/20">
                    <span className="text-[10px] text-silver block uppercase">Score Evaluated</span>
                    <span className="text-almost-black">{sim2Result.output.total_score} XP</span>
                  </div>
                  <div className="bg-snow-white p-3 rounded-xl border border-sky-blue/20">
                    <span className="text-[10px] text-silver block uppercase">Calculated Level</span>
                    <span className="text-duo-green text-base">Level {sim2Result.output.current_level}</span>
                  </div>
                  <div className="bg-snow-white p-3 rounded-xl border border-sky-blue/20">
                    <span className="text-[10px] text-silver block uppercase">Cadet Rank Title</span>
                    <span className="text-[#a570ff] text-xs">{sim2Result.output.rank_title}</span>
                  </div>
                  <div className="bg-snow-white p-3 rounded-xl border border-sky-blue/20">
                    <span className="text-[10px] text-silver block uppercase">Date Synced</span>
                    <span className="text-charcoal font-mono text-xs">{sim2Result.output.last_lesson_date}</span>
                  </div>
                </div>

                <p className="text-graphite text-xs mt-1">
                  <strong>Explanation:</strong> {sim2Result.explanation}
                </p>
              </div>
            )}
          </div>

          {/* SIMULATOR 3: AUTOMATIC ACTIVITY LOGGING & CASCADE */}
          <div className="bg-snow-white border-2 border-cloud-gray rounded-3xl p-6 flex flex-col gap-5">
            <div className="flex flex-col gap-1 border-b border-cloud-gray pb-3">
              <div className="flex items-center gap-2">
                <span className="px-2 py-0.5 rounded-full text-[11px] font-extrabold bg-duo-green/20 text-duo-green">
                  TRIGGER 4
                </span>
                <h3 className="font-extrabold text-lg text-almost-black">
                  Automatic Data Logging: Lesson Activity Logging & Ledger Sync
                </h3>
              </div>
              <p className="text-graphite text-xs">
                Tests <code>trg_auto_log_cadet_activity</code> on <code>lesson_events</code>: Automatically writes human-readable activity records to <code>cadet_activity_logs</code> and triggers the audit ledger cascade.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-extrabold text-silver uppercase tracking-wider">Initial Score</label>
                <input
                  type="number"
                  value={simOldScore}
                  onChange={(e) => setSimOldScore(Number(e.target.value))}
                  className="border-2 border-cloud-gray focus:border-duo-green rounded-xl p-3 font-bold text-almost-black text-sm outline-none"
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-extrabold text-silver uppercase tracking-wider">Initial Lessons</label>
                <input
                  type="number"
                  value={simOldLessons}
                  onChange={(e) => setSimOldLessons(Number(e.target.value))}
                  className="border-2 border-cloud-gray focus:border-duo-green rounded-xl p-3 font-bold text-almost-black text-sm outline-none"
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-extrabold text-silver uppercase tracking-wider">XP Delta from Lesson</label>
                <input
                  type="number"
                  value={simDelta}
                  onChange={(e) => setSimDelta(Number(e.target.value))}
                  className="border-2 border-cloud-gray focus:border-duo-green rounded-xl p-3 font-bold text-almost-black text-sm outline-none"
                />
              </div>
            </div>

            <div className="flex items-center gap-3">
              <button
                onClick={runSim3}
                disabled={sim3Loading}
                className="bg-duo-green text-white font-extrabold px-6 py-3 rounded-2xl shadow-[0_4px_0_#3f8f01] active:translate-y-1 active:shadow-none transition-all uppercase text-xs tracking-wider cursor-pointer"
              >
                {sim3Loading ? "Triggering..." : "⚡ Execute AFTER INSERT Activity Logging"}
              </button>
            </div>

            {sim3Result && (
              <div className="bg-[#f0fdf4] border-2 border-duo-green/30 rounded-2xl p-5 flex flex-col gap-3 animate-fadeIn">
                <div className="flex items-center justify-between">
                  <span className="font-extrabold text-xs text-duo-green uppercase tracking-wider">
                    Cascading Output (AFTER INSERT ON lesson_events)
                  </span>
                  {sim3Result.output.is_level_up && (
                    <span className="px-2 py-0.5 rounded-full text-[11px] font-extrabold bg-[#ffc700] text-almost-black animate-pulse">
                      🎉 Level Up Triggered!
                    </span>
                  )}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 font-bold text-sm">
                  <div className="bg-snow-white p-3 rounded-xl border border-duo-green/20">
                    <span className="text-[10px] text-silver block uppercase">Activity Auto-Logged</span>
                    <span className="text-almost-black text-xs block font-bold mt-1">
                      {sim3Result.output.activity_log_inserted.activity_description}
                    </span>
                    <span className="text-[11px] text-silver">Table: cadet_activity_logs</span>
                  </div>

                  <div className="bg-snow-white p-3 rounded-xl border border-duo-green/20">
                    <span className="text-[10px] text-silver block uppercase">New State (Updated by Trigger)</span>
                    <span className="text-duo-green block">{sim3Result.output.updated_state.total_score} XP</span>
                    <span className="text-xs text-charcoal">Level {sim3Result.output.updated_state.current_level} ({sim3Result.output.updated_state.lessons_completed} lessons)</span>
                  </div>

                  <div className="bg-snow-white p-3 rounded-xl border border-duo-green/20">
                    <span className="text-[10px] text-silver block uppercase">Audit Trail Ledger</span>
                    <span className="text-sky-blue block">+{sim3Result.output.audit_logged.score_delta} XP Delta</span>
                    <span className="text-xs text-silver">Table: score_audit_logs</span>
                  </div>
                </div>

                <p className="text-graphite text-xs mt-1">
                  <strong>Cascading Flow:</strong> {sim3Result.explanation}
                </p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ══════════════════════════ TAB 3: SQL DDL & SCRIPT ══════════════════════════ */}
      {activeTab === "ddl" && (
        <div className="flex flex-col gap-6 animate-fadeIn">
          {/* Dialect Switcher */}
          <div className="flex items-center justify-between bg-snow-white border-2 border-cloud-gray rounded-2xl p-3 px-4">
            <span className="text-xs font-extrabold text-silver uppercase tracking-wider">
              Select SQL Dialect:
            </span>
            <div className="flex gap-2">
              <button
                onClick={() => setSqlDialect("postgres")}
                className={`px-4 py-1.5 rounded-xl font-extrabold text-xs tracking-wider transition-all cursor-pointer ${
                  sqlDialect === "postgres"
                    ? "bg-sky-blue text-white shadow-[0_2px_0_#0f9cdb]"
                    : "bg-cloud-gray/20 text-charcoal hover:bg-cloud-gray/40"
                }`}
              >
                PostgreSQL (Supabase)
              </button>
              <button
                onClick={() => setSqlDialect("mysql")}
                className={`px-4 py-1.5 rounded-xl font-extrabold text-xs tracking-wider transition-all cursor-pointer ${
                  sqlDialect === "mysql"
                    ? "bg-[#ffc700] text-almost-black shadow-[0_2px_0_#b38600]"
                    : "bg-cloud-gray/20 text-charcoal hover:bg-cloud-gray/40"
                }`}
              >
                MySQL / MariaDB
              </button>
            </div>
          </div>

          {triggers.map((trg, idx) => {
            const sqlCode = sqlDialect === "postgres" ? trg.postgresSql : trg.mysqlSql;
            return (
              <div key={trg.id} className="bg-snow-white border-2 border-cloud-gray rounded-2xl overflow-hidden">
                <div className="p-4 bg-cloud-gray/10 border-b border-cloud-gray flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="font-extrabold text-sm text-almost-black">
                      #{idx + 1} {trg.name}
                    </span>
                    <span className="text-xs text-silver font-bold">
                      ({sqlDialect === "postgres" ? "PostgreSQL" : "MySQL"})
                    </span>
                  </div>
                  <CopyButton text={sqlCode} />
                </div>
                <pre className="bg-[#1e1e2e] text-[#c8d3f5] p-5 font-mono text-xs overflow-x-auto leading-relaxed m-0">
                  <code>{sqlCode}</code>
                </pre>
              </div>
            );
          })}
        </div>
      )}

      {/* ══════════════════════════ TAB 4: AUDIT LOGS LEDGER ══════════════════════════ */}
      {activeTab === "audit" && (
        <div className="flex flex-col gap-5 animate-fadeIn">
          <div className="bg-snow-white border-2 border-cloud-gray rounded-2xl overflow-hidden">
            <div className="p-5 border-b border-cloud-gray flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
              <div>
                <h3 className="font-extrabold text-base text-almost-black">
                  Score Audit Logs Ledger (<code>score_audit_logs</code>)
                </h3>
                <p className="text-silver text-xs">
                  Populated by <code>trg_audit_score_adjustments</code> whenever reviewer XP is modified.
                </p>
              </div>
              <button
                onClick={fetchTriggers}
                className="text-sky-blue hover:bg-sky-blue/10 px-3 py-1.5 rounded-xl border border-sky-blue/30 text-xs font-bold transition-all cursor-pointer"
              >
                🔄 Refresh Ledger
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full border-collapse text-left font-din-round text-sm">
                <thead>
                  <tr className="border-b-2 border-cloud-gray bg-cloud-gray/10 text-silver font-extrabold text-[12px] uppercase tracking-wider">
                    <th className="p-3.5">Log ID</th>
                    <th className="p-3.5">Profile ID</th>
                    <th className="p-3.5">Old Score</th>
                    <th className="p-3.5">New Score</th>
                    <th className="p-3.5">Delta</th>
                    <th className="p-3.5">Old Level</th>
                    <th className="p-3.5">New Level</th>
                    <th className="p-3.5">Timestamp</th>
                  </tr>
                </thead>
                <tbody className="divide-y-2 divide-cloud-gray font-bold text-charcoal">
                  {auditLogs.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="p-8 text-center text-silver">
                        No audit records recorded yet.
                      </td>
                    </tr>
                  ) : (
                    auditLogs.map((log) => (
                      <tr key={log.id} className="hover:bg-cloud-gray/5 font-mono text-xs">
                        <td className="p-3.5 text-silver">#{log.id}</td>
                        <td className="p-3.5 text-almost-black font-sans font-bold">{log.profile_id}</td>
                        <td className="p-3.5">{log.old_score} XP</td>
                        <td className="p-3.5 text-almost-black font-extrabold">{log.new_score} XP</td>
                        <td className="p-3.5 text-duo-green">+{log.score_delta} XP</td>
                        <td className="p-3.5 text-silver font-sans">Lvl {log.old_level}</td>
                        <td className="p-3.5 text-sky-blue font-sans">Lvl {log.new_level}</td>
                        <td className="p-3.5 text-silver text-[11px]">
                          {new Date(log.changed_at).toLocaleString()}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
