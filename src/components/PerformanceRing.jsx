import React from "react";

export default function PerformanceRing({ percentage = 78, totalTasks = 18, completedTasks = 14, size = 120, strokeWidth = 10 }) {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (percentage / 100) * circumference;

  return (
    <div className="flex items-center gap-5 rounded-2xl border border-violet-500/30 bg-gradient-to-r from-slate-900/90 via-slate-800/80 to-purple-950/40 p-5 shadow-2xl relative overflow-hidden">
      {/* High-Quality SVG Performance Ring */}
      <div className="relative flex items-center justify-center flex-shrink-0">
        <svg width={size} height={size} className="transform -rotate-90">
          {/* Background circle */}
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke="#334155"
            strokeWidth={strokeWidth}
            fill="transparent"
          />
          {/* Progress gradient circle */}
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke="url(#performanceGradient)"
            strokeWidth={strokeWidth}
            fill="transparent"
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            strokeLinecap="round"
            className="transition-all duration-1000 ease-out"
          />
          <defs>
            <linearGradient id="performanceGradient" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#a855f7" />
              <stop offset="50%" stopColor="#8b5cf6" />
              <stop offset="100%" stopColor="#06b6d4" />
            </linearGradient>
          </defs>
        </svg>
        {/* Inner Percentage Label */}
        <div className="absolute flex flex-col items-center justify-center text-center">
          <span className="text-2xl font-black text-slate-100 tabular-nums leading-none">
            {percentage}%
          </span>
          <span className="text-[9px] font-bold text-violet-400 uppercase tracking-widest mt-0.5">
            Target
          </span>
        </div>
      </div>

      {/* Metrics breakdown */}
      <div className="space-y-1.5 flex-1 min-w-0">
        <div className="flex items-center justify-between">
          <span className="text-xs font-extrabold text-slate-100 flex items-center gap-1.5">
            <span>🎯</span> Executive Progress Visualizer
          </span>
          <span className="rounded-full bg-violet-500/20 border border-violet-500/30 px-2.5 py-0.5 text-[10px] font-bold text-violet-300">
            Zync powered by Lab-Y
          </span>
        </div>

        <p className="text-xs text-slate-400">
          Target completion rate calculated dynamically across active tasks, meetings & milestone goals.
        </p>

        <div className="flex items-center gap-4 text-xs pt-1">
          <div className="flex items-center gap-1.5 font-semibold text-emerald-400">
            <span className="h-2 w-2 rounded-full bg-emerald-400" />
            Completed: <span className="font-bold text-slate-200">{completedTasks}</span>
          </div>
          <div className="flex items-center gap-1.5 font-semibold text-amber-400">
            <span className="h-2 w-2 rounded-full bg-amber-400" />
            Pending: <span className="font-bold text-slate-200">{totalTasks - completedTasks}</span>
          </div>
          <div className="flex items-center gap-1.5 font-semibold text-cyan-400">
            Total Target: <span className="font-bold text-slate-200">{totalTasks}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
