import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { MapPin, Check, AlertCircle, Loader2, Camera } from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import DeliveryConfirmationDialog from "./DeliveryConfirmationDialog";

const statusColors = {
  confirmed: "bg-blue-100 text-blue-700",
  picking: "bg-amber-100 text-amber-700",
  dispatched: "bg-purple-100 text-purple-700",
  in_transit: "bg-cyan-100 text-cyan-700",
  delivered: "bg-emerald-100 text-emerald-700",
};

export default function TransferTaskCard({ transfer, onUpdateLocation, onConfirmDelivery, updating, confirming }) {
  const [showLocation, setShowLocation] = useState(false);
  const [latitude, setLatitude] = useState("");
  const [longitude, setLongitude] = useState("");
  const [locationError, setLocationError] = useState("");
  const [confirmDialogOpen, setConfirmDialogOpen] = useState(false);

  const handleGetLocation = () => {
    if (!navigator.geolocation) {
      setLocationError("Geolocation not supported");
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setLatitude(position.coords.latitude.toFixed(6));
        setLongitude(position.coords.longitude.toFixed(6));
        setLocationError("");
      },
      (error) => setLocationError("Failed to get location")
    );
  };

  const handleSubmitLocation = () => {
    if (!latitude || !longitude) {
      setLocationError("Please enter both coordinates");
      return;
    }
    if (isNaN(latitude) || isNaN(longitude)) {
      setLocationError("Invalid coordinates");
      return;
    }
    onUpdateLocation({
      latitude: parseFloat(latitude),
      longitude: parseFloat(longitude),
    });
    setShowLocation(false);
  };

  const isDeliverable = ["in_transit", "dispatched"].includes(transfer.status);

  return (
    <Card className="overflow-hidden hover:shadow-md transition-shadow">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-2">
          <div>
            <CardTitle className="text-base">Order {transfer.order_number}</CardTitle>
            <p className="text-xs text-slate-600 mt-1">To: <span className="font-medium">{transfer.store_name}</span></p>
          </div>
          <Badge className={cn("text-xs flex-shrink-0", statusColors[transfer.status])}>
            {transfer.status.replace(/_/g, " ").replace(/\b\w/g, (l) => l.toUpperCase())}
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Items Summary */}
        <div className="bg-slate-50 rounded-lg p-3 space-y-2">
          <h4 className="text-xs font-semibold text-slate-700">Items ({transfer.total_items_count || transfer.items?.length || 0})</h4>
          <div className="space-y-1 max-h-32 overflow-y-auto">
            {transfer.items?.slice(0, 3).map((item, idx) => (
              <div key={idx} className="text-xs text-slate-600 flex justify-between">
                <span>{item.product_name} ({item.sku})</span>
                <span className="font-medium">{item.quantity_requested}{item.unit}</span>
              </div>
            ))}
            {transfer.items?.length > 3 && (
              <p className="text-[10px] text-slate-500 italic">+{transfer.items.length - 3} more items</p>
            )}
          </div>
        </div>

        {/* Delivery Details */}
        <div className="grid grid-cols-2 gap-3 text-sm">
          <div>
            <p className="text-xs text-slate-600">Vehicle</p>
            <p className="font-semibold text-slate-800 font-mono">{transfer.vehicle_plate_number || "—"}</p>
          </div>
          <div>
            <p className="text-xs text-slate-600">Delivery Date</p>
            <p className="font-medium text-slate-800">
              {transfer.requested_delivery_date ? format(new Date(transfer.requested_delivery_date), "dd MMM") : "—"}
            </p>
          </div>
        </div>

        {/* Location Update */}
        {!showLocation ? (
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowLocation(true)}
            className="w-full text-xs gap-2"
          >
            <MapPin className="w-3.5 h-3.5" /> Update Location
          </Button>
        ) : (
          <div className="border border-slate-200 rounded-lg p-3 space-y-2 bg-blue-50/50">
            <div className="grid grid-cols-2 gap-2">
              <div>
                <Label className="text-xs mb-1 block">Latitude</Label>
                <Input
                  type="number"
                  step="0.000001"
                  value={latitude}
                  onChange={(e) => setLatitude(e.target.value)}
                  placeholder="1.352083"
                  className="text-xs h-8"
                />
              </div>
              <div>
                <Label className="text-xs mb-1 block">Longitude</Label>
                <Input
                  type="number"
                  step="0.000001"
                  value={longitude}
                  onChange={(e) => setLongitude(e.target.value)}
                  placeholder="103.819839"
                  className="text-xs h-8"
                />
              </div>
            </div>

            {locationError && (
              <p className="text-xs text-red-600 flex items-center gap-1">
                <AlertCircle className="w-3 h-3" /> {locationError}
              </p>
            )}

            <div className="flex gap-2">
              <Button
                size="sm"
                variant="outline"
                onClick={handleGetLocation}
                disabled={updating}
                className="flex-1 text-xs h-8"
              >
                📍 Auto Detect
              </Button>
              <Button
                size="sm"
                onClick={handleSubmitLocation}
                disabled={updating}
                className="flex-1 text-xs h-8"
              >
                {updating ? <Loader2 className="w-3 h-3 animate-spin" /> : "Save"}
              </Button>
            </div>

            <Button
              size="sm"
              variant="ghost"
              onClick={() => setShowLocation(false)}
              className="w-full text-xs h-8"
            >
              Cancel
            </Button>
          </div>
        )}

        {/* Confirm Delivery */}
        {isDeliverable && (
          <Button
            onClick={() => setConfirmDialogOpen(true)}
            disabled={confirming}
            className="w-full bg-emerald-600 hover:bg-emerald-700 text-white text-xs h-9 gap-2"
          >
            {confirming ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Camera className="w-3.5 h-3.5" />}
            Confirm Delivery
          </Button>
        )}

        {transfer.status === "delivered" && (
          <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-2 text-center">
            <p className="text-xs text-emerald-700 font-medium">✓ Delivery Confirmed</p>
            {transfer.actual_delivery_date && (
              <p className="text-[10px] text-emerald-600">{format(new Date(transfer.actual_delivery_date), "dd MMM yyyy")}</p>
            )}
            {transfer.recipient_name && (
              <p className="text-[10px] text-emerald-600 mt-1">Recipient: {transfer.recipient_name}</p>
            )}
          </div>
        )}
      </CardContent>

      {/* Delivery Confirmation Dialog */}
      <DeliveryConfirmationDialog
        open={confirmDialogOpen}
        onOpenChange={setConfirmDialogOpen}
        transfer={transfer}
        onConfirm={onConfirmDelivery}
        confirming={confirming}
      />
    </Card>
  );
}