import Link from "next/link";
import { Store, ArrowLeft } from "lucide-react";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Shop Not Found - U-Grahak",
  description: "Please scan a valid merchant QR code to view customer rewards.",
};

export default function ShopIndexPage() {
  return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4 text-center">
      <div className="w-12 h-12 rounded-xl bg-slate-200 text-slate-600 flex items-center justify-center mb-4">
        <Store className="w-6 h-6" />
      </div>
      <h1 className="text-2xl sm:text-3xl font-bold text-slate-900">
        Store QR Code Required
      </h1>
      <p className="text-sm text-slate-500 mt-2 max-w-sm">
        Please scan the QR code displayed at your local store counter to unlock rewards and exclusive offers.
      </p>
    </div>
  );
}

