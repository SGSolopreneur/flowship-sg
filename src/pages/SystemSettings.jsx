import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Settings, Clock, Package, Sliders, Save, Check } from "lucide-react";
import { useRole } from "../components/shared/useRole";
import { toast } from "react-hot-toast";

// Default settings seeded on first load
const DEFAULT_SETTINGS = [
  { setting_key: "warehouse_open_time", setting_value: "08:00", category: "warehouse", label: "Opening Time", description: "Warehouse operating hours start" },
  { setting_key: "warehouse_close_time", setting_value: "18:00", category: "warehouse", label: "Closing Time", description: "Warehouse operating hours end" },
  { setting_key: "warehouse_operating_days", setting_value: "Mon-Fri", category: "warehouse", label: "Operating Days", description: "Days the warehouse is operational" },
  { setting_key: "default_reorder_level", setting_value: "50", category: "reorder", label: "Default Reorder Level", description: "Default minimum stock before reorder alert" },
  { setting_key: "default_reorder_qty", setting_value: "100", category: "reorder", label: "Default Reorder Quantity", description: "Default quantity to order when reordering" },
  { setting_key: "low_stock_threshold", setting_value: "20", category: "reorder", label: "Low Stock Threshold", description: "Units below which stock is flagged as low" },
  { setting_key: "expiry_warning_days", setting_value: "7", category: "reorder", label: "Expiry Warning (days)", description: "Days before expiry to trigger warning" },
  { setting_key: "currency", setting_value: "SGD", category: "general", label: "Currency", description: "Default currency for the application" },
  { setting_key: "timezone", setting_value: "Asia/Singapore", category: "general", label: "Timezone", description: "Application timezone" },
  { setting_key: "enable_auto_reorder", setting_value: "false", category: "general", label: "Auto Reorder", description: "Automatically generate purchase orders when stock is low" },
  { setting_key: "enable_email_alerts", setting_value: "true", category: "general", label: "Email Alerts", description: "Send email notifications for critical alerts" },
  { setting_key: "enable_expiry_tracking", setting_value: "true", category: "general", label: "Expiry Tracking", description: "Track and alert on product expiry dates" },
];

const categoryConfig = {
  warehouse: { icon: Clock, title: "Warehouse Operating Hours", color: "text-blue-600", bg: "bg-blue-50" },
  reorder: { icon: Package, title: "Default Reorder Levels", color: "text-amber-600", bg: "bg-amber-50" },
  general: { icon: Sliders, title: "General Preferences", color: "text-emerald-600", bg: "bg-emerald-50" },
};

function SettingsField({ setting, value, onChange, saving }) {
  const isToggle = setting.setting_key.startsWith("enable_");

  if (isToggle) {
    return (
      <div className="flex items-center justify-between py-2">
        <div>
          <Label className="text-sm font-medium text-slate-700">{setting.label}</Label>
          <p className="text-xs text-slate-400">{setting.description}</p>
        </div>
        <Switch
          checked={value === "true"}
          onCheckedChange={(checked) => onChange(checked ? "true" : "false")}
          disabled={saving}
        />
      </div>
    );
  }

  return (
    <div className="py-2">
      <Label className="text-sm font-medium text-slate-700">{setting.label}</Label>
      <p className="text-xs text-slate-400 mb-1.5">{setting.description}</p>
      <Input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        disabled={saving}
        className="max-w-xs"
      />
    </div>
  );
}

