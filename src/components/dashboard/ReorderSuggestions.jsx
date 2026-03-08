import React, { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import {
  TrendingDown, Clock, Loader2, ShoppingBag, CheckCircle2, X, Mail, Building2, Star
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";

const DAYS_HORIZON = 14;

function calcDaysUntilStockout(currentQty, dailyUsage) {
  if (dailyUsage <= 0) return Infinity;
  return currentQty / dailyUsage;
}

function urgencyConfig(daysLeft) {
  if (daysLeft <= 3) return { label: "Critical", color: "bg-red-100 text-red-700", bar: "bg-red-500", dot: "bg-red-500" };
  if (daysLeft <= 7) return { label: "Urgent", color: "bg-orange-100 text-orange-700", bar: "bg-orange-400", dot: "bg-orange-400" };
  return { label: "Watch", color: "bg-amber-100 text-amber-700", bar: "bg-amber-400", dot: "bg-amber-400" };
}

export default function ReorderSuggestions({ inventoryItems, products }) {
  const [showPODialog, setShowPODialog] = useState(false);
  const [selectedItems, setSelectedItems] = useState({});
  const [procurementEmail, setProcurementEmail] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(null); // po_number on success

  const { data: movements = [], isLoading } = useQuery({
    queryKey: ["stockMovements"],
    queryFn: () => base44.entities.StockMovement.list("-created_date", 500),
  });

  const { data: suppliers = [] } = useQuery({
    queryKey: ["suppliers"],
    queryFn: () => base44.entities.Supplier.list(),
  });

  const suggestions = useMemo(() => {
    if (!movements.length || !inventoryItems.length) return [];
    const cutoff = Date.now() - 30 * 24 * 60 * 60 * 1000;
    const usageMap = {};
    movements.forEach((m) => {
      if (m.adjustment_type !== "out") return;
      if (new Date(m.created_date).getTime() < cutoff) return;
      usageMap[m.inventory_item_id] = (usageMap[m.inventory_item_id] || 0) + Math.abs(m.quantity_change || 0);
    });

    const results = [];
    inventoryItems.forEach((item) => {
      const totalOut = usageMap[item.id];
      if (!totalOut) return;
      const dailyUsage = totalOut / 30;
      const daysLeft = calcDaysUntilStockout(item.quantity || 0, dailyUsage);
      if (daysLeft > DAYS_HORIZON) return;
      const product = products.find((p) => p.id === item.product_id);
      // Use actual supplier lead time if available, else fallback to 3 days
      const supplier = suppliers.find(s => s.name === product?.supplier && s.status === "active");
      const leadTimeDays = supplier?.lead_time_days ?? 3;
      const minOrderQty = supplier?.min_order_quantity ?? 1;
      const suggestedQtyRaw = Math.ceil(dailyUsage * (DAYS_HORIZON + leadTimeDays) - (item.quantity || 0));
      // Round up to supplier's minimum order quantity
      const suggestedQty = Math.max(
        Math.ceil(suggestedQtyRaw / minOrderQty) * minOrderQty,
        minOrderQty
      );
      results.push({
        id: item.id,
        product_id: item.product_id,
        product_name: item.product_name,
        sku: item.sku,
        location_name: item.location_name,
        currentQty: item.quantity || 0,
        unit: product?.unit || "pcs",
        dailyUsage: parseFloat(dailyUsage.toFixed(2)),
        daysLeft: parseFloat(daysLeft.toFixed(1)),
        suggestedQty,
        leadTimeDays,
        supplierName: supplier?.name || product?.supplier || null,
        supplierRating: supplier?.performance_rating || null,
      });
    });
    return results.sort((a, b) => a.daysLeft - b.daysLeft);
  }, [movements, inventoryItems, products]);

  const openPODialog = () => {
    // pre-select all suggestions
    const preSelected = {};
    suggestions.forEach(s => { preSelected[s.id] = true; });
    setSelectedItems(preSelected);
    setSubmitted(null);
    setProcurementEmail("");
    setShowPODialog(true);
  };

  const toggleItem = (id) => {
    setSelectedItems(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const chosenSuggestions = suggestions.filter(s => selectedItems[s.id]);

  const handleSubmit = async () => {
    if (!chosenSuggestions.length) return;
    setSubmitting(true);
    try {
      const res = await base44.functions.invoke("createPurchaseOrder", {
        suggestions: chosenSuggestions,
        procurementEmail,
        products,
      });
      setSubmitted(res.data?.po_number);
    } finally {
      setSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="bg-white rounded-xl border border-slate-200/80 p-5 flex items-center justify-center gap-2 text-slate-400 text-sm">
        <Loader2 className="w-4 h-4 animate-spin" /> Analysing usage patterns…
      </div>
    );
  }

  if (suggestions.length === 0) {
    return (
      <div className="bg-white rounded-xl border border-slate-200/80 p-5">
        <div className="flex items-center gap-2 mb-2">
          <TrendingDown className="w-4 h-4 text-slate-400" />
          <h3 className="text-sm font-semibold text-slate-800">Reorder Suggestions</h3>
        </div>
        <p className="text-sm text-slate-400 text-center py-5">
          No items predicted to stock out in the next {DAYS_HORIZON} days ✓
        </p>
      </div>
    );
  }

  return (
    <>
      <div className="bg-white rounded-xl border border-slate-200/80 p-5">
        <div className="flex items-center gap-2 mb-1">
          <TrendingDown className="w-4 h-4 text-red-500" />
          <h3 className="text-sm font-semibold text-slate-800">Reorder Suggestions</h3>
          <Badge className="ml-auto bg-red-100 text-red-700 text-[10px] border-0">
            {suggestions.length} at risk
          </Badge>
        </div>
        <p className="text-[11px] text-slate-400 mb-4">Based on 30-day usage · next {DAYS_HORIZON} days</p>

        <div className="space-y-3">
          {suggestions.map((s) => {
            const cfg = urgencyConfig(s.daysLeft);
            const barWidth = Math.min((s.daysLeft / DAYS_HORIZON) * 100, 100);
            return (
              <div key={s.id} className="rounded-lg border border-slate-100 bg-slate-50 p-3">
                <div className="flex items-start gap-2 mb-2">
                  <span className={cn("w-2 h-2 rounded-full mt-1.5 flex-shrink-0", cfg.dot)} />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-slate-800 truncate leading-tight">{s.product_name}</p>
                    <p className="text-[11px] text-slate-400 truncate">{s.sku} · {s.location_name}</p>
                  </div>
                  <Badge className={cn("text-[10px] border-0 flex-shrink-0", cfg.color)}>{cfg.label}</Badge>
                </div>
                <div className="h-1.5 bg-slate-200 rounded-full overflow-hidden mb-2">
                  <div className={cn("h-full rounded-full", cfg.bar)} style={{ width: `${barWidth}%` }} />
                </div>
                <div className="flex items-center justify-between text-[11px] text-slate-500">
                  <span className="flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    {s.daysLeft < 1 ? "< 1 day left" : `~${s.daysLeft} days left`}
                  </span>
                  <span>{s.currentQty} {s.unit} on hand</span>
                </div>
                <div className="mt-2 pt-2 border-t border-slate-100 flex items-center justify-between">
                  <span className="text-[11px] text-slate-500">
                    Usage: <strong className="text-slate-700">{s.dailyUsage} {s.unit}/day</strong>
                  </span>
                  <span className="text-[11px] font-semibold text-emerald-700">
                    Reorder → {s.suggestedQty} {s.unit}
                  </span>
                </div>
              </div>
            );
          })}
        </div>

        <Button
          className="w-full mt-4 bg-emerald-600 hover:bg-emerald-700 text-white text-xs h-8 gap-1.5"
          onClick={openPODialog}
        >
          <ShoppingBag className="w-3.5 h-3.5" /> Raise Purchase Order
        </Button>
      </div>

      {/* PO Dialog */}
      <Dialog open={showPODialog} onOpenChange={(o) => { if (!o) setShowPODialog(false); }}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-base">
              <ShoppingBag className="w-4 h-4 text-emerald-600" /> Draft Purchase Order
            </DialogTitle>
          </DialogHeader>

          {submitted ? (
            <div className="py-6 text-center space-y-3">
              <CheckCircle2 className="w-10 h-10 text-emerald-500 mx-auto" />
              <p className="font-semibold text-slate-800">Purchase Order Created</p>
              <p className="text-sm text-slate-500">
                <strong>{submitted}</strong> has been drafted.
                {procurementEmail && ` A notification was sent to ${procurementEmail}.`}
              </p>
              <Button size="sm" variant="outline" onClick={() => setShowPODialog(false)}>Close</Button>
            </div>
          ) : (
            <>
              <div className="space-y-3 py-1">
                <p className="text-xs text-slate-500">Select items to include in this PO:</p>

                <div className="space-y-1.5 max-h-56 overflow-y-auto pr-1">
                  {suggestions.map(s => (
                    <label
                      key={s.id}
                      className={cn(
                        "flex items-center gap-3 p-2.5 rounded-lg border cursor-pointer transition-colors",
                        selectedItems[s.id]
                          ? "border-emerald-300 bg-emerald-50"
                          : "border-slate-100 bg-slate-50 hover:border-slate-200"
                      )}
                    >
                      <input
                        type="checkbox"
                        checked={!!selectedItems[s.id]}
                        onChange={() => toggleItem(s.id)}
                        className="accent-emerald-600"
                      />
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-medium text-slate-800 truncate">{s.product_name}</p>
                        <p className="text-[10px] text-slate-400">{s.sku}</p>
                      </div>
                      <span className="text-xs font-semibold text-emerald-700 flex-shrink-0">
                        {s.suggestedQty} {s.unit}
                      </span>
                    </label>
                  ))}
                </div>

                <div className="pt-1">
                  <label className="text-xs font-medium text-slate-600 flex items-center gap-1 mb-1">
                    <Mail className="w-3 h-3" /> Procurement Manager Email
                    <span className="text-slate-400 font-normal ml-1">(optional)</span>
                  </label>
                  <input
                    type="email"
                    className="w-full rounded-md border border-slate-200 text-sm px-3 py-1.5 focus:outline-none focus:ring-1 focus:ring-emerald-400"
                    placeholder="manager@company.com"
                    value={procurementEmail}
                    onChange={e => setProcurementEmail(e.target.value)}
                  />
                </div>

                <div className="rounded-lg bg-slate-50 border border-slate-100 p-2.5 flex items-center justify-between text-xs text-slate-600">
                  <span>{chosenSuggestions.length} item(s) selected</span>
                  <span className="font-medium">Status: <span className="text-amber-600">Draft</span></span>
                </div>
              </div>

              <DialogFooter>
                <Button variant="outline" size="sm" onClick={() => setShowPODialog(false)}>
                  <X className="w-3.5 h-3.5 mr-1" /> Cancel
                </Button>
                <Button
                  size="sm"
                  disabled={submitting || !chosenSuggestions.length}
                  onClick={handleSubmit}
                  className="bg-emerald-600 hover:bg-emerald-700"
                >
                  {submitting
                    ? <><Loader2 className="w-3.5 h-3.5 animate-spin mr-1" /> Creating…</>
                    : <><ShoppingBag className="w-3.5 h-3.5 mr-1" /> Create PO</>}
                </Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}