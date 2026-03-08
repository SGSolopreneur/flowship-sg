import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import {
  Plus, Search, Pencil, Trash2, Building2, Star, Clock, ShieldCheck, TrendingUp, FileDown
} from "lucide-react";
import { generateSupplierPerformancePDF } from "../components/shared/PdfReportGenerator";
import EmptyState from "../components/shared/EmptyState";
import SupplierFormDialog from "../components/suppliers/SupplierFormDialog";
import { cn } from "@/lib/utils";

const statusStyles = {
  active:   "bg-emerald-100 text-emerald-700",
  inactive: "bg-slate-100 text-slate-500",
  on_hold:  "bg-amber-100 text-amber-700",
};
const statusLabels = { active: "Active", inactive: "Inactive", on_hold: "On Hold" };

const paymentLabels = {
  cod: "COD", net_7: "Net 7", net_14: "Net 14", net_30: "Net 30", net_60: "Net 60",
};

function RatingStars({ value, max = 5 }) {
  if (value == null || value === "") return <span className="text-slate-300">—</span>;
  const pct = Math.round((value / max) * 100);
  return (
    <div className="flex items-center gap-1">
      <div className="relative w-16 h-1.5 bg-slate-200 rounded-full overflow-hidden">
        <div className="absolute inset-y-0 left-0 bg-amber-400 rounded-full" style={{ width: `${pct}%` }} />
      </div>
      <span className="text-[11px] text-slate-600">{Number(value).toFixed(1)}</span>
    </div>
  );
}

function PerformanceSummary({ supplier }) {
  return (
    <div className="flex flex-col gap-1 min-w-[120px]">
      <div className="flex items-center gap-1.5">
        <Star className="w-3 h-3 text-amber-400 flex-shrink-0" />
        <RatingStars value={supplier.performance_rating} />
      </div>
      <div className="flex items-center gap-1.5">
        <Clock className="w-3 h-3 text-blue-400 flex-shrink-0" />
        <span className="text-[11px] text-slate-500">
          {supplier.on_time_delivery_pct != null ? `${supplier.on_time_delivery_pct}% OTD` : "—"}
        </span>
      </div>
      <div className="flex items-center gap-1.5">
        <ShieldCheck className="w-3 h-3 text-emerald-400 flex-shrink-0" />
        <RatingStars value={supplier.quality_score} />
      </div>
    </div>
  );
}

