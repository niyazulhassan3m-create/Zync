import React, { useState } from "react";

export default function RequestPremiumOpsModal({ isOpen, onClose, onSubmitRequest, workspace }) {
  const workspaceId = workspace?.workspace_id || "WS-LABY-7842";
  const [clientName, setClientName] = useState(workspace?.client_name || "");
  const [email, setEmail] = useState(workspace?.email || "");
  const [channel, setChannel] = useState(workspace?.channel || "telegram");
  const [phoneNumber, setPhoneNumber] = useState(workspace?.phone_number || "");
  const [telegramId, setTelegramId] = useState(workspace?.telegram_id || "");
  const [requirements, setRequirements] = useState(workspace?.business_requirements || "");
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      await onSubmitRequest({
        workspace_id: workspaceId,
        client_name: clientName,
        email,
        channel,
        phone_number: phoneNumber,
        telegram_id: telegramId,
        business_requirements: requirements,
      });
      onClose();
    } catch (err) {
      console.error("[RequestPremiumOpsModal] submission error:", err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-md p-4">
      <div className="w-full max-w-lg rounded-2xl border border-violet-500/40 bg-slate-900 p-6 shadow-2xl space-y-5 relative">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div className="flex items-center gap-3">
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-violet-500 to-purple-600 text-white font-bold text-lg shadow">
              ⚡
            </span>
            <div>
              <h3 className="text-base font-bold text-slate-100 flex items-center gap-2">
                Request Premium Operations
                <span className="rounded bg-violet-500/20 text-[10px] font-bold text-violet-300 px-2 py-0.5 border border-violet-500/30">
                  Lab-Y
                </span>
              </h3>
              <p className="text-xs text-slate-400">Notifies Service Provider (Lab-Y) with your Workspace ID & requirements</p>
            </div>
          </div>
          <button onClick={onClose} className="text-slate-500 hover:text-slate-300">✕</button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          {/* Workspace ID Display (Auto-generated/Assigned) */}
          <div className="rounded-xl border border-violet-500/30 bg-violet-500/10 p-3 flex items-center justify-between">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-wider text-violet-300">Target Workspace ID</p>
              <p className="text-sm font-mono font-bold text-slate-100 mt-0.5">{workspaceId}</p>
            </div>
            <span className="text-[11px] text-violet-300 bg-violet-500/20 px-2.5 py-1 rounded-md border border-violet-500/30 font-semibold">
              Assigned Workspace
            </span>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-slate-300 mb-1">Company / Workspace Name *</label>
              <input
                type="text"
                required
                value={clientName}
                onChange={(e) => setClientName(e.target.value)}
                placeholder="Acme Operations Corp"
                className="w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-slate-200 focus:outline-none focus:border-violet-500"
              />
            </div>
            <div>
              <label className="block font-semibold text-slate-300 mb-1">Contact Email *</label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="founder@acme.com"
                className="w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-slate-200 focus:outline-none focus:border-violet-500"
              />
            </div>
          </div>

          <div>
            <label className="block font-semibold text-slate-300 mb-1">Preferred Reminder & Alert Channel</label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setChannel("telegram")}
                className={`p-2.5 rounded-lg border flex items-center justify-center gap-2 font-semibold ${
                  channel === "telegram"
                    ? "border-sky-500 bg-sky-500/20 text-sky-300"
                    : "border-slate-700 bg-slate-800/60 text-slate-400"
                }`}
              >
                ✈️ Telegram Bot
              </button>
              <button
                type="button"
                onClick={() => setChannel("whatsapp")}
                className={`p-2.5 rounded-lg border flex items-center justify-center gap-2 font-semibold ${
                  channel === "whatsapp"
                    ? "border-emerald-500 bg-emerald-500/20 text-emerald-300"
                    : "border-slate-700 bg-slate-800/60 text-slate-400"
                }`}
              >
                💬 WhatsApp (Twilio)
              </button>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-slate-300 mb-1">WhatsApp Phone Number</label>
              <input
                type="text"
                value={phoneNumber}
                onChange={(e) => setPhoneNumber(e.target.value)}
                placeholder="+1 (555) 019-2834"
                className="w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-slate-200 focus:outline-none focus:border-emerald-500 font-mono"
              />
            </div>
            <div>
              <label className="block font-semibold text-slate-300 mb-1">Telegram Handle / Chat ID</label>
              <input
                type="text"
                value={telegramId}
                onChange={(e) => setTelegramId(e.target.value)}
                placeholder="@founder_boss"
                className="w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-slate-200 focus:outline-none focus:border-sky-500 font-mono"
              />
            </div>
          </div>

          <div>
            <label className="block font-semibold text-slate-300 mb-1">Specific Business Requirements *</label>
            <textarea
              rows={3}
              required
              value={requirements}
              onChange={(e) => setRequirements(e.target.value)}
              placeholder="Detail your operational automation needs (e.g., Voice-to-Action tasks, candidate outreach, Market Intelligence Overlay)..."
              className="w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-slate-200 focus:outline-none focus:border-violet-500"
            />
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg px-4 py-2 text-slate-400 hover:text-slate-200"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="rounded-lg bg-gradient-to-r from-violet-500 to-purple-600 px-5 py-2 font-bold text-white hover:opacity-90 transition-opacity shadow-lg shadow-purple-950/50 flex items-center gap-1.5"
            >
              {isSubmitting ? "Notifying Lab-Y…" : "Submit Request to Lab-Y →"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
