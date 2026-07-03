import React, { useState } from "react";
import { useNotificationSettings } from "../store/useNotificationSettings";

export default function NotificationsSettings() {
  const {
    client,
    logs,
    loading,
    testResult,
    sendTestNotification,
  } = useNotificationSettings();

  const [channel, setChannel] = useState(client?.channel || "telegram");
  const [phoneNumber, setPhoneNumber] = useState(client?.phone_number || "+1 (555) 019-2834");
  const [telegramId, setTelegramId] = useState(client?.telegram_id || "@founder_boss");

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="flex items-center gap-3 text-slate-400 text-xs">
          <svg className="h-5 w-5 animate-spin text-violet-400" viewBox="0 0 24 24" fill="none">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 1 8-8V0C5.373 0 0 5.373 0 12h4Z" />
          </svg>
          Loading Notification Settings…
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl space-y-8">
      {/* Top Banner */}
      <div className="rounded-2xl border border-violet-500/40 bg-gradient-to-r from-slate-900/90 via-slate-800/90 to-purple-950/40 p-6 shadow-2xl relative overflow-hidden">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div className="flex items-center gap-3.5">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-violet-500 to-purple-600 text-white text-2xl font-bold shadow-lg shadow-purple-950/50">
              🔔
            </div>
            <div>
              <h2 className="text-xl font-bold text-slate-100">Notification Engine & Reminders</h2>
              <p className="text-xs text-slate-400 mt-1">
                Configure automated WhatsApp and Telegram reminders for candidate interviews and due tasks
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Channel Settings Card */}
      <div className="rounded-2xl border border-slate-700/60 bg-slate-800/40 p-6 space-y-6 shadow-lg">
        <div className="flex items-center justify-between border-b border-slate-700/50 pb-5">
          <div>
            <h3 className="text-base font-bold text-slate-100">Reminder Channel Configuration</h3>
            <p className="text-xs text-slate-400 mt-1">Select your preferred dispatch channel for real-time task notifications</p>
          </div>
          <button
            onClick={sendTestNotification}
            className="flex items-center gap-2 rounded-xl border border-violet-500/40 bg-gradient-to-r from-violet-500/20 to-purple-600/20 px-4 py-2 text-xs font-bold text-violet-200 hover:border-violet-400 hover:text-white transition-all shadow-lg shadow-violet-950/40"
          >
            🚀 Send Test Reminder
          </button>
        </div>

        {/* Test Result Message */}
        {testResult && (
          <div className={`p-3 rounded-xl text-xs flex items-center gap-2 border ${
            testResult.status === "success"
              ? "bg-emerald-500/15 border-emerald-500/30 text-emerald-300"
              : "bg-red-500/15 border-red-500/30 text-red-300"
          }`}>
            <span>{testResult.status === "success" ? "✅" : "⚠️"}</span>
            <span className="font-semibold">{testResult.message}</span>
          </div>
        )}

        <div className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-2">Preferred Dispatch Channel</label>
            <div className="grid grid-cols-2 gap-4">
              <button
                type="button"
                onClick={() => setChannel("telegram")}
                className={`p-4 rounded-xl border flex items-center justify-center gap-3 font-bold text-xs transition-all ${
                  channel === "telegram"
                    ? "border-sky-500 bg-sky-500/20 text-sky-300 shadow-lg shadow-sky-950/40"
                    : "border-slate-700 bg-slate-800/60 text-slate-400 hover:text-slate-200"
                }`}
              >
                ✈️ Telegram Bot API
              </button>
              <button
                type="button"
                onClick={() => setChannel("whatsapp")}
                className={`p-4 rounded-xl border flex items-center justify-center gap-3 font-bold text-xs transition-all ${
                  channel === "whatsapp"
                    ? "border-emerald-500 bg-emerald-500/20 text-emerald-300 shadow-lg shadow-emerald-950/40"
                    : "border-slate-700 bg-slate-800/60 text-slate-400 hover:text-slate-200"
                }`}
              >
                💬 WhatsApp (Twilio)
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">WhatsApp Phone Number</label>
              <input
                type="text"
                value={phoneNumber}
                onChange={(e) => setPhoneNumber(e.target.value)}
                placeholder="+1 (555) 019-2834"
                className="w-full rounded-xl border border-slate-700 bg-slate-900/60 px-3.5 py-2.5 text-xs text-slate-200 font-mono focus:outline-none focus:border-emerald-500"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Telegram Handle / Chat ID</label>
              <input
                type="text"
                value={telegramId}
                onChange={(e) => setTelegramId(e.target.value)}
                placeholder="@founder_boss"
                className="w-full rounded-xl border border-slate-700 bg-slate-900/60 px-3.5 py-2.5 text-xs text-slate-200 font-mono focus:outline-none focus:border-sky-500"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Audit Logs Table */}
      <div className="rounded-2xl border border-slate-700/60 bg-slate-800/40 p-6 space-y-4 shadow-lg">
        <h3 className="text-base font-semibold text-slate-100 flex items-center gap-2">
          <span>📜</span> Notification Dispatch History
        </h3>
        <p className="text-xs text-slate-400">Recent automated reminders and alert status logs</p>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-700/60 text-slate-500">
                <th className="py-2.5 px-3">Timestamp</th>
                <th className="py-2.5 px-3">Channel</th>
                <th className="py-2.5 px-3">Recipient</th>
                <th className="py-2.5 px-3">Message Snippet</th>
                <th className="py-2.5 px-3 text-right">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-700/30">
              {logs.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-8 text-center text-slate-500 italic">
                    No reminder logs found. Click "Send Test Reminder" to dispatch.
                  </td>
                </tr>
              ) : (
                logs.map((log) => (
                  <tr key={log.id} className="hover:bg-slate-700/20">
                    <td className="py-2.5 px-3 font-mono text-slate-400">
                      {new Date(log.sent_at || log.created_at).toLocaleTimeString()}
                    </td>
                    <td className="py-2.5 px-3 uppercase font-bold text-slate-300">
                      {log.channel || "TELEGRAM"}
                    </td>
                    <td className="py-2.5 px-3 font-mono text-slate-300">
                      {log.recipient || "@founder_boss"}
                    </td>
                    <td className="py-2.5 px-3 text-slate-300 truncate max-w-xs">
                      {log.message || log.description}
                    </td>
                    <td className="py-2.5 px-3 text-right">
                      <span className="inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                        {log.status || "SENT"}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
