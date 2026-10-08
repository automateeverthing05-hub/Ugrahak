import Link from "next/link";
import { Store, ArrowLeft } from "lucide-react";

export default function NotFound() {
  return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4 text-center">
      <div className="w-12 h-12 rounded-xl bg-slate-200 text-slate-600 flex items-center justify-center mb-4">
        <Store className="w-6 h-6" />
      </div>
      <h1 className="text-3xl font-bold text-slate-900">Store Not Found</h1>
      <p className="text-sm text-slate-500 mt-2 max-w-sm">
        The store QR code link you scanned was not found or may have been updated. Please scan the QR code displayed at the store counter.
      </p>
    </div>
  );
}

