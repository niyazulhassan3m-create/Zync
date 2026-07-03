import React, { useState, useRef, useCallback, useEffect } from "react";

// ─── JARVIS State Machine ────────────────────────────────────────────────────
// idle → listening → thinking → speaking → idle
const STATES = {
  IDLE: "idle",
  LISTENING: "listening",
  THINKING: "thinking",
  SPEAKING: "speaking",
};

const STATE_LABELS = {
  idle: "Ready",
  listening: "Listening…",
  thinking: "Processing…",
  speaking: "Speaking…",
};

const STATE_COLORS = {
  idle: "from-violet-500 via-purple-600 to-indigo-700",
  listening: "from-cyan-400 via-blue-500 to-violet-600",
  thinking: "from-amber-400 via-orange-500 to-red-500",
  speaking: "from-emerald-400 via-teal-500 to-cyan-600",
};

const LANGUAGE_OPTIONS = [
  { id: "Auto-Detect", label: "🌐 Auto-Detect" },
  { id: "English", label: "🇬🇧 English" },
  { id: "Tanglish", label: "⚡ Tanglish" },
  { id: "Tamil", label: "🏛️ Tamil" },
];

export default function ZyncJarvisOrb({ onTaskCreated, onMeetingCreated, onCommandLogged }) {
  const [state, setState] = useState(STATES.IDLE);
  const [transcript, setTranscript] = useState("");
  const [spokenResponse, setSpokenResponse] = useState("");
  const [lastIntent, setLastIntent] = useState(null);
  const [detectedLang, setDetectedLang] = useState("English");
  const [activeContext, setActiveContext] = useState(null);
  const [preferredLang, setPreferredLang] = useState(() => {
    return localStorage.getItem("zyncLanguagePreference") || "Auto-Detect";
  });
  const [error, setError] = useState(null);

  const recognitionRef = useRef(null);
  const audioRef = useRef(null);
  const synthRef = useRef(null);

  const handleLanguageChange = (lang) => {
    setPreferredLang(lang);
    localStorage.setItem("zyncLanguagePreference", lang);
  };

  useEffect(() => {
    return () => {
      if (recognitionRef.current) recognitionRef.current.abort?.();
      if (audioRef.current) { audioRef.current.pause(); audioRef.current = null; }
      if (synthRef.current) window.speechSynthesis?.cancel();
    };
  }, []);

  const startListening = useCallback(() => {
    setError(null);
    setTranscript("");

    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;

    if (SpeechRecognition) {
      try {
        const recognition = new SpeechRecognition();
        recognition.continuous = false;
        recognition.interimResults = true;

        if (preferredLang === "Tamil") {
          recognition.lang = "ta-IN";
        } else {
          recognition.lang = "en-US";
        }

        recognition.onstart = () => setState(STATES.LISTENING);

        recognition.onresult = (event) => {
          let interimTranscript = "";
          let finalTranscript = "";
          for (let i = 0; i < event.results.length; i++) {
            if (event.results[i].isFinal) {
              finalTranscript += event.results[i][0].transcript;
            } else {
              interimTranscript += event.results[i][0].transcript;
            }
          }
          setTranscript(finalTranscript || interimTranscript);
          if (finalTranscript) {
            processCommand(finalTranscript);
          }
        };

        recognition.onerror = (err) => {
          console.warn("[Zync JARVIS] SpeechRecognition error:", err.error);
          if (err.error !== "aborted") {
            setState(STATES.IDLE);
            setError("Microphone access issue. Try typing your command.");
          }
        };

        recognition.onend = () => {
          if (state === STATES.LISTENING) {
            setState(STATES.IDLE);
          }
        };

        recognitionRef.current = recognition;
        recognition.start();
      } catch (e) {
        manualInput();
      }
    } else {
      manualInput();
    }
  }, [preferredLang]);

  const manualInput = () => {
    const text = prompt(
      "🤖 Zync-Intelligence (English / Tamil / Tanglish):",
      preferredLang === "Tanglish"
        ? "Cancel the meeting with Board of Directors"
        : "Zync, cancel meeting with Hassan"
    );
    if (text) {
      setTranscript(text);
      processCommand(text);
    }
  };

  const stopListening = () => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
    }
  };

  const processCommand = async (text, choiceOverride = null) => {
    setState(STATES.THINKING);

    try {
      const res = await fetch("/api/zync/jarvis", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          transcript: text,
          preferred_language: preferredLang,
          action_choice: choiceOverride,
        }),
      });
      const data = await res.json();

      if (data.success) {
        setSpokenResponse(data.spoken_response);
        setLastIntent(data.intent);
        setDetectedLang(data.detected_language || "English");
        setActiveContext(data.context || null);

        if (data.action_result?.type === "task_created" && onTaskCreated) {
          onTaskCreated(data.action_result.data);
        }
        if (data.action_result?.type === "meeting_scheduled" && onMeetingCreated) {
          onMeetingCreated(data.action_result.data);
        }
        if (onCommandLogged && data.log_entry) {
          onCommandLogged(data.log_entry);
        }

        await speakResponse(data.spoken_response);
      }
    } catch (err) {
      console.error("[Zync JARVIS] Error:", err);
      setError("Connection issue. Please try again.");
      setState(STATES.IDLE);
    }
  };

  const speakResponse = async (text) => {
    setState(STATES.SPEAKING);

    try {
      const ttsRes = await fetch("/api/zync/jarvis/tts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text }),
      });

      const contentType = ttsRes.headers.get("content-type") || "";

      if (contentType.includes("audio")) {
        const audioBlob = await ttsRes.blob();
        const audioUrl = URL.createObjectURL(audioBlob);
        const audio = new Audio(audioUrl);
        audioRef.current = audio;

        audio.onended = () => {
          setState(STATES.IDLE);
          URL.revokeObjectURL(audioUrl);
        };
        audio.onerror = () => {
          browserSpeak(text);
        };
        audio.play();
        return;
      }

      const data = await ttsRes.json();
      if (data.fallback) {
        browserSpeak(text);
        return;
      }
    } catch (err) {
      console.warn("[Zync JARVIS] TTS fallback:", err);
      browserSpeak(text);
    }
  };

  const browserSpeak = (text) => {
    if (window.speechSynthesis) {
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = 1.0;
      utterance.pitch = 0.95;
      utterance.volume = 1.0;

      const voices = window.speechSynthesis.getVoices();
      let preferredVoice = null;
      if (detectedLang === "Tamil") {
        preferredVoice = voices.find((v) => v.lang.includes("ta"));
      }
      if (!preferredVoice) {
        preferredVoice = voices.find(
          (v) => v.name.includes("Google") || v.name.includes("Microsoft") || v.name.includes("Samantha")
        );
      }
      if (preferredVoice) utterance.voice = preferredVoice;

      utterance.onend = () => setState(STATES.IDLE);
      utterance.onerror = () => setState(STATES.IDLE);

      synthRef.current = utterance;
      window.speechSynthesis.speak(utterance);
    } else {
      setState(STATES.IDLE);
    }
  };

  const handleOrbClick = () => {
    if (state === STATES.IDLE) {
      startListening();
    } else if (state === STATES.LISTENING) {
      stopListening();
    } else if (state === STATES.SPEAKING) {
      if (audioRef.current) { audioRef.current.pause(); audioRef.current = null; }
      if (window.speechSynthesis) window.speechSynthesis.cancel();
      setState(STATES.IDLE);
    }
  };

  const isActive = state !== STATES.IDLE;

  return (
    <div className="rounded-2xl border border-violet-500/40 bg-gradient-to-r from-slate-950 via-[#0d1029] to-slate-950 p-6 shadow-2xl relative overflow-hidden">
      {/* Ambient glow layers */}
      <div className={`absolute inset-0 opacity-20 bg-gradient-to-br ${STATE_COLORS[state]} blur-3xl transition-all duration-1000 pointer-events-none`} />

      <div className="relative flex items-center gap-6">
        {/* ── The Orb ────────────────────────────────────────────────────────── */}
        <button
          onClick={handleOrbClick}
          disabled={state === STATES.THINKING}
          className="relative flex-shrink-0 group focus:outline-none"
          title={state === STATES.IDLE ? "Click to activate Zync-Intelligence Assistant" : STATE_LABELS[state]}
        >
          {isActive && (
            <>
              <span className={`absolute inset-0 rounded-full bg-gradient-to-br ${STATE_COLORS[state]} opacity-20 animate-ping`} style={{ animationDuration: "2s" }} />
              <span className={`absolute -inset-2 rounded-full bg-gradient-to-br ${STATE_COLORS[state]} opacity-10 animate-ping`} style={{ animationDuration: "3s" }} />
              <span className={`absolute -inset-4 rounded-full bg-gradient-to-br ${STATE_COLORS[state]} opacity-5 animate-ping`} style={{ animationDuration: "4s" }} />
            </>
          )}

          <div
            className={`relative flex h-20 w-20 items-center justify-center rounded-full bg-gradient-to-br ${STATE_COLORS[state]} shadow-2xl transition-all duration-500 ${
              state === STATES.IDLE
                ? "group-hover:scale-110 group-hover:shadow-violet-500/40"
                : state === STATES.LISTENING
                ? "scale-110 shadow-cyan-500/50"
                : state === STATES.THINKING
                ? "scale-105 shadow-amber-500/50"
                : "scale-110 shadow-emerald-500/50"
            }`}
            style={{
              animation:
                state === STATES.IDLE
                  ? "pulse 3s ease-in-out infinite"
                  : state === STATES.THINKING
                  ? "spin 3s linear infinite"
                  : undefined,
            }}
          >
            <div className="absolute inset-1 rounded-full bg-gradient-to-br from-white/20 to-transparent" />

            {(state === STATES.LISTENING || state === STATES.SPEAKING) && (
              <div className="absolute inset-0 flex items-center justify-center gap-0.5">
                {[1, 2, 3, 4, 5, 4, 3, 2, 1].map((h, i) => (
                  <div
                    key={i}
                    className="w-1 rounded-full bg-white/80"
                    style={{
                      height: `${h * 6}px`,
                      animation: `waveBar 0.8s ease-in-out ${i * 0.08}s infinite alternate`,
                    }}
                  />
                ))}
              </div>
            )}

            <span className="relative z-10 text-white text-2xl drop-shadow-lg">
              {state === STATES.IDLE && "🤖"}
              {state === STATES.LISTENING && "🎙️"}
              {state === STATES.THINKING && "⚡"}
              {state === STATES.SPEAKING && "🔊"}
            </span>
          </div>
        </button>

        {/* ── Status & Transcript Panel ───────────────────────────────────── */}
        <div className="flex-1 min-w-0 space-y-2">
          <div className="flex items-center gap-3 flex-wrap">
            <h3 className="text-base font-black text-white tracking-tight flex items-center gap-2">
              Zync-Intelligence
              <span className="text-xs font-bold text-violet-400">Multilingual AI</span>
            </h3>

            <span className={`rounded-full px-3 py-0.5 text-[10px] font-bold uppercase tracking-widest border transition-all duration-500 ${
              state === STATES.IDLE
                ? "bg-violet-500/15 border-violet-500/30 text-violet-300"
                : state === STATES.LISTENING
                ? "bg-cyan-500/15 border-cyan-500/30 text-cyan-300 animate-pulse"
                : state === STATES.THINKING
                ? "bg-amber-500/15 border-amber-500/30 text-amber-300 animate-pulse"
                : "bg-emerald-500/15 border-emerald-500/30 text-emerald-300 animate-pulse"
            }`}>
              {STATE_LABELS[state]}
            </span>

            {detectedLang && (
              <span className="rounded-full bg-gradient-to-r from-purple-500/20 to-pink-500/20 border border-purple-500/30 px-2.5 py-0.5 text-[10px] font-bold text-purple-300">
                🗣️ {detectedLang} Mode
              </span>
            )}
          </div>

          <p className="text-xs text-slate-400">
            Fluent in <b>English</b>, <b>Tamil</b>, & <b>Tanglish</b> · Command Refinement & Multi-Step Clarification Active
          </p>

          {/* User Language Preference Selector Bar */}
          <div className="flex items-center gap-2 pt-1">
            <span className="text-[11px] font-bold text-slate-400">Language Preference:</span>
            <div className="flex items-center gap-1.5 bg-slate-900/80 p-1 rounded-xl border border-slate-700/60">
              {LANGUAGE_OPTIONS.map((opt) => (
                <button
                  key={opt.id}
                  onClick={() => handleLanguageChange(opt.id)}
                  className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-all ${
                    preferredLang === opt.id
                      ? "bg-violet-500 text-white shadow-md"
                      : "text-slate-400 hover:text-slate-200"
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          {/* Live Transcript */}
          {transcript && (
            <div className="rounded-lg border border-slate-700/60 bg-slate-900/80 px-3 py-2 mt-1">
              <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">You said:</p>
              <p className="text-sm text-slate-200 italic">"{transcript}"</p>
            </div>
          )}

          {/* Zync Response */}
          {spokenResponse && state !== STATES.LISTENING && (
            <div className="rounded-lg border border-emerald-500/30 bg-emerald-950/20 px-3 py-2 mt-1">
              <div className="flex items-center justify-between mb-1">
                <span className="text-[10px] font-bold text-emerald-400 uppercase tracking-widest">Zync confirmed ({detectedLang}):</span>
                <span className="text-[10px] text-emerald-400 font-mono">ElevenLabs Multilingual v2</span>
              </div>
              <p className="text-sm text-slate-200">"{spokenResponse}"</p>
            </div>
          )}

          {/* ── STEP 3: CONTEXTUAL CLARIFICATION BUTTONS ────────────────────── */}
          {lastIntent === "clarification_needed" && activeContext && (
            <div className="mt-3 p-3 rounded-xl border border-amber-500/50 bg-amber-950/30 space-y-2">
              <p className="text-xs font-bold text-amber-300">
                ⚡ Clarification Required for meeting with <span className="underline">{activeContext.target_entity}</span>:
              </p>
              <div className="flex items-center gap-2 flex-wrap">
                <button
                  onClick={() => processCommand("", "reschedule")}
                  className="px-3 py-1.5 rounded-lg bg-violet-600 hover:bg-violet-500 text-xs font-bold text-white shadow-md transition-all"
                >
                  📅 Reschedule
                </button>
                <button
                  onClick={() => processCommand("", "cancel")}
                  className="px-3 py-1.5 rounded-lg bg-amber-600 hover:bg-amber-500 text-xs font-bold text-white shadow-md transition-all"
                >
                  ❌ Cancel
                </button>
                <button
                  onClick={() => processCommand("", "delete")}
                  className="px-3 py-1.5 rounded-lg bg-red-600 hover:bg-red-500 text-xs font-bold text-white shadow-md transition-all"
                >
                  🗑️ Delete
                </button>
              </div>
            </div>
          )}

          {/* ── STEP 4: SAFETY VERIFICATION ("Are you sure?") BUTTONS ────────── */}
          {lastIntent === "awaiting_delete_confirmation" && activeContext && (
            <div className="mt-3 p-3 rounded-xl border border-red-500/50 bg-red-950/40 space-y-2 animate-pulse">
              <p className="text-xs font-bold text-red-300">
                ⚠️ Safety Verification: Are you sure you want to permanently remove meeting with <span className="underline">{activeContext.target_entity}</span>?
              </p>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => processCommand("Yes, I am sure", "confirm_delete")}
                  className="px-3.5 py-1.5 rounded-lg bg-red-600 hover:bg-red-500 text-xs font-black text-white shadow-lg transition-all"
                >
                  ⚠️ Yes, Permanently Delete
                </button>
                <button
                  onClick={() => processCommand("No", "cancel_delete")}
                  className="px-3.5 py-1.5 rounded-lg bg-slate-700 hover:bg-slate-600 text-xs font-bold text-slate-200 transition-all"
                >
                  🛡️ No, Keep Meeting
                </button>
              </div>
            </div>
          )}

          {error && (
            <div className="rounded-lg border border-red-500/30 bg-red-950/20 px-3 py-1.5 mt-1">
              <p className="text-xs text-red-400">{error}</p>
            </div>
          )}
        </div>

        {/* Action & Demos */}
        <div className="flex flex-col gap-1.5 flex-shrink-0">
          <button
            onClick={manualInput}
            disabled={state !== STATES.IDLE}
            className="rounded-lg border border-slate-700 bg-slate-800/80 px-3 py-1.5 text-xs font-semibold text-slate-300 hover:bg-slate-700 transition-colors disabled:opacity-40"
          >
            ⌨️ Type Command
          </button>
          <button
            onClick={() => {
              const demoRefine = "Zync, cancel the meeting with Board of Directors";
              setTranscript(demoRefine);
              processCommand(demoRefine);
            }}
            disabled={state !== STATES.IDLE}
            className="rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-1.5 text-xs font-bold text-red-300 hover:bg-red-500/20 transition-colors disabled:opacity-40"
          >
            ⚠️ Clarification Demo
          </button>
        </div>
      </div>

      <style>{`
        @keyframes waveBar {
          0% { transform: scaleY(0.4); }
          100% { transform: scaleY(1.8); }
        }
      `}</style>
    </div>
  );
}
