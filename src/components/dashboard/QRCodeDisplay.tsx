"use client";

import React, { useState, useRef } from "react";
import { QRCodeSVG } from "qrcode.react";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Copy, Check, ExternalLink, Download } from "lucide-react";

interface QRCodeDisplayProps {
  slug: string;
  shopName: string;
  appUrl?: string;
}

export const QRCodeDisplay: React.FC<QRCodeDisplayProps> = ({
  slug,
  shopName,
  appUrl,
}) => {
  const [copied, setCopied] = useState(false);
  const qrRef = useRef<HTMLDivElement>(null);

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

  const handleDownload = () => {
    const svgElement = qrRef.current?.querySelector("svg");
    if (!svgElement) return;

    const svgData = new XMLSerializer().serializeToString(svgElement);
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");
    const img = new Image();

    img.onload = () => {
      canvas.width = 400;
      canvas.height = 400;
      if (ctx) {
        ctx.fillStyle = "#ffffff";
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(img, 0, 0, 400, 400);
        const pngFile = canvas.toDataURL("image/png");
        const downloadLink = document.createElement("a");
        downloadLink.download = `${slug}-qr-code.png`;
        downloadLink.href = pngFile;
        downloadLink.click();
      }
    };

    img.src = "data:image/svg+xml;base64," + btoa(unescape(encodeURIComponent(svgData)));
  };

  return (
    <Card
      title="Store QR Code"
      description="Print and place this QR code at your checkout counter to enroll customers."
      className="flex flex-col items-center text-center"
    >
      {/* QR Box (Mobile Adaptive) */}
      <div
        ref={qrRef}
        className="p-4 bg-white border border-slate-200 rounded-2xl shadow-xs my-3 flex flex-col items-center max-w-[220px] w-full mx-auto"
      >
        <div className="w-full aspect-square flex items-center justify-center">
          <QRCodeSVG
            value={shopUrl}
            size={160}
            level="H"
            includeMargin={false}
            className="w-full h-auto max-w-[160px]"
          />
        </div>
        <span className="mt-3 text-xs font-semibold text-slate-700 tracking-wide truncate max-w-full">
          {shopName}
        </span>
      </div>

      {/* URL Link Box */}
      <div className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2 sm:p-2.5 flex items-center justify-between gap-2 mt-1">
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

      {/* Action Buttons */}
      <div className="flex flex-col sm:flex-row gap-2 w-full mt-4">
        <Button
          variant="outline"
          size="sm"
          onClick={handleDownload}
          className="flex-1 gap-1.5 text-xs min-h-[40px]"
        >
          <Download className="w-3.5 h-3.5" />
          <span>Download QR</span>
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
            className="w-full gap-1.5 text-xs min-h-[40px]"
          >
            <ExternalLink className="w-3.5 h-3.5" />
            <span>Open Page</span>
          </Button>
        </a>
      </div>
    </Card>
  );
};
