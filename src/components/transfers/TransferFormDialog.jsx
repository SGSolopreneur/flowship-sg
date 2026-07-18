import React, { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Trash2 } from "lucide-react";
import DatePicker from "../shared/DatePicker";

export default function TransferFormDialog({ open, onOpenChange, stores, products, vehicles, onSave, saving }) {
  const [form, setForm] = useState({
    order_number: "",
    store_id: "",
    store_name: "",
    status: "draft",
    priority: "normal",
    items: [{ product_id: "", product_name: "", sku: "", quantity_requested: "", unit: "" }],
    requested_delivery_date: "",
    vehicle_id: "",
    vehicle_plate_number: "",
    driver_name: "",
    total_weight_kg: 0,
    total_volume_m3: 0,
    notes: "",
  });

  useEffect(() => {
    if (open) {
      const num = `TO-${Date.now().toString().slice(-6)}`;
      setForm(f => ({
        ...f,
        order_number: num,
        store_id: "",
        store_name: "",
        items: [{ product_id: "", product_name: "", sku: "", quantity_requested: "", unit: "" }],
        requested_delivery_date: "",
        vehicle_id: "",
        vehicle_plate_number: "",
        driver_name: "",
        total_weight_kg: 0,
        total_volume_m3: 0,
        notes: "",
      }));
    }
  }, [open]);

  const handleVehicleChange = (vehicleId) => {
    const vehicle = vehicles.find(v => v.id === vehicleId);
    setForm({ ...form, vehicle_id: vehicleId, vehicle_plate_number: vehicle?.plate_number || "" });
  };

  const handleStoreChange = (storeId) => {
    const store = stores.find(s => s.id === storeId);
    setForm({ ...form, store_id: storeId, store_name: store?.name || "" });
  };

  const handleItemProductChange = (index, productId) => {
    const product = products.find(p => p.id === productId);
    const newItems = [...form.items];
    newItems[index] = {
      ...newItems[index],
      product_id: productId,
      product_name: product?.name || "",
      sku: product?.sku || "",
      unit: product?.unit || "pcs",
    };
    setForm({ ...form, items: newItems });
  };

  const handleItemQtyChange = (index, qty) => {
    const newItems = [...form.items];
    newItems[index] = { ...newItems[index], quantity_requested: qty };
    setForm({ ...form, items: newItems });
  };

  const addItem = () => {
    setForm({ ...form, items: [...form.items, { product_id: "", product_name: "", sku: "", quantity_requested: "", unit: "" }] });
  };

  const removeItem = (index) => {
    if (form.items.length <= 1) return;
    setForm({ ...form, items: form.items.filter((_, i) => i !== index) });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const items = form.items
      .filter(i => i.product_id && i.quantity_requested)
      .map(i => ({ ...i, quantity_requested: Number(i.quantity_requested) }));
    onSave({ ...form, items, total_items_count: items.length });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>New Transfer Order</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Order Number</Label>
              <Input value={form.order_number} readOnly className="bg-slate-50" />
            </div>
            <div>
              <Label>Destination Store *</Label>
              <Select value={form.store_id} onValueChange={handleStoreChange}>
                <SelectTrigger><SelectValue placeholder="Select store" /></SelectTrigger>
                <SelectContent>
                  {stores.filter(s => s.status === "active").map(s => (
                    <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Priority</Label>
              <Select value={form.priority} onValueChange={v => setForm({ ...form, priority: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="low">Low</SelectItem>
                  <SelectItem value="normal">Normal</SelectItem>
                  <SelectItem value="high">High</SelectItem>
                  <SelectItem value="urgent">Urgent</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Delivery Date</Label>
              <DatePicker
                value={form.requested_delivery_date}
                onChange={(val) => setForm({ ...form, requested_delivery_date: val })}
                placeholder="Pick delivery date"
              />
            </div>
          </div>

          {/* Items */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <Label className="text-sm font-semibold">Transfer Items</Label>
              <Button type="button" variant="outline" size="sm" onClick={addItem} className="text-xs">
                <Plus className="w-3 h-3 mr-1" /> Add Item
              </Button>
            </div>
            <div className="space-y-2">
              {form.items.map((item, index) => (
                <div key={index} className="flex gap-2 items-end">
                  <div className="flex-1">
                    {index === 0 && <Label className="text-xs text-slate-500">Product</Label>}
                    <Select value={item.product_id} onValueChange={v => handleItemProductChange(index, v)}>
                      <SelectTrigger className="text-xs"><SelectValue placeholder="Select" /></SelectTrigger>
                      <SelectContent>
                        {products.map(p => <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="w-24">
                    {index === 0 && <Label className="text-xs text-slate-500">Qty</Label>}
                    <Input
                      type="number"
                      value={item.quantity_requested}
                      onChange={e => handleItemQtyChange(index, e.target.value)}
                      placeholder="0"
                      className="text-xs"
                    />
                  </div>
                  <Button type="button" variant="ghost" size="icon" className="h-9 w-9 shrink-0" onClick={() => removeItem(index)} disabled={form.items.length <= 1}>
                    <Trash2 className="w-3.5 h-3.5 text-red-400" />
                  </Button>
                </div>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Vehicle *</Label>
              <Select value={form.vehicle_id} onValueChange={handleVehicleChange}>
                <SelectTrigger><SelectValue placeholder="Select vehicle" /></SelectTrigger>
                <SelectContent>
                  {vehicles.filter(v => v.status === "active").map(v => (
                    <SelectItem key={v.id} value={v.id}>{v.plate_number} • {v.vehicle_type}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Driver Name</Label>
              <Input value={form.driver_name} onChange={e => setForm({ ...form, driver_name: e.target.value })} />
            </div>
          </div>
          <div>
            <Label>Notes</Label>
            <Textarea value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} rows={2} />
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
            <Button type="submit" disabled={saving} className="bg-emerald-600 hover:bg-emerald-700">
              {saving ? "Creating..." : "Create Transfer"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}