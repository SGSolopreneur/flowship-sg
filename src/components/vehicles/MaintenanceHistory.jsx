import React from "react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { format, isPast, isBefore } from "date-fns";
import { AlertTriangle, Wrench } from "lucide-react";
import { cn } from "@/lib/utils";

const maintenanceTypeLabels = {
  oil_change: "Oil Change",
  tire_replacement: "Tire Replacement",
  inspection: "Inspection",
  repair: "Repair",
  battery: "Battery",
  brake_service: "Brake Service",
  filter_replacement: "Filter Replacement",
  other: "Other",
};

export default function MaintenanceHistory({ records = [] }) {
  if (records.length === 0) {
    return (
      <div className="text-center py-8">
        <Wrench className="w-8 h-8 text-slate-300 mx-auto mb-2" />
        <p className="text-sm text-slate-500">No maintenance records yet</p>
      </div>
    );
  }

  const sortedRecords = [...records].sort((a, b) => new Date(b.service_date) - new Date(a.service_date));

  return (
    <div className="overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow className="bg-slate-50/80">
            <TableHead className="font-semibold text-xs">Date</TableHead>
            <TableHead className="font-semibold text-xs">Type</TableHead>
            <TableHead className="font-semibold text-xs">Description</TableHead>
            <TableHead className="font-semibold text-xs">Cost</TableHead>
            <TableHead className="font-semibold text-xs">Mileage</TableHead>
            <TableHead className="font-semibold text-xs">Next Service</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {sortedRecords.map((record) => {
            const nextServiceDue = record.next_service_due ? new Date(record.next_service_due) : null;
            const isOverdue = nextServiceDue && isPast(nextServiceDue);
            const isDue = nextServiceDue && !isOverdue && isBefore(nextServiceDue, new Date(new Date().getTime() + 7 * 24 * 60 * 60 * 1000));

            return (
              <TableRow
                key={record.id}
                className={cn("hover:bg-slate-50/50", isOverdue && "bg-red-50")}
              >
                <TableCell className="text-sm font-medium">
                  {format(new Date(record.service_date), "dd MMM yyyy")}
                </TableCell>
                <TableCell className="text-xs">
                  <Badge variant="secondary" className="bg-blue-100 text-blue-700">
                    {maintenanceTypeLabels[record.maintenance_type] || record.maintenance_type}
                  </Badge>
                </TableCell>
                <TableCell className="text-sm text-slate-600">
                  <div>
                    <p className="line-clamp-1">{record.description || "—"}</p>
                    {record.service_provider && <p className="text-xs text-slate-500">{record.service_provider}</p>}
                  </div>
                </TableCell>
                <TableCell className="text-sm">
                  {record.cost ? `$${record.cost.toFixed(2)}` : "—"}
                </TableCell>
                <TableCell className="text-sm text-slate-600">
                  {record.mileage_km ? `${record.mileage_km.toLocaleString()} km` : "—"}
                </TableCell>
                <TableCell className="text-xs">
                  {nextServiceDue ? (
                    <div className="flex items-center gap-1.5">
                      {isOverdue && <AlertTriangle className="w-3.5 h-3.5 text-red-600" />}
                      {isDue && !isOverdue && <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />}
                      <span className={cn(isOverdue ? "text-red-600 font-semibold" : isDue ? "text-amber-600 font-semibold" : "text-slate-600")}>
                        {format(nextServiceDue, "dd MMM")}
                      </span>
                      {isOverdue && <span className="text-[10px] text-red-600">OVERDUE</span>}
                      {isDue && !isOverdue && <span className="text-[10px] text-amber-600">DUE SOON</span>}
                    </div>
                  ) : (
                    "—"
                  )}
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
}