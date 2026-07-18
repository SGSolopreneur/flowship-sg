import React, { useState, useMemo } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Search, Clock, AlertTriangle, Trash2, Tag, CalendarClock } from "lucide-react";
import EmptyState from "../components/shared/EmptyState";
import { useRole } from "../components/shared/useRole";
import { format, differenceInDays } from "date-fns";
import { cn } from "@/lib/utils";

function getExpiryStatus(expiryDate) {
  if (!expiryDate) return { label: "No Date", color: "bg-slate-100 text-slate-500", daysLeft: null, urgent: false };
  const daysLeft = differenceInDays(new Date(expiryDate), new Date());
  if (daysLeft < 0) return { label: "Expired", color: "bg-red-100 text-red-700", daysLeft, urgent: true };
  if (daysLeft <= 3) return { label: "Critical", color: "bg-red-100 text-red-700", daysLeft, urgent: true };
  if (daysLeft <= 7) return { label: "Expiring Soon", color: "bg-amber-100 text-amber-700", daysLeft, urgent: true };
  if (daysLeft <= 14) return { label: "Near", color: "bg-yellow-100 text-yellow-700", daysLeft, urgent: false };
  return { label: "Fresh", color: "bg-emerald-100 text-emerald-700", daysLeft, urgent: false };
}

