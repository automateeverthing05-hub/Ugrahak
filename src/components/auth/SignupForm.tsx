"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { Alert } from "@/components/ui/Alert";
import { isValidEmail, isValidPassword, isValidPhone, isValidGoogleMapsUrl } from "@/lib/utils/validation";
import { normalizePhone } from "@/lib/utils/referenceCode";
import { Store, ShieldCheck, Sparkles, ArrowRight } from "lucide-react";

export const SignupForm: React.FC = () => {
  const router = useRouter();

  const [ownerName, setOwnerName] = useState("");
  const [shopName, setShopName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [googleMapsUrl, setGoogleMapsUrl] = useState("");
  const [password, setPassword] = useState("");

  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // 1. Validations
    if (!ownerName.trim()) {
      setError("Please enter your name.");
      return;
    }

    if (!shopName.trim()) {
      setError("Please enter your shop or business name.");
      return;
    }

    const cleanPhone = normalizePhone(phone);
    if (!cleanPhone || !isValidPhone(cleanPhone)) {
      setError("Please enter a valid 10-digit mobile number.");
      return;
    }

    if (!isValidEmail(email)) {
      setError("Please enter a valid email address.");
      return;
    }

    const passCheck = isValidPassword(password);
    if (!passCheck.valid) {
      setError(passCheck.message || "Password must be at least 6 characters.");
      return;
    }

    if (googleMapsUrl.trim() && !isValidGoogleMapsUrl(googleMapsUrl.trim())) {
      setError("Please enter a valid Google Maps review link (e.g. https://maps.app.goo.gl/...).");
      return;
    }

    setIsLoading(true);

    try {
      // 1. Create account + initialize merchant profile on server
      const res = await fetch("/api/auth/signup", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          owner_name: ownerName.trim(),
          shop_name: shopName.trim(),
          phone: cleanPhone,
          email: email.trim().toLowerCase(),
          google_maps_url: googleMapsUrl.trim() || null,
          password,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Failed to create account. Please try again.");
        setIsLoading(false);
        return;
      }

      // 2. Immediately sign in to establish active authenticated session in browser cookies
      const supabase = createClient();
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: email.trim().toLowerCase(),
        password,
      });

      if (signInError) {
        setError(
          signInError.message ||
            "Account created successfully, but automatic login failed. Please sign in."
        );
        setIsLoading(false);
        return;
      }

      // 3. Directly redirect to merchant dashboard
      window.location.href = "/dashboard";
    } catch (err: unknown) {
      setError(
        err instanceof Error ? err.message : "An unexpected error occurred during signup."
      );
      setIsLoading(false);
    }
  };

  return (
    <div className="w-full bg-white border border-slate-200 rounded-3xl p-6 sm:p-8 shadow-sm">
      <div className="mb-6">
        <div className="inline-flex items-center justify-center w-11 h-11 rounded-2xl bg-indigo-50 text-indigo-600 mb-3">
          <Store className="w-6 h-6" />
        </div>
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-black text-slate-900 tracking-tight">
            Create Your Merchant Account
          </h2>
        </div>
        <div className="flex items-center gap-1.5 mt-1 text-xs text-indigo-700 font-bold bg-indigo-50/80 px-2.5 py-1 rounded-lg border border-indigo-100 w-fit">
          <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
          <span>7 Days Free Trial &bull; No Credit Card Required</span>
        </div>
      </div>

      {error && <Alert type="error" message={error} className="mb-5 text-xs" />}

      <form onSubmit={handleSubmit} className="space-y-3.5">
        <div>
          <Input
            label="Owner Name"
            placeholder="Your name"
            required
            value={ownerName}
            onChange={(e) => setOwnerName(e.target.value)}
          />
        </div>

        <div>
          <Input
            label="Shop / Business Name"
            placeholder="Shop or business name"
            required
            value={shopName}
            onChange={(e) => setShopName(e.target.value)}
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
          <div>
            <Input
              label="Mobile Number"
              placeholder="10-digit mobile number"
              required
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
            />
          </div>

          <div>
            <Input
              label="Email"
              placeholder="Business email"
              type="email"
              autoComplete="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>
        </div>

        <div>
          <Input
            label="Google Maps Link (Optional)"
            placeholder="Paste Google Maps review link"
            value={googleMapsUrl}
            onChange={(e) => setGoogleMapsUrl(e.target.value)}
            helperText="For sending automatic Google Review requests to customers."
          />
        </div>

        <div>
          <Input
            label="Password"
            type="password"
            autoComplete="new-password"
            placeholder="Create password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            helperText="Minimum 6 characters."
          />
        </div>

        <p className="text-[11px] text-slate-500 text-center leading-relaxed px-1 pt-1">
          By creating an account, you agree to our{" "}
          <Link
            href="/terms"
            target="_blank"
            className="text-indigo-600 hover:text-indigo-700 underline font-semibold"
          >
            Terms &amp; Conditions
          </Link>{" "}
          and{" "}
          <Link
            href="/privacy-policy"
            target="_blank"
            className="text-indigo-600 hover:text-indigo-700 underline font-semibold"
          >
            Privacy Policy
          </Link>
          .
        </p>

        <Button
          type="submit"
          className="w-full min-h-[46px] text-sm font-bold bg-indigo-600 hover:bg-indigo-700 shadow-sm mt-1"
          size="lg"
          isLoading={isLoading}
        >
          Create Free Account
        </Button>
      </form>

      <div className="mt-6 pt-4 border-t border-slate-100 flex flex-col items-center gap-3 text-center">
        <p className="text-xs text-slate-600">
          Already have an account?{" "}
          <Link
            href="/login"
            className="font-bold text-indigo-600 hover:text-indigo-700 underline"
          >
            Login
          </Link>
        </p>

        <div className="flex items-center gap-1.5 text-[11px] text-slate-400 bg-slate-50 px-3 py-1.5 rounded-xl border border-slate-100">
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 flex-shrink-0" />
          <span>Built for local shops, cafes, salons, restaurants and other businesses.</span>
        </div>
      </div>
    </div>
  );
};
