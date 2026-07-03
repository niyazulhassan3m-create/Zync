import React, { useState, useEffect } from "react";

export default function AdminControlPanel() {
  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionStatus, setActionStatus] = useState(null);

  const fetchAdminClients = async () => {
    try {
      const res = await fetch("/api/admin/clients");
      const data = await res.json();
      if (data.clients) {
        setClients(data.clients);
      }
    } catch (err) {
      console.error("[AdminControlPanel] fetch clients error:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAdminClients();
  }, []);

  const handleMasterToggle = async (clientId, currentEnabled) => {
    const nextState = !currentEnabled;
    setActionStatus({ type: "saving", id: clientId });

    try {
      const res = await fetch("/api/admin/toggle-client-notification", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          client_id: clientId,
          admin_enabled_notification: nextState,
        }),
      });
      const data = await res.json();

      if (data.success && data.client) {
        setClients((prev) =>
          prev.map((c) => (c.client_id === clientId ? data.client : c))
        );
        setActionStatus({
          type: "success",
          message: `Master Toggle updated for ${data.client.client_name}: ${nextState ? "ENABLED 🟢" : "DISABLED 🔴"}`,
        });
      }
    } catch (err) {
      setActionStatus({ type: "error", message: "Failed to update Master Toggle." });
    }
  };

  return (
    <div className="max-w-5xl space-y-8">
      {/* Header Banner */}
      <div className="rounded-2xl border border-purple-500/30 bg-gradient-to-r from-slate-900 via-purple-950/40 to-slate-900 p-6 shadow-2xl relative overflow-hidden">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-purple-500/20 border border-purple-500/30 text-purple-300 text-2xl font-bold shadow-inner">
              👑
            </div>
            <div>
              <h2 className="text-xl font-bold text-slate-100 flex items-center gap-2">
                SaaS Admin Control Panel
                <span className="rounded-full bg-purple-500/20 border border-purple-500/30 px-2.5 py-0.5 text-xs font-bold text-purple-300">
                  Founder Master Access
                </span>
              </h2>
              <p className="text-xs text-slate-400 mt-1">
                Manage client access permissions, review activation requests, and flip Master Toggles
              </p>
            </div>
          </div>

          <button
            onClick={fetchAdminClients}
            className="flex items-center gap-1.5 rounded-xl border border-slate-700 bg-slate-800/80 px-3 py-1.5 text-xs font-semibold text-slate-300 hover:bg-slate-700 transition-colors"
          >
            🔄 Refresh List
          </button>
        </div>
      </div>

      {/* Status Alert */}
      {actionStatus?.message && (
        <div className={`rounded-xl p-3.5 text-xs flex items-center gap-2 border ${
          actionStatus.type === "success"
            ? "bg-emerald-500/15 border-emerald-500/30 text-emerald-300"
            : "bg-red-500/15 border-red-500/30 text-red-300"
        }`}>
          <span>{actionStatus.type === "success" ? "✅" : "⚠️"}</span>
          <span>{actionStatus.message}</span>
        </div>
      )}

      {/* Clients Management Table */}
      <div className="rounded-2xl border border-slate-700/60 bg-slate-800/40 p-6 space-y-4 shadow-lg">
        <div className="flex items-center justify-between border-b border-slate-700/50 pb-4">
          <div>
            <h3 className="text-base font-bold text-slate-100">Client Access & Master Toggles</h3>
            <p className="text-xs text-slate-400">Flip Master Toggle to authorize WhatsApp/Telegram dispatch for each client</p>
          </div>
          <span className="text-xs font-mono text-slate-500">Total Clients: {clients.length}</span>
        </div>

        {loading ? (
          <div className="py-12 text-center text-slate-500 text-xs">Loading admin clients list…</div>
        ) : (
          <div className="space-y-4">
            {clients.map((client) => {
              const isMasterEnabled = client.admin_enabled_notification;
              const isPending = client.request_status === "pending_approval";

              return (
                <div
                  key={client.client_id}
                  className={`rounded-xl border p-5 transition-all ${
                    isMasterEnabled
                      ? "border-emerald-500/40 bg-emerald-950/15 shadow-[0_0_20px_-4px_rgba(16,185,129,0.15)]"
                      : isPending
                      ? "border-amber-500/40 bg-amber-950/15 shadow-[0_0_20px_-4px_rgba(245,158,11,0.15)]"
                      : "border-slate-700/50 bg-slate-900/40"
                  }`}
                >
                  <div className="flex flex-wrap items-center justify-between gap-4">
                    {/* Client Info */}
                    <div className="space-y-1 min-w-0 flex-1">
                      <div className="flex items-center gap-2.5">
                        <h4 className="text-sm font-bold text-slate-100">{client.client_name}</h4>
                        <span className="text-xs font-mono text-slate-500">({client.email})</span>

                        {/* Request Status Badge */}
                        {isPending ? (
                          <span className="inline-flex items-center gap-1 rounded-full bg-amber-500/20 border border-amber-500/30 px-2.5 py-0.5 text-[10px] font-bold text-amber-300 animate-pulse">
                            ⏳ Access Request Pending
                          </span>
                        ) : isMasterEnabled ? (
                          <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/20 border border-emerald-500/30 px-2.5 py-0.5 text-[10px] font-bold text-emerald-300">
                            🟢 Approved & Active
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 rounded-full bg-slate-800 border border-slate-700 px-2.5 py-0.5 text-[10px] font-semibold text-slate-500">
                            ⚪ Disabled
                          </span>
                        )}
                      </div>

                      <div className="flex items-center gap-4 text-xs text-slate-400 pt-1">
                        <span>Channel: <strong className="text-slate-200 uppercase">{client.channel}</strong></span>
                        {client.channel === "whatsapp" ? (
                          <span>Phone: <code className="text-emerald-400">{client.phone_number || "Not set"}</code></span>
                        ) : (
                          <span>Telegram ID: <code className="text-sky-400">{client.telegram_id || "Not set"}</code></span>
                        )}
                      </div>

                      {client.use_case_notes && (
                        <p className="text-xs text-slate-400 bg-slate-800/50 rounded-lg p-2 mt-2 border border-slate-700/40 italic">
                          "{client.use_case_notes}"
                        </p>
                      )}
                    </div>

                    {/* Master Toggle Control */}
                    <div className="flex flex-col items-end gap-2 border-l border-slate-700/40 pl-5">
                      <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                        Master Toggle
                      </span>

                      <div className="flex items-center gap-3">
                        <span className={`text-xs font-semibold ${isMasterEnabled ? "text-emerald-400" : "text-slate-500"}`}>
                          {isMasterEnabled ? "ENABLED" : "DISABLED"}
                        </span>

                        <label className="relative inline-flex items-center cursor-pointer">
                          <input
                            type="checkbox"
                            checked={isMasterEnabled}
                            onChange={() => handleMasterToggle(client.client_id, isMasterEnabled)}
                            className="sr-only peer"
                          />
                          <div className="w-14 h-7 bg-slate-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-6 after:w-6 after:transition-all peer-checked:bg-emerald-500 shadow-inner"></div>
                        </label>
                      </div>
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
