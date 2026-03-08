import React from "react";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";

export default function EmptyState({ icon: Icon, title, description, actionLabel, onAction }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-4">
      <div className="w-14 h-14 rounded-2xl bg-slate-100 flex items-center justify-center mb-4">
        <Icon className="w-7 h-7 text-slate-400" />
      </div>
      <h3 className="text-base font-semibold text-slate-800 mb-1">{title}</h3>
      <p className="text-sm text-slate-500 text-center max-w-sm mb-5">{description}</p>
      {actionLabel && onAction && (
        <Button onClick={onAction} className="bg-emerald-600 hover:bg-emerald-700">
          <Plus className="w-4 h-4 mr-1.5" />
          {actionLabel}
        </Button>
      )}
    </div>
  );
}