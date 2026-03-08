import React from "react";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from "recharts";

const categoryLabels = {
  fresh_produce: "Fresh Produce",
  frozen: "Frozen",
  dairy: "Dairy",
  beverages: "Beverages",
  dry_goods: "Dry Goods",
  snacks: "Snacks",
  halal_meat: "Halal Meat",
  seafood: "Seafood",
  bakery: "Bakery",
  household: "Household",
  personal_care: "Personal Care",
  baby_products: "Baby Products",
  ready_to_eat: "Ready to Eat",
  condiments: "Condiments",
  other: "Other",
};

const COLORS = [
  "#10b981", "#3b82f6", "#f59e0b", "#ef4444", "#8b5cf6",
  "#ec4899", "#06b6d4", "#f97316", "#84cc16", "#6366f1",
  "#14b8a6", "#e11d48", "#a855f7", "#0ea5e9", "#64748b"
];

export default function CategoryBreakdown({ inventoryItems }) {
  const grouped = {};
  inventoryItems.forEach(item => {
    if (!grouped[item.storage_zone]) grouped[item.storage_zone] = 0;
    grouped[item.storage_zone] += item.quantity || 0;
  });

  const data = Object.entries(grouped).map(([key, value]) => ({
    name: key === "ambient" ? "Ambient" : key === "chilled" ? "Chilled" : key === "frozen" ? "Frozen" : key,
    value,
  }));

  if (data.length === 0) {
    return (
      <div className="bg-white rounded-xl border border-slate-200/80 p-5">
        <h3 className="text-sm font-semibold text-slate-800 mb-3">Storage Breakdown</h3>
        <p className="text-sm text-slate-400 text-center py-6">No inventory data</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl border border-slate-200/80 p-5">
      <h3 className="text-sm font-semibold text-slate-800 mb-3">Storage Breakdown</h3>
      <div className="flex items-center gap-4">
        <div className="w-32 h-32">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie data={data} innerRadius={30} outerRadius={55} paddingAngle={3} dataKey="value">
                {data.map((_, i) => (
                  <Cell key={i} fill={COLORS[i % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip formatter={(value) => value.toLocaleString()} />
            </PieChart>
          </ResponsiveContainer>
        </div>
        <div className="space-y-2 flex-1">
          {data.map((item, i) => (
            <div key={item.name} className="flex items-center gap-2">
              <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: COLORS[i % COLORS.length] }} />
              <span className="text-xs text-slate-600 flex-1">{item.name}</span>
              <span className="text-xs font-semibold text-slate-800">{item.value.toLocaleString()}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}