import React from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { BarChart2 } from "lucide-react";
import FastestMovingProducts from "../components/analytics/FastestMovingProducts";
import StockOutFrequency from "../components/analytics/StockOutFrequency";
import FulfillmentTime from "../components/analytics/FulfillmentTime";
import StoreLeaderboard from "../components/analytics/StoreLeaderboard";

export default function Analytics() {
  const { data: stores = [] } = useQuery({ queryKey: ["stores"], queryFn: () => base44.entities.Store.list() });
  const { data: products = [] } = useQuery({ queryKey: ["products"], queryFn: () => base44.entities.Product.list() });
  const { data: inventory = [] } = useQuery({ queryKey: ["inventory"], queryFn: () => base44.entities.InventoryItem.list() });
  const { data: transfers = [] } = useQuery({ queryKey: ["transfers"], queryFn: () => base44.entities.TransferOrder.list("-created_date") });

  const deliveredCount = transfers.filter(t => t.status === "delivered").length;
  const totalStores = stores.filter(s => s.status === "active").length;
  const totalRequests = transfers.length;

  return (
    <div className="p-4 lg:p-6 max-w-7xl mx-auto space-y-6 w-full">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="w-9 h-9 rounded-xl bg-violet-100 flex items-center justify-center">
          <BarChart2 className="w-5 h-5 text-violet-600" />
        </div>
        <div>
          <h1 className="text-lg font-bold text-slate-800">Store Performance Analytics</h1>
          <p className="text-xs text-slate-400">{totalStores} active stores · {deliveredCount} delivered transfers · {totalRequests} total orders</p>
        </div>
      </div>

      {/* Top charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <FastestMovingProducts transfers={transfers} stores={stores} />
        <FulfillmentTime transfers={transfers} stores={stores} />
      </div>

      {/* Stock-out + Leaderboard */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <StockOutFrequency inventory={inventory} products={products} stores={stores} />
        <StoreLeaderboard transfers={transfers} stores={stores} inventory={inventory} products={products} />
      </div>
    </div>
  );
}