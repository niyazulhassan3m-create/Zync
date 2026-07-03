import React, { useState } from "react";
import { useCandidates } from "../store/useCandidates";

export default function TaskQueueBoard({
  tasks,
  onAddTask,
  onToggleTaskStatus,
  onUpdateTask,
  onDeleteTask,
  isOverdueNudge,
}) {
  const { candidates } = useCandidates();

  const [activeFilter, setActiveFilter] = useState("All"); // "All" | "Pending" | "Nudges" | "Done"
  const [showAddModal, setShowAddModal] = useState(false);

  // New task form state
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [linkedCandidateId, setLinkedCandidateId] = useState("");
  const [priority, setPriority] = useState("Normal");
  const [simulateOverdue, setSimulateOverdue] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!title.trim()) return;

    onAddTask({
      title,
      description,
      linkedCandidateId: linkedCandidateId || null,
      priority,
      simulateOverdue,
    });

    // Reset form
    setTitle("");
    setDescription("");
    setLinkedCandidateId("");
    setPriority("Normal");
    setSimulateOverdue(false);
    setShowAddModal(false);
  };

  // Filter tasks based on selected tab
  const filteredTasks = tasks.filter((t) => {
    if (activeFilter === "Pending") return t.status === "Pending";
    if (activeFilter === "Nudges") return isOverdueNudge(t);
    if (activeFilter === "Done") return t.status === "Done";
    return true; // "All"
  });

  const nudgeCount = tasks.filter(isOverdueNudge).length;

  return (
    <div className="rounded-2xl border border-slate-700/60 bg-slate-800/40 p-6 flex flex-col h-full shadow-lg">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-700/50 pb-4 mb-4">
        <div className="flex items-center gap-2.5">
          <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-violet-500/15 border border-violet-500/25">
            <svg className="h-4 w-4 text-violet-400" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M10 18a8 8 0 1 0 0-16 8 8 0 0 0 0 16Zm3.857-9.809a.75.75 0 0 0-1.214-.882l-3.483 4.79-1.88-1.88a.75.75 0 1 0-1.06 1.061l2.5 2.5a.75.75 0 0 0 1.137-.089l4-5.5Z" clipRule="evenodd" />
            </svg>
          </span>
          <div>
            <h3 className="text-base font-semibold text-slate-100 flex items-center gap-2">
              Task Queue & Follow-ups
              <span className="rounded-full bg-violet-500/10 border border-violet-500/20 px-2 py-0.5 text-[10px] font-medium text-violet-400">
                To-Do Board
              </span>
            </h3>
            <p className="text-xs text-slate-500">Attach tasks to parsed candidates & track nudges</p>
          </div>
        </div>

        <button
          onClick={() => setShowAddModal(true)}
          className="flex items-center gap-1.5 rounded-xl border border-violet-500/40 bg-violet-500/15 px-3.5 py-1.5 text-xs font-semibold text-violet-200 hover:bg-violet-500/25 hover:border-violet-400/60 transition-all shadow-md shadow-violet-900/20"
        >
          + Add New Task
        </button>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-1.5 border-b border-slate-700/40 pb-3 mb-4 overflow-x-auto">
        {[
          { id: "All", label: `All (${tasks.length})` },
          { id: "Pending", label: `Pending (${tasks.filter((t) => t.status === "Pending").length})` },
          { id: "Nudges", label: `🚨 Follow-up Nudges (${nudgeCount})`, alert: nudgeCount > 0 },
          { id: "Done", label: `Done (${tasks.filter((t) => t.status === "Done").length})` },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveFilter(tab.id)}
            className={`rounded-lg px-3 py-1.5 text-xs font-medium transition-all ${
              activeFilter === tab.id
                ? tab.alert
                  ? "bg-red-500/20 border border-red-500/40 text-red-300 font-bold"
                  : "bg-slate-700/80 text-slate-100 border border-slate-600/60"
                : tab.alert
                ? "text-red-400 hover:bg-red-500/10"
                : "text-slate-500 hover:text-slate-300 hover:bg-slate-800/60"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Task List */}
      <div className="space-y-3 flex-1 overflow-y-auto pr-1">
        {filteredTasks.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <span className="text-3xl mb-2">🎉</span>
            <p className="text-sm font-semibold text-slate-300">No tasks found</p>
            <p className="text-xs text-slate-600 mt-1">
              {activeFilter === "Nudges"
                ? "Great job! No pending tasks older than 3 days."
                : "Add a new task above to get started."}
            </p>
          </div>
        ) : (
          filteredTasks.map((task) => {
            const isNudge = isOverdueNudge(task);
            const isDone = task.status === "Done";
            const linkedCandidate = candidates.find((c) => c.id === task.linkedCandidateId);

            // Calculate age in days
            const ageDays = Math.floor(
              (Date.now() - new Date(task.createdAt).getTime()) / (1000 * 60 * 60 * 24)
            );

            return (
              <div
                key={task.id}
                className={`group rounded-xl border p-4 transition-all duration-200 ${
                  isNudge
                    ? "border-red-500/50 bg-red-950/25 shadow-[0_0_20px_-4px_rgba(239,68,68,0.3)]"
                    : isDone
                    ? "border-slate-800 bg-slate-900/30 opacity-60"
                    : "border-slate-700/50 bg-slate-900/50 hover:border-slate-600"
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  {/* Status Checkbox */}
                  <button
                    onClick={() => onToggleTaskStatus(task.id)}
                    className={`flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-md border mt-0.5 transition-all ${
                      isDone
                        ? "border-emerald-500 bg-emerald-500/20 text-emerald-400"
                        : "border-slate-600 hover:border-slate-400 bg-slate-800/60"
                    }`}
                  >
                    {isDone && (
                      <svg className="h-3.5 w-3.5" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M16.704 4.153a.75.75 0 0 1 .143 1.052l-8 10.5a.75.75 0 0 1-1.127.075l-4.5-4.5a.75.75 0 0 1 1.06-1.06l3.894 3.893 7.48-9.817a.75.75 0 0 1 1.05-.143Z" clipRule="evenodd" />
                      </svg>
                    )}
                  </button>

                  {/* Title & Details */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap mb-1">
                      <h4 className={`text-sm font-semibold ${isDone ? "line-through text-slate-500" : "text-slate-200"}`}>
                        {task.title}
                      </h4>

                      {/* 3+ Days Nudge Alert Badge */}
                      {isNudge && (
                        <span className="inline-flex items-center gap-1 rounded-md border border-red-500/40 bg-red-500/20 px-2 py-0.5 text-[10px] font-bold text-red-300 animate-pulse">
                          🚨 Pending {ageDays} days (Follow-up Nudge!)
                        </span>
                      )}

                      {/* Priority badge */}
                      {task.priority === "High" && (
                        <span className="rounded bg-rose-500/20 border border-rose-500/30 px-1.5 py-0.5 text-[10px] font-bold text-rose-300">
                          High Priority
                        </span>
                      )}
                    </div>

                    {task.description && (
                      <p className="text-xs text-slate-400 mb-2">{task.description}</p>
                    )}

                    {/* Linked Candidate Badge */}
                    {linkedCandidate ? (
                      <div className="mt-2 inline-flex items-center gap-2 rounded-lg border border-violet-500/30 bg-violet-500/10 px-2.5 py-1 text-xs text-violet-300">
                        <span className="flex h-4 w-4 items-center justify-center rounded-full bg-violet-500/30 text-[10px] font-bold">
                          👤
                        </span>
                        <span className="font-semibold">{linkedCandidate.fullName}</span>
                        <span className="text-[11px] opacity-75">({linkedCandidate.roleCategory})</span>
                        {linkedCandidate.email && linkedCandidate.email !== "Not found" && (
                          <a
                            href={`mailto:${linkedCandidate.email}`}
                            className="text-violet-400 hover:underline text-[10px] ml-1"
                          >
                            ✉️ {linkedCandidate.email}
                          </a>
                        )}
                      </div>
                    ) : (
                      <span className="text-[11px] text-slate-600 italic">No candidate linked</span>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      onClick={() => onDeleteTask(task.id)}
                      className="p-1.5 rounded-lg text-slate-500 hover:text-red-400 hover:bg-red-500/10 transition-colors"
                      title="Delete Task"
                    >
                      <svg className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M8.75 1A2.75 2.75 0 0 0 6 3.75v.443c-.795.077-1.584.176-2.365.298a.75.75 0 1 0 .23 1.482l.149-.022.841 10.518A2.75 2.75 0 0 0 7.596 19h4.807a2.75 2.75 0 0 0 2.742-2.53l.841-10.52.149.023a.75.75 0 0 0 .23-1.482A41.03 41.03 0 0 0 14 4.193V3.75A2.75 2.75 0 0 0 11.25 1h-2.5ZM10 4c.84 0 1.673.025 2.5.075V3.75c0-.69-.56-1.25-1.25-1.25h-2.5c-.69 0-1.25.56-1.25 1.25v.325C8.327 4.025 9.16 4 10 4ZM8.58 7.72a.75.75 0 0 0-1.5.06l.3 7.5a.75.75 0 1 0 1.5-.06l-.3-7.5Zm4.34.06a.75.75 0 1 0-1.5-.06l-.3 7.5a.75.75 0 1 0 1.5.06l.3-7.5Z" clipRule="evenodd" />
                      </svg>
                    </button>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Modal for adding new task */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="w-full max-w-lg rounded-2xl border border-slate-700 bg-slate-900 p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-bold text-slate-100 flex items-center gap-2">
                Create Task
                <span className="rounded bg-violet-500/20 px-2 py-0.5 text-xs text-violet-300">To-Do Queue</span>
              </h3>
              <button
                onClick={() => setShowAddModal(false)}
                className="text-slate-500 hover:text-slate-300"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Task Title *</label>
                <input
                  type="text"
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. Call candidate regarding salary expectation"
                  className="w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-sm text-slate-200 focus:outline-none focus:border-violet-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Description / Notes</label>
                <textarea
                  rows={2}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Additional context or follow-up steps…"
                  className="w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-sm text-slate-200 focus:outline-none focus:border-violet-500"
                />
              </div>

              {/* Link to Contact / Resume Dropdown */}
              <div>
                <label className="block text-xs font-semibold text-violet-300 mb-1 flex items-center gap-1">
                  <span>🔗 Attach Link to Candidate / Resume</span>
                  <span className="text-[10px] text-slate-500 font-normal">(Parsed Candidates)</span>
                </label>
                <select
                  value={linkedCandidateId}
                  onChange={(e) => setLinkedCandidateId(e.target.value)}
                  className="w-full rounded-lg border border-violet-500/40 bg-slate-800 px-3 py-2 text-sm text-slate-200 focus:outline-none focus:border-violet-400"
                >
                  <option value="">-- No Candidate Attached --</option>
                  {candidates.map((c) => (
                    <option key={c.id} value={c.id}>
                      👤 {c.fullName} ({c.roleCategory} - {c.seniorityLevel}) {c.email !== "Not found" ? `| ${c.email}` : ""}
                    </option>
                  ))}
                </select>
                {candidates.length === 0 && (
                  <p className="text-[11px] text-amber-400 mt-1">
                    💡 Tip: Upload & save resumes in the "Resume Processor" tab to link candidates here.
                  </p>
                )}
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Priority</label>
                  <select
                    value={priority}
                    onChange={(e) => setPriority(e.target.value)}
                    className="w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-sm text-slate-200 focus:outline-none focus:border-violet-500"
                  >
                    <option value="Normal">Normal</option>
                    <option value="Medium">Medium</option>
                    <option value="High">High Priority</option>
                  </select>
                </div>

                {/* Overdue Test Checkbox */}
                <div className="flex items-center pt-5">
                  <label className="flex items-center gap-2 text-xs text-red-300 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={simulateOverdue}
                      onChange={(e) => setSimulateOverdue(e.target.checked)}
                      className="rounded border-slate-700 bg-slate-800 text-red-500 focus:ring-0"
                    />
                    <span>🚨 Test Overdue Nudge (Set 4 days old)</span>
                  </label>
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="rounded-lg px-4 py-2 text-xs text-slate-400 hover:text-slate-200"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="rounded-lg bg-violet-500 px-5 py-2 text-xs font-semibold text-white hover:bg-violet-400 transition-colors shadow-lg shadow-violet-900/40"
                >
                  Create Task
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
