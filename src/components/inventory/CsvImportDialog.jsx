import React, { useState, useRef } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Upload, Download, CheckCircle2, XCircle, AlertTriangle, FileText } from "lucide-react";

const TEMPLATE_HEADERS = [
  "product_name", "sku", "location_type", "location_name",
  "quantity", "storage_zone", "batch_number", "expiry_date"
];

const SAMPLE_ROWS = [
  ["Nasi Lemak Pack", "NL-001", "warehouse", "Main Warehouse", "150", "ambient", "BATCH-001", "2026-12-31"],
  ["Fresh Milk 1L", "FM-1L", "store", "Tampines Mall", "40", "chilled", "BATCH-002", "2026-04-15"],
];

function downloadTemplate() {
  const rows = [TEMPLATE_HEADERS, ...SAMPLE_ROWS];
  const csv = rows.map(r => r.map(v => `"${v}"`).join(",")).join("\n");
  const blob = new Blob([csv], { type: "text/csv" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "inventory_import_template.csv";
  a.click();
  URL.revokeObjectURL(url);
}

function parseCsv(text) {
  const lines = text.trim().split("\n").filter(Boolean);
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

function validateRow(row, idx) {
  const errors = [];
  if (!row.product_name) errors.push("product_name is required");
  if (!row.sku) errors.push("sku is required");
  if (!["warehouse", "store"].includes(row.location_type)) errors.push("location_type must be 'warehouse' or 'store'");
  if (isNaN(Number(row.quantity)) || row.quantity === "") errors.push("quantity must be a number");
  if (row.storage_zone && !["ambient", "chilled", "frozen"].includes(row.storage_zone)) errors.push("storage_zone must be ambient, chilled, or frozen");
  return errors;
}

export default function CsvImportDialog({ open, onOpenChange, inventory, onImport, importing }) {
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
        const errors = validateRow(row, i);
        // Determine if it's an update (matching SKU + location) or new
        const existing = inventory.find(
          inv => inv.sku?.toLowerCase() === row.sku?.toLowerCase() &&
                 inv.location_name?.toLowerCase() === row.location_name?.toLowerCase()
        );
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
    if (file && file.name.endsWith(".csv")) handleFile(file);
  };

  const validRows = parsed?.filter(r => r._errors.length === 0) || [];
  const errorRows = parsed?.filter(r => r._errors.length > 0) || [];
  const updates = validRows.filter(r => r._existing);
  const creates = validRows.filter(r => !r._existing);

  const handleImport = () => {
    onImport(validRows);
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
            <Upload className="w-4 h-4 text-emerald-600" /> Import Inventory from CSV
          </DialogTitle>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto space-y-4 py-2">
          {/* Download template */}
          <div className="flex items-center justify-between bg-slate-50 rounded-lg px-4 py-3 border border-slate-200">
            <div>
              <p className="text-sm font-medium text-slate-700">Need a template?</p>
              <p className="text-xs text-slate-500 mt-0.5">Download the CSV template with sample data</p>
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
              <FileText className="w-10 h-10 text-slate-300 mx-auto mb-3" />
              <p className="text-sm font-medium text-slate-600">Drop your CSV file here or click to browse</p>
              <p className="text-xs text-slate-400 mt-1">Supports .csv files only</p>
              <input ref={fileRef} type="file" accept=".csv" className="hidden" onChange={e => handleFile(e.target.files[0])} />
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
                  <CheckCircle2 className="w-3.5 h-3.5" /> {creates.length} new records
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
                <div className="bg-red-50 border border-red-100 rounded-lg p-3 space-y-1.5">
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
                          <th className="text-left px-3 py-2 text-slate-500 font-semibold">Product</th>
                          <th className="text-left px-3 py-2 text-slate-500 font-semibold">SKU</th>
                          <th className="text-left px-3 py-2 text-slate-500 font-semibold">Location</th>
                          <th className="text-right px-3 py-2 text-slate-500 font-semibold">Qty</th>
                          <th className="text-left px-3 py-2 text-slate-500 font-semibold">Action</th>
                        </tr>
                      </thead>
                      <tbody>
                        {validRows.map((r, i) => (
                          <tr key={i} className="border-t border-slate-100">
                            <td className="px-3 py-1.5 font-medium text-slate-700">{r.product_name}</td>
                            <td className="px-3 py-1.5 font-mono text-slate-500">{r.sku}</td>
                            <td className="px-3 py-1.5 text-slate-500">{r.location_name || r.location_type}</td>
                            <td className="px-3 py-1.5 text-right font-semibold text-slate-700">{r.quantity}</td>
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
            {importing ? "Importing..." : `Import ${validRows.length} row${validRows.length !== 1 ? "s" : ""}`}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}