import React, { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { AlertCircle } from "lucide-react";

export default function MaintenanceFormDialog({ open, onOpenChange, vehicle, onSave, saving }) {
  const [formData, setFormData] = useState({
    vehicle_id: "",
    vehicle_plate_number: "",
    maintenance_type: "inspection",
    service_date: "",
    next_service_due: "",
    cost: "",
    description: "",
    service_provider: "",
    mileage_km: "",
    notes: "",
  });

  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (vehicle) {
      const today = new Date().toISOString().split("T")[0];
      setFormData({
        vehicle_id: vehicle.id,
        vehicle_plate_number: vehicle.plate_number,
        maintenance_type: "inspection",
        service_date: today,
        next_service_due: "",
        cost: "",
        description: "",
        service_provider: "",
        mileage_km: "",
        notes: "",
      });
    }
    setErrors({});
  }, [vehicle, open]);

  const validate = () => {
    const newErrors = {};
    if (!formData.service_date) newErrors.service_date = "Service date required";
    if (formData.cost && isNaN(parseFloat(formData.cost))) newErrors.cost = "Invalid cost amount";
    if (formData.mileage_km && isNaN(parseFloat(formData.mileage_km))) newErrors.mileage_km = "Invalid mileage";
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (validate()) {
      onSave({
        ...formData,
        cost: formData.cost ? parseFloat(formData.cost) : undefined,
        mileage_km: formData.mileage_km ? parseFloat(formData.mileage_km) : undefined,
      });
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Log Maintenance - {vehicle?.plate_number}</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Service Details */}
          <div>
            <h3 className="text-sm font-semibold text-slate-800 mb-3">Service Details</h3>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-xs">Type *</Label>
                <Select value={formData.maintenance_type} onValueChange={(val) => setFormData({ ...formData, maintenance_type: val })}>
                  <SelectTrigger className="mt-1 text-sm">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="oil_change">Oil Change</SelectItem>
                    <SelectItem value="tire_replacement">Tire Replacement</SelectItem>
                    <SelectItem value="inspection">Inspection</SelectItem>
                    <SelectItem value="repair">Repair</SelectItem>
                    <SelectItem value="battery">Battery</SelectItem>
                    <SelectItem value="brake_service">Brake Service</SelectItem>
                    <SelectItem value="filter_replacement">Filter Replacement</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label className="text-xs">Service Date *</Label>
                <Input
                  type="date"
                  value={formData.service_date}
                  onChange={(e) => setFormData({ ...formData, service_date: e.target.value })}
                  className="mt-1 text-sm"
                />
                {errors.service_date && (
                  <p className="text-xs text-red-600 mt-1 flex items-center gap-1">
                    <AlertCircle className="w-3 h-3" /> {errors.service_date}
                  </p>
                )}
              </div>

              <div>
                <Label className="text-xs">Next Service Due</Label>
                <Input
                  type="date"
                  value={formData.next_service_due}
                  onChange={(e) => setFormData({ ...formData, next_service_due: e.target.value })}
                  className="mt-1 text-sm"
                />
              </div>

              <div>
                <Label className="text-xs">Cost (SGD)</Label>
                <Input
                  type="number"
                  step="0.01"
                  value={formData.cost}
                  onChange={(e) => setFormData({ ...formData, cost: e.target.value })}
                  placeholder="e.g., 150.50"
                  className="mt-1 text-sm"
                />
                {errors.cost && (
                  <p className="text-xs text-red-600 mt-1 flex items-center gap-1">
                    <AlertCircle className="w-3 h-3" /> {errors.cost}
                  </p>
                )}
              </div>

              <div>
                <Label className="text-xs">Mileage (km)</Label>
                <Input
                  type="number"
                  value={formData.mileage_km}
                  onChange={(e) => setFormData({ ...formData, mileage_km: e.target.value })}
                  placeholder="e.g., 15000"
                  className="mt-1 text-sm"
                />
                {errors.mileage_km && (
                  <p className="text-xs text-red-600 mt-1 flex items-center gap-1">
                    <AlertCircle className="w-3 h-3" /> {errors.mileage_km}
                  </p>
                )}
              </div>

              <div>
                <Label className="text-xs">Service Provider</Label>
                <Input
                  value={formData.service_provider}
                  onChange={(e) => setFormData({ ...formData, service_provider: e.target.value })}
                  placeholder="e.g., ABC Service Center"
                  className="mt-1 text-sm"
                />
              </div>

              <div className="col-span-2">
                <Label className="text-xs">Description</Label>
                <Textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Describe the work done..."
                  className="mt-1 text-sm min-h-16"
                />
              </div>

              <div className="col-span-2">
                <Label className="text-xs">Notes</Label>
                <Textarea
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  placeholder="Any additional notes..."
                  className="mt-1 text-sm min-h-16"
                />
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-4 border-t border-slate-200">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={saving}>
              Cancel
            </Button>
            <Button type="submit" className="bg-emerald-600 hover:bg-emerald-700" disabled={saving}>
              {saving ? "Saving..." : "Log Maintenance"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}