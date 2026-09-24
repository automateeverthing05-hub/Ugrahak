import type { Metadata } from "next";
import Link from "next/link";
import { Store, RefreshCw, CheckCircle2, Clock, CreditCard, HelpCircle, ArrowLeft, Mail } from "lucide-react";
import { Footer } from "@/components/layout/Footer";

export const metadata: Metadata = {
  title: "Refund & Cancellation Policy | Ugrahak",
  description:
    "Refund and Cancellation Policy for Ugrahak SaaS subscriptions and merchant plans.",
};

export default function RefundPolicyPage() {
  const lastUpdated = "September 23, 2026";

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
              href="/pricing"
              className="text-xs sm:text-sm font-bold text-white bg-indigo-600 hover:bg-indigo-700 px-3.5 py-2 rounded-xl transition-colors shadow-xs"
            >
              View Plans
            </Link>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-4xl mx-auto px-4 sm:px-6 py-10 sm:py-16 flex-1 w-full">
        {/* Title & Badge */}
        <div className="mb-10 text-center sm:text-left border-b border-slate-200 pb-8">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-indigo-50 border border-indigo-200 text-indigo-700 text-xs font-bold mb-3">
            <RefreshCw className="w-3.5 h-3.5 text-indigo-600" />
            <span>Fair Billing &amp; Clear Policies</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tight">
            Refund &amp; Cancellation Policy
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-2">
            Last Updated: {lastUpdated} &bull; Applicable to All Paid Ugrahak Subscriptions
          </p>
        </div>

        {/* Policy Sections */}
        <div className="space-y-8 text-slate-700 text-sm sm:text-base leading-relaxed">
          {/* 1. 7-Day Free Trial */}
          <section className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-8 shadow-xs">
            <h2 className="text-lg sm:text-xl font-bold text-slate-900 mb-3 flex items-center gap-2">
              <span className="w-7 h-7 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center font-black text-xs">
                1
              </span>
              7-Day Free Trial — Zero Risk
            </h2>
            <p className="text-slate-600">
              Every merchant receives a complimentary <strong>7-Day Free Trial</strong> upon account registration. During this trial period, you have full access to generate your counter QR code, configure scratch card rewards, and test customer check-ins without entering credit card or payment information. You will never be charged during the trial unless you explicitly choose to upgrade to a paid monthly plan.
            </p>
          </section>

          {/* 2. Subscription Cancellation */}
          <section className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-8 shadow-xs">
            <h2 className="text-lg sm:text-xl font-bold text-slate-900 mb-3 flex items-center gap-2">
              <span className="w-7 h-7 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center font-black text-xs">
                2
              </span>
              Subscription Cancellation
            </h2>
            <p className="text-slate-600">
              Merchants may cancel their active monthly subscription at any time directly through the dashboard billing settings or by sending a cancellation request email to our support team.
            </p>
            <div className="mt-4 p-4 rounded-2xl bg-slate-50 border border-slate-200 text-xs sm:text-sm space-y-2 text-slate-600">
              <p>
                <strong>What happens when you cancel:</strong>
              </p>
              <ul className="list-disc list-inside space-y-1 text-slate-600">
                <li>Your subscription will not auto-renew at the end of the current billing cycle.</li>
                <li>You retain uninterrupted access to all paid features until the expiration date of your current prepaid billing period.</li>
                <li>Your existing customer check-in history and QR codes remain preserved safely in your account.</li>
              </ul>
            </div>
          </section>

          {/* 3. Plan Upgrades & Downgrades */}
          <section className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-8 shadow-xs">
            <h2 className="text-lg sm:text-xl font-bold text-slate-900 mb-3 flex items-center gap-2">
              <span className="w-7 h-7 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center font-black text-xs">
                3
              </span>
              Plan Upgrades &amp; Downgrades
            </h2>
            <ul className="text-xs sm:text-sm text-slate-600 space-y-2 list-disc list-inside">
              <li><strong>Upgrading a Plan:</strong> When upgrading to a higher tier (e.g. Starter to Growth or Pro), the upgrade takes effect immediately, granting higher customer limits and additional weekly broadcast allowances.</li>
              <li><strong>Downgrading a Plan:</strong> Plan downgrades take effect at the start of the next billing cycle. Existing customer records are preserved, but active weekly offer broadcast quotas will adjust to the lower tier.</li>
            </ul>
          </section>

          {/* 4. Payment Failures & Grace Period */}
          <section className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-8 shadow-xs">
            <h2 className="text-lg sm:text-xl font-bold text-slate-900 mb-3 flex items-center gap-2">
              <span className="w-7 h-7 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center font-black text-xs">
                4
              </span>
              Payment Failures &amp; Grace Period
            </h2>
            <p className="text-slate-600">
              If an automatic monthly recurring payment fails, we provide a <strong>3-day grace period</strong> during which our billing system will attempt retry notifications. Your store QR codes and check-in flow will continue functioning during the grace period to avoid disruption at your store counter.
            </p>
          </section>

          {/* 5. Duplicate or Erroneous Charges */}
          <section className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-8 shadow-xs">
            <h2 className="text-lg sm:text-xl font-bold text-slate-900 mb-3 flex items-center gap-2">
              <span className="w-7 h-7 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center font-black text-xs">
                5
              </span>
              Duplicate &amp; Erroneous Transactions
            </h2>
            <p className="text-slate-600">
              In the rare event that your account is charged more than once for the same billing cycle due to a payment gateway timeout or bank glitch, we will provide a <strong>100% full refund of the duplicate amount</strong> immediately upon verification.
            </p>
          </section>

          {/* 6. Refund Eligibility & Rules */}
          <section className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-8 shadow-xs">
            <h2 className="text-lg sm:text-xl font-bold text-slate-900 mb-3 flex items-center gap-2">
              <span className="w-7 h-7 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center font-black text-xs">
                6
              </span>
              Refund Eligibility &amp; Scope
            </h2>
            <p className="text-slate-600 mb-3">
              Because Ugrahak is a digital cloud SaaS platform that offers an unrestricted 7-Day Free Trial before purchase, monthly subscription fees are generally <strong>non-refundable once a billing cycle has started</strong>, except under the following specific circumstances:
            </p>
            <div className="space-y-3">
              <div className="p-4 rounded-2xl bg-emerald-50/70 border border-emerald-200 text-xs sm:text-sm text-emerald-950">
                <strong>Eligible for Refund:</strong>
                <ul className="list-disc list-inside mt-1 space-y-1 text-emerald-900">
                  <li>Verified technical platform outage on our servers exceeding 72 continuous hours.</li>
                  <li>Billing system errors resulting in incorrect plan charges.</li>
                  <li>Duplicate transactions charged for the same subscription month.</li>
                </ul>
              </div>

              <div className="p-4 rounded-2xl bg-rose-50/70 border border-rose-200 text-xs sm:text-sm text-rose-950">
                <strong>Non-Refundable Situations:</strong>
                <ul className="list-disc list-inside mt-1 space-y-1 text-rose-900">
                  <li>Change of mind after actively utilizing offer broadcasts during the month.</li>
                  <li>Failure of end-customer hardware or customer refusal to scan QR codes in store.</li>
                  <li>Account termination resulting from spamming or violation of platform Terms.</li>
                </ul>
              </div>
            </div>
          </section>

          {/* 7. Refund Processing Timeline */}
          <section className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-8 shadow-xs">
            <h2 className="text-lg sm:text-xl font-bold text-slate-900 mb-3 flex items-center gap-2">
              <Clock className="w-5 h-5 text-indigo-600" />
              Refund Processing Timeline
            </h2>
            <p className="text-slate-600">
              Once an eligible refund request is reviewed and approved by our support team, the refund is initiated through our payment gateway. Funds are credited back to your original source payment method (UPI, Debit Card, Credit Card, or Net Banking) within <strong>5 to 7 business days</strong>, subject to standard Indian banking settlement timelines.
            </p>
          </section>

          {/* 8. How to Request Support */}
          <section className="bg-indigo-50/80 border border-indigo-200 rounded-3xl p-6 sm:p-8 shadow-xs">
            <h2 className="text-lg sm:text-xl font-bold text-slate-900 mb-3 flex items-center gap-2">
              <Mail className="w-5 h-5 text-indigo-600" />
              How to Submit a Refund or Billing Request
            </h2>
            <p className="text-xs sm:text-sm text-slate-700 mb-3">
              To request assistance with cancellations, invoice adjustments, or refunds, please email our billing desk with the following details:
            </p>
            <div className="p-4 rounded-2xl bg-white border border-indigo-100 text-xs sm:text-sm space-y-1.5 text-slate-700">
              <p>&bull; <strong>Registered Merchant Email:</strong> The email associated with your login.</p>
              <p>&bull; <strong>Shop Name &amp; Phone:</strong> Your registered business details.</p>
              <p>&bull; <strong>Payment / Transaction ID:</strong> From your invoice receipt.</p>
              <p>&bull; <strong>Send to:</strong> <a href="mailto:supportugrahak@gmail.com" className="text-indigo-600 font-bold hover:underline">supportugrahak@gmail.com</a></p>
            </div>
          </section>
        </div>
      </main>

      {/* Global Footer */}
      <Footer />
    </div>
  );
}

