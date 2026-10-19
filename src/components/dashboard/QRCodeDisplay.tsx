"use client";

import React, { useState, useRef } from "react";
import { QRCodeSVG } from "qrcode.react";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Copy, Check, ExternalLink, Download, Printer, Sparkles } from "lucide-react";

interface QRCodeDisplayProps {
  slug: string;
  shopName?: string | null;
  appUrl?: string;
}

export const QRCodeDisplay: React.FC<QRCodeDisplayProps> = ({
  slug,
  shopName,
  appUrl,
}) => {
  const [copied, setCopied] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  const qrRef = useRef<HTMLDivElement>(null);

  const cleanShopName = shopName?.trim() || "Apni Dukaan";

  const baseUrl =
    typeof window !== "undefined"
      ? window.location.origin
      : appUrl || process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

  const shopUrl = `${baseUrl}/shop/${slug}`;

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(shopUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback
    }
  };

  const handlePrint = () => {
    if (typeof window !== "undefined") {
      window.print();
    }
  };

  /**
   * Generates a crystal-clear, high-resolution (1200x1500) print-ready QR poster:
   * 1. Header: SCAN FOR OFFER
   * 2. Center: Crisp Scannable QR Code
   * 3. Footer: Authentic Merchant Shop Name
   */
  const handleDownload = () => {
    const svgElement = qrRef.current?.querySelector("svg");
    if (!svgElement) return;

    setIsDownloading(true);

    const svgData = new XMLSerializer().serializeToString(svgElement);
    const svgBlob = new Blob([svgData], { type: "image/svg+xml;charset=utf-8" });
    const blobUrl = URL.createObjectURL(svgBlob);
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");
    const img = new Image();

    // High resolution canvas for sharp physical printing (300 DPI equivalent)
    const canvasWidth = 1200;
    const canvasHeight = 1500;
    canvas.width = canvasWidth;
    canvas.height = canvasHeight;

    img.onload = () => {
      if (ctx) {
        // 1. Background
        ctx.fillStyle = "#ffffff";
        ctx.fillRect(0, 0, canvasWidth, canvasHeight);

        // 2. Elegant double-border frame
        ctx.strokeStyle = "#0f172a";
        ctx.lineWidth = 14;
        ctx.strokeRect(40, 40, canvasWidth - 80, canvasHeight - 80);

        ctx.strokeStyle = "#6366f1";
        ctx.lineWidth = 4;
        ctx.strokeRect(60, 60, canvasWidth - 120, canvasHeight - 120);

        // 3. Top Tag: "SCAN FOR OFFER"
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";

        // Decorative Pill Background for Header
        const pillWidth = 720;
        const pillHeight = 100;
        const pillX = (canvasWidth - pillWidth) / 2;
        const pillY = 160;
        const radius = 50;

        ctx.fillStyle = "#0f172a";
        ctx.beginPath();
        ctx.roundRect(pillX, pillY, pillWidth, pillHeight, radius);
        ctx.fill();

        ctx.fillStyle = "#ffffff";
        ctx.font = "900 48px -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif";
        ctx.letterSpacing = "6px";
        ctx.fillText("SCAN FOR OFFER", canvasWidth / 2, pillY + pillHeight / 2 + 2);

        // Subtitle badge
        ctx.fillStyle = "#4f46e5";
        ctx.font = "bold 26px -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif";
        ctx.letterSpacing = "2px";
        ctx.fillText("🎁 SCAN & WIN EXCLUSIVE REWARDS", canvasWidth / 2, 310);

        // 4. Center QR Code with subtle boundary
        const qrSize = 640;
        const qrX = (canvasWidth - qrSize) / 2;
        const qrY = 370;

        // White card background for QR
        ctx.fillStyle = "#ffffff";
        ctx.strokeStyle = "#e2e8f0";
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.roundRect(qrX - 24, qrY - 24, qrSize + 48, qrSize + 48, 24);
        ctx.fill();
        ctx.stroke();

        ctx.drawImage(img, qrX, qrY, qrSize, qrSize);

        // 5. Divider Line
        ctx.strokeStyle = "#cbd5e1";
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.moveTo(160, 1110);
        ctx.lineTo(canvasWidth - 160, 1110);
        ctx.stroke();

        // 6. Bottom Shop Name (exact merchant profile name)
        ctx.fillStyle = "#0f172a";
        ctx.font = "900 64px -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif";
        ctx.letterSpacing = "1px";

        // Truncate or fit if shop name is long
        let displayShopName = cleanShopName;
        if (displayShopName.length > 28) {
          displayShopName = displayShopName.slice(0, 26) + "...";
        }
        ctx.fillText(displayShopName, canvasWidth / 2, 1190);

        // Footer small branding
        ctx.fillStyle = "#64748b";
        ctx.font = "600 24px -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif";
        ctx.letterSpacing = "2px";
        ctx.fillText("POWERED BY UGRAHAK • SCAN KARO, REWARD PAO", canvasWidth / 2, 1270);

        // Export PNG
        const pngFile = canvas.toDataURL("image/png");
        const downloadLink = document.createElement("a");
        downloadLink.download = `${slug}-scan-for-offer-qr.png`;
        downloadLink.href = pngFile;
        downloadLink.click();
      }
      URL.revokeObjectURL(blobUrl);
      setIsDownloading(false);
    };

    img.src = blobUrl;
  };

  return (
    <Card
      title="Shop QR Poster"
      description="Billing counter par lagane ke liye is QR poster ko download ya print karein."
      className="flex flex-col items-center text-center"
    >
      {/* Printable Poster Container */}
      <div
        id="ugrahak-printable-qr-poster"
        ref={qrRef}
        className="w-full max-w-[320px] sm:max-w-[340px] mx-auto my-3 bg-white border-2 border-slate-900 rounded-3xl p-5 sm:p-6 shadow-md flex flex-col items-center text-center transition-all"
      >
        {/* TOP: Required Design Header "SCAN FOR OFFER" */}
        <div className="w-full bg-slate-900 text-white py-2.5 px-4 rounded-full shadow-xs mb-3 flex items-center justify-center gap-1.5">
          <Sparkles className="w-4 h-4 text-amber-400 flex-shrink-0 animate-pulse" />
          <span className="text-sm sm:text-base font-black tracking-widest uppercase">
            SCAN FOR OFFER
          </span>
          <Sparkles className="w-4 h-4 text-amber-400 flex-shrink-0 animate-pulse" />
        </div>

        <p className="text-[11px] font-bold text-indigo-600 uppercase tracking-wider mb-3">
          🎁 Scan &amp; Win Instant Reward
        </p>

        {/* CENTER: Scannable QR Code */}
        <div className="w-full aspect-square bg-white border border-slate-200 rounded-2xl p-3 shadow-inner flex items-center justify-center max-w-[220px] sm:max-w-[240px] mx-auto">
          <QRCodeSVG
            value={shopUrl}
            size={220}
            level="H"
            includeMargin={false}
            className="w-full h-auto max-w-[200px] sm:max-w-[220px]"
          />
        </div>

        {/* BOTTOM DIVIDER & SHOP NAME */}
        <div className="w-full mt-4 pt-3 border-t border-slate-200">
          <h3 className="text-base sm:text-lg font-black text-slate-900 tracking-tight leading-snug break-words px-1">
            {cleanShopName}
          </h3>
          <p className="text-[10px] sm:text-[11px] font-semibold text-slate-500 tracking-wider uppercase mt-1">
            Apna Grahak Loyalty Poster
          </p>
        </div>
      </div>

      {/* URL Link Box */}
      <div className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2 sm:p-2.5 flex items-center justify-between gap-2 mt-2">
        <span className="text-[11px] sm:text-xs text-slate-600 truncate font-mono select-all">
          {shopUrl}
        </span>
        <button
          onClick={handleCopy}
          className="p-1.5 text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors flex-shrink-0 min-h-[36px] min-w-[36px] flex items-center justify-center"
          title="Copy Link"
        >
          {copied ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
        </button>
      </div>

      {/* Action Buttons: Download, Print, and Preview */}
      <div className="flex flex-col sm:flex-row gap-2 w-full mt-4">
        <Button
          variant="outline"
          size="sm"
          onClick={handleDownload}
          disabled={isDownloading}
          className="flex-1 gap-1.5 text-xs min-h-[42px] font-bold text-slate-800 border-slate-300 hover:bg-slate-50"
        >
          <Download className="w-4 h-4 text-indigo-600" />
          <span>{isDownloading ? "Generating..." : "QR Poster Download"}</span>
        </Button>

        <Button
          variant="outline"
          size="sm"
          onClick={handlePrint}
          className="flex-1 gap-1.5 text-xs min-h-[42px] font-bold text-slate-800 border-slate-300 hover:bg-slate-50"
        >
          <Printer className="w-4 h-4 text-slate-700" />
          <span>Print Poster</span>
        </Button>

        <a
          href={`/shop/${slug}`}
          target="_blank"
          rel="noopener noreferrer"
          className="flex-1"
        >
          <Button
            variant="secondary"
            size="sm"
            className="w-full gap-1.5 text-xs min-h-[42px] font-bold text-indigo-700 bg-indigo-50 hover:bg-indigo-100 border border-indigo-200"
          >
            <ExternalLink className="w-4 h-4" />
            <span>QR Page Kholein</span>
          </Button>
        </a>
      </div>
    </Card>
  );
};

