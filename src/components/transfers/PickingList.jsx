import React, { useState, useMemo } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { Wind, Thermometer, Snowflake, CheckSquare, Square, Printer, ArrowRight, Package, ScanLine } from "lucide-react";
import { format } from "date-fns";

// Same rack mapping logic as the floor plan
const ZONE_RACKS = {
  ambient: ["A1","A2","A3","A4","A5","A6","B1","B2","B3","B4","B5","B6","C1","C2","C3","C4","C5","C6","D1","D2","D3","D4","D5","D6"],
  chilled: ["R1","R2","R3","R4","R5","R6","R7","R8","R9","R10","R11","R12"],
  frozen:  ["F1","F2","F3","F4","F5","F6","F7","F8"],
};

const ZONE_META = {
  ambient: { label: "Ambient Storage", icon: Wind,        color: "text-amber-700",  bg: "bg-amber-50",   border: "border-amber-200",  badge: "bg-amber-100 text-amber-700" },
  chilled: { label: "Chilled Storage", icon: Thermometer, color: "text-blue-700",   bg: "bg-blue-50",    border: "border-blue-200",   badge: "bg-blue-100 text-blue-700" },
  frozen:  { label: "Frozen Storage",  icon: Snowflake,   color: "text-indigo-700", bg: "bg-indigo-50",  border: "border-indigo-200", badge: "bg-indigo-100 text-indigo-700" },
};

const ZONE_ORDER = ["frozen", "chilled", "ambient"];

function getRackForItem(item, inventory) {
  // Find the warehouse inventory record matching this SKU/product
  const invItem = inventory.find(
    i => i.location_type === "warehouse" &&
        (i.sku === item.sku || i.product_id === item.product_id || i.product_name === item.product_name)
  );

  if (!invItem) return { zone: "ambient", rack: "—" };

  const zone = invItem.storage_zone || "ambient";
  const racks = ZONE_RACKS[zone] || ZONE_RACKS.ambient;

  // Deterministically assign rack based on item index in warehouse inventory (same logic as floor plan)
  const warehouseItems = inventory.filter(i => i.location_type === "warehouse" && i.storage_zone === zone);
  const idx = warehouseItems.findIndex(i => i.id === invItem.id);
  const rack = racks[idx % racks.length] || racks[0];

  return { zone, rack, invItem };
}

function groupByZoneAndRack(transferItems, inventory) {
  const groups = {};

  transferItems.forEach((item, originalIdx) => {
    const { zone, rack, invItem } = getRackForItem(item, inventory);
    if (!groups[zone]) groups[zone] = {};
    if (!groups[zone][rack]) groups[zone][rack] = [];
    groups[zone][rack].push({ ...item, _zone: zone, _rack: rack, _invItem: invItem, _originalIdx: originalIdx });
  });

  return groups;
}

function PickingRow({ item, checked, onToggle }) {
  return (
    <div
      className={cn(
        "flex items-start gap-3 p-3 rounded-lg border cursor-pointer transition-all",
        checked ? "bg-emerald-50 border-emerald-200 opacity-70" : "bg-white border-slate-200 hover:border-slate-300"
      )}
      onClick={onToggle}
    >
      <div className="mt-0.5 flex-shrink-0">
        {checked
          ? <CheckSquare className="w-4 h-4 text-emerald-500" />
          : <Square className="w-4 h-4 text-slate-300" />
        }
      </div>
      <div className="flex-1 min-w-0">
        <p className={cn("text-sm font-medium", checked ? "line-through text-slate-400" : "text-slate-800")}>
          {item.product_name}
        </p>
        {item.sku && (
          <p className="text-[11px] font-mono text-slate-400 mt-0.5">{item.sku}</p>
        )}
      </div>
      <div className="text-right flex-shrink-0">
        <p className={cn("text-sm font-bold", checked ? "text-slate-400" : "text-slate-800")}>
          {item.quantity_requested} <span className="text-xs font-normal text-slate-400">{item.unit || "pcs"}</span>
        </p>
        {item._invItem && (
          <p className="text-[10px] text-slate-400 mt-0.5">
            stock: {item._invItem.quantity?.toLocaleString()}
          </p>
        )}
      </div>
    </div>
  );
}

