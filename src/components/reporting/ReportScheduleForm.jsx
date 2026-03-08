import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Checkbox } from "@/components/ui/checkbox";
import { X } from "lucide-react";

export default function ReportScheduleForm({ schedule, onSubmit, saving }) {
  const [formData, setFormData] = useState(schedule || {
    name: "",
    report_type: "weekly",
    frequency_day: "monday",
    frequency_date: 1,
    send_time: "09:00",
    recipients: [],
    include_sections: ["stock_levels", "low_stock_alerts"],
    status: "active",
  });

  const [recipientInput, setRecipientInput] = useState("");

  const handleAddRecipient = () => {
    if (recipientInput.trim() && !formData.recipients.includes(recipientInput)) {
      setFormData({
        ...formData,
        recipients: [...formData.recipients, recipientInput],
      });
      setRecipientInput("");
    }
  };

  const handleRemoveRecipient = (email) => {
    setFormData({
      ...formData,
      recipients: formData.recipients.filter(r => r !== email),
    });
  };

  const toggleSection = (section) => {
    setFormData({
      ...formData,
      include_sections: formData.include_sections.includes(section)
        ? formData.include_sections.filter(s => s !== section)
        : [...formData.include_sections, section],
    });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.name || formData.recipients.length === 0) {
      alert("Please fill in all required fields");
      return;
    }
    onSubmit(formData);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div>
        <Label htmlFor="name">Schedule Name *</Label>
        <Input
          id="name"
          placeholder="e.g., Weekly Stock Review"
          value={formData.name}
          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          className="mt-2"
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label>Report Type *</Label>
          <Select
            value={formData.report_type}
            onValueChange={(value) =>
              setFormData({ ...formData, report_type: value })
            }
          >
            <SelectTrigger className="mt-2">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="weekly">Weekly</SelectItem>
              <SelectItem value="monthly">Monthly</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {formData.report_type === "weekly" ? (
          <div>
            <Label>Day of Week</Label>
            <Select
              value={formData.frequency_day}
              onValueChange={(value) =>
                setFormData({ ...formData, frequency_day: value })
              }
            >
              <SelectTrigger className="mt-2">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {["monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday"].map((day) => (
                  <SelectItem key={day} value={day}>
                    {day.charAt(0).toUpperCase() + day.slice(1)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        ) : (
          <div>
            <Label>Day of Month</Label>
            <Input
              type="number"
              min="1"
              max="31"
              value={formData.frequency_date}
              onChange={(e) =>
                setFormData({ ...formData, frequency_date: parseInt(e.target.value) })
              }
              className="mt-2"
            />
          </div>
        )}
      </div>

      <div>
        <Label htmlFor="send_time">Send Time (HH:MM)</Label>
        <Input
          id="send_time"
          type="time"
          value={formData.send_time}
          onChange={(e) => setFormData({ ...formData, send_time: e.target.value })}
          className="mt-2"
        />
      </div>

      <div>
        <Label>Recipients *</Label>
        <div className="flex gap-2 mt-2">
          <Input
            placeholder="Enter email address"
            value={recipientInput}
            onChange={(e) => setRecipientInput(e.target.value)}
            onKeyPress={(e) => e.key === "Enter" && handleAddRecipient()}
          />
          <Button type="button" variant="outline" onClick={handleAddRecipient}>
            Add
          </Button>
        </div>
        <div className="flex flex-wrap gap-2 mt-3">
          {formData.recipients.map((email) => (
            <div
              key={email}
              className="bg-slate-100 rounded-lg px-3 py-2 flex items-center gap-2"
            >
              <span className="text-sm">{email}</span>
              <button
                type="button"
                onClick={() => handleRemoveRecipient(email)}
                className="text-slate-500 hover:text-slate-700"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>
      </div>

      <div>
        <Label>Report Sections</Label>
        <div className="space-y-3 mt-3">
          {[
            { id: "stock_levels", label: "Stock Levels" },
            { id: "movement_trends", label: "Movement Trends" },
            { id: "low_stock_alerts", label: "Low Stock Alerts" },
            { id: "supplier_performance", label: "Supplier Performance" },
          ].map((section) => (
            <div key={section.id} className="flex items-center">
              <Checkbox
                id={section.id}
                checked={formData.include_sections.includes(section.id)}
                onCheckedChange={() => toggleSection(section.id)}
              />
              <label
                htmlFor={section.id}
                className="ml-3 text-sm cursor-pointer hover:text-slate-700"
              >
                {section.label}
              </label>
            </div>
          ))}
        </div>
      </div>

      <div>
        <Label>Status</Label>
        <Select
          value={formData.status}
          onValueChange={(value) =>
            setFormData({ ...formData, status: value })
          }
        >
          <SelectTrigger className="mt-2">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="active">Active</SelectItem>
            <SelectItem value="inactive">Inactive</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <Button
        type="submit"
        className="w-full bg-emerald-600 hover:bg-emerald-700"
        disabled={saving}
      >
        {saving ? "Saving..." : "Save Schedule"}
      </Button>
    </form>
  );
}