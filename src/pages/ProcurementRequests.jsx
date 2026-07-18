import React, { useState, useMemo } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Search, ClipboardCheck, CheckCircle2, XCircle, AlertTriangle, Package } from "lucide-react";
import EmptyState from "../components/shared/EmptyState";
import { useRole } from "../components/shared/useRole";
import { format } from "date-fns";

const statusColors = {
  pending_approval: "bg-amber-100 text-amber-700",
  submitted: "bg-blue-100 text-blue-700",
  approved: "bg-emerald-100 text-emerald-700",
  rejected: "bg-red-100 text-red-700",
  draft: "bg-slate-100 text-slate-500",
  ordered: "bg-indigo-100 text-indigo-700",
  received: "bg-emerald-100 text-emerald-700",
  cancelled: "bg-slate-100 text-slate-500",
};

export default function ProcurementRequests() {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("pending");
  const [actionPO, setActionPO] = useState(null);
  const [actionType, setActionType] = useState("approve");
  const [reason, setReason] = useState("");
  const queryClient = useQueryClient();
  const { canAccessSensitive } = useRole();

  const { data: pos = [], isLoading } = useQuery({
    queryKey: ["purchaseOrders"],
    queryFn: () => base44.entities.PurchaseOrder.list("-created_date", 200),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.PurchaseOrder.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["purchaseOrders"] });
      setActionPO(null);
      setReason("");
    },
  });

  const handleAction = () => {
    if (!actionPO) return;
    const now = new Date().toISOString();
    if (actionType === "approve") {
      updateMutation.mutate({
        id: actionPO.id,
        data: { status: "approved", approved_at: now, rejection_reason: "" },
      });
    } else {
      updateMutation.mutate({
        id: actionPO.id,
        data: { status: "rejected", approved_at: now, rejection_reason: reason || "Rejected by manager" },
      });
    }
  };

  const filtered = useMemo(() => {
    let list = pos;
    if (statusFilter === "pending") {
      list = list.filter(po => ["pending_approval", "submitted"].includes(po.status));
    } else if (statusFilter === "decided") {
      list = list.filter(po => ["approved", "rejected"].includes(po.status));
    }
    if (search) {
      const q = search.toLowerCase();
      list = list.filter(po =>
        po.po_number?.toLowerCase().includes(q) ||
        (po.items || []).some(i => i.product_name?.toLowerCase().includes(q) || i.supplier?.toLowerCase().includes(q))
      );
    }
    return list;
  }, [pos, statusFilter, search]);

  const pendingCount = pos.filter(po => ["pending_approval", "submitted"].includes(po.status)).length;

  return (
    <div className="p-4 lg:p-6 max-w-7xl mx-auto space-y-4 w-full">
      <div className="flex flex-col gap-2">
        <div className="flex items-center gap-2">
          <ClipboardCheck className="w-5 h-5 text-amber-600" />
          <h1 className="text-lg font-bold text-amber-900">Procurement Requests</h1>
        </div>
        <p className="text-xs text-amber-700">Review and approve or reject pending purchase orders from suppliers</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        <div className="bg-white rounded-lg border border-orange-200 p-3">
          <p className="text-xs text-slate-600">Pending Approval</p>
          <p className="text-xl font-bold text-amber-600 mt-1">{pendingCount}</p>
        </div>
        <div className="bg-white rounded-lg border border-orange-200 p-3">
          <p className="text-xs text-slate-600">Total Orders</p>
          <p className="text-xl font-bold text-slate-900 mt-1">{pos.length}</p>
        </div>
        <div className="bg-white rounded-lg border border-orange-200 p-3">
          <p className="text-xs text-slate-600">Pending Value (SGD)</p>
          <p className="text-xl font-bold text-emerald-600 mt-1">
            {pos.filter(po => ["pending_approval", "submitted"].includes(po.status))
              .reduce((s, po) => s + (po.total_value || 0), 0).toFixed(0)}
          </p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <Input
            placeholder="Search by PO number, product, or supplier..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <div className="flex gap-1 bg-orange-50 rounded-lg p-1 border border-orange-200">
          {[
            { key: "pending", label: "Pending" },
            { key: "decided", label: "Decided" },
            { key: "all", label: "All" },
          ].map(tab => (
            <button
              key={tab.key}
              onClick={() => setStatusFilter(tab.key)}
              className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
                statusFilter === tab.key ? "bg-white text-amber-700 shadow-sm" : "text-amber-600 hover:text-amber-800"
              }`}
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
            icon={Package}
            title={isLoading ? "Loading..." : "No procurement requests"}
            description={isLoading ? "Fetching purchase orders..." : "No purchase orders match your filters"}
          />
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="bg-orange-50/80">
                  <TableHead className="font-semibold text-xs">PO Number</TableHead>
                  <TableHead className="font-semibold text-xs">Items</TableHead>
                  <TableHead className="font-semibold text-xs">Source</TableHead>
                  <TableHead className="font-semibold text-xs text-right">Value (SGD)</TableHead>
                  <TableHead className="font-semibold text-xs">Status</TableHead>
                  <TableHead className="font-semibold text-xs">Created</TableHead>
                  {canAccessSensitive && <TableHead className="font-semibold text-xs text-right">Actions</TableHead>}
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map(po => {
                  const totalQty = (po.items || []).reduce((s, i) => s + (i.quantity || 0), 0);
                  const suppliers = [...new Set((po.items || []).map(i => i.supplier).filter(Boolean))];
                  const isPending = ["pending_approval", "submitted"].includes(po.status);
                  return (
                    <TableRow key={po.id} className="hover:bg-orange-50/30">
                      <TableCell className="text-xs font-mono text-slate-700 font-medium">{po.po_number}</TableCell>
                      <TableCell className="text-xs text-slate-600">
                        <div className="font-medium">{(po.items || []).length} line items</div>
                        <div className="text-[10px] text-slate-400">{totalQty} units total</div>
                      </TableCell>
                      <TableCell className="text-xs text-slate-600">
                        {po.source === "auto_reorder" ? (
                          <Badge variant="outline" className="text-[10px] border-blue-300 text-blue-600">Auto Reorder</Badge>
                        ) : (
                          <Badge variant="outline" className="text-[10px]">Manual</Badge>
                        )}
                        {suppliers.length > 0 && (
                          <div className="text-[10px] text-slate-400 mt-0.5">{suppliers.join(", ").slice(0, 30)}{suppliers.join(", ").length > 30 ? "..." : ""}</div>
                        )}
                      </TableCell>
                      <TableCell className="text-right text-sm font-medium text-slate-700">
                        {po.total_value != null ? `$${po.total_value.toFixed(2)}` : "—"}
                      </TableCell>
                      <TableCell>
                        <Badge className={`text-xs ${statusColors[po.status] || "bg-slate-100 text-slate-500"}`} variant="secondary">
                          {po.status?.replace("_", " ")}
                        </Badge>
                        {po.flagged && (
                          <div className="flex items-center gap-0.5 text-[10px] text-amber-600 mt-0.5">
                            <AlertTriangle className="w-3 h-3" /> Flagged
                          </div>
                        )}
                      </TableCell>
                      <TableCell className="text-xs text-slate-500">
                        {po.created_date ? format(new Date(po.created_date), "MMM dd, HH:mm") : "—"}
                      </TableCell>
                      {canAccessSensitive && (
                        <TableCell className="text-right">
                          {isPending ? (
                            <div className="flex gap-1 justify-end">
                              <Button
                                size="sm"
                                variant="outline"
                                className="h-7 text-xs border-emerald-300 text-emerald-600 hover:bg-emerald-50"
                                onClick={() => { setActionPO(po); setActionType("approve"); setReason(""); }}
                              >
                                <CheckCircle2 className="w-3.5 h-3.5" /> Approve
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                className="h-7 text-xs border-red-300 text-red-600 hover:bg-red-50"
                                onClick={() => { setActionPO(po); setActionType("reject"); setReason(""); }}
                              >
                                <XCircle className="w-3.5 h-3.5" /> Reject
                              </Button>
                            </div>
                          ) : (
                            <span className="text-[10px] text-slate-400">{po.approved_at ? format(new Date(po.approved_at), "MMM dd") : "—"}</span>
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

      {/* Approve/Reject Dialog */}
      <Dialog open={!!actionPO} onOpenChange={(open) => !open && setActionPO(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {actionType === "approve" ? (
                <><CheckCircle2 className="w-5 h-5 text-emerald-600" /> Approve Purchase Order</>
              ) : (
                <><XCircle className="w-5 h-5 text-red-600" /> Reject Purchase Order</>
              )}
            </DialogTitle>
          </DialogHeader>
          {actionPO && (
            <div className="space-y-3">
              <div className="bg-orange-50 rounded-lg p-3 space-y-1">
                <p className="text-sm font-semibold text-slate-800">{actionPO.po_number}</p>
                <p className="text-xs text-slate-500">
                  {(actionPO.items || []).length} items · SGD {(actionPO.total_value || 0).toFixed(2)}
                </p>
              </div>
              {actionType === "reject" && (
                <div>
                  <label className="text-xs font-medium text-slate-600 mb-1 block">Rejection Reason</label>
                  <Textarea
                    placeholder="Provide a reason for rejection..."
                    value={reason}
                    onChange={e => setReason(e.target.value)}
                    rows={3}
                  />
                </div>
              )}
              {actionType === "approve" && (
                <p className="text-xs text-slate-500">
                  The requester will be notified once you approve this purchase order.
                </p>
              )}
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setActionPO(null)}>Cancel</Button>
            <Button
              onClick={handleAction}
              disabled={updateMutation.isPending}
              className={actionType === "approve" ? "bg-emerald-600 hover:bg-emerald-700" : "bg-red-600 hover:bg-red-700"}
            >
              {actionType === "approve" ? "Confirm Approval" : "Confirm Rejection"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}