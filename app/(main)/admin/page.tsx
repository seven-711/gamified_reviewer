"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useAuth } from "@/lib/auth";
import { useRouter } from "next/navigation";
import { useAlert } from "@/components/ui/AlertContext";
import { useStats } from "@/components/ui/StatsContext";
import { checkIsAdmin } from "@/lib/admin";
import { StreakAsset } from "@/components/ui/StreakAsset";

type Tab = "overview" | "users" | "questions" | "economy";
type ViewMode = "single" | "all";
type FilterType = "all" | "text" | "image";

interface EconomyConfig {
  heartCost: number;
  streakFreezeCost: number;
  baseReward: number;
  passingBonus: number;
  perfectBonus: number;
}

interface UserRecord {
  id: string;
  name: string;
  avatarUrl?: string;
  created_at: string;
  exam_category: string | null;
  sub_topic: string | null;
  study_style: string;
  difficulty: string;
  total_score: number;
  current_level: number;
  lessons_completed: number;
  streak: number;
  streak_freeze_count: number;
  hearts: number;
  gems: number;
  last_lesson_date: string | null;
}

interface Question {
  id: number;
  type: string;
  prompt: string;
  options: string[];
  correctIndex: number;
  explanation: string;
  image?: string;
  // enriched fields for UNION ALL / multi-column views
  testId?: string;
  category?: string;
  categoryLabel?: string;
}

interface CorrelatedStat {
  category: string;
  label: string;
  testCount: number;
  questionCount: number;
}

interface SubqueryStats {
  scalarTotalQuestions: number;
  correlatedPerCategory: CorrelatedStat[];
  multirowImageCount: number;
  multirowTextCount: number;
  multicolSample: Question[];
  totalQuestionsInAll: number;
}

// Category metadata
const CATEGORY_META: Record<string, { label: string; color: string; bg: string; border: string; icon: string }> = {
  abstract:     { label: "Abstract Reasoning",     color: "#58cc02", bg: "bg-[#58cc02]/10", border: "border-[#58cc02]/30", icon: "🔷" },
  logical:      { label: "Logical Reasoning",       color: "#a570ff", bg: "bg-[#a570ff]/10", border: "border-[#a570ff]/30", icon: "🧩" },
  numerical:    { label: "Numerical Reasoning",     color: "#ffc700", bg: "bg-[#ffc700]/10", border: "border-[#ffc700]/30", icon: "🔢" },
  quantitative: { label: "Quantitative Reasoning",  color: "#1cb0f6", bg: "bg-[#1cb0f6]/10", border: "border-[#1cb0f6]/30", icon: "📐" },
};

