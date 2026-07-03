import React, { useState } from "react";
import IntelligenceEngine from "./components/IntelligenceEngine";
import CommandCenterView from "./components/CommandCenterView";
import { useCandidates } from "./store/useCandidates";

const NAV_ITEMS = [
  {
    id: "command_center",
    label: "Executive Command Center",
    badge: "Zync AI",
    icon: (
      <svg className="h-4.5 w-4.5" viewBox="0 0 20 20" fill="currentColor">
        <path d="M10 2a8 8 0 1 0 0 16 8 8 0 0 0 0-16Zm1 11H9v-2h2v2Zm0-4H9V5h2v4Z" />
      </svg>
    ),
  },
  {
    id: "resume",
    label: "Resume Processor",
    badge: "Gemini AI",
    icon: (
      <svg className="h-4.5 w-4.5" viewBox="0 0 20 20" fill="currentColor">
        <path fillRule="evenodd" d="M4.5 2A1.5 1.5 0 0 0 3 3.5v13A1.5 1.5 0 0 0 4.5 18h11a1.5 1.5 0 0 0 1.5-1.5V7.621a1.5 1.5 0 0 0-.44-1.06l-4.12-4.122A1.5 1.5 0 0 0 11.378 2H4.5Zm2.25 8.5a.75.75 0 0 0 0 1.5h6.5a.75.75 0 0 0 0-1.5h-6.5Zm0 3a.75.75 0 0 0 0 1.5h6.5a.75.75 0 0 0 0-1.5h-6.5Z" clipRule="evenodd" />
      </svg>
    ),
  },
  {
    id: "pipeline",
    label: "Candidate Pipeline",
    icon: (
      <svg className="h-4.5 w-4.5" viewBox="0 0 20 20" fill="currentColor">
        <path d="M7 8a3 3 0 1 0 0-6 3 3 0 0 0 0 6ZM14.5 9a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5ZM1.615 16.428a1.224 1.224 0 0 1-.569-1.175 6.002 6.002 0 0 1 11.908 0c.058.467-.172.92-.57 1.174A9.953 9.953 0 0 1 7 17.5a9.953 9.953 0 0 1-5.385-1.072ZM12.75 15.706a7.48 7.48 0 0 0 2.378-1.503 4.5 4.5 0 0 0-7.857-3.003 7.49 7.49 0 0 1 5.479 4.506Z" />
      </svg>
    ),
  },
];

