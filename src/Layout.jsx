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
  const [isAuthenticated, setIsAuthenticated] = useState(null);
  const { canAccessSensitive, role } = useRole();
  const visibleNavItems = navItems.filter(item => !item.sensitive || canAccessSensitive);

  useEffect(() => {
    base44.auth.isAuthenticated().then(setIsAuthenticated);
  }, []);

  if (isAuthenticated === false) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-2xl p-10 w-full max-w-sm text-center space-y-6">
          <div className="w-14 h-14 rounded-xl bg-emerald-500 flex items-center justify-center mx-auto">
            <Warehouse className="w-7 h-7 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-slate-900">WarehouseSG</h1>
            <p className="text-sm text-slate-500 mt-1">Distribution Hub — Singapore</p>
          </div>
          <p className="text-sm text-slate-600">Sign in with your credentials to access the platform.</p>
          <Button
            className="w-full bg-emerald-600 hover:bg-emerald-700 gap-2"
            onClick={() => base44.auth.redirectToLogin()}
          >
            <LogIn className="w-4 h-4" />
            Sign In
          </Button>
          <a
            href="mailto:contact@flowshipsg.com"
            className="w-full inline-flex items-center justify-center rounded-md border border-slate-200 bg-white px-4 py-2 text-sm text-slate-600 hover:bg-slate-50 hover:text-slate-900 transition-colors"
          >
            Contact Us
          </a>
          <p className="text-xs text-slate-400">
            By signing in, you agree to our{" "}
            <a
              href={createPageUrl("PrivacyPolicy")}
              className="text-emerald-600 underline hover:text-emerald-700"
            >
              Privacy & User Data Policy
            </a>
          </p>
        </div>
      </div>
    );
  }

  if (isAuthenticated === null) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-emerald-400 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

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
        <div className="p-4 border-t border-white/10 space-y-2">
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
        <header className="h-16 bg-white border-b border-slate-200 flex items-center px-4 lg:px-6 sticky top-0 z-30 shrink-0">
          <button
            className="lg:hidden p-2 -ml-2 text-slate-600 hover:text-slate-900"
            onClick={() => setSidebarOpen(true)}
          >
            <Menu className="w-5 h-5" />
          </button>
          <h2 className="text-sm sm:text-base md:text-lg font-semibold text-slate-800 ml-2 lg:ml-0 truncate">
            {currentPageName}
          </h2>
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-auto overscroll-none">
          {children}
        </main>
      </div>
    </div>
  );
}