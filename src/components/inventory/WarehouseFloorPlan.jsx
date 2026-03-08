import React, { useState, useMemo } from "react";
import { cn } from "@/lib/utils";
import { Package, Thermometer, Snowflake, Wind, AlertTriangle, CheckCircle2, X } from "lucide-react";

// Fixed rack layout for each zone: [row, col, rackId]
const ZONE_LAYOUT = {
  ambient: {
    label: "Ambient Storage",
    icon: Wind,
    color: { bg: "bg-amber-50", border: "border-amber-200", header: "bg-amber-100", text: "text-amber-700", fill: "#fef3c7", stroke: "#fcd34d", dot: "#d97706" },
    rows: 4,
    cols: 6,
    racks: ["A1","A2","A3","A4","A5","A6","B1","B2","B3","B4","B5","B6","C1","C2","C3","C4","C5","C6","D1","D2","D3","D4","D5","D6"],
  },
  chilled: {
    label: "Chilled Storage",
    icon: Thermometer,
    color: { bg: "bg-blue-50", border: "border-blue-200", header: "bg-blue-100", text: "text-blue-700", fill: "#eff6ff", stroke: "#93c5fd", dot: "#2563eb" },
    rows: 3,
    cols: 4,
    racks: ["R1","R2","R3","R4","R5","R6","R7","R8","R9","R10","R11","R12"],
  },
  frozen: {
    label: "Frozen Storage",
    icon: Snowflake,
    color: { bg: "bg-indigo-50", border: "border-indigo-200", header: "bg-indigo-100", text: "text-indigo-700", fill: "#eef2ff", stroke: "#a5b4fc", dot: "#4338ca" },
    rows: 2,
    cols: 4,
    racks: ["F1","F2","F3","F4","F5","F6","F7","F8"],
  },
};

function getStockLevel(qty, minLevel) {
  if (qty === 0) return "empty";
  if (qty <= minLevel * 0.5) return "critical";
  if (qty <= minLevel) return "low";
  if (qty <= minLevel * 2) return "medium";
  return "high";
}

const LEVEL_STYLES = {
  empty:    { fill: "#f1f5f9", stroke: "#cbd5e1", label: "Empty",    dot: "bg-slate-300" },
  critical: { fill: "#fee2e2", stroke: "#f87171", label: "Critical", dot: "bg-red-500" },
  low:      { fill: "#fef3c7", stroke: "#fcd34d", label: "Low",      dot: "bg-amber-400" },
  medium:   { fill: "#d1fae5", stroke: "#6ee7b7", label: "Good",     dot: "bg-emerald-400" },
  high:     { fill: "#a7f3d0", stroke: "#34d399", label: "Full",     dot: "bg-emerald-600" },
};

function RackCell({ rack, items, products, onHover, hovered, zone }) {
  const totalQty = items.reduce((s, i) => s + (i.quantity || 0), 0);
  const minLevel = items.length > 0
    ? Math.max(...items.map(i => {
        const p = products.find(p => p.id === i.product_id);
        return p?.min_stock_level || 10;
      }))
    : 10;

  const level = items.length === 0 ? "empty" : getStockLevel(totalQty, minLevel);
  const style = LEVEL_STYLES[level];
  const isHovered = hovered === rack;

  return (
    <g
      className="cursor-pointer"
      onMouseEnter={() => onHover(rack, items, totalQty, level)}
      onMouseLeave={() => onHover(null)}
    >
      <rect
        x="2" y="2" width="46" height="36"
        rx="4"
        fill={style.fill}
        stroke={isHovered ? "#10b981" : style.stroke}
        strokeWidth={isHovered ? 2 : 1}
        style={{ transition: "all 0.15s" }}
      />
      {/* Rack shelf lines */}
      <line x1="6" y1="14" x2="44" y2="14" stroke={style.stroke} strokeWidth="0.8" opacity="0.6" />
      <line x1="6" y1="24" x2="44" y2="24" stroke={style.stroke} strokeWidth="0.8" opacity="0.6" />
      {/* Rack ID */}
      <text x="25" y="10" textAnchor="middle" fontSize="7" fill="#64748b" fontFamily="monospace" fontWeight="600">
        {rack}
      </text>
      {/* Item count or empty */}
      {items.length > 0 ? (
        <text x="25" y="34" textAnchor="middle" fontSize="8" fill="#1e293b" fontWeight="700">
          {items.length} SKU{items.length !== 1 ? "s" : ""}
        </text>
      ) : (
        <text x="25" y="30" textAnchor="middle" fontSize="7" fill="#94a3b8">
          empty
        </text>
      )}
      {/* Status dot */}
      <circle cx="40" cy="7" r="3" fill={style.stroke} />
    </g>
  );
}

