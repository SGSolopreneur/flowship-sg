import React, { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { TrendingDown, AlertOctagon, Clock, ChevronRight, Loader2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
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
  const { data: movements = [], isLoading } = useQuery({
    queryKey: ["stockMovements"],
    queryFn: () => base44.entities.StockMovement.list("-created_date", 500),
  });

  const suggestions = useMemo(() => {
    if (!movements.length || !inventoryItems.length) return [];

    // Cut-off: last 30 days of movements for burn rate calculation
    const cutoff = Date.now() - 30 * 24 * 60 * 60 * 1000;

    // Group "out" movements by inventory_item_id
    const usageMap = {};
    movements.forEach((m) => {
      if (m.adjustment_type !== "out") return;
      const ts = new Date(m.created_date).getTime();
      if (ts < cutoff) return;
      if (!usageMap[m.inventory_item_id]) usageMap[m.inventory_item_id] = 0;
      usageMap[m.inventory_item_id] += Math.abs(m.quantity_change || 0);
    });

    const results = [];

    inventoryItems.forEach((item) => {
      const totalOut = usageMap[item.id];
      if (!totalOut) return; // no outbound movements → skip

      const dailyUsage = totalOut / 30;
      const daysLeft = calcDaysUntilStockout(item.quantity || 0, dailyUsage);

      if (daysLeft > DAYS_HORIZON) return; // only items at risk in 14 days

      const product = products.find((p) => p.id === item.product_id);
      // Suggested reorder = 30-day buffer minus current stock
      const leadTimeDays = 3;
      const suggestedQty = Math.ceil(dailyUsage * (DAYS_HORIZON + leadTimeDays) - (item.quantity || 0));

      results.push({
        id: item.id,
        product_name: item.product_name,
        sku: item.sku,
        location_name: item.location_name,
        currentQty: item.quantity || 0,
        unit: product?.unit || "pcs",
        dailyUsage: parseFloat(dailyUsage.toFixed(2)),
        daysLeft: parseFloat(daysLeft.toFixed(1)),
        suggestedQty: Math.max(suggestedQty, 1),
      });
    });

    return results.sort((a, b) => a.daysLeft - b.daysLeft);
  }, [movements, inventoryItems, products]);

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
    <div className="bg-white rounded-xl border border-slate-200/80 p-5">
      <div className="flex items-center gap-2 mb-1">
        <TrendingDown className="w-4 h-4 text-red-500" />
        <h3 className="text-sm font-semibold text-slate-800">Reorder Suggestions</h3>
        <Badge className="ml-auto bg-red-100 text-red-700 text-[10px] border-0">
          {suggestions.length} at risk
        </Badge>
      </div>
      <p className="text-[11px] text-slate-400 mb-4">Based on 30-day usage patterns · next {DAYS_HORIZON} days</p>

      <div className="space-y-3">
        {suggestions.map((s) => {
          const cfg = urgencyConfig(s.daysLeft);
          const barWidth = Math.min((s.daysLeft / DAYS_HORIZON) * 100, 100);
          return (
            <div key={s.id} className="group rounded-lg border border-slate-100 bg-slate-50 p-3 hover:border-slate-200 transition-colors">
              <div className="flex items-start gap-2 mb-2">
                <span className={cn("w-2 h-2 rounded-full mt-1.5 flex-shrink-0", cfg.dot)} />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-slate-800 truncate leading-tight">{s.product_name}</p>
                  <p className="text-[11px] text-slate-400 truncate">{s.sku} · {s.location_name}</p>
                </div>
                <Badge className={cn("text-[10px] border-0 flex-shrink-0", cfg.color)}>
                  {cfg.label}
                </Badge>
              </div>

              {/* Timeline bar */}
              <div className="h-1.5 bg-slate-200 rounded-full overflow-hidden mb-2">
                <div className={cn("h-full rounded-full transition-all", cfg.bar)} style={{ width: `${barWidth}%` }} />
              </div>

              <div className="flex items-center justify-between text-[11px] text-slate-500">
                <span className="flex items-center gap-1">
                  <Clock className="w-3 h-3" />
                  {s.daysLeft < 1
                    ? "< 1 day left"
                    : `~${s.daysLeft} days left`}
                </span>
                <span>{s.currentQty} {s.unit} on hand</span>
              </div>

              <div className="mt-2 pt-2 border-t border-slate-100 flex items-center justify-between">
                <span className="text-[11px] text-slate-500">
                  Usage: <strong className="text-slate-700">{s.dailyUsage} {s.unit}/day</strong>
                </span>
                <span className="text-[11px] font-semibold text-emerald-700 flex items-center gap-0.5">
                  Reorder <ChevronRight className="w-3 h-3" /> {s.suggestedQty} {s.unit}
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}