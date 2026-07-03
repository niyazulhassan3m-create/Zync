import { useState, useCallback } from "react";

// Initial Google Calendar mock data structure
const INITIAL_CALENDAR_EVENTS = [
  {
    id: "evt-1",
    title: "Candidate Interview — Senior Full Stack Dev",
    category: "Interview",
    date: new Date().toISOString().split("T")[0], // Today
    time: "02:30 PM - 03:15 PM",
    duration: "45m",
    attendees: ["Founder", "Candidate"],
    meetingUrl: "https://meet.google.com/abc-defg-hij",
    description: "Technical deep-dive on React, Node.js & Supabase architecture.",
    isNext: true,
  },
  {
    id: "evt-2",
    title: "Q3 Product Strategy Sync",
    category: "Strategy",
    date: new Date().toISOString().split("T")[0], // Today
    time: "04:00 PM - 05:00 PM",
    duration: "1h",
    attendees: ["Founder", "Co-Founder", "Lead Designer"],
    meetingUrl: "https://meet.google.com/xyz-uvwx-rst",
    description: "Review roadmap for Founder Intelligence Engine modules.",
    isNext: false,
  },
  {
    id: "evt-3",
    title: "Seed Round Investor Demo",
    category: "Investor",
    date: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString().split("T")[0], // Tomorrow
    time: "11:00 AM - 11:45 AM",
    duration: "45m",
    attendees: ["Founder", "Partner @ Horizon VC"],
    meetingUrl: "https://meet.google.com/inv-demo-123",
    description: "Live demo of Resume Parsing AI & Smart Candidate Search.",
    isNext: false,
  },
  {
    id: "evt-4",
    title: "Weekly Engineering Standup",
    category: "Team",
    date: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString().split("T")[0], // 2 days later
    time: "10:00 AM - 10:30 AM",
    duration: "30m",
    attendees: ["Dev Team"],
    meetingUrl: "https://meet.google.com/eng-sync-456",
    description: "Sprint review and API performance optimization check.",
    isNext: false,
  },
];

export function useCalendarEvents() {
  const [events, setEvents] = useState(INITIAL_CALENDAR_EVENTS);

  const addEvent = useCallback((newEvent) => {
    const eventObj = {
      id: `evt-${Date.now()}`,
      title: newEvent.title || "Untitled Meeting",
      category: newEvent.category || "Meeting",
      date: newEvent.date || new Date().toISOString().split("T")[0],
      time: newEvent.time || "03:00 PM - 03:30 PM",
      duration: newEvent.duration || "30m",
      attendees: newEvent.attendees || ["Founder"],
      meetingUrl: newEvent.meetingUrl || "https://meet.google.com",
      description: newEvent.description || "",
      isNext: false,
    };
    setEvents((prev) => [eventObj, ...prev]);
  }, []);

  // Find next upcoming meeting
  const nextMeeting = events.find((e) => e.isNext) || events[0] || null;

  return {
    events,
    nextMeeting,
    addEvent,
  };
}
