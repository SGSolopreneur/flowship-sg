import React, { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const defaultForm = {
  product_id: "", location_type: "warehouse", location_id: "warehouse",
  location_name: "Central Warehouse", quantity: "", storage_zone: "ambient",
  batch_number: "", expiry_date: "",
};

export default function InventoryFormDialog({ open, onOpenChange, item, products, stores, onSave, saving }) {
  const [form, setForm] = useState(defaultForm);

  useEffect(() => {
    if (item) setForm({ ...defaultForm, ...item });
    else setForm(defaultForm);
  }, [item, open]);

  const handleProductChange = (productId) => {
    const product = products.find(p => p.id === productId);
    setForm({
      ...form,
      product_id: productId,
      product_name: product?.name || "",
      sku: product?.sku || "",
      storage_zone: product?.storage_type || form.storage_zone,
    });
  };

  const handleLocationTypeChange = (type) => {
    setForm({
      ...form,
      location_type: type,
      location_id: type === "warehouse" ? "warehouse" : "",
      location_name: type === "warehouse" ? "Central Warehouse" : "",
    });
  };

  const handleStoreChange = (storeId) => {
    const store = stores.find(s => s.id === storeId);
    setForm({ ...form, location_id: storeId, location_name: store?.name || "" });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave({ ...form, quantity: Number(form.quantity) });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{item ? "Edit Inventory" : "Add Inventory"}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-3">
            <div>
              <Label>Product *</Label>
              <Select value={form.product_id} onValueChange={handleProductChange}>
                <SelectTrigger><SelectValue placeholder="Select product" /></SelectTrigger>
                <SelectContent>
                  {products.map(p => <SelectItem key={p.id} value={p.id}>{p.name} ({p.sku})</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Location Type</Label>
                <Select value={form.location_type} onValueChange={handleLocationTypeChange}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="warehouse">Warehouse</SelectItem>
                    <SelectItem value="store">Store</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              {form.location_type === "store" && (
                <div>
                  <Label>Store</Label>
                  <Select value={form.location_id} onValueChange={handleStoreChange}>
                    <SelectTrigger><SelectValue placeholder="Select store" /></SelectTrigger>
                    <SelectContent>
                      {stores.map(s => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
              )}
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Quantity *</Label>
                <Input type="number" value={form.quantity} onChange={e => setForm({ ...form, quantity: e.target.value })} required />
              </div>
              <div>
                <Label>Storage Zone</Label>
                <Select value={form.storage_zone} onValueChange={v => setForm({ ...form, storage_zone: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ambient">Ambient</SelectItem>
                    <SelectItem value="chilled">Chilled</SelectItem>
                    <SelectItem value="frozen">Frozen</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Batch Number</Label>
                <Input value={form.batch_number} onChange={e => setForm({ ...form, batch_number: e.target.value })} />
              </div>
              <div>
                <Label>Expiry Date</Label>
                <Input type="date" value={form.expiry_date} onChange={e => setForm({ ...form, expiry_date: e.target.value })} />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
            <Button type="submit" disabled={saving} className="bg-emerald-600 hover:bg-emerald-700">
              {saving ? "Saving..." : "Save"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}