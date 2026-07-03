import React from "react";

export default function MarketIntelligenceOverlayTooltip({ roleCategory = "Technology", entityName = "Executive Candidate" }) {
  const isTech = roleCategory?.toLowerCase().includes("tech") || roleCategory?.toLowerCase().includes("engineer");

  return (
    <div className="group relative inline-flex items-center">
      <span className="inline-flex items-center gap-1 rounded-full bg-cyan-500/15 border border-cyan-500/30 px-2.5 py-0.5 text-[10px] font-bold text-cyan-300 cursor-pointer hover:border-cyan-400 transition-colors">
        <span>🌐</span>
        <span>Strategic Context</span>
      </span>

      {/* Popover / Tooltip */}
      <div className="absolute bottom-full left-1/2 mb-2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-all pointer-events-none z-30 w-64 rounded-xl bg-slate-900/95 border border-cyan-500/40 p-3 text-[11px] text-slate-200 shadow-2xl space-y-1.5 backdrop-blur-md">
        <div className="flex items-center justify-between border-b border-slate-800 pb-1">
          <span className="font-bold text-cyan-300">Market Intelligence Overlay</span>
          <span className="text-[9px] text-slate-500 font-mono">Lab-Y</span>
        </div>

        <p className="text-slate-300 font-medium">
          {isTech
            ? "High hiring velocity (+28% YOY demand increase in AI & Software Engineering)."
            : "Stable executive demand with high retention benchmarks across Q3."}
        </p>

        <div className="pt-1 flex flex-col gap-1 text-[10px] text-slate-400">
          <div className="flex justify-between">
            <span>Hiring Velocity:</span>
            <span className="font-bold text-emerald-400">94/100 (High Priority)</span>
          </div>
          <div className="flex justify-between">
            <span>Salary Benchmark:</span>
            <span className="font-mono font-bold text-cyan-300">$145k – $185k / yr</span>
          </div>
        </div>
      </div>
    </div>
  );
}
