import React, { useState } from "react";
import StakeholderSentimentBadge from "./StakeholderSentimentBadge";
import MarketIntelligenceOverlayTooltip from "./MarketIntelligenceOverlayTooltip";
import SmartCommunicationModal from "./SmartCommunicationModal";

const ROLE_COLORS = {
  Technology:  "text-cyan-300 bg-cyan-500/10 border-cyan-500/25",
  Sales:       "text-emerald-300 bg-emerald-500/10 border-emerald-500/25",
  Education:   "text-amber-300 bg-amber-500/10 border-amber-500/25",
  Marketing:   "text-pink-300 bg-pink-500/10 border-pink-500/25",
  Finance:     "text-blue-300 bg-blue-500/10 border-blue-500/25",
  Operations:  "text-orange-300 bg-orange-500/10 border-orange-500/25",
  Healthcare:  "text-green-300 bg-green-500/10 border-green-500/25",
  Legal:       "text-purple-300 bg-purple-500/10 border-purple-500/25",
  Design:      "text-rose-300 bg-rose-500/10 border-rose-500/25",
  Other:       "text-slate-300 bg-slate-700/40 border-slate-600/30",
};

const SENIORITY_COLORS = {
  Intern:    "text-slate-400 bg-slate-700/30 border-slate-600/30",
  Junior:    "text-sky-300 bg-sky-500/10 border-sky-500/25",
  Mid:       "text-teal-300 bg-teal-500/10 border-teal-500/25",
  Senior:    "text-violet-300 bg-violet-500/10 border-violet-500/25",
  Lead:      "text-amber-300 bg-amber-500/10 border-amber-500/25",
  Executive: "text-rose-300 bg-rose-500/10 border-rose-500/25",
};

const SKILL_PALETTE = [
  "text-cyan-300 bg-cyan-500/10 border-cyan-500/25",
  "text-violet-300 bg-violet-500/10 border-violet-500/25",
  "text-emerald-300 bg-emerald-500/10 border-emerald-500/25",
];