export default function AdminDashboard() {
  const { user, isLoaded: isUserLoaded } = useAuth();
  const { showAlert } = useAlert();
  const { refreshStats } = useStats();

  const [activeTab, setActiveTab] = useState<Tab>("overview");

  // Economy State
  const [economy, setEconomy] = useState<EconomyConfig>({
    heartCost: 50,
    streakFreezeCost: 200,
    baseReward: 5,
    passingBonus: 10,
    perfectBonus: 5,
  });
  const [savingEconomy, setSavingEconomy] = useState(false);

  // Users State
  const [users, setUsers] = useState<UserRecord[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [editingUser, setEditingUser] = useState<UserRecord | null>(null);
  const [savingUser, setSavingUser] = useState(false);

  // Questions State — Capsulized Category Selector
  const [categorizedTestIds, setCategorizedTestIds] = useState<Record<string, string[]>>({});
  const [selectedCategory, setSelectedCategory] = useState<string>("abstract");
  const [selectedTestId, setSelectedTestId] = useState<string>("");
  const [questions, setQuestions] = useState<Question[]>([]);
  const [loadingQuestions, setLoadingQuestions] = useState(false);
  const [editingQuestion, setEditingQuestion] = useState<Question | null>(null);
  const [isAddingQuestion, setIsAddingQuestion] = useState(false);
  const [savingQuestion, setSavingQuestion] = useState(false);

  // View Mode — single test or UNION ALL
  const [viewMode, setViewMode] = useState<ViewMode>("single");
  const [filterType, setFilterType] = useState<FilterType>("all");
  const [allQuestions, setAllQuestions] = useState<Question[]>([]);
  const [loadingAll, setLoadingAll] = useState(false);

  // Subquery Stats Panel
  const [showInsights, setShowInsights] = useState(true);
  const [subqueryStats, setSubqueryStats] = useState<SubqueryStats | null>(null);
  const [loadingStats, setLoadingStats] = useState(false);

  // Form states for new/editing questions
  const [qPrompt, setQPrompt] = useState("");
  const [qOptions, setQOptions] = useState<string[]>(["", "", "", ""]);
  const [qCorrectIndex, setQCorrectIndex] = useState(0);
  const [qExplanation, setQExplanation] = useState("");
  const [qImage, setQImage] = useState("");
  const [qType, setQType] = useState("text");

  // ── INITIAL FETCH ──────────────────────────────────────────────────────────
  useEffect(() => {
    if (!isUserLoaded || !checkIsAdmin(user)) return;
    fetchEconomy();
    fetchTestIds();
    fetchUsers();
    fetchSubqueryStats();
  }, [isUserLoaded, user]);

  const fetchEconomy = async () => {
    try {
      const res = await fetch("/api/admin/economy");
      const data = await res.json();
      if (!data.error) setEconomy(data);
    } catch (err) {
      console.error("Error fetching economy:", err);
    }
  };

  const fetchTestIds = async () => {
    try {
      const res = await fetch("/api/admin/tests");
      const data = await res.json();
      if (data.categorizedTestIds) {
        setCategorizedTestIds(data.categorizedTestIds);
        // Auto-select first test from first category
        const firstCat = Object.keys(data.categorizedTestIds)[0];
        if (firstCat && data.categorizedTestIds[firstCat]?.length > 0) {
          setSelectedCategory(firstCat);
          setSelectedTestId(data.categorizedTestIds[firstCat][0]);
        }
      } else if (data.testIds) {
        // fallback
        const firstId = data.testIds[0] ?? "";
        setSelectedTestId(firstId);
      }
    } catch (err) {
      console.error("Error fetching test IDs:", err);
    }
  };

  const fetchUsers = async (search = "") => {
    setLoadingUsers(true);
    try {
      const res = await fetch(`/api/admin/users?search=${encodeURIComponent(search)}`);
      const data = await res.json();
      if (data.users) setUsers(data.users);
    } catch (err) {
      console.error("Error fetching users:", err);
    } finally {
      setLoadingUsers(false);
    }
  };

  // ── SCALAR + CORRELATED + MULTIROW + MULTI-COLUMN: /api/admin/tests?mode=stats
  const fetchSubqueryStats = async () => {
    setLoadingStats(true);
    try {
      const res = await fetch("/api/admin/tests?mode=stats");
      const data = await res.json();
      if (!data.error) setSubqueryStats(data);
    } catch (err) {
      console.error("Error fetching subquery stats:", err);
    } finally {
      setLoadingStats(false);
    }
  };

  // ── SINGLE TEST FETCH ──────────────────────────────────────────────────────
  const fetchQuestions = async (testId: string) => {
    if (!testId) return;
    setLoadingQuestions(true);
    try {
      const res = await fetch(`/api/admin/tests?testId=${testId}`);
      const data = await res.json();
      if (data.questions) setQuestions(data.questions);
    } catch (err) {
      console.error("Error fetching questions:", err);
    } finally {
      setLoadingQuestions(false);
    }
  };

  useEffect(() => {
    if (!isUserLoaded || !checkIsAdmin(user)) return;
    if (selectedTestId && viewMode === "single") {
      fetchQuestions(selectedTestId);
    }
  }, [selectedTestId, viewMode, isUserLoaded, user]);

  // ── UNION ALL: /api/admin/tests?mode=all ──────────────────────────────────
  const fetchAllQuestions = useCallback(async (catFilter?: string, typeFilter?: FilterType) => {
    setLoadingAll(true);
    try {
      const cat = catFilter ?? "";
      const type = typeFilter ?? filterType;
      const params = new URLSearchParams({ mode: "all" });
      if (cat) params.set("category", cat);
      if (type !== "all") params.set("filterType", type);
      const res = await fetch(`/api/admin/tests?${params.toString()}`);
      const data = await res.json();
      if (data.questions) setAllQuestions(data.questions);
    } catch (err) {
      console.error("Error fetching all questions:", err);
    } finally {
      setLoadingAll(false);
    }
  }, [filterType]);

  useEffect(() => {
    if (!isUserLoaded || !checkIsAdmin(user)) return;
    if (viewMode === "all") {
      fetchAllQuestions(selectedCategory !== "all" ? selectedCategory : undefined, filterType);
    }
  }, [viewMode, filterType, isUserLoaded, user, fetchAllQuestions, selectedCategory]);

  // ── QUESTION CRUD HANDLERS ─────────────────────────────────────────────────
  const handleEditQuestionClick = (q: Question) => {
    setEditingQuestion(q);
    setIsAddingQuestion(false);
    setQPrompt(q.prompt);
    setQOptions([...q.options]);
    setQCorrectIndex(q.correctIndex);
    setQExplanation(q.explanation);
    setQImage(q.image || "");
    setQType(q.type || "text");
  };

  const handleAddQuestionClick = () => {
    setEditingQuestion(null);
    setIsAddingQuestion(true);
    setQPrompt("");
    setQOptions(["", "", "", ""]);
    setQCorrectIndex(0);
    setQExplanation("");
    setQImage("");
    setQType("text");
  };

  const handleSaveQuestion = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTestId) {
      await showAlert("Please select a test first.");
      return;
    }
    setSavingQuestion(true);
    try {
      let updatedQuestions = [...questions];

      if (isAddingQuestion) {
        const nextId = questions.length > 0 ? Math.max(...questions.map(q => q.id)) + 1 : 1;
        const newQ: Question = {
          id: nextId,
          type: qType,
          prompt: qPrompt,
          options: qOptions.filter(o => o !== ""),
          correctIndex: qCorrectIndex,
          explanation: qExplanation,
        };
        if (qImage) newQ.image = qImage;
        updatedQuestions.push(newQ);
      } else if (editingQuestion) {
        updatedQuestions = questions.map((q) => {
          if (q.id === editingQuestion.id) {
            const updated: Question = {
              ...q,
              type: qType,
              prompt: qPrompt,
              options: qOptions.filter(o => o !== ""),
              correctIndex: qCorrectIndex,
              explanation: qExplanation,
            };
            if (qImage) updated.image = qImage;
            else delete updated.image;
            return updated;
          }
          return q;
        });
      }

      const res = await fetch("/api/admin/tests", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ testId: selectedTestId, questions: updatedQuestions }),
      });

      const data = await res.json();
      if (data.success) {
        setIsAddingQuestion(false);
        setEditingQuestion(null);
        await fetchQuestions(selectedTestId);
        await fetchSubqueryStats();
        await showAlert("Question bank saved successfully!");
      } else {
        await showAlert("Error saving question: " + data.error);
      }
    } catch (err: any) {
      await showAlert("Network error: " + err.message);
    } finally {
      setSavingQuestion(false);
    }
  };

  const handleDeleteQuestion = async (qId: number) => {
    if (!confirm("Are you sure you want to delete this question?")) return;
    try {
      const updatedQuestions = questions.filter(q => q.id !== qId);
      const res = await fetch("/api/admin/tests", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ testId: selectedTestId, questions: updatedQuestions }),
      });
      const data = await res.json();
      if (data.success) {
        await fetchQuestions(selectedTestId);
        await fetchSubqueryStats();
        await showAlert("🗑️ Question deleted successfully!");
      } else {
        await showAlert("❌ Error deleting question: " + data.error);
      }
    } catch (err: any) {
      await showAlert("❌ Network error: " + err.message);
    }
  };

  // ── USER HANDLERS ──────────────────────────────────────────────────────────
  const handleEditUserClick = (u: UserRecord) => setEditingUser({ ...u });

  const handleSaveUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingUser) return;
    setSavingUser(true);
    try {
      const res = await fetch("/api/admin/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(editingUser),
      });
      const data = await res.json();
      if (data.success) {
        setEditingUser(null);
        await refreshStats();
        await fetchUsers(searchQuery);
        await showAlert("User progress updated successfully!");
      } else {
        await showAlert("Error updating user: " + data.error);
      }
    } catch (err: any) {
      await showAlert("Network error: " + err.message);
    } finally {
      setSavingUser(false);
    }
  };

  const handleSaveEconomy = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingEconomy(true);
    try {
      const res = await fetch("/api/admin/economy", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(economy),
      });
      const data = await res.json();
      if (data.success) {
        await showAlert("Economy config saved successfully!");
      } else {
        await showAlert("Error saving config: " + data.error);
      }
    } catch (err: any) {
      await showAlert("Network error: " + err.message);
    } finally {
      setSavingEconomy(false);
    }
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchUsers(searchQuery);
  };

  // ── OVERVIEW CHARTS ────────────────────────────────────────────────────────
  const totalUsers = users.length;
  const totalRegistered = users.filter((u) => typeof u.id === "string" && !u.id.startsWith("guest_")).length;
  const totalGuests = users.filter((u) => typeof u.id === "string" && u.id.startsWith("guest_")).length;
  const totalGems = users.reduce((acc, u) => acc + u.gems, 0);
  const averageLevel = totalUsers > 0 ? (users.reduce((acc, u) => acc + u.current_level, 0) / totalUsers).toFixed(1) : 0;

  const renderSignupChart = () => {
    if (users.length === 0) return <div className="text-silver py-12 text-center">No signup data available.</div>;
    const sorted = [...users].sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
    const dateCounts: Record<string, number> = {};
    let cum = 0;
    sorted.forEach((u) => {
      const dateStr = new Date(u.created_at).toLocaleDateString(undefined, { month: "short", day: "numeric" });
      cum += 1;
      dateCounts[dateStr] = cum;
    });
    const dates = Object.keys(dateCounts);
    const counts = Object.values(dateCounts);
    const maxVal = Math.max(...counts, 4);
    const width = 450, height = 180, padding = 30;
    const points = dates.map((d, i) => ({
      x: padding + (i / Math.max(dates.length - 1, 1)) * (width - 2 * padding),
      y: height - padding - (counts[i] / maxVal) * (height - 2 * padding),
      label: d, val: counts[i],
    }));
    const pathD = points.length > 0
      ? `M ${points[0].x} ${points[0].y} ` + points.slice(1).map(p => `L ${p.x} ${p.y}`).join(" ")
      : "";
    return (
      <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-auto bg-snow-white rounded-2xl border-2 border-cloud-gray p-2">
        <line x1={padding} y1={height - padding} x2={width - padding} y2={height - padding} stroke="#e5e5e5" strokeWidth={2} />
        <line x1={padding} y1={padding} x2={padding} y2={height - padding} stroke="#e5e5e5" strokeWidth={2} />
        {[0.25, 0.5, 0.75, 1].map((r, i) => {
          const y = height - padding - r * (height - 2 * padding);
          return (
            <g key={i}>
              <line x1={padding} y1={y} x2={width - padding} y2={y} stroke="#e5e5e5" strokeWidth={1} strokeDasharray="4 4" />
              <text x={padding - 6} y={y + 4} textAnchor="end" className="fill-silver font-bold text-[9px]">{Math.round(r * maxVal)}</text>
            </g>
          );
        })}
        {points.length > 1 && (
          <path d={pathD} fill="none" stroke="#1cb0f6" strokeWidth={4} strokeLinecap="round" strokeLinejoin="round" />
        )}
        {points.map((p, i) => (
          <g key={i}>
            <circle cx={p.x} cy={p.y} r={5} className="fill-snow-white stroke-sky-blue stroke-[3px]" />
            <text x={p.x} y={height - 8} textAnchor="middle" className="fill-charcoal font-bold text-[8px]">{p.label}</text>
          </g>
        ))}
      </svg>
    );
  };

  const renderCategoryChart = () => {
    const cats = subqueryStats?.correlatedPerCategory ?? [
      { category: "abstract", label: "Abstract", questionCount: 20 },
      { category: "logical", label: "Logical", questionCount: 12 },
      { category: "numerical", label: "Numerical", questionCount: 15 },
      { category: "quantitative", label: "Quantitative", questionCount: 10 },
    ];
    const total = cats.reduce((sum, c) => sum + c.questionCount, 0);
    const colors = ["#58cc02", "#a570ff", "#ffc700", "#1cb0f6"];
    return (
      <div className="flex flex-col gap-4 bg-snow-white rounded-2xl border-2 border-cloud-gray p-5 h-full justify-center">
        <h4 className="font-extrabold text-[15px] text-almost-black tracking-wide uppercase">Question Bank Ratio</h4>
        <div className="w-full h-8 bg-cloud-gray rounded-full overflow-hidden flex">
          {cats.map((c, i) => {
            const widthPct = total > 0 ? (c.questionCount / total) * 100 : 25;
            return (
              <div key={i} style={{ width: `${widthPct}%`, backgroundColor: colors[i % colors.length] }}
                className="h-full first:rounded-l-full last:rounded-r-full transition-all duration-300"
                title={`${c.label}: ${c.questionCount} items`}
              />
            );
          })}
        </div>
        <div className="grid grid-cols-2 gap-3 mt-1">
          {cats.map((c, i) => (
            <div key={i} className="flex items-center gap-2 text-caption">
              <span className="w-3 h-3 rounded-full shrink-0" style={{ backgroundColor: colors[i % colors.length] }} />
              <span className="font-bold text-charcoal uppercase text-[12px]">{c.label}</span>
              <span className="text-silver">({c.questionCount})</span>
            </div>
          ))}
        </div>
      </div>
    );
  };

  // ── GUARD CHECKS ───────────────────────────────────────────────────────────
  if (!isUserLoaded) {
    return (
      <div className="flex-1 flex items-center justify-center min-h-[60vh] font-din-round">
        <span className="text-silver font-bold">Checking administrator permissions...</span>
      </div>
    );
  }

  const isAdmin = checkIsAdmin(user);
  if (!isAdmin) {
    return (
      <main className="flex-1 w-full max-w-[600px] mx-auto pb-24 flex flex-col items-center justify-center gap-6 pt-16 px-4 font-din-round text-center">
        <div className="w-32 h-32 relative">
          <img src="/emoji/sorrytoomad.webp" alt="Access Denied" className="object-contain w-full h-full" />
        </div>
        <div className="flex flex-col gap-2">
          <h1 className="font-feather text-heading text-[#ff2e63] uppercase tracking-wide">Access Denied</h1>
          <p className="text-graphite text-[15px] max-w-[400px] leading-relaxed">
            You do not have permissions to view the administration dashboard. Please contact your system administrator.
          </p>
        </div>
        <button
          onClick={() => window.location.href = "/dashboard"}
          className="bg-sky-blue text-white font-extrabold px-6 py-3 rounded-2xl shadow-[0_4px_0_#0f9cdb] active:translate-y-1 active:shadow-none transition-all hover:bg-sky-blue/90 uppercase text-xs tracking-wider mt-2"
        >
          Back to Learn Panel
        </button>
      </main>
    );
  }

  // ── DERIVED VALUES FOR QUESTION CMS ───────────────────────────────────────
  const categoryIds = Object.keys(categorizedTestIds);
  const testsInSelectedCategory = categorizedTestIds[selectedCategory] ?? [];
  const displayedQuestions = viewMode === "all" ? allQuestions : questions;
  const isLoading = viewMode === "all" ? loadingAll : loadingQuestions;

  // ── RENDER ─────────────────────────────────────────────────────────────────
  return (
    <main className="flex-1 w-full max-w-[1000px] mx-auto pb-24 flex flex-col gap-6 pt-4 md:pt-8 px-4 font-din-round relative">

      {/* Title */}
      <div className="mt-4">
        <h1 className="font-feather text-heading text-almost-black tracking-tight uppercase">Dashboard</h1>
      </div>

      {/* Tabs */}
      <div className="flex border-b-2 border-cloud-gray overflow-x-auto gap-2 sm:gap-6 pt-2 pb-0 scrollbar-none">
        {(["overview", "users", "questions", "economy"] as Tab[]).map((tab) => {
          const isActive = activeTab === tab;
          return (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`pb-3 font-extrabold text-[15px] tracking-wider uppercase border-b-4 transition-all shrink-0 px-2 cursor-pointer ${
                isActive ? "border-sky-blue text-sky-blue" : "border-transparent text-silver hover:text-charcoal hover:border-cloud-gray"
              }`}
            >
              {tab === "overview" && "Overview"}
              {tab === "users" && "Users"}
              {tab === "questions" && "Question CMS"}
              {tab === "economy" && "Economy Settings"}
            </button>
          );
        })}
        {/* Reports Tab — links to dedicated Reports & Views analytics page */}
        <a
          href="/admin/views"
          className="pb-3 font-extrabold text-[15px] tracking-wider uppercase border-b-4 transition-all shrink-0 px-2 cursor-pointer border-transparent text-silver hover:text-[#a570ff] hover:border-[#a570ff] flex items-center gap-1.5"
          id="admin-reports-tab"
        >
          Reports
        </a>
        {/* Reviewer Performance Tab — links to dedicated performance analytics page */}
        <a
          href="/admin/functions"
          className="pb-3 font-extrabold text-[15px] tracking-wider uppercase border-b-4 transition-all shrink-0 px-2 cursor-pointer border-transparent text-silver hover:text-sky-blue hover:border-sky-blue flex items-center gap-1.5"
          id="admin-sql-functions-tab"
        >
          Performance
        </a>
        {/* Triggers Tab — links to dedicated SQL triggers page */}
        <a
          href="/admin/triggers"
          className="pb-3 font-extrabold text-[15px] tracking-wider uppercase border-b-4 transition-all shrink-0 px-2 cursor-pointer border-transparent text-silver hover:text-duo-green hover:border-duo-green flex items-center gap-1.5"
          id="admin-sql-triggers-tab"
        >
          Triggers
        </a>
      </div>

      {/* ═══════════════════════════ OVERVIEW PANEL ═══════════════════════════ */}
      {activeTab === "overview" && (
        <div className="flex flex-col gap-8 animate-fadeIn">
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-snow-white border-2 border-cloud-gray p-5 rounded-2xl hover:border-sky-blue transition-colors flex flex-col justify-between">
              <div>
                <p className="text-silver font-bold uppercase text-[12px] tracking-wider">Total Reviewers</p>
                <h2 className="text-heading font-extrabold mt-1 text-almost-black leading-none">{totalUsers}</h2>
              </div>
              <div className="flex flex-col gap-0.5 mt-3 text-[11px] md:text-xs font-bold text-sky-blue">
                <span>{totalRegistered} Registered</span>
                <span className="text-silver">{totalGuests} Guests</span>
              </div>
            </div>
            <div className="bg-snow-white border-2 border-cloud-gray p-4 rounded-2xl hover:border-duo-green transition-colors flex flex-col gap-3">
              <div>
                <p className="text-silver font-bold uppercase text-[11px] tracking-wider">Top 3 Active Streaks</p>
              </div>
              <div className="flex flex-col gap-2.5">
                {users.slice().sort((a, b) => Number(b.streak || 0) - Number(a.streak || 0)).slice(0, 3).map((u, i) => {
                  const avatarSrc = u.avatarUrl || "/emoji/profile.webp";
                  return (
                    <div key={u.id} className="flex items-center justify-between gap-3">
                      <div className="flex items-center gap-2.5 min-w-0 flex-1">
                        <div className="w-9 h-9 rounded-full overflow-hidden border border-cloud-gray/20 bg-cloud-gray/10 shrink-0 flex items-center justify-center select-none">
                          <img src={avatarSrc} alt={u.name} className={avatarSrc === "/emoji/profile.webp" ? "w-16 h-16 object-contain" : "w-full h-full object-cover"} />
                        </div>
                        <div className="min-w-0 flex flex-col">
                          <span className="font-bold text-almost-black text-sm truncate leading-tight">{u.name}</span>
                          <span className="text-silver text-[10px] font-semibold truncate leading-none">Rank #{i + 1}</span>
                        </div>
                      </div>
                      {(() => {
                        const todayStr = new Date().toLocaleDateString("en-CA");
                        const isStreakActive = u.streak > 0 && u.last_lesson_date === todayStr;
                        return (
                          <div className={`font-extrabold text-sm shrink-0 flex items-center ${isStreakActive ? "text-[#ff5e00]" : "text-silver"}`}>
                            <StreakAsset streak={u.streak} lastLessonDate={u.last_lesson_date} width={28} height={28} className="object-contain shrink-0" />
                            <span>{u.streak}d</span>
                          </div>
                        );
                      })()}
                    </div>
                  );
                })}
                {users.length === 0 && <p className="text-silver text-xs font-semibold py-2 text-center">No streak data found</p>}
              </div>
            </div>
            <div className="bg-snow-white border-2 border-cloud-gray p-5 rounded-2xl hover:border-sunshine-yellow transition-colors">
              <p className="text-silver font-bold uppercase text-[12px] tracking-wider">Average Level</p>
              <h2 className="text-heading font-extrabold mt-1 text-almost-black">{averageLevel}</h2>
              <div className="text-xs text-sunshine-yellow font-bold mt-1">Learning Milestone</div>
            </div>
            <div className="bg-snow-white border-2 border-cloud-gray p-5 rounded-2xl hover:border-bubblegum-pink transition-colors">
              <p className="text-silver font-bold uppercase text-[12px] tracking-wider">Economy Vault</p>
              <h2 className="text-heading font-extrabold mt-1 text-almost-black">{totalGems}</h2>
              <div className="text-xs text-bubblegum-pink font-bold mt-1">Gems Active in Game</div>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-5 gap-6">
            <div className="md:col-span-3 flex flex-col gap-3">
              <h4 className="font-extrabold text-[15px] text-almost-black tracking-wide uppercase">Reviewer Registration Trend</h4>
              {renderSignupChart()}
            </div>
            <div className="md:col-span-2">{renderCategoryChart()}</div>
          </div>
        </div>
      )}

      {/* ═══════════════════════════ USERS PANEL ══════════════════════════════ */}
      {activeTab === "users" && (
        <div className="flex flex-col gap-6 animate-fadeIn">
          <form onSubmit={handleSearchSubmit} className="flex gap-3">
            <input
              type="text"
              placeholder="Search users by name or database ID..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="flex-1 border-2 border-cloud-gray focus:border-sky-blue rounded-2xl p-3 px-4 font-bold text-almost-black outline-none transition-colors"
            />
            <button type="submit" className="bg-sky-blue text-white font-bold px-6 p-3 rounded-2xl shadow-[0_4px_0_#0f9cdb] active:translate-y-1 active:shadow-none transition-all hover:bg-sky-blue/90">
              Search
            </button>
          </form>
          {loadingUsers ? (
            <div className="text-center py-12 text-silver font-bold">Querying users from database...</div>
          ) : (
            <div className="bg-snow-white border-2 border-cloud-gray rounded-2xl overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full border-collapse text-left">
                  <thead>
                    <tr className="border-b-2 border-cloud-gray bg-cloud-gray/10 text-silver font-extrabold text-[13px] uppercase tracking-wider">
                      <th className="p-4 whitespace-nowrap">Name / ID</th>
                      <th className="p-4 whitespace-nowrap">Gems</th>
                      <th className="p-4 whitespace-nowrap">Hearts</th>
                      <th className="p-4 whitespace-nowrap">Streak</th>
                      <th className="p-4 whitespace-nowrap">Lvl/XP</th>
                      <th className="p-4 whitespace-nowrap">Diff/Style</th>
                      <th className="p-4 text-right whitespace-nowrap">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y-2 divide-cloud-gray font-bold text-[14px]">
                    {users.length === 0 ? (
                      <tr><td colSpan={7} className="p-8 text-center text-silver">No registered user profiles found.</td></tr>
                    ) : (
                      users.slice().sort((a, b) => Number(b.streak || 0) - Number(a.streak || 0)).map((u) => (
                        <tr key={u.id} className="hover:bg-cloud-gray/5 text-charcoal">
                          <td className="p-4 whitespace-nowrap">
                            <div className="flex items-center gap-3">
                              {u.avatarUrl ? (
                                <img src={u.avatarUrl} alt={u.name} className="w-10 h-10 rounded-full object-cover border-2 border-cloud-gray bg-cloud-gray/10 shrink-0" referrerPolicy="no-referrer" />
                              ) : (
                                <div className="w-10 h-10 rounded-full bg-cloud-gray flex items-center justify-center font-extrabold text-silver shrink-0 text-sm">
                                  {u.name.charAt(0).toUpperCase()}
                                </div>
                              )}
                              <div className="min-w-0">
                                <span className="text-almost-black font-extrabold block leading-normal">{u.name}</span>
                                <span className="text-[11px] text-silver font-medium font-mono block leading-normal">{u.id}</span>
                              </div>
                            </div>
                          </td>
                          <td className="p-4 text-[#ffc700] font-extrabold whitespace-nowrap">💎 {u.gems}</td>
                          <td className="p-4 text-[#ff2e63] whitespace-nowrap">❤️ {u.hearts}/5</td>
                          <td className="p-4 text-[#ff5e00] whitespace-nowrap">🔥 {u.streak}d</td>
                          <td className="p-4 whitespace-nowrap">
                            <span className="block leading-normal">Lvl {u.current_level}</span>
                            <span className="text-[11px] text-silver font-medium block leading-normal">{u.total_score} XP</span>
                          </td>
                          <td className="p-4 whitespace-nowrap">
                            <span className="text-[12px] bg-cloud-gray/40 px-2 py-0.5 rounded-full text-charcoal block w-fit">{u.difficulty}</span>
                            <span className="text-[11px] text-silver font-medium block mt-0.5 leading-normal">{u.study_style}</span>
                          </td>
                          <td className="p-4 text-right whitespace-nowrap">
                            <button onClick={() => handleEditUserClick(u)} className="text-sky-blue hover:bg-sky-blue/10 px-3 py-1.5 rounded-xl border-2 border-sky-blue/20 transition-all text-xs">
                              Edit Profile
                            </button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}
          {editingUser && (
            <div className="fixed inset-0 bg-almost-black/50 z-50 flex items-center justify-center p-4 backdrop-blur-[2px]">
              <div className="bg-snow-white border-2 border-cloud-gray w-full max-w-[500px] rounded-3xl p-6 shadow-xl animate-scaleIn">
                <div className="flex justify-between items-center border-b-2 border-cloud-gray pb-4">
                  <h3 className="font-extrabold text-heading-sm text-almost-black">Edit Student Profile</h3>
                  <button onClick={() => setEditingUser(null)} className="text-silver hover:text-charcoal font-bold text-xl cursor-pointer">✕</button>
                </div>
                <form onSubmit={handleSaveUser} className="flex flex-col gap-4 mt-4">
                  <div className="flex flex-col gap-1">
                    <label className="text-xs uppercase font-extrabold text-silver tracking-wider">Display Name</label>
                    <input type="text" value={editingUser.name} onChange={(e) => setEditingUser({ ...editingUser, name: e.target.value })} className="border-2 border-cloud-gray focus:border-sky-blue rounded-xl p-2.5 outline-none font-bold text-almost-black text-sm" />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="flex flex-col gap-1">
                      <label className="text-xs uppercase font-extrabold text-silver tracking-wider">Gems Balance</label>
                      <input type="number" value={editingUser.gems} onChange={(e) => setEditingUser({ ...editingUser, gems: Number(e.target.value) })} className="border-2 border-cloud-gray focus:border-sky-blue rounded-xl p-2.5 outline-none font-bold text-almost-black text-sm" />
                    </div>
                    <div className="flex flex-col gap-1">
                      <label className="text-xs uppercase font-extrabold text-silver tracking-wider">Hearts Count</label>
                      <select value={editingUser.hearts} onChange={(e) => setEditingUser({ ...editingUser, hearts: Number(e.target.value) })} className="border-2 border-cloud-gray focus:border-sky-blue rounded-xl p-2.5 outline-none font-bold text-almost-black text-sm bg-[#3c3c3c]">
                        {[0, 1, 2, 3, 4, 5].map(v => <option key={v} value={v}>{v}</option>)}
                      </select>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="flex flex-col gap-1">
                      <label className="text-xs uppercase font-extrabold text-silver tracking-wider">Active Streak</label>
                      <input type="number" value={editingUser.streak} onChange={(e) => setEditingUser({ ...editingUser, streak: Number(e.target.value) })} className="border-2 border-cloud-gray focus:border-sky-blue rounded-xl p-2.5 outline-none font-bold text-almost-black text-sm" />
                    </div>
                    <div className="flex flex-col gap-1">
                      <label className="text-xs uppercase font-extrabold text-silver tracking-wider">Streak Freezes</label>
                      <input type="number" value={editingUser.streak_freeze_count} onChange={(e) => setEditingUser({ ...editingUser, streak_freeze_count: Number(e.target.value) })} className="border-2 border-cloud-gray focus:border-sky-blue rounded-xl p-2.5 outline-none font-bold text-almost-black text-sm" />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="flex flex-col gap-1">
                      <label className="text-xs uppercase font-extrabold text-silver tracking-wider">Current Level</label>
                      <input type="number" value={editingUser.current_level} onChange={(e) => setEditingUser({ ...editingUser, current_level: Number(e.target.value) })} className="border-2 border-cloud-gray focus:border-sky-blue rounded-xl p-2.5 outline-none font-bold text-almost-black text-sm" />
                    </div>
                    <div className="flex flex-col gap-1">
                      <label className="text-xs uppercase font-extrabold text-silver tracking-wider">Total Score (XP)</label>
                      <input type="number" value={editingUser.total_score} onChange={(e) => setEditingUser({ ...editingUser, total_score: Number(e.target.value) })} className="border-2 border-cloud-gray focus:border-sky-blue rounded-xl p-2.5 outline-none font-bold text-almost-black text-sm" />
                    </div>
                  </div>
                  <div className="flex gap-3 justify-end mt-4 border-t-2 border-cloud-gray pt-4">
                    <button type="button" onClick={() => setEditingUser(null)} className="border-2 border-cloud-gray hover:bg-cloud-gray/10 text-charcoal font-bold px-5 py-2.5 rounded-2xl text-sm">Cancel</button>
                    <button type="submit" disabled={savingUser} className="bg-duo-green text-white font-bold px-6 py-2.5 rounded-2xl shadow-[0_4px_0_#3f8f01] active:translate-y-1 active:shadow-none transition-all disabled:opacity-50 text-sm">
                      {savingUser ? "Saving..." : "Save Progress"}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ══════════════════════════ QUESTION CMS PANEL ════════════════════════ */}
      {activeTab === "questions" && (
        <div className="flex flex-col gap-5 animate-fadeIn">

          {/* ── SUBQUERY INSIGHTS PANEL ─────────────────────────────────────── */}
          <div className="bg-snow-white border-2 border-cloud-gray rounded-2xl overflow-hidden">
            {/* Header toggle */}
            <button
              onClick={() => setShowInsights(!showInsights)}
              className="w-full flex items-center justify-between px-5 py-4 hover:bg-cloud-gray/5 transition-colors"
            >
              <div className="flex items-center gap-3">
                <span className="font-extrabold text-[14px] text-almost-black uppercase tracking-wider">Data Insights — SQL Subquery Patterns</span>
                {loadingStats && <span className="text-xs text-silver font-bold animate-pulse">Loading...</span>}
              </div>
              <span className={`text-silver font-bold transition-transform duration-200 ${showInsights ? "rotate-180" : ""}`}>▼</span>
            </button>

            {showInsights && (
              <div className="border-t-2 border-cloud-gray p-5 flex flex-col gap-5">

                {/* Row 1: Scalar + Correlated */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">

                  {/* ── SCALAR SUBQUERY ──────────────────────────────── */}
                  <div className="rounded-xl border-2 border-[#1cb0f6]/30 bg-[#1cb0f6]/5 p-4 flex flex-col gap-2">
                    <div className="flex items-end gap-2 mt-1">
                      <span className="text-[42px] font-extrabold text-[#1cb0f6] leading-none">
                        {loadingStats ? "—" : (subqueryStats?.scalarTotalQuestions?.toLocaleString() ?? "—")}
                      </span>
                      <span className="text-silver font-bold text-sm mb-1">total questions</span>
                    </div>
                  </div>

                  {/* ── CORRELATED SUBQUERY ──────────────────────────── */}
                  <div className="rounded-xl border-2 border-[#a570ff]/30 bg-[#a570ff]/5 p-4 flex flex-col gap-2">
                    <div className="flex flex-col gap-1.5 mt-1">
                      {(subqueryStats?.correlatedPerCategory ?? []).map((stat) => {
                        const meta = CATEGORY_META[stat.category] ?? CATEGORY_META.abstract;
                        const pct = subqueryStats ? Math.round((stat.questionCount / subqueryStats.scalarTotalQuestions) * 100) : 0;
                        return (
                          <div key={stat.category} className="flex items-center gap-2">
                            <span className="text-[11px] font-bold text-charcoal w-[110px] shrink-0 truncate">{meta.icon} {stat.label.split(" ")[0]}</span>
                            <div className="flex-1 h-3 bg-cloud-gray rounded-full overflow-hidden">
                              <div className="h-full rounded-full transition-all duration-500" style={{ width: `${pct}%`, backgroundColor: meta.color }} />
                            </div>
                            <span className="text-[11px] font-extrabold shrink-0" style={{ color: meta.color }}>{stat.questionCount}</span>
                          </div>
                        );
                      })}
                      {loadingStats && <div className="text-[11px] text-silver animate-pulse">Loading per-category counts...</div>}
                    </div>
                  </div>
                </div>

                {/* Row 2: Multirow + Multi-column */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">

                  {/* ── MULTIROW SUBQUERY ────────────────────────────── */}
                  <div className="rounded-xl border-2 border-[#ff5e00]/30 bg-[#ff5e00]/5 p-4 flex flex-col gap-2">
                    <div className="flex items-center gap-4 mt-2">
                      <div className="flex flex-col items-center">
                        <span className="text-[28px] font-extrabold text-bubblegum-pink leading-none">
                          {loadingStats ? "—" : subqueryStats?.multirowImageCount?.toLocaleString() ?? "—"}
                        </span>
                        <span className="text-[10px] font-bold text-silver mt-0.5">🖼 Image Type</span>
                      </div>
                      <div className="w-px h-10 bg-cloud-gray" />
                      <div className="flex flex-col items-center">
                        <span className="text-[28px] font-extrabold text-sky-blue leading-none">
                          {loadingStats ? "—" : subqueryStats?.multirowTextCount?.toLocaleString() ?? "—"}
                        </span>
                        <span className="text-[10px] font-bold text-silver mt-0.5">📝 Text Type</span>
                      </div>
                    </div>
                    <p className="text-[11px] text-silver">Multiple rows returned — filtered by question type across all tests.</p>
                  </div>

                  {/* ── MULTI-COLUMN SUBQUERY ────────────────────────── */}
                  <div className="rounded-xl border-2 border-[#58cc02]/30 bg-[#58cc02]/5 p-4 flex flex-col gap-2">
                    <div className="overflow-hidden rounded-lg border border-[#58cc02]/20 mt-1">
                      <table className="w-full text-[10px] border-collapse">
                        <thead>
                          <tr className="bg-[#58cc02]/15 text-charcoal font-extrabold uppercase tracking-wide">
                            <th className="px-2 py-1 text-left">ID</th>
                            <th className="px-2 py-1 text-left">Category</th>
                            <th className="px-2 py-1 text-left">Type</th>
                            <th className="px-2 py-1 text-left">Ans</th>
                          </tr>
                        </thead>
                        <tbody>
                          {loadingStats ? (
                            <tr><td colSpan={4} className="px-2 py-2 text-silver text-center">Loading...</td></tr>
                          ) : (
                            (subqueryStats?.multicolSample ?? []).slice(0, 5).map((q, i) => {
                              const meta = CATEGORY_META[q.category ?? "abstract"];
                              return (
                                <tr key={i} className="border-t border-[#58cc02]/10 hover:bg-[#58cc02]/5">
                                  <td className="px-2 py-1 text-silver font-mono">#{q.id}</td>
                                  <td className="px-2 py-1 font-bold" style={{ color: meta?.color ?? "#58cc02" }}>{meta?.icon} {(q.categoryLabel ?? q.category ?? "").split(" ")[0]}</td>
                                  <td className="px-2 py-1 text-charcoal capitalize">{q.type}</td>
                                  <td className="px-2 py-1 font-extrabold text-[#58cc02]">{String.fromCharCode(65 + (q.correctIndex ?? 0))}</td>
                                </tr>
                              );
                            })
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>

                {/* UNION ALL hint */}
                <div className="rounded-xl border-2 border-cloud-gray bg-cloud-gray/5 px-4 py-3 flex items-center gap-3">
                  <div className="flex-1 min-w-0">
                    <span className="text-[12px] text-silver font-bold">
                      Switch to <strong className="text-almost-black">All Questions</strong> view below to see all test banks merged into one unified result set.
                    </span>
                  </div>
                  <button
                    onClick={() => { setViewMode("all"); fetchAllQuestions(undefined, filterType); }}
                    className="shrink-0 text-[11px] font-extrabold text-sky-blue border-2 border-sky-blue/30 bg-sky-blue/5 hover:bg-sky-blue/10 px-3 py-1.5 rounded-xl transition-all"
                  >
                    Activate →
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* ── CAPSULIZED CATEGORY SELECTOR ────────────────────────────────── */}
          <div className="flex flex-col gap-3">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-extrabold text-[12px] text-silver uppercase tracking-wider shrink-0">Category:</span>
              {categoryIds.map((cat) => {
                const meta = CATEGORY_META[cat] ?? CATEGORY_META.abstract;
                const isActive = selectedCategory === cat;
                return (
                  <button
                    key={cat}
                    onClick={() => {
                      setSelectedCategory(cat);
                      const firstTest = categorizedTestIds[cat]?.[0] ?? "";
                      setSelectedTestId(firstTest);
                      if (viewMode === "all") {
                        fetchAllQuestions(cat, filterType);
                      }
                    }}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[12px] font-extrabold border-2 transition-all cursor-pointer ${
                      isActive
                        ? "text-white border-transparent shadow-md"
                        : "text-charcoal border-cloud-gray hover:border-cloud-gray/80 bg-snow-white"
                    }`}
                    style={isActive ? { backgroundColor: meta.color, boxShadow: `0 3px 0 ${meta.color}99` } : {}}
                  >
                    <span>{meta.label}</span>
                    <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-extrabold ${isActive ? "bg-white/20" : "bg-cloud-gray/40"}`}>
                      {categorizedTestIds[cat]?.length ?? 0}
                    </span>
                  </button>
                );
              })}
            </div>

            {/* Sub-test selector within category + View Mode toggle */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 flex-wrap">
              {/* View mode toggle */}
              <div className="flex items-center gap-1 bg-cloud-gray/20 rounded-xl p-1">
                <button
                  onClick={() => setViewMode("single")}
                  className={`px-3 py-1.5 rounded-lg text-[12px] font-extrabold transition-all ${
                    viewMode === "single" ? "bg-snow-white text-almost-black shadow-sm" : "text-silver hover:text-charcoal"
                  }`}
                >
                  Single Test
                </button>
                <button
                  onClick={() => {
                    setViewMode("all");
                    fetchAllQuestions(selectedCategory, filterType);
                  }}
                  className={`px-3 py-1.5 rounded-lg text-[12px] font-extrabold transition-all ${
                    viewMode === "all" ? "bg-sky-blue text-white shadow-sm" : "text-silver hover:text-charcoal"
                  }`}
                >
                  All Questions
                </button>
              </div>

              {/* Single test dropdown */}
              {viewMode === "single" && (
                <div className="flex items-center gap-2 flex-1 min-w-0">
                  <label className="font-extrabold text-[12px] text-silver uppercase tracking-wider shrink-0">Test:</label>
                  <select
                    value={selectedTestId}
                    onChange={(e) => setSelectedTestId(e.target.value)}
                    className="border-2 border-cloud-gray focus:border-sky-blue rounded-xl p-2 font-extrabold text-almost-black outline-none bg-[#3c3c3c] text-sm flex-1 min-w-0 max-w-[280px]"
                  >
                    {testsInSelectedCategory.map((id) => (
                      <option key={id} value={id}>{id}</option>
                    ))}
                  </select>
                </div>
              )}

              {/* Filter type (multirow) */}
              {viewMode === "all" && (
                <div className="flex items-center gap-2">
                  <span className="font-extrabold text-[12px] text-silver uppercase tracking-wider shrink-0">Filter (Multirow):</span>
                  <div className="flex items-center gap-1 bg-cloud-gray/20 rounded-xl p-1">
                    {(["all", "text", "image"] as FilterType[]).map((ft) => (
                      <button
                        key={ft}
                        onClick={() => {
                          setFilterType(ft);
                          fetchAllQuestions(selectedCategory, ft);
                        }}
                        className={`px-2.5 py-1 rounded-lg text-[11px] font-extrabold capitalize transition-all ${
                          filterType === ft ? "bg-snow-white text-almost-black shadow-sm" : "text-silver hover:text-charcoal"
                        }`}
                      >
                        {ft === "all" ? "All" : ft === "text" ? "📝 Text" : "🖼 Image"}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Spacer + Add button */}
              <div className="flex-1" />
              {viewMode === "single" && (
                <button
                  onClick={handleAddQuestionClick}
                  className="bg-duo-green text-white font-bold py-2.5 px-5 rounded-2xl shadow-[0_4px_0_#3f8f01] active:translate-y-1 active:shadow-none transition-all text-sm text-center shrink-0"
                >
                  + Add Question
                </button>
              )}
            </div>
          </div>

          {/* ── QUESTIONS TABLE ──────────────────────────────────────────────── */}
          {isLoading ? (
            <div className="text-center py-12 text-silver font-bold">
              {viewMode === "all"
                ? "Executing UNION ALL — merging all test banks..."
                : "Querying questions from JSON dataset..."}
            </div>
          ) : (
            <div className="bg-snow-white border-2 border-cloud-gray rounded-2xl overflow-hidden">
              {/* Table header bar */}
              <div className="flex items-center justify-between px-4 py-3 border-b-2 border-cloud-gray bg-cloud-gray/5">
                <div className="flex items-center gap-2">
                  {viewMode === "all" ? (
                    <>
                      <span className="text-[11px] font-extrabold uppercase tracking-wider px-2 py-0.5 rounded-full bg-sky-blue/10 text-sky-blue border border-sky-blue/20">
                        UNION ALL
                      </span>
                      <span className="text-[13px] font-extrabold text-almost-black">
                        {displayedQuestions.length.toLocaleString()} questions
                      </span>
                      <span className="text-silver text-[12px]">
                        — merged from {CATEGORY_META[selectedCategory]?.label ?? "all categories"}
                      </span>
                    </>
                  ) : (
                    <>
                      <span className="text-[13px] font-extrabold text-almost-black">
                        {questions.length} question{questions.length !== 1 ? "s" : ""}
                      </span>
                      <span className="text-silver text-[12px]">in {selectedTestId}</span>
                    </>
                  )}
                </div>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full border-collapse text-left">
                  <thead>
                    <tr className="border-b-2 border-cloud-gray bg-cloud-gray/10 text-silver font-extrabold text-[13px] uppercase tracking-wider">
                      <th className="p-4 w-12 whitespace-nowrap">ID</th>
                      {viewMode === "all" && <th className="p-4 whitespace-nowrap">Category</th>}
                      {viewMode === "all" && <th className="p-4 whitespace-nowrap">Test</th>}
                      <th className="p-4 w-24 whitespace-nowrap">Type</th>
                      <th className="p-4 whitespace-nowrap">Question Prompt</th>
                      <th className="p-4 w-32 whitespace-nowrap">Answer Key</th>
                      {viewMode === "single" && <th className="p-4 text-right w-44 whitespace-nowrap">Actions</th>}
                    </tr>
                  </thead>
                  <tbody className="divide-y-2 divide-cloud-gray font-bold text-[14px]">
                    {displayedQuestions.length === 0 ? (
                      <tr>
                        <td colSpan={viewMode === "all" ? 6 : 5} className="p-8 text-center text-silver">
                          No questions found.
                        </td>
                      </tr>
                    ) : (
                      displayedQuestions.map((q, idx) => {
                        const qType = q.type ?? (q.image ? "image" : "text");
                        const catMeta = q.category ? CATEGORY_META[q.category] : null;
                        return (
                          <tr key={`${q.testId ?? ""}-${q.id ?? idx}`} className="hover:bg-cloud-gray/5 text-charcoal">
                            <td className="p-4 font-extrabold text-silver whitespace-nowrap">#{q.id}</td>
                            {viewMode === "all" && (
                              <td className="p-4 whitespace-nowrap">
                                {catMeta && (
                                  <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full border" style={{ color: catMeta.color, backgroundColor: `${catMeta.color}15`, borderColor: `${catMeta.color}40` }}>
                                    {catMeta.icon} {catMeta.label.split(" ")[0]}
                                  </span>
                                )}
                              </td>
                            )}
                            {viewMode === "all" && (
                              <td className="p-4 whitespace-nowrap">
                                <span className="text-[10px] font-mono text-silver">{q.testId}</span>
                              </td>
                            )}
                            <td className="p-4 whitespace-nowrap">
                              <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase ${
                                qType === "image" ? "bg-bubblegum-pink/10 text-bubblegum-pink border border-bubblegum-pink/20" : "bg-sky-blue/10 text-sky-blue border border-sky-blue/20"
                              }`}>
                                {qType === "image" ? "Image" : "Text"}
                              </span>
                            </td>
                            <td className="p-4 max-w-[380px] break-words whitespace-normal [overflow-wrap:anywhere]">
                              <span className="text-almost-black block max-w-full line-clamp-3 leading-normal break-words [overflow-wrap:anywhere]" title={q.prompt}>{q.prompt}</span>
                              {q.explanation && (
                                <span className="text-[11px] text-silver block max-w-full line-clamp-1 italic mt-0.5 leading-normal break-words [overflow-wrap:anywhere]" title={q.explanation}>
                                  💡 {q.explanation}
                                </span>
                              )}
                              {q.image && <span className="text-[11px] text-silver font-mono break-all max-w-full block mt-0.5 leading-normal">{q.image}</span>}
                            </td>
                            <td className="p-4 whitespace-nowrap">
                              <span className="bg-duo-green-light text-duo-green px-2.5 py-1 rounded-xl text-[12px] border border-duo-green/20">
                                Option {q.correctIndex !== undefined ? String.fromCharCode(65 + q.correctIndex) : "N/A"}
                              </span>
                            </td>
                            {viewMode === "single" && (
                              <td className="p-4 text-right whitespace-nowrap">
                                <div className="flex justify-end gap-2">
                                  <button onClick={() => handleEditQuestionClick(q)} className="text-sky-blue hover:bg-sky-blue/10 px-3 py-1.5 rounded-xl border-2 border-sky-blue/20 transition-all text-xs">
                                    Edit
                                  </button>
                                  <button onClick={() => handleDeleteQuestion(q.id)} className="text-charcoal hover:bg-[#ff2e63]/10 hover:text-[#ff2e63] px-3 py-1.5 rounded-xl border-2 border-transparent transition-all text-xs">
                                    Delete
                                  </button>
                                </div>
                              </td>
                            )}
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* ── QUESTION ADD/EDIT MODAL ──────────────────────────────────────── */}
          {(editingQuestion || isAddingQuestion) && (
            <div className="fixed inset-0 bg-almost-black/50 z-50 flex items-center justify-center p-4 backdrop-blur-[2px]">
              <div className="bg-snow-white border-2 border-cloud-gray w-full max-w-[650px] rounded-3xl p-6 shadow-xl animate-scaleIn max-h-[90vh] overflow-y-auto">
                <div className="flex justify-between items-center border-b-2 border-cloud-gray pb-4">
                  <h3 className="font-extrabold text-heading-sm text-almost-black">
                    {isAddingQuestion ? "Add New Question" : `Edit Question #${editingQuestion?.id}`}
                  </h3>
                  <button
                    onClick={() => { setEditingQuestion(null); setIsAddingQuestion(false); }}
                    className="text-silver hover:text-charcoal font-bold text-xl cursor-pointer"
                  >
                    ✕
                  </button>
                </div>
                <form onSubmit={handleSaveQuestion} className="flex flex-col gap-4 mt-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="flex flex-col gap-1">
                      <label className="text-xs uppercase font-extrabold text-silver tracking-wider">Question Type</label>
                      <select value={qType} onChange={(e) => setQType(e.target.value)} className="border-2 border-cloud-gray focus:border-sky-blue rounded-xl p-2.5 outline-none font-bold text-almost-black text-md bg-[#3c3c3c]">
                        <option value="text">Text Only</option>
                        <option value="image">Image Prompt</option>
                      </select>
                    </div>
                    <div className="flex flex-col gap-1">
                      <label className="text-xs uppercase font-extrabold text-silver tracking-wider">Correct Option Key</label>
                      <select value={qCorrectIndex} onChange={(e) => setQCorrectIndex(Number(e.target.value))} className="border-2 border-cloud-gray focus:border-sky-blue rounded-xl p-2.5 outline-none font-bold text-almost-black text-md bg-[#3c3c3c]">
                        <option value={0}>Option A</option>
                        <option value={1}>Option B</option>
                        <option value={2}>Option C</option>
                        <option value={3}>Option D</option>
                      </select>
                    </div>
                  </div>
                  <div className="flex flex-col gap-1">
                    <label className="text-xs uppercase font-extrabold text-silver tracking-wider">Question Prompt (supports LaTeX / MathText)</label>
                    <textarea 
                      value={qPrompt} 
                      onChange={(e) => setQPrompt(e.target.value)} 
                      rows={3} 
                      required 
                      placeholder="Enter question content..." 
                      className="border-2 border-cloud-gray focus:border-sky-blue rounded-xl p-3 outline-none font-bold text-almost-black text-sm w-full min-h-[90px] max-h-[250px] overflow-y-auto resize-y whitespace-pre-wrap break-words [overflow-wrap:anywhere]" 
                    />
                  </div>
                  {qType === "image" && (
                    <div className="flex flex-col gap-1">
                      <label className="text-xs uppercase font-extrabold text-silver tracking-wider">Image URI Path</label>
                      <input 
                        type="text" 
                        value={qImage} 
                        onChange={(e) => setQImage(e.target.value)} 
                        placeholder="e.g. /img/afp_reviewer_imgs/abstract_reasoning/abstract_reasoning_test1/q1.webp" 
                        className="border-2 border-cloud-gray focus:border-sky-blue rounded-xl p-2.5 outline-none font-bold text-almost-black text-sm w-full min-w-0 break-all" 
                      />
                    </div>
                  )}
                  <div className="flex flex-col gap-2">
                    <label className="text-xs uppercase font-extrabold text-silver tracking-wider">Multiple Choice Options</label>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {qOptions.map((opt, i) => (
                        <div key={i} className="flex items-center gap-2 min-w-0">
                          <span className="w-6 h-6 rounded-lg bg-cloud-gray flex items-center justify-center font-extrabold text-xs text-charcoal shrink-0">
                            {String.fromCharCode(65 + i)}
                          </span>
                          <input 
                            type="text" 
                            value={opt} 
                            onChange={(e) => { const next = [...qOptions]; next[i] = e.target.value; setQOptions(next); }} 
                            required 
                            placeholder={`Enter Option ${String.fromCharCode(65 + i)}`} 
                            className="flex-1 min-w-0 border-2 border-cloud-gray focus:border-sky-blue rounded-xl p-2 outline-none font-bold text-almost-black text-sm break-words [overflow-wrap:anywhere]" 
                          />
                        </div>
                      ))}
                    </div>
                  </div>
                  <div className="flex flex-col gap-1">
                    <label className="text-xs uppercase font-extrabold text-silver tracking-wider">Solution / Explanation Text</label>
                    <textarea 
                      value={qExplanation} 
                      onChange={(e) => setQExplanation(e.target.value)} 
                      rows={3} 
                      required 
                      placeholder="Explain why the answer is correct..." 
                      className="border-2 border-cloud-gray focus:border-sky-blue rounded-xl p-3 outline-none font-bold text-almost-black text-sm w-full min-h-[90px] max-h-[250px] overflow-y-auto resize-y whitespace-pre-wrap break-words [overflow-wrap:anywhere]" 
                    />
                  </div>
                  <div className="flex gap-3 justify-end mt-4 border-t-2 border-cloud-gray pt-4">
                    <button type="button" onClick={() => { setEditingQuestion(null); setIsAddingQuestion(false); }} className="border-2 border-cloud-gray hover:bg-cloud-gray/10 text-charcoal font-bold px-5 py-2.5 rounded-2xl text-sm">
                      Cancel
                    </button>
                    <button type="submit" disabled={savingQuestion} className="bg-duo-green text-white font-bold px-6 py-2.5 rounded-2xl shadow-[0_4px_0_#3f8f01] active:translate-y-1 active:shadow-none transition-all disabled:opacity-50 text-sm">
                      {savingQuestion ? "Saving..." : "Save Question"}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ══════════════════════════ ECONOMY PANEL ═════════════════════════════ */}
      {activeTab === "economy" && (
        <form onSubmit={handleSaveEconomy} className="flex flex-col gap-6 animate-fadeIn max-w-[600px]">
          <div className="bg-snow-white border-2 border-cloud-gray rounded-3xl p-6 flex flex-col gap-5">
            <h3 className="font-extrabold text-heading-sm text-almost-black uppercase tracking-tight border-b-2 border-cloud-gray pb-3">
              Configure Gamification Balance
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <div className="flex flex-col gap-1">
                <label className="text-xs uppercase font-extrabold text-silver tracking-wider">Heart Refill Cost (Gems)</label>
                <div className="relative">
                  <input type="number" value={economy.heartCost} onChange={(e) => setEconomy({ ...economy, heartCost: Number(e.target.value) })} className="w-full border-2 border-cloud-gray focus:border-sky-blue rounded-xl p-2.5 pl-8 outline-none font-bold text-almost-black text-sm" />
                </div>
                <p className="text-[11px] text-silver mt-0.5">Gem cost to refill hearts in the Shop.</p>
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-xs uppercase font-extrabold text-silver tracking-wider">Streak Freeze Cost (Gems)</label>
                <div className="relative">
                  <input type="number" value={economy.streakFreezeCost} onChange={(e) => setEconomy({ ...economy, streakFreezeCost: Number(e.target.value) })} className="w-full border-2 border-cloud-gray focus:border-sky-blue rounded-xl p-2.5 pl-8 outline-none font-bold text-almost-black text-sm" />
                </div>
                <p className="text-[11px] text-silver mt-0.5">Gem cost to purchase a Streak Freeze shield.</p>
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 border-t-2 border-cloud-gray pt-4">
              <div className="flex flex-col gap-1">
                <label className="text-xs uppercase font-extrabold text-silver tracking-wider">Base Gem Reward</label>
                <input type="number" value={economy.baseReward} onChange={(e) => setEconomy({ ...economy, baseReward: Number(e.target.value) })} className="border-2 border-cloud-gray focus:border-sky-blue rounded-xl p-2.5 outline-none font-bold text-almost-black text-sm" />
                <p className="text-[11px] text-silver mt-0.5">Earned per test completion.</p>
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-xs uppercase font-extrabold text-silver tracking-wider">Passing Score Bonus</label>
                <input type="number" value={economy.passingBonus} onChange={(e) => setEconomy({ ...economy, passingBonus: Number(e.target.value) })} className="border-2 border-cloud-gray focus:border-sky-blue rounded-xl p-2.5 outline-none font-bold text-almost-black text-sm" />
                <p className="text-[11px] text-silver mt-0.5">Earned for scoring 80%+.</p>
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-xs uppercase font-extrabold text-silver tracking-wider">Perfect Score Bonus</label>
                <input type="number" value={economy.perfectBonus} onChange={(e) => setEconomy({ ...economy, perfectBonus: Number(e.target.value) })} className="border-2 border-cloud-gray focus:border-sky-blue rounded-xl p-2.5 outline-none font-bold text-almost-black text-sm" />
                <p className="text-[11px] text-silver mt-0.5">Extra gems for scoring 100%.</p>
              </div>
            </div>
            <div className="flex justify-end mt-4 border-t-2 border-cloud-gray pt-4">
              <button type="submit" disabled={savingEconomy} className="bg-duo-green text-white font-bold p-2 w-[100px] rounded-2xl shadow-[0_4px_0_#3f8f01] active:translate-y-1 active:shadow-none transition-all disabled:opacity-50 text-lg">
                {savingEconomy ? "Saving..." : "Save"}
              </button>
            </div>
          </div>
        </form>
      )}

    </main>
  );
}
