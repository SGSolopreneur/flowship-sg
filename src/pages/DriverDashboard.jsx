import React, { useState, useMemo } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AlertCircle, MapPin, CheckCircle2 } from "lucide-react";
import { format } from "date-fns";
import TransferTaskCard from "../components/drivers/TransferTaskCard";
import EmptyState from "../components/shared/EmptyState";

export default function DriverDashboard() {
  const [selectedStatus, setSelectedStatus] = useState("active");
  const queryClient = useQueryClient();
  const [updatingTask, setUpdatingTask] = useState(null);
  const [confirmingTask, setConfirmingTask] = useState(null);

  const { data: currentUser } = useQuery({
    queryKey: ["currentUser"],
    queryFn: async () => {
      try {
        return await base44.auth.me();
      } catch {
        return null;
      }
    },
  });

  const { data: transfers = [] } = useQuery({
    queryKey: ["transfers"],
    queryFn: () => base44.entities.TransferOrder.list("-created_date"),
  });

  const { data: vehicles = [] } = useQuery({
    queryKey: ["vehicles"],
    queryFn: () => base44.entities.Vehicle.list(),
  });

  const updateLocationMutation = useMutation({
    mutationFn: ({ vehicleId, latitude, longitude }) =>
      base44.entities.Vehicle.update(vehicleId, {
        last_latitude: latitude,
        last_longitude: longitude,
        last_location_update: new Date().toISOString(),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["vehicles"] });
      setUpdatingTask(null);
    },
  });

  const confirmDeliveryMutation = useMutation({
    mutationFn: ({ transferId }) =>
      base44.entities.TransferOrder.update(transferId, {
        status: "delivered",
        actual_delivery_date: format(new Date(), "yyyy-MM-dd"),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["transfers"] });
      setConfirmingTask(null);
    },
  });

  const driverName = currentUser?.full_name;

  const assignedTransfers = useMemo(() => {
    if (!driverName) return [];
    return transfers.filter(
      (t) =>
        t.driver_name?.toLowerCase() === driverName.toLowerCase() ||
        t.driver_name?.toLowerCase().includes(driverName.toLowerCase())
    );
  }, [transfers, driverName]);

  const activeTransfers = assignedTransfers.filter((t) => !["delivered", "cancelled"].includes(t.status));
  const completedTransfers = assignedTransfers.filter((t) => t.status === "delivered");

  const handleUpdateLocation = (transferId, vehicleId, coords) => {
    setUpdatingTask(transferId);
    updateLocationMutation.mutate({
      vehicleId,
      ...coords,
    });
  };

  const handleConfirmDelivery = (transferId) => {
    setConfirmingTask(transferId);
    confirmDeliveryMutation.mutate({ transferId });
  };

  if (!driverName) {
    return (
      <div className="p-4 lg:p-6 max-w-4xl mx-auto">
        <EmptyState
          icon={AlertCircle}
          title="Profile incomplete"
          description="Unable to load your driver profile. Please contact support."
        />
      </div>
    );
  }

  return (
    <div className="p-4 lg:p-6 max-w-4xl mx-auto space-y-4">
      {/* Header */}
      <div>
        <h1 className="text-lg font-bold text-slate-800">My Deliveries</h1>
        <p className="text-xs text-slate-500 mt-0.5">Driver: {driverName}</p>
      </div>

      {/* Tabs */}
      <Tabs value={selectedStatus} onValueChange={setSelectedStatus} className="space-y-4">
        <TabsList className="bg-slate-100">
          <TabsTrigger value="active" className="gap-2 text-xs">
            <MapPin className="w-3.5 h-3.5" />
            Active ({activeTransfers.length})
          </TabsTrigger>
          <TabsTrigger value="completed" className="gap-2 text-xs">
            <CheckCircle2 className="w-3.5 h-3.5" />
            Completed ({completedTransfers.length})
          </TabsTrigger>
        </TabsList>

        {/* Active Transfers */}
        <TabsContent value="active" className="space-y-3">
          {activeTransfers.length === 0 ? (
            <EmptyState
              icon={MapPin}
              title="No active deliveries"
              description="You have no deliveries scheduled for today"
            />
          ) : (
            activeTransfers.map((transfer) => {
              const vehicle = vehicles.find((v) => v.id === transfer.vehicle_id);
              return (
                <TransferTaskCard
                  key={transfer.id}
                  transfer={transfer}
                  onUpdateLocation={(coords) =>
                    handleUpdateLocation(transfer.id, vehicle?.id, coords)
                  }
                  onConfirmDelivery={() => handleConfirmDelivery(transfer.id)}
                  updating={updatingTask === transfer.id}
                  confirming={confirmingTask === transfer.id}
                />
              );
            })
          )}
        </TabsContent>

        {/* Completed Transfers */}
        <TabsContent value="completed" className="space-y-3">
          {completedTransfers.length === 0 ? (
            <EmptyState
              icon={CheckCircle2}
              title="No completed deliveries"
              description="Your completed deliveries will appear here"
            />
          ) : (
            completedTransfers.map((transfer) => {
              const vehicle = vehicles.find((v) => v.id === transfer.vehicle_id);
              return (
                <TransferTaskCard
                  key={transfer.id}
                  transfer={transfer}
                  onUpdateLocation={(coords) =>
                    handleUpdateLocation(transfer.id, vehicle?.id, coords)
                  }
                  onConfirmDelivery={() => handleConfirmDelivery(transfer.id)}
                  updating={updatingTask === transfer.id}
                  confirming={confirmingTask === transfer.id}
                />
              );
            })
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}