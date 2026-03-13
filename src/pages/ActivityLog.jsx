import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Search, Clock, User, FileText, Shield } from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import EmptyState from "../components/shared/EmptyState";

const actionTypeLabels = {
  stock_adjustment: "Stock Adjustment",
  transfer_created: "Transfer Created",
  transfer_status_update: "Transfer Status Update",
  transfer_cancelled: "Transfer Cancelled",
  user_invited: "User Invited",
  user_updated: "User Updated",
  product_created: "Product Created",
  product_updated: "Product Updated",
  product_deleted: "Product Deleted",
  inventory_created: "Inventory Created",
  inventory_updated: "Inventory Updated",
  inventory_deleted: "Inventory Deleted",
  store_created: "Store Created",
  store_updated: "Store Updated",
  store_deleted: "Store Deleted",
  vehicle_created: "Vehicle Created",
  vehicle_updated: "Vehicle Updated",
  vehicle_deleted: "Vehicle Deleted",
  po_created: "PO Created",
  po_approved: "PO Approved",
  po_rejected: "PO Rejected",
};

const severityColors = {
  low: "bg-slate-100 text-slate-700",
  medium: "bg-blue-100 text-blue-700",
  high: "bg-orange-100 text-orange-700",
  critical: "bg-red-100 text-red-700",
};

const actionTypeColors = {
  stock_adjustment: "text-amber-700",
  transfer_created: "text-blue-700",
  transfer_status_update: "text-indigo-700",
  transfer_cancelled: "text-red-700",
  user_invited: "text-emerald-700",
  user_updated: "text-teal-700",
  product_created: "text-green-700",
  product_updated: "text-cyan-700",
  product_deleted: "text-red-700",
  inventory_created: "text-violet-700",
  inventory_updated: "text-purple-700",
  inventory_deleted: "text-red-700",
  store_created: "text-blue-700",
  store_updated: "text-sky-700",
  store_deleted: "text-red-700",
  vehicle_created: "text-emerald-700",
  vehicle_updated: "text-teal-700",
  vehicle_deleted: "text-red-700",
  po_created: "text-orange-700",
  po_approved: "text-green-700",
  po_rejected: "text-red-700",
};

