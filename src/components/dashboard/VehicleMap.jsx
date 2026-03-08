import React, { useMemo } from "react";
import { MapContainer, TileLayer, Marker, Popup, Polyline } from "react-leaflet";
import L from "leaflet";
import { format } from "date-fns";
import { AlertCircle, Truck, MapPin } from "lucide-react";

// Default marker icon fix for leaflet
const defaultIcon = new L.Icon({
  iconUrl: "https://cdn.jsdelivr.net/npm/leaflet@1.9.4/dist/images/marker-icon.png",
  iconRetinaUrl: "https://cdn.jsdelivr.net/npm/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  shadowUrl: "https://cdn.jsdelivlet.net/npm/leaflet@1.9.4/dist/images/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
});

const vehicleIcon = new L.Icon({
  iconUrl: "https://cdn.jsdelivr.net/npm/leaflet@1.9.4/dist/images/marker-icon.png",
  iconRetinaUrl: "https://cdn.jsdelivr.net/npm/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  shadowUrl: "https://cdn.jsdelivr.net/npm/leaflet@1.9.4/dist/images/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  className: "vehicle-marker",
});

export default function VehicleMap({ transfers, vehicles }) {
  // Get vehicles currently in transit
  const inTransitVehicles = useMemo(() => {
    return transfers
      .filter(t => t.status === "in_transit" && t.vehicle_id)
      .map(transfer => {
        const vehicle = vehicles.find(v => v.id === transfer.vehicle_id);
        if (!vehicle || !vehicle.last_latitude || !vehicle.last_longitude) return null;

        // Calculate estimated arrival time (simplified - based on distance)
        const deliveryDate = transfer.requested_delivery_date;
        const lastUpdate = vehicle.last_location_update ? new Date(vehicle.last_location_update) : new Date();
        
        return {
          id: transfer.id,
          vehicle,
          transfer,
          lat: vehicle.last_latitude,
          lng: vehicle.last_longitude,
          estimatedArrival: deliveryDate,
          lastUpdate,
          destination: transfer.store_name,
          plateNumber: vehicle.plate_number,
        };
      })
      .filter(Boolean);
  }, [transfers, vehicles]);

  // Singapore center coordinates
  const singaporeCenter = [1.3521, 103.8198];

  if (inTransitVehicles.length === 0) {
    return (
      <div className="w-full h-96 bg-slate-50 rounded-lg border border-slate-200 flex flex-col items-center justify-center gap-3 p-4">
        <Truck className="w-8 h-8 text-slate-400" />
        <p className="text-sm text-slate-600 text-center">No vehicles in transit yet</p>
      </div>
    );
  }

  return (
    <div className="w-full rounded-lg border border-slate-200 overflow-hidden shadow-sm">
      <MapContainer
        center={singaporeCenter}
        zoom={12}
        scrollWheelZoom={false}
        className="h-96 w-full"
        style={{ zIndex: 0 }}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        {inTransitVehicles.map(vehicle => (
          <Marker
            key={vehicle.id}
            position={[vehicle.lat, vehicle.lng]}
            icon={vehicleIcon}
          >
            <Popup>
              <div className="w-56 text-xs space-y-2">
                <div>
                  <p className="font-semibold text-slate-900">{vehicle.plateNumber}</p>
                  <p className="text-slate-600">{vehicle.vehicle.vehicle_type}</p>
                </div>
                <div className="pt-2 border-t border-slate-200">
                  <p className="text-slate-700">
                    <span className="font-medium">Destination:</span> {vehicle.destination}
                  </p>
                  <p className="text-slate-600 mt-1">
                    <span className="font-medium">Order:</span> {vehicle.transfer.order_number}
                  </p>
                </div>
                <div className="pt-2 border-t border-slate-200">
                  <p className="text-slate-600">
                    <span className="font-medium">Est. Arrival:</span>{" "}
                    {vehicle.estimatedArrival
                      ? format(new Date(vehicle.estimatedArrival), "MMM d, HH:mm")
                      : "N/A"}
                  </p>
                  <p className="text-slate-500 text-[10px] mt-0.5">
                    Last updated: {format(vehicle.lastUpdate, "HH:mm")}
                  </p>
                </div>
              </div>
            </Popup>
          </Marker>
        ))}
      </MapContainer>

      {/* Vehicle Status Summary */}
      <div className="bg-white p-4 border-t border-slate-200">
        <p className="text-xs font-semibold text-slate-700 mb-3">In Transit Summary</p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {inTransitVehicles.map(vehicle => (
            <div
              key={vehicle.id}
              className="p-3 bg-slate-50 rounded-lg border border-slate-200 text-xs space-y-1"
            >
              <div className="flex items-center justify-between">
                <span className="font-semibold text-slate-900">{vehicle.plateNumber}</span>
                <span className="px-2 py-0.5 bg-blue-100 text-blue-700 rounded text-[10px] font-medium">
                  In Transit
                </span>
              </div>
              <p className="text-slate-600 flex items-center gap-1">
                <MapPin className="w-3 h-3" /> {vehicle.destination}
              </p>
              <p className="text-slate-500">
                Arr: {vehicle.estimatedArrival
                  ? format(new Date(vehicle.estimatedArrival), "MMM d")
                  : "—"}
              </p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}