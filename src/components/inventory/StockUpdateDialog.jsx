import React, { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { PackagePlus, PackageMinus, RefreshCw } from "lucide-react";

const modes = [
  { value: "set", label: "Set Stock", icon: RefreshCw, desc: "Replace current quantity" },
  { value: "add", label: "Add Stock", icon: PackagePlus, desc: "Add to current quantity" },
  { value: "remove", label: "Remove Stock", icon: PackageMinus, desc: "Subtract from current quantity" },
];

export default function StockUpdateDialog({ open, onOpenChange, inventoryItem, product, onSave, saving }) {
  const [mode, setMode] = useState("set");
  const [quantity, setQuantity] = useState("");

  const getNewQty = () => {
    const val = Number(quantity);
    const current = inventoryItem?.quantity || 0;
    if (mode === "set") return val;
    if (mode === "add") return current + val;
    if (mode === "remove") return Math.max(0, current - val);
    return val;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave(inventoryItem.id, getNewQty(), mode);
    setQuantity("");
    setMode("set");
  };

  if (!inventoryItem) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>Update Stock Level</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Product info */}
          <div className="bg-slate-50 rounded-lg p-3 space-y-1">
            <p className="font-semibold text-sm text-slate-800">{inventoryItem.product_name}</p>
            <div className="flex items-center gap-2">
              <span className="text-xs font-mono text-slate-500">{inventoryItem.sku}</span>
              <Badge variant="outline" className="text-[10px]">{inventoryItem.location_name}</Badge>
            </div>
            <p className="text-xs text-slate-500">
              Current stock: <span className="font-semibold text-slate-700">{inventoryItem.quantity} {product?.unit || ""}</span>
            </p>
          </div>

          {/* Mode selector */}
          <div>
            <Label className="text-xs text-slate-500 mb-1.5 block">Update Mode</Label>
            <div className="grid grid-cols-3 gap-2">
              {modes.map((m) => {
                const Icon = m.icon;
                return (
                  <button
                    key={m.value}
                    type="button"
                    onClick={() => setMode(m.value)}
                    className={`flex flex-col items-center gap-1 p-2 rounded-lg border text-xs transition-all ${
                      mode === m.value
                        ? "border-emerald-500 bg-emerald-50 text-emerald-700"
                        : "border-slate-200 text-slate-500 hover:border-slate-300"
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    <span className="font-medium">{m.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Quantity input */}
          <div>
            <Label>Quantity {product?.unit ? `(${product.unit})` : ""}</Label>
            <Input
              type="number"
              min="0"
              value={quantity}
              onChange={(e) => setQuantity(e.target.value)}
              placeholder="Enter quantity"
              required
              autoFocus
            />
          </div>

          {/* Preview */}
          {quantity !== "" && (
            <div className="bg-emerald-50 border border-emerald-100 rounded-lg px-3 py-2 text-xs text-emerald-700">
              New quantity will be: <span className="font-bold text-sm">{getNewQty()} {product?.unit || ""}</span>
            </div>
          )}

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
            <Button type="submit" disabled={saving || quantity === ""} className="bg-emerald-600 hover:bg-emerald-700">
              {saving ? "Saving..." : "Update Stock"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}