function ZoneFloorPlan({ zoneKey, zoneConfig, items, products }) {
  const [hovered, setHovered] = useState(null);
  const [tooltip, setTooltip] = useState(null);

  const { racks, rows, cols, color, label, icon: Icon } = zoneConfig;

  // Map items to racks by cycling through racks based on item index
  const rackItemsMap = useMemo(() => {
    const map = {};
    racks.forEach(r => (map[r] = []));
    items.forEach((item, idx) => {
      const rack = racks[idx % racks.length];
      map[rack].push(item);
    });
    return map;
  }, [items, racks]);

  const handleHover = (rack, rackItems, totalQty, level) => {
    setHovered(rack);
    if (rack) {
      setTooltip({ rack, items: rackItems, totalQty, level });
    } else {
      setTooltip(null);
    }
  };

  const totalQty = items.reduce((s, i) => s + (i.quantity || 0), 0);
  const emptyRacks = racks.filter(r => rackItemsMap[r]?.length === 0).length;
  const lowRacks = racks.filter(r => {
    const rItems = rackItemsMap[r] || [];
    if (!rItems.length) return false;
    const qty = rItems.reduce((s, i) => s + (i.quantity || 0), 0);
    const minLevel = Math.max(...rItems.map(i => products.find(p => p.id === i.product_id)?.min_stock_level || 10));
    return qty <= minLevel;
  }).length;

  const W = cols * 54 + 8;
  const H = rows * 46 + 8;

  return (
    <div className={cn("rounded-xl border p-4 space-y-3", color.bg, color.border)}>
      {/* Zone header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className={cn("w-7 h-7 rounded-lg flex items-center justify-center", color.header)}>
            <Icon className={cn("w-3.5 h-3.5", color.text)} />
          </div>
          <div>
            <p className={cn("text-sm font-semibold", color.text)}>{label}</p>
            <p className="text-[11px] text-slate-500">{items.length} SKUs · {totalQty.toLocaleString()} units</p>
          </div>
        </div>
        <div className="flex items-center gap-3 text-[11px]">
          {emptyRacks > 0 && (
            <span className="flex items-center gap-1 text-slate-400">
              <span className="w-2 h-2 rounded-sm bg-slate-300 inline-block" />
              {emptyRacks} empty
            </span>
          )}
          {lowRacks > 0 && (
            <span className="flex items-center gap-1 text-amber-600">
              <AlertTriangle className="w-3 h-3" />
              {lowRacks} low
            </span>
          )}
        </div>
      </div>

      {/* SVG Floor Plan */}
      <div className="relative">
        <div className="overflow-x-auto">
          <svg width={W} height={H} className="block">
            {racks.map((rack, idx) => {
              const row = Math.floor(idx / cols);
              const col = idx % cols;
              const x = col * 54 + 4;
              const y = row * 46 + 4;
              return (
                <g key={rack} transform={`translate(${x}, ${y})`}>
                  <RackCell
                    rack={rack}
                    items={rackItemsMap[rack] || []}
                    products={products}
                    onHover={handleHover}
                    hovered={hovered}
                    zone={zoneKey}
                  />
                </g>
              );
            })}
          </svg>
        </div>

        {/* Tooltip */}
        {tooltip && (
          <div className="absolute top-0 right-0 z-20 w-56 bg-white border border-slate-200 rounded-xl shadow-xl p-3 space-y-2">
            <div className="flex items-center justify-between">
              <p className="text-xs font-bold text-slate-800">Rack {tooltip.rack}</p>
              <span className={cn(
                "text-[10px] font-semibold px-1.5 py-0.5 rounded-full",
                tooltip.level === "empty" ? "bg-slate-100 text-slate-500" :
                tooltip.level === "critical" ? "bg-red-100 text-red-600" :
                tooltip.level === "low" ? "bg-amber-100 text-amber-700" :
                "bg-emerald-100 text-emerald-700"
              )}>
                {LEVEL_STYLES[tooltip.level].label}
              </span>
            </div>

            {tooltip.items.length === 0 ? (
              <p className="text-[11px] text-slate-400 italic">No stock assigned to this rack</p>
            ) : (
              <div className="space-y-1.5 max-h-40 overflow-y-auto">
                {tooltip.items.map(item => {
                  const product = products.find(p => p.id === item.product_id);
                  const isLow = product && item.quantity <= (product.min_stock_level || 10);
                  return (
                    <div key={item.id} className="flex items-center justify-between gap-2">
                      <div className="min-w-0">
                        <p className="text-[11px] font-medium text-slate-700 truncate">{item.product_name}</p>
                        {item.sku && <p className="text-[10px] text-slate-400 font-mono">{item.sku}</p>}
                      </div>
                      <span className={cn("text-[11px] font-bold flex-shrink-0", isLow ? "text-red-500" : "text-slate-700")}>
                        {item.quantity?.toLocaleString()} {product?.unit || ""}
                      </span>
                    </div>
                  );
                })}
              </div>
            )}

            <div className="pt-1 border-t border-slate-100 flex items-center justify-between">
              <span className="text-[10px] text-slate-400">Total</span>
              <span className="text-xs font-bold text-slate-800">{tooltip.totalQty.toLocaleString()} units</span>
            </div>
          </div>
        )}
      </div>

      {/* Legend */}
      <div className="flex flex-wrap gap-3 pt-1">
        {Object.entries(LEVEL_STYLES).map(([key, val]) => (
          <span key={key} className="flex items-center gap-1 text-[10px] text-slate-500">
            <span className="w-2.5 h-2.5 rounded-sm inline-block border" style={{ background: val.fill, borderColor: val.stroke }} />
            {val.label}
          </span>
        ))}
      </div>
    </div>
  );
}

