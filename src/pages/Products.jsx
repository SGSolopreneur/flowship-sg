import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Plus, Search, Pencil, Trash2, ShoppingCart } from "lucide-react";
import StatusBadge from "../components/shared/StatusBadge";
import EmptyState from "../components/shared/EmptyState";
import ProductFormDialog from "../components/products/ProductFormDialog";
import { useRole } from "../components/shared/useRole";

const categoryLabels = {
  fresh_produce: "Fresh Produce", frozen: "Frozen", dairy: "Dairy", beverages: "Beverages",
  dry_goods: "Dry Goods", snacks: "Snacks", halal_meat: "Halal Meat", seafood: "Seafood",
  bakery: "Bakery", household: "Household", personal_care: "Personal Care",
  baby_products: "Baby Products", ready_to_eat: "Ready to Eat", condiments: "Condiments", other: "Other",
};

export default function Products() {
  const [search, setSearch] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editProduct, setEditProduct] = useState(null);
  const queryClient = useQueryClient();
  const { canWrite } = useRole();

  const { data: products = [], isLoading } = useQuery({
    queryKey: ["products"],
    queryFn: () => base44.entities.Product.list(),
  });

  const createMutation = useMutation({
    mutationFn: (data) => base44.entities.Product.create(data),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["products"] }); setDialogOpen(false); },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.Product.update(id, data),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["products"] }); setDialogOpen(false); },
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.Product.delete(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["products"] }),
  });

  const handleSave = (formData) => {
    if (editProduct) {
      updateMutation.mutate({ id: editProduct.id, data: formData });
    } else {
      createMutation.mutate(formData);
    }
  };

  const filtered = products.filter(p =>
    p.name?.toLowerCase().includes(search.toLowerCase()) ||
    p.sku?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="p-4 lg:p-6 max-w-7xl mx-auto space-y-4">
      <div className="flex flex-col sm:flex-row gap-3 sm:items-center justify-between">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <Input placeholder="Search products..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9" />
        </div>
        {canWrite && (
          <Button onClick={() => { setEditProduct(null); setDialogOpen(true); }} className="bg-emerald-600 hover:bg-emerald-700">
            <Plus className="w-4 h-4 mr-1.5" /> Add Product
          </Button>
        )}
      </div>

      <div className="bg-white rounded-xl border border-slate-200/80 overflow-hidden">
        {filtered.length === 0 && !isLoading ? (
          <EmptyState
            icon={ShoppingCart}
            title="No products yet"
            description="Add your first product to start managing inventory"
            actionLabel={canWrite ? "Add Product" : undefined}
            onAction={canWrite ? () => { setEditProduct(null); setDialogOpen(true); } : undefined}
          />
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="bg-slate-50/80">
                  <TableHead className="font-semibold text-xs">Product</TableHead>
                  <TableHead className="font-semibold text-xs">SKU</TableHead>
                  <TableHead className="font-semibold text-xs">Category</TableHead>
                  <TableHead className="font-semibold text-xs">Storage</TableHead>
                  <TableHead className="font-semibold text-xs text-right">Cost (SGD)</TableHead>
                  <TableHead className="font-semibold text-xs">Halal</TableHead>
                  <TableHead className="font-semibold text-xs w-20"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map(product => (
                  <TableRow key={product.id} className="hover:bg-slate-50/50">
                    <TableCell className="font-medium text-sm">{product.name}</TableCell>
                    <TableCell className="text-xs text-slate-500 font-mono">{product.sku}</TableCell>
                    <TableCell className="text-xs text-slate-600">{categoryLabels[product.category] || product.category}</TableCell>
                    <TableCell><StatusBadge status={product.storage_type} /></TableCell>
                    <TableCell className="text-right text-sm">{product.unit_cost ? `$${product.unit_cost.toFixed(2)}` : "—"}</TableCell>
                    <TableCell className="text-sm">{product.is_halal_certified ? "✓" : "—"}</TableCell>
                    <TableCell>
                      <div className="flex gap-1">
                        <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => { setEditProduct(product); setDialogOpen(true); }}>
                          <Pencil className="w-3.5 h-3.5 text-slate-500" />
                        </Button>
                        <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => deleteMutation.mutate(product.id)}>
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

      <ProductFormDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        product={editProduct}
        onSave={handleSave}
        saving={createMutation.isPending || updateMutation.isPending}
      />
    </div>
  );
}