import React, { useState } from "react";

export default function AccessRequestModal({ isOpen, onClose, onSubmitRequest, currentClient }) {
  const [clientName, setClientName] = useState(currentClient?.client_name || "");
  const [email, setEmail] = useState(currentClient?.email || "");
  const [channel, setChannel] = useState(currentClient?.channel || "telegram");
  const [phoneNumber, setPhoneNumber] = useState(currentClient?.phone_number || "");
  const [telegramId, setTelegramId] = useState(currentClient?.telegram_id || "");
  const [notes, setNotes] = useState(currentClient?.use_case_notes || "");
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      await onSubmitRequest({
        client_name: clientName,
        email,
        channel,
        phone_number: phoneNumber,
        telegram_id: telegramId,
        use_case_notes: notes,
      });
      onClose();
    } catch (err) {
      console.error("[AccessRequestModal] submit error:", err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
      <div className="w-full max-w-lg rounded-2xl border border-slate-700 bg-slate-900 p-6 shadow-2xl space-y-5">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div className="flex items-center gap-2.5">
            <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-violet-500/20 border border-violet-500/30 text-violet-300">
              📨
            </span>
            <div>
              <h3 className="text-base font-bold text-slate-100">Request Notification Access</h3>
              <p className="text-xs text-slate-500">Sends activation request to SaaS Founder for Admin Approval</p>
            </div>
          </div>
          <button onClick={onClose} className="text-slate-500 hover:text-slate-300">✕</button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-slate-300 mb-1">Company / Client Name *</label>
              <input
                type="text"
                required
                value={clientName}
                onChange={(e) => setClientName(e.target.value)}
                placeholder="Acme Corp"
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
            <label className="block font-semibold text-slate-300 mb-1">Preferred Reminder Channel</label>
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
              <label className="block font-semibold text-slate-300 mb-1">Telegram Chat ID / Handle</label>
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
            <label className="block font-semibold text-slate-300 mb-1">Use Case & Daily Volume</label>
            <textarea
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Describe your daily reminder needs..."
              className="w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-slate-200 focus:outline-none focus:border-violet-500"
            />
          </div>

          <div className="flex justify-end gap-2 pt-2 border-t border-slate-800">
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
              className="rounded-lg bg-violet-500 px-5 py-2 font-semibold text-white hover:bg-violet-400 transition-colors shadow-lg shadow-violet-950/50 flex items-center gap-1.5"
            >
              {isSubmitting ? "Submitting Request…" : "Submit Request to Founder →"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
