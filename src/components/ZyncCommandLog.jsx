import React, { useState, useEffect } from "react";

const INTENT_BADGES = {
  status_briefing: { label: "Status Briefing", color: "text-cyan-300 bg-cyan-500/15 border-cyan-500/30" },
  meeting_scheduled: { label: "Meeting Scheduled", color: "text-emerald-300 bg-emerald-500/15 border-emerald-500/30" },
  task_created: { label: "Task Created", color: "text-violet-300 bg-violet-500/15 border-violet-500/30" },
  acknowledged: { label: "Acknowledged", color: "text-slate-300 bg-slate-700/40 border-slate-600/30" },
  error: { label: "Error", color: "text-red-300 bg-red-500/15 border-red-500/30" },
};

const INTENT_ICONS = {
  status: "📊",
  schedule_meeting: "📅",
  create_task: "✅",
  general: "💬",
  error: "⚠️",
};

export default function ZyncCommandLog({ logs: externalLogs }) {
  const [logs, setLogs] = useState(externalLogs || []);
  const [isExpanded, setIsExpanded] = useState(true);
  const [isLoading, setIsLoading] = useState(false);

  // Sync external logs when they change
  useEffect(() => {
    if (externalLogs && externalLogs.length > 0) {
      setLogs(externalLogs);
    }
  }, [externalLogs]);

  // Fetch logs from server on mount
  useEffect(() => {
    fetchLogs();
  }, []);

  const fetchLogs = async () => {
    setIsLoading(true);
    try {
      const res = await fetch("/api/zync/jarvis/command-log");
      const data = await res.json();
      if (data.logs && data.logs.length > 0) {
        setLogs((prev) => {
          // Merge server logs with local logs (deduplicate by id)
          const merged = [...prev];
          data.logs.forEach((serverLog) => {
            if (!merged.find((l) => l.id === serverLog.id)) {
              merged.push(serverLog);
            }
          });
          return merged.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
        });
      }
    } catch (err) {
      console.warn("[ZyncCommandLog] Failed to fetch logs:", err);
    } finally {
      setIsLoading(false);
    }
  };

  const formatTime = (timestamp) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit" });
  };

  const formatDate = (timestamp) => {
    const date = new Date(timestamp);
    return date.toLocaleDateString(undefined, { month: "short", day: "numeric" });
  };

  return (
    <div className="rounded-2xl border border-slate-700/60 bg-slate-800/30 overflow-hidden">
      {/* Header */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full flex items-center justify-between px-5 py-3.5 bg-slate-800/60 border-b border-slate-700/40 hover:bg-slate-800/80 transition-colors"
      >
        <div className="flex items-center gap-2.5">
          <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-violet-500/15 border border-violet-500/25 text-sm">
            📜
          </span>
          <span className="text-sm font-bold text-slate-200">Zync-Intelligence Command Log</span>
          <span className="rounded-full bg-slate-700/60 border border-slate-600/40 px-2 py-0.5 text-[10px] font-semibold text-slate-400">
            {logs.length} commands
          </span>
        </div>

        <div className="flex items-center gap-2">
          {isLoading && (
            <span className="text-[10px] text-slate-500 animate-pulse">Loading…</span>
          )}
          <svg
            className={`h-4 w-4 text-slate-500 transition-transform duration-300 ${isExpanded ? "rotate-180" : ""}`}
            viewBox="0 0 20 20"
            fill="currentColor"
          >
            <path fillRule="evenodd" d="M5.22 8.22a.75.75 0 0 1 1.06 0L10 11.94l3.72-3.72a.75.75 0 1 1 1.06 1.06l-4.25 4.25a.75.75 0 0 1-1.06 0L5.22 9.28a.75.75 0 0 1 0-1.06Z" clipRule="evenodd" />
          </svg>
        </div>
      </button>

      {/* Log Entries */}
      {isExpanded && (
        <div className="max-h-[400px] overflow-y-auto">
          {logs.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-800/60 border border-slate-700/60 text-xl">
                🤖
              </div>
              <p className="text-sm text-slate-400 font-medium">No commands yet</p>
              <p className="text-xs text-slate-600">Click the Zync-Intelligence orb to start interacting</p>
            </div>
          ) : (
            <div className="divide-y divide-slate-700/30">
              {logs.map((log, idx) => {
                const badge = INTENT_BADGES[log.action_taken] || INTENT_BADGES.acknowledged;
                const icon = INTENT_ICONS[log.intent] || "💬";

                return (
                  <div
                    key={log.id || idx}
                    className={`px-5 py-3.5 hover:bg-white/[0.015] transition-colors ${idx === 0 ? "bg-violet-500/[0.03]" : ""}`}
                  >
                    <div className="flex items-start gap-3">
                      {/* Intent icon */}
                      <span className="flex-shrink-0 flex h-8 w-8 items-center justify-center rounded-lg bg-slate-800/80 border border-slate-700/60 text-sm mt-0.5">
                        {icon}
                      </span>

                      <div className="flex-1 min-w-0 space-y-1.5">
                        {/* User command */}
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">You said:</span>
                          <span className={`rounded-full border px-2 py-0.5 text-[10px] font-bold ${badge.color}`}>
                            {badge.label}
                          </span>
                        </div>
                        <p className="text-sm text-slate-200 italic leading-snug">"{log.user_command}"</p>

                        {/* Zync response */}
                        <div>
                          <span className="text-[10px] font-bold text-emerald-500 uppercase tracking-wider">Zync confirmed:</span>
                          <p className="text-xs text-slate-300 leading-relaxed mt-0.5">"{log.zync_response}"</p>
                        </div>

                        {/* Entity + timestamp */}
                        <div className="flex items-center gap-3 text-[10px] text-slate-600">
                          {log.entity && (
                            <span className="flex items-center gap-1">
                              <span className="text-violet-400">◆</span>
                              {log.entity}
                            </span>
                          )}
                          <span>{formatDate(log.timestamp)} · {formatTime(log.timestamp)}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
