import { createClientFromRequest } from 'npm:@base44/sdk@0.8.20';

// --- Approval thresholds ---
const APPROVAL_THRESHOLD_SGD = 5000;   // Flag if total value exceeds this
const LOW_RATING_THRESHOLD = 3.0;       // Flag if any supplier rating is below this

// Generate a simple secure random token
function generateToken() {
  const bytes = new Uint8Array(24);
  crypto.getRandomValues(bytes);
  return Array.from(bytes).map(b => b.toString(16).padStart(2, '0')).join('');
}

// Determine the base URL for approval links (from request origin or env)
function getBaseUrl(req) {
  const appId = Deno.env.get('BASE44_APP_ID') || '';
  // Use the function's own URL origin as the base
  const url = new URL(req.url);
  return `${url.origin}`;
}

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

    // Build line items enriched with product & supplier data
    const items = suggestions.map((s) => {
      const product = (products || []).find((p) => p.id === s.product_id);
      const supplier = (suppliers || []).find(sup => sup.name === product?.supplier && sup.status === 'active');
      return {
        product_id: s.product_id || '',
        product_name: s.product_name,
        sku: s.sku || '',
        quantity: s.suggestedQty,
        unit: s.unit || 'pcs',
        unit_cost: product?.unit_cost || 0,
        supplier: supplier?.name || product?.supplier || 'TBD',
        supplier_rating: supplier?.performance_rating || null,
        lead_time_days: supplier?.lead_time_days || s.leadTimeDays || 3,
        min_order_quantity: supplier?.min_order_quantity || 1,
      };
    });

    const totalValue = items.reduce((sum, i) => sum + (i.unit_cost * i.quantity), 0);

    // --- Flagging logic ---
    const flagReasons = [];
    if (totalValue > APPROVAL_THRESHOLD_SGD) {
      flagReasons.push(`Total value SGD ${totalValue.toFixed(2)} exceeds approval threshold of SGD ${APPROVAL_THRESHOLD_SGD.toFixed(2)}`);
    }
    const lowRatedSuppliers = items
      .filter(i => i.supplier_rating !== null && i.supplier_rating < LOW_RATING_THRESHOLD)
      .map(i => `${i.supplier} (rating: ${i.supplier_rating}/5)`);
    if (lowRatedSuppliers.length > 0) {
      flagReasons.push(`Low-rated supplier(s): ${[...new Set(lowRatedSuppliers)].join(', ')}`);
    }

    const isFlagged = flagReasons.length > 0;
    const poStatus = isFlagged ? 'pending_approval' : 'submitted';
    const approvalToken = isFlagged ? generateToken() : '';

    const itemsSummary = items
      .map((i) => {
        const ratingNote = i.supplier_rating !== null && i.supplier_rating < LOW_RATING_THRESHOLD
          ? ` ⚠️ LOW RATING (${i.supplier_rating}/5)`
          : '';
        return `• ${i.product_name} (${i.sku}) — ${i.quantity} ${i.unit} @ SGD ${i.unit_cost.toFixed(2)} each\n  Supplier: ${i.supplier}${ratingNote} | Lead time: ${i.lead_time_days}d | Min order: ${i.min_order_quantity} ${i.unit}`;
      })
      .join('\n');

    // Create the PO record
    const po = await base44.asServiceRole.entities.PurchaseOrder.create({
      po_number: poNumber,
      status: poStatus,
      source: 'auto_reorder',
      items,
      total_value: parseFloat(totalValue.toFixed(2)),
      notes: `Auto-generated reorder based on stock analysis. Triggered by ${user.email}.`,
      requested_by: user.email,
      procurement_manager_email: procurementEmail || '',
      flagged: isFlagged,
      flagged_reason: flagReasons.join(' | '),
      approval_token: approvalToken,
    });

    // Build approval links if flagged
    const baseUrl = getBaseUrl(req);
    const approveUrl = `${baseUrl}/?function=approvePurchaseOrder&token=${approvalToken}&action=approve&approver=${encodeURIComponent(procurementEmail || '')}`;
    const rejectUrl = `${baseUrl}/?function=approvePurchaseOrder&token=${approvalToken}&action=reject&approver=${encodeURIComponent(procurementEmail || '')}`;

    // Send email notification
    if (procurementEmail) {
      const subject = isFlagged
        ? `🚨 [Approval Required] Purchase Order ${poNumber} — SGD ${totalValue.toFixed(2)}`
        : `[Action Required] Draft Purchase Order ${poNumber} — ${items.length} item(s) need reorder`;

      const flaggedSection = isFlagged ? `
⚠️  THIS ORDER REQUIRES YOUR APPROVAL
Reason(s):
${flagReasons.map(r => `  • ${r}`).join('\n')}

To APPROVE this order, click:
${approveUrl}

To REJECT this order, click:
${rejectUrl}

These links are single-use and will expire once actioned.
──────────────────────────────────────────
` : '';

      const body = `Hello,

A new Purchase Order has been automatically created based on low stock predictions from the WarehouseSG system.

Purchase Order: ${poNumber}
Status: ${isFlagged ? '🔴 Pending Approval (manual review required)' : '🟡 Submitted (no flags detected)'}
Requested by: ${user.email}
Estimated Total Value: SGD ${totalValue.toFixed(2)}
${flaggedSection}
Items to Reorder:
${itemsSummary}

${isFlagged
  ? 'Please review and use the links above to approve or reject, or log in to WarehouseSG.'
  : 'Please log in to WarehouseSG to review and finalise this purchase order.'}

Regards,
WarehouseSG`;

      await base44.asServiceRole.integrations.Core.SendEmail({
        to: procurementEmail,
        subject,
        body,
      });
    }

    return Response.json({
      success: true,
      po_number: poNumber,
      po_id: po.id,
      flagged: isFlagged,
      flagged_reason: flagReasons.join(' | '),
      status: poStatus,
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});