export default function ExpiryManagement() {
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("urgent");
  const [actionItem, setActionItem] = useState(null);
  const [actionType, setActionType] = useState("write_off");
  const [notes, setNotes] = useState("");
  const queryClient = useQueryClient();
  const { canWrite } = useRole();

  const { data: inventory = [], isLoading } = useQuery({
    queryKey: ["inventory"],
    queryFn: () => base44.entities.InventoryItem.list("-expiry_date", 300),
  });

  const { data: actions = [] } = useQuery({
    queryKey: ["expiryActions"],
    queryFn: () => base44.entities.ExpiryAction.list("-created_date", 100),
  });

  const createActionMutation = useMutation({
    mutationFn: (data) => base44.entities.ExpiryAction.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["expiryActions"] });
      queryClient.invalidateQueries({ queryKey: ["inventory"] });
      setActionItem(null);
      setNotes("");
    },
  });

  const handleAction = () => {
    if (!actionItem) return;
    createActionMutation.mutate({
      inventory_item_id: actionItem.id,
      product_name: actionItem.product_name,
      sku: actionItem.sku,
      location_name: actionItem.location_name,
      expiry_date: actionItem.expiry_date,
      quantity: actionItem.quantity,
      action: actionType,
      notes: notes || undefined,
    });
  };

  const actionedIds = useMemo(() => new Set(actions.map(a => a.inventory_item_id)), [actions]);

  const filtered = useMemo(() => {
    let list = inventory.filter(i => i.expiry_date);
    if (filter === "urgent") {
      list = list.filter(i => getExpiryStatus(i.expiry_date).urgent);
    } else if (filter === "actioned") {
      list = list.filter(i => actionedIds.has(i.id));
    }
    if (search) {
      const q = search.toLowerCase();
      list = list.filter(i =>
        i.product_name?.toLowerCase().includes(q) ||
        i.sku?.toLowerCase().includes(q) ||
        i.location_name?.toLowerCase().includes(q)
      );
    }
    return list.sort((a, b) => new Date(a.expiry_date) - new Date(b.expiry_date));
  }, [inventory, filter, search, actionedIds]);

  const expiredCount = inventory.filter(i => i.expiry_date && getExpiryStatus(i.expiry_date).daysLeft < 0).length;
  const criticalCount = inventory.filter(i => {
    const s = getExpiryStatus(i.expiry_date);
    return s.daysLeft >= 0 && s.daysLeft <= 3;
  }).length;

  return (
    <div className="p-4 lg:p-6 max-w-7xl mx-auto space-y-4 w-full">
      <div className="flex flex-col gap-2">
        <div className="flex items-center gap-2">
          <CalendarClock className="w-5 h-5 text-amber-600" />
          <h1 className="text-lg font-bold text-amber-900">Expiry Management</h1>
        </div>
        <p className="text-xs text-amber-700">Track products nearing shelf-life limits and log disposals or clearances</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-white rounded-lg border border-orange-200 p-3">
          <p className="text-xs text-slate-600">Expired</p>
          <p className="text-xl font-bold text-red-600 mt-1">{expiredCount}</p>
        </div>
        <div className="bg-white rounded-lg border border-orange-200 p-3">
          <p className="text-xs text-slate-600">Critical (≤3 days)</p>
          <p className="text-xl font-bold text-amber-600 mt-1">{criticalCount}</p>
        </div>
        <div className="bg-white rounded-lg border border-orange-200 p-3">
          <p className="text-xs text-slate-600">Tracked Items</p>
          <p className="text-xl font-bold text-slate-900 mt-1">{inventory.filter(i => i.expiry_date).length}</p>
        </div>
        <div className="bg-white rounded-lg border border-orange-200 p-3">
          <p className="text-xs text-slate-600">Actions Logged</p>
          <p className="text-xl font-bold text-emerald-600 mt-1">{actions.length}</p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <Input
            placeholder="Search by product, SKU, or location..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <div className="flex gap-1 bg-orange-50 rounded-lg p-1 border border-orange-200">
          {[
            { key: "urgent", label: "Urgent" },
            { key: "all", label: "All Tracked" },
            { key: "actioned", label: "Actioned" },
          ].map(tab => (
            <button
              key={tab.key}
              onClick={() => setFilter(tab.key)}
              className={cn(
                "px-3 py-1.5 rounded-md text-xs font-medium transition-colors",
                filter === tab.key ? "bg-white text-amber-700 shadow-sm" : "text-amber-600 hover:text-amber-800"
              )}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-orange-200 overflow-hidden">
        {filtered.length === 0 ? (
          <EmptyState
            icon={Clock}
            title={isLoading ? "Loading..." : "No items found"}
            description={isLoading ? "Fetching inventory..." : "No inventory items match your filters"}
          />
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="bg-orange-50/80">
                  <TableHead className="font-semibold text-xs">Product</TableHead>
                  <TableHead className="font-semibold text-xs">Location</TableHead>
                  <TableHead className="font-semibold text-xs text-right">Qty</TableHead>
                  <TableHead className="font-semibold text-xs">Expiry Date</TableHead>
                  <TableHead className="font-semibold text-xs">Status</TableHead>
                  <TableHead className="font-semibold text-xs text-right">Days Left</TableHead>
                  {canWrite && <TableHead className="font-semibold text-xs text-right">Actions</TableHead>}
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map(item => {
                  const status = getExpiryStatus(item.expiry_date);
                  const isActioned = actionedIds.has(item.id);
                  return (
                    <TableRow key={item.id} className={cn("hover:bg-orange-50/30", status.urgent && !isActioned && "bg-red-50/20")}>
                      <TableCell>
                        <div className="text-sm font-medium text-slate-800">{item.product_name}</div>
                        <div className="text-[10px] text-slate-400 font-mono">{item.sku || "—"}</div>
                      </TableCell>
                      <TableCell className="text-xs text-slate-600">
                        <div>{item.location_name || "—"}</div>
                        <div className="text-[10px] text-slate-400 capitalize">{item.location_type}</div>
                      </TableCell>
                      <TableCell className="text-right text-sm text-slate-700">{item.quantity}</TableCell>
                      <TableCell className="text-xs text-slate-600">
                        {item.expiry_date ? format(new Date(item.expiry_date), "MMM dd, yyyy") : "—"}
                      </TableCell>
                      <TableCell>
                        <Badge className={cn("text-xs", status.color)} variant="secondary">
                          {status.label}
                        </Badge>
                        {isActioned && <Badge variant="outline" className="text-xs ml-1 text-emerald-600 border-emerald-300">Actioned</Badge>}
                      </TableCell>
                      <TableCell className="text-right text-xs font-medium">
                        {status.daysLeft != null ? (
                          <span className={status.daysLeft < 0 ? "text-red-600" : status.daysLeft <= 3 ? "text-amber-600" : "text-slate-600"}>
                            {status.daysLeft < 0 ? `${Math.abs(status.daysLeft)}d ago` : `${status.daysLeft}d`}
                          </span>
                        ) : "—"}
                      </TableCell>
                      {canWrite && (
                        <TableCell className="text-right">
                          {!isActioned && (
                            <div className="flex gap-1 justify-end">
                              <Button
                                size="sm"
                                variant="outline"
                                className="h-7 text-xs border-red-300 text-red-600 hover:bg-red-50"
                                onClick={() => { setActionItem(item); setActionType("write_off"); setNotes(""); }}
                              >
                                <Trash2 className="w-3.5 h-3.5" /> Write Off
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                className="h-7 text-xs border-blue-300 text-blue-600 hover:bg-blue-50"
                                onClick={() => { setActionItem(item); setActionType("promotional_clearing"); setNotes(""); }}
                              >
                                <Tag className="w-3.5 h-3.5" /> Clearance
                              </Button>
                            </div>
                          )}
                        </TableCell>
                      )}
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        )}
      </div>

      {/* Action Dialog */}
      <Dialog open={!!actionItem} onOpenChange={(open) => !open && setActionItem(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {actionType === "write_off" ? (
                <><Trash2 className="w-5 h-5 text-red-600" /> Log Disposal / Write-Off</>
              ) : (
                <><Tag className="w-5 h-5 text-blue-600" /> Mark for Promotional Clearance</>
              )}
            </DialogTitle>
          </DialogHeader>
          {actionItem && (
            <div className="space-y-3">
              <div className="bg-orange-50 rounded-lg p-3 space-y-1">
                <p className="text-sm font-semibold text-slate-800">{actionItem.product_name}</p>
                <p className="text-xs text-slate-500">
                  {actionItem.quantity} units · Expires {actionItem.expiry_date ? format(new Date(actionItem.expiry_date), "MMM dd, yyyy") : "—"}
                </p>
                <p className="text-xs text-slate-500">Location: {actionItem.location_name || "—"}</p>
              </div>
              <div>
                <label className="text-xs font-medium text-slate-600 mb-1 block">Notes (optional)</label>
                <Textarea
                  placeholder={actionType === "write_off" ? "Reason for disposal..." : "Clearance pricing or promo details..."}
                  value={notes}
                  onChange={e => setNotes(e.target.value)}
                  rows={3}
                />
              </div>
              {actionType === "write_off" && (
                <div className="flex items-start gap-2 text-xs text-amber-700 bg-amber-50 rounded-lg p-2">
                  <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
                  <span>This will log the disposal of {actionItem.quantity} units. The inventory record will remain for audit purposes.</span>
                </div>
              )}
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setActionItem(null)}>Cancel</Button>
            <Button
              onClick={handleAction}
              disabled={createActionMutation.isPending}
              className={actionType === "write_off" ? "bg-red-600 hover:bg-red-700" : "bg-blue-600 hover:bg-blue-700"}
            >
              Confirm
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}