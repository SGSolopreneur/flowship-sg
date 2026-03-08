import React, { useRef } from "react";
import QRCode from "qrcode.react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Printer, X } from "lucide-react";

export default function QRCodeGenerator({ open, onOpenChange, product }) {
  const qrRef = useRef();

  if (!product) return null;

  const qrData = JSON.stringify({
    id: product.id,
    sku: product.sku,
    name: product.name,
  });

  const handlePrint = () => {
    const printWindow = window.open("", "", "height=500,width=500");
    printWindow.document.write(`
      <html>
        <head>
          <title>QR Code - ${product.sku}</title>
          <style>
            body { display: flex; justify-content: center; align-items: center; height: 100vh; margin: 0; font-family: Arial, sans-serif; background: white; }
            .container { text-align: center; }
            .qr-wrapper { margin: 20px 0; }
            h2 { margin: 10px 0; font-size: 18px; }
            p { margin: 5px 0; font-size: 14px; color: #666; }
            @media print { body { margin: 0; } }
          </style>
        </head>
        <body>
          <div class="container">
            <h2>${product.name}</h2>
            <p>SKU: ${product.sku}</p>
            <div class="qr-wrapper">
              ${qrRef.current?.canvas.outerHTML || ""}
            </div>
            <p style="margin-top: 20px; font-size: 12px; color: #999;">Product ID: ${product.id}</p>
          </div>
        </body>
      </html>
    `);
    printWindow.document.close();
    setTimeout(() => {
      printWindow.print();
      printWindow.close();
    }, 250);
  };

  const handleDownload = () => {
    const image = qrRef.current.canvas.toDataURL("image/png");
    const link = document.createElement("a");
    link.href = image;
    link.download = `qrcode-${product.sku}.png`;
    link.click();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>QR Code - {product.sku}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="flex flex-col items-center justify-center bg-slate-50 rounded-lg p-6 border border-slate-200">
            <div className="bg-white p-4 rounded-lg">
              <QRCode
                ref={qrRef}
                value={qrData}
                size={256}
                level="H"
                includeMargin={true}
              />
            </div>
          </div>
          
          <div className="space-y-2 text-sm text-slate-600">
            <p><strong>Product:</strong> {product.name}</p>
            <p><strong>SKU:</strong> {product.sku}</p>
            <p><strong>Category:</strong> {product.category}</p>
          </div>

          <div className="flex gap-2 pt-2">
            <Button
              onClick={handleDownload}
              variant="outline"
              className="flex-1"
            >
              Download PNG
            </Button>
            <Button
              onClick={handlePrint}
              className="flex-1 bg-emerald-600 hover:bg-emerald-700"
            >
              <Printer className="w-4 h-4 mr-1.5" /> Print
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}