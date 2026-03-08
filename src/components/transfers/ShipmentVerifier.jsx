import React, { useState, useCallback } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CheckCircle2, Circle, ScanLine, Package, AlertTriangle } from "lucide-react";
import BarcodeScanner from "../inventory/BarcodeScanner";
import { cn } from "@/lib/utils";

export default function ShipmentVerifier({ open, onOpenChange, transfer }) {
  const [checkedSkus, setCheckedSkus] = useState({});
  const [scannerOpen, setScannerOpen] = useState(false);
  const [lastScan, setLastScan] = useState(null); // { sku, found }

  const items = transfer?.items || [];

  const handleScan = useCallback((code) => {
    setScannerOpen(false);
    const normalized = code.trim().toLowerCase();
    const matched = items.find(
      item => item.sku?.toLowerCase() === normalized || item.product_name?.toLowerCase() === normalized
    );
    if (matched) {
      setCheckedSkus(prev => ({ ...prev, [matched.product_id || matched.sku]: true }));
      setLastScan({ label: matched.product_name, found: true });
    } else {
      setLastScan({ label: code, found: false });
    }
    // Clear feedback after 3 seconds
    setTimeout(() => setLastScan(null), 3000);
  }, [items]);

  const toggleItem = (key) => setCheckedSkus(prev => ({ ...prev, [key]: !prev[key] }));

  const checkedCount = Object.values(checkedSkus).filter(Boolean).length;
  const allChecked = items.length > 0 && checkedCount === items.length;

  const handleClose = () => {
    setCheckedSkus({});
    setLastScan(null);
    onOpenChange(false);
  };

  return (
    <>
      <Dialog open={open} onOpenChange={handleClose}>
        <DialogContent className="max-w-md max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Package className="w-4 h-4 text-emerald-600" />
              Verify Shipment — {transfer?.order_number}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            {/* Destination + progress */}
            <div className="bg-slate-50 rounded-lg p-3 flex items-center justify-between">
              <div>
                <p className="text-xs text-slate-400">Destination</p>
                <p className="text-sm font-semibold text-slate-700">{transfer?.store_name}</p>
              </div>
              <div className="text-right">
                <p className={cn("text-lg font-bold", allChecked ? "text-emerald-600" : "text-slate-700")}>
                  {checkedCount}/{items.length}
                </p>
                <p className="text-xs text-slate-400">items verified</p>
              </div>
            </div>

            {/* Scan feedback toast */}
            {lastScan && (
              <div className={cn(
                "flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium animate-in fade-in duration-200",
                lastScan.found ? "bg-emerald-50 text-emerald-700 border border-emerald-200" : "bg-red-50 text-red-700 border border-red-200"
              )}>
                {lastScan.found
                  ? <><CheckCircle2 className="w-4 h-4 shrink-0" /> ✓ {lastScan.label} verified</>
                  : <><AlertTriangle className="w-4 h-4 shrink-0" /> SKU not found: {lastScan.label}</>
                }
              </div>
            )}

            {/* Scan button */}
            <Button
              onClick={() => setScannerOpen(true)}
              className="w-full bg-emerald-600 hover:bg-emerald-700 gap-2"
            >
              <ScanLine className="w-4 h-4" /> Scan Next Item
            </Button>

            {/* Items checklist */}
            <div className="space-y-2">
              {items.map((item) => {
                const key = item.product_id || item.sku;
                const checked = !!checkedSkus[key];
                return (
                  <button
                    key={key}
                    onClick={() => toggleItem(key)}
                    className={cn(
                      "w-full flex items-center gap-3 p-3 rounded-lg border text-left transition-all",
                      checked
                        ? "bg-emerald-50 border-emerald-200"
                        : "bg-white border-slate-200 hover:border-slate-300"
                    )}
                  >
                    {checked
                      ? <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                      : <Circle className="w-4 h-4 text-slate-300 shrink-0" />
                    }
                    <div className="flex-1 min-w-0">
                      <p className={cn("text-sm font-medium truncate", checked ? "text-emerald-700" : "text-slate-700")}>
                        {item.product_name}
                      </p>
                      <p className="text-[11px] text-slate-400 font-mono">{item.sku}</p>
                    </div>
                    <span className={cn("text-sm font-semibold shrink-0", checked ? "text-emerald-600" : "text-slate-500")}>
                      {item.quantity_requested} {item.unit}
                    </span>
                  </button>
                );
              })}
            </div>

            {allChecked && (
              <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-3 text-center">
                <CheckCircle2 className="w-5 h-5 text-emerald-500 mx-auto mb-1" />
                <p className="text-sm font-semibold text-emerald-700">All items verified!</p>
                <p className="text-xs text-emerald-600">Shipment is ready to dispatch.</p>
              </div>
            )}

            <div className="flex justify-end pt-1">
              <Button variant="outline" onClick={handleClose}>Close</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {scannerOpen && (
        <BarcodeScanner
          onDetected={handleScan}
          onClose={() => setScannerOpen(false)}
        />
      )}
    </>
  );
}