import React, { useState, useEffect } from "react";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue
} from "@/components/ui/select";
import { Loader2 } from "lucide-react";

const EMPTY = {
  name: "", code: "", contact_person: "", email: "", phone: "",
  address: "", country: "Singapore", lead_time_days: 3,
  min_order_quantity: 1, payment_terms: "net_30", status: "active",
  performance_rating: "", on_time_delivery_pct: "", quality_score: "",
  total_orders: 0, notes: "",
};

export default function SupplierFormDialog({ open, onOpenChange, supplier, onSave, saving }) {
  const [form, setForm] = useState(EMPTY);

  useEffect(() => {
    setForm(supplier ? { ...EMPTY, ...supplier } : EMPTY);
  }, [supplier, open]);

  const set = (field, value) => setForm(prev => ({ ...prev, [field]: value }));

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave({
      ...form,
      lead_time_days: Number(form.lead_time_days) || 0,
      min_order_quantity: Number(form.min_order_quantity) || 1,
      performance_rating: form.performance_rating !== "" ? Number(form.performance_rating) : undefined,
      on_time_delivery_pct: form.on_time_delivery_pct !== "" ? Number(form.on_time_delivery_pct) : undefined,
      quality_score: form.quality_score !== "" ? Number(form.quality_score) : undefined,
      total_orders: Number(form.total_orders) || 0,
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{supplier ? "Edit Supplier" : "Add Supplier"}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 py-1">
          {/* Basic Info */}
          <div className="grid grid-cols-2 gap-3">
            <div className="col-span-2 sm:col-span-1 space-y-1">
              <Label className="text-xs">Supplier Name *</Label>
              <Input required value={form.name} onChange={e => set("name", e.target.value)} placeholder="Company name" />
            </div>
            <div className="col-span-2 sm:col-span-1 space-y-1">
              <Label className="text-xs">Code *</Label>
              <Input required value={form.code} onChange={e => set("code", e.target.value)} placeholder="SUP-001" />
            </div>
          </div>

          {/* Contact */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label className="text-xs">Contact Person</Label>
              <Input value={form.contact_person} onChange={e => set("contact_person", e.target.value)} placeholder="Full name" />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Phone</Label>
              <Input value={form.phone} onChange={e => set("phone", e.target.value)} placeholder="+65 xxxx xxxx" />
            </div>
            <div className="col-span-2 space-y-1">
              <Label className="text-xs">Email</Label>
              <Input type="email" value={form.email} onChange={e => set("email", e.target.value)} placeholder="supplier@example.com" />
            </div>
            <div className="col-span-2 space-y-1">
              <Label className="text-xs">Address</Label>
              <Input value={form.address} onChange={e => set("address", e.target.value)} placeholder="Street, City" />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Country</Label>
              <Input value={form.country} onChange={e => set("country", e.target.value)} placeholder="Singapore" />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Status</Label>
              <Select value={form.status} onValueChange={v => set("status", v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="inactive">Inactive</SelectItem>
                  <SelectItem value="on_hold">On Hold</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Order Constraints */}
          <div className="border-t border-slate-100 pt-3">
            <p className="text-xs font-semibold text-slate-600 mb-2 uppercase tracking-wider">Order Constraints</p>
            <div className="grid grid-cols-3 gap-3">
              <div className="space-y-1">
                <Label className="text-xs">Lead Time (days)</Label>
                <Input type="number" min={0} value={form.lead_time_days} onChange={e => set("lead_time_days", e.target.value)} />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Min Order Qty</Label>
                <Input type="number" min={1} value={form.min_order_quantity} onChange={e => set("min_order_quantity", e.target.value)} />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Payment Terms</Label>
                <Select value={form.payment_terms} onValueChange={v => set("payment_terms", v)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="cod">COD</SelectItem>
                    <SelectItem value="net_7">Net 7</SelectItem>
                    <SelectItem value="net_14">Net 14</SelectItem>
                    <SelectItem value="net_30">Net 30</SelectItem>
                    <SelectItem value="net_60">Net 60</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          {/* Performance */}
          <div className="border-t border-slate-100 pt-3">
            <p className="text-xs font-semibold text-slate-600 mb-2 uppercase tracking-wider">Performance</p>
            <div className="grid grid-cols-3 gap-3">
              <div className="space-y-1">
                <Label className="text-xs">Overall Rating (/5)</Label>
                <Input type="number" min={0} max={5} step={0.1} value={form.performance_rating} onChange={e => set("performance_rating", e.target.value)} placeholder="4.5" />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">On-Time Delivery %</Label>
                <Input type="number" min={0} max={100} value={form.on_time_delivery_pct} onChange={e => set("on_time_delivery_pct", e.target.value)} placeholder="95" />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Quality Score (/5)</Label>
                <Input type="number" min={0} max={5} step={0.1} value={form.quality_score} onChange={e => set("quality_score", e.target.value)} placeholder="4.8" />
              </div>
            </div>
          </div>

          <div className="space-y-1">
            <Label className="text-xs">Notes</Label>
            <textarea
              className="w-full rounded-md border border-slate-200 text-sm px-3 py-2 resize-none focus:outline-none focus:ring-1 focus:ring-slate-300"
              rows={2}
              value={form.notes}
              onChange={e => set("notes", e.target.value)}
              placeholder="Internal notes..."
            />
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" size="sm" onClick={() => onOpenChange(false)}>Cancel</Button>
            <Button type="submit" size="sm" disabled={saving} className="bg-emerald-600 hover:bg-emerald-700">
              {saving ? <><Loader2 className="w-3.5 h-3.5 animate-spin mr-1" /> Saving…</> : "Save Supplier"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}