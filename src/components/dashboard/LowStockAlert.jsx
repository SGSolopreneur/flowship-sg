import React, { useState } from "react";
import { AlertTriangle, Mail, CheckCircle2, Loader2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { base44 } from "@/api/base44Client";

export default function LowStockAlert({ items, products }) {
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);

  const getProduct = (productId) => products.find(p => p.id === productId);

  const lowStockItems = items.filter(item => {
    const product = getProduct(item.product_id);
    return product && item.quantity <= (product.min_stock_level || 10);
  }).slice(0, 8);

  const handleSendAlert = async () => {
    setSending(true);
    try {
      const payload = lowStockItems.map(item => {
        const product = getProduct(item.product_id);
        return {
          product_name: item.product_name,
          sku: item.sku,
          location_name: item.location_name,
          quantity: item.quantity,
          minLevel: product?.min_stock_level || 10,
          unit: product?.unit || 'pcs',
        };
      });
      await base44.functions.invoke('sendLowStockAlert', { items: payload });
      setSent(true);
      setTimeout(() => setSent(false), 4000);
    } finally {
      setSending(false);
    }
  };

  if (lowStockItems.length === 0) {
    return (
      <div className="bg-white rounded-xl border border-slate-200/80 p-5">
        <h3 className="text-sm font-semibold text-slate-800 mb-3">Low Stock Alerts</h3>
        <p className="text-sm text-slate-400 text-center py-6">All stock levels are healthy ✓</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl border border-slate-200/80 p-5">
      <div className="flex items-center gap-2 mb-4">
        <AlertTriangle className="w-4 h-4 text-amber-500" />
        <h3 className="text-sm font-semibold text-slate-800">Low Stock Alerts</h3>
        <Badge variant="secondary" className="bg-amber-100 text-amber-700 text-[10px] ml-auto">
          {lowStockItems.length} items
        </Badge>
      </div>
      <div className="space-y-2.5">
        {lowStockItems.map((item) => {
          const product = getProduct(item.product_id);
          const minLevel = product?.min_stock_level || 10;
          const pct = Math.min((item.quantity / minLevel) * 100, 100);
          return (
            <div key={item.id} className="flex items-center gap-3">
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-slate-700 truncate">{item.product_name}</p>
                <p className="text-[11px] text-slate-400">{item.location_name}</p>
              </div>
              <div className="w-20">
                <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full ${pct < 30 ? 'bg-red-500' : 'bg-amber-400'}`}
                    style={{ width: `${pct}%` }}
                  />
                </div>
              </div>
              <span className="text-xs font-medium text-slate-600 w-12 text-right">
                {item.quantity} {product?.unit || 'pcs'}
              </span>
            </div>
          );
        })}
      </div>
      <div className="mt-4 pt-3 border-t border-slate-100">
        <Button
          size="sm"
          variant="outline"
          className="w-full text-xs gap-1.5"
          onClick={handleSendAlert}
          disabled={sending || sent}
        >
          {sent ? (
            <><CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" /> Alert sent to your email</>
          ) : sending ? (
            <><Loader2 className="w-3.5 h-3.5 animate-spin" /> Sending…</>
          ) : (
            <><Mail className="w-3.5 h-3.5" /> Email replenishment alert</>
          )}
        </Button>
      </div>
    </div>
  );
}