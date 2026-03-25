import { createClientFromRequest } from 'npm:@base44/sdk@0.8.20';

// Thresholds (must match createPurchaseOrder.js)
const APPROVAL_THRESHOLD_SGD = 5000;
const LOW_RATING_THRESHOLD = 3.0;

Deno.serve(async (req) => {
  try {
    // This endpoint is called via email link (GET) or by the frontend (POST)
    const url = new URL(req.url);
    const token = url.searchParams.get('token') || (await req.json().catch(() => ({}))).token;
    const action = url.searchParams.get('action') || 'approve'; // 'approve' | 'reject'
    const rejectionReason = url.searchParams.get('reason') || '';

    if (!token) {
      return htmlResponse('Error', 'Missing approval token.', 'red');
    }

    // Find the PO by token (service role - no user auth needed for email links)
    const base44 = createClientFromRequest(req);
    const allPOs = await base44.asServiceRole.entities.PurchaseOrder.filter({ approval_token: token });

    if (!allPOs || allPOs.length === 0) {
      return htmlResponse('Invalid Link', 'This approval link is invalid or has already been used.', 'red');
    }

    const po = allPOs[0];

    if (po.status === 'approved') {
      return htmlResponse('Already Approved', `Purchase Order ${po.po_number} has already been approved.`, 'green');
    }
    if (po.status === 'rejected') {
      return htmlResponse('Already Actioned', `Purchase Order ${po.po_number} has already been rejected.`, 'orange');
    }
    if (!['pending_approval', 'submitted'].includes(po.status)) {
      return htmlResponse('Not Actionable', `Purchase Order ${po.po_number} is in status "${po.status}" and cannot be approved via this link.`, 'orange');
    }

    const now = new Date().toISOString();
    const approverEmail = url.searchParams.get('approver') || po.procurement_manager_email || 'approver@system';

    if (action === 'reject') {
      await base44.asServiceRole.entities.PurchaseOrder.update(po.id, {
        status: 'rejected',
        approved_by: approverEmail,
        approved_at: now,
        rejection_reason: rejectionReason || 'Rejected via email link.',
        approval_token: '', // Invalidate token
      });

      // Notify requester
      if (po.requested_by) {
        await base44.asServiceRole.integrations.Core.SendEmail({
          to: po.requested_by,
          subject: `Purchase Order ${po.po_number} Rejected`,
          body: `Hello,

Purchase Order ${po.po_number} (SGD ${(po.total_value || 0).toFixed(2)}) has been rejected by ${approverEmail}.

Reason: ${rejectionReason || 'No reason provided.'}

Please log in to WarehouseSG to review and amend the order if needed.

Regards,
WarehouseSG`,
        });
      }

      return htmlResponse('Purchase Order Rejected', `${po.po_number} has been rejected. The requester has been notified.`, 'orange');
    }

    // Approve
    await base44.asServiceRole.entities.PurchaseOrder.update(po.id, {
      status: 'approved',
      approved_by: approverEmail,
      approved_at: now,
      approval_token: '', // Invalidate token after use
    });

    // Notify requester of approval
    if (po.requested_by) {
      await base44.asServiceRole.integrations.Core.SendEmail({
        to: po.requested_by,
        subject: `✅ Purchase Order ${po.po_number} Approved`,
        body: `Hello,

Great news! Purchase Order ${po.po_number} (SGD ${(po.total_value || 0).toFixed(2)}) has been approved by ${approverEmail} on ${new Date(now).toLocaleString('en-SG', { timeZone: 'Asia/Singapore' })}.

The order is now ready to be placed with suppliers. Please log in to WarehouseSG to proceed.

Regards,
WarehouseSG`,
      });
    }

    return htmlResponse(
      '✅ Purchase Order Approved',
      `${po.po_number} (SGD ${(po.total_value || 0).toFixed(2)}) has been approved. The requester has been notified.`,
      'green'
    );
  } catch (error) {
    return htmlResponse('Error', `An error occurred: ${error.message}`, 'red');
  }
});

function htmlResponse(title, message, color) {
  const colors = {
    green: { bg: '#f0fdf4', border: '#86efac', text: '#166534', icon: '✅' },
    orange: { bg: '#fff7ed', border: '#fdba74', text: '#9a3412', icon: '⚠️' },
    red: { bg: '#fef2f2', border: '#fca5a5', text: '#991b1b', icon: '❌' },
  };
  const c = colors[color] || colors.green;
  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${title} — WarehouseSG</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; background: #f8fafc; display: flex; align-items: center; justify-content: center; min-height: 100vh; margin: 0; }
    .card { background: ${c.bg}; border: 1.5px solid ${c.border}; border-radius: 16px; padding: 48px 40px; max-width: 480px; text-align: center; box-shadow: 0 4px 24px rgba(0,0,0,0.06); }
    .icon { font-size: 48px; margin-bottom: 16px; }
    h1 { color: ${c.text}; font-size: 22px; margin: 0 0 12px; font-weight: 700; }
    p { color: #475569; font-size: 15px; margin: 0; line-height: 1.6; }
    .brand { margin-top: 32px; font-size: 12px; color: #94a3b8; letter-spacing: 0.05em; text-transform: uppercase; }
  </style>
</head>
<body>
  <div class="card">
    <div class="icon">${c.icon}</div>
    <h1>${title}</h1>
    <p>${message}</p>
    <div class="brand">WarehouseSG · Procurement Workflow</div>
  </div>
</body>
</html>`;
  return new Response(html, { status: 200, headers: { 'Content-Type': 'text/html; charset=utf-8' } });
}