import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Plus, Search, Pencil, Trash2, Package, ScanLine, History, Upload } from "lucide-react";
import { format } from "date-fns";
import StatusBadge from "../components/shared/StatusBadge";
import EmptyState from "../components/shared/EmptyState";
import { useRole } from "../components/shared/useRole";
import InventoryFormDialog from "../components/inventory/InventoryFormDialog";
import BarcodeScanner from "../components/inventory/BarcodeScanner";
import StockUpdateDialog from "../components/inventory/StockUpdateDialog";
import StockMovementHistory from "../components/inventory/StockMovementHistory";
import CsvImportDialog from "../components/inventory/CsvImportDialog";
import WarehouseFloorPlan from "../components/inventory/WarehouseFloorPlan";

export default function Inventory() {
  const [search, setSearch] = useState("");
  const [locFilter, setLocFilter] = useState("all");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editItem, setEditItem] = useState(null);
  const [scannerOpen, setScannerOpen] = useState(false);
  const [stockUpdateItem, setStockUpdateItem] = useState(null);
  const [historyItem, setHistoryItem] = useState(null);
  const [csvImportOpen, setCsvImportOpen] = useState(false);
  const [importing, setImporting] = useState(false);
  const queryClient = useQueryClient();

  const { user: currentUser, canWrite } = useRole();

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
  const logMovementMutation = useMutation({
    mutationFn: (data) => base44.entities.StockMovement.create(data),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.InventoryItem.update(id, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["inventory"] });
      queryClient.invalidateQueries({ queryKey: ["stockMovements", variables.id] });
      setDialogOpen(false);
      setStockUpdateItem(null);
    },
  });
  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.InventoryItem.delete(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["inventory"] }),
  });

  const logMovement = (item, newQty, mode, source) => {
    const before = item.quantity || 0;
    const after = newQty;
    let adjustmentType;
    if (mode === "add") adjustmentType = "in";
    else if (mode === "remove") adjustmentType = "out";
    else adjustmentType = "reset";

    logMovementMutation.mutate({
      inventory_item_id: item.id,
      product_name: item.product_name,
      sku: item.sku,
      location_name: item.location_name,
      adjustment_type: adjustmentType,
      quantity_before: before,
      quantity_change: after - before,
      quantity_after: after,
      source,
      performed_by: currentUser?.email || "unknown",
    });
  };

  const handleSave = (formData) => {
    if (editItem) {
      const prevQty = editItem.quantity || 0;
      const newQty = formData.quantity ?? prevQty;
      updateMutation.mutate({ id: editItem.id, data: formData });
      if (newQty !== prevQty) {
        logMovement(
          editItem,
          newQty,
          newQty > prevQty ? "add" : newQty < prevQty ? "remove" : "set",
          "form_update"
        );
      }
    } else {
      createMutation.mutate(formData);
    }
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

  const handleStockUpdate = (itemId, newQuantity, mode) => {
    const item = inventory.find(i => i.id === itemId);
    const source = scannerOpen ? "barcode_scan" : "manual_edit";
    updateMutation.mutate({ id: itemId, data: { quantity: newQuantity } });
    if (item) logMovement(item, newQuantity, mode || "set", source);
  };

  const filtered = inventory
    .filter(item => locFilter === "all" || item.location_type === locFilter)
    .filter(item =>
      item.product_name?.toLowerCase().includes(search.toLowerCase()) ||
      item.sku?.toLowerCase().includes(search.toLowerCase())
    );

  const getProduct = (id) => products.find(p => p.id === id);

  const handleCsvImport = async (rows) => {
    setImporting(true);
    for (const row of rows) {
      const data = {
        product_name: row.product_name,
        sku: row.sku,
        location_type: row.location_type,
        location_name: row.location_name || row.location_type,
        quantity: Number(row.quantity),
        storage_zone: row.storage_zone || undefined,
        batch_number: row.batch_number || undefined,
        expiry_date: row.expiry_date || undefined,
      };
      if (row._existing) {
        const before = row._existing.quantity || 0;
        const after = data.quantity;
        await base44.entities.InventoryItem.update(row._existing.id, data);
        if (before !== after) {
          await base44.entities.StockMovement.create({
            inventory_item_id: row._existing.id,
            product_name: data.product_name,
            sku: data.sku,
            location_name: data.location_name,
            adjustment_type: after > before ? "in" : "out",
            quantity_before: before,
            quantity_change: after - before,
            quantity_after: after,
            source: "form_update",
            performed_by: currentUser?.email || "csv_import",
            notes: "CSV bulk import",
          });
        }
      } else {
        await base44.entities.InventoryItem.create(data);
      }
    }
    queryClient.invalidateQueries({ queryKey: ["inventory"] });
    setImporting(false);
    setCsvImportOpen(false);
  };

  return (
    <div className="p-4 lg:p-6 max-w-7xl mx-auto space-y-4">
      <div className="flex flex-col gap-3">
        <div className="flex gap-2 items-center">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <Input placeholder="Search inventory..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9" />
          </div>
          <Tabs value={locFilter} onValueChange={setLocFilter}>
            <TabsList className="bg-slate-100">
              <TabsTrigger value="all" className="text-xs">All</TabsTrigger>
              <TabsTrigger value="warehouse" className="text-xs hidden sm:inline-flex">Warehouse</TabsTrigger>
              <TabsTrigger value="warehouse" className="text-xs sm:hidden">WH</TabsTrigger>
              <TabsTrigger value="store" className="text-xs">Store</TabsTrigger>
            </TabsList>
          </Tabs>
        </div>
        <div className="flex gap-2 flex-wrap">
          {canWrite && (
            <Button variant="outline" onClick={() => setScannerOpen(true)} className="border-emerald-200 text-emerald-700 hover:bg-emerald-50 flex-1 sm:flex-none">
              <ScanLine className="w-4 h-4 mr-1.5" /> Scan
            </Button>
          )}
          {canWrite && (
            <Button variant="outline" onClick={() => setCsvImportOpen(true)} className="border-slate-200 text-slate-600 hover:bg-slate-50 flex-1 sm:flex-none">
              <Upload className="w-4 h-4 mr-1.5" /> Import CSV
            </Button>
          )}
          {canWrite && (
            <Button onClick={() => { setEditItem(null); setDialogOpen(true); }} className="bg-emerald-600 hover:bg-emerald-700 flex-1 sm:flex-none">
              <Plus className="w-4 h-4 mr-1.5" /> Add Stock
            </Button>
          )}
        </div>
      </div>

      <WarehouseFloorPlan inventory={inventory} products={products} />

      <div className="bg-white rounded-xl border border-slate-200/80 overflow-hidden">
        {filtered.length === 0 ? (
          <EmptyState
            icon={Package}
            title="No inventory records"
            description="Start adding stock to track your warehouse and store inventory"
            actionLabel={canWrite ? "Add Stock" : undefined}
            onAction={canWrite ? () => { setEditItem(null); setDialogOpen(true); } : undefined}
          />
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="bg-slate-50/80">
                  <TableHead className="font-semibold text-xs sticky left-0 bg-slate-50 z-10 min-w-[130px]">Product</TableHead>
                  <TableHead className="font-semibold text-xs hidden sm:table-cell">SKU</TableHead>
                  <TableHead className="font-semibold text-xs">Location</TableHead>
                  <TableHead className="font-semibold text-xs hidden md:table-cell">Zone</TableHead>
                  <TableHead className="font-semibold text-xs text-right">Qty</TableHead>
                  <TableHead className="font-semibold text-xs hidden lg:table-cell">Batch</TableHead>
                  <TableHead className="font-semibold text-xs hidden lg:table-cell">Expiry</TableHead>
                  <TableHead className="font-semibold text-xs w-20"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map(item => {
                  const product = getProduct(item.product_id);
                  const isLow = product && item.quantity <= (product.min_stock_level || 10);
                  return (
                    <TableRow key={item.id} className="hover:bg-slate-50/50">
                      <TableCell className="font-medium text-sm sticky left-0 bg-white z-10 min-w-[130px]">{item.product_name}</TableCell>
                      <TableCell className="text-xs font-mono text-slate-500 hidden sm:table-cell">{item.sku}</TableCell>
                      <TableCell>
                        <div className="text-xs">
                          <span className={`inline-block px-1.5 py-0.5 rounded text-[10px] font-medium ${item.location_type === "warehouse" ? "bg-blue-50 text-blue-700" : "bg-violet-50 text-violet-700"}`}>
                            {item.location_type === "warehouse" ? "WH" : "Store"}
                          </span>
                          <span className="text-slate-500 ml-1.5 hidden sm:inline">{item.location_name}</span>
                        </div>
                      </TableCell>
                      <TableCell className="hidden md:table-cell"><StatusBadge status={item.storage_zone} /></TableCell>
                      <TableCell className={`text-right text-sm font-semibold ${isLow ? "text-red-500" : "text-slate-800"}`}>
                        {item.quantity?.toLocaleString()} {product?.unit || ""}
                      </TableCell>
                      <TableCell className="text-xs text-slate-500 hidden lg:table-cell">{item.batch_number || "—"}</TableCell>
                      <TableCell className="text-xs text-slate-500 hidden lg:table-cell">
                        {item.expiry_date ? format(new Date(item.expiry_date), "dd MMM yyyy") : "—"}
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-1">
                          {canWrite && (
                            <Button variant="ghost" size="icon" className="h-8 w-8" title="Quick stock update" onClick={() => setStockUpdateItem(item)}>
                              <ScanLine className="w-3.5 h-3.5 text-emerald-500" />
                            </Button>
                          )}
                          <Button variant="ghost" size="icon" className="h-8 w-8" title="View history" onClick={() => setHistoryItem(item)}>
                            <History className="w-3.5 h-3.5 text-slate-400" />
                          </Button>
                          {canWrite && (
                            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => { setEditItem(item); setDialogOpen(true); }}>
                              <Pencil className="w-3.5 h-3.5 text-slate-500" />
                            </Button>
                          )}
                          {canWrite && (
                            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => deleteMutation.mutate(item.id)}>
                              <Trash2 className="w-3.5 h-3.5 text-red-400" />
                            </Button>
                          )}
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

      <StockMovementHistory
        open={!!historyItem}
        onOpenChange={(open) => { if (!open) setHistoryItem(null); }}
        inventoryItem={historyItem}
      />

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

      <CsvImportDialog
        open={csvImportOpen}
        onOpenChange={setCsvImportOpen}
        inventory={inventory}
        onImport={handleCsvImport}
        importing={importing}
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