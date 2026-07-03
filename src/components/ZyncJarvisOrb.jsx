import React, { useState, useRef, useCallback, useEffect } from "react";

// ─── JARVIS State Machine ────────────────────────────────────────────────────
// idle → listening → thinking → speaking → standby
const STATES = {
  IDLE: "idle",
  LISTENING: "listening",
  THINKING: "thinking",
  SPEAKING: "speaking",
  STANDBY: "standby",
};

const STATE_LABELS = {
  idle: "Wake Word Listening ('Zync')",
  listening: "Listening (Continuous Mode)…",
  thinking: "Processing…",
  speaking: "Speaking…",
  standby: "Standby Mode",
};

const STATE_COLORS = {
  idle: "from-violet-500 via-purple-600 to-indigo-700",
  listening: "from-cyan-400 via-blue-500 to-violet-600",
  thinking: "from-amber-400 via-orange-500 to-red-500",
  speaking: "from-emerald-400 via-teal-500 to-cyan-600",
  standby: "from-slate-700 via-slate-800 to-slate-900",
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
  const [sessionCountdown, setSessionCountdown] = useState(30);
  const [isContinuousActive, setIsContinuousActive] = useState(false);
  const [wakeWordDetected, setWakeWordDetected] = useState(false);

  const [preferredLang, setPreferredLang] = useState(() => {
    return localStorage.getItem("zyncLanguagePreference") || "Auto-Detect";
  });
  const [error, setError] = useState(null);

  const recognitionRef = useRef(null);
  const wakeWordRecognitionRef = useRef(null);
  const audioRef = useRef(null);
  const synthRef = useRef(null);
  const timerRef = useRef(null);

  const handleLanguageChange = (lang) => {
    setPreferredLang(lang);
    localStorage.setItem("zyncLanguagePreference", lang);
  };

  // ─── 1. Background Wake-Word Engine ('Zync' Keyword Listener) ────────────
  useEffect(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) return;

    try {
      const wakeRec = new SpeechRecognition();
      wakeRec.continuous = true;
      wakeRec.interimResults = true;
      wakeRec.lang = "en-US";

      wakeRec.onresult = (event) => {
        for (let i = event.resultIndex; i < event.results.length; i++) {
          const text = event.results[i][0].transcript.toLowerCase();
          if (/\b(zync|zinc|hey zync|hi zync|jink|jeenc)\b/i.test(text)) {
            console.log("⚡ [Wake-Word Engine] 'Zync' Keyword Detected!");
            setWakeWordDetected(true);
            wakeRec.stop();
            activateContinuousListening();
            break;
          }
        }
      };

      wakeRec.onerror = () => {
        setTimeout(() => wakeRec.start?.(), 2000);
      };

      wakeRec.onend = () => {
        if (state === STATES.IDLE && !isContinuousActive) {
          try { wakeRec.start(); } catch (e) {}
        }
      };

      wakeWordRecognitionRef.current = wakeRec;
      wakeRec.start();
    } catch (e) {
      console.warn("[Wake-Word Engine] Web Speech API wake listener fallback active.");
    }

    return () => {
      wakeWordRecognitionRef.current?.abort?.();
    };
  }, [state, isContinuousActive]);

  // ─── 2. 30-Second Continuous Session Timer ────────────────────────────────
  const resetSessionTimer = useCallback(() => {
    if (timerRef.current) clearInterval(timerRef.current);
    setSessionCountdown(30);

    timerRef.current = setInterval(() => {
      setSessionCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(timerRef.current);
          triggerStandbyMode();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  }, []);

  const triggerStandbyMode = () => {
    setIsContinuousActive(false);
    setState(STATES.STANDBY);
    setWakeWordDetected(false);

    let standbyMsg = "Zync going to standby, Sir.";
    if (detectedLang === "Tanglish") standbyMsg = "Zync standby-la pochu, Sir.";
    if (detectedLang === "Tamil") standbyMsg = "Zync தயார் நிலைக்குச் செல்கிறது, ஐயா.";

    setSpokenResponse(standbyMsg);
    speakResponse(standbyMsg);

    setTimeout(() => {
      setState(STATES.IDLE);
    }, 4000);
  };

  // ─── 3. Activate Continuous Listening Loop ────────────────────────────────
  const activateContinuousListening = useCallback(() => {
    setError(null);
    setIsContinuousActive(true);
    resetSessionTimer();

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
          const text = finalTranscript || interimTranscript;
          // Strip wake word prefix if spoken inside mic stream
          const cleanedText = text.replace(/^\b(zync|zinc|hey zync|hi zync)\b\s*/i, "");
          setTranscript(cleanedText || text);

          if (finalTranscript) {
            resetSessionTimer();
            processCommand(cleanedText || finalTranscript);
          }
        };

        recognition.onerror = (err) => {
          if (err.error !== "aborted") {
            setState(STATES.IDLE);
          }
        };

        recognition.onend = () => {
          if (isContinuousActive && state !== STATES.THINKING && state !== STATES.SPEAKING) {
            try { recognition.start(); } catch (e) {}
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
  }, [preferredLang, isContinuousActive, state, resetSessionTimer]);

  const manualInput = () => {
    const text = prompt(
      "🤖 Zync-Intelligence (Wake Word: 'Zync' / Voice Command):",
      preferredLang === "Tanglish"
        ? "Reschedule it to 4 PM"
        : "Zync, schedule meeting with Hassan"
    );
    if (text) {
      setTranscript(text);
      resetSessionTimer();
      processCommand(text);
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
          if (isContinuousActive) {
            setState(STATES.LISTENING);
          } else {
            setState(STATES.IDLE);
          }
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
      browserSpeak(text);
    }
  };

  const browserSpeak = (text) => {
    if (window.speechSynthesis) {
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = 1.0;
      utterance.pitch = 0.95;

      const voices = window.speechSynthesis.getVoices();
      let preferredVoice = null;
      if (detectedLang === "Tamil") preferredVoice = voices.find((v) => v.lang.includes("ta"));
      if (!preferredVoice) {
        preferredVoice = voices.find((v) => v.name.includes("Google") || v.name.includes("Microsoft"));
      }
      if (preferredVoice) utterance.voice = preferredVoice;

      utterance.onend = () => {
        if (isContinuousActive) setState(STATES.LISTENING);
        else setState(STATES.IDLE);
      };
      utterance.onerror = () => setState(STATES.IDLE);

      synthRef.current = utterance;
      window.speechSynthesis.speak(utterance);
    } else {
      setState(STATES.IDLE);
    }
  };

  const handleOrbClick = () => {
    if (state === STATES.IDLE || state === STATES.STANDBY) {
      activateContinuousListening();
    } else if (state === STATES.LISTENING) {
      triggerStandbyMode();
    } else if (state === STATES.SPEAKING) {
      if (audioRef.current) { audioRef.current.pause(); audioRef.current = null; }
      if (window.speechSynthesis) window.speechSynthesis.cancel();
      setState(STATES.IDLE);
    }
  };

  const isActive = state !== STATES.IDLE && state !== STATES.STANDBY;

  return (
    <div className="rounded-2xl border border-violet-500/40 bg-gradient-to-r from-slate-950 via-[#0d1029] to-slate-950 p-6 shadow-2xl relative overflow-hidden">
      {/* Ambient glow layers */}
      <div className={`absolute inset-0 opacity-20 bg-gradient-to-br ${STATE_COLORS[state]} blur-3xl transition-all duration-1000 pointer-events-none`} />

      <div className="relative flex items-center gap-6">
        {/* ── The Orb (Wake-Word & Continuous Intelligence) ──────────────────── */}
        <button
          onClick={handleOrbClick}
          disabled={state === STATES.THINKING}
          className="relative flex-shrink-0 group focus:outline-none"
          title={state === STATES.IDLE ? "Say 'Zync' to activate continuous voice mode" : STATE_LABELS[state]}
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
                ? "scale-110 shadow-cyan-500/50 ring-4 ring-cyan-400/40"
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
              {state === STATES.IDLE && "🎙️"}
              {state === STATES.LISTENING && "⚡"}
              {state === STATES.THINKING && "⌛"}
              {state === STATES.SPEAKING && "🔊"}
              {state === STATES.STANDBY && "💤"}
            </span>
          </div>
        </button>

        {/* ── Status & Transcript Panel ───────────────────────────────────── */}
        <div className="flex-1 min-w-0 space-y-2">
          <div className="flex items-center gap-3 flex-wrap">
            <h3 className="text-base font-black text-white tracking-tight flex items-center gap-2">
              Zync-Intelligence
              <span className="text-xs font-bold text-violet-400">Wake-Word & Continuous Voice Engine</span>
            </h3>

            <span className={`rounded-full px-3 py-0.5 text-[10px] font-bold uppercase tracking-widest border transition-all duration-500 ${
              state === STATES.IDLE
                ? "bg-violet-500/15 border-violet-500/30 text-violet-300"
                : state === STATES.LISTENING
                ? "bg-cyan-500/15 border-cyan-500/30 text-cyan-300 animate-pulse"
                : state === STATES.THINKING
                ? "bg-amber-500/15 border-amber-500/30 text-amber-300 animate-pulse"
                : state === STATES.SPEAKING
                ? "bg-emerald-500/15 border-emerald-500/30 text-emerald-300 animate-pulse"
                : "bg-slate-700/30 border-slate-600 text-slate-400"
            }`}>
              {STATE_LABELS[state]}
            </span>

            {/* Continuous 30s Countdown Timer */}
            {isContinuousActive && (
              <span className="rounded-full bg-cyan-500/20 border border-cyan-500/40 px-2.5 py-0.5 text-[10px] font-black text-cyan-300 animate-pulse">
                ⏱️ Active Session: {sessionCountdown}s
              </span>
            )}

            {detectedLang && (
              <span className="rounded-full bg-gradient-to-r from-purple-500/20 to-pink-500/20 border border-purple-500/30 px-2.5 py-0.5 text-[10px] font-bold text-purple-300">
                🗣️ {detectedLang} Mode
              </span>
            )}
          </div>

          <p className="text-xs text-slate-400">
            Say <b>"Zync"</b> to awaken · 30-Second Continuous Mode · Context-Aware ("it"/"that") · Executive Deference ("Done, Sir.")
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
                <span className="text-[10px] font-bold text-emerald-400 uppercase tracking-widest">Zync Executive Confirmation ({detectedLang}):</span>
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
            onClick={() => activateContinuousListening()}
            className="rounded-lg border border-cyan-500/40 bg-cyan-500/20 px-3 py-1.5 text-xs font-bold text-cyan-200 hover:bg-cyan-500/30 transition-colors shadow-lg animate-pulse"
          >
            ⚡ Trigger 'Zync' Wake
          </button>
          <button
            onClick={() => {
              const demoPronoun = "Reschedule it to 5 PM";
              setTranscript(demoPronoun);
              resetSessionTimer();
              processCommand(demoPronoun);
            }}
            disabled={state !== STATES.IDLE && state !== STATES.LISTENING}
            className="rounded-lg border border-purple-500/30 bg-purple-500/10 px-3 py-1.5 text-xs font-bold text-purple-300 hover:bg-purple-500/20 transition-colors disabled:opacity-40"
          >
            🗣️ 'it' Pronoun Demo
          </button>
          <button
            onClick={manualInput}
            disabled={state === STATES.THINKING}
            className="rounded-lg border border-slate-700 bg-slate-800/80 px-3 py-1.5 text-xs font-semibold text-slate-300 hover:bg-slate-700 transition-colors disabled:opacity-40"
          >
            ⌨️ Type Command
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
