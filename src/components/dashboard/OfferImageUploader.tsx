"use client";

import React, { useRef, useState } from "react";
import { Upload, Camera, X, RefreshCw, AlertCircle, CheckCircle2, Image as ImageIcon } from "lucide-react";
import { Button } from "@/components/ui/Button";

interface OfferImageUploaderProps {
  currentImageUrl?: string | null;
  onImageUploaded: (url: string | null) => void;
  disabled?: boolean;
}

export const OfferImageUploader: React.FC<OfferImageUploaderProps> = ({
  currentImageUrl,
  onImageUploaded,
  disabled = false,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);

  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [uploadSuccess, setUploadSuccess] = useState<string | null>(null);

  // Desktop webcam capture modal state
  const [isWebcamOpen, setIsWebcamOpen] = useState(false);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [cameraError, setCameraError] = useState<string | null>(null);

  const validateAndUpload = async (file: File) => {
    setUploadError(null);
    setUploadSuccess(null);

    // Validate size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      setUploadError("Image size exceeds 5MB limit. Please choose a smaller photo.");
      return;
    }

    // Validate type
    const validTypes = ["image/jpeg", "image/png", "image/webp", "image/jpg"];
    if (!validTypes.includes(file.type.toLowerCase())) {
      setUploadError("Invalid image format. Supported formats: JPG, PNG, WEBP.");
      return;
    }

    setIsUploading(true);

    try {
      const formData = new FormData();
      formData.append("file", file);

      const res = await fetch("/api/merchant/offers/upload-image", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();

      if (!res.ok) {
        setUploadError(data.error || "Failed to upload image. Please try again.");
        setIsUploading(false);
        return;
      }

      onImageUploaded(data.imageUrl);
      setUploadSuccess("Product image uploaded successfully!");
      setIsUploading(false);
    } catch (err: unknown) {
      setUploadError(err instanceof Error ? err.message : "Network error during upload.");
      setIsUploading(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      validateAndUpload(file);
    }
    // reset input so the same file can be re-selected if replaced
    e.target.value = "";
  };

  // Open device camera: Try input capture first on mobile; if desktop and user clicks "Take Photo", try getUserMedia or mobile input fallback
  const handleTriggerCamera = async () => {
    setUploadError(null);
    setUploadSuccess(null);

    // Check if navigator.mediaDevices is supported
    const isMobileDevice = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
      navigator.userAgent
    );

    if (isMobileDevice) {
      // Direct native mobile camera
      cameraInputRef.current?.click();
    } else {
      // Desktop: Open interactive webcam viewfinder if mediaDevices is supported
      if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
        try {
          setCameraError(null);
          const mediaStream = await navigator.mediaDevices.getUserMedia({
            video: { facingMode: "environment", width: { ideal: 1280 }, height: { ideal: 720 } },
            audio: false,
          });
          setStream(mediaStream);
          setIsWebcamOpen(true);
          // Wait for modal render then assign stream to video
          setTimeout(() => {
            if (videoRef.current) {
              videoRef.current.srcObject = mediaStream;
              videoRef.current.play().catch(() => {});
            }
          }, 100);
        } catch {
          // Fallback to camera file input if desktop webcam permission denied or not available
          cameraInputRef.current?.click();
        }
      } else {
        cameraInputRef.current?.click();
      }
    }
  };

  const closeWebcam = () => {
    if (stream) {
      stream.getTracks().forEach((track) => track.stop());
      setStream(null);
    }
    setIsWebcamOpen(false);
    setCameraError(null);
  };

  const handleCaptureWebcam = () => {
    if (!videoRef.current) return;
    try {
      const video = videoRef.current;
      const canvas = document.createElement("canvas");
      canvas.width = video.videoWidth || 640;
      canvas.height = video.videoHeight || 480;
      const ctx = canvas.getContext("2d");
      if (!ctx) return;

      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      closeWebcam();

      canvas.toBlob(
        (blob) => {
          if (blob) {
            const capturedFile = new File([blob], `photo_${Date.now()}.jpg`, {
              type: "image/jpeg",
            });
            validateAndUpload(capturedFile);
          }
        },
        "image/jpeg",
        0.9
      );
    } catch (err: unknown) {
      setCameraError(err instanceof Error ? err.message : "Error capturing photo.");
    }
  };

  const handleRemoveImage = () => {
    onImageUploaded(null);
    setUploadSuccess(null);
    setUploadError(null);
  };

  return (
    <div className="space-y-2">
      {/* Hidden File Inputs */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/png,image/jpeg,image/jpg,image/webp"
        onChange={handleFileChange}
        className="hidden"
        disabled={disabled || isUploading}
      />
      {/* Native Camera input with capture="environment" for rear camera on mobile */}
      <input
        ref={cameraInputRef}
        type="file"
        accept="image/*"
        capture="environment"
        onChange={handleFileChange}
        className="hidden"
        disabled={disabled || isUploading}
      />

      <label className="block text-xs font-semibold text-slate-700">
        Product / Offer Image <span className="text-slate-400 font-normal">(Optional)</span>
      </label>

      {/* If Image exists: Show Thumbnail, Replace & Remove */}
      {currentImageUrl ? (
        <div className="relative rounded-2xl border border-slate-200 overflow-hidden bg-slate-50 p-2.5 flex items-center gap-3">
          <div className="relative w-20 h-20 rounded-xl overflow-hidden bg-slate-200 border border-slate-200 flex-shrink-0">
            <img
              src={currentImageUrl}
              alt="Offer preview"
              className="w-full h-full object-cover"
            />
          </div>

          <div className="flex-1 min-w-0 space-y-1.5">
            <div className="flex items-center gap-1.5 text-xs font-bold text-slate-800">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 flex-shrink-0" />
              <span className="truncate">Image Attached</span>
            </div>
            <p className="text-[11px] text-slate-500 truncate">
              Will show on customer devices & notifications
            </p>

            <div className="flex flex-wrap items-center gap-2 pt-0.5">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => fileInputRef.current?.click()}
                disabled={disabled || isUploading}
                className="h-7 text-[11px] px-2.5 gap-1"
              >
                <RefreshCw className="w-3 h-3" />
                <span>Replace</span>
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={handleRemoveImage}
                disabled={disabled || isUploading}
                className="h-7 text-[11px] px-2 text-rose-600 hover:text-rose-700 hover:bg-rose-50 gap-1"
              >
                <X className="w-3 h-3" />
                <span>Remove</span>
              </Button>
            </div>
          </div>
        </div>
      ) : (
        /* No Image Uploaded Yet: Action Buttons */
        <div className="border-2 border-dashed border-slate-200 hover:border-indigo-300 rounded-2xl p-3 sm:p-4 text-center transition-colors bg-slate-50/50">
          <div className="flex flex-col sm:flex-row items-center justify-center gap-2 sm:gap-3">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => fileInputRef.current?.click()}
              disabled={disabled || isUploading}
              className="w-full sm:w-auto h-9 text-xs font-semibold gap-1.5 bg-white shadow-2xs border-slate-200 hover:border-indigo-500 hover:text-indigo-600"
            >
              <Upload className="w-3.5 h-3.5 text-indigo-600" />
              <span>Upload Image</span>
            </Button>

            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleTriggerCamera}
              disabled={disabled || isUploading}
              className="w-full sm:w-auto h-9 text-xs font-semibold gap-1.5 bg-white shadow-2xs border-slate-200 hover:border-indigo-500 hover:text-indigo-600"
            >
              <Camera className="w-3.5 h-3.5 text-indigo-600" />
              <span>Take Photo</span>
            </Button>
          </div>

          <p className="text-[11px] text-slate-400 mt-2 flex items-center justify-center gap-1">
            <ImageIcon className="w-3 h-3 text-slate-400" />
            <span>Select product photo from gallery or take a live picture (PNG, JPG, WEBP &bull; Max 5MB)</span>
          </p>
        </div>
      )}

      {/* Uploading progress indicator */}
      {isUploading && (
        <div className="flex items-center gap-2 p-2.5 rounded-xl bg-indigo-50 border border-indigo-200 text-indigo-700 text-xs font-medium animate-pulse">
          <RefreshCw className="w-3.5 h-3.5 animate-spin text-indigo-600" />
          <span>Uploading and saving photo securely...</span>
        </div>
      )}

      {/* Error Message */}
      {uploadError && (
        <div className="flex items-start gap-1.5 p-2.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs">
          <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
          <span>{uploadError}</span>
        </div>
      )}

      {/* Success Message */}
      {uploadSuccess && !isUploading && (
        <div className="flex items-center gap-1.5 p-2 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs">
          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
          <span>{uploadSuccess}</span>
        </div>
      )}

      {/* Desktop Webcam Live Modal */}
      {isWebcamOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-5 max-w-md w-full shadow-2xl border border-slate-100 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Camera className="w-5 h-5 text-indigo-600" />
                <h3 className="text-base font-bold text-slate-900">Take Product Photo</h3>
              </div>
              <button
                type="button"
                onClick={closeWebcam}
                className="p-1 text-slate-400 hover:text-slate-600 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="relative aspect-video bg-black rounded-2xl overflow-hidden shadow-inner flex items-center justify-center">
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                className="w-full h-full object-cover"
              />
            </div>

            {cameraError && (
              <p className="text-xs text-rose-600 bg-rose-50 p-2 rounded-xl">
                {cameraError}
              </p>
            )}

            <div className="flex items-center justify-end gap-2 pt-1">
              <Button type="button" variant="outline" size="sm" onClick={closeWebcam}>
                Cancel
              </Button>
              <Button
                type="button"
                size="sm"
                onClick={handleCaptureWebcam}
                className="bg-indigo-600 hover:bg-indigo-700 font-bold gap-1.5"
              >
                <Camera className="w-4 h-4" />
                <span>Capture &amp; Use</span>
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
