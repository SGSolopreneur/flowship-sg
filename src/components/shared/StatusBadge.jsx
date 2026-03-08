import React from "react";
import { Badge } from "@/components/ui/badge";

const configs = {
  // Transfer statuses
  draft: { label: "Draft", class: "bg-slate-100 text-slate-600 border-slate-200" },
  confirmed: { label: "Confirmed", class: "bg-blue-100 text-blue-700 border-blue-200" },
  picking: { label: "Picking", class: "bg-violet-100 text-violet-700 border-violet-200" },
  dispatched: { label: "Dispatched", class: "bg-amber-100 text-amber-700 border-amber-200" },
  in_transit: { label: "In Transit", class: "bg-orange-100 text-orange-700 border-orange-200" },
  delivered: { label: "Delivered", class: "bg-emerald-100 text-emerald-700 border-emerald-200" },
  cancelled: { label: "Cancelled", class: "bg-red-100 text-red-700 border-red-200" },
  // Store statuses
  active: { label: "Active", class: "bg-emerald-100 text-emerald-700 border-emerald-200" },
  inactive: { label: "Inactive", class: "bg-slate-100 text-slate-600 border-slate-200" },
  renovation: { label: "Renovation", class: "bg-amber-100 text-amber-700 border-amber-200" },
  // Priority
  low: { label: "Low", class: "bg-slate-100 text-slate-600 border-slate-200" },
  normal: { label: "Normal", class: "bg-blue-100 text-blue-700 border-blue-200" },
  high: { label: "High", class: "bg-orange-100 text-orange-700 border-orange-200" },
  urgent: { label: "Urgent", class: "bg-red-100 text-red-700 border-red-200" },
  // Storage
  ambient: { label: "Ambient", class: "bg-yellow-100 text-yellow-700 border-yellow-200" },
  chilled: { label: "Chilled", class: "bg-cyan-100 text-cyan-700 border-cyan-200" },
  frozen: { label: "Frozen", class: "bg-blue-100 text-blue-700 border-blue-200" },
};

export default function StatusBadge({ status }) {
  const config = configs[status] || { label: status, class: "bg-slate-100 text-slate-600" };
  return (
    <Badge variant="outline" className={`${config.class} text-[10px] font-medium border`}>
      {config.label}
    </Badge>
  );
}