export default function ActivityLog() {
  const [search, setSearch] = useState("");
  const [actionTypeFilter, setActionTypeFilter] = useState("all");
  const [severityFilter, setSeverityFilter] = useState("all");

  const { data: logs = [], isLoading } = useQuery({
    queryKey: ["activityLogs"],
    queryFn: () => base44.entities.ActivityLog.list("-created_date", 200),
  });

  const filtered = logs
    .filter(log => actionTypeFilter === "all" || log.action_type === actionTypeFilter)
    .filter(log => severityFilter === "all" || log.severity === severityFilter)
    .filter(log =>
      log.description?.toLowerCase().includes(search.toLowerCase()) ||
      log.performed_by?.toLowerCase().includes(search.toLowerCase()) ||
      log.entity_name?.toLowerCase().includes(search.toLowerCase())
    );

  return (
    <div className="p-4 lg:p-6 max-w-7xl mx-auto space-y-4 w-full">
      {/* Header */}
      <div className="flex flex-col gap-2">
        <div className="flex items-center gap-2">
          <Shield className="w-5 h-5 text-amber-600" />
          <h1 className="text-lg font-bold text-amber-900">Activity Log</h1>
        </div>
        <p className="text-xs text-amber-700">Track all sensitive actions and changes across the system</p>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <Input
            placeholder="Search by description, user, or entity..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <Select value={actionTypeFilter} onValueChange={setActionTypeFilter}>
          <SelectTrigger className="w-full sm:w-48">
            <SelectValue placeholder="Action Type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Actions</SelectItem>
            <SelectItem value="stock_adjustment">Stock Adjustments</SelectItem>
            <SelectItem value="transfer_created">Transfers Created</SelectItem>
            <SelectItem value="transfer_status_update">Transfer Updates</SelectItem>
            <SelectItem value="transfer_cancelled">Transfers Cancelled</SelectItem>
            <SelectItem value="user_invited">User Invitations</SelectItem>
            <SelectItem value="user_updated">User Updates</SelectItem>
            <SelectItem value="product_created">Products Created</SelectItem>
            <SelectItem value="product_updated">Products Updated</SelectItem>
            <SelectItem value="inventory_updated">Inventory Updated</SelectItem>
          </SelectContent>
        </Select>
        <Select value={severityFilter} onValueChange={setSeverityFilter}>
          <SelectTrigger className="w-full sm:w-36">
            <SelectValue placeholder="Severity" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Severity</SelectItem>
            <SelectItem value="low">Low</SelectItem>
            <SelectItem value="medium">Medium</SelectItem>
            <SelectItem value="high">High</SelectItem>
            <SelectItem value="critical">Critical</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-white rounded-lg border border-orange-200 p-3">
          <p className="text-xs text-slate-600">Total Actions</p>
          <p className="text-xl font-bold text-slate-900 mt-1">{logs.length}</p>
        </div>
        <div className="bg-white rounded-lg border border-orange-200 p-3">
          <p className="text-xs text-slate-600">Today</p>
          <p className="text-xl font-bold text-slate-900 mt-1">
            {logs.filter(l => {
              const created = new Date(l.created_date);
              const today = new Date();
              return created.toDateString() === today.toDateString();
            }).length}
          </p>
        </div>
        <div className="bg-white rounded-lg border border-orange-200 p-3">
          <p className="text-xs text-slate-600">High Priority</p>
          <p className="text-xl font-bold text-orange-600 mt-1">
            {logs.filter(l => l.severity === "high" || l.severity === "critical").length}
          </p>
        </div>
        <div className="bg-white rounded-lg border border-orange-200 p-3">
          <p className="text-xs text-slate-600">Unique Users</p>
          <p className="text-xl font-bold text-slate-900 mt-1">
            {new Set(logs.map(l => l.performed_by)).size}
          </p>
        </div>
      </div>

      {/* Activity Table */}
      <div className="bg-white rounded-xl border border-orange-200 overflow-hidden">
        {filtered.length === 0 ? (
          <EmptyState
            icon={FileText}
            title={isLoading ? "Loading..." : "No activity found"}
            description={isLoading ? "Fetching activity logs..." : "No actions match your current filters"}
          />
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="bg-orange-50/80">
                  <TableHead className="font-semibold text-xs">Timestamp</TableHead>
                  <TableHead className="font-semibold text-xs">Action</TableHead>
                  <TableHead className="font-semibold text-xs">Description</TableHead>
                  <TableHead className="font-semibold text-xs">Entity</TableHead>
                  <TableHead className="font-semibold text-xs">User</TableHead>
                  <TableHead className="font-semibold text-xs">Severity</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map(log => (
                  <TableRow key={log.id} className="hover:bg-orange-50/30">
                    <TableCell className="text-xs text-slate-600 font-mono whitespace-nowrap">
                      <div className="flex items-center gap-1.5">
                        <Clock className="w-3.5 h-3.5 text-slate-400" />
                        {format(new Date(log.created_date), "MMM dd, HH:mm")}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant="outline"
                        className={cn("text-xs font-medium border-0", actionTypeColors[log.action_type])}
                      >
                        {actionTypeLabels[log.action_type] || log.action_type}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-sm text-slate-700 max-w-md">
                      {log.description}
                    </TableCell>
                    <TableCell className="text-xs text-slate-600">
                      {log.entity_name || "—"}
                      {log.entity_type && (
                        <div className="text-[10px] text-slate-400 mt-0.5">{log.entity_type}</div>
                      )}
                    </TableCell>
                    <TableCell className="text-xs">
                      <div className="flex items-center gap-1.5">
                        <User className="w-3.5 h-3.5 text-slate-400" />
                        <div>
                          <div className="font-medium text-slate-700">
                            {log.performed_by_name || log.performed_by?.split('@')[0]}
                          </div>
                          <div className="text-[10px] text-slate-400">{log.performed_by}</div>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge className={cn("text-xs", severityColors[log.severity])} variant="secondary">
                        {log.severity}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </div>

      {/* Footer info */}
      <div className="text-xs text-slate-500 text-center">
        Showing {filtered.length} of {logs.length} total activities (last 200 records)
      </div>
    </div>
  );
}