export default function PickingList({ open, onOpenChange, transfer, inventory, onProceedToVerify }) {
  const [checked, setChecked] = useState({});

  const groups = useMemo(() => {
    if (!transfer?.items) return {};
    return groupByZoneAndRack(transfer.items, inventory || []);
  }, [transfer, inventory]);

  const totalItems = transfer?.items?.length || 0;
  const checkedCount = Object.keys(checked).filter(k => checked[k]).length;
  const allDone = checkedCount === totalItems && totalItems > 0;

  const toggleItem = (key) => setChecked(prev => ({ ...prev, [key]: !prev[key] }));
  const toggleAll = () => {
    if (allDone) {
      setChecked({});
    } else {
      const all = {};
      transfer?.items?.forEach((_, i) => { all[i] = true; });
      setChecked(all);
    }
  };

  const handlePrint = () => window.print();

  if (!transfer) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto print:shadow-none print:max-w-none print:max-h-none">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <Package className="w-4 h-4 text-emerald-600" />
              <span>Picking List</span>
              <span className="text-slate-400 font-normal">·</span>
              <span className="text-slate-500 text-sm font-normal font-mono">{transfer.order_number}</span>
            </div>
            <Button variant="outline" size="sm" onClick={handlePrint} className="print:hidden">
              <Printer className="w-3.5 h-3.5 mr-1.5" /> Print
            </Button>
          </DialogTitle>
        </DialogHeader>

        {/* Header info strip */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 py-3 border-y border-slate-100 text-[11px]">
          <div>
            <p className="text-slate-400 uppercase tracking-wider">Destination</p>
            <p className="font-semibold text-slate-700 mt-0.5 flex items-center gap-1">
              <ArrowRight className="w-3 h-3 text-slate-400" /> {transfer.store_name}
            </p>
          </div>
          <div>
            <p className="text-slate-400 uppercase tracking-wider">Priority</p>
            <p className="font-semibold text-slate-700 mt-0.5 capitalize">{transfer.priority || "normal"}</p>
          </div>
          <div>
            <p className="text-slate-400 uppercase tracking-wider">Delivery Date</p>
            <p className="font-semibold text-slate-700 mt-0.5">
              {transfer.requested_delivery_date
                ? format(new Date(transfer.requested_delivery_date), "dd MMM yyyy")
                : "—"}
            </p>
          </div>
          <div>
            <p className="text-slate-400 uppercase tracking-wider">Progress</p>
            <p className={cn("font-semibold mt-0.5", allDone ? "text-emerald-600" : "text-slate-700")}>
              {checkedCount}/{totalItems} picked
            </p>
          </div>
        </div>

        {/* Progress bar */}
        <div className="w-full bg-slate-100 rounded-full h-1.5">
          <div
            className="bg-emerald-500 h-1.5 rounded-full transition-all duration-300"
            style={{ width: totalItems > 0 ? `${(checkedCount / totalItems) * 100}%` : "0%" }}
          />
        </div>

        {/* Check all / clear */}
        <div className="flex items-center justify-between">
          <p className="text-xs text-slate-500">Tap items to mark as picked. Items are sorted by zone and rack for efficient picking.</p>
          <Button variant="ghost" size="sm" onClick={toggleAll} className="text-xs text-slate-500 h-7 print:hidden">
            {allDone ? "Uncheck All" : "Check All"}
          </Button>
        </div>

        {/* Zones */}
        <div className="space-y-5">
          {ZONE_ORDER.map(zone => {
            const rackGroups = groups[zone];
            if (!rackGroups || Object.keys(rackGroups).length === 0) return null;
            const meta = ZONE_META[zone];
            const Icon = meta.icon;

            return (
              <div key={zone} className={cn("rounded-xl border p-4 space-y-3", meta.bg, meta.border)}>
                {/* Zone header */}
                <div className="flex items-center gap-2">
                  <Icon className={cn("w-4 h-4", meta.color)} />
                  <h3 className={cn("text-sm font-bold", meta.color)}>{meta.label}</h3>
                  <span className={cn("ml-auto text-[10px] font-semibold px-2 py-0.5 rounded-full", meta.badge)}>
                    {Object.values(rackGroups).flat().length} items
                  </span>
                </div>

                {/* Racks within zone */}
                {Object.entries(rackGroups)
                  .sort(([a], [b]) => a.localeCompare(b, undefined, { numeric: true }))
                  .map(([rack, items]) => (
                    <div key={rack} className="space-y-1.5">
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-bold font-mono text-slate-500 uppercase tracking-widest bg-white border border-slate-200 px-2 py-0.5 rounded">
                          Rack {rack}
                        </span>
                        <div className="flex-1 h-px bg-slate-200" />
                      </div>
                      <div className="space-y-1.5">
                        {items.map(item => {
                          const key = item._originalIdx;
                          return (
                            <PickingRow
                              key={key}
                              item={item}
                              checked={!!checked[key]}
                              onToggle={() => toggleItem(key)}
                            />
                          );
                        })}
                      </div>
                    </div>
                  ))}
              </div>
            );
          })}

          {/* Items with no warehouse inventory match */}
          {(() => {
            const unknownItems = transfer.items?.filter((item, idx) => {
              const { invItem } = getRackForItem(item, inventory || []);
              return !invItem;
            });
            if (!unknownItems?.length) return null;
            return (
              <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 space-y-2">
                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Unlocated Items</p>
                <p className="text-[11px] text-slate-400">These items have no warehouse inventory record — verify manually.</p>
                {unknownItems.map((item, i) => (
                  <div key={i} className="flex items-center justify-between p-2 bg-white border border-slate-200 rounded-lg">
                    <div>
                      <p className="text-sm font-medium text-slate-700">{item.product_name}</p>
                      {item.sku && <p className="text-[10px] font-mono text-slate-400">{item.sku}</p>}
                    </div>
                    <p className="text-sm font-bold text-slate-600">{item.quantity_requested} {item.unit || "pcs"}</p>
                  </div>
                ))}
              </div>
            );
          })()}
        </div>

        {/* Footer */}
        {allDone && (
          <div className="flex flex-col sm:flex-row items-center gap-3 p-3 bg-emerald-50 border border-emerald-200 rounded-xl">
            <div className="flex items-center gap-2 flex-1">
              <CheckSquare className="w-4 h-4 text-emerald-600 flex-shrink-0" />
              <p className="text-sm font-medium text-emerald-700">All items picked — ready for verification!</p>
            </div>
            {onProceedToVerify && (
              <Button onClick={() => onProceedToVerify(transfer)} className="bg-emerald-600 hover:bg-emerald-700 w-full sm:w-auto">
                <ScanLine className="w-4 h-4 mr-1.5" /> Scan & Verify
              </Button>
            )}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}