"use client";

import React, { useRef, useEffect, useState, useCallback } from "react";
import { Sparkles, Copy, Check, CheckCircle2 } from "lucide-react";

interface ScratchCardProps {
  rewardTitle: string;
  rewardDescription?: string | null;
  referenceCode: string;
  shopName: string;
  expiresAt?: string | null;
  isRevealedInitially?: boolean;
  onScratchComplete?: () => void;
}

export const ScratchCard: React.FC<ScratchCardProps> = ({
  rewardTitle,
  rewardDescription,
  referenceCode,
  shopName,
  expiresAt,
  isRevealedInitially = false,
  onScratchComplete,
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [isRevealed, setIsRevealed] = useState(isRevealedInitially);
  const [isDrawing, setIsDrawing] = useState(false);
  const [copied, setCopied] = useState(false);

  const initCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas || isRevealed) return;

    const rect = canvas.getBoundingClientRect();
    if (rect.width === 0 || rect.height === 0) return;

    const dpr = window.devicePixelRatio || 1;
    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    ctx.scale(dpr, dpr);

    // Create silver metallic gradient
    const gradient = ctx.createLinearGradient(0, 0, rect.width, rect.height);
    gradient.addColorStop(0, "#d1d5db");
    gradient.addColorStop(0.3, "#e5e7eb");
    gradient.addColorStop(0.5, "#9ca3af");
    gradient.addColorStop(0.8, "#d1d5db");
    gradient.addColorStop(1, "#9ca3af");

    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, rect.width, rect.height);

    // Overlay text
    ctx.fillStyle = "#334155";
    ctx.font = "bold 14px sans-serif";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText("✨ Scratch to Reveal! ✨", rect.width / 2, rect.height / 2 - 8);

    ctx.font = "11px sans-serif";
    ctx.fillStyle = "#64748b";
    ctx.fillText("Special Welcome Reward", rect.width / 2, rect.height / 2 + 16);
  }, [isRevealed]);

  useEffect(() => {
    if (!isRevealed) {
      initCanvas();
    }
  }, [initCanvas, isRevealed]);

  const checkScratchPercentage = () => {
    const canvas = canvasRef.current;
    if (!canvas || isRevealed) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const width = canvas.width;
    const height = canvas.height;
    const imageData = ctx.getImageData(0, 0, width, height);
    const pixels = imageData.data;
    let transparentCount = 0;

    const totalSampled = pixels.length / 16;
    for (let i = 3; i < pixels.length; i += 16) {
      if (pixels[i] === 0) {
        transparentCount++;
      }
    }

    const percentage = (transparentCount / totalSampled) * 100;
    if (percentage > 35) {
      setIsRevealed(true);
      if (onScratchComplete) {
        onScratchComplete();
      }
    }
  };

  const scratch = (clientX: number, clientY: number) => {
    const canvas = canvasRef.current;
    if (!canvas || isRevealed) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const rect = canvas.getBoundingClientRect();
    const x = clientX - rect.left;
    const y = clientY - rect.top;

    ctx.globalCompositeOperation = "destination-out";
    ctx.beginPath();
    ctx.arc(x, y, 22, 0, Math.PI * 2);
    ctx.fill();

    checkScratchPercentage();
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    setIsDrawing(true);
    scratch(e.clientX, e.clientY);
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDrawing) return;
    scratch(e.clientX, e.clientY);
  };

  const handleMouseUp = () => {
    setIsDrawing(false);
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    setIsDrawing(true);
    if (e.touches[0]) {
      scratch(e.touches[0].clientX, e.touches[0].clientY);
    }
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isDrawing) return;
    if (e.touches[0]) {
      scratch(e.touches[0].clientX, e.touches[0].clientY);
    }
  };

  const handleTouchEnd = () => {
    setIsDrawing(false);
  };

  const handleCopyCode = async () => {
    try {
      await navigator.clipboard.writeText(referenceCode);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback
    }
  };

  return (
    <div className="w-full max-w-[340px] mx-auto">
      {/* Scratch Box Container (Responsive for 320px+) */}
      <div
        ref={containerRef}
        className="relative w-full aspect-[16/10] min-h-[180px] rounded-2xl overflow-hidden shadow-lg border-2 border-amber-300/60 bg-gradient-to-br from-amber-500 via-indigo-600 to-indigo-800 text-white p-4 sm:p-5 flex flex-col justify-between"
      >
        {/* Underlying Reward Content */}
        <div className="flex flex-col h-full justify-between z-0">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-white/20 backdrop-blur-md text-[10px] font-medium tracking-wide">
              <Sparkles className="w-3 h-3 text-amber-300" />
              <span className="truncate max-w-[120px]">{shopName}</span>
            </div>
            <span className="text-[10px] text-amber-200 uppercase tracking-wider font-bold">
              Reward
            </span>
          </div>

          <div className="my-auto py-1 text-center">
            <h3 className="text-lg sm:text-2xl font-black text-amber-100 drop-shadow-xs tracking-tight">
              {rewardTitle}
            </h3>
            {rewardDescription && (
              <p className="text-[11px] sm:text-xs text-white/90 mt-0.5 line-clamp-2">
                {rewardDescription}
              </p>
            )}
          </div>

          <div className="flex items-center justify-between text-[10px] sm:text-[11px] text-white/80 border-t border-white/20 pt-1.5">
            <span>Show at cashier</span>
            {expiresAt && (
              <span className="text-amber-200 text-[10px]">
                Valid: {new Date(expiresAt).toLocaleDateString()}
              </span>
            )}
          </div>
        </div>

        {/* Scratch Canvas Overlay */}
        {!isRevealed && (
          <canvas
            ref={canvasRef}
            className="absolute inset-0 w-full h-full cursor-pointer touch-none z-10 select-none transition-opacity duration-300"
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseUp}
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleTouchEnd}
          />
        )}
      </div>

      {/* Reference Code Card */}
      <div className="mt-4 p-3.5 sm:p-4 bg-white border border-slate-200 rounded-2xl shadow-xs text-center">
        <p className="text-[11px] text-slate-500 font-bold uppercase tracking-wider">
          Reward Reference Code
        </p>
        <div className="mt-2 flex items-center justify-center gap-2">
          <div className="font-mono text-base sm:text-xl font-extrabold text-slate-900 tracking-wider bg-slate-100 px-3 py-1.5 rounded-xl border border-slate-200 select-all">
            {referenceCode}
          </div>
          <button
            onClick={handleCopyCode}
            className="p-2 text-slate-600 hover:text-indigo-600 hover:bg-indigo-50 border border-slate-200 rounded-xl transition-colors min-h-[40px] min-w-[40px] flex items-center justify-center"
            title="Copy Reference Code"
          >
            {copied ? (
              <Check className="w-4 h-4 text-emerald-600" />
            ) : (
              <Copy className="w-4 h-4" />
            )}
          </button>
        </div>

        <div className="mt-2.5 flex items-center justify-center gap-1.5 text-[11px] text-emerald-700 bg-emerald-50 py-1 px-2.5 rounded-lg border border-emerald-100">
          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 flex-shrink-0" />
          <span>Show this code to store cashier to redeem</span>
        </div>
      </div>
    </div>
  );
};
