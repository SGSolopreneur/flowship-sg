import { createClientFromRequest } from 'npm:@base44/sdk@0.8.20';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const { items, recipientEmail } = await req.json();

    if (!items || items.length === 0) {
      return Response.json({ message: 'No low stock items to report' });
    }

    const toEmail = recipientEmail || user.email;

    const rows = items.map(item =>
      `<tr>
        <td style="padding:8px 12px;border-bottom:1px solid #f0f0f0;font-size:14px;color:#1e293b;">${item.product_name}</td>
        <td style="padding:8px 12px;border-bottom:1px solid #f0f0f0;font-size:14px;color:#64748b;">${item.sku || '-'}</td>
        <td style="padding:8px 12px;border-bottom:1px solid #f0f0f0;font-size:14px;color:#64748b;">${item.location_name || 'Warehouse'}</td>
        <td style="padding:8px 12px;border-bottom:1px solid #f0f0f0;font-size:14px;font-weight:600;color:${item.quantity <= item.minLevel * 0.3 ? '#ef4444' : '#f59e0b'};">
          ${item.quantity} ${item.unit || 'pcs'}
        </td>
        <td style="padding:8px 12px;border-bottom:1px solid #f0f0f0;font-size:14px;color:#64748b;">${item.minLevel} ${item.unit || 'pcs'}</td>
      </tr>`
    ).join('');

    const htmlBody = `
      <div style="font-family:system-ui,sans-serif;max-width:640px;margin:0 auto;background:#f8fafc;padding:24px;">
        <div style="background:#fff;border-radius:12px;overflow:hidden;border:1px solid #e2e8f0;">
          <div style="background:#0f172a;padding:24px 28px;display:flex;align-items:center;gap:12px;">
            <div style="width:36px;height:36px;background:#10b981;border-radius:8px;display:flex;align-items:center;justify-content:center;font-size:18px;">📦</div>
            <div>
              <h1 style="margin:0;font-size:18px;font-weight:700;color:#fff;">WarehouseSG</h1>
              <p style="margin:0;font-size:11px;color:#94a3b8;text-transform:uppercase;letter-spacing:0.05em;">Low Stock Alert</p>
            </div>
          </div>
          <div style="padding:28px;">
            <div style="background:#fef3c7;border:1px solid #fde68a;border-radius:8px;padding:14px 16px;margin-bottom:24px;display:flex;gap:10px;align-items:flex-start;">
              <span style="font-size:18px;">⚠️</span>
              <div>
                <p style="margin:0;font-size:14px;font-weight:600;color:#92400e;">${items.length} item${items.length > 1 ? 's' : ''} below minimum stock level</p>
                <p style="margin:4px 0 0;font-size:13px;color:#b45309;">Immediate replenishment action may be required.</p>
              </div>
            </div>
            <table style="width:100%;border-collapse:collapse;background:#fff;border-radius:8px;overflow:hidden;border:1px solid #e2e8f0;">
              <thead>
                <tr style="background:#f8fafc;">
                  <th style="padding:10px 12px;text-align:left;font-size:11px;font-weight:600;color:#64748b;text-transform:uppercase;letter-spacing:0.05em;">Product</th>
                  <th style="padding:10px 12px;text-align:left;font-size:11px;font-weight:600;color:#64748b;text-transform:uppercase;letter-spacing:0.05em;">SKU</th>
                  <th style="padding:10px 12px;text-align:left;font-size:11px;font-weight:600;color:#64748b;text-transform:uppercase;letter-spacing:0.05em;">Location</th>
                  <th style="padding:10px 12px;text-align:left;font-size:11px;font-weight:600;color:#64748b;text-transform:uppercase;letter-spacing:0.05em;">Current Qty</th>
                  <th style="padding:10px 12px;text-align:left;font-size:11px;font-weight:600;color:#64748b;text-transform:uppercase;letter-spacing:0.05em;">Min Level</th>
                </tr>
              </thead>
              <tbody>${rows}</tbody>
            </table>
            <p style="margin:24px 0 0;font-size:12px;color:#94a3b8;text-align:center;">
              Sent from WarehouseSG Distribution Hub · ${new Date().toLocaleString('en-SG', { timeZone: 'Asia/Singapore' })} SGT
            </p>
          </div>
        </div>
      </div>
    `;

    await base44.integrations.Core.SendEmail({
      to: toEmail,
      subject: `⚠️ Low Stock Alert – ${items.length} item${items.length > 1 ? 's' : ''} need replenishment`,
      body: htmlBody,
    });

    return Response.json({ success: true, sentTo: toEmail, itemCount: items.length });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});