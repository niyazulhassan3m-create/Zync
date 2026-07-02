import IntelligenceEngine from "./components/IntelligenceEngine";
import { useCandidates } from "./store/useCandidates";

const navItems = [
  {
    id: "resume",
    label: "Resume Processor",
    icon: (
      <svg className="h-4.5 w-4.5" viewBox="0 0 20 20" fill="currentColor">
        <path fillRule="evenodd" d="M4.5 2A1.5 1.5 0 0 0 3 3.5v13A1.5 1.5 0 0 0 4.5 18h11a1.5 1.5 0 0 0 1.5-1.5V7.621a1.5 1.5 0 0 0-.44-1.06l-4.12-4.122A1.5 1.5 0 0 0 11.378 2H4.5Zm2.25 8.5a.75.75 0 0 0 0 1.5h6.5a.75.75 0 0 0 0-1.5h-6.5Zm0 3a.75.75 0 0 0 0 1.5h6.5a.75.75 0 0 0 0-1.5h-6.5Z" clipRule="evenodd" />
      </svg>
    ),
    badge: "New",
    active: true,
  },
  {
    id: "analytics",
    label: "Analytics",
    icon: (
      <svg className="h-4.5 w-4.5" viewBox="0 0 20 20" fill="currentColor">
        <path d="M15.5 2A1.5 1.5 0 0 0 14 3.5v13a1.5 1.5 0 0 0 3 0v-13A1.5 1.5 0 0 0 15.5 2ZM9.5 6A1.5 1.5 0 0 0 8 7.5v9a1.5 1.5 0 0 0 3 0v-9A1.5 1.5 0 0 0 9.5 6ZM3.5 10A1.5 1.5 0 0 0 2 11.5v5a1.5 1.5 0 0 0 3 0v-5A1.5 1.5 0 0 0 3.5 10Z" />
      </svg>
    ),
    active: false,
  },
  {
    id: "pipeline",
    label: "Pipeline",
    icon: (
      <svg className="h-4.5 w-4.5" viewBox="0 0 20 20" fill="currentColor">
        <path d="M3.505 2.365A41.369 41.369 0 0 1 9 2c1.863 0 3.697.124 5.495.365 1.247.167 2.18 1.108 2.435 2.268a4.45 4.45 0 0 0-.577-.069 43.141 43.141 0 0 0-4.706 0C9.229 4.696 7.5 6.727 7.5 9v.948c0 .965.694 1.946 1.703 2.187.87.21 1.7.42 2.797.42.668 0 1.288-.152 1.85-.416.563-.265.986-.656 1.15-1.072.35-.904.35-1.98 0-2.884-.165-.416-.587-.807-1.15-1.072A4.517 4.517 0 0 0 12 7H9.5a.5.5 0 0 0 0 1h.5c.346 0 .67.044.97.128-.253.092-.476.22-.645.378a.75.75 0 0 0 .075 1.19c.178.118.38.18.6.18.22 0 .422-.062.6-.18a.75.75 0 0 0 .075-1.19 2.03 2.03 0 0 0-.645-.378c.3-.084.624-.128.97-.128h.3a2.5 2.5 0 0 1 2.5 2.5v.5a2.5 2.5 0 0 1-5 0v-.5c0-.966-.52-1.948-1.5-2.39V9c0-1.933 1.337-3.613 3.197-3.77a41.29 41.29 0 0 1 4.557 0c.148.013.291.03.432.052C19.027 6.077 19.5 7.474 19.5 9v3.27a3.002 3.002 0 0 1-2.5 2.964V18a.75.75 0 0 1-1.5 0v-2.766A3.002 3.002 0 0 1 13 12.27V9a1.5 1.5 0 0 0-1.5-1.5h-.5V6h1.5c.667 0 1.3.117 1.893.329C13.26 5.197 11.749 4 10 4c-1.749 0-3.26 1.197-3.393 2.829A5.5 5.5 0 0 1 8.5 6H9V9h-.5A1.5 1.5 0 0 0 7 10.5v.277A3 3 0 0 1 4.5 13.5H4a.5.5 0 0 1-.5-.5v-1.5A1.5 1.5 0 0 1 5 10v-.5A3.5 3.5 0 0 0 1.5 6h-.25a.75.75 0 0 0 0 1.5H1.5A2 2 0 0 1 3.5 9.5V10a3 3 0 0 0-2 2.829V13a2 2 0 0 0 2 2h.5a1.5 1.5 0 0 0 1.5-1.5V13a1.5 1.5 0 0 1 1.5-1.5h.5V9.5A.5.5 0 0 0 7 9H6.5V6.5l-.005-.005A.498.498 0 0 0 6 6.5H5a.5.5 0 0 0 0 1h.5v.5A.5.5 0 0 1 5 8H4.5A2.5 2.5 0 0 0 2 10.5V12a.5.5 0 0 0 .5.5h1A.5.5 0 0 0 4 12v-1.5A1.5 1.5 0 0 1 5.5 9H6a1.5 1.5 0 0 1 1.5 1.5V12a2.5 2.5 0 0 1-2.5 2.5H3.5A2.5 2.5 0 0 1 1 12v-.5A3.5 3.5 0 0 1 4.5 8H5V6.5l-.005-.005A2.5 2.5 0 0 0 2.5 9H2a.5.5 0 0 0 0 1h.5V12a1.5 1.5 0 0 0 1.5 1.5H5a1.5 1.5 0 0 0 1.5-1.5V9.5A.5.5 0 0 1 7 9h.5a.5.5 0 0 1 .5.5V12a2.5 2.5 0 0 0 2.5 2.5h1A2.5 2.5 0 0 0 14 12V9.5a.5.5 0 0 1 .5-.5h.5a.5.5 0 0 1 .5.5V12a1.5 1.5 0 0 0 1.5 1.5h.5A1.5 1.5 0 0 0 19 12V9a7.002 7.002 0 0 0-6.505-6.982A41.37 41.37 0 0 0 9 2a41.369 41.369 0 0 0-5.495.365C2.258 2.532 1.326 3.473 1.07 4.633 1.025 4.754 1 4.874 1 5v6a4 4 0 0 0 4 4h1.5A2.5 2.5 0 0 0 9 12.5V9a.5.5 0 0 0-.5-.5H8a.5.5 0 0 0 0 1h.5V12a1.5 1.5 0 0 1-1.5 1.5H5A3 3 0 0 1 2 10.5V5a.5.5 0 0 1 .005-.073 3.5 3.5 0 0 1 1.5-2.562Z" />
      </svg>
    ),
    active: false,
  },
  {
    id: "settings",
    label: "Settings",
    icon: (
      <svg className="h-4.5 w-4.5" viewBox="0 0 20 20" fill="currentColor">
        <path fillRule="evenodd" d="M7.84 1.804A1 1 0 0 1 8.82 1h2.36a1 1 0 0 1 .98.804l.331 1.652a6.993 6.993 0 0 1 1.929 1.115l1.598-.54a1 1 0 0 1 1.186.447l1.18 2.044a1 1 0 0 1-.205 1.251l-1.267 1.113a7.047 7.047 0 0 1 0 2.228l1.267 1.113a1 1 0 0 1 .205 1.251l-1.18 2.044a1 1 0 0 1-1.186.447l-1.598-.54a6.993 6.993 0 0 1-1.929 1.115l-.33 1.652a1 1 0 0 1-.98.804H8.82a1 1 0 0 1-.98-.804l-.331-1.652a6.993 6.993 0 0 1-1.929-1.115l-1.598.54a1 1 0 0 1-1.186-.447l-1.18-2.044a1 1 0 0 1 .205-1.251l1.267-1.113a7.047 7.047 0 0 1 0-2.228L1.821 7.773a1 1 0 0 1-.205-1.251l1.18-2.044a1 1 0 0 1 1.186-.447l1.598.54A6.993 6.993 0 0 1 7.51 3.456l.33-1.652ZM10 13a3 3 0 1 0 0-6 3 3 0 0 0 0 6Z" clipRule="evenodd" />
      </svg>
    ),
    active: false,
  },
];

