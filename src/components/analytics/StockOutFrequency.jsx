import React from "react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, ReferenceLine, Cell } from "recharts";
import { AlertTriangle } from "lucide-react";

export default function StockOutFrequency({ inventory, products, stores }) {
  // For each active store, count how many inventory items are at 0 or below min_stock_level
  const storeData = stores
    .filter(s => s.status === "active")
    .map(store => {
      const storeInventory = inventory.filter(i => i.location_id === store.id || i.location_name === store.name);
      const stockOuts = storeInventory.filter(i => i.quantity <= 0).length;
      const lowStock = storeInventory.filter(i => {
        const product = products.find(p => p.id === i.product_id);
        return i.quantity > 0 && product && i.quantity <= (product.min_stock_level || 10);
      }).length;
      return {
        name: store.name.length > 14 ? store.name.slice(0, 14) + "…" : store.name,
        stockOuts,
        lowStock,
        total: storeInventory.length,
      };
    })
    .filter(s => s.total > 0);

  // If no store inventory, derive from warehouse low-stock as a proxy
  const warehouseData = inventory
    .filter(i => i.location_type === "warehouse")
    .reduce((acc, item) => {
      const product = products.find(p => p.id === item.product_id);
      if (!product) return acc;
      const isLow = item.quantity <= (product.min_stock_level || 10);
      const isOut = item.quantity <= 0;
      return { ...acc, low: acc.low + (isLow ? 1 : 0), out: acc.out + (isOut ? 1 : 0) };
    }, { low: 0, out: 0 });

  const showWarehouse = storeData.length === 0;
  const chartData = showWarehouse
    ? [{ name: "Warehouse", stockOuts: warehouseData.out, lowStock: warehouseData.low, total: inventory.filter(i => i.location_type === "warehouse").length }]
    : storeData;

  const maxVal = Math.max(...chartData.map(d => d.stockOuts + d.lowStock), 1);

  return (
    <div className="bg-white rounded-xl border border-slate-200 p-5">
      <div className="flex items-center gap-2 mb-1">
        <div className="w-7 h-7 rounded-lg bg-red-100 flex items-center justify-center">
          <AlertTriangle className="w-3.5 h-3.5 text-red-500" />
        </div>
        <div>
          <h3 className="text-sm font-semibold text-slate-800">Stock-Out Frequency by Location</h3>
          <p className="text-xs text-slate-400">Current snapshot of zero-stock & low-stock items</p>
        </div>
      </div>
      <div className="flex items-center gap-4 mb-4 mt-2">
        <span className="flex items-center gap-1.5 text-xs text-slate-500"><span className="w-2.5 h-2.5 rounded-sm bg-red-400 inline-block" /> Out of stock</span>
        <span className="flex items-center gap-1.5 text-xs text-slate-500"><span className="w-2.5 h-2.5 rounded-sm bg-amber-300 inline-block" /> Below min level</span>
      </div>
      {chartData.length === 0 ? (
        <div className="h-48 flex items-center justify-center text-sm text-slate-400">No inventory data available</div>
      ) : (
        <ResponsiveContainer width="100%" height={220}>
          <BarChart data={chartData} margin={{ left: 0, right: 8, top: 4 }}>
            <XAxis dataKey="name" tick={{ fontSize: 11 }} tickLine={false} axisLine={false} />
            <YAxis tick={{ fontSize: 11 }} tickLine={false} axisLine={false} allowDecimals={false} />
            <Tooltip
              contentStyle={{ fontSize: 12, borderRadius: 8, border: "1px solid #e2e8f0" }}
              formatter={(v, name) => [v, name === "stockOuts" ? "Out of stock" : "Below min level"]}
            />
            <Bar dataKey="stockOuts" stackId="a" fill="#f87171" name="stockOuts" radius={[0, 0, 0, 0]} maxBarSize={40} />
            <Bar dataKey="lowStock" stackId="a" fill="#fcd34d" name="lowStock" radius={[4, 4, 0, 0]} maxBarSize={40} />
          </BarChart>
        </ResponsiveContainer>
      )}
    </div>
  );
}