import React from "react";
import { MoreHorizontal, ArrowRight, ListChecks, PackageCheck, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import StatusBadge from "@/components/shared/StatusBadge";
import { format } from "date-fns";
import { cn } from "@/lib/utils";

const columns = [
  { key: "draft", label: "Draft", dot: "bg-slate-400" },
  { key: "confirmed", label: "Confirmed", dot: "bg-blue-400" },
  { key: "picking", label: "Picking", dot: "bg-amber-400" },
  { key: "dispatched", label: "Dispatched", dot: "bg-orange-400" },
  { key: "in_transit", label: "In Transit", dot: "bg-purple-400" },
  { key: "delivered", label: "Delivered", dot: "bg-emerald-400" },
];

export default function TransferKanban({ transfers, canWrite, onStartPicking, onVerify, onAdvance, onCancel, onDelete }) {
  const cancelled = transfers.filter(t => t.status === "cancelled");

  return (
    <div className="space-y-3">
      <div className="overflow-x-auto pb-2">
        <div className="flex gap-3 min-w-max">
          {columns.map(col => {
            const items = transfers.filter(t => t.status === col.key);
            return (
              <div key={col.key} className="w-72 shrink-0">
                <div className="flex items-center gap-2 mb-2 px-1">
                  <span className={cn("w-2 h-2 rounded-full", col.dot)} />
                  <h3 className="text-xs font-semibold text-slate-700 uppercase tracking-wide">{col.label}</h3>
                  <Badge variant="secondary" className="text-[10px] h-5 min-w-5 justify-center">{items.length}</Badge>
                </div>
                <div className="bg-slate-50 rounded-lg border border-slate-200/60 p-2 space-y-2 min-h-[160px]">
                  {items.length === 0 ? (
                    <div className="text-center text-xs text-slate-300 py-8">No orders</div>
                  ) : (
                    items.map(order => (
                      <KanbanCard
                        key={order.id}
                        order={order}
                        canWrite={canWrite}
                        onStartPicking={onStartPicking}
                        onVerify={onVerify}
                        onAdvance={onAdvance}
                        onCancel={onCancel}
                        onDelete={onDelete}
                      />
                    ))
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {cancelled.length > 0 && (
        <div className="bg-white rounded-xl border border-slate-200/80 p-3">
          <div className="flex items-center gap-2 mb-2">
            <span className="w-2 h-2 rounded-full bg-red-400" />
            <h3 className="text-xs font-semibold text-slate-700 uppercase tracking-wide">Cancelled</h3>
            <Badge variant="secondary" className="text-[10px] h-5 min-w-5 justify-center">{cancelled.length}</Badge>
          </div>
          <div className="flex flex-wrap gap-2">
            {cancelled.map(order => (
              <KanbanCard
                key={order.id}
                order={order}
                canWrite={canWrite}
                onStartPicking={onStartPicking}
                onVerify={onVerify}
                onAdvance={onAdvance}
                onCancel={onCancel}
                onDelete={onDelete}
                compact
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function KanbanCard({ order, canWrite, onStartPicking, onVerify, onAdvance, onCancel, onDelete, compact }) {
  return (
    <div className={cn("bg-white rounded-lg border border-slate-200 shadow-sm hover:shadow-md transition-shadow", compact && "w-64")}>
      <div className="p-3">
        <div className="flex items-start justify-between gap-2 mb-2">
          <div className="min-w-0">
            <p className="text-xs font-semibold font-mono text-slate-800 truncate">{order.order_number}</p>
            <div className="flex items-center gap-1 text-[11px] text-slate-500 mt-0.5">
              <span className="text-slate-400">WH</span>
              <ArrowRight className="w-2.5 h-2.5 text-slate-300" />
              <span className="font-medium text-slate-600 truncate">{order.store_name}</span>
            </div>
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-6 w-6 shrink-0">
                <MoreHorizontal className="w-3.5 h-3.5 text-slate-400" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              {canWrite && (order.status === "draft" || order.status === "confirmed") && (
                <DropdownMenuItem onClick={() => onStartPicking(order)} className="text-blue-600 font-medium">
                  <ListChecks className="w-3.5 h-3.5 mr-1.5" /> Confirm & Start Picking
                </DropdownMenuItem>
              )}
              {order.status === "picking" && (
                <DropdownMenuItem onClick={() => onVerify(order)} className="text-emerald-600 font-medium">
                  <PackageCheck className="w-3.5 h-3.5 mr-1.5" /> Verify & Dispatch
                </DropdownMenuItem>
              )}
              {canWrite && order.status === "dispatched" && (
                <DropdownMenuItem onClick={() => onAdvance(order)} className="text-blue-600 font-medium">
                  <ArrowRight className="w-3.5 h-3.5 mr-1.5" /> Move to In Transit
                </DropdownMenuItem>
              )}
              {canWrite && order.status === "in_transit" && (
                <DropdownMenuItem onClick={() => onAdvance(order)} className="text-emerald-600 font-medium">
                  <ArrowRight className="w-3.5 h-3.5 mr-1.5" /> Mark Delivered
                </DropdownMenuItem>
              )}
              {canWrite && order.status !== "delivered" && order.status !== "cancelled" && (
                <DropdownMenuItem onClick={() => onCancel(order)} className="text-red-600">Cancel Order</DropdownMenuItem>
              )}
              {canWrite && (
                <DropdownMenuItem onClick={() => onDelete(order.id)} className="text-red-600">
                  <Trash2 className="w-3.5 h-3.5 mr-1.5" /> Delete
                </DropdownMenuItem>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        <div className="flex items-center gap-1.5 flex-wrap">
          <StatusBadge status={order.priority} />
          <span className="text-[10px] text-slate-400">
            {order.total_items_count || order.items?.length || 0} items
          </span>
        </div>

        <div className="flex items-center justify-between mt-2 pt-2 border-t border-slate-100 text-[10px] text-slate-500">
          <span>{order.requested_delivery_date ? format(new Date(order.requested_delivery_date), "dd MMM") : "—"}</span>
          {order.vehicle_plate_number && <span className="font-mono">{order.vehicle_plate_number}</span>}
        </div>
      </div>
    </div>
  );
}