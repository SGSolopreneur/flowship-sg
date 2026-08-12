import { createClientFromRequest } from 'npm:@base44/sdk@0.8.40';
import { secrets } from 'base44:runtime';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const payload = await req.json().catch(() => ({}));

    // Fetch all warehouse inventory + products via service role (works in scheduled runs with no user)
    const [inventory, products] = await Promise.all([
      base44.asServiceRole.entities.InventoryItem.list(),
      base44.asServiceRole.entities.Product.list(),
    ]);

    const warehouseStock = inventory.filter(i => i.location_type === "warehouse");

    // Identify items whose quantity is at or below the product's minimum stock level
    const lowStockItems = [];
    for (const item of warehouseStock) {
      const product = products.find(p => p.id === item.product_id);
      if (!product) continue;
      const minLevel = product.min_stock_level || 0;
      if (item.quantity <= minLevel) {
        lowStockItems.push({
          product_name: item.product_name || product.name,
          sku: item.sku || product.sku || "-",
          location_name: item.location_name || "Warehouse",
          quantity: item.quantity,
          min_level: minLevel,
          unit: product.unit || "pcs",
        });
      }
    }

    if (lowStockItems.length === 0) {
      return Response.json({ success: true, message: "No low stock items detected", count: 0 });
    }

    // Build the WhatsApp message body
    const header = `⚠️ *Low Stock Alert — FlowShip SG*\n\n${lowStockItems.length} item(s) below minimum level:`;
    const lines = lowStockItems.slice(0, 15).map((it, idx) =>
      `\n${idx + 1}. ${it.product_name} (${it.sku})\n   ${it.quantity} ${it.unit} left · min ${it.min_level}`
    ).join("");
    const more = lowStockItems.length > 15 ? `\n\n…and ${lowStockItems.length - 15} more item(s)` : "";
    const footer = `\n\nPlease review and raise a purchase order.`;
    const body = header + lines + more + footer;

    // Twilio credentials
    const accountSid = secrets.get("TWILIO_ACCOUNT_SID");
    const authToken = secrets.get("TWILIO_AUTH_TOKEN");
    const from = secrets.get("TWILIO_WHATSAPP_FROM");
    const to = secrets.get("MANAGER_WHATSAPP_TO");

    if (!accountSid || !authToken || !from || !to) {
      return Response.json({
        success: false,
        error: "WhatsApp not configured. Set TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, TWILIO_WHATSAPP_FROM, and MANAGER_WHATSAPP_TO in app secrets.",
        lowStockCount: lowStockItems.length,
      }, { status: 500 });
    }

    // Send via Twilio WhatsApp API
    const twilioUrl = `https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Messages.json`;
    const authHeader = btoa(`${accountSid}:${authToken}`);
    const form = new URLSearchParams();
    form.append("From", from);
    form.append("To", to);
    form.append("Body", body);

    const twilioRes = await fetch(twilioUrl, {
      method: "POST",
      headers: {
        Authorization: `Basic ${authHeader}`,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: form.toString(),
    });

    if (!twilioRes.ok) {
      const errText = await twilioRes.text();
      return Response.json({
        success: false,
        error: `Twilio API error (${twilioRes.status})`,
        details: errText,
        lowStockCount: lowStockItems.length,
      }, { status: 502 });
    }

    const twilioData = await twilioRes.json();

    // Log to ActivityLog
    await base44.asServiceRole.entities.ActivityLog.create({
      action_type: "inventory_updated",
      entity_type: "InventoryItem",
      description: `WhatsApp low-stock alert sent for ${lowStockItems.length} item(s)`,
      performed_by: "system",
      severity: "high",
      details: { low_stock_skus: lowStockItems.map(i => i.sku), twilio_sid: twilioData.sid },
    });

    return Response.json({
      success: true,
      sentTo: to,
      itemCount: lowStockItems.length,
      twilioSid: twilioData.sid,
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});