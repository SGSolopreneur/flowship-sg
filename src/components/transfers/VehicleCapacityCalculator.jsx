import React, { useMemo } from "react";
import { AlertCircle, CheckCircle2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

export default function VehicleCapacityCalculator({ items, products, vehicle }) {
  const { totalWeight, totalVolume, available } = useMemo(() => {
    if (!items || !products || !vehicle) {
      return { totalWeight: 0, totalVolume: 0, available: true };
    }

    let weight = 0;
    let volume = 0;

    items.forEach((item) => {
      const product = products.find((p) => p.id === item.product_id);
      if (!product) return;

      // Estimate weight (assuming unit_cost can be proxy for density; ideally product has weight/volume fields)
      // For now, we'll estimate: 1 unit = 0.5kg, 0.01m³
      const estimatedWeight = item.quantity_requested * 0.5;
      const estimatedVolume = item.quantity_requested * 0.01;

      weight += estimatedWeight;
      volume += estimatedVolume;
    });

    const weightExceeded = weight > vehicle.weight_capacity_kg;
    const volumeExceeded = volume > vehicle.volume_capacity_m3;
    const available = !weightExceeded && !volumeExceeded;

    return { totalWeight: weight, totalVolume: volume, available };
  }, [items, products, vehicle]);

  if (!vehicle) return null;

  const weightPercent = Math.min(
    (totalWeight / vehicle.weight_capacity_kg) * 100,
    100
  );
  const volumePercent = Math.min(
    (totalVolume / vehicle.volume_capacity_m3) * 100,
    100
  );
  const weightExceeded = totalWeight > vehicle.weight_capacity_kg;
  const volumeExceeded = totalVolume > vehicle.volume_capacity_m3;

  return (
    <Card className={cn(
      "border-2",
      available ? "border-emerald-200 bg-emerald-50" : "border-red-200 bg-red-50"
    )}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base">Vehicle Capacity</CardTitle>
          <Badge variant={available ? "default" : "destructive"} className={!available ? "bg-red-600" : "bg-emerald-600"}>
            {available ? "✓ Within Capacity" : "✗ Exceeds Capacity"}
          </Badge>
        </div>
        <p className="text-xs text-slate-600 mt-1">{vehicle.plate_number} • {vehicle.vehicle_type}</p>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Weight */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <label className="text-sm font-medium text-slate-700">Weight</label>
            <span className={cn(
              "text-sm font-semibold",
              weightExceeded ? "text-red-600" : "text-slate-700"
            )}>
              {totalWeight.toFixed(1)} / {vehicle.weight_capacity_kg} kg
            </span>
          </div>
          <div className="w-full h-2 bg-slate-200 rounded-full overflow-hidden">
            <div
              className={cn(
                "h-full transition-all",
                weightExceeded ? "bg-red-500" : "bg-emerald-500"
              )}
              style={{ width: `${weightPercent}%` }}
            />
          </div>
          {weightExceeded && (
            <p className="text-xs text-red-600 mt-1 flex items-center gap-1">
              <AlertCircle className="w-3 h-3" />
              Exceeds capacity by {(totalWeight - vehicle.weight_capacity_kg).toFixed(1)} kg
            </p>
          )}
        </div>

        {/* Volume */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <label className="text-sm font-medium text-slate-700">Volume</label>
            <span className={cn(
              "text-sm font-semibold",
              volumeExceeded ? "text-red-600" : "text-slate-700"
            )}>
              {totalVolume.toFixed(2)} / {vehicle.volume_capacity_m3} m³
            </span>
          </div>
          <div className="w-full h-2 bg-slate-200 rounded-full overflow-hidden">
            <div
              className={cn(
                "h-full transition-all",
                volumeExceeded ? "bg-red-500" : "bg-emerald-500"
              )}
              style={{ width: `${volumePercent}%` }}
            />
          </div>
          {volumeExceeded && (
            <p className="text-xs text-red-600 mt-1 flex items-center gap-1">
              <AlertCircle className="w-3 h-3" />
              Exceeds capacity by {(totalVolume - vehicle.volume_capacity_m3).toFixed(2)} m³
            </p>
          )}
        </div>

        {!available && (
          <div className="bg-red-100 border border-red-300 rounded-lg p-3">
            <p className="text-sm text-red-800">
              ⚠️ This shipment exceeds vehicle capacity. Please split into multiple orders or select a larger vehicle.
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}