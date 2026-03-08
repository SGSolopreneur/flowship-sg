import { jsPDF } from "jspdf";
import { format } from "date-fns";

const BRAND_COLOR = [16, 185, 129]; // emerald-500
const DARK = [15, 23, 42];         // slate-900
const MID = [100, 116, 139];       // slate-500
const LIGHT = [248, 250, 252];     // slate-50
const BORDER = [226, 232, 240];    // slate-200

function addHeader(doc, title, subtitle) {
  const pageW = doc.internal.pageSize.getWidth();

  // Brand bar
  doc.setFillColor(...BRAND_COLOR);
  doc.rect(0, 0, pageW, 14, "F");

  // Logo text
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(9);
  doc.setFont("helvetica", "bold");
  doc.text("WarehouseSG", 14, 9.5);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(7);
  doc.text("Distribution Hub · Singapore", pageW - 14, 9.5, { align: "right" });

  // Title section
  doc.setTextColor(...DARK);
  doc.setFontSize(18);
  doc.setFont("helvetica", "bold");
  doc.text(title, 14, 30);

  doc.setFontSize(9);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(...MID);
  doc.text(subtitle, 14, 37);

  // Divider
  doc.setDrawColor(...BORDER);
  doc.setLineWidth(0.4);
  doc.line(14, 41, pageW - 14, 41);

  return 47; // return Y cursor after header
}

function addFooter(doc) {
  const pageW = doc.internal.pageSize.getWidth();
  const pageH = doc.internal.pageSize.getHeight();
  const pageCount = doc.internal.getNumberOfPages();

  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setDrawColor(...BORDER);
    doc.setLineWidth(0.3);
    doc.line(14, pageH - 12, pageW - 14, pageH - 12);
    doc.setFontSize(7);
    doc.setTextColor(...MID);
    doc.setFont("helvetica", "normal");
    doc.text(`Generated ${format(new Date(), "dd MMM yyyy, HH:mm")} SGT`, 14, pageH - 7);
    doc.text(`Page ${i} of ${pageCount}`, pageW - 14, pageH - 7, { align: "right" });
  }
}

function drawTable(doc, startY, columns, rows, opts = {}) {
  const pageW = doc.internal.pageSize.getWidth();
  const pageH = doc.internal.pageSize.getHeight();
  const marginL = 14;
  const marginR = 14;
  const usableW = pageW - marginL - marginR;
  const rowH = 8;
  const headerH = 9;
  let y = startY;

  // Calculate column widths
  const totalRatio = columns.reduce((s, c) => s + (c.ratio || 1), 0);
  const colWidths = columns.map(c => (usableW * (c.ratio || 1)) / totalRatio);

  const drawHeaderRow = (yPos) => {
    doc.setFillColor(241, 245, 249); // slate-100
    doc.rect(marginL, yPos, usableW, headerH, "F");
    doc.setDrawColor(...BORDER);
    doc.setLineWidth(0.3);
    doc.rect(marginL, yPos, usableW, headerH, "S");

    doc.setFont("helvetica", "bold");
    doc.setFontSize(7);
    doc.setTextColor(...DARK);

    let x = marginL;
    columns.forEach((col, i) => {
      const align = col.align || "left";
      const textX = align === "right" ? x + colWidths[i] - 2 : align === "center" ? x + colWidths[i] / 2 : x + 2;
      doc.text(col.header, textX, yPos + 6, { align });
      x += colWidths[i];
    });
    return yPos + headerH;
  };

  y = drawHeaderRow(y);

  rows.forEach((row, rowIdx) => {
    if (y + rowH > pageH - 18) {
      doc.addPage();
      y = 20;
      y = drawHeaderRow(y);
    }

    // Alternating rows
    if (rowIdx % 2 === 0) {
      doc.setFillColor(...LIGHT);
      doc.rect(marginL, y, usableW, rowH, "F");
    }

    doc.setDrawColor(...BORDER);
    doc.setLineWidth(0.2);
    doc.line(marginL, y + rowH, marginL + usableW, y + rowH);

    doc.setFont("helvetica", "normal");
    doc.setFontSize(7.5);
    doc.setTextColor(...DARK);

    let x = marginL;
    columns.forEach((col, i) => {
      const val = row[col.key] ?? "—";
      const align = col.align || "left";
      const textX = align === "right" ? x + colWidths[i] - 2 : align === "center" ? x + colWidths[i] / 2 : x + 2;
      const cellText = String(val).substring(0, col.maxLen || 40);
      if (col.color) {
        doc.setTextColor(...col.color(row));
      } else {
        doc.setTextColor(...DARK);
      }
      doc.text(cellText, textX, y + 5.5, { align });
      x += colWidths[i];
    });

    y += rowH;
  });

  return y;
}

