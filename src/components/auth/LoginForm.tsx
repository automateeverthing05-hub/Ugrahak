"use client";

import React, { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { Alert } from "@/components/ui/Alert";
import { isValidEmail, isValidPassword } from "@/lib/utils/validation";
import { Store, ShieldCheck, ArrowRight } from "lucide-react";

export const LoginForm: React.FC = () => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectTo = searchParams.get("redirectTo") || "/dashboard";

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // Validation
    if (!isValidEmail(email)) {
      setError("Please enter a valid email address.");
      return;
    }

    const passCheck = isValidPassword(password);
    if (!passCheck.valid) {
      setError(passCheck.message || "Invalid password.");
      return;
    }

    setIsLoading(true);

    try {
      const supabase = createClient();
      const normalizedEmail = email.trim().toLowerCase();

      let { data, error: authError } = await supabase.auth.signInWithPassword({
        email: normalizedEmail,
        password,
      });

      // If account was created prior to auto-confirmation, auto-confirm it
      if (authError && authError.message.toLowerCase().includes("email not confirmed")) {
        try {
          const confirmRes = await fetch("/api/auth/confirm-user", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ email: normalizedEmail }),
          });

          if (confirmRes.ok) {
            // Retry login after auto-confirmation
            const retry = await supabase.auth.signInWithPassword({
              email: normalizedEmail,
              password,
            });
            data = retry.data;
            authError = retry.error;
          }
        } catch {
          // Ignore and continue with original error if fallback fails
        }
      }

      if (authError) {
        setError(authError.message || "Invalid email or password.");
        setIsLoading(false);
        return;
      }

      if (data.user) {
        window.location.href = redirectTo;
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "An unexpected error occurred during login.");
      setIsLoading(false);
    }
  };

  return (
    <div className="w-full bg-white border border-slate-200 rounded-3xl p-6 sm:p-8 shadow-sm">
      <div className="mb-6">
        <div className="inline-flex items-center justify-center w-11 h-11 rounded-2xl bg-indigo-50 text-indigo-600 mb-3">
          <Store className="w-6 h-6" />
        </div>
        <h2 className="text-2xl font-black text-slate-900 tracking-tight">
          Merchant Login
        </h2>
        <p className="text-xs sm:text-sm text-slate-500 mt-1">
          Login to manage your customers, rewards and offers.
        </p>
      </div>

      {error && <Alert type="error" message={error} className="mb-5 text-xs" />}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <Input
            label="Email Address"
            type="email"
            autoComplete="email"
            required
            placeholder="owner@yourshop.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </div>

        <div>
          <Input
            label="Password"
            type="password"
            autoComplete="current-password"
            required
            placeholder="••••••••"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </div>

        <Button
          type="submit"
          className="w-full min-h-[46px] text-sm font-bold bg-indigo-600 hover:bg-indigo-700 shadow-sm"
          size="lg"
          isLoading={isLoading}
        >
          Login to Store Dashboard
        </Button>
      </form>

      <div className="mt-6 pt-5 border-t border-slate-100 flex flex-col items-center gap-3 text-center">
        <p className="text-xs text-slate-600">
          New to Ugrahak?{" "}
          <Link
            href="/signup"
            className="font-bold text-indigo-600 hover:text-indigo-700 underline"
          >
            Start Free — 7 Days
          </Link>
        </p>

        {/* Trust & Clarity Note */}
        <div className="flex items-center gap-1.5 text-[11px] text-slate-400 bg-slate-50 px-3 py-1.5 rounded-xl border border-slate-100">
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 flex-shrink-0" />
          <span>Built for local shops, cafes, salons, restaurants and other businesses.</span>
        </div>
      </div>
    </div>
  );
};
