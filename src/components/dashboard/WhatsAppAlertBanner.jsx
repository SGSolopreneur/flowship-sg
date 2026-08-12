import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { MessageCircle, Send, Loader2, CheckCircle, AlertCircle } from "lucide-react";
import { useRole } from "@/components/shared/useRole";

export default function WhatsAppAlertBanner({ lowStockCount }) {
  const { canAccessSensitive } = useRole();
  const [sending, setSending] = useState(false);
  const [result, setResult] = useState(null);

  if (!canAccessSensitive) return null;

  const handleTest = async () => {
    setSending(true);
    setResult(null);
    try {
      const res = await base44.functions.invoke("checkLowStockWhatsApp", {});
      setResult(res.data);
    } catch (err) {
      setResult({ error: err.response?.data?.error || err.message });
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="bg-white rounded-xl border border-emerald-200 p-4 flex flex-col sm:flex-row sm:items-center gap-3 shadow-sm">
      <div className="w-10 h-10 rounded-lg bg-emerald-50 flex items-center justify-center shrink-0">
        <MessageCircle className="w-5 h-5 text-emerald-600" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-slate-800 flex items-center gap-2">
          WhatsApp Low-Stock Alert
          <span className="inline-flex items-center gap-1 text-[10px] font-medium text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded-full">
            Auto · every 4h
          </span>
        </p>
        <p className="text-xs text-slate-500 mt-0.5">
          Sends a WhatsApp message to the manager when any item drops below its minimum stock level.
          {typeof lowStockCount === "number" && (
            <span className={`font-medium ${lowStockCount > 0 ? "text-amber-600" : "text-emerald-600"}`}>
              {" "}Currently {lowStockCount} low-stock item{lowStockCount === 1 ? "" : "s"}.
            </span>
          )}
        </p>
        {result && (
          <p className={`text-xs mt-1.5 flex items-center gap-1 ${result.success ? "text-emerald-600" : "text-amber-600"}`}>
            {result.success ? <CheckCircle className="w-3.5 h-3.5 shrink-0" /> : <AlertCircle className="w-3.5 h-3.5 shrink-0" />}
            <span className="truncate">
              {result.success
                ? `Sent: ${result.itemCount} low-stock item(s)`
                : result.error || "Failed to send — check WhatsApp secrets in Settings."}
            </span>
          </p>
        )}
      </div>
      <button
        onClick={handleTest}
        disabled={sending}
        className="inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg bg-emerald-600 text-white text-sm font-medium hover:bg-emerald-700 disabled:opacity-50 shrink-0"
      >
        {sending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
        {sending ? "Sending…" : "Test Alert"}
      </button>
    </div>
  );
}