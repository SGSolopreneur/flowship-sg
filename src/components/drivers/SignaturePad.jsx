import React, { useRef, useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { RotateCcw, Check } from "lucide-react";

export default function SignaturePad({ onSave, saving }) {
  const canvasRef = useRef(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [isEmpty, setIsEmpty] = useState(true);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    canvas.width = canvas.offsetWidth;
    canvas.height = 150;

    const ctx = canvas.getContext("2d");
    ctx.fillStyle = "white";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.strokeStyle = "#1f2937";
    ctx.lineWidth = 2;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
  }, []);

  const startDrawing = (e) => {
    setIsDrawing(true);
    const { offsetX, offsetY } = e.nativeEvent;
    const ctx = canvasRef.current.getContext("2d");
    ctx.beginPath();
    ctx.moveTo(offsetX, offsetY);
  };

  const draw = (e) => {
    if (!isDrawing) return;
    const { offsetX, offsetY } = e.nativeEvent;
    const ctx = canvasRef.current.getContext("2d");
    ctx.lineTo(offsetX, offsetY);
    ctx.stroke();
    setIsEmpty(false);
  };

  const stopDrawing = () => {
    setIsDrawing(false);
  };

  const handleClear = () => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    ctx.fillStyle = "white";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    setIsEmpty(true);
  };

  const handleSave = () => {
    if (isEmpty) return;
    const signatureData = canvasRef.current.toDataURL("image/png");
    onSave(signatureData);
  };

  return (
    <div className="space-y-2">
      <label className="text-xs font-semibold text-slate-800">Customer Signature</label>
      <div className="border-2 border-dashed border-slate-300 rounded-lg overflow-hidden bg-white">
        <canvas
          ref={canvasRef}
          onMouseDown={startDrawing}
          onMouseMove={draw}
          onMouseUp={stopDrawing}
          onMouseLeave={stopDrawing}
          className="w-full cursor-crosshair"
        />
      </div>
      <div className="flex gap-2">
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={handleClear}
          disabled={isEmpty || saving}
          className="flex-1 text-xs h-8"
        >
          <RotateCcw className="w-3 h-3 mr-1" /> Clear
        </Button>
        <Button
          type="button"
          onClick={handleSave}
          disabled={isEmpty || saving}
          className="flex-1 text-xs h-8 bg-blue-600 hover:bg-blue-700"
        >
          <Check className="w-3 h-3 mr-1" /> Capture Signature
        </Button>
      </div>
    </div>
  );
}