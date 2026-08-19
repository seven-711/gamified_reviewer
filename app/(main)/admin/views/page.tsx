"use client";

import React, { useState, useEffect } from "react";

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

// ─── Helpers ──────────────────────────────────────────────────────────────────

const LEAGUE_COLORS: Record<string, string> = {
  "Legend League": "#ef4444",
  "Champion League": "#ec4899",
  "Master League": "#a855f7",
  "Diamond League": "#3b82f6",
  "Crystal League": "#06b6d4",
  "Gold League": "#f59e0b",
  "Silver League": "#94a3b8",
  "Bronze League": "#cc348d",
};

const LEAGUE_EMOJI: Record<string, string> = {
  "Legend League": "🔴",
  "Champion League": "🌸",
  "Master League": "💜",
  "Diamond League": "💎",
  "Crystal League": "🔷",
  "Gold League": "🥇",
  "Silver League": "🥈",
  "Bronze League": "🥉",
};

function fmt(v: string | null) {
  if (!v) return "—";
  const d = new Date(v);
  return d.toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" });
}

function truncate(s: string | null, n = 16) {
  if (!s) return "—";
  return s.length > n ? s.slice(0, n) + "…" : s;
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function SqlBlock({ label, sql }: { label: string; sql: string }) {
  const [copied, setCopied] = useState(false);
  const copy = () => {
    navigator.clipboard.writeText(sql);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };
  return (
    <div className="sql-block">
      <div className="sql-block-header">
        <span className="sql-label">{label}</span>
        <button className="copy-btn" onClick={copy}>
          {copied ? "✓ Copied" : "Copy SQL"}
        </button>
      </div>
      <pre className="sql-code">{sql}</pre>
    </div>
  );
}

function ViewBadge({ view, active, onClick }: { view: string; active: boolean; onClick: () => void }) {
  const labels: Record<string, string> = {
    view1: "VIEW 1",
    view2: "VIEW 2",
    view3: "VIEW 3",
  };
  const descs: Record<string, string> = {
    view1: "Full Profile",
    view2: "Game Status",
    view3: "Activity Summary",
  };
  return (
    <button
      onClick={onClick}
      className={`view-badge ${active ? "view-badge-active" : ""}`}
      id={`view-tab-${view}`}
    >
      <span className="view-badge-num">{labels[view]}</span>
      <span className="view-badge-desc">{descs[view]}</span>
    </button>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function SqlViewsPage() {
  const [data, setData] = useState<ViewsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeView, setActiveView] = useState<"view1" | "view2" | "view3">("view1");
  const [showSql, setShowSql] = useState(true);

  useEffect(() => {
    setLoading(true);
    fetch("/api/admin/views")
      .then((r) => r.json())
      .then((d) => setData(d))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const viewMeta: Record<
    string,
    { title: string; sql_name: string; purpose: string; tables: string[]; feature: string; color: string }
  > = {
    view1: {
      title: "vw_user_full_profile",
      sql_name: "vw_user_full_profile",
      purpose: "Full Player Dashboard Report — combines identity, study preferences, and learning progress into one unified snapshot.",
      tables: ["profiles", "profile_study_settings", "profile_progress"],
      feature: "Admin 'Users' tab & Player Profile page",
      color: "#58cc02",
    },
    view2: {
      title: "vw_user_game_status",
      sql_name: "vw_user_game_status",
      purpose: "Game Economy & Engagement Report — tracks streaks, hearts, gems, league ranks and freeze counts per player.",
      tables: ["profiles", "profile_game_state", "profile_progress"],
      feature: "Admin 'Overview' tab & Leaderboard page",
      color: "#a570ff",
    },
    view3: {
      title: "vw_lesson_activity_summary",
      sql_name: "vw_lesson_activity_summary",
      purpose: "Lesson Activity & XP Audit Report — aggregates each player's lesson completion events, XP earned, and activity timeline.",
      tables: ["profiles", "lesson_events", "profile_study_settings"],
      feature: "Admin SQL Views Report page (this page)",
      color: "#1cb0f6",
    },
  };

  const meta = viewMeta[activeView];

  return (
    <>
      <style>{`
        /* ── Page Layout ── */
        .views-root {
          width: 100%;
          min-height: 100vh;
          padding-bottom: 48px;
          font-family: 'Din Round', system-ui, sans-serif;
        }

        /* ── Header ── */
        .views-header {
          padding: 28px 0 20px;
        }
        .views-title {
          font-size: 1.75rem;
          font-weight: 800;
          color: var(--text-primary, #1e1e1e);
          letter-spacing: -0.5px;
          margin: 0 0 4px;
          display: flex;
          align-items: center;
          gap: 10px;
        }
        .views-subtitle {
          font-size: 0.875rem;
          color: var(--text-secondary, #6e7891);
          margin: 0 0 20px;
        }

        /* ── VIEW Tabs ── */
        .view-tabs {
          display: flex;
          gap: 10px;
          flex-wrap: wrap;
          margin-bottom: 24px;
        }
        .view-badge {
          display: flex;
          flex-direction: column;
          align-items: flex-start;
          padding: 10px 18px;
          border-radius: 12px;
          border: 2px solid #e0e4ef;
          background: #f8f9fc;
          cursor: pointer;
          transition: all 0.18s;
          gap: 2px;
        }
        .dark-mode .view-badge { background: #1a1a2e; border-color: #2a2a40; }
        .view-badge:hover { border-color: #a0a8c0; }
        .view-badge-active {
          border-color: #5b5ef6 !important;
          background: linear-gradient(135deg, #5b5ef610, #a570ff10) !important;
          box-shadow: 0 0 0 3px #5b5ef620;
        }
        .view-badge-num {
          font-size: 0.65rem;
          font-weight: 800;
          text-transform: uppercase;
          letter-spacing: 1px;
          color: #5b5ef6;
        }
        .view-badge-desc {
          font-size: 0.875rem;
          font-weight: 700;
          color: #1e1e1e;
        }
        .dark-mode .view-badge-desc { color: #e0e4ef; }

        /* ── View Meta Card ── */
        .view-meta-card {
          border-radius: 16px;
          border: 2px solid #e0e4ef;
          background: #ffffff;
          padding: 20px 24px;
          margin-bottom: 20px;
          display: flex;
          flex-direction: column;
          gap: 12px;
        }
        .dark-mode .view-meta-card { background: #12121f; border-color: #2a2a40; }
        .view-meta-title {
          font-size: 1.15rem;
          font-weight: 800;
          color: #1e1e1e;
          font-family: 'Courier New', monospace;
          display: flex;
          align-items: center;
          gap: 8px;
          flex-wrap: wrap;
        }
        .dark-mode .view-meta-title { color: #e8eaf6; }
        .view-meta-dot {
          width: 10px; height: 10px;
          border-radius: 50%;
          flex-shrink: 0;
        }
        .view-meta-purpose {
          font-size: 0.875rem;
          color: #44485a;
          line-height: 1.5;
        }
        .dark-mode .view-meta-purpose { color: #8b90ab; }
        .view-meta-tables {
          display: flex;
          flex-wrap: wrap;
          gap: 8px;
        }
        .table-chip {
          padding: 4px 12px;
          border-radius: 20px;
          font-size: 0.75rem;
          font-weight: 700;
          font-family: 'Courier New', monospace;
          border: 1.5px solid;
        }
        .view-meta-row {
          display: flex;
          align-items: center;
          gap: 8px;
          font-size: 0.8rem;
          color: #6e7891;
        }
        .view-meta-row strong { color: #1e1e1e; }
        .dark-mode .view-meta-row strong { color: #e0e4ef; }

        /* ── SQL Block ── */
        .sql-toggle-bar {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: 12px;
        }
        .sql-toggle-label {
          font-size: 0.875rem;
          font-weight: 700;
          color: #44485a;
        }
        .dark-mode .sql-toggle-label { color: #8b90ab; }
        .sql-toggle-btn {
          font-size: 0.75rem;
          font-weight: 700;
          color: #5b5ef6;
          background: none;
          border: none;
          cursor: pointer;
          padding: 4px 10px;
          border-radius: 8px;
          background: #5b5ef610;
          transition: background 0.15s;
        }
        .sql-toggle-btn:hover { background: #5b5ef625; }
        .sql-block {
          border-radius: 12px;
          overflow: hidden;
          border: 1.5px solid #e0e4ef;
          margin-bottom: 20px;
        }
        .dark-mode .sql-block { border-color: #2a2a40; }
        .sql-block-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 10px 16px;
          background: #1e1e2e;
        }
        .sql-label {
          font-size: 0.7rem;
          font-weight: 700;
          color: #7c7cff;
          text-transform: uppercase;
          letter-spacing: 1px;
          font-family: 'Courier New', monospace;
        }
        .copy-btn {
          font-size: 0.7rem;
          font-weight: 700;
          color: #58cc02;
          background: none;
          border: 1px solid #58cc0240;
          padding: 3px 10px;
          border-radius: 6px;
          cursor: pointer;
          transition: all 0.15s;
        }
        .copy-btn:hover { background: #58cc0218; }
        .sql-code {
          background: #0d0d1a;
          color: #c8d3f5;
          padding: 16px 18px;
          font-size: 0.78rem;
          line-height: 1.65;
          overflow-x: auto;
          margin: 0;
          font-family: 'Courier New', monospace;
        }

        /* ── Data Table ── */
        .data-section-title {
          font-size: 1rem;
          font-weight: 800;
          color: #1e1e1e;
          margin-bottom: 12px;
          display: flex;
          align-items: center;
          gap: 8px;
        }
        .dark-mode .data-section-title { color: #e0e4ef; }
        .data-count-badge {
          font-size: 0.7rem;
          font-weight: 700;
          background: #5b5ef620;
          color: #5b5ef6;
          padding: 2px 8px;
          border-radius: 10px;
        }
        .table-wrap {
          overflow-x: auto;
          border-radius: 14px;
          border: 1.5px solid #e0e4ef;
          background: #ffffff;
        }
        .dark-mode .table-wrap { background: #12121f; border-color: #2a2a40; }
        table.data-table {
          width: 100%;
          border-collapse: collapse;
          min-width: 640px;
        }
        table.data-table thead {
          background: #f3f4f8;
        }
        .dark-mode table.data-table thead { background: #1a1a2e; }
        table.data-table th {
          padding: 10px 14px;
          font-size: 0.7rem;
          font-weight: 800;
          text-transform: uppercase;
          letter-spacing: 0.7px;
          color: #6e7891;
          text-align: left;
          white-space: nowrap;
          font-family: 'Courier New', monospace;
        }
        table.data-table td {
          padding: 10px 14px;
          font-size: 0.8rem;
          color: #44485a;
          border-top: 1px solid #edf0f7;
          white-space: nowrap;
        }
        .dark-mode table.data-table td {
          color: #9ba0b8;
          border-top-color: #22223a;
        }
        table.data-table tr:hover td { background: #f7f8fd; }
        .dark-mode table.data-table tr:hover td { background: #1c1c30; }
        .td-name { font-weight: 700; color: #1e1e1e !important; }
        .dark-mode .td-name { color: #e0e4ef !important; }
        .td-mono { font-family: 'Courier New', monospace; font-size: 0.72rem !important; }
        .badge-diff {
          display: inline-block;
          padding: 2px 9px;
          border-radius: 9px;
          font-size: 0.7rem;
          font-weight: 700;
        }
        .badge-beginner { background: #58cc0218; color: #3a9a00; }
        .badge-intermediate { background: #ffc70018; color: #9b7200; }
        .badge-advanced { background: #ff4b4b18; color: #cc0000; }

        /* ── Skeleton / Loading ── */
        .skeleton-table { padding: 20px; }
        .skeleton-row {
          height: 36px;
          border-radius: 8px;
          background: linear-gradient(90deg, #e8ecf0 25%, #f3f4f8 50%, #e8ecf0 75%);
          background-size: 200% 100%;
          animation: shimmer 1.4s infinite;
          margin-bottom: 8px;
        }
        .dark-mode .skeleton-row {
          background: linear-gradient(90deg, #1a1a2e 25%, #22223a 50%, #1a1a2e 75%);
          background-size: 200% 100%;
        }
        @keyframes shimmer {
          0% { background-position: -200% 0; }
          100% { background-position: 200% 0; }
        }

        /* ── Empty ── */
        .empty-state {
          text-align: center;
          padding: 40px 20px;
          color: #6e7891;
          font-size: 0.875rem;
        }
      `}</style>

      <div className="views-root">
        {/* Header */}
        <div className="views-header">
          <h1 className="views-title">
            <span>🗄️</span> SQL Views Report
          </h1>
          <p className="views-subtitle">
            Three SQL VIEWs combining multiple tables — implemented as live system features.
          </p>

          {/* VIEW Tabs */}
          <div className="view-tabs" role="tablist">
            {(["view1", "view2", "view3"] as const).map((v) => (
              <ViewBadge
                key={v}
                view={v}
                active={activeView === v}
                onClick={() => setActiveView(v)}
              />
            ))}
          </div>
        </div>

        {/* View Meta Card */}
        {meta && (
          <div className="view-meta-card">
            <div className="view-meta-title">
              <span className="view-meta-dot" style={{ background: meta.color }} />
              {meta.title}
            </div>
            <p className="view-meta-purpose">{meta.purpose}</p>
            <div className="view-meta-tables">
              {meta.tables.map((t, i) => (
                <span
                  key={t}
                  className="table-chip"
                  style={{
                    borderColor: meta.color + "60",
                    color: meta.color,
                    background: meta.color + "12",
                  }}
                >
                  {i === 0 ? "📋 " : i === 1 ? "⚙️ " : "📊 "}
                  {t}
                </span>
              ))}
            </div>
            <div className="view-meta-row">
              <span>🖥️</span>
              <strong>System feature:</strong>
              <span>{meta.feature}</span>
            </div>
          </div>
        )}

        {/* SQL Statement */}
        <div className="sql-toggle-bar">
          <span className="sql-toggle-label">📝 CREATE VIEW Statement</span>
          <button className="sql-toggle-btn" onClick={() => setShowSql((s) => !s)}>
            {showSql ? "Hide SQL ▲" : "Show SQL ▼"}
          </button>
        </div>

        {showSql && data?.viewSql && (
          <SqlBlock
            label={`CREATE OR REPLACE VIEW ${meta.sql_name}`}
            sql={data.viewSql[meta.sql_name] ?? "Loading…"}
          />
        )}

        {/* Data Result */}
        <div className="data-section-title">
          📊 VIEW Result
          {!loading && data && (
            <span className="data-count-badge">
              {activeView === "view1"
                ? data.view1.length
                : activeView === "view2"
                ? data.view2.length
                : data.view3.length}{" "}
              rows
            </span>
          )}
        </div>

        {loading ? (
          <div className="skeleton-table">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="skeleton-row" />
            ))}
          </div>
        ) : !data ? (
          <div className="empty-state">⚠️ Failed to load view data.</div>
        ) : activeView === "view1" ? (
          /* ── VIEW 1 Table ── */
          <div className="table-wrap">
            <table className="data-table">
              <thead>
                <tr>
                  <th>display_name</th>
                  <th>exam_category</th>
                  <th>sub_topic</th>
                  <th>study_style</th>
                  <th>difficulty</th>
                  <th>timer_duration</th>
                  <th>total_score</th>
                  <th>current_level</th>
                  <th>lessons_completed</th>
                  <th>last_lesson_date</th>
                </tr>
              </thead>
              <tbody>
                {data.view1.length === 0 ? (
                  <tr>
                    <td colSpan={10} className="empty-state">No rows found.</td>
                  </tr>
                ) : (
                  data.view1.map((r) => (
                    <tr key={r.profile_id}>
                      <td className="td-name">{r.display_name}</td>
                      <td>{r.exam_category ?? "—"}</td>
                      <td>{truncate(r.sub_topic, 18)}</td>
                      <td>{r.study_style}</td>
                      <td>
                        <span
                          className={`badge-diff ${
                            r.difficulty === "Beginner"
                              ? "badge-beginner"
                              : r.difficulty === "Intermediate"
                              ? "badge-intermediate"
                              : "badge-advanced"
                          }`}
                        >
                          {r.difficulty}
                        </span>
                      </td>
                      <td>{r.timer_duration}m</td>
                      <td style={{ fontWeight: 700, color: "#58cc02" }}>{r.total_score.toLocaleString()}</td>
                      <td>Lv. {r.current_level}</td>
                      <td>{r.lessons_completed}</td>
                      <td className="td-mono">{fmt(r.last_lesson_date)}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        ) : activeView === "view2" ? (
          /* ── VIEW 2 Table ── */
          <div className="table-wrap">
            <table className="data-table">
              <thead>
                <tr>
                  <th>display_name</th>
                  <th>league_name</th>
                  <th>total_score</th>
                  <th>lessons_completed</th>
                  <th>streak 🔥</th>
                  <th>streak_freeze_count</th>
                  <th>hearts ❤️</th>
                  <th>gems 💎</th>
                  <th>last_lesson_date</th>
                </tr>
              </thead>
              <tbody>
                {data.view2.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="empty-state">No rows found.</td>
                  </tr>
                ) : (
                  data.view2.map((r) => (
                    <tr key={r.profile_id}>
                      <td className="td-name">{r.display_name}</td>
                      <td>
                        <span style={{ color: LEAGUE_COLORS[r.league_name] ?? "#999", fontWeight: 700, fontSize: "0.78rem" }}>
                          {LEAGUE_EMOJI[r.league_name] ?? "🏅"} {r.league_name}
                        </span>
                      </td>
                      <td style={{ fontWeight: 700, color: "#58cc02" }}>{r.total_score.toLocaleString()}</td>
                      <td>{r.lessons_completed}</td>
                      <td>{r.streak}</td>
                      <td>{r.streak_freeze_count}</td>
                      <td>{r.hearts}</td>
                      <td style={{ color: "#ffc700", fontWeight: 700 }}>{r.gems}</td>
                      <td className="td-mono">{fmt(r.last_lesson_date)}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        ) : (
          /* ── VIEW 3 Table ── */
          <div className="table-wrap">
            <table className="data-table">
              <thead>
                <tr>
                  <th>display_name</th>
                  <th>exam_category</th>
                  <th>sub_topic</th>
                  <th>total_events</th>
                  <th>total_xp_earned</th>
                  <th>first_activity_at</th>
                  <th>last_activity_at</th>
                </tr>
              </thead>
              <tbody>
                {data.view3.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="empty-state">No lesson events found yet.</td>
                  </tr>
                ) : (
                  data.view3.map((r) => (
                    <tr key={r.profile_id}>
                      <td className="td-name">{r.display_name}</td>
                      <td>{r.exam_category ?? "—"}</td>
                      <td>{truncate(r.sub_topic, 18)}</td>
                      <td style={{ fontWeight: 700 }}>{r.total_events}</td>
                      <td style={{ fontWeight: 700, color: "#58cc02" }}>{(r.total_xp_earned ?? 0).toLocaleString()} XP</td>
                      <td className="td-mono">{fmt(r.first_activity_at)}</td>
                      <td className="td-mono">{fmt(r.last_activity_at)}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </>
  );
}
