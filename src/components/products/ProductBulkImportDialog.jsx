import React, { useState, useRef } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Upload, Download, CheckCircle2, XCircle, AlertTriangle, FileText, Sheet } from "lucide-react";

const TEMPLATE_HEADERS = [
  "name", "sku", "category", "unit", "unit_cost", "min_stock_level",
  "storage_type", "shelf_life_days", "supplier", "is_halal_certified", "image_url"
];

const SAMPLE_ROWS = [
  ["Nasi Lemak Pack", "NL-001", "ready_to_eat", "pcs", "2.50", "30", "ambient", "3", "Local Foods Pte Ltd", "true", ""],
  ["Fresh Milk 1L", "FM-1L", "dairy", "L", "3.20", "50", "chilled", "7", "SG Dairy", "false", ""],
];

const VALID_CATEGORIES = ["fresh_produce", "frozen", "dairy", "beverages", "dry_goods", "snacks", "halal_meat", "seafood", "bakery", "household", "personal_care", "baby_products", "ready_to_eat", "condiments", "other"];
const VALID_UNITS = ["pcs", "kg", "g", "L", "mL", "carton", "pack", "box", "tray", "bundle"];
const VALID_STORAGE = ["ambient", "chilled", "frozen"];

function downloadTemplate() {
  const rows = [TEMPLATE_HEADERS, ...SAMPLE_ROWS];
  const csv = rows.map(r => r.map(v => `"${v}"`).join(",")).join("\n");
  const blob = new Blob([csv], { type: "text/csv" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "product_catalog_template.csv";
  a.click();
  URL.revokeObjectURL(url);
}

function parseCsv(text) {
  const lines = text.trim().split(/\r?\n/).filter(Boolean);
  if (lines.length < 2) return { headers: [], rows: [] };
  const headers = lines[0].split(",").map(h => h.replace(/["\r]/g, "").trim().toLowerCase());
  const rows = lines.slice(1).map(line => {
    const cols = [];
    let cur = "", inQuotes = false;
    for (const ch of line) {
      if (ch === '"') { inQuotes = !inQuotes; }
      else if (ch === "," && !inQuotes) { cols.push(cur.trim()); cur = ""; }
      else { cur += ch; }
    }
    cols.push(cur.replace(/\r/g, "").trim());
    return Object.fromEntries(headers.map((h, i) => [h, cols[i] ?? ""]));
  });
  return { headers, rows };
}

function validateRow(row) {
  const errors = [];
  if (!row.name) errors.push("name is required");
  if (!row.sku) errors.push("sku is required");
  if (!row.category) errors.push("category is required");
  else if (!VALID_CATEGORIES.includes(row.category)) errors.push(`category must be one of: ${VALID_CATEGORIES.join(", ")}`);
  if (row.unit && !VALID_UNITS.includes(row.unit)) errors.push(`unit must be one of: ${VALID_UNITS.join(", ")}`);
  if (row.storage_type && !VALID_STORAGE.includes(row.storage_type)) errors.push(`storage_type must be ambient, chilled, or frozen`);
  if (row.unit_cost && isNaN(Number(row.unit_cost))) errors.push("unit_cost must be a number");
  if (row.min_stock_level && isNaN(Number(row.min_stock_level))) errors.push("min_stock_level must be a number");
  if (row.shelf_life_days && isNaN(Number(row.shelf_life_days))) errors.push("shelf_life_days must be a number");
  return errors;
}

function normalizeRow(row) {
  return {
    name: row.name,
    sku: row.sku,
    category: row.category,
    unit: row.unit || undefined,
    unit_cost: row.unit_cost ? Number(row.unit_cost) : undefined,
    min_stock_level: row.min_stock_level ? Number(row.min_stock_level) : undefined,
    storage_type: row.storage_type || undefined,
    shelf_life_days: row.shelf_life_days ? Number(row.shelf_life_days) : undefined,
    supplier: row.supplier || undefined,
    is_halal_certified: row.is_halal_certified === "true" || row.is_halal_certified === "1",
    image_url: row.image_url || undefined,
  };
}

export default function ProductBulkImportDialog({ open, onOpenChange, products, onImport, importing }) {
  const [parsed, setParsed] = useState(null);
  const [fileName, setFileName] = useState("");
  const [dragOver, setDragOver] = useState(false);
  const fileRef = useRef();

  const handleFile = (file) => {
    if (!file) return;
    setFileName(file.name);
    const reader = new FileReader();
    reader.onload = (e) => {
      const { rows } = parseCsv(e.target.result);
      const validated = rows.map((row, i) => {
        const errors = validateRow(row);
        const existing = products.find(p => p.sku?.toLowerCase() === row.sku?.toLowerCase());
        return { ...row, _errors: errors, _existing: existing || null, _idx: i + 2 };
      });
      setParsed(validated);
    };
    reader.readAsText(file);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file && (file.name.endsWith(".csv") || file.name.endsWith(".tsv"))) handleFile(file);
  };

  const validRows = parsed?.filter(r => r._errors.length === 0) || [];
  const errorRows = parsed?.filter(r => r._errors.length > 0) || [];
  const updates = validRows.filter(r => r._existing);
  const creates = validRows.filter(r => !r._existing);

  const handleImport = () => {
    onImport(validRows.map(normalizeRow), validRows.map(r => r._existing?.id));
  };

  const reset = () => {
    setParsed(null);
    setFileName("");
  };

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) reset(); onOpenChange(v); }}>
      <DialogContent className="max-w-2xl max-h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sheet className="w-4 h-4 text-emerald-600" /> Bulk Import Product Catalog
          </DialogTitle>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto space-y-4 py-2">
          {/* Download template */}
          <div className="flex items-center justify-between bg-emerald-50 rounded-lg px-4 py-3 border border-emerald-200">
            <div>
              <p className="text-sm font-medium text-slate-700">Need a template?</p>
              <p className="text-xs text-slate-500 mt-0.5">Download the CSV — works with Google Sheets (File → Download → CSV)</p>
            </div>
            <Button variant="outline" size="sm" onClick={downloadTemplate} className="gap-1.5">
              <Download className="w-3.5 h-3.5" /> Template
            </Button>
          </div>

          {/* Drop zone */}
          {!parsed && (
            <div
              className={`border-2 border-dashed rounded-xl p-10 text-center cursor-pointer transition-colors ${dragOver ? "border-emerald-400 bg-emerald-50" : "border-slate-200 hover:border-emerald-300 hover:bg-slate-50"}`}
              onClick={() => fileRef.current.click()}
              onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
              onDragLeave={() => setDragOver(false)}
              onDrop={handleDrop}
            >
              <Sheet className="w-10 h-10 text-slate-300 mx-auto mb-3" />
              <p className="text-sm font-medium text-slate-600">Drop your CSV file here or click to browse</p>
              <p className="text-xs text-slate-400 mt-1">Export from Google Sheets as CSV, then upload here</p>
              <input ref={fileRef} type="file" accept=".csv,.tsv,text/csv" className="hidden" onChange={e => handleFile(e.target.files[0])} />
            </div>
          )}

          {/* Results preview */}
          {parsed && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <p className="text-sm font-medium text-slate-700 flex items-center gap-2">
                  <FileText className="w-4 h-4 text-slate-400" /> {fileName}
                </p>
                <Button variant="ghost" size="sm" onClick={reset} className="text-xs text-slate-500">Change file</Button>
              </div>

              {/* Summary chips */}
              <div className="flex flex-wrap gap-2">
                <span className="inline-flex items-center gap-1 text-xs font-medium bg-emerald-50 text-emerald-700 px-2.5 py-1 rounded-full">
                  <CheckCircle2 className="w-3.5 h-3.5" /> {creates.length} new products
                </span>
                <span className="inline-flex items-center gap-1 text-xs font-medium bg-blue-50 text-blue-700 px-2.5 py-1 rounded-full">
                  <CheckCircle2 className="w-3.5 h-3.5" /> {updates.length} updates
                </span>
                {errorRows.length > 0 && (
                  <span className="inline-flex items-center gap-1 text-xs font-medium bg-red-50 text-red-600 px-2.5 py-1 rounded-full">
                    <XCircle className="w-3.5 h-3.5" /> {errorRows.length} errors (skipped)
                  </span>
                )}
              </div>

              {/* Error details */}
              {errorRows.length > 0 && (
                <div className="bg-red-50 border border-red-100 rounded-lg p-3 space-y-1.5 max-h-32 overflow-y-auto">
                  <p className="text-xs font-semibold text-red-700 flex items-center gap-1.5">
                    <AlertTriangle className="w-3.5 h-3.5" /> Rows with errors (will be skipped)
                  </p>
                  {errorRows.map(r => (
                    <p key={r._idx} className="text-xs text-red-600">Row {r._idx}: {r._errors.join(", ")}</p>
                  ))}
                </div>
              )}

              {/* Valid rows preview */}
              {validRows.length > 0 && (
                <div className="border border-slate-200 rounded-lg overflow-hidden">
                  <div className="overflow-x-auto max-h-52">
                    <table className="w-full text-xs">
                      <thead className="bg-slate-50 sticky top-0">
                        <tr>
                          <th className="text-left px-3 py-2 text-slate-500 font-semibold">Name</th>
                          <th className="text-left px-3 py-2 text-slate-500 font-semibold">SKU</th>
                          <th className="text-left px-3 py-2 text-slate-500 font-semibold">Category</th>
                          <th className="text-left px-3 py-2 text-slate-500 font-semibold">Action</th>
                        </tr>
                      </thead>
                      <tbody>
                        {validRows.map((r, i) => (
                          <tr key={i} className="border-t border-slate-100">
                            <td className="px-3 py-1.5 font-medium text-slate-700">{r.name}</td>
                            <td className="px-3 py-1.5 font-mono text-slate-500">{r.sku}</td>
                            <td className="px-3 py-1.5 text-slate-500">{r.category}</td>
                            <td className="px-3 py-1.5">
                              {r._existing ? (
                                <span className="text-blue-600 font-medium">Update</span>
                              ) : (
                                <span className="text-emerald-600 font-medium">Create</span>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        <DialogFooter className="pt-2 border-t border-slate-100">
          <Button variant="outline" onClick={() => { reset(); onOpenChange(false); }}>Cancel</Button>
          <Button
            onClick={handleImport}
            disabled={!parsed || validRows.length === 0 || importing}
            className="bg-emerald-600 hover:bg-emerald-700 min-w-28"
          >
            {importing ? "Importing..." : `Import ${validRows.length} product${validRows.length !== 1 ? "s" : ""}`}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}