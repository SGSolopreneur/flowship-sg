import React, { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { CheckCircle2, XCircle, Clock, Package, ChevronDown, ChevronUp, ArrowRight } from "lucide-react";
import { format } from "date-fns";

const priorityColors = {
  low: "bg-slate-100 text-slate-600",
  normal: "bg-blue-100 text-blue-700",
  high: "bg-amber-100 text-amber-700",
  urgent: "bg-red-100 text-red-700",
};

const statusConfig = {
  pending_approval: { label: "Pending Approval", color: "bg-amber-100 text-amber-700", icon: Clock },
  approved: { label: "Approved", color: "bg-emerald-100 text-emerald-700", icon: CheckCircle2 },
  rejected: { label: "Rejected", color: "bg-red-100 text-red-600", icon: XCircle },
  fulfilled: { label: "Fulfilled", color: "bg-slate-100 text-slate-600", icon: Package },
};

function ReviewDialog({ request, action, open, onOpenChange, onConfirm, saving }) {
  const [notes, setNotes] = useState("");
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>{action === "approve" ? "Approve Request" : "Reject Request"}</DialogTitle>
        </DialogHeader>
        <div className="space-y-3 py-2">
          <p className="text-sm text-slate-600">
            {action === "approve"
              ? `Approve stock request ${request?.request_number} from ${request?.store_name}? This will create a transfer order.`
              : `Reject stock request ${request?.request_number} from ${request?.store_name}?`}
          </p>
          <div>
            <label className="text-xs font-medium text-slate-600 mb-1 block">Review Notes (optional)</label>
            <Textarea value={notes} onChange={e => setNotes(e.target.value)} rows={2} placeholder="Add any comments..." />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button
            disabled={saving}
            onClick={() => { onConfirm(notes); setNotes(""); }}
            className={action === "approve" ? "bg-emerald-600 hover:bg-emerald-700" : "bg-red-600 hover:bg-red-700"}
          >
            {saving ? "Processing..." : action === "approve" ? "Approve" : "Reject"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function RequestCard({ request, onApprove, onReject, saving }) {
  const [expanded, setExpanded] = useState(false);
  const [reviewDialog, setReviewDialog] = useState(null); // "approve" | "reject" | null
  const cfg = statusConfig[request.status] || statusConfig.pending_approval;
  const StatusIcon = cfg.icon;

  return (
    <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
      <div className="p-4">
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <span className="font-mono text-sm font-semibold text-slate-800">{request.request_number}</span>
              <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full ${cfg.color}`}>
                <StatusIcon className="w-2.5 h-2.5 inline mr-0.5" />{cfg.label}
              </span>
              <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full ${priorityColors[request.priority]}`}>
                {request.priority}
              </span>
            </div>
            <div className="flex items-center gap-1.5 text-xs text-slate-500">
              <span className="font-medium text-slate-700">{request.store_name}</span>
              <ArrowRight className="w-3 h-3" />
              <span>Warehouse</span>
              <span className="text-slate-300">·</span>
              <span>{request.items?.length || 0} items</span>
              {request.requested_delivery_date && (
                <><span className="text-slate-300">·</span><span>by {format(new Date(request.requested_delivery_date), "dd MMM")}</span></>
              )}
            </div>
          </div>
          <div className="flex items-center gap-1.5 shrink-0">
            {request.status === "pending_approval" && (
              <>
                <Button size="sm" variant="outline" className="h-7 text-xs text-red-600 border-red-200 hover:bg-red-50" onClick={() => setReviewDialog("reject")}>
                  <XCircle className="w-3 h-3 mr-1" /> Reject
                </Button>
                <Button size="sm" className="h-7 text-xs bg-emerald-600 hover:bg-emerald-700" onClick={() => setReviewDialog("approve")}>
                  <CheckCircle2 className="w-3 h-3 mr-1" /> Approve
                </Button>
              </>
            )}
            <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setExpanded(!expanded)}>
              {expanded ? <ChevronUp className="w-4 h-4 text-slate-400" /> : <ChevronDown className="w-4 h-4 text-slate-400" />}
            </Button>
          </div>
        </div>
      </div>

      {expanded && (
        <div className="border-t border-slate-100 px-4 pb-4 pt-3 space-y-3 bg-slate-50/50">
          <div className="space-y-1.5">
            {request.items?.map((item, i) => (
              <div key={i} className="flex items-center justify-between text-sm">
                <div>
                  <span className="font-medium text-slate-700">{item.product_name}</span>
                  <span className="text-slate-400 text-xs ml-2">({item.sku})</span>
                </div>
                <span className="font-semibold text-slate-800">{item.quantity_requested} {item.unit}</span>
              </div>
            ))}
          </div>
          {request.notes && (
            <div className="text-xs text-slate-500 bg-white border border-slate-100 rounded-lg p-2">
              <span className="font-medium text-slate-600">Notes: </span>{request.notes}
            </div>
          )}
          {request.review_notes && (
            <div className={`text-xs rounded-lg p-2 border ${request.status === "rejected" ? "bg-red-50 border-red-100 text-red-700" : "bg-emerald-50 border-emerald-100 text-emerald-700"}`}>
              <span className="font-medium">Manager: </span>{request.review_notes}
            </div>
          )}
          {request.reviewed_by && (
            <p className="text-[11px] text-slate-400">Reviewed by {request.reviewed_by} · {request.reviewed_at ? format(new Date(request.reviewed_at), "dd MMM yyyy, HH:mm") : ""}</p>
          )}
        </div>
      )}

      <ReviewDialog
        request={request}
        action={reviewDialog}
        open={!!reviewDialog}
        onOpenChange={(o) => { if (!o) setReviewDialog(null); }}
        onConfirm={(notes) => {
          if (reviewDialog === "approve") onApprove(request, notes);
          else onReject(request, notes);
          setReviewDialog(null);
        }}
        saving={saving}
      />
    </div>
  );
}

export default function ApprovalPanel({ requests, onApprove, onReject, saving }) {
  const pending = requests.filter(r => r.status === "pending_approval");
  const others = requests.filter(r => r.status !== "pending_approval");

  if (requests.length === 0) {
    return (
      <div className="text-center py-16 text-slate-400">
        <Package className="w-10 h-10 mx-auto mb-3 opacity-30" />
        <p className="text-sm">No stock requests yet</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {pending.length > 0 && (
        <div className="space-y-2">
          <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wider flex items-center gap-2">
            <Clock className="w-3.5 h-3.5 text-amber-500" /> Pending Approval ({pending.length})
          </h3>
          {pending.map(r => <RequestCard key={r.id} request={r} onApprove={onApprove} onReject={onReject} saving={saving} />)}
        </div>
      )}
      {others.length > 0 && (
        <div className="space-y-2">
          <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Past Requests</h3>
          {others.map(r => <RequestCard key={r.id} request={r} onApprove={onApprove} onReject={onReject} saving={saving} />)}
        </div>
      )}
    </div>
  );
}