function addSummaryBoxes(doc, startY, boxes) {
  const pageW = doc.internal.pageSize.getWidth();
  const marginL = 14;
  const usableW = pageW - marginL * 2;
  const boxW = (usableW - (boxes.length - 1) * 4) / boxes.length;
  let x = marginL;
  const boxH = 18;

  boxes.forEach(box => {
    doc.setFillColor(...LIGHT);
    doc.setDrawColor(...BORDER);
    doc.setLineWidth(0.3);
    doc.roundedRect(x, startY, boxW, boxH, 2, 2, "FD");

    doc.setFontSize(7);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(...MID);
    doc.text(box.label.toUpperCase(), x + boxW / 2, startY + 6, { align: "center" });

    doc.setFontSize(13);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(...DARK);
    doc.text(String(box.value), x + boxW / 2, startY + 14, { align: "center" });

    x += boxW + 4;
  });

  return startY + boxH + 6;
}

// ─── PUBLIC GENERATORS ────────────────────────────────────────────────────────

export function generateStockSummaryPDF({ inventory, products, stores }) {
  const doc = new jsPDF({ orientation: "landscape", unit: "mm", format: "a4" });
  const today = format(new Date(), "dd MMM yyyy");
  let y = addHeader(doc, "Daily Stock Summary", `Report Date: ${today}`);

  // Summary boxes
  const warehouseItems = inventory.filter(i => i.location_type === "warehouse");
  const storeItems = inventory.filter(i => i.location_type === "store");
  const totalQty = inventory.reduce((s, i) => s + (i.quantity || 0), 0);
  const lowStock = warehouseItems.filter(i => {
    const p = products.find(p => p.id === i.product_id);
    return p && i.quantity <= (p.min_stock_level || 10);
  }).length;

  y = addSummaryBoxes(doc, y, [
    { label: "Total SKUs", value: inventory.length },
    { label: "Total Units", value: totalQty.toLocaleString() },
    { label: "Warehouse Items", value: warehouseItems.length },
    { label: "Store Items", value: storeItems.length },
    { label: "Low Stock Alerts", value: lowStock },
  ]);

  const rows = inventory.map(item => {
    const product = products.find(p => p.id === item.product_id);
    const isLow = product && item.quantity <= (product.min_stock_level || 10);
    return {
      product_name: item.product_name,
      sku: item.sku || "—",
      location: item.location_name || "—",
      type: item.location_type === "warehouse" ? "Warehouse" : "Store",
      zone: item.storage_zone || "—",
      quantity: `${(item.quantity || 0).toLocaleString()} ${product?.unit || ""}`,
      min_level: product?.min_stock_level ?? "—",
      status: isLow ? "⚠ Low" : "OK",
      expiry: item.expiry_date ? format(new Date(item.expiry_date), "dd MMM yyyy") : "—",
      _isLow: isLow,
    };
  });

  drawTable(doc, y, [
    { header: "Product", key: "product_name", ratio: 2.5 },
    { header: "SKU", key: "sku", ratio: 1.2, align: "center" },
    { header: "Location", key: "location", ratio: 1.5 },
    { header: "Type", key: "type", ratio: 1, align: "center" },
    { header: "Zone", key: "zone", ratio: 1, align: "center" },
    { header: "Quantity", key: "quantity", ratio: 1.2, align: "right" },
    { header: "Min Level", key: "min_level", ratio: 0.8, align: "center" },
    {
      header: "Status", key: "status", ratio: 0.9, align: "center",
      color: (row) => row._isLow ? [239, 68, 68] : [16, 185, 129],
    },
    { header: "Expiry", key: "expiry", ratio: 1.2, align: "center" },
  ], rows);

  addFooter(doc);
  doc.save(`stock-summary-${format(new Date(), "yyyy-MM-dd")}.pdf`);
}

