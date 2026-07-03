import React from "react";

export default function TodaysSummaryCard({ pendingCount, nudgeCount, nextMeeting, totalCandidates }) {
  return (
    <div className="rounded-2xl border border-slate-700/60 bg-gradient-to-r from-slate-900/90 via-slate-800/80 to-slate-900/90 p-6 shadow-xl backdrop-blur-md relative overflow-hidden">
      {/* Background glow accent */}
      <div className="absolute -top-24 -right-24 h-64 w-64 rounded-full bg-violet-600/10 blur-3xl pointer-events-none" />
      <div className="absolute -bottom-24 -left-24 h-64 w-64 rounded-full bg-emerald-600/10 blur-3xl pointer-events-none" />

      {/* Header title */}
      <div className="flex items-center justify-between border-b border-slate-700/50 pb-4 mb-5">
        <div className="flex items-center gap-2.5">
          <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-violet-500/20 border border-violet-500/30 text-violet-300 text-lg shadow-inner">
            ⚡
          </span>
          <div>
            <h2 className="text-lg font-bold text-slate-100 flex items-center gap-2">
              Today's Overview
              <span className="rounded-full bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-0.5 text-xs font-medium text-emerald-400">
                Live Status
              </span>
            </h2>
            <p className="text-xs text-slate-500">
              {new Date().toLocaleDateString("en-US", { weekday: "long", month: "short", day: "numeric", year: "numeric" })}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-slate-800/80 border border-slate-700/60 px-3 py-1 text-xs font-medium text-slate-400">
            <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
            Command Center Active
          </span>
        </div>
      </div>

      {/* Grid of Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Stat 1: Pending Tasks */}
        <div className="flex items-center gap-4 rounded-xl border border-slate-700/50 bg-slate-800/40 p-4 hover:border-slate-600 transition-colors">
          <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-xl bg-violet-500/15 border border-violet-500/25 text-violet-300 text-xl">
            📋
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Pending Tasks</p>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-extrabold text-slate-100 tabular-nums">{pendingCount}</span>
              <span className="text-xs text-slate-500">to-do items</span>
            </div>
          </div>
        </div>

        {/* Stat 2: Follow-up Nudges (Red Alert if > 0) */}
        <div className={`flex items-center gap-4 rounded-xl border p-4 transition-all duration-300 ${
          nudgeCount > 0
            ? "border-red-500/40 bg-red-950/20 shadow-[0_0_20px_-4px_rgba(239,68,68,0.25)]"
            : "border-slate-700/50 bg-slate-800/40"
        }`}>
          <div className={`flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-xl text-xl ${
            nudgeCount > 0
              ? "bg-red-500/20 border border-red-500/30 text-red-400 animate-pulse"
              : "bg-slate-700/40 border border-slate-600/30 text-slate-400"
          }`}>
            🚨
          </div>
          <div className="min-w-0 flex-1">
            <p className={`text-xs font-semibold uppercase tracking-wider ${nudgeCount > 0 ? "text-red-400" : "text-slate-400"}`}>
              Follow-up Nudges
            </p>
            <div className="flex items-baseline gap-2">
              <span className={`text-2xl font-extrabold tabular-nums ${nudgeCount > 0 ? "text-red-300" : "text-slate-100"}`}>
                {nudgeCount}
              </span>
              <span className="text-xs text-slate-500">
                {nudgeCount > 0 ? "Pending >3 days!" : "No overdue items"}
              </span>
            </div>
          </div>
        </div>

        {/* Stat 3: Next Upcoming Meeting */}
        <div className="flex items-center gap-4 rounded-xl border border-sky-500/30 bg-sky-500/10 p-4 hover:border-sky-500/50 transition-colors">
          <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-xl bg-sky-500/20 border border-sky-500/30 text-sky-300 text-xl">
            📅
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-center justify-between">
              <p className="text-xs font-semibold text-sky-400 uppercase tracking-wider">Next Meeting</p>
              <span className="rounded bg-sky-500/20 px-1.5 py-0.5 text-[10px] font-bold text-sky-300">
                {nextMeeting ? nextMeeting.time.split("-")[0].trim() : "None"}
              </span>
            </div>
            {nextMeeting ? (
              <div>
                <p className="text-sm font-bold text-slate-100 truncate mt-0.5" title={nextMeeting.title}>
                  {nextMeeting.title}
                </p>
                <a
                  href={nextMeeting.meetingUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1 text-xs text-sky-400 hover:text-sky-300 underline underline-offset-2 mt-0.5"
                >
                  Join Google Meet →
                </a>
              </div>
            ) : (
              <p className="text-xs text-slate-500 mt-1">No meetings scheduled today</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
