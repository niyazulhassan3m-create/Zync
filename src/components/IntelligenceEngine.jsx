import { useState, useEffect } from "react";
import { useCandidates } from "../store/useCandidates";
import SmartSearch from "./SmartSearch";
import CandidateTable from "./CandidateTable";
import ResumeProcessor from "./ResumeProcessor";

export default function IntelligenceEngine() {
  const {
    candidates,
    loading,
    supabaseReady,
    fetchError,
    addCandidate,
    removeCandidate,
    clearAll,
    exportCSV,
    roleCategories,
    seniorityLevels,
  } = useCandidates();

  const [filteredCandidates, setFilteredCandidates] = useState(candidates);

  useEffect(() => {
    setFilteredCandidates(candidates);
  }, [candidates]);

  const handleCandidateAdded = async (data) => {
    try {
      await addCandidate(data);
    } catch (err) {
      console.error("[IntelligenceEngine] save failed:", err.message);
      // Surface save errors — rethrow so ResumeProcessor can catch them
      throw err;
    }
  };

  return (
    <div className="space-y-8">
      {/* ── Supabase status banner ───────────────────────────────────────── */}
      {fetchError ? (
        <div className="flex items-center gap-3 rounded-xl border border-red-500/20 bg-red-500/5 px-4 py-3 text-sm">
          <span className="text-lg">🔌</span>
          <span className="text-red-400">{fetchError} Make sure the API server is running.</span>
        </div>
      ) : supabaseReady ? (
        <div className="flex items-center gap-2 rounded-xl border border-emerald-500/20 bg-emerald-500/5 px-4 py-2.5 text-xs">
          <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
          <span className="text-emerald-400 font-medium">Supabase connected</span>
          <span className="text-slate-600">— candidates are saved to the cloud</span>
        </div>
      ) : (
        <div className="flex items-center gap-2 rounded-xl border border-amber-500/20 bg-amber-500/5 px-4 py-2.5 text-xs">
          <span className="text-lg">⚠️</span>
          <span className="text-amber-400 font-medium">Supabase not connected</span>
          <span className="text-slate-600">— add SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY to server/.env</span>
        </div>
      )}

      {/* ── Upload section ───────────────────────────────────────────────────── */}
      <ResumeProcessor onCandidateAdded={handleCandidateAdded} />

      {/* ── Divider ─────────────────────────────────────────────────────────── */}
      <div className="relative">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-slate-800/80" />
        </div>
        <div className="relative flex justify-center">
          <span className="flex items-center gap-2 bg-[#0a0f1e] px-4 text-xs text-slate-600">
            <svg className="h-3.5 w-3.5" viewBox="0 0 20 20" fill="currentColor">
              <path d="M10 2a.75.75 0 0 1 .75.75v1.5a.75.75 0 0 1-1.5 0v-1.5A.75.75 0 0 1 10 2ZM10 15a.75.75 0 0 1 .75.75v1.5a.75.75 0 0 1-1.5 0v-1.5A.75.75 0 0 1 10 15ZM10 7a3 3 0 1 0 0 6 3 3 0 0 0 0-6ZM15.657 5.404a.75.75 0 1 0-1.06-1.06l-1.061 1.06a.75.75 0 0 0 1.06 1.061l1.06-1.061ZM6.464 14.596a.75.75 0 1 0-1.06-1.06l-1.06 1.06a.75.75 0 0 0 1.06 1.06l1.06-1.06ZM18 10a.75.75 0 0 1-.75.75h-1.5a.75.75 0 0 1 0-1.5h1.5A.75.75 0 0 1 18 10ZM5 10a.75.75 0 0 1-.75.75h-1.5a.75.75 0 0 1 0-1.5h1.5A.75.75 0 0 1 5 10ZM14.596 15.657a.75.75 0 0 0 1.06-1.06l-1.06-1.061a.75.75 0 1 0-1.061 1.06l1.061 1.061ZM5.404 6.464a.75.75 0 0 0 1.06-1.06L5.404 4.343a.75.75 0 1 0-1.06 1.06l1.06 1.061Z" />
            </svg>
            Candidate Intelligence
          </span>
        </div>
      </div>

      {/* ── Smart Search ─────────────────────────────────────────────────────── */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-violet-500/15 border border-violet-500/25">
                <svg className="h-4 w-4 text-violet-400" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M9 3.5a5.5 5.5 0 1 0 0 11 5.5 5.5 0 0 0 0-11ZM2 9a7 7 0 1 1 12.452 4.391l3.328 3.329a.75.75 0 1 1-1.06 1.06l-3.329-3.328A7 7 0 0 1 2 9Z" clipRule="evenodd" />
                </svg>
              </span>
              <h2 className="text-lg font-semibold text-slate-100">Smart Search</h2>
              <span className="rounded-full bg-violet-500/10 border border-violet-500/20 px-2 py-0.5 text-xs font-medium text-violet-400">
                Fuse.js
              </span>
            </div>
            <p className="text-sm text-slate-500">
              Fuzzy semantic search across all fields — filters update the table in real time.
            </p>
          </div>
        </div>

        <SmartSearch
          candidates={candidates}
          roleCategories={roleCategories}
          seniorityLevels={seniorityLevels}
          onResults={setFilteredCandidates}
        />
      </div>

      {/* ── Candidate Table ──────────────────────────────────────────────────── */}
      <CandidateTable
        candidates={candidates}
        filteredCandidates={filteredCandidates}
        onExportCSV={exportCSV}
        onRemove={removeCandidate}
        onClearAll={clearAll}
      />
    </div>
  );
}
