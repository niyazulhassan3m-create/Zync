import React, { useState, useRef } from "react";

export default function ExecutiveVoiceRecorder({ onTaskCreated }) {
  const [isRecording, setIsRecording] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [voiceNoteText, setVoiceNoteText] = useState("");
  const [extractedTask, setExtractedTask] = useState(null);
  const recognitionRef = useRef(null);

  // Start Voice Recording using SpeechRecognition API (if supported) or manual capture
  const handleToggleRecord = () => {
    if (isRecording) {
      setIsRecording(false);
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
      return;
    }

    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;

    if (SpeechRecognition) {
      try {
        const recognition = new SpeechRecognition();
        recognition.continuous = false;
        recognition.interimResults = false;
        recognition.lang = "en-US";

        recognition.onstart = () => {
          setIsRecording(true);
          setVoiceNoteText("");
        };

        recognition.onresult = (event) => {
          const transcript = event.results[0][0].transcript;
          setVoiceNoteText(transcript);
          handleProcessVoiceNote(transcript);
        };

        recognition.onerror = (err) => {
          console.warn("[SpeechRecognition Error]", err);
          setIsRecording(false);
        };

        recognition.onend = () => {
          setIsRecording(false);
        };

        recognitionRef.current = recognition;
        recognition.start();
      } catch (e) {
        setIsRecording(false);
      }
    } else {
      // Fallback manual quick-capture prompt if Speech API unavailable
      const manualText = prompt("🎙️ Rapid Capture — Enter Executive Voice Note Transcript:", "Schedule strategic review with Acme Corp tomorrow at 10 AM regarding executive recruitment pipeline.");
      if (manualText) {
        setVoiceNoteText(manualText);
        handleProcessVoiceNote(manualText);
      }
    }
  };

  const handleProcessVoiceNote = async (transcript) => {
    setIsProcessing(true);
    try {
      const res = await fetch("/api/zync/voice-to-action", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ voice_transcript: transcript }),
      });
      const data = await res.json();

      if (data.success && data.task) {
        setExtractedTask(data.task);
        if (onTaskCreated) onTaskCreated(data.task);
      }
    } catch (err) {
      console.error("[ExecutiveVoiceRecorder] error:", err);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="rounded-2xl border border-violet-500/40 bg-gradient-to-r from-slate-900 via-purple-950/40 to-slate-900 p-5 shadow-2xl space-y-4 relative overflow-hidden">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          {/* Rapid Capture Audio Button with Pulse */}
          <button
            onClick={handleToggleRecord}
            disabled={isProcessing}
            className={`relative flex h-12 w-12 items-center justify-center rounded-2xl text-xl font-bold text-white transition-all shadow-xl ${
              isRecording
                ? "bg-red-500 shadow-red-950/60 animate-pulse scale-105"
                : "bg-gradient-to-br from-violet-500 to-purple-600 hover:from-violet-400 hover:to-purple-500 shadow-purple-950/60"
            }`}
          >
            {isRecording ? "⏹️" : "🎙️"}
            {isRecording && (
              <span className="absolute -top-1 -right-1 h-3.5 w-3.5 rounded-full bg-red-400 animate-ping" />
            )}
          </button>
          <div>
            <h3 className="text-sm font-bold text-slate-100 flex items-center gap-2">
              Executive Voice — Voice-to-Action
              <span className="rounded-full bg-violet-500/20 border border-violet-500/30 px-2 py-0.5 text-[10px] font-bold text-violet-300">
                Killer Feature
              </span>
            </h3>
            <p className="text-xs text-slate-400">
              {isRecording ? "🔴 Recording executive note… Speak clearly." : "Click 'Rapid Capture' to dictate executive tasks & auto-inject to queue"}
            </p>
          </div>
        </div>

        <button
          onClick={() => {
            const sample = "Schedule follow-up meeting with Apex Robotics Corp tomorrow at 2 PM regarding lead software architect candidate.";
            setVoiceNoteText(sample);
            handleProcessVoiceNote(sample);
          }}
          className="rounded-lg border border-slate-700 bg-slate-800 px-3 py-1.5 text-xs font-semibold text-slate-300 hover:bg-slate-700 transition-colors"
        >
          ⚡ Try Sample Voice Note
        </button>
      </div>

      {/* Live Transcript & Extracted Task Payload */}
      {(voiceNoteText || isProcessing) && (
        <div className="rounded-xl border border-slate-700/60 bg-slate-950/60 p-4 space-y-2 text-xs">
          <div className="flex items-center justify-between">
            <span className="font-bold text-violet-300 uppercase tracking-wider text-[10px]">
              {isProcessing ? "Processing via Gemini API…" : "Voice Transcript Captured:"}
            </span>
            <span className="text-[10px] font-mono text-slate-500">Zync powered by Lab-Y</span>
          </div>

          <p className="text-slate-200 italic font-sans">"{voiceNoteText}"</p>

          {extractedTask && (
            <div className="mt-3 rounded-lg border border-emerald-500/30 bg-emerald-950/20 p-3 flex items-center justify-between text-xs animate-fade-in">
              <div className="flex items-center gap-2 text-emerald-300">
                <span>✅ Auto-Injected Task:</span>
                <span className="font-bold text-slate-100">{extractedTask.title}</span>
              </div>
              <span className="rounded bg-emerald-500/20 px-2 py-0.5 text-[10px] font-bold text-emerald-300 border border-emerald-500/40">
                Linked to Queue
              </span>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