export default function SystemSettings() {
  const { canAccessSensitive } = useRole();
  const queryClient = useQueryClient();
  const [values, setValues] = useState({});
  const [dirty, setDirty] = useState(false);

  const { data: existing = [], isLoading } = useQuery({
    queryKey: ["systemSettings"],
    queryFn: () => base44.entities.SystemSetting.list(),
  });

  // Merge defaults with existing DB records
  useEffect(() => {
    const merged = {};
    DEFAULT_SETTINGS.forEach(def => {
      const dbRec = existing.find(e => e.setting_key === def.setting_key);
      merged[def.setting_key] = { ...def, id: dbRec?.id, setting_value: dbRec?.setting_value ?? def.setting_value };
    });
    setValues(merged);
    setDirty(false);
  }, [existing]);

  const upsertMutation = useMutation({
    mutationFn: async () => {
      for (const key of Object.keys(values)) {
        const v = values[key];
        if (v.id) {
          await base44.entities.SystemSetting.update(v.id, { setting_value: v.setting_value });
        } else {
          const created = await base44.entities.SystemSetting.create({
            setting_key: v.setting_key,
            setting_value: v.setting_value,
            category: v.category,
            label: v.label,
            description: v.description,
          });
          v.id = created.id;
        }
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["systemSettings"] });
      setDirty(false);
      toast.success("Settings saved successfully");
    },
    onError: (err) => toast.error("Failed to save: " + err.message),
  });

  const handleChange = (key, newValue) => {
    setValues(prev => ({ ...prev, [key]: { ...prev[key], setting_value: newValue } }));
    setDirty(true);
  };

  const categories = ["warehouse", "reorder", "general"];

  if (!canAccessSensitive) {
    return (
      <div className="p-4 lg:p-6 max-w-3xl mx-auto">
        <div className="bg-white rounded-xl border border-orange-200 p-8 text-center">
          <Settings className="w-10 h-10 text-amber-300 mx-auto mb-3" />
          <p className="font-medium text-slate-700">Access Restricted</p>
          <p className="text-sm text-slate-400 mt-1">Only admins and managers can access system settings.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 lg:p-6 max-w-4xl mx-auto space-y-6 w-full">
      <div className="flex items-center justify-between gap-4">
        <div className="flex flex-col gap-2">
          <div className="flex items-center gap-2">
            <Settings className="w-5 h-5 text-amber-600" />
            <h1 className="text-lg font-bold text-amber-900">System Settings</h1>
          </div>
          <p className="text-xs text-amber-700">Manage warehouse hours, reorder levels, and application preferences</p>
        </div>
        <Button
          onClick={() => upsertMutation.mutate()}
          disabled={!dirty || upsertMutation.isPending || isLoading}
          className="bg-amber-600 hover:bg-amber-700"
        >
          {upsertMutation.isPending ? (
            <><Save className="w-4 h-4 animate-pulse" /> Saving...</>
          ) : (
            <><Save className="w-4 h-4" /> Save Changes</>
          )}
        </Button>
      </div>

      {isLoading ? (
        <div className="space-y-4">
          {[1, 2, 3].map(i => (
            <Card key={i} className="p-6 animate-pulse">
              <div className="h-5 bg-slate-100 rounded w-1/3 mb-4" />
              <div className="h-10 bg-slate-50 rounded mb-2" />
              <div className="h-10 bg-slate-50 rounded mb-2" />
              <div className="h-10 bg-slate-50 rounded" />
            </Card>
          ))}
        </div>
      ) : (
        categories.map(cat => {
          const config = categoryConfig[cat];
          const catSettings = Object.values(values).filter(v => v.category === cat);
          if (catSettings.length === 0) return null;
          return (
            <Card key={cat} className="border-orange-200">
              <div className="p-4 border-b border-orange-100 flex items-center gap-2">
                <div className={`w-8 h-8 rounded-lg ${config.bg} flex items-center justify-center`}>
                  <config.icon className={`w-4 h-4 ${config.color}`} />
                </div>
                <h2 className="text-sm font-semibold text-slate-800">{config.title}</h2>
              </div>
              <div className="p-4 divide-y divide-slate-50">
                {catSettings.map(setting => (
                  <SettingsField
                    key={setting.setting_key}
                    setting={setting}
                    value={setting.setting_value}
                    onChange={(val) => handleChange(setting.setting_key, val)}
                    saving={upsertMutation.isPending}
                  />
                ))}
              </div>
            </Card>
          );
        })
      )}

      {dirty && (
        <div className="fixed bottom-4 right-4 bg-amber-600 text-white text-xs px-4 py-2 rounded-full shadow-lg flex items-center gap-2">
          <Save className="w-3.5 h-3.5" /> Unsaved changes
        </div>
      )}
    </div>
  );
}