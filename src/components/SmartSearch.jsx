import { useState, useEffect, useRef, useCallback } from "react";
import Fuse from "fuse.js";

// ─────────────────────────────────────────────────────────────────────────────
// Dropdown multi-select filter
// ─────────────────────────────────────────────────────────────────────────────
function FilterDropdown({ label, options, selected, onChange }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    const handler = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const toggle = (option) => {
    onChange(
      selected.includes(option)
        ? selected.filter((s) => s !== option)
        : [...selected, option]
    );
  };

  const hasSelection = selected.length > 0;

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen((o) => !o)}
        className={`flex items-center gap-2 rounded-lg border px-3 py-2 text-sm font-medium transition-all duration-200 ${
          hasSelection
            ? "border-violet-500/50 bg-violet-500/10 text-violet-300"
            : "border-slate-700/60 bg-slate-800/40 text-slate-400 hover:border-slate-600 hover:text-slate-300"
        }`}
      >
        <span>{label}</span>
        {hasSelection && (
          <span className="flex h-4 w-4 items-center justify-center rounded-full bg-violet-500 text-xs font-bold text-white leading-none">
            {selected.length}
          </span>
        )}
        <svg
          className={`h-3.5 w-3.5 transition-transform duration-200 ${open ? "rotate-180" : ""}`}
          viewBox="0 0 20 20" fill="currentColor"
        >
          <path fillRule="evenodd" d="M5.22 8.22a.75.75 0 0 1 1.06 0L10 11.94l3.72-3.72a.75.75 0 1 1 1.06 1.06l-4.25 4.25a.75.75 0 0 1-1.06 0L5.22 9.28a.75.75 0 0 1 0-1.06Z" clipRule="evenodd" />
        </svg>
      </button>

      {open && (
        <div className="absolute top-full left-0 z-50 mt-1.5 min-w-[160px] rounded-xl border border-slate-700/60 bg-slate-900 shadow-xl shadow-black/40 overflow-hidden">
          {options.length === 0 ? (
            <p className="px-3 py-2.5 text-xs text-slate-600">No options yet</p>
          ) : (
            options.map((opt) => (
              <button
                key={opt}
                onClick={() => toggle(opt)}
                className="flex w-full items-center gap-2.5 px-3 py-2.5 text-sm hover:bg-slate-800/60 transition-colors"
              >
                <span className={`flex h-4 w-4 flex-shrink-0 items-center justify-center rounded border transition-colors ${
                  selected.includes(opt)
                    ? "border-violet-500 bg-violet-500"
                    : "border-slate-600 bg-transparent"
                }`}>
                  {selected.includes(opt) && (
                    <svg className="h-2.5 w-2.5 text-white" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 0 1 0 1.414l-8 8a1 1 0 0 1-1.414 0l-4-4a1 1 0 0 1 1.414-1.414L8 12.586l7.293-7.293a1 1 0 0 1 1.414 0Z" clipRule="evenodd" />
                    </svg>
                  )}
                </span>
                <span className={selected.includes(opt) ? "text-slate-200" : "text-slate-400"}>{opt}</span>
              </button>
            ))
          )}
          {hasSelection && (
            <div className="border-t border-slate-800 px-3 py-2">
              <button
                onClick={() => onChange([])}
                className="text-xs text-slate-500 hover:text-slate-300 transition-colors"
              >
                Clear filter
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Active filter chip
// ─────────────────────────────────────────────────────────────────────────────
function FilterChip({ label, onRemove }) {
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full border border-violet-500/30 bg-violet-500/10 px-2.5 py-1 text-xs font-medium text-violet-300">
      {label}
      <button
        onClick={onRemove}
        className="flex h-3.5 w-3.5 items-center justify-center rounded-full hover:bg-violet-500/30 transition-colors"
      >
        <svg className="h-2.5 w-2.5" viewBox="0 0 20 20" fill="currentColor">
          <path d="M6.28 5.22a.75.75 0 0 0-1.06 1.06L8.94 10l-3.72 3.72a.75.75 0 1 0 1.06 1.06L10 11.06l3.72 3.72a.75.75 0 1 0 1.06-1.06L11.06 10l3.72-3.72a.75.75 0 0 0-1.06-1.06L10 8.94 6.28 5.22Z" />
        </svg>
      </button>
    </span>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// SmartSearch — main exported component
// ─────────────────────────────────────────────────────────────────────────────
export default function SmartSearch({
  candidates,
  roleCategories,
  seniorityLevels,
  onResults,
}) {
  const [query, setQuery] = useState("");
  const [roleFilter, setRoleFilter] = useState([]);
  const [seniorityFilter, setSeniorityFilter] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const debounceRef = useRef(null);

  // Build Fuse instance whenever candidates change
  const fuseRef = useRef(null);
  useEffect(() => {
    fuseRef.current = new Fuse(candidates, {
      keys: [
        { name: "fullName", weight: 0.4 },
        { name: "skills", weight: 0.3 },
        { name: "roleCategory", weight: 0.15 },
        { name: "seniorityLevel", weight: 0.1 },
        { name: "email", weight: 0.05 },
      ],
      threshold: 0.4,       // 0 = exact, 1 = match anything
      includeScore: true,
      minMatchCharLength: 2,
    });
  }, [candidates]);

  const runSearch = useCallback(
    (q, roles, seniorities) => {
      setIsSearching(true);

      // Run in next tick so the spinner renders first
      setTimeout(() => {
        let results = candidates;

        // 1. Fuzzy text search
        if (q.trim().length >= 2 && fuseRef.current) {
          results = fuseRef.current.search(q).map((r) => r.item);
        }

        // 2. Metadata filters
        if (roles.length > 0) {
          results = results.filter((c) => roles.includes(c.roleCategory));
        }
        if (seniorities.length > 0) {
          results = results.filter((c) => seniorities.includes(c.seniorityLevel));
        }

        onResults(results);
        setIsSearching(false);
      }, 0);
    },
    [candidates, onResults]
  );

  // Debounced text search
  const handleQueryChange = (e) => {
    const q = e.target.value;
    setQuery(q);
    clearTimeout(debounceRef.current);
    setIsSearching(true);
    debounceRef.current = setTimeout(() => {
      runSearch(q, roleFilter, seniorityFilter);
    }, 300);
  };

  // Immediate filter change
  const handleRoleChange = (roles) => {
    setRoleFilter(roles);
    runSearch(query, roles, seniorityFilter);
  };

  const handleSeniorityChange = (seniorities) => {
    setSeniorityFilter(seniorities);
    runSearch(query, roleFilter, seniorities);
  };

  const clearAll = () => {
    setQuery("");
    setRoleFilter([]);
    setSeniorityFilter([]);
    onResults(candidates);
  };

  const hasFilters = query.trim().length > 0 || roleFilter.length > 0 || seniorityFilter.length > 0;

  return (
    <div className="space-y-3">
      {/* Search bar + dropdowns row */}
      <div className="flex flex-wrap items-center gap-2">
        {/* Text search */}
        <div className="relative flex-1 min-w-[240px]">
          <div className="pointer-events-none absolute inset-y-0 left-3 flex items-center">
            {isSearching ? (
              <svg className="h-4 w-4 text-violet-400 animate-spin" viewBox="0 0 24 24" fill="none">
                <circle cx="12" cy="12" r="10" stroke="currentColor" strokeOpacity=".2" strokeWidth="2.5" />
                <path d="M12 2a10 10 0 0 1 10 10" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
              </svg>
            ) : (
              <svg className="h-4 w-4 text-slate-500" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M9 3.5a5.5 5.5 0 1 0 0 11 5.5 5.5 0 0 0 0-11ZM2 9a7 7 0 1 1 12.452 4.391l3.328 3.329a.75.75 0 1 1-1.06 1.06l-3.329-3.328A7 7 0 0 1 2 9Z" clipRule="evenodd" />
              </svg>
            )}
          </div>
          <input
            id="smart-search-input"
            type="text"
            value={query}
            onChange={handleQueryChange}
            placeholder='Smart Search — try "senior ML engineer" or "sales"…'
            className="w-full rounded-xl border border-slate-700/60 bg-slate-800/40 py-2.5 pl-10 pr-4 text-sm text-slate-200 placeholder-slate-600 outline-none focus:border-violet-500/60 focus:bg-slate-800/70 focus:ring-1 focus:ring-violet-500/30 transition-all duration-200"
          />
          {query && (
            <button
              onClick={() => { setQuery(""); runSearch("", roleFilter, seniorityFilter); }}
              className="absolute inset-y-0 right-3 flex items-center text-slate-600 hover:text-slate-400 transition-colors"
            >
              <svg className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                <path d="M6.28 5.22a.75.75 0 0 0-1.06 1.06L8.94 10l-3.72 3.72a.75.75 0 1 0 1.06 1.06L10 11.06l3.72 3.72a.75.75 0 1 0 1.06-1.06L11.06 10l3.72-3.72a.75.75 0 0 0-1.06-1.06L10 8.94 6.28 5.22Z" />
              </svg>
            </button>
          )}
        </div>

        {/* Dropdowns */}
        <FilterDropdown
          label="Role"
          options={roleCategories}
          selected={roleFilter}
          onChange={handleRoleChange}
        />
        <FilterDropdown
          label="Seniority"
          options={seniorityLevels}
          selected={seniorityFilter}
          onChange={handleSeniorityChange}
        />

        {/* Clear all */}
        {hasFilters && (
          <button
            onClick={clearAll}
            className="text-xs text-slate-500 hover:text-slate-300 transition-colors px-1"
          >
            Clear all
          </button>
        )}
      </div>

      {/* Active filter chips */}
      {hasFilters && (
        <div className="flex flex-wrap gap-1.5">
          {query.trim() && (
            <FilterChip
              label={`"${query.trim()}"`}
              onRemove={() => { setQuery(""); runSearch("", roleFilter, seniorityFilter); }}
            />
          )}
          {roleFilter.map((r) => (
            <FilterChip
              key={r}
              label={r}
              onRemove={() => handleRoleChange(roleFilter.filter((x) => x !== r))}
            />
          ))}
          {seniorityFilter.map((s) => (
            <FilterChip
              key={s}
              label={s}
              onRemove={() => handleSeniorityChange(seniorityFilter.filter((x) => x !== s))}
            />
          ))}
        </div>
      )}
    </div>
  );
}
