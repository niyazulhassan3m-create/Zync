import { useState, useEffect, useCallback } from "react";

const STORAGE_KEY = "founders_command_center_tasks_v1";

// Default initial tasks if none exist
const DEFAULT_TASKS = [
  {
    id: "task-1",
    title: "Follow up on technical interview feedback",
    description: "Send coding assessment review and schedule final founder call",
    status: "Pending",
    createdAt: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000).toISOString(), // 4 days ago (Overdue Nudge!)
    dueDate: new Date(Date.now() + 1 * 24 * 60 * 60 * 1000).toISOString(),
    linkedCandidateId: null,
    priority: "High",
  },
  {
    id: "task-2",
    title: "Review Senior Developer candidate resume",
    description: "Check past experience with React and Node.js backend pipelines",
    status: "Pending",
    createdAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(), // 1 day ago
    dueDate: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString(),
    linkedCandidateId: null,
    priority: "Medium",
  },
  {
    id: "task-3",
    title: "Send offer letter template to HR",
    description: "Confirm salary package details and start date",
    status: "Done",
    createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
    dueDate: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
    linkedCandidateId: null,
    priority: "Normal",
  },
];

function loadTasks() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULT_TASKS;
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) && parsed.length > 0 ? parsed : DEFAULT_TASKS;
  } catch {
    return DEFAULT_TASKS;
  }
}

function saveTasks(tasks) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(tasks));
  } catch (err) {
    console.error("[useTasks] LocalStorage save error:", err);
  }
}

export function useTasks() {
  const [tasks, setTasks] = useState(loadTasks);

  useEffect(() => {
    saveTasks(tasks);
  }, [tasks]);

  // Add task
  const addTask = useCallback(({ title, description, linkedCandidateId, priority, dueDate, simulateOverdue }) => {
    // If simulateOverdue is requested for testing, set createdAt to 4 days ago
    const createdAtTime = simulateOverdue 
      ? Date.now() - (4 * 24 * 60 * 60 * 1000) 
      : Date.now();

    const newTask = {
      id: `task-${Date.now()}`,
      title: title.trim(),
      description: (description || "").trim(),
      status: "Pending",
      createdAt: new Date(createdAtTime).toISOString(),
      dueDate: dueDate || new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString(),
      linkedCandidateId: linkedCandidateId || null,
      priority: priority || "Normal",
    };

    setTasks((prev) => [newTask, ...prev]);
    return newTask;
  }, []);

  // Toggle task status (Pending <-> Done)
  const toggleTaskStatus = useCallback((id) => {
    setTasks((prev) =>
      prev.map((t) =>
        t.id === id
          ? { ...t, status: t.status === "Pending" ? "Done" : "Pending" }
          : t
      )
    );
  }, []);

  // Edit task
  const updateTask = useCallback((id, updates) => {
    setTasks((prev) =>
      prev.map((t) => (t.id === id ? { ...t, ...updates } : t))
    );
  }, []);

  // Delete task
  const deleteTask = useCallback((id) => {
    setTasks((prev) => prev.filter((t) => t.id !== id));
  }, []);

  // Helper: check if task is pending for >= 3 days (72 hours)
  const isOverdueNudge = useCallback((task) => {
    if (task.status !== "Pending") return false;
    const ageInMs = Date.now() - new Date(task.createdAt).getTime();
    const THREE_DAYS_MS = 3 * 24 * 60 * 60 * 1000;
    return ageInMs >= THREE_DAYS_MS;
  }, []);

  // Helper stats
  const pendingTasks = tasks.filter((t) => t.status === "Pending");
  const nudgeTasks = pendingTasks.filter(isOverdueNudge);
  const completedTasks = tasks.filter((t) => t.status === "Done");

  return {
    tasks,
    pendingTasks,
    nudgeTasks,
    completedTasks,
    addTask,
    toggleTaskStatus,
    updateTask,
    deleteTask,
    isOverdueNudge,
  };
}
