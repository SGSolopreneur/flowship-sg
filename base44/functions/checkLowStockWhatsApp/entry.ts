import { createClientFromRequest } from 'npm:@base44/sdk@0.8.40';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);

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
          quantity: item.quantity,
          min_level: minLevel,
          unit: product.unit || "pcs",
        });
      }
    }

    if (lowStockItems.length === 0) {
      return Response.json({ success: true, message: "No low stock items detected", count: 0 });
    }

    // Build the alert content for the agent to relay
    const itemList = lowStockItems.slice(0, 15).map((it, idx) =>
      `${idx + 1}. ${it.product_name} (${it.sku}) — ${it.quantity} ${it.unit} left, min ${it.min_level}`
    ).join("\n");
    const more = lowStockItems.length > 15 ? `\n...and ${lowStockItems.length - 15} more item(s)` : "";
    const alertContent = `SYSTEM ALERT: ${lowStockItems.length} item(s) below minimum stock level:\n\n${itemList}${more}\n\nPlease relay this low-stock alert to the manager now.`;

    // Push the alert through the agent's WhatsApp conversation
    let deliveryMethod = "no_conversation";
    let conversationId = null;
    try {
      const conversations = await base44.asServiceRole.agents.listConversations({ agent_name: "stock_alert_agent" });
      if (conversations && conversations.length > 0) {
        // Use the most recent conversation (the manager's WhatsApp chat)
        const conversation = conversations[0];
        conversationId = conversation.id;
        await base44.asServiceRole.agents.addMessage(conversation, {
          role: "user",
          content: alertContent,
        });
        deliveryMethod = "whatsapp";
      }
    } catch (agentErr) {
      deliveryMethod = "agent_error";
    }

    // Log to ActivityLog
    await base44.asServiceRole.entities.ActivityLog.create({
      action_type: "inventory_updated",
      entity_type: "InventoryItem",
      description: `Low-stock alert (${lowStockItems.length} items) — delivered via ${deliveryMethod}`,
      performed_by: "system",
      severity: "high",
      details: { low_stock_skus: lowStockItems.map(i => i.sku), conversation_id: conversationId },
    });

    return Response.json({
      success: true,
      itemCount: lowStockItems.length,
      deliveryMethod,
      conversationId,
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});