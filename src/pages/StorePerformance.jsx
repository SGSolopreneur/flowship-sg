import React, { useState, useMemo } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  LineChart, Line,
} from "recharts";
import { Store as StoreIcon, TrendingUp, Package, Truck, CheckCircle2, Clock, MapPin } from "lucide-react";
import EmptyState from "../components/shared/EmptyState";
import { cn } from "@/lib/utils";
import { format } from "date-fns";

function StatPill({ label, value, unit, color = "slate" }) {
  const colors = {
    emerald: "bg-emerald-50 text-emerald-700",
    blue: "bg-blue-50 text-blue-700",
    amber: "bg-amber-50 text-amber-700",
    red: "bg-red-50 text-red-700",
    slate: "bg-slate-100 text-slate-600",
  };
  return (
    <div className={cn("rounded-lg px-3 py-2 text-center", colors[color])}>
      <p className="text-[10px] uppercase tracking-wider font-medium opacity-70">{label}</p>
      <p className="text-lg font-bold leading-tight">
        {value ?? "—"}{value != null && unit ? <span className="text-xs font-normal ml-0.5">{unit}</span> : null}
      </p>
    </div>
  );
}

export default function StorePerformance() {
  const [selectedStore, setSelectedStore] = useState(null);

  const { data: stores = [] } = useQuery({
    queryKey: ["stores"],
    queryFn: () => base44.entities.Store.list(),
  });

  const { data: transfers = [] } = useQuery({
    queryKey: ["transfers"],
    queryFn: () => base44.entities.TransferOrder.list("-created_date", 500),
  });

  const { data: inventory = [] } = useQuery({
    queryKey: ["inventory"],
    queryFn: () => base44.entities.InventoryItem.list("-updated_date", 500),
  });

  const { data: products = [] } = useQuery({
    queryKey: ["products"],
    queryFn: () => base44.entities.Product.list(),
  });

  const analysis = useMemo(() => {
    if (!selectedStore) return null;

    const storeTransfers = transfers.filter(t => t.store_id === selectedStore.id);
    const delivered = storeTransfers.filter(t => t.status === "delivered");
    const inTransit = storeTransfers.filter(t => ["in_transit", "dispatched"].includes(t.status));
    const cancelled = storeTransfers.filter(t => t.status === "cancelled");

    const fulfillmentRate = storeTransfers.length
      ? Math.round((delivered.length / (storeTransfers.length - cancelled.length || 1)) * 100)
      : null;

    // Stock turnover: delivered items / current stock
    const totalDeliveredItems = delivered.reduce((sum, t) =>
      sum + (t.items || []).reduce((s, i) => s + (i.quantity_received || i.quantity_picked || 0), 0), 0
    );

    const storeInventory = inventory.filter(i => i.location_id === selectedStore.id);
    const currentStock = storeInventory.reduce((s, i) => s + (i.quantity || 0), 0);
    const turnoverRatio = currentStock > 0 ? (totalDeliveredItems / currentStock).toFixed(2) : null;

    // Monthly delivery trend
    const byMonth = {};
    delivered.forEach(t => {
      if (!t.actual_delivery_date && !t.created_date) return;
      const d = new Date(t.actual_delivery_date || t.created_date);
      const mk = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
      if (!byMonth[mk]) byMonth[mk] = { month: mk, delivered: 0, items: 0 };
      byMonth[mk].delivered++;
      byMonth[mk].items += (t.items || []).reduce((s, i) => s + (i.quantity_received || i.quantity_picked || 0), 0);
    });
    const monthlyTrend = Object.values(byMonth)
      .sort((a, b) => a.month.localeCompare(b.month))
      .slice(-6)
      .map(m => ({
        name: format(new Date(m.month + "-01"), "MMM yy"),
        delivered: m.delivered,
        items: m.items,
      }));

    // Low stock items at store
    const lowStockItems = storeInventory.filter(inv => {
      const product = products.find(p => p.id === inv.product_id);
      return product?.min_stock_level != null && inv.quantity <= product.min_stock_level;
    });

    // Category breakdown of inventory
    const catBreakdown = {};
    storeInventory.forEach(inv => {
      const product = products.find(p => p.id === inv.product_id);
      const cat = product?.category || "other";
      catBreakdown[cat] = (catBreakdown[cat] || 0) + (inv.quantity || 0);
    });
    const categoryData = Object.entries(catBreakdown)
      .map(([cat, qty]) => ({ name: cat.replace(/_/g, " "), qty }))
      .sort((a, b) => b.qty - a.qty)
      .slice(0, 6);

    return {
      storeTransfers, delivered, inTransit, cancelled,
      fulfillmentRate, totalDeliveredItems, currentStock, turnoverRatio,
      monthlyTrend, lowStockItems, categoryData, storeInventory,
    };
  }, [selectedStore, transfers, inventory, products]);

  return (
    <div className="p-4 lg:p-6 max-w-7xl mx-auto space-y-6 w-full">
      <div className="flex flex-col gap-2">
        <div className="flex items-center gap-2">
          <TrendingUp className="w-5 h-5 text-amber-600" />
          <h1 className="text-lg font-bold text-amber-900">Store Performance</h1>
        </div>
        <p className="text-xs text-amber-700">Analytical insights for individual supermarket locations</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Store list */}
        <div className="space-y-3">
          <p className="text-xs font-semibold text-amber-700 uppercase tracking-wider">{stores.length} Stores</p>
          <div className="space-y-2 max-h-[calc(100vh-220px)] overflow-y-auto pr-1">
            {stores.map(store => {
              const storeTransfers = transfers.filter(t => t.store_id === store.id);
              const delivered = storeTransfers.filter(t => t.status === "delivered").length;
              const rate = storeTransfers.length ? Math.round((delivered / storeTransfers.length) * 100) : null;
              return (
                <button
                  key={store.id}
                  onClick={() => setSelectedStore(store)}
                  className={cn(
                    "text-left w-full rounded-xl border p-4 transition-all space-y-2",
                    selectedStore?.id === store.id
                      ? "border-amber-400 bg-amber-50/60 shadow-sm"
                      : "border-orange-200 bg-white hover:border-amber-300 hover:shadow-sm"
                  )}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <p className="font-semibold text-sm text-slate-800 leading-tight">{store.name}</p>
                      <p className="text-[11px] text-slate-400 font-mono">{store.code}</p>
                    </div>
                    <span className={cn(
                      "text-[10px] px-2 py-0.5 rounded-full font-medium",
                      store.status === "active" ? "bg-emerald-100 text-emerald-700" :
                      store.status === "renovation" ? "bg-amber-100 text-amber-700" :
                      "bg-slate-100 text-slate-500"
                    )}>
                      {store.status}
                    </span>
                  </div>
                  <div className="flex items-center gap-3 text-[11px] text-slate-500">
                    <span className="flex items-center gap-1"><MapPin className="w-3 h-3" />{store.region}</span>
                    {rate != null && (
                      <span className={cn("font-medium", rate >= 80 ? "text-emerald-600" : rate >= 50 ? "text-amber-600" : "text-red-600")}>
                        {rate}% fulfilled
                      </span>
                    )}
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Detail panel */}
        <div className="lg:col-span-2 space-y-4">
          {!selectedStore || !analysis ? (
            <div className="rounded-xl border-2 border-dashed border-orange-200 bg-orange-50/30 flex flex-col items-center justify-center min-h-[400px] text-center p-8 gap-3">
              <StoreIcon className="w-10 h-10 text-amber-300" />
              <p className="font-medium text-amber-700">Select a store</p>
              <p className="text-sm text-amber-600">Click any store on the left to view performance analytics.</p>
            </div>
          ) : (
            <>
              {/* KPI strip */}
              <div className="bg-white rounded-xl border border-orange-200 p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-bold text-slate-800">{selectedStore.name}</p>
                    <p className="text-xs text-slate-400 capitalize">{selectedStore.store_type} · {selectedStore.region} Region</p>
                  </div>
                  <StoreIcon className="w-6 h-6 text-amber-400" />
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  <StatPill label="Fulfillment" value={analysis.fulfillmentRate} unit="%" color={analysis.fulfillmentRate >= 80 ? "emerald" : analysis.fulfillmentRate >= 50 ? "amber" : "red"} />
                  <StatPill label="Turnover" value={analysis.turnoverRatio} unit="x" color="blue" />
                  <StatPill label="Current Stock" value={analysis.currentStock} unit="units" color="slate" />
                  <StatPill label="Low Stock" value={analysis.lowStockItems.length} color={analysis.lowStockItems.length > 0 ? "amber" : "emerald"} />
                </div>
              </div>

              {/* Quick stats */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="bg-white rounded-lg border border-orange-200 p-3 flex items-center gap-2">
                  <Truck className="w-5 h-5 text-blue-500" />
                  <div>
                    <p className="text-[10px] text-slate-500">Total Transfers</p>
                    <p className="text-sm font-bold text-slate-800">{analysis.storeTransfers.length}</p>
                  </div>
                </div>
                <div className="bg-white rounded-lg border border-orange-200 p-3 flex items-center gap-2">
                  <CheckCircle2 className="w-5 h-5 text-emerald-500" />
                  <div>
                    <p className="text-[10px] text-slate-500">Delivered</p>
                    <p className="text-sm font-bold text-slate-800">{analysis.delivered.length}</p>
                  </div>
                </div>
                <div className="bg-white rounded-lg border border-orange-200 p-3 flex items-center gap-2">
                  <Clock className="w-5 h-5 text-amber-500" />
                  <div>
                    <p className="text-[10px] text-slate-500">In Transit</p>
                    <p className="text-sm font-bold text-slate-800">{analysis.inTransit.length}</p>
                  </div>
                </div>
                <div className="bg-white rounded-lg border border-orange-200 p-3 flex items-center gap-2">
                  <Package className="w-5 h-5 text-indigo-500" />
                  <div>
                    <p className="text-[10px] text-slate-500">Delivered Units</p>
                    <p className="text-sm font-bold text-slate-800">{analysis.totalDeliveredItems}</p>
                  </div>
                </div>
              </div>

              {/* Charts */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="bg-white rounded-xl border border-orange-200 p-4 space-y-2">
                  <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Monthly Deliveries</p>
                  {analysis.monthlyTrend.length === 0 ? (
                    <p className="text-xs text-slate-400 py-6 text-center">No delivery history</p>
                  ) : (
                    <ResponsiveContainer width="100%" height={180}>
                      <BarChart data={analysis.monthlyTrend} margin={{ top: 4, right: 4, bottom: 0, left: -20 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#fef3e2" />
                        <XAxis dataKey="name" tick={{ fontSize: 10, fill: "#94a3b8" }} />
                        <YAxis allowDecimals={false} tick={{ fontSize: 10, fill: "#94a3b8" }} />
                        <Tooltip contentStyle={{ fontSize: 11, borderRadius: 8 }} />
                        <Bar dataKey="delivered" name="Deliveries" fill="#f59e0b" radius={[3, 3, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  )}
                </div>

                <div className="bg-white rounded-xl border border-orange-200 p-4 space-y-2">
                  <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Stock by Category</p>
                  {analysis.categoryData.length === 0 ? (
                    <p className="text-xs text-slate-400 py-6 text-center">No inventory data</p>
                  ) : (
                    <ResponsiveContainer width="100%" height={180}>
                      <BarChart data={analysis.categoryData} layout="vertical" margin={{ top: 4, right: 8, bottom: 0, left: 20 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#fef3e2" />
                        <XAxis type="number" tick={{ fontSize: 10, fill: "#94a3b8" }} />
                        <YAxis type="category" dataKey="name" tick={{ fontSize: 9, fill: "#94a3b8" }} width={70} />
                        <Tooltip contentStyle={{ fontSize: 11, borderRadius: 8 }} />
                        <Bar dataKey="qty" name="Units" fill="#fb923c" radius={[0, 3, 3, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  )}
                </div>
              </div>

              {/* Low stock items */}
              <div className="bg-white rounded-xl border border-orange-200 overflow-hidden">
                <div className="px-4 py-3 border-b border-orange-100">
                  <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Low Stock Alerts at This Store</p>
                </div>
                {analysis.lowStockItems.length === 0 ? (
                  <p className="text-xs text-slate-400 py-6 text-center">All stock levels are healthy</p>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-xs">
                      <thead>
                        <tr className="bg-orange-50/50 text-slate-500">
                          <th className="px-4 py-2 text-left font-semibold">Product</th>
                          <th className="px-4 py-2 text-right font-semibold">Current</th>
                          <th className="px-4 py-2 text-right font-semibold">Min Level</th>
                          <th className="px-4 py-2 text-center font-semibold">Status</th>
                        </tr>
                      </thead>
                      <tbody>
                        {analysis.lowStockItems.map(inv => {
                          const product = products.find(p => p.id === inv.product_id);
                          const minLevel = product?.min_stock_level || 0;
                          return (
                            <tr key={inv.id} className="border-t border-orange-50 hover:bg-orange-50/30">
                              <td className="px-4 py-2 text-slate-700 font-medium">{inv.product_name}</td>
                              <td className="px-4 py-2 text-right text-red-600 font-medium">{inv.quantity}</td>
                              <td className="px-4 py-2 text-right text-slate-500">{minLevel}</td>
                              <td className="px-4 py-2 text-center">
                                <span className="inline-block px-2 py-0.5 rounded-full text-[10px] font-medium bg-red-100 text-red-700">
                                  Below Min
                                </span>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}