import React, { useEffect, useRef, useState } from "react";
import { Html5Qrcode } from "html5-qrcode";
import { X, Camera, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function BarcodeScanner({ onDetected, onClose }) {
  const scannerRef = useRef(null);
  const [error, setError] = useState(null);
  const [started, setStarted] = useState(false);
  const divId = "barcode-scanner-container";

  useEffect(() => {
    const scanner = new Html5Qrcode(divId);
    scannerRef.current = scanner;

    Html5Qrcode.getCameras()
      .then((cameras) => {
        if (!cameras || cameras.length === 0) {
          setError("No camera found on this device.");
          return;
        }
        const cameraId = cameras[cameras.length - 1].id; // prefer back camera
        scanner
          .start(
            cameraId,
            { fps: 10, qrbox: { width: 250, height: 150 } },
            (decodedText) => {
              onDetected(decodedText);
              stop(scanner);
            },
            () => {}
          )
          .then(() => setStarted(true))
          .catch((err) => setError("Camera access denied: " + err));
      })
      .catch(() => setError("Unable to access camera. Please allow camera permission."));

    return () => stop(scanner);
  }, []);

  const stop = (scanner) => {
    if (scanner && scanner.isScanning) {
      scanner.stop().catch(() => {});
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl w-full max-w-sm overflow-hidden shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b">
          <div className="flex items-center gap-2">
            <Camera className="w-4 h-4 text-emerald-600" />
            <span className="font-semibold text-sm text-slate-800">Scan Barcode / SKU</span>
          </div>
          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={onClose}>
            <X className="w-4 h-4" />
          </Button>
        </div>

        {/* Scanner area */}
        <div className="p-4">
          {error ? (
            <div className="flex flex-col items-center gap-3 py-8 text-center">
              <AlertCircle className="w-8 h-8 text-red-400" />
              <p className="text-sm text-slate-600">{error}</p>
              <Button variant="outline" size="sm" onClick={onClose}>Close</Button>
            </div>
          ) : (
            <>
              <div
                id={divId}
                className="rounded-xl overflow-hidden bg-slate-900"
                style={{ minHeight: 220 }}
              />
              <p className="text-xs text-slate-500 text-center mt-3">
                Point the camera at a product barcode or SKU label
              </p>
            </>
          )}
        </div>
      </div>
    </div>
  );
}