export default function Suppliers() {
  const [search, setSearch] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editSupplier, setEditSupplier] = useState(null);
  const queryClient = useQueryClient();

  const { data: suppliers = [], isLoading } = useQuery({
    queryKey: ["suppliers"],
    queryFn: () => base44.entities.Supplier.list("-created_date"),
  });

  const createMutation = useMutation({
    mutationFn: (data) => base44.entities.Supplier.create(data),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["suppliers"] }); setDialogOpen(false); },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.Supplier.update(id, data),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["suppliers"] }); setDialogOpen(false); },
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.Supplier.delete(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["suppliers"] }),
  });

  const handleSave = (formData) => {
    if (editSupplier) {
      updateMutation.mutate({ id: editSupplier.id, data: formData });
    } else {
      createMutation.mutate(formData);
    }
  };

  const filtered = suppliers.filter(s =>
    s.name?.toLowerCase().includes(search.toLowerCase()) ||
    s.code?.toLowerCase().includes(search.toLowerCase()) ||
    s.contact_person?.toLowerCase().includes(search.toLowerCase())
  );

  // Summary stats
  const activeCount = suppliers.filter(s => s.status === "active").length;
  const avgLeadTime = suppliers.length
    ? (suppliers.reduce((sum, s) => sum + (s.lead_time_days || 0), 0) / suppliers.length).toFixed(1)
    : "—";
  const avgRating = suppliers.filter(s => s.performance_rating).length
    ? (suppliers.filter(s => s.performance_rating).reduce((sum, s) => sum + s.performance_rating, 0) /
        suppliers.filter(s => s.performance_rating).length).toFixed(1)
    : "—";

  return (
    <div className="p-4 lg:p-6 max-w-7xl mx-auto space-y-4">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="bg-white rounded-xl border border-slate-200/80 p-4 flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-emerald-50 flex items-center justify-center">
            <Building2 className="w-4.5 h-4.5 text-emerald-600" />
          </div>
          <div>
            <p className="text-[11px] text-slate-400 uppercase tracking-wider">Active</p>
            <p className="text-xl font-bold text-slate-800">{activeCount}</p>
          </div>
        </div>
        <div className="bg-white rounded-xl border border-slate-200/80 p-4 flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-blue-50 flex items-center justify-center">
            <Clock className="w-4.5 h-4.5 text-blue-500" />
          </div>
          <div>
            <p className="text-[11px] text-slate-400 uppercase tracking-wider">Avg Lead Time</p>
            <p className="text-xl font-bold text-slate-800">{avgLeadTime}<span className="text-sm font-normal text-slate-400 ml-1">days</span></p>
          </div>
        </div>
        <div className="bg-white rounded-xl border border-slate-200/80 p-4 flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-amber-50 flex items-center justify-center">
            <Star className="w-4.5 h-4.5 text-amber-500" />
          </div>
          <div>
            <p className="text-[11px] text-slate-400 uppercase tracking-wider">Avg Rating</p>
            <p className="text-xl font-bold text-slate-800">{avgRating}<span className="text-sm font-normal text-slate-400 ml-1">/ 5</span></p>
          </div>
        </div>
      </div>

      {/* Search + Add */}
      <div className="flex flex-col sm:flex-row gap-3 sm:items-center justify-between">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <Input placeholder="Search suppliers..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9" />
        </div>
        <Button onClick={() => { setEditSupplier(null); setDialogOpen(true); }} className="bg-emerald-600 hover:bg-emerald-700">
          <Plus className="w-4 h-4 mr-1.5" /> Add Supplier
        </Button>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-slate-200/80 overflow-hidden">
        {filtered.length === 0 && !isLoading ? (
          <EmptyState
            icon={Building2}
            title="No suppliers yet"
            description="Add your first supplier to start managing your supply chain"
            actionLabel="Add Supplier"
            onAction={() => { setEditSupplier(null); setDialogOpen(true); }}
          />
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="bg-slate-50/80">
                  <TableHead className="font-semibold text-xs">Supplier</TableHead>
                  <TableHead className="font-semibold text-xs">Contact</TableHead>
                  <TableHead className="font-semibold text-xs text-center">Lead Time</TableHead>
                  <TableHead className="font-semibold text-xs text-center">Min Order</TableHead>
                  <TableHead className="font-semibold text-xs">Payment</TableHead>
                  <TableHead className="font-semibold text-xs">Performance</TableHead>
                  <TableHead className="font-semibold text-xs">Status</TableHead>
                  <TableHead className="font-semibold text-xs w-16"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map(supplier => (
                  <TableRow key={supplier.id} className="hover:bg-slate-50/50 align-top">
                    <TableCell>
                      <p className="font-medium text-sm text-slate-800">{supplier.name}</p>
                      <p className="text-[11px] text-slate-400 font-mono">{supplier.code}</p>
                      {supplier.country && <p className="text-[11px] text-slate-400">{supplier.country}</p>}
                    </TableCell>
                    <TableCell>
                      {supplier.contact_person && <p className="text-xs text-slate-700">{supplier.contact_person}</p>}
                      {supplier.email && <p className="text-[11px] text-slate-400 truncate max-w-[140px]">{supplier.email}</p>}
                      {supplier.phone && <p className="text-[11px] text-slate-400">{supplier.phone}</p>}
                    </TableCell>
                    <TableCell className="text-center">
                      <span className="inline-flex items-center gap-1 text-sm font-semibold text-blue-700">
                        <Clock className="w-3 h-3" />{supplier.lead_time_days ?? "—"}d
                      </span>
                    </TableCell>
                    <TableCell className="text-center text-sm text-slate-600">
                      {supplier.min_order_quantity ?? "—"}
                    </TableCell>
                    <TableCell>
                      <span className="text-xs text-slate-600">{paymentLabels[supplier.payment_terms] || "—"}</span>
                    </TableCell>
                    <TableCell>
                      <PerformanceSummary supplier={supplier} />
                    </TableCell>
                    <TableCell>
                      <Badge className={cn("text-[10px] border-0", statusStyles[supplier.status] || "bg-slate-100 text-slate-500")}>
                        {statusLabels[supplier.status] || supplier.status}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-1">
                        <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => { setEditSupplier(supplier); setDialogOpen(true); }}>
                          <Pencil className="w-3.5 h-3.5 text-slate-500" />
                        </Button>
                        <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => deleteMutation.mutate(supplier.id)}>
                          <Trash2 className="w-3.5 h-3.5 text-red-400" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </div>

      <SupplierFormDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        supplier={editSupplier}
        onSave={handleSave}
        saving={createMutation.isPending || updateMutation.isPending}
      />
    </div>
  );
}