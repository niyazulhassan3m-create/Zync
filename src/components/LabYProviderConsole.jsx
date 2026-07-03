import React, { useState, useEffect } from "react";

export default function LabYProviderConsole() {
  const [workspaces, setWorkspaces] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionStatus, setActionStatus] = useState(null);
  const [welcomeEmailAlert, setWelcomeEmailAlert] = useState(null);

  const fetchWorkspaces = async () => {
    try {
      const res = await fetch("/api/lab-y/workspaces");
      const data = await res.json();
      if (data.workspaces) {
        setWorkspaces(data.workspaces);
      }
    } catch (err) {
      console.error("[LabYProviderConsole] fetch error:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchWorkspaces();
  }, []);

  const handleServiceActivationToggle = async (workspaceId, currentActive) => {
    const nextState = !currentActive;
    setActionStatus({ type: "saving", id: workspaceId });
    setWelcomeEmailAlert(null);

    try {
      const res = await fetch("/api/lab-y/toggle-workspace-service", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          workspace_id: workspaceId,
          service_provider_activation_status: nextState,
        }),
      });
      const data = await res.json();

      if (data.success && data.workspace) {
        setWorkspaces((prev) =>
          prev.map((w) => (w.workspace_id === workspaceId ? data.workspace : w))
        );

        setActionStatus({
          type: "success",
          message: `Service Activation Switch set to ${nextState ? "ACTIVE 🟢" : "INACTIVE 🔴"} for Workspace ${data.workspace.workspace_id}`,
        });

        // 📧 Automated Welcome Email Alert
        if (data.welcomeEmailSent && data.welcomeEmailPayload) {
          setWelcomeEmailAlert(data.welcomeEmailPayload);
        }
      }
    } catch (err) {
      setActionStatus({ type: "error", message: "Failed to toggle Service Activation Switch." });
    }
  };

  return (
    <div className="max-w-5xl space-y-8">
      {/* Header Banner */}
      <div className="rounded-2xl border border-purple-500/40 bg-gradient-to-r from-slate-900 via-purple-950/50 to-slate-900 p-6 shadow-2xl relative overflow-hidden">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-purple-500 to-indigo-600 text-white text-2xl font-bold shadow-lg shadow-purple-950/60">
              ⚡
            </div>
            <div>
              <h2 className="text-xl font-bold text-slate-100 flex items-center gap-2">
                Lab-Y Provider Admin Console
                <span className="rounded-full bg-purple-500/20 border border-purple-500/40 px-3 py-0.5 text-xs font-bold text-purple-300">
                  Master Control
                </span>
              </h2>
              <p className="text-xs text-slate-400 mt-1">
                Zync powered by Lab-Y — Strict Service-Provider-Controlled Activation & Service Validator Engine
              </p>
            </div>
          </div>

          <button
            onClick={fetchWorkspaces}
            className="flex items-center gap-1.5 rounded-xl border border-slate-700 bg-slate-800/80 px-3.5 py-1.5 text-xs font-semibold text-slate-300 hover:bg-slate-700 transition-colors"
          >
            🔄 Refresh Workspaces
          </button>
        </div>
      </div>

      {/* Action Notification */}
      {actionStatus?.message && (
        <div className={`rounded-xl p-4 text-xs flex items-center gap-2 border ${
          actionStatus.type === "success"
            ? "bg-emerald-500/15 border-emerald-500/30 text-emerald-300"
            : "bg-red-500/15 border-red-500/30 text-red-300"
        }`}>
          <span>{actionStatus.type === "success" ? "✅" : "⚠️"}</span>
          <span className="font-semibold">{actionStatus.message}</span>
        </div>
      )}

      {/* 📧 Automated Welcome Email Confirmation Box */}
      {welcomeEmailAlert && (
        <div className="rounded-xl border border-sky-500/40 bg-sky-500/10 p-5 space-y-2 text-xs shadow-lg animate-fade-in">
          <div className="flex items-center gap-2 text-sky-300 font-bold text-sm">
            <span>📧 Communication Bridge Triggered — Automated Welcome Email Sent!</span>
          </div>
          <p className="text-slate-300 font-medium">To: <code className="text-sky-300">{welcomeEmailAlert.to}</code></p>
          <p className="text-slate-300 font-medium">Subject: <span className="text-slate-100">{welcomeEmailAlert.subject}</span></p>
          <pre className="mt-2 p-3 rounded-lg bg-slate-900/80 border border-sky-500/20 text-slate-300 whitespace-pre-wrap font-sans">
            {welcomeEmailAlert.body}
          </pre>
        </div>
      )}

      {/* Workspace Activation Table */}
      <div className="rounded-2xl border border-slate-700/60 bg-slate-800/40 p-6 space-y-4 shadow-lg">
        <div className="flex items-center justify-between border-b border-slate-700/50 pb-4">
          <div>
            <h3 className="text-base font-bold text-slate-100">Client Workspaces & Service Activation</h3>
            <p className="text-xs text-slate-400">Flip the Service Activation Switch to grant or revoke Lab-Y automation services</p>
          </div>
          <span className="text-xs font-mono text-slate-500">Active Workspaces: {workspaces.filter(w => w.service_provider_activation_status).length} / {workspaces.length}</span>
        </div>

        {loading ? (
          <div className="py-12 text-center text-slate-500 text-xs">Loading Lab-Y Workspaces…</div>
        ) : (
          <div className="space-y-4">
            {workspaces.map((ws) => {
              const isActive = ws.service_provider_activation_status;
              const isPending = ws.request_status === "pending_approval";

              return (
                <div
                  key={ws.workspace_id}
                  className={`rounded-2xl border p-5 transition-all ${
                    isActive
                      ? "border-emerald-500/40 bg-emerald-950/15 shadow-[0_0_20px_-4px_rgba(16,185,129,0.2)]"
                      : isPending
                      ? "border-amber-500/40 bg-amber-950/15 shadow-[0_0_20px_-4px_rgba(245,158,11,0.2)]"
                      : "border-slate-700/50 bg-slate-900/40"
                  }`}
                >
                  <div className="flex flex-wrap items-center justify-between gap-4">
                    {/* Workspace Meta Info */}
                    <div className="space-y-1.5 min-w-0 flex-1">
                      <div className="flex items-center gap-3 flex-wrap">
                        <span className="font-mono font-bold text-xs text-violet-300 bg-violet-500/20 border border-violet-500/30 px-2.5 py-1 rounded-lg">
                          {ws.workspace_id}
                        </span>
                        <h4 className="text-sm font-bold text-slate-100">{ws.client_name}</h4>
                        <span className="text-xs font-mono text-slate-400">({ws.email})</span>

                        {/* Transparency Status Badges */}
                        {isActive ? (
                          <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/20 border border-emerald-500/40 px-3 py-0.5 text-xs font-bold text-emerald-300">
                            <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
                            Operations Service: Active
                          </span>
                        ) : isPending ? (
                          <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-500/20 border border-amber-500/40 px-3 py-0.5 text-xs font-bold text-amber-300 animate-pulse">
                            <span className="h-2 w-2 rounded-full bg-amber-400 animate-pulse" />
                            Operations Service: Pending Approval from Lab-Y
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 rounded-full bg-slate-800 border border-slate-700 px-3 py-0.5 text-xs font-semibold text-slate-400">
                            Operations Service: Inactive (Contact Lab-Y)
                          </span>
                        )}
                      </div>

                      {ws.business_requirements && (
                        <div className="mt-2 rounded-xl bg-slate-800/60 p-3 border border-slate-700/40 text-xs space-y-1">
                          <p className="font-bold text-violet-300 uppercase text-[10px] tracking-wider">Business Requirements:</p>
                          <p className="text-slate-300 italic font-sans">"{ws.business_requirements}"</p>
                        </div>
                      )}

                      {/* Capabilities checklist */}
                      <div className="flex items-center gap-3 text-[11px] text-slate-400 pt-1">
                        <span className="flex items-center gap-1">
                          {ws.voice_to_action_enabled ? "✅" : "❌"} Voice-to-Action
                        </span>
                        <span className="flex items-center gap-1">
                          {ws.reminders_enabled ? "✅" : "❌"} Reminders
                        </span>
                        <span className="flex items-center gap-1">
                          {ws.market_intelligence_enabled ? "✅" : "❌"} Market Intelligence
                        </span>
                      </div>
                    </div>

                    {/* Master Switch Controls */}
                    <div className="flex flex-col items-end gap-2.5 border-l border-slate-700/50 pl-6">
                      <span className="text-[11px] font-bold text-slate-300 uppercase tracking-wider">
                        Service Activation Switch
                      </span>

                      <div className="flex items-center gap-3">
                        <span className={`text-xs font-bold ${isActive ? "text-emerald-400" : "text-slate-500"}`}>
                          {isActive ? "ACTIVE" : "INACTIVE"}
                        </span>

                        <label className="relative inline-flex items-center cursor-pointer">
                          <input
                            type="checkbox"
                            checked={isActive}
                            onChange={() => handleServiceActivationToggle(ws.workspace_id, isActive)}
                            className="sr-only peer"
                          />
                          <div className="w-14 h-7 bg-slate-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-6 after:w-6 after:transition-all peer-checked:bg-emerald-500 shadow-inner"></div>
                        </label>
                      </div>

                      {ws.welcome_email_sent && (
                        <span className="text-[10px] text-sky-400 font-semibold flex items-center gap-1">
                          ✉️ Welcome Email Sent
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
