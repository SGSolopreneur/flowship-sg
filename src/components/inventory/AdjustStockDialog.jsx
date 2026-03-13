import React, { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Plus, Minus } from "lucide-react";

export default function AdjustStockDialog({ open, onOpenChange, inventoryItem, product, onSave, saving }) {
  const [adjustment, setAdjustment] = useState(0);
  const [reason, setReason] = useState("");

  useEffect(() => {
    if (open) {
      setAdjustment(0);
      setReason("");
    }
  }, [open]);

  if (!inventoryItem) return null;

  const currentQty = inventoryItem.quantity || 0;
  const newQty = Math.max(0, currentQty + adjustment);

  const handleIncrement = () => setAdjustment(prev => prev + 1);
  const handleDecrement = () => setAdjustment(prev => prev - 1);

  const handleSave = () => {
    if (adjustment === 0) return;
    const mode = adjustment > 0 ? "add" : "remove";
    onSave(inventoryItem.id, newQty, mode, reason);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Adjust Stock Level</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Product Info */}
          <div className="bg-amber-50 rounded-lg p-3 border border-amber-200">
            <p className="text-sm font-semibold text-amber-900">{inventoryItem.product_name}</p>
            <p className="text-xs text-amber-700 mt-1">
              SKU: {inventoryItem.sku} • {inventoryItem.location_name}
            </p>
          </div>

          {/* Current Stock */}
          <div className="grid grid-cols-3 gap-4 items-end">
            <div>
              <Label className="text-xs text-slate-600">Current Stock</Label>
              <p className="text-2xl font-bold text-slate-900 mt-1">
                {currentQty.toLocaleString()}
              </p>
              <p className="text-xs text-slate-500">{product?.unit || "units"}</p>
            </div>
            
            <div className="flex items-center justify-center">
              <span className="text-lg text-slate-400">→</span>
            </div>

            <div>
              <Label className="text-xs text-slate-600">New Stock</Label>
              <p className={`text-2xl font-bold mt-1 ${adjustment > 0 ? 'text-emerald-600' : adjustment < 0 ? 'text-red-600' : 'text-slate-900'}`}>
                {newQty.toLocaleString()}
              </p>
              <p className="text-xs text-slate-500">{product?.unit || "units"}</p>
            </div>
          </div>

          {/* Adjustment Controls */}
          <div>
            <Label className="text-sm text-slate-700">Adjustment Amount</Label>
            <div className="flex items-center gap-2 mt-2">
              <Button
                type="button"
                variant="outline"
                size="icon"
                onClick={handleDecrement}
                className="h-12 w-12 border-red-200 text-red-600 hover:bg-red-50"
              >
                <Minus className="w-5 h-5" />
              </Button>
              
              <Input
                type="number"
                value={adjustment}
                onChange={e => setAdjustment(Number(e.target.value))}
                className={`text-center text-xl font-semibold h-12 ${
                  adjustment > 0 ? 'border-emerald-300 text-emerald-700' : 
                  adjustment < 0 ? 'border-red-300 text-red-700' : 
                  'border-slate-300'
                }`}
              />
              
              <Button
                type="button"
                variant="outline"
                size="icon"
                onClick={handleIncrement}
                className="h-12 w-12 border-emerald-200 text-emerald-600 hover:bg-emerald-50"
              >
                <Plus className="w-5 h-5" />
              </Button>
            </div>
            {adjustment !== 0 && (
              <p className={`text-xs mt-1 ${adjustment > 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                {adjustment > 0 ? `+${adjustment}` : adjustment} {product?.unit || "units"}
              </p>
            )}
          </div>

          {/* Reason */}
          <div>
            <Label htmlFor="reason" className="text-sm text-slate-700">
              Reason for Adjustment <span className="text-red-500">*</span>
            </Label>
            <Textarea
              id="reason"
              value={reason}
              onChange={e => setReason(e.target.value)}
              placeholder="e.g., Damaged goods, Stock count correction, Returns..."
              className="mt-2 min-h-[80px]"
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={saving}>
            Cancel
          </Button>
          <Button
            onClick={handleSave}
            disabled={adjustment === 0 || !reason.trim() || saving}
            className="bg-amber-600 hover:bg-amber-700"
          >
            {saving ? "Saving..." : "Confirm Adjustment"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}