export function generateTransferManifestPDF({ transfers, filter = "all" }) {
  const doc = new jsPDF({ orientation: "landscape", unit: "mm", format: "a4" });
  const today = format(new Date(), "dd MMM yyyy");
  const filterLabel = filter === "all" ? "All Statuses" : filter.replace(/_/g, " ").replace(/\b\w/g, l => l.toUpperCase());
  let y = addHeader(doc, "Transfer Manifest", `Report Date: ${today} · Filter: ${filterLabel}`);

  const data = filter === "all" ? transfers : transfers.filter(t => t.status === filter);

  const statusCounts = {};
  data.forEach(t => { statusCounts[t.status] = (statusCounts[t.status] || 0) + 1; });
  const totalItems = data.reduce((s, t) => s + (t.total_items_count || t.items?.length || 0), 0);

  y = addSummaryBoxes(doc, y, [
    { label: "Total Orders", value: data.length },
    { label: "Total Line Items", value: totalItems },
    { label: "Pending", value: (statusCounts["draft"] || 0) + (statusCounts["confirmed"] || 0) },
    { label: "In Transit", value: (statusCounts["in_transit"] || 0) + (statusCounts["dispatched"] || 0) },
    { label: "Delivered", value: statusCounts["delivered"] || 0 },
  ]);

  const rows = data.map(t => ({
    order_number: t.order_number,
    destination: t.store_name,
    status: (t.status || "").replace(/_/g, " ").toUpperCase(),
    priority: (t.priority || "normal").toUpperCase(),
    items: t.total_items_count || t.items?.length || 0,
    vehicle: t.vehicle_number || "—",
    driver: t.driver_name || "—",
    dispatch: t.dispatch_date ? format(new Date(t.dispatch_date), "dd MMM yyyy") : "—",
    delivery: t.requested_delivery_date ? format(new Date(t.requested_delivery_date), "dd MMM yyyy") : "—",
    actual: t.actual_delivery_date ? format(new Date(t.actual_delivery_date), "dd MMM yyyy") : "—",
    notes: t.notes || "—",
    _status: t.status,
  }));

  drawTable(doc, y, [
    { header: "Order #", key: "order_number", ratio: 1.2 },
    { header: "Destination", key: "destination", ratio: 1.5 },
    {
      header: "Status", key: "status", ratio: 1.2, align: "center",
      color: (row) => {
        const s = row._status;
        if (s === "delivered") return [16, 185, 129];
        if (s === "cancelled") return [239, 68, 68];
        if (s === "in_transit" || s === "dispatched") return [59, 130, 246];
        return [...DARK];
      },
    },
    { header: "Priority", key: "priority", ratio: 0.9, align: "center" },
    { header: "Items", key: "items", ratio: 0.6, align: "center" },
    { header: "Vehicle", key: "vehicle", ratio: 1 },
    { header: "Driver", key: "driver", ratio: 1 },
    { header: "Dispatch", key: "dispatch", ratio: 1.1, align: "center" },
    { header: "Req. Delivery", key: "delivery", ratio: 1.1, align: "center" },
    { header: "Actual Delivery", key: "actual", ratio: 1.1, align: "center" },
  ], rows);

  // Per-order item breakdown on new pages if there are items
  data.forEach(order => {
    if (!order.items?.length) return;
    doc.addPage();
    let iy = addHeader(doc, `Manifest: ${order.order_number}`, `${order.store_name} · ${filterLabel}`);

    iy = addSummaryBoxes(doc, iy, [
      { label: "Status", value: (order.status || "").replace(/_/g, " ") },
      { label: "Priority", value: order.priority || "normal" },
      { label: "Vehicle", value: order.vehicle_number || "—" },
      { label: "Driver", value: order.driver_name || "—" },
    ]);

    const itemRows = order.items.map(i => ({
      product_name: i.product_name,
      sku: i.sku || "—",
      requested: i.quantity_requested ?? "—",
      picked: i.quantity_picked ?? "—",
      received: i.quantity_received ?? "—",
      unit: i.unit || "—",
    }));

    drawTable(doc, iy, [
      { header: "Product", key: "product_name", ratio: 3 },
      { header: "SKU", key: "sku", ratio: 1.5, align: "center" },
      { header: "Requested", key: "requested", ratio: 1, align: "right" },
      { header: "Picked", key: "picked", ratio: 1, align: "right" },
      { header: "Received", key: "received", ratio: 1, align: "right" },
      { header: "Unit", key: "unit", ratio: 0.8, align: "center" },
    ], itemRows);
  });

  addFooter(doc);
  doc.save(`transfer-manifest-${format(new Date(), "yyyy-MM-dd")}.pdf`);
}

