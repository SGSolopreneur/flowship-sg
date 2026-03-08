import React from "react";
import { differenceInDays, parseISO } from "date-fns";
import { Trophy, TrendingUp, TrendingDown, Minus } from "lucide-react";

export default function StoreLeaderboard({ transfers, stores, inventory, products }) {
  const scores = stores
    .filter(s => s.status === "active")
    .map(store => {
      const storeTransfers = transfers.filter(t => t.store_id === store.id);
      const delivered = storeTransfers.filter(t => t.status === "delivered" && t.actual_delivery_date);
      const avgFulfillment = delivered.length > 0
        ? delivered.reduce((s, t) => s + differenceInDays(parseISO(t.actual_delivery_date), parseISO(t.created_date)), 0) / delivered.length
        : null;

      const storeInv = inventory.filter(i => i.location_id === store.id || i.location_name === store.name);
      const stockOutRate = storeInv.length > 0
        ? Math.round((storeInv.filter(i => i.quantity <= 0).length / storeInv.length) * 100)
        : 0;

      const totalUnitsReceived = delivered.reduce((s, t) =>
        s + (t.items || []).reduce((sum, item) => sum + (item.quantity_received || item.quantity_requested || 0), 0), 0);

      return { store, avgFulfillment, stockOutRate, totalOrders: storeTransfers.length, delivered: delivered.length, totalUnitsReceived };
    })
    .sort((a, b) => b.totalUnitsReceived - a.totalUnitsReceived);

  const medals = ["🥇", "🥈", "🥉"];

  return (
    <div className="bg-white rounded-xl border border-slate-200 p-5">
      <div className="flex items-center gap-2 mb-4">
        <div className="w-7 h-7 rounded-lg bg-amber-100 flex items-center justify-center">
          <Trophy className="w-3.5 h-3.5 text-amber-600" />
        </div>
        <div>
          <h3 className="text-sm font-semibold text-slate-800">Store Performance Leaderboard</h3>
          <p className="text-xs text-slate-400">Ranked by total units received</p>
        </div>
      </div>
      {scores.length === 0 ? (
        <div className="text-center py-8 text-sm text-slate-400">No store data available</div>
      ) : (
        <div className="space-y-2">
          {scores.map((item, i) => (
            <div key={item.store.id} className={`flex items-center gap-3 p-3 rounded-lg ${i === 0 ? "bg-amber-50 border border-amber-100" : "bg-slate-50"}`}>
              <span className="text-base w-6 shrink-0">{medals[i] || `#${i + 1}`}</span>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-slate-800 truncate">{item.store.name}</p>
                <p className="text-[11px] text-slate-400">{item.store.region} · {item.store.store_type}</p>
              </div>
              <div className="flex items-center gap-4 text-right shrink-0">
                <div>
                  <p className="text-xs font-bold text-slate-700">{item.totalUnitsReceived.toLocaleString()}</p>
                  <p className="text-[10px] text-slate-400">units recv.</p>
                </div>
                <div>
                  <p className="text-xs font-bold text-slate-700">{item.delivered}/{item.totalOrders}</p>
                  <p className="text-[10px] text-slate-400">orders</p>
                </div>
                <div>
                  <p className={`text-xs font-bold ${item.stockOutRate > 20 ? "text-red-500" : item.stockOutRate > 5 ? "text-amber-500" : "text-emerald-600"}`}>
                    {item.stockOutRate}%
                  </p>
                  <p className="text-[10px] text-slate-400">stock-out</p>
                </div>
                {item.avgFulfillment !== null && (
                  <div>
                    <p className="text-xs font-bold text-indigo-600">{Math.round(item.avgFulfillment * 10) / 10}d</p>
                    <p className="text-[10px] text-slate-400">avg fulfill</p>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}