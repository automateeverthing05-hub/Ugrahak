import type { Metadata } from "next";
import Link from "next/link";
import { Store, ShieldCheck, Lock, Eye, Database, Bell, MapPin, Mail, ArrowLeft } from "lucide-react";
import { Footer } from "@/components/layout/Footer";

export const metadata: Metadata = {
  title: "Privacy Policy | Ugrahak",
  description:
    "Privacy Policy for Ugrahak SaaS - Learn how merchant and customer data is securely collected, used, and protected.",
};

export default function PrivacyPolicyPage() {
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
            <ShieldCheck className="w-3.5 h-3.5 text-indigo-600" />
            <span>Transparency &amp; Data Protection</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tight">
            Privacy Policy
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-2">
            Last Updated: {lastUpdated} &bull; Applicable to Merchants &amp; End Customers
          </p>
        </div>

        {/* Legal Body Sections */}
        <div className="space-y-8 text-slate-700 text-sm sm:text-base leading-relaxed">
          {/* 1. Introduction */}
          <section className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-8 shadow-xs">
            <h2 className="text-lg sm:text-xl font-bold text-slate-900 mb-3 flex items-center gap-2">
              <span className="w-7 h-7 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center font-black text-xs">
                1
              </span>
              Introduction &amp; Scope
            </h2>
            <p className="text-slate-600">
              Welcome to <strong>Ugrahak</strong> (&quot;we,&quot; &quot;our,&quot; or &quot;us&quot;). Ugrahak is a software-as-a-service (SaaS) customer loyalty and retention platform operated by{" "}
              <span className="font-semibold text-slate-800">Ugrahak</span>.
              We provide digital tools that help local Indian merchants capture customer visits via counter QR codes, issue first-visit scratch card rewards, broadcast promotional offers, and facilitate Google Maps review requests.
            </p>
            <p className="text-slate-600 mt-3">
              This Privacy Policy explains how we collect, store, use, and safeguard personal information when merchants register an account, and when customers scan a merchant&apos;s store QR code to participate in store loyalty rewards.
            </p>
          </section>

          {/* 2. Information We Collect */}
          <section className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-8 shadow-xs space-y-4">
            <h2 className="text-lg sm:text-xl font-bold text-slate-900 flex items-center gap-2">
              <span className="w-7 h-7 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center font-black text-xs">
                2
              </span>
              Information We Collect
            </h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80">
                <h3 className="font-bold text-slate-900 text-sm flex items-center gap-1.5 mb-1.5">
                  <Lock className="w-4 h-4 text-indigo-600" />
                  Merchant Account Data
                </h3>
                <ul className="text-xs text-slate-600 space-y-1.5 list-disc list-inside">
                  <li>Owner full name</li>
                  <li>Shop / business name and store slug</li>
                  <li>10-digit mobile number &amp; business email</li>
                  <li>Store location &amp; Google Maps review URL (optional)</li>
                  <li>Securely hashed login authentication credentials</li>
                  <li>Subscription tier and billing history</li>
                </ul>
              </div>

              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80">
                <h3 className="font-bold text-slate-900 text-sm flex items-center gap-1.5 mb-1.5">
                  <Database className="w-4 h-4 text-emerald-600" />
                  Customer Loyalty Check-in Data
                </h3>
                <ul className="text-xs text-slate-600 space-y-1.5 list-disc list-inside">
                  <li>Customer name (entered during QR scan)</li>
                  <li>Customer 10-digit phone number</li>
                  <li>Visit history, check-in timestamps &amp; visit counts</li>
                  <li>Scratch card reward allocations &amp; redemption codes</li>
                  <li>Review request dispatch status</li>
                </ul>
              </div>

              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80">
                <h3 className="font-bold text-slate-900 text-sm flex items-center gap-1.5 mb-1.5">
                  <Bell className="w-4 h-4 text-purple-600" />
                  Push Notification &amp; Device Tokens
                </h3>
                <ul className="text-xs text-slate-600 space-y-1.5 list-disc list-inside">
                  <li>Web Push / Firebase Cloud Messaging (FCM) device tokens</li>
                  <li>Delivered strictly upon customer explicit browser opt-in permission</li>
                  <li>Used to broadcast store offers &amp; reward notifications</li>
                </ul>
              </div>

              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80">
                <h3 className="font-bold text-slate-900 text-sm flex items-center gap-1.5 mb-1.5">
                  <MapPin className="w-4 h-4 text-amber-600" />
                  Location Data (Nearby Offers)
                </h3>
                <ul className="text-xs text-slate-600 space-y-1.5 list-disc list-inside">
                  <li>Approximate latitude and longitude coordinates</li>
                  <li>Collected on-demand ONLY when user clicks &quot;Discover Deals Near Me&quot;</li>
                  <li>Used strictly for instant 100–200m distance calculation</li>
                  <li>Never stored permanently or tracked continuously</li>
                </ul>
              </div>
            </div>
          </section>

          {/* 3. How We Use the Information */}
          <section className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-8 shadow-xs">
            <h2 className="text-lg sm:text-xl font-bold text-slate-900 mb-3 flex items-center gap-2">
              <span className="w-7 h-7 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center font-black text-xs">
                3
              </span>
              How We Use Collected Information
            </h2>
            <p className="text-slate-600 mb-3">
              We process personal data strictly to deliver and maintain the core functionality of Ugrahak:
            </p>
            <ul className="text-xs sm:text-sm text-slate-600 space-y-2 list-disc list-inside">
              <li>To enable merchants to capture visits, recognize repeat customers, and calculate store footfall.</li>
              <li>To issue, validate, and redeem digital scratch cards and unique reward reference codes.</li>
              <li>To deliver immediate promotional push notifications broadcasted by the merchant to their enrolled customer base.</li>
              <li>To schedule and dispatch automatic Google Maps review links 30 minutes following a first-time customer registration.</li>
              <li>To maintain platform security, prevent fraudulent check-ins, and manage merchant subscriptions.</li>
            </ul>
          </section>

          {/* 4. Multi-Tenant Data Isolation & Security */}
          <section className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-8 shadow-xs">
            <h2 className="text-lg sm:text-xl font-bold text-slate-900 mb-3 flex items-center gap-2">
              <span className="w-7 h-7 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center font-black text-xs">
                4
              </span>
              Multi-Tenant Data Isolation &amp; Security
            </h2>
            <p className="text-slate-600">
              We employ strict PostgreSQL Row Level Security (RLS) policies. Every merchant&apos;s customer list, reward records, and offer broadcasts are strictly isolated to their own account. No merchant can access or view another merchant&apos;s customer records.
            </p>
            <p className="text-slate-600 mt-2">
              All data transmissions are encrypted using standard Transport Layer Security (HTTPS / TLS 1.3). Database access credentials and secrets are managed via encrypted environment configurations.
            </p>
          </section>

          {/* 5. Third-Party Service Providers */}
          <section className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-8 shadow-xs">
            <h2 className="text-lg sm:text-xl font-bold text-slate-900 mb-3 flex items-center gap-2">
              <span className="w-7 h-7 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center font-black text-xs">
                5
              </span>
              Third-Party Service Providers
            </h2>
            <p className="text-slate-600 mb-3">
              To operate our software reliably, we work with reputable third-party cloud infrastructure providers:
            </p>
            <ul className="text-xs sm:text-sm text-slate-600 space-y-2 list-disc list-inside">
              <li><strong>Supabase</strong>: Cloud database hosting, data storage, and authentication services.</li>
              <li><strong>Google Firebase Cloud Messaging (FCM)</strong>: Web push notification dispatch infrastructure.</li>
              <li><strong>Google Maps</strong>: Direct link redirection for verified customer reviews.</li>
              <li><strong>Vercel</strong>: Cloud hosting and serverless execution platform.</li>
            </ul>
            <div className="mt-4 p-4 rounded-2xl bg-amber-50/80 border border-amber-200 text-xs text-amber-900">
              <strong>Our Commitment:</strong> We <u>never</u> sell, rent, monetize, or trade merchant or customer personal phone numbers or contact data to third-party marketing companies, advertisers, or data brokers.
            </div>
          </section>

          {/* 6. Cookies & Local Storage */}
          <section className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-8 shadow-xs">
            <h2 className="text-lg sm:text-xl font-bold text-slate-900 mb-3 flex items-center gap-2">
              <span className="w-7 h-7 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center font-black text-xs">
                6
              </span>
              Cookies &amp; Local Storage
            </h2>
            <p className="text-slate-600">
              Ugrahak uses essential HTTP cookies and browser local storage strictly for maintaining merchant authentication sessions, security verification, and caching temporary customer reward states on the browser. We do not use intrusive cross-site behavioral tracking cookies.
            </p>
          </section>

          {/* 7. Data Retention & Deletion */}
          <section className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-8 shadow-xs">
            <h2 className="text-lg sm:text-xl font-bold text-slate-900 mb-3 flex items-center gap-2">
              <span className="w-7 h-7 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center font-black text-xs">
                7
              </span>
              Data Retention &amp; Deletion Process
            </h2>
            <p className="text-slate-600">
              Merchant account information is retained for the duration of the merchant&apos;s active subscription. Customer loyalty records associated with a store are retained as long as the merchant maintains an active store profile.
            </p>
            <p className="text-slate-600 mt-2">
              <strong>How to Request Data Deletion:</strong> Any merchant or customer may request full deletion of their records by sending an email with their registered phone number or email address to our support desk at <a href="mailto:supportugrahak@gmail.com" className="font-semibold text-indigo-600 hover:underline">supportugrahak@gmail.com</a>. Deletion requests are processed within 30 days.
            </p>
          </section>

          {/* 8. User & Customer Privacy Rights */}
          <section className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-8 shadow-xs">
            <h2 className="text-lg sm:text-xl font-bold text-slate-900 mb-3 flex items-center gap-2">
              <span className="w-7 h-7 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center font-black text-xs">
                8
              </span>
              User &amp; Customer Privacy Rights
            </h2>
            <ul className="text-xs sm:text-sm text-slate-600 space-y-2 list-disc list-inside">
              <li><strong>Notification Opt-Out:</strong> Customers can revoke push notification permissions at any time directly through their browser or device notification settings.</li>
              <li><strong>Right to Rectification:</strong> Merchants can update their store profile, phone number, and location details anytime from the settings panel.</li>
              <li><strong>Right to Inquire:</strong> Users may inquire about what personal data is maintained by contacting support.</li>
            </ul>
          </section>

          {/* 9. Policy Changes */}
          <section className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-8 shadow-xs">
            <h2 className="text-lg sm:text-xl font-bold text-slate-900 mb-3 flex items-center gap-2">
              <span className="w-7 h-7 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center font-black text-xs">
                9
              </span>
              Changes to This Policy
            </h2>
            <p className="text-slate-600">
              We may update this Privacy Policy from time to time to reflect changes in legal requirements or platform enhancements. Significant changes will be communicated by updating the &quot;Last Updated&quot; date at the top of this page.
            </p>
          </section>

          {/* 10. Contact Information */}
          <section className="bg-indigo-50/80 border border-indigo-200 rounded-3xl p-6 sm:p-8 shadow-xs">
            <h2 className="text-lg sm:text-xl font-bold text-slate-900 mb-3 flex items-center gap-2">
              <Mail className="w-5 h-5 text-indigo-600" />
              Privacy &amp; Data Protection Contact
            </h2>
            <p className="text-xs sm:text-sm text-slate-700">
              For privacy-related inquiries, data deletion requests, or questions regarding this Privacy Policy:
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