export default function App() {
  const { candidates } = useCandidates();

  const totalCandidates = candidates.length;
  const avgExp = candidates.length > 0
    ? (candidates.reduce((s, c) => s + (c.yearsOfExperience ?? 0), 0) / candidates.length).toFixed(1)
    : "—";
  const topRole = candidates.length > 0
    ? Object.entries(
        candidates.reduce((acc, c) => {
          acc[c.roleCategory] = (acc[c.roleCategory] || 0) + 1;
          return acc;
        }, {})
      ).sort((a, b) => b[1] - a[1])[0]?.[0] ?? "—"
    : "—";

  const stats = [
    { label: "Total Candidates", value: totalCandidates, delta: "All time", color: "violet" },
    { label: "Avg. Experience", value: avgExp === "—" ? "—" : `${avgExp} yrs`, delta: "Across pipeline", color: "emerald" },
    { label: "Top Role", value: topRole, delta: "Most common", color: "cyan" },
  ];

  return (
    <div className="flex h-screen bg-[#0a0f1e] text-slate-300 overflow-hidden font-sans">
      {/* ── Sidebar ─────────────────────────────────────────────────────────── */}
      <aside className="flex w-60 flex-col border-r border-slate-800/60 bg-slate-900/50 flex-shrink-0">
        {/* Logo */}
        <div className="flex items-center gap-2.5 px-5 py-5 border-b border-slate-800/60">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-violet-500 to-purple-600 shadow-lg shadow-violet-900/40">
            <svg className="h-4.5 w-4.5 text-white" viewBox="0 0 20 20" fill="currentColor">
              <path d="M15.98 1.804a1 1 0 0 0-1.96 0l-.24 1.192a1 1 0 0 1-.784.785l-1.192.239a1 1 0 0 0 0 1.962l1.192.24a1 1 0 0 1 .785.785l.239 1.192a1 1 0 0 0 1.962 0l.24-1.192a1 1 0 0 1 .785-.786l1.192-.239a1 1 0 0 0 0-1.962l-1.192-.24a1 1 0 0 1-.786-.784l-.239-1.192ZM6.949 5.684a1 1 0 0 0-1.898 0l-.683 2.051a1 1 0 0 1-.633.633l-2.051.683a1 1 0 0 0 0 1.898l2.051.684a1 1 0 0 1 .633.632l.683 2.051a1 1 0 0 0 1.898 0l.683-2.051a1 1 0 0 1 .633-.633l2.051-.683a1 1 0 0 0 0-1.898l-2.051-.683a1 1 0 0 1-.633-.633L6.95 5.684Z" />
            </svg>
          </div>
          <div>
            <p className="text-sm font-bold text-slate-100 leading-none">Founder's</p>
            <p className="text-xs text-slate-500 leading-tight">Command Center</p>
          </div>
        </div>

        {/* Nav */}
        <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
          <p className="px-2 py-2 text-xs font-semibold text-slate-600 uppercase tracking-widest">Modules</p>
          {navItems.map((item) => (
            <button
              key={item.id}
              id={`nav-${item.id}`}
              className={`w-full flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-200 text-left group
                ${item.active
                  ? "bg-violet-500/15 text-violet-300 border border-violet-500/20"
                  : "text-slate-500 hover:text-slate-300 hover:bg-slate-800/60"
                }`}
            >
              <span className={`flex-shrink-0 transition-colors ${item.active ? "text-violet-400" : "text-slate-600 group-hover:text-slate-400"}`}>
                {item.icon}
              </span>
              <span className="flex-1 truncate">{item.label}</span>
              {item.badge && (
                <span className="rounded-full bg-violet-500/20 border border-violet-500/30 px-1.5 py-0.5 text-xs font-medium text-violet-400 leading-none">
                  {item.badge}
                </span>
              )}
            </button>
          ))}
        </nav>

        {/* User section */}
        <div className="border-t border-slate-800/60 p-3">
          <div className="flex items-center gap-2.5 rounded-lg px-2 py-2.5 hover:bg-slate-800/50 transition-colors cursor-pointer">
            <div className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-violet-500 to-purple-600 text-xs font-bold text-white">
              F
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-xs font-medium text-slate-200 truncate">Founder</p>
              <p className="text-xs text-slate-600 truncate">Pro Plan</p>
            </div>
            <svg className="h-4 w-4 text-slate-600 flex-shrink-0" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M10 3a.75.75 0 0 1 .55.24l3.25 3.5a.75.75 0 1 1-1.1 1.02L10 4.852 7.3 7.76a.75.75 0 0 1-1.1-1.02l3.25-3.5A.75.75 0 0 1 10 3Zm-3.76 9.2a.75.75 0 0 1 1.06.04l2.7 2.908 2.7-2.908a.75.75 0 1 1 1.1 1.02l-3.25 3.5a.75.75 0 0 1-1.1 0l-3.25-3.5a.75.75 0 0 1 .04-1.06Z" clipRule="evenodd" />
            </svg>
          </div>
        </div>
      </aside>

      {/* ── Main content ─────────────────────────────────────────────────────── */}
      <div className="flex flex-1 flex-col min-w-0 overflow-hidden">
        {/* Top bar */}
        <header className="flex items-center justify-between px-8 py-4 border-b border-slate-800/60 bg-slate-900/30 backdrop-blur-sm flex-shrink-0">
          <div>
            <h1 className="text-xl font-bold text-slate-100">SaaS Founder's Command Center</h1>
            <p className="text-xs text-slate-500 mt-0.5">AI-powered tools to accelerate your growth</p>
          </div>

          <div className="flex items-center gap-3">
            {/* Search */}
            <div className="flex items-center gap-2 rounded-lg border border-slate-700/60 bg-slate-800/40 px-3 py-1.5">
              <svg className="h-4 w-4 text-slate-500" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M9 3.5a5.5 5.5 0 1 0 0 11 5.5 5.5 0 0 0 0-11ZM2 9a7 7 0 1 1 12.452 4.391l3.328 3.329a.75.75 0 1 1-1.06 1.06l-3.329-3.328A7 7 0 0 1 2 9Z" clipRule="evenodd" />
              </svg>
              <input
                type="text"
                placeholder="Search modules…"
                className="bg-transparent text-sm text-slate-300 placeholder-slate-600 outline-none w-36"
              />
            </div>

            {/* Notif bell */}
            <button id="notif-btn" className="relative flex h-9 w-9 items-center justify-center rounded-lg border border-slate-700/60 bg-slate-800/40 text-slate-500 hover:text-slate-300 hover:border-slate-600 transition-all">
              <svg className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M4 8a6 6 0 1 1 12 0v2.917c0 .26.045.518.132.764l1.256 3.516a1 1 0 0 1-.94 1.303H3.552a1 1 0 0 1-.94-1.303l1.256-3.516A2.75 2.75 0 0 0 4 10.917V8Zm6 12a3.001 3.001 0 0 1-2.83-2h5.66A3.001 3.001 0 0 1 10 20Z" clipRule="evenodd" />
              </svg>
              <span className="absolute top-1.5 right-1.5 h-1.5 w-1.5 rounded-full bg-violet-400" />
            </button>
          </div>
        </header>

        {/* Content area */}
        <main className="flex-1 overflow-y-auto p-8">
          <div className="grid grid-cols-3 gap-4 mb-8">
            {stats.map((stat) => (
              <div key={stat.label} className="rounded-xl border border-slate-700/60 bg-slate-800/30 px-5 py-4">
                <p className="text-xs font-medium text-slate-500 mb-1">{stat.label}</p>
                <p className="text-2xl font-bold text-slate-100 tabular-nums truncate">{stat.value}</p>
                <p className={`text-xs mt-1 ${
                  stat.color === "violet" ? "text-violet-400" :
                  stat.color === "emerald" ? "text-emerald-400" : "text-cyan-400"
                }`}>
                  {stat.delta}
                </p>
              </div>
            ))}
          </div>

          <IntelligenceEngine />
        </main>
      </div>
    </div>
  );
}
