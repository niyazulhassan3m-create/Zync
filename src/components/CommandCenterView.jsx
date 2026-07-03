import React, { useState, useCallback } from "react";
import PerformanceRing from "./PerformanceRing";
import MorningPulseCard from "./MorningPulseCard";
import ExecutiveVoiceRecorder from "./ExecutiveVoiceRecorder";
import TodaysSummaryCard from "./TodaysSummaryCard";
import TaskQueueBoard from "./TaskQueueBoard";
import GoogleCalendarModule from "./GoogleCalendarModule";
import ZyncJarvisOrb from "./ZyncJarvisOrb";
import ZyncCommandLog from "./ZyncCommandLog";

import { useTasks } from "../store/useTasks";
import { useCalendarEvents } from "../store/useCalendarEvents";
import { useCandidates } from "../store/useCandidates";

export default function CommandCenterView() {
  const {
    tasks,
    pendingTasks,
    nudgeTasks,
    addTask,
    toggleTaskStatus,
    updateTask,
    deleteTask,
    isOverdueNudge,
  } = useTasks();

  const { events, nextMeeting, addEvent } = useCalendarEvents();
  const { candidates } = useCandidates();

  // JARVIS command log state (local, synced with server)
  const [jarvisLogs, setJarvisLogs] = useState([]);

  const completedCount = tasks.filter((t) => t.status === "done").length;
  const totalCount = tasks.length || 1;
  const completionPercentage = Math.round((completedCount / totalCount) * 100);

  const handleVoiceTaskCreated = (newTask) => {
    addTask({
      title: newTask.title,
      contactId: "",
      deadline: newTask.deadline,
      priority: newTask.priority,
    });
  };

  // JARVIS callbacks
  const handleJarvisTaskCreated = useCallback((taskData) => {
    addTask({
      title: taskData.title,
      contactId: "",
      deadline: taskData.deadline,
      priority: taskData.priority,
    });
  }, [addTask]);

  const handleJarvisMeetingCreated = useCallback((meetingData) => {
    addEvent({
      title: meetingData.title,
      date: meetingData.date,
      time: meetingData.time,
      type: "meeting",
    });
  }, [addEvent]);

  const handleJarvisCommandLogged = useCallback((logEntry) => {
    setJarvisLogs((prev) => [logEntry, ...prev].slice(0, 50));
  }, []);

  return (
    <div className="space-y-8">
      {/* ── Zync-Intelligence: JARVIS-Style Executive Interaction Orb ──────── */}
      <ZyncJarvisOrb
        onTaskCreated={handleJarvisTaskCreated}
        onMeetingCreated={handleJarvisMeetingCreated}
        onCommandLogged={handleJarvisCommandLogged}
      />

      {/* ── Executive Progress Visualizer: Performance Ring ───────────────── */}
      <PerformanceRing
        percentage={completionPercentage}
        totalTasks={totalCount}
        completedTasks={completedCount}
      />

      {/* ── Morning Pulse: Session-Start AI Briefing ──────────────────────── */}
      <MorningPulseCard />

      {/* ── Executive Voice: Rapid Audio Capture -> Voice-to-Action ────────── */}
      <ExecutiveVoiceRecorder onTaskCreated={handleVoiceTaskCreated} />

      {/* ── Zync-Intelligence: Command Log (All JARVIS Interactions) ──────── */}
      <ZyncCommandLog logs={jarvisLogs} />

      {/* ── Unified View: Today's Summary Card ─────────────────────────────── */}
      <TodaysSummaryCard
        pendingCount={pendingTasks.length}
        nudgeCount={nudgeTasks.length}
        nextMeeting={nextMeeting}
        totalCandidates={candidates.length}
      />

      {/* ── Dashboard Grid: Tasks & Google Calendar Modules ──────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Task Queue Board (7 columns) */}
        <div className="lg:col-span-7 h-[680px]">
          <TaskQueueBoard
            tasks={tasks}
            onAddTask={addTask}
            onToggleTaskStatus={toggleTaskStatus}
            onUpdateTask={updateTask}
            onDeleteTask={deleteTask}
            isOverdueNudge={isOverdueNudge}
          />
        </div>

        {/* Google Calendar Module (5 columns) */}
        <div className="lg:col-span-5 h-[680px]">
          <GoogleCalendarModule
            events={events}
            onAddEvent={addEvent}
          />
        </div>
      </div>
    </div>
  );
}
