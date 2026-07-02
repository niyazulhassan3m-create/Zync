import { useState, useRef, useCallback } from "react";

// ─────────────────────────────────────────────────────────────────────────────
// Real API caller — POSTs the PDF to the Express backend
// ─────────────────────────────────────────────────────────────────────────────
async function callParseAPI(file) {
  const formData = new FormData();
  formData.append("resume", file);

  const res = await fetch("/api/parse-resume", {
    method: "POST",
    body: formData,
    // Do NOT set Content-Type header; browser sets it with the boundary automatically
  });

  const json = await res.json();

  if (!res.ok) {
    // Server returned a structured error — surface the human-readable message
    const err = new Error(json.message || "An unknown server error occurred.");
    err.code = json.error || "SERVER_ERROR";
    err.status = res.status;
    throw err;
  }

  // Normalise field names for the UI
  return {
    fullName: json.data.name,
    email: json.data.email || "Not found",
    phone: json.data.phone || "Not found",
    skills: json.data.skills,
    yearsOfExperience: json.data.yearsOfExperience,
    roleCategory: json.data.roleCategory || "Other",
    seniorityLevel: json.data.seniorityLevel || "Mid",
    sourceFile: json.sourceFile,
    processedAt: json.processedAt,
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// UploadArea
// ─────────────────────────────────────────────────────────────────────────────
function UploadArea({ onFileAccepted }) {
  const [isDragging, setIsDragging] = useState(false);
  const [dragError, setDragError] = useState("");
  const inputRef = useRef(null);

  const validateAndAccept = (file) => {
    setDragError("");
    if (!file) return;
    if (file.type !== "application/pdf") {
      setDragError("Only PDF files are supported.");
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      setDragError("File size must be under 10 MB.");
      return;
    }
    onFileAccepted(file);
  };

  const onDrop = useCallback((e) => {
    e.preventDefault();
    setIsDragging(false);
    validateAndAccept(e.dataTransfer.files[0]);
  }, []);

  const onDragOver = (e) => { e.preventDefault(); setIsDragging(true); };
  const onDragLeave = () => setIsDragging(false);
  const onInputChange = (e) => validateAndAccept(e.target.files[0]);

  return (
    <div
      onDrop={onDrop}
      onDragOver={onDragOver}
      onDragLeave={onDragLeave}
      onClick={() => inputRef.current?.click()}
      className={`relative flex flex-col items-center justify-center gap-5 rounded-2xl border-2 border-dashed p-14 cursor-pointer transition-all duration-300 select-none ${
        isDragging
          ? "border-violet-400 bg-violet-950/30 shadow-[0_0_50px_-5px_rgba(139,92,246,0.45)]"
          : "border-slate-700 bg-slate-800/30 hover:border-violet-500/60 hover:bg-slate-800/60 hover:shadow-[0_0_35px_-10px_rgba(139,92,246,0.3)]"
      }`}
    >
      {isDragging && (
        <span className="absolute inset-0 rounded-2xl animate-ping-slow border border-violet-400/30 pointer-events-none" />
      )}

      <div className={`flex h-20 w-20 items-center justify-center rounded-2xl transition-all duration-300 ${
        isDragging ? "bg-violet-500/25 scale-110" : "bg-slate-700/50"
      }`}>
        <svg className={`h-10 w-10 transition-colors duration-300 ${isDragging ? "text-violet-300" : "text-slate-400"}`}
          viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round"
            d="M19.5 14.25v-2.625a3.375 3.375 0 0 0-3.375-3.375h-1.5A1.125 1.125 0 0 1 13.5 7.125v-1.5a3.375 3.375 0 0 0-3.375-3.375H8.25m6.75 12-3-3m0 0-3 3m3-3v6m-1.5-15H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 0 0-9-9Z"
          />
        </svg>
      </div>

      <div className="text-center">
        <p className={`text-lg font-semibold transition-colors duration-300 ${isDragging ? "text-violet-200" : "text-slate-200"}`}>
          {isDragging ? "Release to upload" : "Drop your PDF resume here"}
        </p>
        <p className="mt-1.5 text-sm text-slate-500">
          or{" "}
          <span className="text-violet-400 font-medium hover:text-violet-300 transition-colors">
            click to browse
          </span>{" "}
          &middot; PDF only &middot; max 10 MB
        </p>
      </div>

      {dragError && (
        <p className="text-sm font-medium text-red-400 bg-red-400/10 px-4 py-2 rounded-lg border border-red-400/20">
          ⚠ {dragError}
        </p>
      )}

      <input ref={inputRef} type="file" accept=".pdf,application/pdf" className="hidden" onChange={onInputChange} />
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// ProcessingState — animated step checklist
// ─────────────────────────────────────────────────────────────────────────────
function ProcessingState({ fileName, progress }) {
  // progress: 0 = uploading, 1 = parsing PDF, 2 = AI analysing
  const steps = [
    { label: "Uploading document", done: progress > 0 },
    { label: "Extracting text from PDF", done: progress > 1 },
    { label: "Running Gemini AI analysis", done: false },
  ];

  const pct = Math.round(((progress + 1) / 3) * 100);

  return (
    <div className="rounded-2xl border border-slate-700/60 bg-slate-800/40 p-8">
      <div className="flex items-center gap-4 mb-8">
        <div className="relative flex h-11 w-11 items-center justify-center flex-shrink-0">
          <span className="absolute inset-0 rounded-full bg-violet-500/20 animate-ping" />
          <span className="relative flex h-11 w-11 items-center justify-center rounded-full bg-violet-500/25 border border-violet-400/40">
            <svg className="h-5 w-5 text-violet-300 animate-spin" viewBox="0 0 24 24" fill="none">
              <circle cx="12" cy="12" r="10" stroke="currentColor" strokeOpacity=".2" strokeWidth="3" />
              <path d="M12 2a10 10 0 0 1 10 10" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
            </svg>
          </span>
        </div>
        <div className="min-w-0">
          <p className="text-base font-semibold text-slate-100">Analysing Resume</p>
          <p className="text-sm text-slate-500 truncate">{fileName}</p>
        </div>
      </div>

      <div className="space-y-4">
        {steps.map((step, i) => (
          <div key={i} className="flex items-center gap-3">
            {step.done ? (
              <span className="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-emerald-500/15 border border-emerald-500/35">
                <svg className="h-3.5 w-3.5 text-emerald-400" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 0 1 0 1.414l-8 8a1 1 0 0 1-1.414 0l-4-4a1 1 0 0 1 1.414-1.414L8 12.586l7.293-7.293a1 1 0 0 1 1.414 0Z" clipRule="evenodd" />
                </svg>
              </span>
            ) : i === progress ? (
              <span className="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-violet-500/10 border border-violet-500/30">
                <span className="h-2 w-2 rounded-full bg-violet-400 animate-pulse" />
              </span>
            ) : (
              <span className="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full border border-slate-700">
                <span className="h-2 w-2 rounded-full bg-slate-700" />
              </span>
            )}
            <span className={`text-sm ${
              step.done
                ? "text-slate-500 line-through"
                : i === progress
                ? "text-slate-200 font-medium"
                : "text-slate-600"
            }`}>
              {step.label}
            </span>
            {i === progress && (
              <span className="ml-auto text-xs text-violet-400 font-mono animate-pulse">running…</span>
            )}
          </div>
        ))}
      </div>

      <div className="mt-8 h-1 w-full rounded-full bg-slate-700 overflow-hidden">
        <div
          className="h-full rounded-full bg-gradient-to-r from-violet-600 to-purple-400 transition-all duration-700 ease-out"
          style={{ width: `${pct}%` }}
        />
      </div>
      <p className="mt-2 text-right text-xs text-slate-500">{pct}% complete</p>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// ErrorState — shown when the API returns a structured error
// ─────────────────────────────────────────────────────────────────────────────
function ErrorState({ error, onRetry }) {
  const isNotResume = error.code === "NOT_A_RESUME";
  const isNetworkError = error.code === "NETWORK_ERROR";
  const isQuota = error.code === "QUOTA_EXCEEDED";

  const icon = isNotResume ? "📄" : isNetworkError ? "🔌" : isQuota ? "⏱️" : "⚠️";
  const title = isNotResume
    ? "Not a Resume"
    : isNetworkError
    ? "Connection Failed"
    : isQuota
    ? "API Rate Limit Reached"
    : "Processing Failed";

  return (
    <div className="rounded-2xl border border-red-500/20 bg-red-500/5 p-8">
      <div className="flex items-start gap-4">
        <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-xl bg-red-500/10 border border-red-500/20 text-2xl">
          {icon}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-base font-semibold text-red-400">{title}</p>
          <p className="mt-1 text-sm text-slate-400 leading-relaxed">{error.message}</p>

          {isNotResume && (
            <p className="mt-2 text-xs text-slate-500">
              Try uploading a standard CV or resume PDF instead.
            </p>
          )}
          {isNetworkError && (
            <p className="mt-2 text-xs text-slate-500">
              Make sure the API server is running:{" "}
              <code className="bg-slate-800 px-1.5 py-0.5 rounded text-violet-400">npm run dev:server</code>
            </p>
          )}
          {isQuota && (
            <p className="mt-2 text-xs text-slate-500">
              The free tier allows ~15 requests/minute. Wait a moment and try again — the server will auto-retry once for you.
            </p>
          )}
        </div>
      </div>

      <div className="mt-6 flex gap-3">
        <button
          id="error-retry-btn"
          onClick={onRetry}
          className="flex items-center gap-2 rounded-lg bg-violet-500/15 border border-violet-500/30 px-4 py-2 text-sm font-medium text-violet-300 hover:bg-violet-500/25 transition-all duration-200"
        >
          <svg className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M15.312 11.424a5.5 5.5 0 0 1-9.201 2.466l-.312-.311h2.433a.75.75 0 0 0 0-1.5H3.989a.75.75 0 0 0-.75.75v4.242a.75.75 0 0 0 1.5 0v-2.43l.31.31a7 7 0 0 0 11.712-3.138.75.75 0 0 0-1.449-.39Zm1.23-3.723a.75.75 0 0 0 .219-.53V2.929a.75.75 0 0 0-1.5 0V5.36l-.31-.31A7 7 0 0 0 3.239 8.188a.75.75 0 1 0 1.448.389A5.5 5.5 0 0 1 13.89 6.11l.311.31h-2.432a.75.75 0 0 0 0 1.5h4.243a.75.75 0 0 0 .53-.219Z" clipRule="evenodd" />
          </svg>
          Try again
        </button>
        <button
          id="error-upload-new-btn"
          onClick={onRetry}
          className="flex items-center gap-2 rounded-lg border border-slate-700/60 bg-slate-800/40 px-4 py-2 text-sm font-medium text-slate-400 hover:text-slate-300 hover:border-slate-600 transition-all duration-200"
        >
          Upload different file
        </button>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// SkillBadge
// ─────────────────────────────────────────────────────────────────────────────
const BADGE_PALETTE = [
  "text-cyan-300 bg-cyan-500/10 border-cyan-500/30",
  "text-emerald-300 bg-emerald-500/10 border-emerald-500/30",
  "text-violet-300 bg-violet-500/10 border-violet-500/30",
  "text-amber-300 bg-amber-500/10 border-amber-500/30",
  "text-rose-300 bg-rose-500/10 border-rose-500/30",
];

function SkillBadge({ skill, index }) {
  const cls = BADGE_PALETTE[index % BADGE_PALETTE.length];
  return (
    <span className={`inline-flex items-center rounded-full border px-3 py-0.5 text-xs font-medium ${cls}`}>
      {skill}
    </span>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// ExtractedDataTable
// ─────────────────────────────────────────────────────────────────────────────
function ExtractedDataTable({ data, onReset, onSave, isSaved, saving, saveError }) {
  const rows = [
    {
      label: "Full Name",
      icon: (
        <svg className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
          <path d="M10 8a3 3 0 1 0 0-6 3 3 0 0 0 0 6ZM3.465 14.493a1.23 1.23 0 0 0 .41 1.412A9.957 9.957 0 0 0 10 18c2.31 0 4.438-.784 6.131-2.1.43-.333.604-.903.408-1.41a7.002 7.002 0 0 0-13.074.003Z" />
        </svg>
      ),
      value: <span className="font-semibold text-slate-100 text-base">{data.fullName}</span>,
    },
    {
      label: "Email Address",
      icon: (
        <svg className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
          <path d="M3 4a2 2 0 0 0-2 2v1.161l8.441 4.221a1.25 1.25 0 0 0 1.118 0L19 7.162V6a2 2 0 0 0-2-2H3Z" />
          <path d="m19 8.839-7.77 3.885a2.75 2.75 0 0 1-2.46 0L1 8.839V14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V8.839Z" />
        </svg>
      ),
      value: data.email && data.email !== "Not found" ? (
        <a href={`mailto:${data.email}`} className="text-violet-400 hover:text-violet-300 transition-colors underline underline-offset-2 text-sm">
          {data.email}
        </a>
      ) : (
        <span className="text-slate-600 text-sm italic">Not found</span>
      ),
    },
    {
      label: "Phone Number",
      icon: (
        <svg className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
          <path fillRule="evenodd" d="M2 3.5A1.5 1.5 0 0 1 3.5 2h1.148a1.5 1.5 0 0 1 1.465 1.175l.716 3.223a1.5 1.5 0 0 1-1.052 1.767l-.933.267c-.41.117-.643.555-.48.95a11.542 11.542 0 0 0 6.254 6.254c.395.163.833-.07.95-.48l.267-.933a1.5 1.5 0 0 1 1.767-1.052l3.223.716A1.5 1.5 0 0 1 18 16.352V17.5a1.5 1.5 0 0 1-1.5 1.5H15c-1.149 0-2.263-.15-3.326-.43A13.022 13.022 0 0 1 2.43 8.326 13.019 13.019 0 0 1 2 5V3.5Z" clipRule="evenodd" />
        </svg>
      ),
      value: data.phone && data.phone !== "Not found" ? (
        <span className="font-mono text-slate-200 text-sm">{data.phone}</span>
      ) : (
        <span className="text-slate-600 text-sm italic">Not found</span>
      ),
    },
    {
      label: "Top Skills",
      icon: (
        <svg className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
          <path d="M11.983 1.907a.75.75 0 0 0-1.292-.657l-8.5 9.5A.75.75 0 0 0 2.75 12h6.572l-1.305 6.093a.75.75 0 0 0 1.292.657l8.5-9.5A.75.75 0 0 0 17.25 8h-6.572l1.305-6.093Z" />
        </svg>
      ),
      value: data.skills.length > 0 ? (
        <div className="flex flex-wrap gap-2">
          {data.skills.map((s, i) => <SkillBadge key={s} skill={s} index={i} />)}
        </div>
      ) : (
        <span className="text-slate-600 text-sm italic">Not found</span>
      ),
    },
    {
      label: "Years of Experience",
      icon: (
        <svg className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
          <path fillRule="evenodd" d="M5.75 2a.75.75 0 0 1 .75.75V4h7V2.75a.75.75 0 0 1 1.5 0V4h.25A2.75 2.75 0 0 1 18 6.75v8.5A2.75 2.75 0 0 1 15.25 18H4.75A2.75 2.75 0 0 1 2 15.25v-8.5A2.75 2.75 0 0 1 4.75 4H5V2.75A.75.75 0 0 1 5.75 2Zm-1 5.5c-.69 0-1.25.56-1.25 1.25v6.5c0 .69.56 1.25 1.25 1.25h10.5c.69 0 1.25-.56 1.25-1.25v-6.5c0-.69-.56-1.25-1.25-1.25H4.75Z" clipRule="evenodd" />
        </svg>
      ),
      value: (
        <div className="flex items-center gap-3">
          <span className="text-2xl font-bold text-slate-100 tabular-nums leading-none">{data.yearsOfExperience}</span>
          <div className="flex gap-0.5 items-end">
            {Array.from({ length: 10 }).map((_, i) => (
              <span key={i} className={`w-2 rounded-sm transition-all ${
                i < data.yearsOfExperience ? "bg-violet-500 h-3.5" : "bg-slate-700 h-2"
              }`} />
            ))}
          </div>
          <span className="text-sm text-slate-500">years</span>
        </div>
      ),
    },
    {
      label: "Role Category",
      icon: (
        <svg className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
          <path fillRule="evenodd" d="M4.5 2A2.5 2.5 0 0 0 2 4.5v3.879a2.5 2.5 0 0 0 .732 1.767l7.5 7.5a2.5 2.5 0 0 0 3.536 0l3.878-3.878a2.5 2.5 0 0 0 0-3.536l-7.5-7.5A2.5 2.5 0 0 0 8.38 2H4.5ZM5 6a1 1 0 1 0 0-2 1 1 0 0 0 0 2Z" clipRule="evenodd" />
        </svg>
      ),
      value: data.roleCategory ? (
        <span className="inline-flex items-center rounded-full border border-violet-500/30 bg-violet-500/10 px-3 py-1 text-sm font-medium text-violet-300">
          {data.roleCategory}
        </span>
      ) : (
        <span className="text-slate-600 text-sm italic">Unknown</span>
      ),
    },
    {
      label: "Seniority Level",
      icon: (
        <svg className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
          <path fillRule="evenodd" d="M12.577 4.878a.75.75 0 0 1 .919-.53l4.78 1.281a.75.75 0 0 1 .531.919l-1.281 4.78a.75.75 0 0 1-1.449-.387l.81-3.022a19.407 19.407 0 0 0-5.594 5.203.75.75 0 0 1-1.139.093L7 10.06l-4.72 4.72a.75.75 0 0 1-1.06-1.061l5.25-5.25a.75.75 0 0 1 1.06 0l3.074 3.073a20.923 20.923 0 0 1 5.545-4.931l-3.042-.815a.75.75 0 0 1-.53-.918Z" clipRule="evenodd" />
        </svg>
      ),
      value: data.seniorityLevel ? (
        <span className="inline-flex items-center rounded-full border border-emerald-500/30 bg-emerald-500/10 px-3 py-1 text-sm font-medium text-emerald-300">
          {data.seniorityLevel}
        </span>
      ) : (
        <span className="text-slate-600 text-sm italic">Unknown</span>
      ),
    },
  ];

  return (
    <div className="rounded-2xl border border-slate-700/60 bg-slate-800/40 overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-slate-700/60 bg-slate-800/70 backdrop-blur">
        <div className="flex items-center gap-2.5">
          <span className="flex h-2 w-2 rounded-full bg-emerald-400" style={{ boxShadow: "0 0 8px 2px rgba(52,211,153,0.5)" }} />
          <span className="text-sm font-semibold text-slate-200">Extraction Complete</span>
          <span className="rounded-full bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 text-xs font-medium text-emerald-400">
            Gemini AI
          </span>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-xs text-slate-500">{data.processedAt}</span>
          <button
            onClick={onReset}
            id="reset-btn"
            className="flex items-center gap-1.5 rounded-lg border border-slate-600/60 bg-slate-700/40 px-3 py-1.5 text-xs font-medium text-slate-300 hover:border-violet-500/50 hover:text-violet-300 hover:bg-violet-500/5 transition-all duration-200"
          >
            <svg className="h-3.5 w-3.5" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M7.793 2.232a.75.75 0 0 1-.025 1.06L6.052 5h10.698a.75.75 0 0 1 0 1.5H6.052l1.716 1.708a.75.75 0 1 1-1.06 1.06l-3-2.993a.75.75 0 0 1 0-1.06l3-2.993a.75.75 0 0 1 1.085.011Zm4.414 9.256a.75.75 0 0 1 1.06-.025l3 2.993a.75.75 0 0 1 0 1.06l-3 2.993a.75.75 0 1 1-1.061-1.06l1.716-1.708H4.25a.75.75 0 0 1 0-1.5h10.668l-1.716-1.708a.75.75 0 0 1-.025-1.06Z" clipRule="evenodd" />
            </svg>
            New upload
          </button>
        </div>
      </div>

      {/* Source file chip */}
      <div className="px-6 pt-4 pb-1">
        <span className="inline-flex items-center gap-1.5 rounded-md bg-slate-700/40 border border-slate-600/40 px-2.5 py-1 text-xs text-slate-400">
          <svg className="h-3.5 w-3.5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
            <path d="M3 3.5A1.5 1.5 0 0 1 4.5 2h6.879a1.5 1.5 0 0 1 1.06.44l4.122 4.12A1.5 1.5 0 0 1 17 7.622V16.5a1.5 1.5 0 0 1-1.5 1.5h-11A1.5 1.5 0 0 1 3 16.5v-13Z" />
          </svg>
          {data.sourceFile}
        </span>
      </div>

      {/* Data rows */}
      <div className="divide-y divide-slate-700/40">
        {rows.map((row, i) => (
          <div key={i} className="grid grid-cols-[200px_1fr] gap-4 px-6 py-4 hover:bg-white/[0.02] transition-colors duration-150">
            <div className="flex items-center gap-2.5 text-sm text-slate-500">
              <span className="text-slate-600">{row.icon}</span>
              <span className="font-medium">{row.label}</span>
            </div>
            <div className="flex items-center">{row.value}</div>
          </div>
        ))}
      </div>

      {/* ── Save to Pipeline banner ───────────────────────────────────────── */}
      <div className="px-6 py-5 border-t border-slate-700/40 bg-slate-900/40">
        {isSaved ? (
          <div className="flex items-center gap-3 rounded-xl border border-emerald-500/30 bg-emerald-500/8 px-5 py-3.5">
            <span className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-emerald-500/20 border border-emerald-500/30">
              <svg className="h-4 w-4 text-emerald-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M16.704 4.153a.75.75 0 0 1 .143 1.052l-8 10.5a.75.75 0 0 1-1.127.075l-4.5-4.5a.75.75 0 0 1 1.06-1.06l3.894 3.893 7.48-9.817a.75.75 0 0 1 1.05-.143Z" clipRule="evenodd" />
              </svg>
            </span>
            <div>
              <p className="text-sm font-semibold text-emerald-300">Saved to Pipeline ✓</p>
              <p className="text-xs text-slate-500 mt-0.5">Now searchable — type keywords below to find this candidate</p>
            </div>
          </div>
        ) : (
          <div className="flex items-center justify-between gap-4">
            <div className="min-w-0">
              <p className="text-sm font-medium text-slate-300">Save this candidate to your pipeline?</p>
              <p className="text-xs text-slate-600 mt-0.5">Once saved, you can search by name, skills, role, or seniority below.</p>
              {saveError && (
                <p className="text-xs text-red-400 mt-1.5">⚠ {saveError}</p>
              )}
            </div>
            <button
              id="save-candidate-btn"
              onClick={onSave}
              disabled={saving}
              className="flex flex-shrink-0 items-center gap-2 rounded-xl border border-violet-500/40 bg-violet-500/15 px-5 py-2.5 text-sm font-semibold text-violet-200 hover:bg-violet-500/25 hover:border-violet-400/60 hover:text-white active:scale-95 transition-all duration-200 shadow-lg shadow-violet-900/20 disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {saving ? (
                <>
                  <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 0 1 8-8V0C5.373 0 0 5.373 0 12h4Z" />
                  </svg>
                  Saving…
                </>
              ) : (
                <>
                  <svg className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                    <path d="M10.75 2.75a.75.75 0 0 0-1.5 0v8.614L6.295 8.235a.75.75 0 1 0-1.09 1.03l4.25 4.5a.75.75 0 0 0 1.09 0l4.25-4.5a.75.75 0 0 0-1.09-1.03l-2.955 3.129V2.75Z" />
                    <path d="M3.5 12.75a.75.75 0 0 0-1.5 0v2.5A2.75 2.75 0 0 0 4.75 18h10.5A2.75 2.75 0 0 0 18 15.25v-2.5a.75.75 0 0 0-1.5 0v2.5c0 .69-.56 1.25-1.25 1.25H4.75c-.69 0-1.25-.56-1.25-1.25v-2.5Z" />
                  </svg>
                  Save to Pipeline
                </>
              )}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Main ResumeProcessor component
// ─────────────────────────────────────────────────────────────────────────────
export default function ResumeProcessor({ onCandidateAdded }) {
  const [state, setState] = useState("idle");
  const [progress, setProgress] = useState(0);
  const [currentFile, setCurrentFile] = useState(null);
  const [extractedData, setExtractedData] = useState(null);
  const [apiError, setApiError] = useState(null);
  const [isSaved, setIsSaved] = useState(false);

  const handleFileAccepted = async (file) => {
    setCurrentFile(file);
    setApiError(null);
    setState("processing");
    setProgress(0);

    try {
      // Step 0: uploading (immediate)
      setProgress(0);

      // Short delay so users see the "Uploading" step animate before PDF parse
      await new Promise((r) => setTimeout(r, 400));
      setProgress(1); // → Extracting text

      const data = await callParseAPI(file); // real network call
      // By the time the API responds, both steps 1 & 2 have run server-side
      setProgress(2);

      // Brief pause so the "Gemini AI analysis" step is visible as complete
      await new Promise((r) => setTimeout(r, 600));

      setExtractedData(data);
      setState("done");
      // NOTE: candidate is NOT auto-saved — user must click "Save to Pipeline"
    } catch (err) {
      // Network-level failure (server not running / CORS / DNS)
      if (err instanceof TypeError && err.message.includes("fetch")) {
        err.code = "NETWORK_ERROR";
        err.message = "Could not reach the API server. Make sure it is running on port 3001.";
      }
      setApiError(err);
      setState("error");
    }
  };

  const handleReset = () => {
    setState("idle");
    setCurrentFile(null);
    setExtractedData(null);
    setApiError(null);
    setProgress(0);
    setIsSaved(false);
  };

  const [saveError, setSaveError] = useState(null);
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    if (!extractedData || typeof onCandidateAdded !== "function") return;
    setSaving(true);
    setSaveError(null);
    try {
      await onCandidateAdded(extractedData);
      setIsSaved(true);
    } catch (err) {
      setSaveError(err.message || "Failed to save. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  const statusLabel =
    state === "idle" ? "Ready"
    : state === "processing" ? "Processing…"
    : state === "done" ? "Complete"
    : "Error";

  const statusDot =
    state === "processing" ? "bg-yellow-400 animate-pulse"
    : state === "done" ? "bg-emerald-400"
    : state === "error" ? "bg-red-400"
    : "bg-slate-600";

  return (
    <section className="space-y-6">
      {/* Module header */}
      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-violet-500/15 border border-violet-500/25">
              <svg className="h-4 w-4 text-violet-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M4.5 2A1.5 1.5 0 0 0 3 3.5v13A1.5 1.5 0 0 0 4.5 18h11a1.5 1.5 0 0 0 1.5-1.5V7.621a1.5 1.5 0 0 0-.44-1.06l-4.12-4.122A1.5 1.5 0 0 0 11.378 2H4.5Zm2.25 8.5a.75.75 0 0 0 0 1.5h6.5a.75.75 0 0 0 0-1.5h-6.5Zm0 3a.75.75 0 0 0 0 1.5h6.5a.75.75 0 0 0 0-1.5h-6.5Z" clipRule="evenodd" />
              </svg>
            </span>
            <h2 className="text-lg font-semibold text-slate-100">Resume Processor</h2>
            <span className="rounded-full bg-violet-500/10 border border-violet-500/20 px-2 py-0.5 text-xs font-medium text-violet-400">
              Gemini AI
            </span>
          </div>
          <p className="text-sm text-slate-500">
            Upload a PDF resume and extract structured candidate data using Gemini 2.0 Flash.
          </p>
        </div>

        <div className="flex items-center gap-1.5 rounded-full border border-slate-700/60 bg-slate-800/60 px-3 py-1.5 text-xs text-slate-500 flex-shrink-0">
          <span className={`h-1.5 w-1.5 rounded-full transition-colors ${statusDot}`} />
          {statusLabel}
        </div>
      </div>

      {/* State machine panels */}
      {state === "idle" && <UploadArea onFileAccepted={handleFileAccepted} />}
      {state === "processing" && <ProcessingState fileName={currentFile?.name} progress={progress} />}
      {state === "done" && extractedData && (
        <ExtractedDataTable
          data={extractedData}
          onReset={handleReset}
          onSave={handleSave}
          isSaved={isSaved}
          saving={saving}
          saveError={saveError}
        />
      )}
      {state === "error" && apiError && (
        <ErrorState error={apiError} onRetry={handleReset} />
      )}
    </section>
  );
}
