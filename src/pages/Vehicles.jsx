import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Plus, Search, Truck, MoreHorizontal, Trash2, Wrench, Phone, Mail, ChevronDown, AlertTriangle } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import StatusBadge from "../components/shared/StatusBadge";
import EmptyState from "../components/shared/EmptyState";
import { useRole } from "../components/shared/useRole";
import VehicleFormDialog from "../components/vehicles/VehicleFormDialog";
import MaintenanceFormDialog from "../components/vehicles/MaintenanceFormDialog";
import MaintenanceHistory from "../components/vehicles/MaintenanceHistory";
import { cn } from "@/lib/utils";
import { format, isPast } from "date-fns";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";

const statusColors = {
  active: "bg-emerald-100 text-emerald-700",
  maintenance: "bg-amber-100 text-amber-700",
  unavailable: "bg-red-100 text-red-700",
};

export default function Vehicles() {
  const [search, setSearch] = useState("");
  const [formOpen, setFormOpen] = useState(false);
  const [selectedVehicle, setSelectedVehicle] = useState(null);
  const [maintenanceOpen, setMaintenanceOpen] = useState(false);
  const [expandedVehicle, setExpandedVehicle] = useState(null);
  const queryClient = useQueryClient();
  const { canWrite, user: currentUser } = useRole();

  const { data: vehicles = [] } = useQuery({
    queryKey: ["vehicles"],
    queryFn: () => base44.entities.Vehicle.list("-created_date"),
  });

  const { data: maintenanceRecords = [] } = useQuery({
    queryKey: ["maintenanceRecords"],
    queryFn: () => base44.entities.MaintenanceRecord.list("-service_date"),
  });

  const createMutation = useMutation({
    mutationFn: (data) => base44.entities.Vehicle.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["vehicles"] });
      setFormOpen(false);
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.Vehicle.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["vehicles"] });
      setFormOpen(false);
      setSelectedVehicle(null);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.Vehicle.delete(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["vehicles"] }),
  });

  const createMaintenanceMutation = useMutation({
    mutationFn: (data) => base44.entities.MaintenanceRecord.create({
      ...data,
      logged_by: currentUser?.email,
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["maintenanceRecords"] });
      setMaintenanceOpen(false);
      setSelectedVehicle(null);
    },
  });

  const handleSave = (formData) => {
    if (selectedVehicle) {
      updateMutation.mutate({ id: selectedVehicle.id, data: formData });
    } else {
      createMutation.mutate(formData);
    }
  };

  const handleEdit = (vehicle) => {
    setSelectedVehicle(vehicle);
    setFormOpen(true);
  };

  const handleOpenForm = () => {
    setSelectedVehicle(null);
    setFormOpen(true);
  };

  const handleLogMaintenance = (vehicle) => {
    setSelectedVehicle(vehicle);
    setMaintenanceOpen(true);
  };

  const getVehicleMaintenanceRecords = (vehicleId) => {
    return maintenanceRecords.filter(m => m.vehicle_id === vehicleId);
  };

  const hasOverdueMaintenance = (vehicleId) => {
    const records = getVehicleMaintenanceRecords(vehicleId);
    return records.some(r => r.next_service_due && isPast(new Date(r.next_service_due)));
  };

  const filtered = vehicles.filter(v =>
    v.plate_number?.toLowerCase().includes(search.toLowerCase()) ||
    v.driver_name?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="p-4 lg:p-6 max-w-7xl mx-auto space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-lg font-bold text-slate-800">Vehicles</h1>
          <p className="text-xs text-slate-500 mt-0.5">Manage vehicles and driver assignments</p>
        </div>
        {canWrite && (
          <Button onClick={handleOpenForm} className="bg-emerald-600 hover:bg-emerald-700 gap-2">
            <Plus className="w-4 h-4" /> Add Vehicle
          </Button>
        )}
      </div>

      {/* Search */}
      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
        <Input
          placeholder="Search by plate or driver..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-9"
        />
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-slate-200/80 overflow-hidden">
        {filtered.length === 0 ? (
          <EmptyState
            icon={Truck}
            title="No vehicles"
            description="Add your first vehicle to get started"
            actionLabel="Add Vehicle"
            onAction={handleOpenForm}
          />
        ) : (
          <div className="space-y-2">
            {filtered.map((vehicle) => {
              const records = getVehicleMaintenanceRecords(vehicle.id);
              const isOverdue = hasOverdueMaintenance(vehicle.id);
              const isExpanded = expandedVehicle === vehicle.id;

              return (
                <Collapsible key={vehicle.id} open={isExpanded} onOpenChange={(open) => setExpandedVehicle(open ? vehicle.id : null)}>
                  <div className="border border-slate-200/80 rounded-lg overflow-hidden">
                    <CollapsibleTrigger asChild>
                      <div className="w-full px-4 py-3 bg-white hover:bg-slate-50 cursor-pointer flex items-center justify-between">
                        <div className="flex items-center gap-3 flex-1 min-w-0">
                          <ChevronDown className={cn("w-4 h-4 text-slate-400 transition-transform flex-shrink-0", isExpanded && "rotate-180")} />
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-2">
                              <span className="font-semibold text-sm font-mono text-slate-800">{vehicle.plate_number}</span>
                              {isOverdue && (
                                <AlertTriangle className="w-4 h-4 text-red-600 flex-shrink-0" title="Overdue maintenance" />
                              )}
                            </div>
                            <div className="text-xs text-slate-600 mt-1">
                              {vehicle.driver_name && <span>{vehicle.driver_name} • </span>}
                              <span className="capitalize">{vehicle.vehicle_type}</span>
                              <span className="text-slate-500"> • {vehicle.weight_capacity_kg} kg / {vehicle.volume_capacity_m3} m³</span>
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-2 flex-shrink-0 ml-2">
                          <Badge className={cn("text-xs", statusColors[vehicle.status])} variant="secondary">
                            {vehicle.status === "active" && "✓"}
                            {vehicle.status === "maintenance" && <Wrench className="w-3 h-3 inline mr-1" />}
                            {vehicle.status === "unavailable" && "✕"}
                            {vehicle.status.replace(/_/g, " ").replace(/\b\w/g, (l) => l.toUpperCase())}
                          </Badge>
                          {canWrite && (
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                                <Button variant="ghost" size="icon" className="h-7 w-7">
                                  <MoreHorizontal className="w-4 h-4 text-slate-500" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem onClick={(e) => { e.stopPropagation(); handleEdit(vehicle); }}>
                                  Edit Vehicle
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={(e) => { e.stopPropagation(); handleLogMaintenance(vehicle); }}>
                                  <Wrench className="w-3.5 h-3.5 mr-1.5" /> Log Maintenance
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={(e) => { e.stopPropagation(); deleteMutation.mutate(vehicle.id); }} className="text-red-600">
                                  <Trash2 className="w-3.5 h-3.5 mr-1.5" /> Delete
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          )}
                        </div>
                      </div>
                    </CollapsibleTrigger>

                    <CollapsibleContent className="border-t border-slate-200/80 bg-slate-50/50 p-4">
                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <h4 className="text-xs font-semibold text-slate-800">Maintenance History</h4>
                          {canWrite && (
                            <Button size="sm" variant="outline" onClick={() => handleLogMaintenance(vehicle)} className="h-7 text-xs">
                              <Plus className="w-3 h-3 mr-1" /> Log Service
                            </Button>
                          )}
                        </div>
                        <div className="bg-white rounded-lg border border-slate-200/80 overflow-hidden">
                          <MaintenanceHistory records={records} />
                        </div>
                      </div>
                    </CollapsibleContent>
                  </div>
                </Collapsible>
              );
            })}
          </div>
        )}
      </div>

      {/* Dialogs */}
      <VehicleFormDialog
        open={formOpen}
        onOpenChange={setFormOpen}
        vehicle={selectedVehicle}
        onSave={handleSave}
        saving={createMutation.isPending || updateMutation.isPending}
      />

      <MaintenanceFormDialog
        open={maintenanceOpen}
        onOpenChange={setMaintenanceOpen}
        vehicle={selectedVehicle}
        onSave={(data) => createMaintenanceMutation.mutate(data)}
        saving={createMaintenanceMutation.isPending}
      />
    </div>
  );
}