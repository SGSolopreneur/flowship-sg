import React, { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Loader2, AlertCircle, CheckCircle2 } from "lucide-react";
import SignaturePad from "./SignaturePad";
import PhotoCapture from "./PhotoCapture";

export default function DeliveryConfirmationDialog({
  open,
  onOpenChange,
  transfer,
  onConfirm,
  confirming,
}) {
  const [customerName, setCustomerName] = useState("");
  const [signature, setSignature] = useState(null);
  const [photos, setPhotos] = useState([]);
  const [errors, setErrors] = useState({});

  const handleConfirm = async () => {
    const newErrors = {};
    if (!customerName.trim()) newErrors.customerName = "Customer name required";
    if (!signature) newErrors.signature = "Signature required";
    if (photos.length === 0) newErrors.photos = "At least one photo required";

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    onConfirm({
      customerName,
      signature,
      photos: photos.map(p => p.file),
    });
  };

  const handleOpenChange = (newOpen) => {
    if (!newOpen && !confirming) {
      setCustomerName("");
      setSignature(null);
      setPhotos([]);
      setErrors({});
    }
    onOpenChange(newOpen);
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Confirm Delivery</DialogTitle>
          <DialogDescription>Order {transfer?.order_number} to {transfer?.store_name}</DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Customer Name */}
          <div>
            <Label className="text-xs">Recipient Name *</Label>
            <Input
              value={customerName}
              onChange={(e) => {
                setCustomerName(e.target.value);
                if (errors.customerName) setErrors({ ...errors, customerName: null });
              }}
              placeholder="Name of person receiving delivery"
              className="mt-1 text-sm"
              disabled={confirming}
            />
            {errors.customerName && (
              <p className="text-xs text-red-600 mt-1 flex items-center gap-1">
                <AlertCircle className="w-3 h-3" /> {errors.customerName}
              </p>
            )}
          </div>

          {/* Signature Pad */}
          <div>
            {signature ? (
              <div className="space-y-2">
                <label className="text-xs font-semibold text-slate-800">Signature Captured ✓</label>
                <img src={signature} alt="Signature" className="border rounded-lg max-h-32 w-auto" />
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setSignature(null)}
                  disabled={confirming}
                  className="text-xs h-8"
                >
                  Retake Signature
                </Button>
              </div>
            ) : (
              <SignaturePad onSave={setSignature} saving={confirming} />
            )}
            {errors.signature && (
              <p className="text-xs text-red-600 mt-1 flex items-center gap-1">
                <AlertCircle className="w-3 h-3" /> {errors.signature}
              </p>
            )}
          </div>

          {/* Photo Capture */}
          <div>
            <PhotoCapture onPhotosCapture={setPhotos} uploading={confirming} />
            {errors.photos && (
              <p className="text-xs text-red-600 mt-1 flex items-center gap-1">
                <AlertCircle className="w-3 h-3" /> {errors.photos}
              </p>
            )}
          </div>

          {/* Info Alert */}
          <Alert className="bg-blue-50 border-blue-200">
            <AlertCircle className="h-4 w-4 text-blue-600" />
            <AlertDescription className="text-xs text-blue-700">
              Please capture customer signature and at least one delivery photo before confirming.
            </AlertDescription>
          </Alert>

          {/* Actions */}
          <div className="flex gap-3 pt-2 border-t border-slate-200">
            <Button
              type="button"
              variant="outline"
              onClick={() => handleOpenChange(false)}
              disabled={confirming}
              className="flex-1"
            >
              Cancel
            </Button>
            <Button
              type="button"
              onClick={handleConfirm}
              disabled={confirming}
              className="flex-1 bg-emerald-600 hover:bg-emerald-700 gap-2"
            >
              {confirming ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" /> Confirming...
                </>
              ) : (
                <>
                  <CheckCircle2 className="w-4 h-4" /> Confirm Delivery
                </>
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}