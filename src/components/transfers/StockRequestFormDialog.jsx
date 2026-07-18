import React, { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Plus, Trash2 } from "lucide-react";

export default function StockRequestFormDialog({ open, onOpenChange, stores, products, onSave, saving }) {
  const [form, setForm] = useState({
    store_id: "",
    store_name: "",
    priority: "normal",
    items: [{ product_id: "", product_name: "", sku: "", quantity_requested: "", unit: "" }],
    requested_delivery_date: "",
    notes: "",
  });

  useEffect(() => {
    if (open) {
      setForm({
        store_id: "",
        store_name: "",
        priority: "normal",
        items: [{ product_id: "", product_name: "", sku: "", quantity_requested: "", unit: "" }],
        requested_delivery_date: "",
        notes: "",
      });
    }
  }, [open]);

  const handleStoreChange = (e) => {
    const storeId = e.target.value;
    const store = stores.find(s => s.id === storeId);
    setForm({ ...form, store_id: storeId, store_name: store?.name || "" });
  };

  const handleProductChange = (index, e) => {
    const productId = e.target.value;
    const product = products.find(p => p.id === productId);
    const newItems = [...form.items];
    newItems[index] = { ...newItems[index], product_id: productId, product_name: product?.name || "", sku: product?.sku || "", unit: product?.unit || "pcs" };
    setForm({ ...form, items: newItems });
  };

  const handleQtyChange = (index, e) => {
    const newItems = [...form.items];
    newItems[index] = { ...newItems[index], quantity_requested: e.target.value };
    setForm({ ...form, items: newItems });
  };

  const addItem = () => setForm({ ...form, items: [...form.items, { product_id: "", product_name: "", sku: "", quantity_requested: "", unit: "" }] });
  const removeItem = (i) => { if (form.items.length > 1) setForm({ ...form, items: form.items.filter((_, idx) => idx !== i) }); };

  const handleSubmit = (e) => {
    e.preventDefault();
    const requestNumber = `SR-${Date.now().toString().slice(-6)}`;
    const items = form.items
      .filter(i => i.product_id && i.quantity_requested)
      .map(i => ({ ...i, quantity_requested: Number(i.quantity_requested) }));
    onSave({ ...form, request_number: requestNumber, status: "pending_approval", items });
  };

  const inputClass = "w-full h-9 rounded-md border border-slate-200 bg-white px-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/40";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Request Stock from Warehouse</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label htmlFor="sr-store">Store *</Label>
              <select id="sr-store" className={inputClass} value={form.store_id} onChange={handleStoreChange} required>
                <option value="">Select your store</option>
                {stores.filter(s => s.status === "active").map(s => (
                  <option key={s.id} value={s.id}>{s.name}</option>
                ))}
              </select>
            </div>
            <div>
              <Label htmlFor="sr-priority">Priority</Label>
              <select id="sr-priority" className={inputClass} value={form.priority} onChange={e => setForm({ ...form, priority: e.target.value })}>
                <option value="low">Low</option>
                <option value="normal">Normal</option>
                <option value="high">High</option>
                <option value="urgent">Urgent</option>
              </select>
            </div>
            <div className="col-span-2">
              <Label htmlFor="sr-date">Requested Delivery Date</Label>
              <input id="sr-date" type="date" className={inputClass} value={form.requested_delivery_date} onChange={e => setForm({ ...form, requested_delivery_date: e.target.value })} />
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-2">
              <Label className="text-sm font-semibold">Requested Items</Label>
              <Button type="button" variant="outline" size="sm" onClick={addItem} className="text-xs">
                <Plus className="w-3 h-3 mr-1" /> Add Item
              </Button>
            </div>
            <div className="space-y-2">
              {form.items.map((item, index) => (
                <div key={index} className="flex gap-2 items-end">
                  <div className="flex-1">
                    {index === 0 && <Label className="text-xs text-slate-500">Product</Label>}
                    <select className={`${inputClass} text-xs`} value={item.product_id} onChange={e => handleProductChange(index, e)}>
                      <option value="">Select product</option>
                      {products.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                    </select>
                  </div>
                  <div className="w-24">
                    {index === 0 && <Label className="text-xs text-slate-500">Qty</Label>}
                    <input type="number" className={`${inputClass} text-xs`} value={item.quantity_requested} onChange={e => handleQtyChange(index, e)} placeholder="0" />
                  </div>
                  <Button type="button" variant="ghost" size="icon" className="h-9 w-9 shrink-0" onClick={() => removeItem(index)} disabled={form.items.length <= 1}>
                    <Trash2 className="w-3.5 h-3.5 text-red-400" />
                  </Button>
                </div>
              ))}
            </div>
          </div>

          <div>
            <Label htmlFor="sr-notes">Notes / Reason</Label>
            <textarea id="sr-notes" className="w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/40" rows={2} value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} placeholder="Optional justification for the request..." />
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
            <Button type="submit" disabled={saving || !form.store_id} className="bg-blue-600 hover:bg-blue-700">
              {saving ? "Submitting..." : "Submit Request"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}