import { createClientFromRequest } from 'npm:@base44/sdk@0.8.20';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    
    const payload = await req.json();
    const schedule_id = payload.schedule_id;

    if (!schedule_id) {
      return Response.json({ error: 'schedule_id is required' }, { status: 400 });
    }

    // Fetch the schedule
    const schedules = await base44.asServiceRole.entities.ReportSchedule.filter({ id: schedule_id });
    const schedule = schedules[0];

    if (!schedule) {
      return Response.json({ error: 'Schedule not found' }, { status: 404 });
    }

    // Fetch report data
    const [inventoryItems, stockMovements, suppliers] = await Promise.all([
      base44.asServiceRole.entities.InventoryItem.list(),
      base44.asServiceRole.entities.StockMovement.list('-created_date', 500),
      base44.asServiceRole.entities.Supplier.list()
    ]);

    // Prepare report content
    let reportHtml = `
      <div style="font-family: Arial, sans-serif; max-width: 800px; margin: 0 auto; background: #f5f5f5; padding: 20px;">
        <div style="background: white; border-radius: 8px; padding: 30px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
          <h1 style="color: #1f2937; margin-bottom: 5px;">${schedule.report_type.charAt(0).toUpperCase() + schedule.report_type.slice(1)} Inventory Report</h1>
          <p style="color: #6b7280; margin-bottom: 30px;">Generated on ${new Date().toLocaleDateString()}</p>
    `;

    // Stock Levels Section
    if (schedule.include_sections.includes('stock_levels')) {
      const lowStockItems = inventoryItems.filter(item => {
        const product = item.quantity < (item.min_stock_level || 10);
        return product;
      }).slice(0, 10);

      reportHtml += `
        <h2 style="color: #374151; border-bottom: 2px solid #e5e7eb; padding-bottom: 10px; margin-top: 25px;">Stock Levels</h2>
        <table style="width: 100%; border-collapse: collapse; margin-top: 15px;">
          <thead>
            <tr style="background: #f3f4f6;">
              <th style="padding: 10px; text-align: left; color: #1f2937;">Product</th>
              <th style="padding: 10px; text-align: center; color: #1f2937;">SKU</th>
              <th style="padding: 10px; text-align: right; color: #1f2937;">Quantity</th>
              <th style="padding: 10px; text-align: right; color: #1f2937;">Min Level</th>
            </tr>
          </thead>
          <tbody>
      `;

      lowStockItems.forEach(item => {
        const status = item.quantity < (item.min_stock_level || 10) ? 'color: #dc2626;' : 'color: #059669;';
        reportHtml += `
          <tr style="border-bottom: 1px solid #e5e7eb;">
            <td style="padding: 10px; color: #1f2937;">${item.product_name}</td>
            <td style="padding: 10px; text-align: center; color: #6b7280;">${item.sku}</td>
            <td style="padding: 10px; text-align: right; ${status} font-weight: bold;">${item.quantity}</td>
            <td style="padding: 10px; text-align: right; color: #6b7280;">${item.min_stock_level || 'N/A'}</td>
          </tr>
        `;
      });

      reportHtml += `
          </tbody>
        </table>
      `;
    }

    // Movement Trends Section
    if (schedule.include_sections.includes('movement_trends')) {
      const movements = stockMovements.slice(0, 10);
      reportHtml += `
        <h2 style="color: #374151; border-bottom: 2px solid #e5e7eb; padding-bottom: 10px; margin-top: 25px;">Recent Stock Movements</h2>
        <table style="width: 100%; border-collapse: collapse; margin-top: 15px;">
          <thead>
            <tr style="background: #f3f4f6;">
              <th style="padding: 10px; text-align: left; color: #1f2937;">Product</th>
              <th style="padding: 10px; text-align: center; color: #1f2937;">Type</th>
              <th style="padding: 10px; text-align: right; color: #1f2937;">Quantity</th>
              <th style="padding: 10px; text-align: left; color: #1f2937;">Location</th>
            </tr>
          </thead>
          <tbody>
      `;

      movements.forEach(movement => {
        const typeColor = movement.adjustment_type === 'in' ? '#059669' : movement.adjustment_type === 'out' ? '#dc2626' : '#f59e0b';
        reportHtml += `
          <tr style="border-bottom: 1px solid #e5e7eb;">
            <td style="padding: 10px; color: #1f2937;">${movement.product_name}</td>
            <td style="padding: 10px; text-align: center; color: white; background: ${typeColor}; border-radius: 4px;">${movement.adjustment_type.toUpperCase()}</td>
            <td style="padding: 10px; text-align: right; color: #1f2937;">${movement.quantity_change}</td>
            <td style="padding: 10px; color: #6b7280;">${movement.location_name}</td>
          </tr>
        `;
      });

      reportHtml += `
          </tbody>
        </table>
      `;
    }

    // Low Stock Alerts Section
    if (schedule.include_sections.includes('low_stock_alerts')) {
      const criticalItems = inventoryItems
        .filter(item => item.quantity < (item.min_stock_level || 10))
        .sort((a, b) => a.quantity - b.quantity)
        .slice(0, 15);

      reportHtml += `
        <h2 style="color: #374151; border-bottom: 2px solid #e5e7eb; padding-bottom: 10px; margin-top: 25px;">⚠️ Critical Low Stock Items</h2>
        <p style="color: #6b7280; margin-top: 10px;">Items below minimum stock level that require immediate attention:</p>
        <ul style="margin-top: 15px;">
      `;

      criticalItems.forEach(item => {
        const shortage = (item.min_stock_level || 10) - item.quantity;
        reportHtml += `
          <li style="padding: 8px; margin-bottom: 5px; background: #fef2f2; border-left: 4px solid #dc2626; color: #1f2937;">
            <strong>${item.product_name}</strong> - Current: ${item.quantity} units (need ${shortage} more)
          </li>
        `;
      });

      reportHtml += `
        </ul>
      `;
    }

    // Supplier Performance Section
    if (schedule.include_sections.includes('supplier_performance')) {
      const topSuppliers = suppliers
        .filter(s => s.performance_rating)
        .sort((a, b) => (b.performance_rating || 0) - (a.performance_rating || 0))
        .slice(0, 8);

      reportHtml += `
        <h2 style="color: #374151; border-bottom: 2px solid #e5e7eb; padding-bottom: 10px; margin-top: 25px;">Supplier Performance</h2>
        <table style="width: 100%; border-collapse: collapse; margin-top: 15px;">
          <thead>
            <tr style="background: #f3f4f6;">
              <th style="padding: 10px; text-align: left; color: #1f2937;">Supplier</th>
              <th style="padding: 10px; text-align: center; color: #1f2937;">Rating</th>
              <th style="padding: 10px; text-align: center; color: #1f2937;">On-Time %</th>
              <th style="padding: 10px; text-align: center; color: #1f2937;">Quality</th>
            </tr>
          </thead>
          <tbody>
      `;

      topSuppliers.forEach(supplier => {
        reportHtml += `
          <tr style="border-bottom: 1px solid #e5e7eb;">
            <td style="padding: 10px; color: #1f2937;">${supplier.name}</td>
            <td style="padding: 10px; text-align: center; color: #1f2937;">⭐ ${(supplier.performance_rating || 0).toFixed(1)}/5</td>
            <td style="padding: 10px; text-align: center; color: #1f2937;">${supplier.on_time_delivery_pct || 0}%</td>
            <td style="padding: 10px; text-align: center; color: #1f2937;">${(supplier.quality_score || 0).toFixed(1)}/5</td>
          </tr>
        `;
      });

      reportHtml += `
          </tbody>
        </table>
      `;
    }

    reportHtml += `
        </div>
      </div>
    `;

    // Send emails to all recipients
    for (const recipient of schedule.recipients) {
      await base44.integrations.Core.SendEmail({
        to: recipient,
        subject: `${schedule.name} - ${new Date().toLocaleDateString()}`,
        body: reportHtml
      });
    }

    // Update last_sent timestamp
    await base44.asServiceRole.entities.ReportSchedule.update(schedule_id, {
      last_sent: new Date().toISOString()
    });

    return Response.json({
      success: true,
      message: `Report sent to ${schedule.recipients.length} recipients`,
      recipients: schedule.recipients
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});