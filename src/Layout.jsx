import React, { useState, useEffect } from "react";
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
  LogIn,
  Mail,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useRole } from "@/components/shared/useRole";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";

// sensitive: only admin + manager can see
const navItems = [
  { name: "Dashboard", icon: LayoutDashboard, page: "Dashboard", sensitive: false },
  { name: "My Deliveries", icon: Truck, page: "DriverDashboard", sensitive: false },
  { name: "Inventory", icon: Package, page: "Inventory", sensitive: false },
  { name: "Products", icon: ShoppingCart, page: "Products", sensitive: false },
  { name: "Stores", icon: Store, page: "Stores", sensitive: false },
  { name: "Transfers", icon: Truck, page: "Transfers", sensitive: false },
  { name: "Vehicles", icon: Truck, page: "Vehicles", sensitive: false },
  { name: "Suppliers", icon: Building2, page: "Suppliers", sensitive: true },
  { name: "Supplier Performance", icon: TrendingUp, page: "SupplierPerformance", sensitive: true },
  { name: "Automated Reports", icon: BarChart2, page: "AutomatedReporting", sensitive: true },
  { name: "Analytics", icon: BarChart2, page: "Analytics", sensitive: true },
];

export default function Layout({ children, currentPageName }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { canAccessSensitive, role } = useRole();
  const visibleNavItems = navItems.filter(item => !item.sensitive || canAccessSensitive);

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-amber-50 to-yellow-50 flex">
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
          "fixed lg:static inset-y-0 left-0 z-50 w-[260px] bg-gradient-to-b from-orange-900 to-amber-900 text-white flex flex-col transition-transform duration-300 ease-in-out",
          sidebarOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
        )}
      >
        {/* Logo */}
        <div className="h-16 flex items-center gap-3 px-5 border-b border-white/10">
          <div className="w-8 h-8 rounded-lg bg-orange-500 flex items-center justify-center">
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
        <nav className="flex-1 py-4 px-3 space-y-1 overflow-y-auto">
          {visibleNavItems.map((item) => {
            const isActive = currentPageName === item.page;
            return (
              <Link
                key={item.page}
                to={createPageUrl(item.page)}
                onClick={() => setSidebarOpen(false)}
                className={cn(
                  "flex items-center gap-3 px-3 py-3 rounded-lg text-sm font-medium transition-all duration-200",
                  isActive
                    ? "bg-orange-500/20 text-orange-300"
                    : "text-amber-200 hover:text-white hover:bg-white/5"
                )}
              >
                <item.icon className={cn("w-[18px] h-[18px]", isActive && "text-orange-300")} />
                <span>{item.name}</span>
                {isActive && <ChevronRight className="w-4 h-4 ml-auto text-orange-300/50" />}
              </Link>
            );
          })}
        </nav>

        {/* Footer */}
        <div className="p-4 border-t border-white/10 space-y-2">
          <a
            href="mailto:contact@flowshipsg.com"
            className="flex items-center gap-2 px-3 py-2.5 rounded-lg bg-white/5 hover:bg-white/10 transition-colors"
          >
            <Mail className="w-4 h-4 text-slate-400" />
            <span className="text-sm text-slate-300">Contact Us</span>
          </a>
          <div className="bg-white/5 rounded-lg p-3">
            <p className="text-[11px] text-slate-500 uppercase tracking-wider">Region</p>
            <p className="text-sm text-slate-300 font-medium mt-0.5">Singapore 🇸🇬</p>
          </div>
          <div className="flex items-center gap-2 px-1">
            <ShieldCheck className="w-3.5 h-3.5 text-slate-500" />
            <span className="text-[11px] text-slate-500 capitalize">{role} access</span>
          </div>
        </div>
      </aside>

      {/* Main content */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top bar */}
        <header className="h-16 bg-gradient-to-r from-orange-50 to-amber-50 border-b border-orange-200 flex items-center px-4 lg:px-6 sticky top-0 z-30 shrink-0">
          <button
            className="lg:hidden p-2 -ml-2 text-orange-700 hover:text-orange-900"
            onClick={() => setSidebarOpen(true)}
          >
            <Menu className="w-5 h-5" />
          </button>
          <h2 className="text-sm sm:text-base md:text-lg font-semibold text-amber-900 ml-2 lg:ml-0 truncate">
            {currentPageName}
          </h2>
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-y-auto overflow-x-hidden">
          {children}
        </main>
      </div>
    </div>
  );
}