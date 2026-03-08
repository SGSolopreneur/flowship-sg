import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Plus, Search, Pencil, Trash2, Package, ScanLine, History } from "lucide-react";
import { format } from "date-fns";
import StatusBadge from "../components/shared/StatusBadge";
import EmptyState from "../components/shared/EmptyState";
import InventoryFormDialog from "../components/inventory/InventoryFormDialog";
import BarcodeScanner from "../components/inventory/BarcodeScanner";
import StockUpdateDialog from "../components/inventory/StockUpdateDialog";
import StockMovementHistory from "../components/inventory/StockMovementHistory";

export default function Inventory() {
  const [search, setSearch] = useState("");
  const [locFilter, setLocFilter] = useState("all");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editItem, setEditItem] = useState(null);
  const [scannerOpen, setScannerOpen] = useState(false);
  const [stockUpdateItem, setStockUpdateItem] = useState(null);
  const queryClient = useQueryClient();

  const { data: inventory = [] } = useQuery({
    queryKey: ["inventory"],
    queryFn: () => base44.entities.InventoryItem.list(),
  });
  const { data: products = [] } = useQuery({
    queryKey: ["products"],
    queryFn: () => base44.entities.Product.list(),
  });
  const { data: stores = [] } = useQuery({
    queryKey: ["stores"],
    queryFn: () => base44.entities.Store.list(),
  });

  const createMutation = useMutation({
    mutationFn: (data) => base44.entities.InventoryItem.create(data),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["inventory"] }); setDialogOpen(false); },
  });
  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.InventoryItem.update(id, data),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["inventory"] }); setDialogOpen(false); setStockUpdateItem(null); },
  });
  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.InventoryItem.delete(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["inventory"] }),
  });

  const handleSave = (formData) => {
    if (editItem) updateMutation.mutate({ id: editItem.id, data: formData });
    else createMutation.mutate(formData);
  };

  const handleBarcodeDetected = (code) => {
    setScannerOpen(false);
    // Match against SKU or product name
    const matched = inventory.find(
      item => item.sku?.toLowerCase() === code.toLowerCase() ||
              item.product_name?.toLowerCase() === code.toLowerCase()
    );
    if (matched) {
      setStockUpdateItem(matched);
    } else {
      // Pre-fill search so staff can see what was scanned
      setSearch(code);
    }
  };

  const handleStockUpdate = (itemId, newQuantity) => {
    updateMutation.mutate({ id: itemId, data: { quantity: newQuantity } });
  };

  const filtered = inventory
    .filter(item => locFilter === "all" || item.location_type === locFilter)
    .filter(item =>
      item.product_name?.toLowerCase().includes(search.toLowerCase()) ||
      item.sku?.toLowerCase().includes(search.toLowerCase())
    );

  const getProduct = (id) => products.find(p => p.id === id);

  return (
    <div className="p-4 lg:p-6 max-w-7xl mx-auto space-y-4">
      <div className="flex flex-col sm:flex-row gap-3 sm:items-center justify-between">
        <div className="flex gap-3 items-center flex-1">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <Input placeholder="Search inventory..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9" />
          </div>
          <Tabs value={locFilter} onValueChange={setLocFilter}>
            <TabsList className="bg-slate-100">
              <TabsTrigger value="all" className="text-xs">All</TabsTrigger>
              <TabsTrigger value="warehouse" className="text-xs">Warehouse</TabsTrigger>
              <TabsTrigger value="store" className="text-xs">Stores</TabsTrigger>
            </TabsList>
          </Tabs>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => setScannerOpen(true)} className="border-emerald-200 text-emerald-700 hover:bg-emerald-50">
            <ScanLine className="w-4 h-4 mr-1.5" /> Scan
          </Button>
          <Button onClick={() => { setEditItem(null); setDialogOpen(true); }} className="bg-emerald-600 hover:bg-emerald-700">
            <Plus className="w-4 h-4 mr-1.5" /> Add Stock
          </Button>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-slate-200/80 overflow-hidden">
        {filtered.length === 0 ? (
          <EmptyState
            icon={Package}
            title="No inventory records"
            description="Start adding stock to track your warehouse and store inventory"
            actionLabel="Add Stock"
            onAction={() => { setEditItem(null); setDialogOpen(true); }}
          />
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="bg-slate-50/80">
                  <TableHead className="font-semibold text-xs">Product</TableHead>
                  <TableHead className="font-semibold text-xs">SKU</TableHead>
                  <TableHead className="font-semibold text-xs">Location</TableHead>
                  <TableHead className="font-semibold text-xs">Zone</TableHead>
                  <TableHead className="font-semibold text-xs text-right">Qty</TableHead>
                  <TableHead className="font-semibold text-xs">Batch</TableHead>
                  <TableHead className="font-semibold text-xs">Expiry</TableHead>
                  <TableHead className="font-semibold text-xs w-20"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map(item => {
                  const product = getProduct(item.product_id);
                  const isLow = product && item.quantity <= (product.min_stock_level || 10);
                  return (
                    <TableRow key={item.id} className="hover:bg-slate-50/50">
                      <TableCell className="font-medium text-sm">{item.product_name}</TableCell>
                      <TableCell className="text-xs font-mono text-slate-500">{item.sku}</TableCell>
                      <TableCell>
                        <div className="text-xs">
                          <span className={`inline-block px-1.5 py-0.5 rounded text-[10px] font-medium ${item.location_type === "warehouse" ? "bg-blue-50 text-blue-700" : "bg-violet-50 text-violet-700"}`}>
                            {item.location_type === "warehouse" ? "WH" : "Store"}
                          </span>
                          <span className="text-slate-500 ml-1.5">{item.location_name}</span>
                        </div>
                      </TableCell>
                      <TableCell><StatusBadge status={item.storage_zone} /></TableCell>
                      <TableCell className={`text-right text-sm font-semibold ${isLow ? "text-red-500" : "text-slate-800"}`}>
                        {item.quantity?.toLocaleString()} {product?.unit || ""}
                      </TableCell>
                      <TableCell className="text-xs text-slate-500">{item.batch_number || "—"}</TableCell>
                      <TableCell className="text-xs text-slate-500">
                        {item.expiry_date ? format(new Date(item.expiry_date), "dd MMM yyyy") : "—"}
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-1">
                          <Button variant="ghost" size="icon" className="h-7 w-7" title="Quick stock update" onClick={() => setStockUpdateItem(item)}>
                            <ScanLine className="w-3.5 h-3.5 text-emerald-500" />
                          </Button>
                          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => { setEditItem(item); setDialogOpen(true); }}>
                            <Pencil className="w-3.5 h-3.5 text-slate-500" />
                          </Button>
                          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => deleteMutation.mutate(item.id)}>
                            <Trash2 className="w-3.5 h-3.5 text-red-400" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        )}
      </div>

      {scannerOpen && (
        <BarcodeScanner
          onDetected={handleBarcodeDetected}
          onClose={() => setScannerOpen(false)}
        />
      )}

      <StockUpdateDialog
        open={!!stockUpdateItem}
        onOpenChange={(open) => { if (!open) setStockUpdateItem(null); }}
        inventoryItem={stockUpdateItem}
        product={stockUpdateItem ? products.find(p => p.id === stockUpdateItem.product_id) : null}
        onSave={handleStockUpdate}
        saving={updateMutation.isPending}
      />

      <InventoryFormDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        item={editItem}
        products={products}
        stores={stores}
        onSave={handleSave}
        saving={createMutation.isPending || updateMutation.isPending}
      />
    </div>
  );
}