export default function WarehouseFloorPlan({ inventory, products }) {
  const [collapsed, setCollapsed] = useState(false);

  const warehouseItems = inventory.filter(i => i.location_type === "warehouse");

  const byZone = useMemo(() => {
    const map = { ambient: [], chilled: [], frozen: [] };
    warehouseItems.forEach(item => {
      const z = item.storage_zone;
      if (map[z]) map[z].push(item);
      else map.ambient.push(item); // fallback
    });
    return map;
  }, [warehouseItems]);

  const totalEmpty = Object.entries(ZONE_LAYOUT).reduce((sum, [zk, zc]) => {
    return sum + zc.racks.filter((_, idx) => {
      const items = byZone[zk] || [];
      return idx >= items.length;
    }).length;
  }, 0);

  const lowStockCount = warehouseItems.filter(item => {
    const p = products.find(p => p.id === item.product_id);
    return p && item.quantity <= (p.min_stock_level || 10);
  }).length;

  return (
    <div className="bg-white rounded-xl border border-slate-200/80 overflow-hidden">
      {/* Header */}
      <button
        className="w-full flex items-center justify-between px-5 py-4 hover:bg-slate-50 transition-colors"
        onClick={() => setCollapsed(c => !c)}
      >
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-slate-900 flex items-center justify-center">
            <Package className="w-4 h-4 text-white" />
          </div>
          <div className="text-left">
            <p className="text-sm font-semibold text-slate-800">Warehouse Floor Plan</p>
            <p className="text-[11px] text-slate-400 mt-0.5">
              {warehouseItems.length} SKUs across 3 zones · hover racks to inspect
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          {lowStockCount > 0 && (
            <span className="flex items-center gap-1 text-[11px] text-amber-600 font-medium">
              <AlertTriangle className="w-3.5 h-3.5" /> {lowStockCount} low stock
            </span>
          )}
          {totalEmpty > 0 && (
            <span className="text-[11px] text-slate-400">{totalEmpty} empty racks</span>
          )}
          <span className="text-slate-400 text-xs">{collapsed ? "▼ Show" : "▲ Hide"}</span>
        </div>
      </button>

      {/* Floor plan content */}
      {!collapsed && (
        <div className="px-4 pb-5 pt-1 space-y-4">
          {Object.entries(ZONE_LAYOUT).map(([zoneKey, zoneConfig]) => (
            <ZoneFloorPlan
              key={zoneKey}
              zoneKey={zoneKey}
              zoneConfig={zoneConfig}
              items={byZone[zoneKey] || []}
              products={products}
            />
          ))}
        </div>
      )}
    </div>
  );
}