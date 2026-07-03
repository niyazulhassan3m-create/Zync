import React, { useState, useEffect } from "react";

export default function IntelligentSchedulingBanner() {
  const [alerts, setAlerts] = useState([]);
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(false);
  const [reschedulingEvent, setReschedulingEvent] = useState(null);
  const [newTimeInput, setNewTimeInput] = useState("");

  const fetchAlertsAndEvents = async () => {
    try {
      const res = await fetch("/api/zync/scheduling-alerts");
      const data = await res.json();
      setAlerts(data.alerts || []);
      setEvents(data.events || []);
    } catch (err) {
      console.warn("[Scheduling Engine] Error fetching alerts:", err);
    }
  };

  useEffect(() => {
    fetchAlertsAndEvents();
    const interval = setInterval(fetchAlertsAndEvents, 5000);
    return () => clearInterval(interval);
  }, []);

  const triggerWatchdog = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/zync/run-watchdog", { method: "POST" });
      const data = await res.json();
      setAlerts(data.alerts || []);
    } catch (e) {
      console.warn(e);
    } finally {
      setLoading(false);
    }
  };

  const handleJoinStart = async (eventId, title) => {
    try {
      const res = await fetch("/api/zync/confirm-meeting-start", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ event_id: eventId }),
      });
      const data = await res.json();
      if (data.success) {
        alert(`⚡ Joined & Started "${title}"!\nActual start time logged: ${new Date(data.actual_start_time).toLocaleTimeString()}`);
        fetchAlertsAndEvents();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleReschedule = async (eventId) => {
    if (!newTimeInput) return;
    try {
      const res = await fetch("/api/zync/reschedule-meeting", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ event_id: eventId, new_datetime: newTimeInput }),
      });
      const data = await res.json();
      if (data.success) {
        alert(`📅 Meeting rescheduled to ${new Date(data.new_datetime).toLocaleString()}`);
        setReschedulingEvent(null);
        setNewTimeInput("");
        fetchAlertsAndEvents();
      }
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="space-y-4">
      {/* Active Alerts Banner */}
      {alerts.length > 0 && (
        <div className="space-y-3">
          {alerts.map((alert) => {
            const isDeparture = alert.alert_type === "departure_alert";
            const is30m = alert.alert_type === "preparation_alert";

            return (
              <div
                key={alert.id}
                className={`rounded-2xl border p-4 shadow-2xl transition-all duration-300 relative overflow-hidden ${
                  isDeparture
                    ? "border-emerald-500/50 bg-gradient-to-r from-emerald-950/90 via-slate-900 to-emerald-950/90"
                    : is30m
                    ? "border-amber-500/50 bg-gradient-to-r from-amber-950/90 via-slate-900 to-amber-950/90"
                    : "border-cyan-500/50 bg-gradient-to-r from-cyan-950/90 via-slate-900 to-cyan-950/90"
                }`}
              >
                {/* Glow ring */}
                <div className="absolute top-0 right-0 -mr-6 -mt-6 h-24 w-24 rounded-full bg-current opacity-10 blur-xl pointer-events-none" />

                <div className="relative flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <div
                      className={`flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-2xl text-xl shadow-lg border ${
                        isDeparture
                          ? "bg-emerald-500/20 border-emerald-500/40 text-emerald-300 animate-pulse"
                          : is30m
                          ? "bg-amber-500/20 border-amber-500/40 text-amber-300 animate-pulse"
                          : "bg-cyan-500/20 border-cyan-500/40 text-cyan-300"
                      }`}
                    >
                      {isDeparture ? "🚨" : is30m ? "⏰" : "📌"}
                    </div>

                    <div>
                      <div className="flex items-center gap-2">
                        <span
                          className={`rounded-full px-2.5 py-0.5 text-[10px] font-black uppercase tracking-widest border ${
                            isDeparture
                              ? "bg-emerald-500/20 border-emerald-500/40 text-emerald-300"
                              : is30m
                              ? "bg-amber-500/20 border-amber-500/40 text-amber-300"
                              : "bg-cyan-500/20 border-cyan-500/40 text-cyan-300"
                          }`}
                        >
                          {isDeparture ? "10-Min Departure Alert" : is30m ? "30-Min Preparation Alert" : "Task Deadline"}
                        </span>
                        <span className="text-[11px] text-slate-400 font-mono">
                          Via {alert.delivered_via}
                        </span>
                      </div>
                      <p className="text-sm font-semibold text-white mt-1">
                        {alert.message}
                      </p>
                    </div>
                  </div>

                  {/* Confirmation Loop Buttons */}
                  <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap">
                    {isDeparture && (
                      <>
                        <button
                          onClick={() => handleJoinStart(alert.event_id, alert.title)}
                          className="flex items-center gap-1.5 rounded-xl border border-emerald-500/60 bg-emerald-500/20 px-4 py-2 text-xs font-black text-emerald-200 hover:bg-emerald-500/40 transition-all shadow-lg hover:scale-105"
                        >
                          <span>⚡</span> Join/Start
                        </button>
                        <button
                          onClick={() => setReschedulingEvent(alert.event_id)}
                          className="flex items-center gap-1.5 rounded-xl border border-slate-600 bg-slate-800 px-3.5 py-2 text-xs font-bold text-slate-300 hover:bg-slate-700 transition-all"
                        >
                          <span>📅</span> Reschedule
                        </button>
                      </>
                    )}

                    {is30m && (
                      <>
                        <button
                          onClick={() => alert(`📑 Pulling executive summary & latest briefing report for "${alert.title}"...`)}
                          className="flex items-center gap-1.5 rounded-xl border border-amber-500/60 bg-amber-500/20 px-4 py-2 text-xs font-black text-amber-200 hover:bg-amber-500/40 transition-all shadow-lg"
                        >
                          <span>📑</span> Pull Latest Report
                        </button>
                        <button
                          onClick={() => setReschedulingEvent(alert.event_id)}
                          className="flex items-center gap-1.5 rounded-xl border border-slate-600 bg-slate-800 px-3.5 py-2 text-xs font-bold text-slate-300 hover:bg-slate-700 transition-all"
                        >
                          <span>📅</span> Reschedule
                        </button>
                      </>
                    )}
                  </div>
                </div>

                {/* Inline Reschedule Selector */}
                {reschedulingEvent === alert.event_id && (
                  <div className="mt-3 pt-3 border-t border-slate-700/60 flex items-center gap-3">
                    <span className="text-xs font-bold text-slate-300">Set New Time:</span>
                    <input
                      type="datetime-local"
                      value={newTimeInput}
                      onChange={(e) => setNewTimeInput(e.target.value)}
                      className="rounded-lg border border-slate-700 bg-slate-900 px-3 py-1 text-xs text-white focus:outline-none"
                    />
                    <button
                      onClick={() => handleReschedule(alert.event_id)}
                      className="rounded-lg bg-violet-600 px-3 py-1 text-xs font-bold text-white hover:bg-violet-500"
                    >
                      Confirm Reschedule
                    </button>
                    <button
                      onClick={() => setReschedulingEvent(null)}
                      className="text-xs text-slate-400 hover:text-white"
                    >
                      Cancel
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Manual Watchdog Trigger Toolbar */}
      <div className="flex items-center justify-between rounded-xl border border-slate-800 bg-slate-900/60 px-4 py-2.5 text-xs">
        <div className="flex items-center gap-2">
          <span className="flex h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
          <span className="font-bold text-slate-300">Intelligent Scheduling Engine (5-Min Watchdog)</span>
          <span className="text-slate-500">· {events.length} Scheduled Events</span>
        </div>

        <button
          onClick={triggerWatchdog}
          disabled={loading}
          className="flex items-center gap-1.5 rounded-lg border border-violet-500/40 bg-violet-500/10 px-3 py-1 text-xs font-bold text-violet-300 hover:bg-violet-500/20 transition-all"
        >
          <span>⏰</span> {loading ? "Checking..." : "Run Watchdog Now"}
        </button>
      </div>
    </div>
  );
}
