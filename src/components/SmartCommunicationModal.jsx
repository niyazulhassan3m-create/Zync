import React, { useState, useEffect, useCallback } from "react";

export default function SmartCommunicationModal({ isOpen, onClose, entityName, roleCategory }) {
  const [commType, setCommType] = useState("Email");
  const [topic, setTopic] = useState("Executive Interview Next Steps & Offer Discussion");
  const [draft, setDraft] = useState(null);
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);

  const entity = entityName || "Executive Candidate";

  const generateDraft = useCallback(async () => {
    setLoading(true);
    setCopied(false);
    try {
      const res = await fetch("/api/zync/auto-draft-communication", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          entity_name: entity,
          communication_type: commType,
          topic,
        }),
      });
      const data = await res.json();
      if (data.draft) {
        setDraft(data.draft);
      }
    } catch (err) {
      console.error("[SmartCommunicationModal] error:", err);
    } finally {
      setLoading(false);
    }
  }, [entity, commType, topic]);

  useEffect(() => {
    if (isOpen) {
      generateDraft();
    }
  }, [isOpen, generateDraft]);

  if (!isOpen) return null;

  const handleCopy = () => {
    if (!draft) return;
    const textToCopy = `Subject: ${draft.subject}\n\n${draft.body}`;
    navigator.clipboard.writeText(textToCopy);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-md p-4">
      <div className="w-full max-w-2xl rounded-2xl border border-violet-500/40 bg-slate-900 p-6 shadow-2xl space-y-5 relative">
        {/* Modal Header */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div className="flex items-center gap-3">
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-violet-500 to-purple-600 text-white font-bold text-lg shadow">
              ✉️
            </span>
            <div>
              <h3 className="text-base font-bold text-slate-100 flex items-center gap-2">
                Execute Communication — Smart Auto-Drafting
                <span className="rounded bg-violet-500/20 text-[10px] font-bold text-violet-300 px-2 py-0.5 border border-violet-500/30">
                  Lab-Y Tone
                </span>
              </h3>
              <p className="text-xs text-slate-400">Generates innovative, authoritative & concise executive communication for {entity}</p>
            </div>
          </div>
          <button onClick={onClose} className="text-slate-500 hover:text-slate-300">✕</button>
        </div>

        {/* Options & Configuration */}
        <div className="grid grid-cols-2 gap-4 text-xs">
          <div>
            <label className="block font-semibold text-slate-300 mb-1">Communication Channel</label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setCommType("Email")}
                className={`p-2 rounded-lg border flex items-center justify-center gap-1.5 font-bold ${
                  commType === "Email"
                    ? "border-violet-500 bg-violet-500/20 text-violet-300"
                    : "border-slate-700 bg-slate-800 text-slate-400"
                }`}
              >
                📧 Email
              </button>
              <button
                type="button"
                onClick={() => setCommType("Message")}
                className={`p-2 rounded-lg border flex items-center justify-center gap-1.5 font-bold ${
                  commType === "Message"
                    ? "border-purple-500 bg-purple-500/20 text-purple-300"
                    : "border-slate-700 bg-slate-800 text-slate-400"
                }`}
              >
                💬 Direct Message
              </button>
            </div>
          </div>

          <div>
            <label className="block font-semibold text-slate-300 mb-1">Communication Topic / Objective</label>
            <input
              type="text"
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              className="w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-slate-200 focus:outline-none focus:border-violet-500"
            />
          </div>
        </div>

        {/* Generated Draft Container */}
        <div className="rounded-xl border border-slate-700/60 bg-slate-950/80 p-4 space-y-3">
          <div className="flex items-center justify-between text-xs">
            <span className="font-bold text-violet-300 uppercase tracking-wider text-[10px]">
              AI Generated Draft (Zync powered by Lab-Y)
            </span>
            <button
              onClick={generateDraft}
              disabled={loading}
              className="text-xs text-slate-400 hover:text-slate-200 underline font-medium"
            >
              Regenerate Draft
            </button>
          </div>

          {loading ? (
            <div className="py-12 text-center text-xs text-slate-500 animate-pulse">
              Generating Lab-Y executive communication for {entity}…
            </div>
          ) : draft ? (
            <div className="space-y-3 text-xs">
              <div>
                <p className="text-[10px] font-bold text-slate-400 uppercase">Subject Line:</p>
                <p className="text-slate-100 font-bold text-sm mt-0.5">{draft.subject}</p>
              </div>
              <div className="border-t border-slate-800 pt-2">
                <p className="text-[10px] font-bold text-slate-400 uppercase mb-1">Communication Body:</p>
                <pre className="p-3 rounded-lg bg-slate-900 border border-slate-800 text-slate-300 whitespace-pre-wrap font-sans leading-relaxed">
                  {draft.body}
                </pre>
              </div>
            </div>
          ) : null}
        </div>

        {/* Footer Actions */}
        <div className="flex items-center justify-between border-t border-slate-800 pt-3">
          <span className="text-[10px] text-slate-500 font-mono">Branded as Zync powered by Lab-Y</span>
          <div className="flex gap-2">
            <button
              onClick={onClose}
              className="rounded-lg px-4 py-2 text-xs text-slate-400 hover:text-slate-200"
            >
              Close
            </button>
            <button
              onClick={handleCopy}
              className="rounded-lg border border-slate-700 bg-slate-800 px-4 py-2 text-xs font-semibold text-slate-200 hover:bg-slate-700 transition-colors"
            >
              {copied ? "✓ Copied to Clipboard!" : "📋 Copy Draft"}
            </button>
            <button
              onClick={() => {
                alert(`🚀 Communication dispatched to ${entity} via Zync powered by Lab-Y!`);
                onClose();
              }}
              className="rounded-lg bg-gradient-to-r from-violet-500 to-purple-600 px-5 py-2 text-xs font-bold text-white shadow-lg hover:opacity-90 transition-opacity"
            >
              🚀 Execute Communication →
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
