import React, { useState, useMemo } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis,
  LineChart, Line, Legend,
} from "recharts";
import { Building2, Star, Clock, ShieldCheck, TrendingUp, CheckCircle2, XCircle, AlertTriangle } from "lucide-react";
import { cn } from "@/lib/utils";

// ── helpers ──────────────────────────────────────────────────────────────────
function avg(arr) {
  if (!arr.length) return null;
  return arr.reduce((s, v) => s + v, 0) / arr.length;
}

function monthKey(isoStr) {
  if (!isoStr) return null;
  const d = new Date(isoStr);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

function fmtMonth(key) {
  if (!key) return "";
  const [y, m] = key.split("-");
  return new Date(+y, +m - 1, 1).toLocaleString("en-SG", { month: "short", year: "2-digit" });
}

const RATING_LABELS = ["Performance", "Quality", "OTD"];

// ── sub-components ────────────────────────────────────────────────────────────
function StatPill({ label, value, unit = "", color = "slate" }) {
  const colors = {
    emerald: "bg-emerald-50 text-emerald-700",
    blue:    "bg-blue-50 text-blue-700",
    amber:   "bg-amber-50 text-amber-700",
    red:     "bg-red-50 text-red-700",
    slate:   "bg-slate-100 text-slate-600",
  };
  return (
    <div className={cn("rounded-lg px-3 py-2 text-center", colors[color])}>
      <p className="text-[10px] uppercase tracking-wider font-medium opacity-70">{label}</p>
      <p className="text-lg font-bold leading-tight">{value ?? "—"}{value != null && unit ? <span className="text-xs font-normal ml-0.5">{unit}</span> : null}</p>
    </div>
  );
}

function SupplierCard({ supplier, pos, selected, onSelect }) {
  const supplierPos = pos.filter(po =>
    (po.items || []).some(item => item.supplier === supplier.name)
  );

  const completed = supplierPos.filter(po => ["received", "approved", "ordered"].includes(po.status));
  const rejected  = supplierPos.filter(po => po.status === "rejected");

  // Avg fulfillment time: approved_at - created_date (days)
  const fulfillTimes = completed
    .filter(po => po.approved_at && po.created_date)
    .map(po => (new Date(po.approved_at) - new Date(po.created_date)) / 86400000);
  const avgFulfill = avg(fulfillTimes);

  // Reliability = (non-rejected / total) * 100
  const reliability = supplierPos.length
    ? Math.round(((supplierPos.length - rejected.length) / supplierPos.length) * 100)
    : null;

  const flagged = supplierPos.filter(po => po.flagged).length;

  return (
    <button
      onClick={() => onSelect(supplier)}
      className={cn(
        "text-left w-full rounded-xl border p-4 transition-all space-y-3",
        selected
          ? "border-emerald-400 bg-emerald-50/60 shadow-sm"
          : "border-slate-200 bg-white hover:border-slate-300 hover:shadow-sm"
      )}
    >
      <div className="flex items-start justify-between gap-2">
        <div>
          <p className="font-semibold text-sm text-slate-800 leading-tight">{supplier.name}</p>
          <p className="text-[11px] text-slate-400 font-mono">{supplier.code}</p>
        </div>
        <span className={cn(
          "text-[10px] px-2 py-0.5 rounded-full font-medium",
          supplier.status === "active"   ? "bg-emerald-100 text-emerald-700" :
          supplier.status === "on_hold"  ? "bg-amber-100 text-amber-700" :
                                           "bg-slate-100 text-slate-500"
        )}>
          {supplier.status?.replace("_", " ")}
        </span>
      </div>

      <div className="grid grid-cols-3 gap-1.5">
        <StatPill label="POs" value={supplierPos.length} color="slate" />
        <StatPill label="Reliability" value={reliability != null ? `${reliability}%` : null} color={reliability >= 85 ? "emerald" : reliability >= 60 ? "amber" : "red"} />
        <StatPill label="Avg Days" value={avgFulfill != null ? avgFulfill.toFixed(1) : null} color="blue" />
      </div>

      {flagged > 0 && (
        <p className="text-[10px] text-amber-600 flex items-center gap-1">
          <AlertTriangle className="w-3 h-3" /> {flagged} flagged order{flagged > 1 ? "s" : ""}
        </p>
      )}
    </button>
  );
}

// ── main page ────────────────────────────────────────────────────────────────
export default function SupplierPerformance() {
  const [selected, setSelected] = useState(null);

  const { data: suppliers = [] } = useQuery({
    queryKey: ["suppliers"],
    queryFn: () => base44.entities.Supplier.list("-created_date"),
  });

  const { data: pos = [] } = useQuery({
    queryKey: ["purchaseOrders"],
    queryFn: () => base44.entities.PurchaseOrder.list("-created_date", 200),
  });

  // ── derived data for selected supplier ────────────────────────────────────
  const analysis = useMemo(() => {
    if (!selected) return null;

    const supplierPos = pos.filter(po =>
      (po.items || []).some(item => item.supplier === selected.name)
    );

    // Monthly PO count & avg fulfillment
    const byMonth = {};
    supplierPos.forEach(po => {
      const mk = monthKey(po.created_date);
      if (!mk) return;
      if (!byMonth[mk]) byMonth[mk] = { month: mk, pos: 0, rejected: 0, approved: 0, flagged: 0, days: [] };
      byMonth[mk].pos++;
      if (po.status === "rejected") byMonth[mk].rejected++;
      if (["received", "approved", "ordered"].includes(po.status)) byMonth[mk].approved++;
      if (po.flagged) byMonth[mk].flagged++;
      if (po.approved_at && po.created_date) {
        byMonth[mk].days.push((new Date(po.approved_at) - new Date(po.created_date)) / 86400000);
      }
    });

    const monthlyTrend = Object.values(byMonth)
      .sort((a, b) => a.month.localeCompare(b.month))
      .slice(-12)
      .map(m => ({
        name: fmtMonth(m.month),
        orders: m.pos,
        rejected: m.rejected,
        avgDays: m.days.length ? parseFloat(avg(m.days).toFixed(1)) : null,
      }));

    // Radar data
    const perfRating = selected.performance_rating ?? 0;
    const qualityScore = selected.quality_score ?? 0;
    const otdPct = selected.on_time_delivery_pct != null ? selected.on_time_delivery_pct / 20 : 0; // scale 0-100 → 0-5
    const radarData = [
      { subject: "Performance", A: perfRating, fullMark: 5 },
      { subject: "Quality",     A: qualityScore, fullMark: 5 },
      { subject: "OTD",         A: parseFloat(otdPct.toFixed(2)), fullMark: 5 },
      { subject: "Lead Time",   A: Math.max(0, 5 - (selected.lead_time_days || 0) / 4), fullMark: 5 },
    ];

    // Status breakdown bar
    const statusCounts = {};
    supplierPos.forEach(po => {
      statusCounts[po.status] = (statusCounts[po.status] || 0) + 1;
    });
    const statusBreakdown = Object.entries(statusCounts).map(([status, count]) => ({ status, count }));

    const fulfillTimes = supplierPos
      .filter(po => po.approved_at && po.created_date)
      .map(po => (new Date(po.approved_at) - new Date(po.created_date)) / 86400000);
    const avgFulfill = avg(fulfillTimes);

    const rejected = supplierPos.filter(po => po.status === "rejected").length;
    const reliability = supplierPos.length
      ? Math.round(((supplierPos.length - rejected) / supplierPos.length) * 100)
      : null;

    const totalSpend = supplierPos.reduce((sum, po) => {
      const itemSpend = (po.items || [])
        .filter(item => item.supplier === selected.name)
        .reduce((s, item) => s + (item.unit_cost || 0) * (item.quantity || 0), 0);
      return sum + itemSpend;
    }, 0);

    return { supplierPos, monthlyTrend, radarData, statusBreakdown, avgFulfill, reliability, totalSpend };
  }, [selected, pos]);

  // ── bar chart color by status ──────────────────────────────────────────────
  const STATUS_COLORS = {
    received: "#10b981", approved: "#6366f1", ordered: "#3b82f6",
    submitted: "#8b5cf6", pending_approval: "#f59e0b",
    rejected: "#ef4444", cancelled: "#94a3b8", draft: "#cbd5e1",
  };

  return (
    <div className="p-4 lg:p-6 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-xl font-bold text-slate-800 flex items-center gap-2">
          <TrendingUp className="w-5 h-5 text-emerald-500" /> Supplier Performance
        </h1>
        <p className="text-sm text-slate-500 mt-0.5">Select a supplier to view detailed performance analytics from historical PO data.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: Supplier List */}
        <div className="space-y-3">
          <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">{suppliers.length} Suppliers</p>
          <div className="space-y-2 max-h-[calc(100vh-220px)] overflow-y-auto pr-1">
            {suppliers.map(s => (
              <SupplierCard
                key={s.id}
                supplier={s}
                pos={pos}
                selected={selected?.id === s.id}
                onSelect={setSelected}
              />
            ))}
          </div>
        </div>

        {/* Right: Detail Panel */}
        <div className="lg:col-span-2 space-y-4">
          {!selected ? (
            <div className="rounded-xl border-2 border-dashed border-slate-200 bg-slate-50 flex flex-col items-center justify-center min-h-[400px] text-center p-8 gap-3">
              <Building2 className="w-10 h-10 text-slate-300" />
              <p className="font-medium text-slate-400">Select a supplier</p>
              <p className="text-sm text-slate-400">Click any supplier on the left to see their performance analytics.</p>
            </div>
          ) : (
            <>
              {/* KPI strip */}
              <div className="bg-white rounded-xl border border-slate-200/80 p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-bold text-slate-800">{selected.name}</p>
                    <p className="text-xs text-slate-400">{selected.country}{selected.country && selected.payment_terms ? " · " : ""}{selected.payment_terms?.replace("_", " ").toUpperCase()}</p>
                  </div>
                  <div className="flex items-center gap-3 text-sm">
                    {selected.performance_rating != null && (
                      <span className="flex items-center gap-1 text-amber-500 font-semibold">
                        <Star className="w-4 h-4" />{selected.performance_rating.toFixed(1)}
                      </span>
                    )}
                    {selected.on_time_delivery_pct != null && (
                      <span className="flex items-center gap-1 text-blue-500 font-semibold">
                        <Clock className="w-4 h-4" />{selected.on_time_delivery_pct}% OTD
                      </span>
                    )}
                  </div>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  <StatPill label="Total POs" value={analysis.supplierPos.length} color="slate" />
                  <StatPill label="Reliability" value={analysis.reliability != null ? `${analysis.reliability}%` : null}
                    color={analysis.reliability >= 85 ? "emerald" : analysis.reliability >= 60 ? "amber" : "red"} />
                  <StatPill label="Avg Fulfillment" value={analysis.avgFulfill != null ? `${analysis.avgFulfill.toFixed(1)}` : null} unit="days" color="blue" />
                  <StatPill label="Est. Spend" value={analysis.totalSpend > 0 ? `SGD ${analysis.totalSpend >= 1000 ? (analysis.totalSpend / 1000).toFixed(1) + "k" : analysis.totalSpend.toFixed(0)}` : null} color="emerald" />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Monthly trend */}
                <div className="bg-white rounded-xl border border-slate-200/80 p-4 space-y-2">
                  <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Monthly Orders</p>
                  {analysis.monthlyTrend.length === 0 ? (
                    <p className="text-xs text-slate-400 py-6 text-center">No order history</p>
                  ) : (
                    <ResponsiveContainer width="100%" height={160}>
                      <BarChart data={analysis.monthlyTrend} margin={{ top: 4, right: 4, bottom: 0, left: -20 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                        <XAxis dataKey="name" tick={{ fontSize: 10, fill: "#94a3b8" }} />
                        <YAxis allowDecimals={false} tick={{ fontSize: 10, fill: "#94a3b8" }} />
                        <Tooltip contentStyle={{ fontSize: 11, borderRadius: 8 }} />
                        <Bar dataKey="orders" name="Orders" fill="#6366f1" radius={[3, 3, 0, 0]} />
                        <Bar dataKey="rejected" name="Rejected" fill="#fca5a5" radius={[3, 3, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  )}
                </div>

                {/* Avg fulfillment trend */}
                <div className="bg-white rounded-xl border border-slate-200/80 p-4 space-y-2">
                  <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Avg Fulfillment Days</p>
                  {analysis.monthlyTrend.filter(m => m.avgDays != null).length === 0 ? (
                    <p className="text-xs text-slate-400 py-6 text-center">No fulfillment data yet</p>
                  ) : (
                    <ResponsiveContainer width="100%" height={160}>
                      <LineChart data={analysis.monthlyTrend} margin={{ top: 4, right: 4, bottom: 0, left: -20 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                        <XAxis dataKey="name" tick={{ fontSize: 10, fill: "#94a3b8" }} />
                        <YAxis tick={{ fontSize: 10, fill: "#94a3b8" }} />
                        <Tooltip contentStyle={{ fontSize: 11, borderRadius: 8 }} formatter={(v) => [`${v} days`, "Avg Fulfillment"]} />
                        <Line type="monotone" dataKey="avgDays" stroke="#10b981" strokeWidth={2} dot={{ r: 3 }} connectNulls />
                        {selected.lead_time_days && (
                          <Line type="monotone" dataKey={() => selected.lead_time_days} name="Lead Time Target" stroke="#f59e0b" strokeWidth={1.5} strokeDasharray="4 3" dot={false} />
                        )}
                      </LineChart>
                    </ResponsiveContainer>
                  )}
                </div>

                {/* Radar chart */}
                <div className="bg-white rounded-xl border border-slate-200/80 p-4 space-y-2">
                  <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Scorecard</p>
                  <ResponsiveContainer width="100%" height={200}>
                    <RadarChart data={analysis.radarData}>
                      <PolarGrid stroke="#e2e8f0" />
                      <PolarAngleAxis dataKey="subject" tick={{ fontSize: 10, fill: "#64748b" }} />
                      <PolarRadiusAxis angle={90} domain={[0, 5]} tick={{ fontSize: 9, fill: "#94a3b8" }} />
                      <Radar name={selected.name} dataKey="A" stroke="#10b981" fill="#10b981" fillOpacity={0.25} strokeWidth={2} />
                    </RadarChart>
                  </ResponsiveContainer>
                </div>

                {/* Status breakdown */}
                <div className="bg-white rounded-xl border border-slate-200/80 p-4 space-y-3">
                  <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">PO Status Breakdown</p>
                  {analysis.statusBreakdown.length === 0 ? (
                    <p className="text-xs text-slate-400 py-6 text-center">No orders yet</p>
                  ) : (
                    <div className="space-y-2">
                      {analysis.statusBreakdown
                        .sort((a, b) => b.count - a.count)
                        .map(({ status, count }) => {
                          const pct = Math.round((count / analysis.supplierPos.length) * 100);
                          const color = STATUS_COLORS[status] || "#cbd5e1";
                          return (
                            <div key={status} className="space-y-0.5">
                              <div className="flex justify-between text-[11px]">
                                <span className="text-slate-600 capitalize">{status.replace("_", " ")}</span>
                                <span className="font-semibold text-slate-700">{count} <span className="text-slate-400 font-normal">({pct}%)</span></span>
                              </div>
                              <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
                                <div className="h-full rounded-full transition-all" style={{ width: `${pct}%`, backgroundColor: color }} />
                              </div>
                            </div>
                          );
                        })}
                    </div>
                  )}
                </div>
              </div>

              {/* Recent POs table */}
              <div className="bg-white rounded-xl border border-slate-200/80 overflow-hidden">
                <div className="px-4 py-3 border-b border-slate-100">
                  <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Recent Purchase Orders</p>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-xs">
                    <thead>
                      <tr className="bg-slate-50/80 text-slate-500">
                        <th className="px-4 py-2 text-left font-semibold">PO #</th>
                        <th className="px-4 py-2 text-left font-semibold">Date</th>
                        <th className="px-4 py-2 text-right font-semibold">Value (SGD)</th>
                        <th className="px-4 py-2 text-center font-semibold">Status</th>
                        <th className="px-4 py-2 text-center font-semibold">Flagged</th>
                        <th className="px-4 py-2 text-right font-semibold">Fulfillment</th>
                      </tr>
                    </thead>
                    <tbody>
                      {analysis.supplierPos.slice(0, 10).map(po => {
                        const days = po.approved_at && po.created_date
                          ? ((new Date(po.approved_at) - new Date(po.created_date)) / 86400000).toFixed(1)
                          : null;
                        return (
                          <tr key={po.id} className="border-t border-slate-50 hover:bg-slate-50/50">
                            <td className="px-4 py-2 font-mono text-slate-700">{po.po_number}</td>
                            <td className="px-4 py-2 text-slate-500">
                              {po.created_date ? new Date(po.created_date).toLocaleDateString("en-SG", { day: "2-digit", month: "short", year: "2-digit" }) : "—"}
                            </td>
                            <td className="px-4 py-2 text-right font-medium text-slate-700">
                              {po.total_value != null ? po.total_value.toFixed(2) : "—"}
                            </td>
                            <td className="px-4 py-2 text-center">
                              <span className="inline-block px-2 py-0.5 rounded-full text-[10px] font-medium capitalize"
                                style={{ backgroundColor: (STATUS_COLORS[po.status] || "#e2e8f0") + "22", color: STATUS_COLORS[po.status] || "#64748b" }}>
                                {po.status?.replace("_", " ")}
                              </span>
                            </td>
                            <td className="px-4 py-2 text-center">
                              {po.flagged
                                ? <AlertTriangle className="w-3.5 h-3.5 text-amber-500 inline" />
                                : <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 inline" />}
                            </td>
                            <td className="px-4 py-2 text-right text-slate-500">{days ? `${days}d` : "—"}</td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}