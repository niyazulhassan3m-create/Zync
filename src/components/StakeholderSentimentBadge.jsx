import React from "react";

export default function StakeholderSentimentBadge({ score = 0.85, tag = "Positive", reasoning }) {
  const isPositive = tag === "Positive" || score >= 0.3;
  const isConcerned = tag === "Concerned" || score < -0.1;

  const badgeStyle = isPositive
    ? "bg-emerald-500/20 border-emerald-500/40 text-emerald-300"
    : isConcerned
    ? "bg-red-500/20 border-red-500/40 text-red-300"
    : "bg-sky-500/20 border-sky-500/40 text-sky-300";

  const icon = isPositive ? "🟢" : isConcerned ? "🔴" : "🔵";

  return (
    <div className="group relative inline-flex items-center">
      <span className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-[10px] font-bold ${badgeStyle}`}>
        <span>{icon}</span>
        <span>{tag} ({score > 0 ? `+${score}` : score})</span>
      </span>

      {reasoning && (
        <div className="absolute bottom-full left-1/2 mb-1.5 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-30 w-48 rounded-lg bg-slate-900 border border-slate-700 p-2 text-[10px] text-slate-300 shadow-xl">
          <p className="font-bold text-violet-300">Stakeholder Sentiment:</p>
          <p className="mt-0.5 italic">"{reasoning}"</p>
        </div>
      )}
    </div>
  );
}
