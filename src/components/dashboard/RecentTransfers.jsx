import React from "react";
import { Badge } from "@/components/ui/badge";
import { Truck, ArrowRight } from "lucide-react";
import { format } from "date-fns";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";

const statusConfig = {
  draft: { label: "Draft", class: "bg-slate-100 text-slate-600" },
  confirmed: { label: "Confirmed", class: "bg-blue-100 text-blue-700" },
  picking: { label: "Picking", class: "bg-violet-100 text-violet-700" },
  dispatched: { label: "Dispatched", class: "bg-amber-100 text-amber-700" },
  in_transit: { label: "In Transit", class: "bg-orange-100 text-orange-700" },
  delivered: { label: "Delivered", class: "bg-emerald-100 text-emerald-700" },
  cancelled: { label: "Cancelled", class: "bg-red-100 text-red-700" },
};

export default function RecentTransfers({ transfers }) {
  const recent = transfers.slice(0, 5);

  return (
    <div className="bg-white rounded-xl border border-slate-200/80 p-5">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-semibold text-slate-800">Recent Transfers</h3>
        <Link
          to={createPageUrl("Transfers")}
          className="text-xs text-emerald-600 hover:text-emerald-700 font-medium"
        >
          View all
        </Link>
      </div>
      {recent.length === 0 ? (
        <p className="text-sm text-slate-400 text-center py-6">No transfer orders yet</p>
      ) : (
        <div className="space-y-3">
          {recent.map((order) => {
            const status = statusConfig[order.status] || statusConfig.draft;
            return (
              <div key={order.id} className="flex items-center gap-3 p-2.5 rounded-lg hover:bg-slate-50 transition-colors">
                <div className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center shrink-0">
                  <Truck className="w-4 h-4 text-slate-500" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs font-semibold text-slate-700">{order.order_number}</span>
                    <ArrowRight className="w-3 h-3 text-slate-300" />
                    <span className="text-xs text-slate-500 truncate">{order.store_name}</span>
                  </div>
                  <p className="text-[11px] text-slate-400 mt-0.5">
                    {order.total_items_count || order.items?.length || 0} items
                    {order.requested_delivery_date && ` · ${format(new Date(order.requested_delivery_date), "dd MMM")}`}
                  </p>
                </div>
                <Badge variant="secondary" className={`${status.class} text-[10px] shrink-0`}>
                  {status.label}
                </Badge>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}