function Badge({ label, colorMap }) {
  const cls = colorMap[label] ?? "text-slate-300 bg-slate-700/40 border-slate-600/30";
  return (
    <span className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium ${cls}`}>
      {label}
    </span>
  );
}

function EmptyState({ hasSearch }) {
  return (
    <div className="flex flex-col items-center justify-center py-20 gap-4">
      <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-800/60 border border-slate-700/60 text-2xl">
        {hasSearch ? "🔍" : "📋"}
      </div>
      <div className="text-center">
        <p className="text-sm font-semibold text-slate-300">
          {hasSearch ? "No candidates match your search" : "No candidates yet"}
        </p>
        <p className="mt-1 text-xs text-slate-600">
          {hasSearch
            ? "Try adjusting your filters or search terms"
            : "Upload a PDF resume above to add the first candidate"}
        </p>
      </div>
    </div>
  );
}

export default function CandidateTable({
  candidates,
  filteredCandidates,
  onExportCSV,
  onRemove,
  onClearAll,
}) {
  const isFiltered = filteredCandidates.length !== candidates.length;
  const hasSearch = candidates.length > 0 && filteredCandidates.length === 0;

  const [activeModalCandidate, setActiveModalCandidate] = useState(null);

  return (
    <div className="rounded-2xl border border-slate-700/60 bg-slate-800/40 overflow-hidden">
      {/* Table header */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-slate-700/60 bg-slate-800/70">
        <div className="flex items-center gap-2.5">
          <svg className="h-4 w-4 text-slate-500" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M.99 5.24A2.25 2.25 0 0 1 3.25 3h13.5A2.25 2.25 0 0 1 19 5.25l.01 9.5A2.25 2.25 0 0 1 16.76 17H3.26A2.267 2.267 0 0 1 1 14.74l-.01-9.5Zm8.26 9.52v-.001a.75.75 0 0 0 1.048.227 8.16 8.16 0 0 0 1.792-1.709.75.75 0 1 0-1.176-.937 6.63 6.63 0 0 1-.823.78l-.051-.014a.75.75 0 0 0-.79 1.654Zm4.816-8.027a8.145 8.145 0 0 0-2.003-1.394.75.75 0 1 0-.653 1.35 6.645 6.645 0 0 1 1.633 1.137.75.75 0 1 0 1.023-1.093ZM9.255 5.504A.75.75 0 0 0 8 5.75a6.633 6.633 0 0 1-1.452 4.17.75.75 0 1 0 1.17.94A8.133 8.133 0 0 0 9.503 6.25a.75.75 0 0 0-.248-.746Z" clipRule="evenodd" />
          </svg>
          <span className="text-sm font-semibold text-slate-200">Candidate Pipeline — Strategic Context</span>
          <span className="rounded-full bg-slate-700/60 border border-slate-600/40 px-2 py-0.5 text-xs font-medium text-slate-400">
            {isFiltered
              ? `${filteredCandidates.length} of ${candidates.length}`
              : candidates.length}
          </span>
        </div>

        <div className="flex items-center gap-2">
          {candidates.length > 0 && (
            <>
              <button
                id="export-csv-btn"
                onClick={() => onExportCSV(filteredCandidates)}
                disabled={filteredCandidates.length === 0}
                className="flex items-center gap-1.5 rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-3 py-1.5 text-xs font-medium text-emerald-400 hover:bg-emerald-500/20 transition-all duration-200 disabled:opacity-40 disabled:cursor-not-allowed"
              >
                <svg className="h-3.5 w-3.5" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 3a.75.75 0 0 1 .75.75v10.638l3.96-4.158a.75.75 0 1 1 1.08 1.04l-5.25 5.5a.75.75 0 0 1-1.08 0l-5.25-5.5a.75.75 0 1 1 1.08-1.04l3.96 4.158V3.75A.75.75 0 0 1 10 3Z" clipRule="evenodd" />
                </svg>
                Export CSV
                {isFiltered && (
                  <span className="opacity-70">({filteredCandidates.length})</span>
                )}
              </button>

              <button
                id="clear-all-btn"
                onClick={onClearAll}
                className="flex items-center gap-1.5 rounded-lg border border-slate-600/60 bg-slate-700/30 px-3 py-1.5 text-xs font-medium text-slate-500 hover:text-red-400 hover:border-red-500/30 transition-all duration-200"
              >
                Clear all
              </button>
            </>
          )}
        </div>
      </div>

      {/* Empty state */}
      {candidates.length === 0 || filteredCandidates.length === 0 ? (
        <EmptyState hasSearch={hasSearch} />
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-700/40 bg-slate-800/30">
                {["Candidate & Sentiment", "Role & Market Overlay", "Top Skills", "Exp.", "Execute Action", "Added"].map((h) => (
                  <th
                    key={h}
                    className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider whitespace-nowrap"
                  >
                    {h}
                  </th>
                ))}
                <th className="px-4 py-3 w-8" />
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-700/30">
              {filteredCandidates.map((c) => (
                <tr
                  key={c.id}
                  className="group hover:bg-white/[0.025] transition-colors duration-150"
                >
                  {/* Candidate & Sentiment */}
                  <td className="px-4 py-3.5 whitespace-nowrap">
                    <div className="flex flex-col gap-1">
                      <div className="flex items-center gap-2.5">
                        <div className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full bg-violet-500/20 border border-violet-500/30 text-xs font-bold text-violet-300">
                          {(c.fullName || "?")[0].toUpperCase()}
                        </div>
                        <span className="font-semibold text-slate-100">{c.fullName}</span>
                      </div>
                      {/* Stakeholder Sentiment Analysis Badge */}
                      <div className="pl-9">
                        <StakeholderSentimentBadge
                          score={c.seniorityLevel === "Executive" || c.seniorityLevel === "Lead" ? 0.9 : 0.75}
                          tag="Positive"
                          reasoning="High executive competency match"
                        />
                      </div>
                    </div>
                  </td>

                  {/* Role + Seniority + Market Intelligence Overlay */}
                  <td className="px-4 py-3.5 whitespace-nowrap">
                    <div className="flex flex-col gap-1">
                      <div className="flex items-center gap-1.5">
                        <Badge label={c.roleCategory} colorMap={ROLE_COLORS} />
                        <Badge label={c.seniorityLevel} colorMap={SENIORITY_COLORS} />
                      </div>
                      {/* Market Intelligence Overlay Tooltip */}
                      <MarketIntelligenceOverlayTooltip
                        roleCategory={c.roleCategory}
                        entityName={c.fullName}
                      />
                    </div>
                  </td>

                  {/* Skills */}
                  <td className="px-4 py-3.5">
                    <div className="flex flex-wrap gap-1">
                      {(c.skills || []).map((s, i) => (
                        <span
                          key={s}
                          className={`inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-medium ${SKILL_PALETTE[i % SKILL_PALETTE.length]}`}
                        >
                          {s}
                        </span>
                      ))}
                    </div>
                  </td>

                  {/* Experience */}
                  <td className="px-4 py-3.5 whitespace-nowrap">
                    <span className="font-mono font-semibold text-slate-200">{c.yearsOfExperience}</span>
                    <span className="ml-1 text-xs text-slate-600">yr</span>
                  </td>

                  {/* Execute Communication Action Button */}
                  <td className="px-4 py-3.5 whitespace-nowrap">
                    <button
                      onClick={() => setActiveModalCandidate(c)}
                      className="flex items-center gap-1.5 rounded-xl border border-violet-500/40 bg-gradient-to-r from-violet-500/20 to-purple-600/20 px-3 py-1.5 text-xs font-bold text-violet-200 hover:border-violet-400 hover:text-white transition-all shadow-md"
                    >
                      <span>⚡</span> Execute Comm
                    </button>
                  </td>

                  {/* Added */}
                  <td className="px-4 py-3.5 whitespace-nowrap">
                    <span className="text-xs text-slate-600">
                      {c.addedAt
                        ? new Date(c.addedAt).toLocaleDateString(undefined, {
                            month: "short",
                            day: "numeric",
                          })
                        : "—"}
                    </span>
                  </td>

                  {/* Delete */}
                  <td className="px-4 py-3.5">
                    <button
                      onClick={() => onRemove(c.id)}
                      className="opacity-0 group-hover:opacity-100 flex h-6 w-6 items-center justify-center rounded-md text-slate-600 hover:text-red-400 hover:bg-red-400/10 transition-all duration-150"
                      title="Remove candidate"
                    >
                      <svg className="h-3.5 w-3.5" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M8.75 1A2.75 2.75 0 0 0 6 3.75v.443c-.795.077-1.584.176-2.365.298a.75.75 0 1 0 .23 1.482l.149-.022.841 10.518A2.75 2.75 0 0 0 7.596 19h4.807a2.75 2.75 0 0 0 2.742-2.53l.841-10.52.149.023a.75.75 0 0 0 .23-1.482A41.03 41.03 0 0 0 14 4.193V3.75A2.75 2.75 0 0 0 11.25 1h-2.5ZM10 4c.84 0 1.673.025 2.5.075V3.75c0-.69-.56-1.25-1.25-1.25h-2.5c-.69 0-1.25.56-1.25 1.25v.325C8.327 4.025 9.16 4 10 4ZM8.58 7.72a.75.75 0 0 0-1.5.06l.3 7.5a.75.75 0 1 0 1.5-.06l-.3-7.5Zm4.34.06a.75.75 0 1 0-1.5-.06l-.3 7.5a.75.75 0 1 0 1.5.06l.3-7.5Z" clipRule="evenodd" />
                      </svg>
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Execute Communication Modal */}
      {activeModalCandidate && (
        <SmartCommunicationModal
          isOpen={!!activeModalCandidate}
          onClose={() => setActiveModalCandidate(null)}
          entityName={activeModalCandidate.fullName}
          roleCategory={activeModalCandidate.roleCategory}
        />
      )}
    </div>
  );
}
