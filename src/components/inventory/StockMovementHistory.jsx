import React from "react";
import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { format } from "date-fns";
import { TrendingUp, TrendingDown, RefreshCw, Package } from "lucide-react";

const typeConfig = {
  in:    { label: "Stock In",   icon: TrendingUp,   classes: "bg-emerald-50 text-emerald-700 border-emerald-200" },
  out:   { label: "Stock Out",  icon: TrendingDown,  classes: "bg-red-50 text-red-700 border-red-200" },
  reset: { label: "Reset",      icon: RefreshCw,     classes: "bg-blue-50 text-blue-700 border-blue-200" },
};

const sourceLabel = {
  manual_edit:  "Manual Edit",
  barcode_scan: "Barcode Scan",
  form_update:  "Form Update",
};

export default function StockMovementHistory({ open, onOpenChange, inventoryItem }) {
  const { data: movements = [], isLoading } = useQuery({
    queryKey: ["stockMovements", inventoryItem?.id],
    queryFn: () => base44.entities.StockMovement.filter(
      { inventory_item_id: inventoryItem.id },
      "-created_date",
      100
    ),
    enabled: open && !!inventoryItem?.id,
  });

  if (!inventoryItem) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[80vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="text-base">Stock Movement History</DialogTitle>
          <div className="bg-slate-50 rounded-lg p-3 mt-1 space-y-0.5">
            <p className="font-semibold text-sm text-slate-800">{inventoryItem.product_name}</p>
            <div className="flex items-center gap-2">
              <span className="text-xs font-mono text-slate-500">{inventoryItem.sku}</span>
              <Badge variant="outline" className="text-[10px]">{inventoryItem.location_name}</Badge>
            </div>
          </div>
        </DialogHeader>

        <ScrollArea className="flex-1 -mx-6 px-6 mt-2">
          {isLoading ? (
            <div className="py-12 flex flex-col items-center gap-2 text-slate-400">
              <div className="w-5 h-5 border-2 border-slate-300 border-t-emerald-500 rounded-full animate-spin" />
              <p className="text-xs">Loading history...</p>
            </div>
          ) : movements.length === 0 ? (
            <div className="py-12 flex flex-col items-center gap-2 text-slate-400">
              <Package className="w-8 h-8" />
              <p className="text-sm font-medium text-slate-500">No movement records yet</p>
              <p className="text-xs text-slate-400">Stock changes will appear here</p>
            </div>
          ) : (
            <div className="space-y-2 pb-4">
              {movements.map((m) => {
                const cfg = typeConfig[m.adjustment_type] || typeConfig.reset;
                const Icon = cfg.icon;
                const delta = m.quantity_after - m.quantity_before;
                return (
                  <div key={m.id} className="flex items-start gap-3 p-3 rounded-lg border border-slate-100 bg-white hover:bg-slate-50/60 transition-colors">
                    <div className={`mt-0.5 flex-shrink-0 w-7 h-7 rounded-lg flex items-center justify-center border ${cfg.classes}`}>
                      <Icon className="w-3.5 h-3.5" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <Badge variant="outline" className={`text-[10px] border ${cfg.classes}`}>{cfg.label}</Badge>
                        <span className="text-[10px] text-slate-400">{sourceLabel[m.source] || m.source}</span>
                      </div>
                      <div className="flex items-center gap-1.5 mt-1 text-xs text-slate-600">
                        <span className="text-slate-400">{m.quantity_before}</span>
                        <span className="text-slate-300">→</span>
                        <span className="font-semibold text-slate-800">{m.quantity_after}</span>
                        {delta !== 0 && (
                          <span className={`font-medium ${delta > 0 ? "text-emerald-600" : "text-red-500"}`}>
                            ({delta > 0 ? "+" : ""}{delta})
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-[10px] text-slate-400">
                          {m.performed_by || "Unknown user"}
                        </span>
                        <span className="text-[10px] text-slate-300">·</span>
                        <span className="text-[10px] text-slate-400">
                          {m.created_date ? format(new Date(m.created_date), "dd MMM yyyy, HH:mm") : "—"}
                        </span>
                      </div>
                      {m.notes && <p className="text-[10px] text-slate-500 mt-0.5 italic">{m.notes}</p>}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}