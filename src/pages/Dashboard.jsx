import React from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { Package, Store, Truck, AlertTriangle, ShoppingCart, FileDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import StatCard from "../components/dashboard/StatCard";
import LowStockAlert from "../components/dashboard/LowStockAlert";
import RecentTransfers from "../components/dashboard/RecentTransfers";
import CategoryBreakdown from "../components/dashboard/CategoryBreakdown";
import ReorderSuggestions from "../components/dashboard/ReorderSuggestions";
import ExpiryAlert from "../components/dashboard/ExpiryAlert";
import VehicleMap from "../components/dashboard/VehicleMap";
import { generateStockSummaryPDF } from "../components/shared/PdfReportGenerator";

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

  const { data: suppliers = [] } = useQuery({
    queryKey: ["suppliers"],
    queryFn: () => base44.entities.Supplier.list(),
  });

  const { data: vehicles = [] } = useQuery({
    queryKey: ["vehicles"],
    queryFn: () => base44.entities.Vehicle.list(),
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
    <div className="p-4 lg:p-6 space-y-6 max-w-7xl mx-auto w-full">
      {/* Header with report download */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div className="min-w-0">
          <h1 className="text-lg font-bold text-slate-800">Dashboard</h1>
          <p className="text-xs text-slate-400 mt-0.5">Live overview · Singapore SGT</p>
        </div>
        <Button
          variant="outline"
          size="sm"
          className="border-slate-200 text-slate-600 hover:bg-slate-50 gap-1.5 w-full sm:w-auto"
          onClick={() => generateStockSummaryPDF({ inventory, products, stores })}
        >
          <FileDown className="w-4 h-4" />
          <span className="hidden sm:inline">Stock Summary PDF</span>
          <span className="sm:hidden">PDF</span>
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 lg:gap-4">
        <StatCard title="Products" value={products.length} icon={ShoppingCart} color="blue" subtitle="In catalog" to="/Products" />
        <StatCard title="Warehouse Stock" value={totalWarehouseQty.toLocaleString()} icon={Package} color="emerald" subtitle="Total units" to="/Inventory" />
        <StatCard title="Active Stores" value={activeStores} icon={Store} color="violet" subtitle={`of ${stores.length} total`} to="/Stores" />
        <StatCard title="Pending Transfers" value={pendingTransfers} icon={Truck} color="amber" subtitle="In progress" to="/Transfers" />
        <StatCard title="Low Stock" value={lowStockCount} icon={AlertTriangle} color="red" subtitle="Need attention" to="/Inventory" />
      </div>

      {/* Vehicle Map */}
      <div>
        <h2 className="text-sm font-semibold text-slate-800 mb-3">Live Vehicle Tracking</h2>
        <VehicleMap transfers={transfers} vehicles={vehicles} />
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