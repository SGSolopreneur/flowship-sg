import React, { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { AlertCircle } from "lucide-react";

export default function VehicleFormDialog({ open, onOpenChange, vehicle, onSave, saving }) {
  const [formData, setFormData] = useState({
    plate_number: "",
    vehicle_type: "van",
    weight_capacity_kg: "",
    volume_capacity_m3: "",
    driver_name: "",
    driver_phone: "",
    driver_email: "",
    status: "active",
    notes: "",
  });

  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (vehicle) {
      setFormData(vehicle);
    } else {
      setFormData({
        plate_number: "",
        vehicle_type: "van",
        weight_capacity_kg: "",
        volume_capacity_m3: "",
        driver_name: "",
        driver_phone: "",
        driver_email: "",
        status: "active",
        notes: "",
      });
    }
    setErrors({});
  }, [vehicle, open]);

  const validate = () => {
    const newErrors = {};
    if (!formData.plate_number?.trim()) newErrors.plate_number = "Plate number required";
    if (!formData.weight_capacity_kg) newErrors.weight_capacity_kg = "Weight capacity required";
    if (!formData.volume_capacity_m3) newErrors.volume_capacity_m3 = "Volume capacity required";
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (validate()) {
      onSave(formData);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>{vehicle ? "Edit Vehicle" : "Add Vehicle"}</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Vehicle Info */}
          <div>
            <h3 className="text-sm font-semibold text-slate-800 mb-3">Vehicle Information</h3>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-xs">Plate Number *</Label>
                <Input
                  value={formData.plate_number}
                  onChange={(e) => setFormData({ ...formData, plate_number: e.target.value })}
                  placeholder="e.g., SGA 1234"
                  className="mt-1 text-sm"
                />
                {errors.plate_number && (
                  <p className="text-xs text-red-600 mt-1 flex items-center gap-1">
                    <AlertCircle className="w-3 h-3" /> {errors.plate_number}
                  </p>
                )}
              </div>

              <div>
                <Label className="text-xs">Type *</Label>
                <Select value={formData.vehicle_type} onValueChange={(val) => setFormData({ ...formData, vehicle_type: val })}>
                  <SelectTrigger className="mt-1 text-sm">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="van">Van</SelectItem>
                    <SelectItem value="truck">Truck</SelectItem>
                    <SelectItem value="lorry">Lorry</SelectItem>
                    <SelectItem value="container">Container</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label className="text-xs">Weight Capacity (kg) *</Label>
                <Input
                  type="number"
                  value={formData.weight_capacity_kg}
                  onChange={(e) => setFormData({ ...formData, weight_capacity_kg: parseFloat(e.target.value) || "" })}
                  placeholder="e.g., 1000"
                  className="mt-1 text-sm"
                />
                {errors.weight_capacity_kg && (
                  <p className="text-xs text-red-600 mt-1 flex items-center gap-1">
                    <AlertCircle className="w-3 h-3" /> {errors.weight_capacity_kg}
                  </p>
                )}
              </div>

              <div>
                <Label className="text-xs">Volume Capacity (m³) *</Label>
                <Input
                  type="number"
                  step="0.1"
                  value={formData.volume_capacity_m3}
                  onChange={(e) => setFormData({ ...formData, volume_capacity_m3: parseFloat(e.target.value) || "" })}
                  placeholder="e.g., 10.5"
                  className="mt-1 text-sm"
                />
                {errors.volume_capacity_m3 && (
                  <p className="text-xs text-red-600 mt-1 flex items-center gap-1">
                    <AlertCircle className="w-3 h-3" /> {errors.volume_capacity_m3}
                  </p>
                )}
              </div>

              <div className="col-span-2">
                <Label className="text-xs">Status</Label>
                <Select value={formData.status} onValueChange={(val) => setFormData({ ...formData, status: val })}>
                  <SelectTrigger className="mt-1 text-sm">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="maintenance">Maintenance</SelectItem>
                    <SelectItem value="unavailable">Unavailable</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          {/* Driver Info */}
          <div>
            <h3 className="text-sm font-semibold text-slate-800 mb-3">Driver Information</h3>
            <div className="grid grid-cols-2 gap-3">
              <div className="col-span-2">
                <Label className="text-xs">Driver Name</Label>
                <Input
                  value={formData.driver_name}
                  onChange={(e) => setFormData({ ...formData, driver_name: e.target.value })}
                  placeholder="e.g., John Doe"
                  className="mt-1 text-sm"
                />
              </div>

              <div>
                <Label className="text-xs">Driver Phone</Label>
                <Input
                  value={formData.driver_phone}
                  onChange={(e) => setFormData({ ...formData, driver_phone: e.target.value })}
                  placeholder="e.g., +65 9XXX XXXX"
                  className="mt-1 text-sm"
                />
              </div>

              <div>
                <Label className="text-xs">Driver Email</Label>
                <Input
                  type="email"
                  value={formData.driver_email}
                  onChange={(e) => setFormData({ ...formData, driver_email: e.target.value })}
                  placeholder="e.g., john@example.com"
                  className="mt-1 text-sm"
                />
              </div>
            </div>
          </div>

          {/* Notes */}
          <div>
            <Label className="text-xs">Notes</Label>
            <Textarea
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              placeholder="Any additional notes..."
              className="mt-1 text-sm min-h-20"
            />
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-4 border-t border-slate-200">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={saving}>
              Cancel
            </Button>
            <Button type="submit" className="bg-emerald-600 hover:bg-emerald-700" disabled={saving}>
              {saving ? "Saving..." : vehicle ? "Update Vehicle" : "Add Vehicle"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}