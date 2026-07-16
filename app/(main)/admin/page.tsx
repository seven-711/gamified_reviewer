"use client";

import React, { useState, useEffect } from "react";
import { useUser } from "@clerk/nextjs";
import { useAlert } from "@/components/ui/AlertContext";
import { useStats } from "@/components/ui/StatsContext";
import { checkIsAdmin } from "@/lib/admin";

type Tab = "overview" | "users" | "questions" | "economy";

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
}

interface Question {
  id: number;
  type: string;
  prompt: string;
  options: string[];
  correctIndex: number;
  explanation: string;
  image?: string;
}

export default function AdminDashboard() {
  const { user, isLoaded: isUserLoaded, isSignedIn } = useUser();
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

  // Questions State
  const [testIds, setTestIds] = useState<string[]>([]);
  const [selectedTestId, setSelectedTestId] = useState<string>("");
  const [questions, setQuestions] = useState<Question[]>([]);
  const [loadingQuestions, setLoadingQuestions] = useState(false);
  const [editingQuestion, setEditingQuestion] = useState<Question | null>(null);
  const [isAddingQuestion, setIsAddingQuestion] = useState(false);
  const [savingQuestion, setSavingQuestion] = useState(false);

  // Form states for new/editing questions
  const [qPrompt, setQPrompt] = useState("");
  const [qOptions, setQOptions] = useState<string[]>(["", "", "", ""]);
  const [qCorrectIndex, setQCorrectIndex] = useState(0);
  const [qExplanation, setQExplanation] = useState("");
  const [qImage, setQImage] = useState("");
  const [qType, setQType] = useState("text");

  // Fetch economy config on load
  useEffect(() => {
    fetchEconomy();
    fetchTestIds();
    fetchUsers();
  }, []);

  const fetchEconomy = async () => {
    try {
      const res = await fetch("/api/admin/economy");
      const data = await res.json();
      if (!data.error) {
        setEconomy(data);
      }
    } catch (err) {
      console.error("Error fetching economy:", err);
    }
  };

  const fetchTestIds = async () => {
    try {
      const res = await fetch("/api/admin/tests");
      const data = await res.json();
      if (data.testIds) {
        setTestIds(data.testIds);
        if (data.testIds.length > 0) {
          setSelectedTestId(data.testIds[0]);
        }
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
      if (data.users) {
        setUsers(data.users);
      }
    } catch (err) {
      console.error("Error fetching users:", err);
    } finally {
      setLoadingUsers(false);
    }
  };

  const fetchQuestions = async (testId: string) => {
    if (!testId) return;
    setLoadingQuestions(true);
    try {
      const res = await fetch(`/api/admin/tests?testId=${testId}`);
      const data = await res.json();
      if (data.questions) {
        setQuestions(data.questions);
      }
    } catch (err) {
      console.error("Error fetching questions:", err);
    } finally {
      setLoadingQuestions(false);
    }
  };

  useEffect(() => {
    if (selectedTestId) {
      fetchQuestions(selectedTestId);
    }
  }, [selectedTestId]);

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

  const handleEditUserClick = (u: UserRecord) => {
    setEditingUser({ ...u });
  };

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
        await refreshStats(); // Refresh headers in case logged-in user edited themselves
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
        body: JSON.stringify({
          testId: selectedTestId,
          questions: updatedQuestions,
        }),
      });

      const data = await res.json();
      if (data.success) {
        setIsAddingQuestion(false);
        setEditingQuestion(null);
        await fetchQuestions(selectedTestId);
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
        body: JSON.stringify({
          testId: selectedTestId,
          questions: updatedQuestions,
        }),
      });
      const data = await res.json();
      if (data.success) {
        await fetchQuestions(selectedTestId);
        await showAlert("🗑️ Question deleted successfully!");
      } else {
        await showAlert("❌ Error deleting question: " + data.error);
      }
    } catch (err: any) {
      await showAlert("❌ Network error: " + err.message);
    }
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchUsers(searchQuery);
  };

  // Aggregate stats for overview
  const totalUsers = users.length;
  const totalGems = users.reduce((acc, u) => acc + u.gems, 0);
  const averageLevel = totalUsers > 0 ? (users.reduce((acc, u) => acc + u.current_level, 0) / totalUsers).toFixed(1) : 0;
  const maxStreak = users.length > 0 ? Math.max(...users.map(u => u.streak)) : 0;

  // Render SVG charts
  const renderSignupChart = () => {
    if (users.length === 0) return <div className="text-silver py-12 text-center">No signup data available.</div>;
    
    // Sort users by created_at date
    const sorted = [...users].sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
    
    // Count cumulative signups over dates
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

    const width = 450;
    const height = 180;
    const padding = 30;

    const points = dates.map((d, index) => {
      const x = padding + (index / Math.max(dates.length - 1, 1)) * (width - 2 * padding);
      const y = height - padding - (counts[index] / maxVal) * (height - 2 * padding);
      return { x, y, label: d, val: counts[index] };
    });

    const pathD = points.length > 0 
      ? `M ${points[0].x} ${points[0].y} ` + points.slice(1).map(p => `L ${p.x} ${p.y}`).join(" ")
      : "";

    return (
      <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-auto bg-snow-white rounded-2xl border-2 border-cloud-gray p-2">
        {/* Grid lines */}
        <line x1={padding} y1={height - padding} x2={width - padding} y2={height - padding} stroke="#e5e5e5" strokeWidth={2} />
        <line x1={padding} y1={padding} x2={padding} y2={height - padding} stroke="#e5e5e5" strokeWidth={2} />
        
        {/* Y Axis Grid lines */}
        {[0.25, 0.5, 0.75, 1].map((r, i) => {
          const y = height - padding - r * (height - 2 * padding);
          return (
            <g key={i}>
              <line x1={padding} y1={y} x2={width - padding} y2={y} stroke="#e5e5e5" strokeWidth={1} strokeDasharray="4 4" />
              <text x={padding - 6} y={y + 4} textAnchor="end" className="fill-silver font-bold text-[9px]">{Math.round(r * maxVal)}</text>
            </g>
          );
        })}

        {/* Plot path */}
        {points.length > 1 && (
          <path d={pathD} fill="none" stroke="#1cb0f6" strokeWidth={4} strokeLinecap="round" strokeLinejoin="round" />
        )}

        {/* Data points */}
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
    const categories = [
      { name: "Abstract", count: 20, color: "#58cc02" },
      { name: "Logical", count: 12, color: "#a570ff" },
      { name: "Numerical", count: 15, color: "#ffc700" },
      { name: "Quantitative", count: 10, color: "#cc348d" }
    ];

    const total = categories.reduce((sum, c) => sum + c.count, 0);

    return (
      <div className="flex flex-col gap-4 bg-snow-white rounded-2xl border-2 border-cloud-gray p-5 h-full justify-center">
        <h4 className="font-extrabold text-[15px] text-almost-black tracking-wide uppercase">Question Bank Ratio</h4>
        <div className="w-full h-8 bg-cloud-gray rounded-full overflow-hidden flex">
          {categories.map((c, i) => {
            const widthPct = total > 0 ? (c.count / total) * 100 : 25;
            return (
              <div 
                key={i} 
                style={{ width: `${widthPct}%`, backgroundColor: c.color }} 
                className="h-full first:rounded-l-full last:rounded-r-full transition-all duration-300"
                title={`${c.name}: ${c.count} items`}
              />
            );
          })}
        </div>
        <div className="grid grid-cols-2 gap-3 mt-1">
          {categories.map((c, i) => (
            <div key={i} className="flex items-center gap-2 text-caption">
              <span className="w-3 h-3 rounded-full shrink-0" style={{ backgroundColor: c.color }} />
              <span className="font-bold text-charcoal uppercase text-[12px]">{c.name}</span>
              <span className="text-silver">({c.count})</span>
            </div>
          ))}
        </div>
      </div>
    );
  };

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
          <h1 className="font-feather text-heading text-[#ff2e63] uppercase tracking-wide">
            Access Denied
          </h1>
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

  return (
    <main className="flex-1 w-full max-w-[1000px] mx-auto pb-24 flex flex-col gap-6 pt-4 md:pt-8 px-4 font-din-round relative">
      
      {/* Title */}
      <div className="mt-4">
        <h1 className="font-feather text-heading text-almost-black tracking-tight uppercase">
          Dashboard
        </h1>
        <p className="text-graphite text-[15px] mt-1">
          Monitor users, refine training question datasets, and configure gamification variables.
        </p>
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
                isActive 
                  ? "border-sky-blue text-sky-blue" 
                  : "border-transparent text-silver hover:text-charcoal hover:border-cloud-gray"
              }`}
            >
              {tab === "overview" && "Overview"}
              {tab === "users" && "Users"}
              {tab === "questions" && "Question CMS"}
              {tab === "economy" && "Economy Settings"}
            </button>
          );
        })}
      </div>

      {/* OVERVIEW PANEL */}
      {activeTab === "overview" && (
        <div className="flex flex-col gap-8 animate-fadeIn">
          {/* Stats Grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-snow-white border-2 border-cloud-gray p-5 rounded-2xl hover:border-sky-blue transition-colors">
              <p className="text-silver font-bold uppercase text-[12px] tracking-wider">Total Reviewers</p>
              <h2 className="text-heading font-extrabold mt-1 text-almost-black">{totalUsers}</h2>
              <div className="text-xs text-sky-blue font-bold mt-1">Registered Accounts</div>
            </div>
            <div className="bg-snow-white border-2 border-cloud-gray p-4 rounded-2xl hover:border-duo-green transition-colors flex flex-col gap-3">
              <div>
                <p className="text-silver font-bold uppercase text-[11px] tracking-wider">Top 3 Active Streaks</p>
              </div>
              <div className="flex flex-col gap-2.5">
                {users
                  .slice()
                  .sort((a, b) => Number(b.streak || 0) - Number(a.streak || 0))
                  .slice(0, 3)
                  .map((u, i) => {
                    const avatarSrc = u.avatarUrl || "/emoji/profile.webp";
                    return (
                      <div key={u.id} className="flex items-center justify-between gap-3">
                        <div className="flex items-center gap-2.5 min-w-0 flex-1">
                          <div className="w-9 h-9 rounded-full overflow-hidden border border-cloud-gray/20 bg-cloud-gray/10 shrink-0 flex items-center justify-center select-none">
                            <img
                              src={avatarSrc}
                              alt={u.name}
                              className={avatarSrc === "/emoji/profile.webp" ? "w-16 h-16 object-contain" : "w-full h-full object-cover"}
                            />
                          </div>
                          <div className="min-w-0 flex flex-col">
                            <span className="font-bold text-almost-black text-sm truncate leading-tight">
                              {u.name}
                            </span>
                            <span className="text-silver text-[10px] font-semibold truncate leading-none">
                              Rank #{i + 1}
                            </span>
                          </div>
                        </div>
                        <div className="text-[#ff5e00] font-extrabold text-sm shrink-0 flex items-center">
                          <img
                            src="/img/gen_imgs/Streak/streak.webp"
                            alt="Streak"
                            className="w-7 h-7 object-contain shrink-0"
                          />
                          <span>{u.streak}d</span>
                        </div>
                      </div>
                    );
                  })}
                {users.length === 0 && (
                  <p className="text-silver text-xs font-semibold py-2 text-center">No streak data found</p>
                )}
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

          {/* Charts Row */}
          <div className="grid grid-cols-1 md:grid-cols-5 gap-6">
            <div className="md:col-span-3 flex flex-col gap-3">
              <h4 className="font-extrabold text-[15px] text-almost-black tracking-wide uppercase">Reviewer Registration Trend</h4>
              {renderSignupChart()}
            </div>
            <div className="md:col-span-2">
              {renderCategoryChart()}
            </div>
          </div>
        </div>
      )}

      {/* USERS MANAGER PANEL */}
      {activeTab === "users" && (
        <div className="flex flex-col gap-6 animate-fadeIn">
          {/* Search Bar */}
          <form onSubmit={handleSearchSubmit} className="flex gap-3">
            <input
              type="text"
              placeholder="Search users by name or database ID..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="flex-1 border-2 border-cloud-gray focus:border-sky-blue rounded-2xl p-3 px-4 font-bold text-almost-black outline-none transition-colors"
            />
            <button
              type="submit"
              className="bg-sky-blue text-white font-bold px-6 p-3 rounded-2xl shadow-[0_4px_0_#0f9cdb] active:translate-y-1 active:shadow-none transition-all hover:bg-sky-blue/90"
            >
              Search
            </button>
          </form>

          {/* Users Table */}
          {loadingUsers ? (
            <div className="text-center py-12 text-silver font-bold">Querying users from database...</div>
          ) : (
            <div className="bg-snow-white border-2 border-cloud-gray rounded-2xl overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full border-collapse text-left">
                  <thead>
                    <tr className="border-b-2 border-cloud-gray bg-cloud-gray/10 text-silver font-extrabold text-[13px] uppercase tracking-wider">
                      <th className="p-4">Name / ID</th>
                      <th className="p-4">Gems</th>
                      <th className="p-4">Hearts</th>
                      <th className="p-4">Streak</th>
                      <th className="p-4">Lvl/XP</th>
                      <th className="p-4">Diff/Style</th>
                      <th className="p-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y-2 divide-cloud-gray font-bold text-[14px]">
                    {users.length === 0 ? (
                      <tr>
                        <td colSpan={7} className="p-8 text-center text-silver">No registered user profiles found.</td>
                      </tr>
                    ) : (
                      users
                        .slice()
                        .sort((a, b) => Number(b.streak || 0) - Number(a.streak || 0))
                        .map((u) => (
                        <tr key={u.id} className="hover:bg-cloud-gray/5 text-charcoal">
                          <td className="p-4 flex items-center gap-3">
                            {u.avatarUrl ? (
                              <img
                                src={u.avatarUrl}
                                alt={u.name}
                                className="w-10 h-10 rounded-full object-cover border-2 border-cloud-gray bg-cloud-gray/10 shrink-0"
                                referrerPolicy="no-referrer"
                              />
                            ) : (
                              <div className="w-10 h-10 rounded-full bg-cloud-gray flex items-center justify-center font-extrabold text-silver shrink-0 text-sm">
                                {u.name.charAt(0).toUpperCase()}
                              </div>
                            )}
                            <div className="min-w-0">
                              <p className="text-almost-black font-extrabold truncate">{u.name}</p>
                              <span className="text-[11px] text-silver font-medium font-mono block truncate max-w-[150px]">{u.id}</span>
                            </div>
                          </td>
                          <td className="p-4 text-[#ffc700] font-extrabold">💎 {u.gems}</td>
                          <td className="p-4 text-[#ff2e63]">❤️ {u.hearts}/5</td>
                          <td className="p-4 text-[#ff5e00]">🔥 {u.streak}d</td>
                          <td className="p-4">
                            Lvl {u.current_level}
                            <p className="text-[11px] text-silver font-medium">{u.total_score} XP</p>
                          </td>
                          <td className="p-4">
                            <span className="text-[12px] bg-cloud-gray/40 px-2 py-0.5 rounded-full text-charcoal">{u.difficulty}</span>
                            <p className="text-[11px] text-silver font-medium">{u.study_style}</p>
                          </td>
                          <td className="p-4 text-right">
                            <button
                              onClick={() => handleEditUserClick(u)}
                              className="text-sky-blue hover:bg-sky-blue/10 px-3 py-1.5 rounded-xl border-2 border-sky-blue/20 transition-all text-xs"
                            >
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

          {/* User Edit Modal */}
          {editingUser && (
            <div className="fixed inset-0 bg-almost-black/50 z-50 flex items-center justify-center p-4 backdrop-blur-[2px]">
              <div className="bg-snow-white border-2 border-cloud-gray w-full max-w-[500px] rounded-3xl p-6 shadow-xl animate-scaleIn">
                <div className="flex justify-between items-center border-b-2 border-cloud-gray pb-4">
                  <h3 className="font-extrabold text-heading-sm text-almost-black">
                    Edit Student Profile
                  </h3>
                  <button 
                    onClick={() => setEditingUser(null)}
                    className="text-silver hover:text-charcoal font-bold text-xl cursor-pointer"
                  >
                    ✕
                  </button>
                </div>
                <form onSubmit={handleSaveUser} className="flex flex-col gap-4 mt-4">
                  <div className="flex flex-col gap-1">
                    <label className="text-xs uppercase font-extrabold text-silver tracking-wider">Display Name</label>
                    <input
                      type="text"
                      value={editingUser.name}
                      onChange={(e) => setEditingUser({ ...editingUser, name: e.target.value })}
                      className="border-2 border-cloud-gray focus:border-sky-blue rounded-xl p-2.5 outline-none font-bold text-almost-black text-sm"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="flex flex-col gap-1">
                      <label className="text-xs uppercase font-extrabold text-silver tracking-wider">Gems Balance</label>
                      <input
                        type="number"
                        value={editingUser.gems}
                        onChange={(e) => setEditingUser({ ...editingUser, gems: Number(e.target.value) })}
                        className="border-2 border-cloud-gray focus:border-sky-blue rounded-xl p-2.5 outline-none font-bold text-almost-black text-sm"
                      />
                    </div>
                    <div className="flex flex-col gap-1">
                      <label className="text-xs uppercase font-extrabold text-silver tracking-wider">Hearts Count</label>
                      <select
                        value={editingUser.hearts}
                        onChange={(e) => setEditingUser({ ...editingUser, hearts: Number(e.target.value) })}
                        className="border-2 border-cloud-gray focus:border-sky-blue rounded-xl p-2.5 outline-none font-bold text-almost-black text-sm bg-[#3c3c3c]"
                      >
                        {[0, 1, 2, 3, 4, 5].map(v => <option key={v} value={v}>{v}</option>)}
                      </select>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="flex flex-col gap-1">
                      <label className="text-xs uppercase font-extrabold text-silver tracking-wider">Active Streak</label>
                      <input
                        type="number"
                        value={editingUser.streak}
                        onChange={(e) => setEditingUser({ ...editingUser, streak: Number(e.target.value) })}
                        className="border-2 border-cloud-gray focus:border-sky-blue rounded-xl p-2.5 outline-none font-bold text-almost-black text-sm"
                      />
                    </div>
                    <div className="flex flex-col gap-1">
                      <label className="text-xs uppercase font-extrabold text-silver tracking-wider">Streak Freezes</label>
                      <input
                        type="number"
                        value={editingUser.streak_freeze_count}
                        onChange={(e) => setEditingUser({ ...editingUser, streak_freeze_count: Number(e.target.value) })}
                        className="border-2 border-cloud-gray focus:border-sky-blue rounded-xl p-2.5 outline-none font-bold text-almost-black text-sm"
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="flex flex-col gap-1">
                      <label className="text-xs uppercase font-extrabold text-silver tracking-wider">Current Level</label>
                      <input
                        type="number"
                        value={editingUser.current_level}
                        onChange={(e) => setEditingUser({ ...editingUser, current_level: Number(e.target.value) })}
                        className="border-2 border-cloud-gray focus:border-sky-blue rounded-xl p-2.5 outline-none font-bold text-almost-black text-sm"
                      />
                    </div>
                    <div className="flex flex-col gap-1">
                      <label className="text-xs uppercase font-extrabold text-silver tracking-wider">Total Score (XP)</label>
                      <input
                        type="number"
                        value={editingUser.total_score}
                        onChange={(e) => setEditingUser({ ...editingUser, total_score: Number(e.target.value) })}
                        className="border-2 border-cloud-gray focus:border-sky-blue rounded-xl p-2.5 outline-none font-bold text-almost-black text-sm"
                      />
                    </div>
                  </div>
                  <div className="flex gap-3 justify-end mt-4 border-t-2 border-cloud-gray pt-4">
                    <button
                      type="button"
                      onClick={() => setEditingUser(null)}
                      className="border-2 border-cloud-gray hover:bg-cloud-gray/10 text-charcoal font-bold px-5 py-2.5 rounded-2xl text-sm"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={savingUser}
                      className="bg-duo-green text-white font-bold px-6 py-2.5 rounded-2xl shadow-[0_4px_0_#3f8f01] active:translate-y-1 active:shadow-none transition-all disabled:opacity-50 text-sm"
                    >
                      {savingUser ? "Saving..." : "Save Progress"}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}
        </div>
      )}

      {/* QUESTION CMS PANEL */}
      {activeTab === "questions" && (
        <div className="flex flex-col gap-6 animate-fadeIn">
          {/* Header Actions */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div className="flex items-center gap-3 w-full sm:w-auto">
              <label className="font-extrabold text-[14px] text-charcoal uppercase tracking-wider">Active Test:</label>
              <select
                value={selectedTestId}
                onChange={(e) => setSelectedTestId(e.target.value)}
                className="border-2 border-cloud-gray focus:border-sky-blue rounded-xl p-2.5 font-extrabold text-almost-black outline-none bg-[#3c3c3c] text-sm grow sm:grow-0 min-w-[220px]"
              >
                {testIds.map((id) => (
                  <option key={id} value={id}>{id}</option>
                ))}
              </select>
            </div>
            <button
              onClick={handleAddQuestionClick}
              className="bg-duo-green text-white font-bold py-2.5 px-5 rounded-2xl shadow-[0_4px_0_#3f8f01] active:translate-y-1 active:shadow-none transition-all text-sm w-full sm:w-auto text-center"
            >
              Add New Question
            </button>
          </div>

          {/* Questions Grid */}
          {loadingQuestions ? (
            <div className="text-center py-12 text-silver font-bold">Querying questions from json dataset...</div>
          ) : (
            <div className="bg-snow-white border-2 border-cloud-gray rounded-2xl overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full border-collapse text-left">
                  <thead>
                    <tr className="border-b-2 border-cloud-gray bg-cloud-gray/10 text-silver font-extrabold text-[13px] uppercase tracking-wider">
                      <th className="p-4 w-12">ID</th>
                      <th className="p-4 w-24">Type</th>
                      <th className="p-4">Question Prompt</th>
                      <th className="p-4 w-32">Answer Key</th>
                      <th className="p-4 text-right w-44">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y-2 divide-cloud-gray font-bold text-[14px]">
                    {questions.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="p-8 text-center text-silver">No questions found in this test bank.</td>
                      </tr>
                    ) : (
                      questions.map((q, idx) => (
                        <tr key={q.id || idx} className="hover:bg-cloud-gray/5 text-charcoal">
                          <td className="p-4 font-extrabold text-silver">#{q.id}</td>
                          <td className="p-4">
                            <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase ${
                              q.image ? "bg-bubblegum-pink/10 text-bubblegum-pink border border-bubblegum-pink/20" : "bg-sky-blue/10 text-sky-blue border border-sky-blue/20"
                            }`}>
                              {q.image ? "Image" : "Text"}
                            </span>
                          </td>
                          <td className="p-4">
                            <p className="text-almost-black line-clamp-2 max-w-[400px] leading-relaxed">{q.prompt}</p>
                            {q.image && <span className="text-[11px] text-silver font-normal truncate max-w-[300px] block mt-0.5">{q.image}</span>}
                          </td>
                          <td className="p-4">
                            <span className="bg-duo-green-light text-duo-green px-2.5 py-1 rounded-xl text-[12px] border border-duo-green/20">
                              Option {q.correctIndex !== undefined ? String.fromCharCode(65 + q.correctIndex) : "N/A"}
                            </span>
                          </td>
                          <td className="p-4 text-right flex justify-end gap-2">
                            <button
                              onClick={() => handleEditQuestionClick(q)}
                              className="text-sky-blue hover:bg-sky-blue/10 px-3 py-1.5 rounded-xl border-2 border-sky-blue/20 transition-all text-xs"
                            >
                              Edit
                            </button>
                            <button
                              onClick={() => handleDeleteQuestion(q.id)}
                              className="text-charcoal hover:bg-[#ff2e63]/10 hover:text-[#ff2e63] px-3 py-1.5 rounded-xl border-2 border-transparent transition-all text-xs"
                            >
                              Delete
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

          {/* Question Add/Edit Modal */}
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
                      <select
                        value={qType}
                        onChange={(e) => setQType(e.target.value)}
                        className="border-2 border-cloud-gray focus:border-sky-blue rounded-xl p-2.5 outline-none font-bold text-almost-black text-md bg-[#3c3c3c]"
                      >
                        <option value="text">Text Only</option>
                        <option value="image">Image Prompt</option>
                      </select>
                    </div>
                    <div className="flex flex-col gap-1">
                      <label className="text-xs uppercase font-extrabold text-silver tracking-wider">Correct Option Key</label>
                      <select
                        value={qCorrectIndex}
                        onChange={(e) => setQCorrectIndex(Number(e.target.value))}
                        className="border-2 border-cloud-gray focus:border-sky-blue rounded-xl p-2.5 outline-none font-bold text-almost-black text-md bg-[#3c3c3c]"
                      >
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
                      className="border-2 border-cloud-gray focus:border-sky-blue rounded-xl p-3 outline-none font-bold text-almost-black text-sm w-full resize-none"
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
                        className="border-2 border-cloud-gray focus:border-sky-blue rounded-xl p-2.5 outline-none font-bold text-almost-black text-sm"
                      />
                    </div>
                  )}

                  <div className="flex flex-col gap-2">
                    <label className="text-xs uppercase font-extrabold text-silver tracking-wider">Multiple Choice Options</label>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {qOptions.map((opt, i) => (
                        <div key={i} className="flex items-center gap-2">
                          <span className="w-6 h-6 rounded-lg bg-cloud-gray flex items-center justify-center font-extrabold text-xs text-charcoal">
                            {String.fromCharCode(65 + i)}
                          </span>
                          <input
                            type="text"
                            value={opt}
                            onChange={(e) => {
                              const next = [...qOptions];
                              next[i] = e.target.value;
                              setQOptions(next);
                            }}
                            required
                            placeholder={`Enter Option ${String.fromCharCode(65 + i)}`}
                            className="flex-1 border-2 border-cloud-gray focus:border-sky-blue rounded-xl p-2 outline-none font-bold text-almost-black text-sm"
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
                      className="border-2 border-cloud-gray focus:border-sky-blue rounded-xl p-3 outline-none font-bold text-almost-black text-sm w-full resize-none"
                    />
                  </div>

                  <div className="flex gap-3 justify-end mt-4 border-t-2 border-cloud-gray pt-4">
                    <button
                      type="button"
                      onClick={() => { setEditingQuestion(null); setIsAddingQuestion(false); }}
                      className="border-2 border-cloud-gray hover:bg-cloud-gray/10 text-charcoal font-bold px-5 py-2.5 rounded-2xl text-sm"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={savingQuestion}
                      className="bg-duo-green text-white font-bold px-6 py-2.5 rounded-2xl shadow-[0_4px_0_#3f8f01] active:translate-y-1 active:shadow-none transition-all disabled:opacity-50 text-sm"
                    >
                      {savingQuestion ? "Saving..." : "Save Question"}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ECONOMY SETTINGS PANEL */}
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
                  <input
                    type="number"
                    value={economy.heartCost}
                    onChange={(e) => setEconomy({ ...economy, heartCost: Number(e.target.value) })}
                    className="w-full border-2 border-cloud-gray focus:border-sky-blue rounded-xl p-2.5 pl-8 outline-none font-bold text-almost-black text-sm"
                  />
                </div>
                <p className="text-[11px] text-silver mt-0.5">Gem cost to refill hearts in the Shop.</p>
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-xs uppercase font-extrabold text-silver tracking-wider">Streak Freeze Cost (Gems)</label>
                <div className="relative">
                  <input
                    type="number"
                    value={economy.streakFreezeCost}
                    onChange={(e) => setEconomy({ ...economy, streakFreezeCost: Number(e.target.value) })}
                    className="w-full border-2 border-cloud-gray focus:border-sky-blue rounded-xl p-2.5 pl-8 outline-none font-bold text-almost-black text-sm"
                  />
                </div>
                <p className="text-[11px] text-silver mt-0.5">Gem cost to purchase a Streak Freeze shield.</p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 border-t-2 border-cloud-gray pt-4">
              <div className="flex flex-col gap-1">
                <label className="text-xs uppercase font-extrabold text-silver tracking-wider">Base Gem Reward</label>
                <input
                  type="number"
                  value={economy.baseReward}
                  onChange={(e) => setEconomy({ ...economy, baseReward: Number(e.target.value) })}
                  className="border-2 border-cloud-gray focus:border-sky-blue rounded-xl p-2.5 outline-none font-bold text-almost-black text-sm"
                />
                <p className="text-[11px] text-silver mt-0.5">Earned per test completion.</p>
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-xs uppercase font-extrabold text-silver tracking-wider">Passing Score Bonus</label>
                <input
                  type="number"
                  value={economy.passingBonus}
                  onChange={(e) => setEconomy({ ...economy, passingBonus: Number(e.target.value) })}
                  className="border-2 border-cloud-gray focus:border-sky-blue rounded-xl p-2.5 outline-none font-bold text-almost-black text-sm"
                />
                <p className="text-[11px] text-silver mt-0.5">Earned for scoring 80%+.</p>
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-xs uppercase font-extrabold text-silver tracking-wider">Perfect Score Bonus</label>
                <input
                  type="number"
                  value={economy.perfectBonus}
                  onChange={(e) => setEconomy({ ...economy, perfectBonus: Number(e.target.value) })}
                  className="border-2 border-cloud-gray focus:border-sky-blue rounded-xl p-2.5 outline-none font-bold text-almost-black text-sm"
                />
                <p className="text-[11px] text-silver mt-0.5">Extra gems for scoring 100%.</p>
              </div>
            </div>

            <div className="flex justify-end mt-4 border-t-2 border-cloud-gray pt-4">
              <button
                type="submit"
                disabled={savingEconomy}
                className="bg-duo-green text-white font-bold p-2 w-[100px] rounded-2xl shadow-[0_4px_0_#3f8f01] active:translate-y-1 active:shadow-none transition-all disabled:opacity-50 text-lg"
              >
                {savingEconomy ? "Saving..." : "Save"}
              </button>
            </div>
          </div>
        </form>
      )}

    </main>
  );
}
