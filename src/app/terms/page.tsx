import type { Metadata } from "next";
import Link from "next/link";
import { Store, FileText, CheckCircle2, AlertTriangle, Scale, ShieldAlert, ArrowLeft, Mail } from "lucide-react";
import { Footer } from "@/components/layout/Footer";

export const metadata: Metadata = {
  title: "Terms & Conditions | Ugrahak",
  description:
    "Terms and Conditions governing the use of the Ugrahak merchant SaaS platform.",
};

export default function TermsPage() {
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
              href="/signup"
              className="text-xs sm:text-sm font-bold text-white bg-indigo-600 hover:bg-indigo-700 px-3.5 py-2 rounded-xl transition-colors shadow-xs"
            >
              Start Free Trial
            </Link>
          </div>
        </div>
      </header>

      {/* Main Legal Content */}
      <main className="max-w-4xl mx-auto px-4 sm:px-6 py-10 sm:py-16 flex-1 w-full">
        {/* Title & Badge */}
        <div className="mb-10 text-center sm:text-left border-b border-slate-200 pb-8">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-indigo-50 border border-indigo-200 text-indigo-700 text-xs font-bold mb-3">
            <Scale className="w-3.5 h-3.5 text-indigo-600" />
            <span>Merchant Agreement &amp; Usage Rules</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tight">
            Terms &amp; Conditions
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-2">
            Last Updated: {lastUpdated} &bull; Please read these terms carefully before using Ugrahak
          </p>
        </div>

        {/* Sections */}
        <div className="space-y-8 text-slate-700 text-sm sm:text-base leading-relaxed">
          {/* 1. Acceptance */}
          <section className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-8 shadow-xs">
            <h2 className="text-lg sm:text-xl font-bold text-slate-900 mb-3 flex items-center gap-2">
              <span className="w-7 h-7 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center font-black text-xs">
                1
              </span>
              Acceptance of Terms
            </h2>
            <p className="text-slate-600">
              By accessing, registering for, or using the <strong>Ugrahak</strong> SaaS platform (the &quot;Service&quot;), operated by{" "}
              <span className="font-semibold text-slate-800">Ugrahak</span>,
              you (&quot;Merchant,&quot; &quot;User,&quot; or &quot;Subscriber&quot;) agree to be legally bound by these Terms &amp; Conditions and our Privacy Policy. If you do not agree to these terms, do not register or use the Service.
            </p>
          </section>

          {/* 2. Service Description */}
          <section className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-8 shadow-xs">
            <h2 className="text-lg sm:text-xl font-bold text-slate-900 mb-3 flex items-center gap-2">
              <span className="w-7 h-7 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center font-black text-xs">
                2
              </span>
              Service Description
            </h2>
            <p className="text-slate-600">
              Ugrahak is a cloud-based software subscription platform designed for local businesses, shops, cafes, salons, and retail establishments. The platform enables merchants to:
            </p>
            <ul className="mt-3 text-xs sm:text-sm text-slate-600 space-y-1.5 list-disc list-inside">
              <li>Display a store QR code at their counter to capture customer check-ins.</li>
              <li>Offer first-visit digital scratch card rewards with promotional codes.</li>
              <li>Broadcast instant push notifications and offers to enrolled customers.</li>
              <li>Publish localized deals discoverable in the Nearby Offers section (100–200m radius).</li>
              <li>Schedule automated 30-minute post-visit Google Maps review link requests.</li>
            </ul>
          </section>

          {/* 3. Merchant Account & Information */}
          <section className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-8 shadow-xs">
            <h2 className="text-lg sm:text-xl font-bold text-slate-900 mb-3 flex items-center gap-2">
              <span className="w-7 h-7 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center font-black text-xs">
                3
              </span>
              Merchant Account Responsibilities
            </h2>
            <p className="text-slate-600">
              Merchants must provide accurate, current, and complete business information during registration (including Owner Name, Business Name, Valid 10-digit Phone, and Business Email). You are responsible for maintaining the confidentiality of your account credentials and for all activities that occur under your account.
            </p>
          </section>

          {/* 4. Customer Data Responsibility & Anti-Spam */}
          <section className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-8 shadow-xs">
            <h2 className="text-lg sm:text-xl font-bold text-slate-900 mb-3 flex items-center gap-2">
              <span className="w-7 h-7 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center font-black text-xs">
                4
              </span>
              Customer Data &amp; Anti-Spam Compliance
            </h2>
            <p className="text-slate-600">
              Merchants are solely responsible for ensuring that their counter QR capture process complies with applicable Indian data privacy principles. You agree not to send misleading, abusive, defamatory, or unsolicited spam offers to your customers. Customers retain the right to disable web push notifications at any time.
            </p>
          </section>

          {/* 5. Rewards, Scratch Cards & Counter Discounts */}
          <section className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-8 shadow-xs">
            <h2 className="text-lg sm:text-xl font-bold text-slate-900 mb-3 flex items-center gap-2">
              <span className="w-7 h-7 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center font-black text-xs">
                5
              </span>
              Rewards, Scratch Cards &amp; Store Discounts
            </h2>
            <p className="text-slate-600">
              Merchants configure their own discount amounts, scratch card probabilities, and reward validity periods. <strong>Ugrahak is a software facilitator and is not a party to the commercial transaction between the merchant and the end customer.</strong> The merchant is solely responsible for honoring validly presented discount codes and scratch card rewards at their billing counter.
            </p>
          </section>

          {/* 6. Push Notifications & Delivery Limits */}
          <section className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-8 shadow-xs">
            <h2 className="text-lg sm:text-xl font-bold text-slate-900 mb-3 flex items-center gap-2">
              <span className="w-7 h-7 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center font-black text-xs">
                6
              </span>
              Offer Broadcasts &amp; Notification Delivery
            </h2>
            <p className="text-slate-600">
              Push notification delivery depends on customer device state, browser background execution permissions, battery optimization settings, and active internet connectivity. While Ugrahak dispatches notifications immediately via Firebase Cloud Messaging without scheduled delays, we cannot guarantee 100% receipt if an end user&apos;s device is offline or has revoked notification permissions.
            </p>
          </section>

          {/* 7. Google Reviews Feature */}
          <section className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-8 shadow-xs">
            <h2 className="text-lg sm:text-xl font-bold text-slate-900 mb-3 flex items-center gap-2">
              <span className="w-7 h-7 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center font-black text-xs">
                7
              </span>
              Google Review Requests
            </h2>
            <p className="text-slate-600">
              The automated Google review feature directs customers to the merchant&apos;s publicly accessible Google Maps review page. Ugrahak does not generate, alter, influence, post fake reviews, or interfere with Google&apos;s third-party review systems.
            </p>
          </section>

          {/* 8. Prohibited Activities */}
          <section className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-8 shadow-xs">
            <h2 className="text-lg sm:text-xl font-bold text-slate-900 mb-3 flex items-center gap-2">
              <span className="w-7 h-7 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center font-black text-xs">
                8
              </span>
              Prohibited Activities &amp; Platform Misuse
            </h2>
            <p className="text-slate-600 mb-2">
              Merchants agree not to engage in any of the following activities:
            </p>
            <ul className="text-xs sm:text-sm text-slate-600 space-y-1.5 list-disc list-inside">
              <li>Reverse engineering, decompiling, or attempting to extract Ugrahak source code.</li>
              <li>Sending fraudulent, illegal, obscene, gambling-related, or deceptive promotional messages.</li>
              <li>Automated bot scraping or flooding the check-in or notification endpoints.</li>
              <li>Impersonating another business, brand, or merchant.</li>
              <li>Reselling or subleasing Ugrahak accounts without authorized partner agreement.</li>
            </ul>
          </section>

          {/* 9. Subscriptions, 7-Day Free Trial & Pricing */}
          <section className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-8 shadow-xs">
            <h2 className="text-lg sm:text-xl font-bold text-slate-900 mb-3 flex items-center gap-2">
              <span className="w-7 h-7 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center font-black text-xs">
                9
              </span>
              Subscriptions, 7-Day Free Trial &amp; Plans
            </h2>
            <p className="text-slate-600">
              New merchant accounts include a <strong>7-Day Free Trial</strong> without requiring upfront payment information. Following the trial, continued access to broadcast features and customer capacity requires subscribing to a paid monthly plan (Starter, Growth, or Pro). All fees are quoted in Indian Rupees (INR) and are subject to applicable taxes.
            </p>
          </section>

          {/* 10. No Unrealistic Guarantees */}
          <section className="bg-amber-50/70 border border-amber-200 rounded-3xl p-6 sm:p-8 shadow-xs">
            <h2 className="text-lg sm:text-xl font-bold text-slate-900 mb-2 flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-amber-600" />
              No Warranty of Guaranteed Revenue or Footfall
            </h2>
            <p className="text-xs sm:text-sm text-slate-700 leading-relaxed">
              Ugrahak provides digital software tools designed to help merchants engage with their customers. <strong>We do NOT guarantee specific business growth, revenue numbers, footfall increases, customer return percentages, or merchant profitability.</strong> Business success depends on merchant product quality, pricing, store location, and external retail market factors.
            </p>
          </section>

          {/* 11. Limitation of Liability */}
          <section className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-8 shadow-xs">
            <h2 className="text-lg sm:text-xl font-bold text-slate-900 mb-3 flex items-center gap-2">
              <span className="w-7 h-7 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center font-black text-xs">
                11
              </span>
              Limitation of Liability
            </h2>
            <p className="text-slate-600">
              To the maximum extent permitted by applicable Indian law, Ugrahak and its operators shall not be liable for any indirect, incidental, special, consequential, or punitive damages, loss of profits, loss of customer goodwill, or service interruptions. Our total cumulative liability arising from any claim under these Terms shall not exceed the subscription amount paid by the merchant in the one (1) month immediately preceding the event.
            </p>
          </section>

          {/* 12. Account Termination */}
          <section className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-8 shadow-xs">
            <h2 className="text-lg sm:text-xl font-bold text-slate-900 mb-3 flex items-center gap-2">
              <span className="w-7 h-7 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center font-black text-xs">
                12
              </span>
              Account Suspension &amp; Termination
            </h2>
            <p className="text-slate-600">
              We reserve the right to suspend or terminate merchant accounts with immediate effect in cases of verified fraud, illegal promotional broadcasts, security breaches, or persistent non-payment. Merchants may cancel their account at any time as outlined in our Refund &amp; Cancellation Policy.
            </p>
          </section>

          {/* 13. Governing Law & Jurisdiction */}
          <section className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-8 shadow-xs">
            <h2 className="text-lg sm:text-xl font-bold text-slate-900 mb-3 flex items-center gap-2">
              <span className="w-7 h-7 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center font-black text-xs">
                13
              </span>
              Governing Law &amp; Jurisdiction
            </h2>
            <p className="text-slate-600">
              These Terms and any dispute arising out of them shall be governed by and construed in accordance with the laws of the Republic of India.
            </p>
          </section>

          {/* 14. Contact & Legal Inquiries */}
          <section className="bg-indigo-50/80 border border-indigo-200 rounded-3xl p-6 sm:p-8 shadow-xs">
            <h2 className="text-lg sm:text-xl font-bold text-slate-900 mb-3 flex items-center gap-2">
              <Mail className="w-5 h-5 text-indigo-600" />
              Legal Inquiries &amp; Notices
            </h2>
            <p className="text-xs sm:text-sm text-slate-700">
              For questions concerning these Terms &amp; Conditions or legal notices:
            </p>
            <div className="mt-4 p-4 rounded-2xl bg-white border border-indigo-100 text-xs sm:text-sm space-y-1.5">
              <p><strong>Entity:</strong> Ugrahak</p>
              <p><strong>Support Email:</strong> <a href="mailto:supportugrahak@gmail.com" className="text-indigo-600 font-semibold hover:underline">supportugrahak@gmail.com</a></p>
              <p><strong>Operating Hours:</strong> Monday – Saturday, 10:00 AM – 6:00 PM IST</p>
            </div>
          </section>
        </div>
      </main>

      {/* Global Footer */}
      <Footer />
    </div>
  );
}

