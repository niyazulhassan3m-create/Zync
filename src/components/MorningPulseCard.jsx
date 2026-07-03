import React, { useState, useEffect, useCallback } from "react";

export default function MorningPulseCard() {
  const [pulseData, setPulseData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isCached, setIsCached] = useState(false);

  const getTodayString = () => new Date().toISOString().split("T")[0]; // Format: YYYY-MM-DD

  // Smart Session Logic: Session-Mount trigger & localStorage caching
  const loadMorningPulse = useCallback(async (forceRefresh = false) => {
    setLoading(true);
    const todayStr = getTodayString();
    const lastPulseDate = localStorage.getItem("lastPulseDate");
    const cachedData = localStorage.getItem("cachedPulseData");

    // Check if lastPulseDate equals today's date and cache exists
    if (!forceRefresh && lastPulseDate === todayStr && cachedData) {
      try {
        const parsed = JSON.parse(cachedData);
        setPulseData(parsed);
        setIsCached(true);
        setLoading(false);
        console.log(`[MorningPulse] Session-Mount: Loaded today's cached briefing for ${todayStr}`);
        return;
      } catch (e) {
        // Cache parse fallback
      }
    }

    // Otherwise, trigger Morning Pulse API call to Gemini AI
    try {
      const res = await fetch("/api/zync/morning-pulse");
      const data = await res.json();
      setPulseData(data);
      setIsCached(false);

      // Store in localStorage for today's session
      localStorage.setItem("lastPulseDate", todayStr);
      localStorage.setItem("cachedPulseData", JSON.stringify(data));
      console.log(`[MorningPulse] Session-Mount: Generated & cached new AI briefing for ${todayStr}`);
    } catch (err) {
      console.error("[MorningPulse] fetch error:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadMorningPulse(false); // Session-Start trigger on component mount
  }, [loadMorningPulse]);

  return (
    <div className="rounded-2xl border border-amber-500/40 bg-gradient-to-r from-slate-900/90 via-slate-900/95 to-amber-950/30 p-5 shadow-2xl space-y-4 relative overflow-hidden">
      {/* Ambient background glow */}
      <div className="absolute -top-12 -right-12 h-36 w-36 rounded-full bg-amber-500/10 blur-3xl pointer-events-none" />

      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-amber-500 to-orange-600 text-white font-bold text-xl shadow-md shadow-amber-950/60">
            ☀️
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-100 flex items-center gap-2">
              Morning Pulse — Executive Briefing
              <span className="rounded-full bg-amber-500/20 border border-amber-500/30 px-2.5 py-0.5 text-[10px] font-bold text-amber-300">
                Chief of Staff AI
              </span>
            </h3>
            <p className="text-xs text-slate-400">
              Session-Start Trigger · {isCached ? "⚡ Cached for Today" : "✨ Live AI Analysis"}
            </p>
          </div>
        </div>

        {/* Refresh Pulse Icon (Manual re-trigger option) */}
        <button
          onClick={() => loadMorningPulse(true)}
          disabled={loading}
          title="Manual Refresh Pulse (Re-analyze new tasks via Gemini AI)"
          className="flex items-center gap-1.5 rounded-lg border border-slate-700 bg-slate-800 px-3 py-1.5 text-xs font-semibold text-slate-300 hover:bg-slate-700 transition-colors shadow-sm"
        >
          <span className={loading ? "animate-spin" : ""}>🔄</span>
          <span>{loading ? "Analyzing…" : "Refresh Pulse"}</span>
        </button>
      </div>

      {/* 3 Bullet Executive Summary */}
      {loading ? (
        <div className="py-6 text-center text-xs text-slate-500 animate-pulse">
          Analyzing tasks & generating Session-Start Chief of Staff briefing from Gemini AI…
        </div>
      ) : (
        <div className="space-y-2.5 pt-1">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span className="font-bold text-amber-300 uppercase tracking-wider text-[10px]">
              Strategic Focus Theme: {pulseData?.focus_theme || "Executive Talent Acceleration"}
            </span>
            <span className="text-[10px] text-slate-500 font-mono">
              Zync powered by Lab-Y {isCached && "(Session Cached)"}
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {(pulseData?.bullets || [
              "Review 3 high-priority candidate interview deliverables scheduled for today.",
              "Follow up on 2 pending executive candidate pipeline approvals (>3 days pending).",
              "Market Intelligence indicates a +34% surge in demand for Lead Engineers."
            ]).map((bullet, idx) => (
              <div
                key={idx}
                className="rounded-xl border border-slate-700/60 bg-slate-800/60 p-3.5 space-y-1.5 hover:border-amber-500/30 transition-all shadow-sm"
              >
                <div className="flex items-center gap-2">
                  <span className="flex h-5 w-5 items-center justify-center rounded-full bg-amber-500/20 text-amber-300 text-[11px] font-bold">
                    {idx + 1}
                  </span>
                  <span className="text-xs font-bold text-slate-200">Executive Priority</span>
                </div>
                <p className="text-xs text-slate-300 leading-relaxed">{bullet}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
