import React from "react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell, ReferenceLine } from "recharts";
import { Clock } from "lucide-react";
import { differenceInDays, parseISO } from "date-fns";

const COLORS = ["#6366f1", "#818cf8", "#a5b4fc", "#c7d2fe", "#e0e7ff"];

export default function FulfillmentTime({ transfers, stores }) {
  // Calculate average days from created_date to actual_delivery_date per store
  const storeStats = {};
  transfers
    .filter(t => t.status === "delivered" && t.actual_delivery_date)
    .forEach(t => {
      const days = differenceInDays(parseISO(t.actual_delivery_date), parseISO(t.created_date));
      if (days < 0 || days > 60) return; // sanity check
      if (!storeStats[t.store_name]) storeStats[t.store_name] = { total: 0, count: 0 };
      storeStats[t.store_name].total += days;
      storeStats[t.store_name].count += 1;
    });

  const chartData = Object.entries(storeStats)
    .map(([name, { total, count }]) => ({
      name: name.length > 14 ? name.slice(0, 14) + "…" : name,
      avgDays: Math.round((total / count) * 10) / 10,
      count,
    }))
    .sort((a, b) => a.avgDays - b.avgDays);

  const overallAvg = chartData.length > 0
    ? Math.round(chartData.reduce((s, d) => s + d.avgDays, 0) / chartData.length * 10) / 10
    : null;

  return (
    <div className="bg-white rounded-xl border border-slate-200 p-5">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-indigo-100 flex items-center justify-center">
            <Clock className="w-3.5 h-3.5 text-indigo-600" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-slate-800">Avg. Transfer Fulfillment Time</h3>
            <p className="text-xs text-slate-400">Days from order creation to delivery</p>
          </div>
        </div>
        {overallAvg !== null && (
          <div className="text-right">
            <p className="text-lg font-bold text-indigo-600">{overallAvg}d</p>
            <p className="text-[10px] text-slate-400">Overall avg</p>
          </div>
        )}
      </div>
      {chartData.length === 0 ? (
        <div className="h-48 flex items-center justify-center text-sm text-slate-400">No delivered transfers with dates yet</div>
      ) : (
        <ResponsiveContainer width="100%" height={220}>
          <BarChart data={chartData} margin={{ left: 0, right: 8, top: 4 }}>
            <XAxis dataKey="name" tick={{ fontSize: 11 }} tickLine={false} axisLine={false} />
            <YAxis tick={{ fontSize: 11 }} tickLine={false} axisLine={false} unit="d" />
            {overallAvg && (
              <ReferenceLine y={overallAvg} stroke="#a5b4fc" strokeDasharray="4 3" label={{ value: `Avg ${overallAvg}d`, fontSize: 10, fill: "#818cf8", position: "insideTopRight" }} />
            )}
            <Tooltip
              contentStyle={{ fontSize: 12, borderRadius: 8, border: "1px solid #e2e8f0" }}
              formatter={(v, _, props) => [`${v} days (${props.payload.count} orders)`, "Avg Fulfillment"]}
            />
            <Bar dataKey="avgDays" radius={[4, 4, 0, 0]} maxBarSize={40}>
              {chartData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      )}
    </div>
  );
}