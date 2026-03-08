import React, { useState } from "react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from "recharts";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Zap } from "lucide-react";

const COLORS = ["#10b981", "#34d399", "#6ee7b7", "#a7f3d0", "#d1fae5"];

export default function FastestMovingProducts({ transfers, stores }) {
  const [selectedStore, setSelectedStore] = useState("all");

  const storeTransfers = transfers.filter(t =>
    t.status === "delivered" &&
    (selectedStore === "all" || t.store_id === selectedStore)
  );

  const productTotals = {};
  storeTransfers.forEach(t => {
    (t.items || []).forEach(item => {
      if (!item.product_name) return;
      productTotals[item.product_name] = (productTotals[item.product_name] || 0) + (item.quantity_received || item.quantity_requested || 0);
    });
  });

  const chartData = Object.entries(productTotals)
    .map(([name, qty]) => ({ name: name.length > 18 ? name.slice(0, 18) + "…" : name, qty }))
    .sort((a, b) => b.qty - a.qty)
    .slice(0, 8);

  return (
    <div className="bg-white rounded-xl border border-slate-200 p-5">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-emerald-100 flex items-center justify-center">
            <Zap className="w-3.5 h-3.5 text-emerald-600" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-slate-800">Fastest Moving Products</h3>
            <p className="text-xs text-slate-400">By total units delivered</p>
          </div>
        </div>
        <Select value={selectedStore} onValueChange={setSelectedStore}>
          <SelectTrigger className="w-36 h-7 text-xs"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Stores</SelectItem>
            {stores.map(s => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>
      {chartData.length === 0 ? (
        <div className="h-48 flex items-center justify-center text-sm text-slate-400">No delivered transfers yet</div>
      ) : (
        <ResponsiveContainer width="100%" height={220}>
          <BarChart data={chartData} layout="vertical" margin={{ left: 0, right: 16 }}>
            <XAxis type="number" tick={{ fontSize: 11 }} tickLine={false} axisLine={false} />
            <YAxis type="category" dataKey="name" tick={{ fontSize: 11 }} tickLine={false} axisLine={false} width={120} />
            <Tooltip
              formatter={(v) => [v + " units", "Qty"]}
              contentStyle={{ fontSize: 12, borderRadius: 8, border: "1px solid #e2e8f0" }}
            />
            <Bar dataKey="qty" radius={[0, 4, 4, 0]} maxBarSize={20}>
              {chartData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      )}
    </div>
  );
}