export default function App() {
  const [activeTab, setActiveTab] = useState("command_center");
  const { candidates } = useCandidates();

  const totalCandidates = candidates.length;
  const avgExp = candidates.length > 0
    ? (candidates.reduce((s, c) => s + (c.yearsOfExperience ?? 0), 0) / candidates.length).toFixed(1)
    : "—";
  const topRole = candidates.length > 0
    ? Object.entries(
        candidates.reduce((acc, c) => {
          acc[c.roleCategory] = (acc[c.roleCategory] || 0) + 1;
          return acc;
        }, {})
      ).sort((a, b) => b[1] - a[1])[0]?.[0] ?? "—"
    : "—";

  const stats = [
    { label: "Total Candidates", value: totalCandidates, delta: "All time", color: "violet" },
    { label: "Avg. Experience", value: avgExp === "—" ? "—" : `${avgExp} yrs`, delta: "Across pipeline", color: "emerald" },
    { label: "Top Role", value: topRole, delta: "Most common", color: "cyan" },
  ];

  return (
    <div className="flex h-screen bg-[#0a0f1e] text-slate-300 overflow-hidden font-sans">
      {/* ── Sidebar ─────────────────────────────────────────────────────────── */}
      <aside className="flex w-64 flex-col border-r border-slate-800/60 bg-slate-900/50 flex-shrink-0">
        {/* Logo Branding: Zync powered by Lab-Y */}
        <div className="flex items-center gap-2.5 px-5 py-5 border-b border-slate-800/60">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-violet-500 via-purple-600 to-indigo-700 shadow-lg shadow-purple-950/50 text-white font-black text-lg">
            Z
          </div>
          <div>
            <div className="flex items-center gap-1">
              <span className="text-sm font-black text-slate-100 leading-none">Zync</span>
            </div>
            <p className="text-[10px] font-bold text-violet-400 leading-tight mt-0.5">powered by Lab-Y</p>
          </div>
        </div>

        {/* Navigation Sidebar */}
        <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
          <p className="px-2 py-1.5 text-[11px] font-bold text-slate-500 uppercase tracking-widest">
            Executive Modules
          </p>
          {NAV_ITEMS.map((item) => {
            const isActive =
              activeTab === item.id ||
              (activeTab === "resume" && item.id === "pipeline");

            return (
              <button
                key={item.id}
                id={`nav-${item.id}`}
                onClick={() => {
                  if (item.id === "pipeline") setActiveTab("resume");
                  else setActiveTab(item.id);
                }}
                className={`w-full flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all duration-200 text-left group
                  ${isActive
                    ? "bg-violet-500/15 text-violet-300 border border-violet-500/30 shadow-md shadow-violet-950/40"
                    : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/50"
                  }`}
              >
                <span className={`flex-shrink-0 transition-colors ${isActive ? "text-violet-400" : "text-slate-500 group-hover:text-slate-300"}`}>
                  {item.icon}
                </span>
                <span className="flex-1 truncate">{item.label}</span>
                {item.badge && (
                  <span className={`rounded-full border px-2 py-0.5 text-[10px] font-semibold leading-none ${
                    isActive
                      ? "bg-violet-500/20 border-violet-500/40 text-violet-300"
                      : "bg-slate-800 border-slate-700 text-slate-500"
                  }`}>
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </nav>

        {/* User Footer Profile */}
        <div className="border-t border-slate-800/60 p-3">
          <div className="flex items-center gap-2.5 rounded-xl px-2.5 py-2.5 bg-slate-800/30 hover:bg-slate-800/60 transition-colors cursor-pointer border border-slate-800">
            <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-violet-500 to-purple-600 text-xs font-bold text-white shadow">
              Z
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-xs font-semibold text-slate-200 truncate">Executive MD</p>
              <p className="text-[10px] text-violet-400 font-bold truncate">Zync powered by Lab-Y</p>
            </div>
          </div>
        </div>
      </aside>

      {/* ── Main Workspace Content ───────────────────────────────────────────── */}
      <div className="flex flex-1 flex-col min-w-0 overflow-hidden">
        {/* Top Header */}
        <header className="flex items-center justify-between px-8 py-4 border-b border-slate-800/60 bg-slate-900/40 backdrop-blur-md flex-shrink-0">
          <div>
            <h1 className="text-xl font-bold text-slate-100 flex items-center gap-2">
              {activeTab === "command_center"
                ? "Executive Command Center — Zync powered by Lab-Y"
                : "Resume Processor & Candidate Intelligence"}
            </h1>
            <p className="text-xs text-slate-500 mt-0.5">
              {activeTab === "command_center"
                ? "Voice-to-Action, Morning Pulse AI Briefing, Sentiment & Executive Milestone Progress"
                : "AI-powered resume parsing, candidate search & database management"}
            </p>
          </div>

          <div className="flex items-center gap-3">
            {/* Quick Tab Switcher */}
            <div className="flex items-center bg-slate-800/60 p-1 rounded-xl border border-slate-700/60">
              <button
                onClick={() => setActiveTab("command_center")}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                  activeTab === "command_center"
                    ? "bg-violet-500 text-white shadow-md"
                    : "text-slate-400 hover:text-slate-200"
                }`}
              >
                ⚡ Executive Command Center
              </button>
              <button
                onClick={() => setActiveTab("resume")}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                  activeTab === "resume"
                    ? "bg-violet-500 text-white shadow-md"
                    : "text-slate-400 hover:text-slate-200"
                }`}
              >
                📄 Resume Processor
              </button>
            </div>
          </div>
        </header>

        {/* Content Area */}
        <main className="flex-1 overflow-y-auto p-8">
          {activeTab === "command_center" ? (
            <CommandCenterView />
          ) : (
            <div className="space-y-6">
              {/* Stats Bar */}
              <div className="grid grid-cols-3 gap-4 mb-8">
                {stats.map((stat) => (
                  <div key={stat.label} className="rounded-xl border border-slate-700/60 bg-slate-800/30 px-5 py-4">
                    <p className="text-xs font-medium text-slate-500 mb-1">{stat.label}</p>
                    <p className="text-2xl font-bold text-slate-100 tabular-nums truncate">{stat.value}</p>
                    <p className={`text-xs mt-1 ${
                      stat.color === "violet" ? "text-violet-400" :
                      stat.color === "emerald" ? "text-emerald-400" : "text-cyan-400"
                    }`}>
                      {stat.delta}
                    </p>
                  </div>
                ))}
              </div>
              <IntelligenceEngine />
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
