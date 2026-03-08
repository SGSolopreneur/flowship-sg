import React from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { Package, Store, Truck, AlertTriangle, ShoppingCart } from "lucide-react";
import StatCard from "../components/dashboard/StatCard";
import LowStockAlert from "../components/dashboard/LowStockAlert";
import RecentTransfers from "../components/dashboard/RecentTransfers";
import CategoryBreakdown from "../components/dashboard/CategoryBreakdown";
import ReorderSuggestions from "../components/dashboard/ReorderSuggestions";
import ExpiryAlert from "../components/dashboard/ExpiryAlert";

export default function Dashboard() {
  const { data: products = [] } = useQuery({
    queryKey: ["products"],
    queryFn: () => base44.entities.Product.list(),
  });

  const { data: stores = [] } = useQuery({
    queryKey: ["stores"],
    queryFn: () => base44.entities.Store.list(),
  });

  const { data: inventory = [] } = useQuery({
    queryKey: ["inventory"],
    queryFn: () => base44.entities.InventoryItem.list(),
  });

  const { data: transfers = [] } = useQuery({
    queryKey: ["transfers"],
    queryFn: () => base44.entities.TransferOrder.list("-created_date"),
  });

  const warehouseStock = inventory.filter(i => i.location_type === "warehouse");
  const totalWarehouseQty = warehouseStock.reduce((sum, i) => sum + (i.quantity || 0), 0);
  const activeStores = stores.filter(s => s.status === "active").length;
  const pendingTransfers = transfers.filter(t => ["draft", "confirmed", "picking", "dispatched", "in_transit"].includes(t.status)).length;
  const lowStockCount = warehouseStock.filter(item => {
    const product = products.find(p => p.id === item.product_id);
    return product && item.quantity <= (product.min_stock_level || 10);
  }).length;

  return (
    <div className="p-4 lg:p-6 space-y-6 max-w-7xl mx-auto">
      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3 lg:gap-4">
        <StatCard title="Products" value={products.length} icon={ShoppingCart} color="blue" subtitle="In catalog" />
        <StatCard title="Warehouse Stock" value={totalWarehouseQty.toLocaleString()} icon={Package} color="emerald" subtitle="Total units" />
        <StatCard title="Active Stores" value={activeStores} icon={Store} color="violet" subtitle={`of ${stores.length} total`} />
        <StatCard title="Pending Transfers" value={pendingTransfers} icon={Truck} color="amber" subtitle="In progress" />
        <StatCard title="Low Stock" value={lowStockCount} icon={AlertTriangle} color="red" subtitle="Need attention" />
      </div>

      {/* Charts + Alerts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2">
          <RecentTransfers transfers={transfers} />
        </div>
        <div className="space-y-4">
          <CategoryBreakdown inventoryItems={warehouseStock} />
          <ExpiryAlert inventoryItems={inventory} />
          <ReorderSuggestions inventoryItems={inventory} products={products} />
          <LowStockAlert items={warehouseStock} products={products} />
        </div>
      </div>
    </div>
  );
}