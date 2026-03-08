import React, { useState } from "react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import {
  LayoutDashboard,
  Package,
  Store,
  Truck,
  ShoppingCart,
  Menu,
  X,
  ChevronRight,
  Warehouse,
  BarChart2,
  Building2,
  TrendingUp,
  ShieldCheck,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useRole } from "@/components/shared/useRole";

// sensitive: only admin + manager can see
const navItems = [
  { name: "Dashboard", icon: LayoutDashboard, page: "Dashboard", sensitive: false },
  { name: "Inventory", icon: Package, page: "Inventory", sensitive: false },
  { name: "Products", icon: ShoppingCart, page: "Products", sensitive: false },
  { name: "Stores", icon: Store, page: "Stores", sensitive: false },
  { name: "Transfers", icon: Truck, page: "Transfers", sensitive: false },
  { name: "Suppliers", icon: Building2, page: "Suppliers", sensitive: true },
  { name: "Supplier Performance", icon: TrendingUp, page: "SupplierPerformance", sensitive: true },
  { name: "Analytics", icon: BarChart2, page: "Analytics", sensitive: true },
];

export default function Layout({ children, currentPageName }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { canAccessSensitive, role } = useRole();
  const visibleNavItems = navItems.filter(item => !item.sensitive || canAccessSensitive);

  return (
    <div className="min-h-screen bg-slate-50 flex">
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/30 backdrop-blur-sm z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={cn(
          "fixed lg:static inset-y-0 left-0 z-50 w-[260px] bg-slate-900 text-white flex flex-col transition-transform duration-300 ease-in-out",
          sidebarOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
        )}
      >
        {/* Logo */}
        <div className="h-16 flex items-center gap-3 px-5 border-b border-white/10">
          <div className="w-8 h-8 rounded-lg bg-emerald-500 flex items-center justify-center">
            <Warehouse className="w-4.5 h-4.5 text-white" />
          </div>
          <div>
            <h1 className="text-sm font-semibold tracking-tight">WarehouseSG</h1>
            <p className="text-[10px] text-slate-400 tracking-wider uppercase">Distribution Hub</p>
          </div>
          <button
            className="ml-auto lg:hidden text-slate-400 hover:text-white"
            onClick={() => setSidebarOpen(false)}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 py-4 px-3 space-y-1">
          {navItems.map((item) => {
            const isActive = currentPageName === item.page;
            return (
              <Link
                key={item.page}
                to={createPageUrl(item.page)}
                onClick={() => setSidebarOpen(false)}
                className={cn(
                  "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200",
                  isActive
                    ? "bg-emerald-500/15 text-emerald-400"
                    : "text-slate-400 hover:text-white hover:bg-white/5"
                )}
              >
                <item.icon className={cn("w-[18px] h-[18px]", isActive && "text-emerald-400")} />
                <span>{item.name}</span>
                {isActive && <ChevronRight className="w-4 h-4 ml-auto text-emerald-400/50" />}
              </Link>
            );
          })}
        </nav>

        {/* Footer */}
        <div className="p-4 border-t border-white/10">
          <div className="bg-white/5 rounded-lg p-3">
            <p className="text-[11px] text-slate-500 uppercase tracking-wider">Region</p>
            <p className="text-sm text-slate-300 font-medium mt-0.5">Singapore 🇸🇬</p>
          </div>
        </div>
      </aside>

      {/* Main content */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top bar */}
        <header className="h-16 bg-white border-b border-slate-200 flex items-center px-4 lg:px-6 sticky top-0 z-30">
          <button
            className="lg:hidden p-2 -ml-2 text-slate-600 hover:text-slate-900"
            onClick={() => setSidebarOpen(true)}
          >
            <Menu className="w-5 h-5" />
          </button>
          <h2 className="text-lg font-semibold text-slate-800 ml-2 lg:ml-0">
            {currentPageName}
          </h2>
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-auto">
          {children}
        </main>
      </div>
    </div>
  );
}