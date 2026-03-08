import { createClientFromRequest } from 'npm:@base44/sdk@0.8.20';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const { suggestions, procurementEmail, products, suppliers } = await req.json();

    if (!suggestions?.length) {
      return Response.json({ error: 'No suggestions provided' }, { status: 400 });
    }

    // Build PO number
    const poNumber = `PO-${Date.now().toString().slice(-8)}`;

    // Build line items enriched with product data
    const items = suggestions.map((s) => {
      const product = (products || []).find((p) => p.id === s.product_id);
      return {
        product_id: s.product_id || '',
        product_name: s.product_name,
        sku: s.sku || '',
        quantity: s.suggestedQty,
        unit: s.unit || 'pcs',
        unit_cost: product?.unit_cost || 0,
        supplier: product?.supplier || 'TBD',
      };
    });

    const totalValue = items.reduce((sum, i) => sum + (i.unit_cost * i.quantity), 0);

    const itemsSummary = items
      .map((i) => `• ${i.product_name} (${i.sku}) — ${i.quantity} ${i.unit} @ SGD ${i.unit_cost.toFixed(2)} each (Supplier: ${i.supplier})`)
      .join('\n');

    // Create the draft PO
    const po = await base44.asServiceRole.entities.PurchaseOrder.create({
      po_number: poNumber,
      status: 'draft',
      source: 'auto_reorder',
      items,
      total_value: parseFloat(totalValue.toFixed(2)),
      notes: `Auto-generated reorder based on stock analysis. Triggered by ${user.email}.`,
      requested_by: user.email,
      procurement_manager_email: procurementEmail || '',
    });

    // Send email notification
    if (procurementEmail) {
      await base44.asServiceRole.integrations.Core.SendEmail({
        to: procurementEmail,
        subject: `[Action Required] Draft Purchase Order ${poNumber} — ${items.length} item(s) need reorder`,
        body: `Hello,

A new draft Purchase Order has been automatically created based on low stock predictions from the WarehouseSG dashboard.

Purchase Order: ${poNumber}
Status: Draft (awaiting your review)
Requested by: ${user.email}
Estimated Total Value: SGD ${totalValue.toFixed(2)}

Items to Reorder:
${itemsSummary}

Please log in to WarehouseSG to review, edit, and approve this purchase order.

This notification was generated automatically by the inventory management system.

Regards,
WarehouseSG`,
      });
    }

    return Response.json({ success: true, po_number: poNumber, po_id: po.id });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});