import React, { useState, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import {
  CalendarClock, Flame, Tag, Trash2, ChevronDown, ChevronUp, Loader2
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import { differenceInDays, format, parseISO } from "date-fns";

const WARN_DAYS = 30; // warn if expiring within 30 days

function urgency(daysLeft) {
  if (daysLeft <= 0)  return { label: "Expired",   cls: "bg-red-100 text-red-700",    dot: "bg-red-500",    bar: "bg-red-500" };
  if (daysLeft <= 7)  return { label: "Critical",  cls: "bg-red-100 text-red-700",    dot: "bg-red-500",    bar: "bg-red-500" };
  if (daysLeft <= 14) return { label: "Urgent",    cls: "bg-orange-100 text-orange-700", dot: "bg-orange-400", bar: "bg-orange-400" };
  return               { label: "Expiring Soon", cls: "bg-amber-100 text-amber-700", dot: "bg-amber-400", bar: "bg-amber-400" };
}

export default function ExpiryAlert({ inventoryItems }) {
  const queryClient = useQueryClient();
  const [expanded, setExpanded] = useState(true);
  const [selected, setSelected] = useState(null); // item chosen for action dialog
  const [action, setAction] = useState("write_off");
  const [notes, setNotes] = useState("");

  const { data: actionedIds = [] } = useQuery({
    queryKey: ["expiryActions"],
    queryFn: async () => {
      const records = await base44.entities.ExpiryAction.list();
      return records.map(r => r.inventory_item_id);
    },
  });

  const actionMutation = useMutation({
    mutationFn: async ({ item, action, notes }) => {
      const user = await base44.auth.me();
      await base44.entities.ExpiryAction.create({
        inventory_item_id: item.id,
        product_name: item.product_name,
        sku: item.sku,
        location_name: item.location_name,
        expiry_date: item.expiry_date,
        quantity: item.quantity,
        action,
        notes,
        actioned_by: user?.email || "",
      });
      // Zero out inventory if write-off
      if (action === "write_off") {
        await base44.entities.InventoryItem.update(item.id, { quantity: 0 });
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["expiryActions"] });
      queryClient.invalidateQueries({ queryKey: ["inventory"] });
      setSelected(null);
      setNotes("");
    },
  });

  const today = new Date();

  const expiringItems = useMemo(() => {
    return inventoryItems
      .filter(item => {
        if (!item.expiry_date) return false;
        if (actionedIds.includes(item.id)) return false;
        const days = differenceInDays(parseISO(item.expiry_date), today);
        return days <= WARN_DAYS;
      })
      .map(item => ({
        ...item,
        daysLeft: differenceInDays(parseISO(item.expiry_date), today),
      }))
      .sort((a, b) => a.daysLeft - b.daysLeft);
  }, [inventoryItems, actionedIds]);

  if (expiringItems.length === 0) {
    return (
      <div className="bg-white rounded-xl border border-slate-200/80 p-5">
        <div className="flex items-center gap-2 mb-2">
          <CalendarClock className="w-4 h-4 text-slate-400" />
          <h3 className="text-sm font-semibold text-slate-800">Expiry Watch</h3>
        </div>
        <p className="text-sm text-slate-400 text-center py-5">No items expiring within {WARN_DAYS} days ✓</p>
      </div>
    );
  }

  return (
    <>
      <div className="bg-white rounded-xl border border-slate-200/80 p-5">
        {/* Header */}
        <button
          className="w-full flex items-center gap-2 mb-1 text-left"
          onClick={() => setExpanded(e => !e)}
        >
          <CalendarClock className="w-4 h-4 text-rose-500 flex-shrink-0" />
          <h3 className="text-sm font-semibold text-slate-800 flex-1">Expiry Watch</h3>
          <Badge className="bg-rose-100 text-rose-700 text-[10px] border-0 mr-1">
            {expiringItems.length} items
          </Badge>
          {expanded
            ? <ChevronUp className="w-3.5 h-3.5 text-slate-400" />
            : <ChevronDown className="w-3.5 h-3.5 text-slate-400" />}
        </button>
        <p className="text-[11px] text-slate-400 mb-3">Items expiring within {WARN_DAYS} days</p>

        {expanded && (
          <div className="space-y-2.5">
            {expiringItems.map((item) => {
              const cfg = urgency(item.daysLeft);
              const barPct = Math.max(0, Math.min((item.daysLeft / WARN_DAYS) * 100, 100));
              return (
                <div key={item.id} className="rounded-lg border border-slate-100 bg-slate-50 p-3">
                  <div className="flex items-start gap-2 mb-1.5">
                    <span className={cn("w-2 h-2 rounded-full mt-1.5 flex-shrink-0", cfg.dot)} />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-slate-800 truncate leading-tight">{item.product_name}</p>
                      <p className="text-[11px] text-slate-400 truncate">{item.sku} · {item.location_name}</p>
                    </div>
                    <Badge className={cn("text-[10px] border-0 flex-shrink-0", cfg.cls)}>{cfg.label}</Badge>
                  </div>

                  <div className="h-1.5 bg-slate-200 rounded-full overflow-hidden mb-2">
                    <div className={cn("h-full rounded-full", cfg.bar)} style={{ width: `${barPct}%` }} />
                  </div>

                  <div className="flex items-center justify-between text-[11px] text-slate-500 mb-2">
                    <span>
                      {item.daysLeft <= 0
                        ? "Expired"
                        : `Expires ${format(parseISO(item.expiry_date), "d MMM yyyy")}`}
                      {item.daysLeft > 0 && ` (${item.daysLeft}d)`}
                    </span>
                    <span>{item.quantity} units on hand</span>
                  </div>

                  <div className="flex gap-1.5">
                    <Button
                      size="sm"
                      variant="outline"
                      className="flex-1 text-[11px] h-7 gap-1 text-orange-600 border-orange-200 hover:bg-orange-50"
                      onClick={() => { setSelected(item); setAction("promotional_clearing"); }}
                    >
                      <Tag className="w-3 h-3" /> Promote
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      className="flex-1 text-[11px] h-7 gap-1 text-red-600 border-red-200 hover:bg-red-50"
                      onClick={() => { setSelected(item); setAction("write_off"); }}
                    >
                      <Trash2 className="w-3 h-3" /> Write-off
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Action Dialog */}
      <Dialog open={!!selected} onOpenChange={(o) => { if (!o) { setSelected(null); setNotes(""); } }}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-base">
              {action === "write_off"
                ? <><Trash2 className="w-4 h-4 text-red-500" /> Write-off Stock</>
                : <><Flame className="w-4 h-4 text-orange-500" /> Promotional Clearing</>}
            </DialogTitle>
          </DialogHeader>

          {selected && (
            <div className="space-y-4 py-1">
              <div className="rounded-lg bg-slate-50 border border-slate-100 p-3 text-sm space-y-1">
                <p className="font-medium text-slate-800">{selected.product_name}</p>
                <p className="text-slate-500 text-xs">{selected.sku} · {selected.location_name}</p>
                <p className="text-slate-500 text-xs">
                  Expiry: <strong>{format(parseISO(selected.expiry_date), "d MMM yyyy")}</strong>
                  {" "}· Qty: <strong>{selected.quantity} units</strong>
                </p>
              </div>

              {/* Toggle action */}
              <div className="flex gap-2">
                <button
                  onClick={() => setAction("write_off")}
                  className={cn(
                    "flex-1 py-2 rounded-lg border text-xs font-medium transition-colors",
                    action === "write_off"
                      ? "bg-red-50 border-red-300 text-red-700"
                      : "bg-white border-slate-200 text-slate-500 hover:bg-slate-50"
                  )}
                >
                  <Trash2 className="w-3.5 h-3.5 mx-auto mb-0.5" /> Write-off
                  <p className="text-[10px] font-normal mt-0.5">Zeroes inventory</p>
                </button>
                <button
                  onClick={() => setAction("promotional_clearing")}
                  className={cn(
                    "flex-1 py-2 rounded-lg border text-xs font-medium transition-colors",
                    action === "promotional_clearing"
                      ? "bg-orange-50 border-orange-300 text-orange-700"
                      : "bg-white border-slate-200 text-slate-500 hover:bg-slate-50"
                  )}
                >
                  <Tag className="w-3.5 h-3.5 mx-auto mb-0.5" /> Promote
                  <p className="text-[10px] font-normal mt-0.5">Flag for clearance</p>
                </button>
              </div>

              <div>
                <label className="text-xs text-slate-600 font-medium mb-1 block">Notes (optional)</label>
                <textarea
                  className="w-full rounded-md border border-slate-200 text-sm px-3 py-2 resize-none focus:outline-none focus:ring-1 focus:ring-slate-300"
                  rows={2}
                  placeholder="Add any relevant notes..."
                  value={notes}
                  onChange={e => setNotes(e.target.value)}
                />
              </div>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" size="sm" onClick={() => { setSelected(null); setNotes(""); }}>
              Cancel
            </Button>
            <Button
              size="sm"
              disabled={actionMutation.isPending}
              onClick={() => actionMutation.mutate({ item: selected, action, notes })}
              className={action === "write_off" ? "bg-red-600 hover:bg-red-700" : "bg-orange-500 hover:bg-orange-600"}
            >
              {actionMutation.isPending
                ? <><Loader2 className="w-3.5 h-3.5 animate-spin" /> Saving…</>
                : action === "write_off" ? "Confirm Write-off" : "Mark for Promotion"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}