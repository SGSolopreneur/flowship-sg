import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Plus, Search, Truck, MoreHorizontal, ArrowRight, Trash2, ClipboardList } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import StatusBadge from "../components/shared/StatusBadge";
import EmptyState from "../components/shared/EmptyState";
import TransferFormDialog from "../components/transfers/TransferFormDialog";
import StockRequestFormDialog from "../components/transfers/StockRequestFormDialog";
import ApprovalPanel from "../components/transfers/ApprovalPanel";

const statusFlow = ["draft", "confirmed", "picking", "dispatched", "in_transit", "delivered"];

export default function Transfers() {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [requestDialogOpen, setRequestDialogOpen] = useState(false);
  const queryClient = useQueryClient();

  const { data: currentUser } = useQuery({ queryKey: ["me"], queryFn: () => base44.auth.me() });

  const { data: stockRequests = [] } = useQuery({
    queryKey: ["stockRequests"],
    queryFn: () => base44.entities.StockRequest.list("-created_date"),
  });

  const { data: transfers = [] } = useQuery({
    queryKey: ["transfers"],
    queryFn: () => base44.entities.TransferOrder.list("-created_date"),
  });
  const { data: stores = [] } = useQuery({
    queryKey: ["stores"],
    queryFn: () => base44.entities.Store.list(),
  });
  const { data: products = [] } = useQuery({
    queryKey: ["products"],
    queryFn: () => base44.entities.Product.list(),
  });

  const createMutation = useMutation({
    mutationFn: (data) => base44.entities.TransferOrder.create(data),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["transfers"] }); setDialogOpen(false); },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.TransferOrder.update(id, data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["transfers"] }),
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.TransferOrder.delete(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["transfers"] }),
  });

  const createRequestMutation = useMutation({
    mutationFn: (data) => base44.entities.StockRequest.create({ ...data, requested_by: currentUser?.email }),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["stockRequests"] }); setRequestDialogOpen(false); },
  });

  const updateRequestMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.StockRequest.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["stockRequests"] });
      queryClient.invalidateQueries({ queryKey: ["transfers"] });
    },
  });

  const handleApprove = async (request, reviewNotes) => {
    // Create a transfer order from the approved request
    const orderNumber = `TO-${Date.now().toString().slice(-6)}`;
    const newTransfer = await base44.entities.TransferOrder.create({
      order_number: orderNumber,
      store_id: request.store_id,
      store_name: request.store_name,
      status: "confirmed",
      priority: request.priority,
      items: request.items,
      requested_delivery_date: request.requested_delivery_date,
      notes: `Auto-created from stock request ${request.request_number}`,
      total_items_count: request.items?.length || 0,
    });
    updateRequestMutation.mutate({
      id: request.id,
      data: {
        status: "approved",
        reviewed_by: currentUser?.email,
        review_notes: reviewNotes,
        reviewed_at: new Date().toISOString(),
        transfer_order_id: newTransfer.id,
      },
    });
  };

  const handleReject = (request, reviewNotes) => {
    updateRequestMutation.mutate({
      id: request.id,
      data: {
        status: "rejected",
        reviewed_by: currentUser?.email,
        review_notes: reviewNotes,
        reviewed_at: new Date().toISOString(),
      },
    });
  };

  const advanceStatus = (order) => {
    const currentIdx = statusFlow.indexOf(order.status);
    if (currentIdx < statusFlow.length - 1) {
      const nextStatus = statusFlow[currentIdx + 1];
      const updates = { status: nextStatus };
      if (nextStatus === "dispatched") updates.dispatch_date = new Date().toISOString().split("T")[0];
      if (nextStatus === "delivered") updates.actual_delivery_date = new Date().toISOString().split("T")[0];
      updateMutation.mutate({ id: order.id, data: updates });
    }
  };

  const cancelOrder = (order) => {
    updateMutation.mutate({ id: order.id, data: { status: "cancelled" } });
  };

  const filtered = transfers
    .filter(t => statusFilter === "all" || t.status === statusFilter)
    .filter(t =>
      t.order_number?.toLowerCase().includes(search.toLowerCase()) ||
      t.store_name?.toLowerCase().includes(search.toLowerCase())
    );

  const getNextStatusLabel = (status) => {
    const idx = statusFlow.indexOf(status);
    if (idx < statusFlow.length - 1) {
      return statusFlow[idx + 1].replace(/_/g, " ").replace(/\b\w/g, l => l.toUpperCase());
    }
    return null;
  };

  const pendingCount = stockRequests.filter(r => r.status === "pending_approval").length;

  return (
    <div className="p-4 lg:p-6 max-w-7xl mx-auto space-y-4">
      <Tabs defaultValue="transfers">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
          <TabsList className="bg-slate-100">
            <TabsTrigger value="transfers" className="gap-1.5"><Truck className="w-3.5 h-3.5" /> Transfer Orders</TabsTrigger>
            <TabsTrigger value="requests" className="gap-1.5 relative">
              <ClipboardList className="w-3.5 h-3.5" /> Stock Requests
              {pendingCount > 0 && (
                <Badge className="ml-1 h-4 min-w-4 px-1 text-[10px] bg-amber-500 text-white">{pendingCount}</Badge>
              )}
            </TabsTrigger>
          </TabsList>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => setRequestDialogOpen(true)} className="text-blue-600 border-blue-200 hover:bg-blue-50">
              <ClipboardList className="w-4 h-4 mr-1.5" /> Request Stock
            </Button>
            <Button onClick={() => setDialogOpen(true)} className="bg-emerald-600 hover:bg-emerald-700">
              <Plus className="w-4 h-4 mr-1.5" /> New Transfer
            </Button>
          </div>
        </div>

        <TabsContent value="transfers" className="space-y-4 mt-0">
          <div className="flex gap-3 items-center">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <Input placeholder="Search transfers..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9" />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-36"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="draft">Draft</SelectItem>
                <SelectItem value="confirmed">Confirmed</SelectItem>
                <SelectItem value="picking">Picking</SelectItem>
                <SelectItem value="dispatched">Dispatched</SelectItem>
                <SelectItem value="in_transit">In Transit</SelectItem>
                <SelectItem value="delivered">Delivered</SelectItem>
                <SelectItem value="cancelled">Cancelled</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="bg-white rounded-xl border border-slate-200/80 overflow-hidden">
            {filtered.length === 0 ? (
              <EmptyState
                icon={Truck}
                title="No transfer orders"
                description="Create your first transfer to move stock from warehouse to stores"
                actionLabel="New Transfer"
                onAction={() => setDialogOpen(true)}
              />
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-slate-50/80">
                      <TableHead className="font-semibold text-xs">Order #</TableHead>
                      <TableHead className="font-semibold text-xs">Destination</TableHead>
                      <TableHead className="font-semibold text-xs">Items</TableHead>
                      <TableHead className="font-semibold text-xs">Status</TableHead>
                      <TableHead className="font-semibold text-xs">Priority</TableHead>
                      <TableHead className="font-semibold text-xs">Delivery Date</TableHead>
                      <TableHead className="font-semibold text-xs">Vehicle</TableHead>
                      <TableHead className="font-semibold text-xs w-16"></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filtered.map(order => (
                      <TableRow key={order.id} className="hover:bg-slate-50/50">
                        <TableCell className="font-semibold text-sm font-mono">{order.order_number}</TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1.5 text-xs">
                            <span className="text-slate-400">WH</span>
                            <ArrowRight className="w-3 h-3 text-slate-300" />
                            <span className="font-medium text-slate-700">{order.store_name}</span>
                          </div>
                        </TableCell>
                        <TableCell className="text-sm text-slate-600">{order.total_items_count || order.items?.length || 0}</TableCell>
                        <TableCell><StatusBadge status={order.status} /></TableCell>
                        <TableCell><StatusBadge status={order.priority} /></TableCell>
                        <TableCell className="text-xs text-slate-500">
                          {order.requested_delivery_date ? format(new Date(order.requested_delivery_date), "dd MMM yyyy") : "—"}
                        </TableCell>
                        <TableCell className="text-xs text-slate-500">{order.vehicle_number || "—"}</TableCell>
                        <TableCell>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon" className="h-7 w-7">
                                <MoreHorizontal className="w-4 h-4 text-slate-500" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              {order.status !== "delivered" && order.status !== "cancelled" && getNextStatusLabel(order.status) && (
                                <DropdownMenuItem onClick={() => advanceStatus(order)}>
                                  Move to {getNextStatusLabel(order.status)}
                                </DropdownMenuItem>
                              )}
                              {order.status !== "delivered" && order.status !== "cancelled" && (
                                <DropdownMenuItem onClick={() => cancelOrder(order)} className="text-red-600">
                                  Cancel Order
                                </DropdownMenuItem>
                              )}
                              <DropdownMenuItem onClick={() => deleteMutation.mutate(order.id)} className="text-red-600">
                                <Trash2 className="w-3.5 h-3.5 mr-1.5" /> Delete
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </div>
        </TabsContent>

        <TabsContent value="requests" className="mt-0">
          <div className="bg-white rounded-xl border border-slate-200/80 p-4">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-sm font-semibold text-slate-800">Stock Requests</h3>
                <p className="text-xs text-slate-500 mt-0.5">Stores request replenishment · Managers approve or reject</p>
              </div>
            </div>
            <ApprovalPanel
              requests={stockRequests}
              onApprove={handleApprove}
              onReject={handleReject}
              saving={updateRequestMutation.isPending}
            />
          </div>
        </TabsContent>
      </Tabs>

      <TransferFormDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        stores={stores}
        products={products}
        onSave={(data) => createMutation.mutate(data)}
        saving={createMutation.isPending}
      />

      <StockRequestFormDialog
        open={requestDialogOpen}
        onOpenChange={setRequestDialogOpen}
        stores={stores}
        products={products}
        onSave={(data) => createRequestMutation.mutate(data)}
        saving={createRequestMutation.isPending}
      />
    </div>
  );
}