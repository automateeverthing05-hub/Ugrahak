import type { Metadata } from "next";
import Link from "next/link";
import {
  Store,
  Mail,
  HelpCircle,
  CreditCard,
  QrCode,
  ShieldCheck,
  Trash2,
  Clock,
  ArrowLeft,
  Sparkles,
  MessageSquare,
} from "lucide-react";
import { Footer } from "@/components/layout/Footer";

export const metadata: Metadata = {
  title: "Contact Support | Ugrahak",
  description:
    "Get in touch with the Ugrahak support team for merchant assistance, technical issues, billing, and account help.",
};

export default function ContactPage() {
  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-between">
      {/* Navigation Header */}
      <header className="border-b border-slate-200 bg-white sticky top-0 z-20">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-indigo-600 flex items-center justify-center text-white font-bold shadow-xs">
              <Store className="w-5 h-5" />
            </div>
            <span className="font-extrabold text-lg text-slate-900 tracking-tight">
              Ugrahak
            </span>
          </Link>

          <div className="flex items-center gap-3">
            <Link
              href="/"
              className="text-xs sm:text-sm font-semibold text-slate-600 hover:text-indigo-600 inline-flex items-center gap-1 transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Back to Home</span>
            </Link>
            <Link
              href="/signup"
              className="text-xs sm:text-sm font-bold text-white bg-indigo-600 hover:bg-indigo-700 px-3.5 py-2 rounded-xl transition-colors shadow-xs"
            >
              Start Free Trial
            </Link>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-5xl mx-auto px-4 sm:px-6 py-10 sm:py-16 flex-1 w-full">
        {/* Title & Badge */}
        <div className="mb-10 text-center max-w-2xl mx-auto">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-indigo-50 border border-indigo-200 text-indigo-700 text-xs font-bold mb-3">
            <HelpCircle className="w-3.5 h-3.5 text-indigo-600" />
            <span>Dedicated Merchant Assistance</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tight">
            We&apos;re Here to Help Your Store Grow
          </h1>
          <p className="text-xs sm:text-sm text-slate-600 mt-2">
            Have questions about setting up your shop QR code, broadcast notifications, or billing? Reach out to our dedicated support team.
          </p>
        </div>

        {/* 2-Column Support Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start mb-12">
          {/* Left: Support Channels & Official Info (5 Cols) */}
          <div className="lg:col-span-5 space-y-4">
            {/* Primary Email Card */}
            <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-xs space-y-4">
              <div className="w-10 h-10 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold">
                <Mail className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-extrabold text-slate-900">
                  Email Support Desk
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Send your questions, feature feedback, or technical queries.
                </p>
              </div>

              <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200">
                <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wide">
                  Official Support Email
                </p>
                <a
                  href="mailto:supportugrahak@gmail.com"
                  className="text-sm font-bold text-indigo-600 font-mono mt-0.5 break-all hover:underline block"
                >
                  supportugrahak@gmail.com
                </a>
              </div>

              <div className="flex items-center gap-2 text-xs text-slate-600">
                <Clock className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                <span>Response Time: Typically within 24–48 hours</span>
              </div>
            </div>

            {/* Business Entity Information Card */}
            <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-xs space-y-3">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-indigo-600" />
                <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                  Entity Information
                </h4>
              </div>

              <div className="text-xs text-slate-600 space-y-1.5 leading-relaxed">
                <p>
                  <strong>Platform:</strong> Ugrahak SaaS
                </p>
                <p>
                  <strong>Operating Entity:</strong>{" "}
                  <span className="text-slate-800 font-medium">
                    Ugrahak
                  </span>
                </p>
                <p>
                  <strong>Operating Hours:</strong> Monday to Saturday, 10:00 AM – 6:00 PM IST
                </p>
              </div>
            </div>
          </div>

          {/* Right: Support Categories & How to Request (7 Cols) */}
          <div className="lg:col-span-7 space-y-4">
            <h3 className="text-xs font-extrabold text-slate-400 uppercase tracking-wider px-1">
              Common Support Requests &amp; Instructions
            </h3>

            {/* Category 1: Technical & QR Setup */}
            <div className="bg-white border border-slate-200 rounded-3xl p-5 sm:p-6 shadow-xs space-y-2">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center flex-shrink-0">
                  <QrCode className="w-4 h-4" />
                </div>
                <h4 className="text-sm font-bold text-slate-900">
                  Shop QR Code &amp; Scratch Card Setup
                </h4>
              </div>
              <p className="text-xs text-slate-600 leading-relaxed pl-11">
                Need help downloading high-resolution QR codes for counter acrylic stands or configuring your first-visit reward scratch cards? Include your <strong>Shop Name</strong> and registered phone number in your message.
              </p>
            </div>

            {/* Category 2: Billing & Subscription */}
            <div className="bg-white border border-slate-200 rounded-3xl p-5 sm:p-6 shadow-xs space-y-2">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center flex-shrink-0">
                  <CreditCard className="w-4 h-4" />
                </div>
                <h4 className="text-sm font-bold text-slate-900">
                  Billing, Invoices &amp; Plan Upgrades
                </h4>
              </div>
              <p className="text-xs text-slate-600 leading-relaxed pl-11">
                For questions regarding monthly plans (Starter, Growth, Pro), invoice copies, duplicate payments, or cancellation, please email with your <strong>Registered Email</strong> and recent Transaction ID.
              </p>
            </div>

            {/* Category 3: Account & Data Deletion */}
            <div className="bg-white border border-slate-200 rounded-3xl p-5 sm:p-6 shadow-xs space-y-2">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center flex-shrink-0">
                  <Trash2 className="w-4 h-4" />
                </div>
                <h4 className="text-sm font-bold text-slate-900">
                  Account or Customer Data Deletion
                </h4>
              </div>
              <p className="text-xs text-slate-600 leading-relaxed pl-11">
                To request permanent deletion of your merchant account or customer loyalty phone records, write to our support desk with the subject line <em>&quot;Data Deletion Request&quot;</em>. Requests are fulfilled within 30 days.
              </p>
            </div>
          </div>
        </div>

        {/* Quick FAQ Section */}
        <div className="mt-12 bg-white border border-slate-200 rounded-3xl p-6 sm:p-8 shadow-xs">
          <div className="text-center sm:text-left mb-6">
            <h3 className="text-lg font-black text-slate-900 flex items-center justify-center sm:justify-start gap-2">
              <Sparkles className="w-4 h-4 text-indigo-600" />
              Frequently Asked Questions
            </h3>
            <p className="text-xs text-slate-500 mt-1">
              Quick answers to common questions asked by store owners.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100">
              <h5 className="text-xs font-bold text-slate-900">
                Do I need to buy special barcode hardware?
              </h5>
              <p className="text-[11px] text-slate-600 mt-1 leading-relaxed">
                No! Ugrahak runs entirely on standard smartphones. You simply print your shop QR code from your dashboard and place it at your billing counter.
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100">
              <h5 className="text-xs font-bold text-slate-900">
                How do customers receive my offers?
              </h5>
              <p className="text-[11px] text-slate-600 mt-1 leading-relaxed">
                When customers scan your QR and allow browser notifications, they receive instant Web Push notifications directly on their phone screen when you click &quot;Send Offer&quot;.
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100">
              <h5 className="text-xs font-bold text-slate-900">
                Can other shops see my customer database?
              </h5>
              <p className="text-[11px] text-slate-600 mt-1 leading-relaxed">
                Never. Every merchant database is 100% isolated via PostgreSQL Row Level Security. Only you have access to your customer list and visits.
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100">
              <h5 className="text-xs font-bold text-slate-900">
                How does the 7-Day Free Trial work?
              </h5>
              <p className="text-[11px] text-slate-600 mt-1 leading-relaxed">
                You get full access to the platform for 7 days with zero credit card commitment. You only pay if you decide to continue after testing.
              </p>
            </div>
          </div>
        </div>
      </main>

      {/* Global Footer */}
      <Footer />
    </div>
  );
}

