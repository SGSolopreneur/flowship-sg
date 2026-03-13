import { createClientFromRequest } from 'npm:@base44/sdk@0.8.20';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const payload = await req.json();
    const {
      action_type,
      entity_type,
      entity_id,
      entity_name,
      description,
      details,
      severity = "low"
    } = payload;

    // Create activity log entry
    await base44.asServiceRole.entities.ActivityLog.create({
      action_type,
      entity_type,
      entity_id,
      entity_name,
      performed_by: user.email,
      performed_by_name: user.full_name,
      description,
      details,
      severity
    });

    return Response.json({ success: true });
  } catch (error) {
    console.error("Activity log error:", error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});