"use client";

import React, { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { Alert } from "@/components/ui/Alert";
import { isValidEmail, isValidPassword } from "@/lib/utils/validation";
import { Store, ShieldCheck, Eye, EyeOff } from "lucide-react";

export const LoginForm: React.FC = () => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectTo = searchParams.get("redirectTo") || "/dashboard";

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // Validation in natural Hindi
    if (!email.trim() || !isValidEmail(email)) {
      setError("कृपया सही ईमेल पता दर्ज करें।");
      return;
    }

    const passCheck = isValidPassword(password);
    if (!passCheck.valid) {
      setError("पासवर्ड कम से कम 6 अक्षरों का होना चाहिए।");
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
            body: JSON.stringify({ email: normalizedEmail, password }),
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
        setError("ईमेल या पासवर्ड गलत है। कृपया दोबारा जांचें।");
        setIsLoading(false);
        return;
      }

      if (data.user) {
        window.location.href = redirectTo;
      }
    } catch {
      setError("लॉग इन करते समय समस्या आई। कृपया अपना इंटरनेट कनेक्शन जांचें।");
      setIsLoading(false);
    }
  };

  return (
    <div className="w-full bg-white border border-slate-200 rounded-3xl p-6 sm:p-8 shadow-sm space-y-5">
      <div>
        <div className="inline-flex items-center justify-center w-10 h-10 rounded-2xl bg-indigo-50 text-indigo-600 mb-3">
          <Store className="w-5 h-5" />
        </div>
        <h2 className="text-2xl font-extrabold text-slate-900 tracking-tight">
          अपने बिज़नेस में लॉग इन करें
        </h2>
        <p className="text-xs sm:text-sm text-slate-500 mt-1">
          अपने ग्राहकों और ऑफ़र को संभालने के लिए लॉग इन करें।
        </p>
      </div>

      {error && <Alert type="error" message={error} className="text-xs" />}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <Input
            label="ईमेल"
            type="email"
            autoComplete="email"
            required
            placeholder="अपना ईमेल दर्ज करें"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            disabled={isLoading}
          />
        </div>

        <div className="space-y-1">
          <div className="flex items-center justify-between">
            <label className="block text-sm font-medium text-slate-700">
              पासवर्ड
            </label>
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="text-xs text-indigo-600 hover:text-indigo-800 font-medium inline-flex items-center gap-1"
            >
              {showPassword ? (
                <>
                  <EyeOff className="w-3.5 h-3.5" />
                  <span>पासवर्ड छुपाएं</span>
                </>
              ) : (
                <>
                  <Eye className="w-3.5 h-3.5" />
                  <span>पासवर्ड दिखाएं</span>
                </>
              )}
            </button>
          </div>
          <Input
            type={showPassword ? "text" : "password"}
            autoComplete="current-password"
            required
            placeholder="अपना पासवर्ड दर्ज करें"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            disabled={isLoading}
          />
          <div className="text-right pt-0.5">
            <Link
              href="/contact"
              className="text-xs text-slate-500 hover:text-indigo-600 font-medium"
            >
              पासवर्ड भूल गए?
            </Link>
          </div>
        </div>

        <Button
          type="submit"
          className="w-full min-h-[46px] text-sm font-bold bg-indigo-600 hover:bg-indigo-700 shadow-xs"
          size="lg"
          isLoading={isLoading}
          disabled={isLoading}
        >
          लॉग इन करें
        </Button>
      </form>

      <div className="pt-4 border-t border-slate-100 flex flex-col items-center gap-3 text-center">
        <p className="text-xs text-slate-600">
          नया अकाउंट बनाना है?{" "}
          <Link
            href="/signup"
            className="font-bold text-indigo-600 hover:text-indigo-700 underline"
          >
            मुफ्त अकाउंट बनाएं
          </Link>
        </p>

        <div className="flex items-center gap-1.5 text-[11px] text-slate-400 bg-slate-50 px-3 py-1.5 rounded-xl border border-slate-100">
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 flex-shrink-0" />
          <span>दुकानदारों के लिए आसान ग्राहक प्रबंधन</span>
        </div>
      </div>
    </div>
  );
};
