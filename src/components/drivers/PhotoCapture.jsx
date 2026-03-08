import React, { useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Camera, Trash2, Check, Upload } from "lucide-react";
import { cn } from "@/lib/utils";

export default function PhotoCapture({ onPhotosCapture, maxPhotos = 3, uploading }) {
  const fileInputRef = useRef(null);
  const cameraInputRef = useRef(null);
  const [photos, setPhotos] = useState([]);
  const [error, setError] = useState("");

  const handleFileSelect = (e, isCamera = false) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    const file = files[0];
    if (!file.type.startsWith("image/")) {
      setError("Please select an image file");
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      if (photos.length < maxPhotos) {
        const newPhotos = [...photos, { data: event.target.result, file }];
        setPhotos(newPhotos);
        setError("");
        onPhotosCapture(newPhotos);
      } else {
        setError(`Maximum ${maxPhotos} photos allowed`);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleRemovePhoto = (index) => {
    const newPhotos = photos.filter((_, i) => i !== index);
    setPhotos(newPhotos);
    onPhotosCapture(newPhotos);
  };

  return (
    <div className="space-y-2">
      <label className="text-xs font-semibold text-slate-800">Delivery Photos ({photos.length}/{maxPhotos})</label>

      {/* Photo Grid */}
      <div className="grid grid-cols-3 gap-2">
        {photos.map((photo, idx) => (
          <div key={idx} className="relative group rounded-lg overflow-hidden bg-slate-100 h-20">
            <img src={photo.data} alt={`Photo ${idx + 1}`} className="w-full h-full object-cover" />
            <button
              type="button"
              onClick={() => handleRemovePhoto(idx)}
              className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center"
              disabled={uploading}
            >
              <Trash2 className="w-4 h-4 text-white" />
            </button>
          </div>
        ))}

        {photos.length < maxPhotos && (
          <div className="grid grid-cols-2 gap-2">
            {/* Camera Button */}
            <button
              type="button"
              onClick={() => cameraInputRef.current?.click()}
              disabled={photos.length >= maxPhotos || uploading}
              className={cn(
                "rounded-lg border-2 border-dashed border-slate-300 flex items-center justify-center text-xs font-medium h-20",
                photos.length < maxPhotos && !uploading ? "hover:border-blue-400 cursor-pointer" : "opacity-50 cursor-not-allowed"
              )}
            >
              <Camera className="w-4 h-4" />
            </button>

            {/* Upload Button */}
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={photos.length >= maxPhotos || uploading}
              className={cn(
                "rounded-lg border-2 border-dashed border-slate-300 flex items-center justify-center text-xs font-medium h-20",
                photos.length < maxPhotos && !uploading ? "hover:border-blue-400 cursor-pointer" : "opacity-50 cursor-not-allowed"
              )}
            >
              <Upload className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>

      {error && <p className="text-xs text-red-600">{error}</p>}

      {/* Hidden Inputs */}
      <input
        ref={cameraInputRef}
        type="file"
        accept="image/*"
        capture="environment"
        onChange={(e) => handleFileSelect(e, true)}
        className="hidden"
      />
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileSelect}
        className="hidden"
      />
    </div>
  );
}