export function generateSupplierPerformancePDF({ suppliers }) {
  const doc = new jsPDF({ orientation: "landscape", unit: "mm", format: "a4" });
  const today = format(new Date(), "dd MMM yyyy");
  let y = addHeader(doc, "Supplier Performance Report", `Report Date: ${today}`);

  const active = suppliers.filter(s => s.status === "active").length;
  const rated = suppliers.filter(s => s.performance_rating);
  const avgRating = rated.length
    ? (rated.reduce((s, x) => s + x.performance_rating, 0) / rated.length).toFixed(1)
    : "—";
  const avgOTD = suppliers.filter(s => s.on_time_delivery_pct != null).length
    ? (suppliers.filter(s => s.on_time_delivery_pct != null)
        .reduce((s, x) => s + x.on_time_delivery_pct, 0) /
        suppliers.filter(s => s.on_time_delivery_pct != null).length).toFixed(1) + "%"
    : "—";
  const avgLead = suppliers.length
    ? (suppliers.reduce((s, x) => s + (x.lead_time_days || 0), 0) / suppliers.length).toFixed(1) + "d"
    : "—";

  y = addSummaryBoxes(doc, y, [
    { label: "Total Suppliers", value: suppliers.length },
    { label: "Active", value: active },
    { label: "Avg Rating", value: avgRating + " / 5" },
    { label: "Avg On-Time Delivery", value: avgOTD },
    { label: "Avg Lead Time", value: avgLead },
  ]);

  const rows = suppliers.map(s => ({
    name: s.name,
    code: s.code,
    country: s.country || "—",
    status: (s.status || "—").replace(/_/g, " "),
    lead_time: s.lead_time_days != null ? `${s.lead_time_days}d` : "—",
    payment: s.payment_terms ? s.payment_terms.replace(/_/g, " ").toUpperCase() : "—",
    rating: s.performance_rating != null ? `${Number(s.performance_rating).toFixed(1)} / 5` : "—",
    otd: s.on_time_delivery_pct != null ? `${s.on_time_delivery_pct}%` : "—",
    quality: s.quality_score != null ? `${Number(s.quality_score).toFixed(1)} / 5` : "—",
    orders: s.total_orders ?? 0,
    _status: s.status,
    _rating: s.performance_rating,
  }));

  // Sort by rating desc
  rows.sort((a, b) => (b._rating || 0) - (a._rating || 0));

  drawTable(doc, y, [
    { header: "Supplier", key: "name", ratio: 2 },
    { header: "Code", key: "code", ratio: 1, align: "center" },
    { header: "Country", key: "country", ratio: 1 },
    {
      header: "Status", key: "status", ratio: 1, align: "center",
      color: (row) => row._status === "active" ? [16, 185, 129] : row._status === "on_hold" ? [245, 158, 11] : [...MID],
    },
    { header: "Lead Time", key: "lead_time", ratio: 0.9, align: "center" },
    { header: "Payment", key: "payment", ratio: 0.9, align: "center" },
    {
      header: "Rating", key: "rating", ratio: 1, align: "center",
      color: (row) => {
        if (!row._rating) return [...MID];
        return row._rating >= 4 ? [16, 185, 129] : row._rating >= 3 ? [245, 158, 11] : [239, 68, 68];
      },
    },
    { header: "On-Time Del.", key: "otd", ratio: 1, align: "center" },
    { header: "Quality", key: "quality", ratio: 0.9, align: "center" },
    { header: "Total Orders", key: "orders", ratio: 0.9, align: "center" },
  ], rows);

  addFooter(doc);
  doc.save(`supplier-performance-${format(new Date(), "yyyy-MM-dd")}.pdf`);
}