import { useState, useEffect, useCallback } from "react";

// ─────────────────────────────────────────────────────────────────────────────
// useCandidates — Supabase-backed candidate store
// All persistence goes through the Express backend → Supabase.
// localStorage is used only as a read-cache to prevent flicker on reload.
// ─────────────────────────────────────────────────────────────────────────────
const CACHE_KEY = "founders_candidates_cache";

function readCache() {
  try {
    const raw = localStorage.getItem(CACHE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function writeCache(candidates) {
  try {
    localStorage.setItem(CACHE_KEY, JSON.stringify(candidates));
  } catch {
    // Quota exceeded — ignore
  }
}

export function useCandidates() {
  // Initialise from cache so the table shows instantly before the API responds
  const [candidates, setCandidates] = useState(readCache);
  const [loading, setLoading] = useState(true);
  const [supabaseReady, setSupabaseReady] = useState(false);
  const [fetchError, setFetchError] = useState(null);

  // ── Fetch all candidates from Supabase on mount ────────────────────────────
  useEffect(() => {
    let cancelled = false;

    fetch("/api/candidates")
      .then((r) => r.json())
      .then((json) => {
        if (cancelled) return;
        const list = json.candidates || [];
        setCandidates(list);
        writeCache(list);
        setSupabaseReady(json.supabaseConfigured ?? false);
        setFetchError(null);
      })
      .catch((err) => {
        if (!cancelled) {
          console.error("[useCandidates] fetch failed:", err.message);
          setFetchError("Could not reach the API server.");
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => { cancelled = true; };
  }, []);

  // ── Save a new candidate to Supabase ──────────────────────────────────────
  const addCandidate = useCallback(async (data) => {
    const res = await fetch("/api/candidates", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });

    const json = await res.json();

    if (!res.ok) {
      const err = new Error(json.message || "Failed to save candidate");
      err.code = json.error;
      throw err;
    }

    const saved = json.candidate;
    setCandidates((prev) => {
      const next = [saved, ...prev];
      writeCache(next);
      return next;
    });
    return saved;
  }, []);

  // ── Remove a candidate from Supabase ──────────────────────────────────────
  const removeCandidate = useCallback(async (id) => {
    // Optimistic update
    setCandidates((prev) => {
      const next = prev.filter((c) => c.id !== id);
      writeCache(next);
      return next;
    });

    try {
      await fetch(`/api/candidates/${id}`, { method: "DELETE" });
    } catch (err) {
      console.error("[useCandidates] delete failed:", err.message);
      // Revert optimistic update on failure
      const list = readCache();
      setCandidates(list);
    }
  }, []);

  // ── Clear all (local only — does not delete from Supabase) ────────────────
  // To truly delete all, call removeCandidate for each id
  const clearAll = useCallback(async () => {
    const ids = candidates.map((c) => c.id);
    setCandidates([]);
    writeCache([]);
    await Promise.allSettled(
      ids.map((id) => fetch(`/api/candidates/${id}`, { method: "DELETE" }))
    );
  }, [candidates]);

  // ── Export filtered candidates to CSV ─────────────────────────────────────
  const exportCSV = useCallback(
    (filtered) => {
      const rows = filtered ?? candidates;
      if (rows.length === 0) return;

      const headers = [
        "Name", "Email", "Phone", "Skills",
        "Years of Experience", "Role Category", "Seniority Level",
        "Source File", "Added",
      ];
      const escape = (v) => `"${String(v ?? "").replace(/"/g, '""')}"`;

      const csvRows = [
        headers.join(","),
        ...rows.map((c) =>
          [
            escape(c.fullName),
            escape(c.email),
            escape(c.phone),
            escape((c.skills || []).join("; ")),
            c.yearsOfExperience ?? 0,
            escape(c.roleCategory),
            escape(c.seniorityLevel),
            escape(c.sourceFile),
            escape(
              c.addedAt
                ? new Date(c.addedAt).toLocaleDateString()
                : ""
            ),
          ].join(",")
        ),
      ];

      const blob = new Blob([csvRows.join("\r\n")], {
        type: "text/csv;charset=utf-8;",
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `candidates_${new Date().toISOString().split("T")[0]}.csv`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    },
    [candidates]
  );

  // ── Derive dropdown options from live data ─────────────────────────────────
  const roleCategories = [
    ...new Set(candidates.map((c) => c.roleCategory).filter(Boolean)),
  ].sort();

  const SENIORITY_ORDER = ["Intern", "Junior", "Mid", "Senior", "Lead", "Executive"];
  const seniorityLevels = [
    ...new Set(candidates.map((c) => c.seniorityLevel).filter(Boolean)),
  ].sort(
    (a, b) => SENIORITY_ORDER.indexOf(a) - SENIORITY_ORDER.indexOf(b)
  );

  return {
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
  };
}
