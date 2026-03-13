import React from "react";
import { cn } from "@/lib/utils";
import { Link } from "react-router-dom";

export default function StatCard({ title, value, subtitle, icon: Icon, trend, trendUp, color = "amber", to }) {
  const colorMap = {
    orange: { bg: "bg-orange-50", icon: "bg-orange-500", text: "text-orange-600" },
    amber: { bg: "bg-amber-50", icon: "bg-amber-500", text: "text-amber-600" },
    yellow: { bg: "bg-yellow-50", icon: "bg-yellow-500", text: "text-yellow-600" },
    red: { bg: "bg-red-50", icon: "bg-red-500", text: "text-red-600" },
    emerald: { bg: "bg-emerald-50", icon: "bg-emerald-500", text: "text-emerald-600" },
  };

  const c = colorMap[color] || colorMap.amber;

  const content = (
    <>
      <div className="flex items-start justify-between">
        <div className="space-y-2">
          <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">{title}</p>
          <p className="text-2xl font-bold text-slate-900">{value}</p>
          {subtitle && <p className="text-xs text-slate-500">{subtitle}</p>}
          {trend && (
            <p className={cn("text-xs font-medium", trendUp ? "text-emerald-600" : "text-red-500")}>
              {trendUp ? "↑" : "↓"} {trend}
            </p>
          )}
        </div>
        <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center", c.icon)}>
          <Icon className="w-5 h-5 text-white" />
        </div>
      </div>
    </>
  );

  if (to) {
    return (
      <Link to={to} className="block bg-white rounded-xl border border-slate-200/80 p-5 hover:shadow-md transition-shadow duration-300 hover:border-slate-300">
        {content}
      </Link>
    );
  }

  return (
    <div className="bg-white rounded-xl border border-slate-200/80 p-5 hover:shadow-md transition-shadow duration-300">
      {content}
    </div>
  );
}