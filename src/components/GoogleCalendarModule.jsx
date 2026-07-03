import React, { useState } from "react";

export default function GoogleCalendarModule({ events, onAddEvent }) {
  const [showAddModal, setShowAddModal] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [newCategory, setNewCategory] = useState("Interview");
  const [newTime, setNewTime] = useState("03:00 PM - 03:45 PM");

  const handleCreate = (e) => {
    e.preventDefault();
    if (!newTitle.trim()) return;
    onAddEvent({
      title: newTitle,
      category: newCategory,
      time: newTime,
      date: new Date().toISOString().split("T")[0],
    });
    setNewTitle("");
    setShowAddModal(false);
  };

  const CATEGORY_STYLES = {
    Interview: "bg-purple-500/15 border-purple-500/30 text-purple-300",
    Strategy: "bg-blue-500/15 border-blue-500/30 text-blue-300",
    Investor: "bg-amber-500/15 border-amber-500/30 text-amber-300",
    Team: "bg-emerald-500/15 border-emerald-500/30 text-emerald-300",
  };

  return (
    <div className="rounded-2xl border border-slate-700/60 bg-slate-800/40 p-6 flex flex-col h-full shadow-lg">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-slate-700/50 pb-4 mb-4">
        <div className="flex items-center gap-2.5">
          <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-sky-500/15 border border-sky-500/25">
            <svg className="h-4 w-4 text-sky-400" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M5.75 2a.75.75 0 0 1 .75.75V4h7V2.75a.75.75 0 0 1 1.5 0V4h.25A2.75 2.75 0 0 1 18 6.75v8.5A2.75 2.75 0 0 1 15.25 18H4.75A2.75 2.75 0 0 1 2 15.25v-8.5A2.75 2.75 0 0 1 4.75 4H5V2.75A.75.75 0 0 1 5.75 2Zm-1 5.5c-.69 0-1.25.56-1.25 1.25v6.5c0 .69.56 1.25 1.25 1.25h10.5c.69 0 1.25-.56 1.25-1.25v-6.5c0-.69-.56-1.25-1.25-1.25H4.75Z" clipRule="evenodd" />
            </svg>
          </span>
          <div>
            <h3 className="text-base font-semibold text-slate-100 flex items-center gap-2">
              Google Calendar
              <span className="rounded-full bg-sky-500/10 border border-sky-500/20 px-2 py-0.5 text-[10px] font-medium text-sky-400">
                Synced
              </span>
            </h3>
            <p className="text-xs text-slate-500">Upcoming meetings & interviews</p>
          </div>
        </div>

        <button
          onClick={() => setShowAddModal(true)}
          className="flex items-center gap-1 rounded-lg border border-sky-500/30 bg-sky-500/10 px-3 py-1.5 text-xs font-medium text-sky-300 hover:bg-sky-500/20 transition-all"
        >
          + Add Meeting
        </button>
      </div>

      {/* List of Events */}
      <div className="space-y-3 flex-1 overflow-y-auto pr-1">
        {events.map((evt) => {
          const badgeStyle = CATEGORY_STYLES[evt.category] || "bg-slate-700/40 border-slate-600/40 text-slate-300";
          const isToday = evt.date === new Date().toISOString().split("T")[0];

          return (
            <div
              key={evt.id}
              className={`rounded-xl border p-4 transition-all duration-200 ${
                evt.isNext
                  ? "border-sky-500/50 bg-sky-950/20 shadow-[0_0_15px_-3px_rgba(56,189,248,0.2)]"
                  : "border-slate-700/50 bg-slate-900/40 hover:border-slate-600"
              }`}
            >
              <div className="flex items-start justify-between gap-2 mb-2">
                <div className="flex items-center gap-2">
                  <span className={`inline-flex items-center rounded-md border px-2 py-0.5 text-[10px] font-semibold ${badgeStyle}`}>
                    {evt.category}
                  </span>
                  {isToday && (
                    <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-md border border-emerald-500/20">
                      <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
                      Today
                    </span>
                  )}
                </div>
                <span className="text-xs font-mono text-slate-400">{evt.time}</span>
              </div>

              <h4 className="text-sm font-bold text-slate-200 mb-1">{evt.title}</h4>
              <p className="text-xs text-slate-400 line-clamp-2 mb-3">{evt.description}</p>

              <div className="flex items-center justify-between border-t border-slate-800/80 pt-2.5 mt-2 text-xs">
                <span className="text-slate-500 text-[11px]">
                  👥 {evt.attendees.join(", ")}
                </span>
                {evt.meetingUrl && (
                  <a
                    href={evt.meetingUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center gap-1 text-sky-400 font-semibold hover:text-sky-300 transition-colors"
                  >
                    Join Meet →
                  </a>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Modal for adding mock event */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="w-full max-w-md rounded-2xl border border-slate-700 bg-slate-900 p-6 shadow-2xl space-y-4">
            <h3 className="text-lg font-bold text-slate-100">Add Google Calendar Event</h3>
            <form onSubmit={handleCreate} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1">Meeting Title</label>
                <input
                  type="text"
                  required
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  placeholder="e.g. Founder Call with Lead Candidate"
                  className="w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-sm text-slate-200 focus:outline-none focus:border-sky-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-400 mb-1">Category</label>
                  <select
                    value={newCategory}
                    onChange={(e) => setNewCategory(e.target.value)}
                    className="w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-sm text-slate-200 focus:outline-none focus:border-sky-500"
                  >
                    <option value="Interview">Interview</option>
                    <option value="Strategy">Strategy</option>
                    <option value="Investor">Investor</option>
                    <option value="Team">Team</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-400 mb-1">Time Slot</label>
                  <input
                    type="text"
                    value={newTime}
                    onChange={(e) => setNewTime(e.target.value)}
                    className="w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-sm text-slate-200 focus:outline-none focus:border-sky-500"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="rounded-lg px-4 py-2 text-xs text-slate-400 hover:text-slate-200"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="rounded-lg bg-sky-500 px-4 py-2 text-xs font-semibold text-slate-950 hover:bg-sky-400"
                >
                  Save Event
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
