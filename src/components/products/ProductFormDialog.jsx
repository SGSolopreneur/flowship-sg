import React, { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";

const categories = [
  { value: "fresh_produce", label: "Fresh Produce" },
  { value: "frozen", label: "Frozen" },
  { value: "dairy", label: "Dairy" },
  { value: "beverages", label: "Beverages" },
  { value: "dry_goods", label: "Dry Goods" },
  { value: "snacks", label: "Snacks" },
  { value: "halal_meat", label: "Halal Meat" },
  { value: "seafood", label: "Seafood" },
  { value: "bakery", label: "Bakery" },
  { value: "household", label: "Household" },
  { value: "personal_care", label: "Personal Care" },
  { value: "baby_products", label: "Baby Products" },
  { value: "ready_to_eat", label: "Ready to Eat" },
  { value: "condiments", label: "Condiments" },
  { value: "other", label: "Other" },
];

const units = ["pcs", "kg", "g", "L", "mL", "carton", "pack", "box", "tray", "bundle"];

const defaultForm = {
  name: "", sku: "", category: "dry_goods", unit: "pcs", unit_cost: "",
  min_stock_level: "", storage_type: "ambient", shelf_life_days: "",
  supplier: "", is_halal_certified: false,
};

export default function ProductFormDialog({ open, onOpenChange, product, onSave, saving }) {
  const [form, setForm] = useState(defaultForm);

  useEffect(() => {
    if (product) {
      setForm({ ...defaultForm, ...product });
    } else {
      setForm(defaultForm);
    }
  }, [product, open]);

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave({
      ...form,
      unit_cost: form.unit_cost ? Number(form.unit_cost) : undefined,
      min_stock_level: form.min_stock_level ? Number(form.min_stock_level) : undefined,
      shelf_life_days: form.shelf_life_days ? Number(form.shelf_life_days) : undefined,
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{product ? "Edit Product" : "Add Product"}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div className="col-span-2">
              <Label>Product Name *</Label>
              <Input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} required />
            </div>
            <div>
              <Label>SKU *</Label>
              <Input value={form.sku} onChange={e => setForm({ ...form, sku: e.target.value })} required />
            </div>
            <div>
              <Label>Category *</Label>
              <Select value={form.category} onValueChange={v => setForm({ ...form, category: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {categories.map(c => <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Unit</Label>
              <Select value={form.unit} onValueChange={v => setForm({ ...form, unit: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {units.map(u => <SelectItem key={u} value={u}>{u}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Unit Cost (SGD)</Label>
              <Input type="number" step="0.01" value={form.unit_cost} onChange={e => setForm({ ...form, unit_cost: e.target.value })} />
            </div>
            <div>
              <Label>Min Stock Level</Label>
              <Input type="number" value={form.min_stock_level} onChange={e => setForm({ ...form, min_stock_level: e.target.value })} />
            </div>
            <div>
              <Label>Storage Type</Label>
              <Select value={form.storage_type} onValueChange={v => setForm({ ...form, storage_type: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="ambient">Ambient</SelectItem>
                  <SelectItem value="chilled">Chilled</SelectItem>
                  <SelectItem value="frozen">Frozen</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Shelf Life (days)</Label>
              <Input type="number" value={form.shelf_life_days} onChange={e => setForm({ ...form, shelf_life_days: e.target.value })} />
            </div>
            <div className="col-span-2">
              <Label>Supplier</Label>
              <Input value={form.supplier} onChange={e => setForm({ ...form, supplier: e.target.value })} />
            </div>
            <div className="col-span-2 flex items-center gap-3">
              <Switch checked={form.is_halal_certified} onCheckedChange={v => setForm({ ...form, is_halal_certified: v })} />
              <Label>Halal Certified</Label>
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