"use client";

import React, { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { Alert } from "@/components/ui/Alert";
import { isValidEmail, isValidPassword, isValidPhone, isValidGoogleMapsUrl } from "@/lib/utils/validation";
import { normalizePhone } from "@/lib/utils/referenceCode";
import { Store, ShieldCheck, Sparkles, Eye, EyeOff } from "lucide-react";

export const SignupForm: React.FC = () => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const rawPlan = searchParams.get("plan")?.toLowerCase();

  const planNameMap: Record<string, string> = {
    starter: "Starter",
    growth: "Growth",
    pro: "Pro",
  };
  const selectedPlanName = rawPlan && planNameMap[rawPlan] ? planNameMap[rawPlan] : null;

  const [ownerName, setOwnerName] = useState("");
  const [shopName, setShopName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [googleMapsUrl, setGoogleMapsUrl] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // 1. Validations in simple Hindi
    if (!ownerName.trim()) {
      setError("कृपया मालिक का नाम दर्ज करें।");
      return;
    }

    if (!shopName.trim()) {
      setError("कृपया दुकान या बिज़नेस का नाम दर्ज करें।");
      return;
    }

    const cleanPhone = normalizePhone(phone);
    if (!cleanPhone || !isValidPhone(cleanPhone)) {
      setError("कृपया सही 10-अंकों का मोबाइल नंबर दर्ज करें।");
      return;
    }

    if (!isValidEmail(email)) {
      setError("कृपया सही ईमेल पता दर्ज करें।");
      return;
    }

    const passCheck = isValidPassword(password);
    if (!passCheck.valid) {
      setError("पासवर्ड कम से कम 6 अक्षरों का होना चाहिए।");
      return;
    }

    if (password !== confirmPassword) {
      setError("पासवर्ड और दोबारा दर्ज किया गया पासवर्ड एक जैसे होने चाहिए।");
      return;
    }

    if (googleMapsUrl.trim() && !isValidGoogleMapsUrl(googleMapsUrl.trim())) {
      setError("कृपया सही Google Maps लिंक दर्ज करें (उदा. https://maps.app.goo.gl/...)");
      return;
    }

    setIsLoading(true);

    try {
      // 1. Create account + initialize merchant profile + establish session on server
      let res: Response;
      try {
        res = await fetch("/api/auth/signup", {
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
      } catch {
        setError("नेटवर्क में समस्या आई। कृपया अपना इंटरनेट कनेक्शन जांचें।");
        setIsLoading(false);
        return;
      }

      let data: { error?: string; sessionEstablished?: boolean; success?: boolean } = {};
      try {
        data = await res.json();
      } catch {
        setError("सर्वर से संपर्क करने में समस्या आई। कृपया दोबारा प्रयास करें।");
        setIsLoading(false);
        return;
      }

      if (!res.ok) {
        if (data.error?.toLowerCase().includes("already registered") || data.error?.toLowerCase().includes("already exists")) {
          setError("यह ईमेल या मोबाइल नंबर पहले से पंजीकृत है। कृपया लॉग इन करें।");
        } else {
          setError(data.error || "अकाउंट बनाने में समस्या आई। कृपया दोबारा प्रयास करें।");
        }
        setIsLoading(false);
        return;
      }

      // If session was established server-side, redirect immediately
      if (data.sessionEstablished) {
        window.location.href = "/dashboard";
        return;
      }

      // Fallback: Login client-side
      try {
        const supabase = createClient();
        const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
          email: email.trim().toLowerCase(),
          password,
        });

        if (signInError || !signInData.user) {
          // If auto-confirm is needed, trigger confirm-user endpoint
          try {
            await fetch("/api/auth/confirm-user", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                email: email.trim().toLowerCase(),
                password,
              }),
            });
            const retry = await supabase.auth.signInWithPassword({
              email: email.trim().toLowerCase(),
              password,
            });
            if (retry.data?.user) {
              window.location.href = "/dashboard";
              return;
            }
          } catch {
            // ignore
          }

          router.push("/login?message=Account+created.+Please+sign+in.");
          return;
        }

        window.location.href = "/dashboard";
      } catch {
        window.location.href = "/dashboard";
      }
    } catch {
      setError("अकाउंट बनाते समय अप्रत्याशित समस्या आई। कृपया दोबारा प्रयास करें।");
      setIsLoading(false);
    }
  };

  return (
    <div className="w-full bg-white border border-slate-200 rounded-3xl p-6 sm:p-8 shadow-sm space-y-4">
      <div>
        <div className="inline-flex items-center justify-center w-10 h-10 rounded-2xl bg-indigo-50 text-indigo-600 mb-2.5">
          <Store className="w-5 h-5" />
        </div>
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-extrabold text-slate-900 tracking-tight">
            अपना मुफ्त बिज़नेस अकाउंट बनाएं
          </h2>
        </div>
        <p className="text-xs sm:text-sm text-slate-500 mt-1">
          कुछ आसान जानकारी भरें और अपनी दुकान के लिए QR तैयार करें।
        </p>
        <div className="flex items-center gap-1.5 mt-2 text-xs text-emerald-700 font-bold bg-emerald-50 px-2.5 py-1 rounded-lg border border-emerald-100 w-fit">
          <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
          <span>फ्री प्लान &bull; ₹0/महीना</span>
        </div>
      </div>

      {selectedPlanName && (
        <div className="p-3.5 rounded-2xl bg-indigo-50/80 border border-indigo-200 text-xs text-indigo-900 leading-relaxed font-medium">
          आपने <span className="font-bold underline">{selectedPlanName}</span> चुना है। पहले Free account बनाएँ, फिर {selectedPlanName} प्लान एक्टिवेट करवाने के लिए हमें WhatsApp या email करें।
        </div>
      )}

      {error && <Alert type="error" message={error} className="text-xs" />}

      <form onSubmit={handleSubmit} className="space-y-3.5">
        <div>
          <Input
            label="मालिक का नाम"
            placeholder="अपना पूरा नाम दर्ज करें"
            required
            value={ownerName}
            onChange={(e) => setOwnerName(e.target.value)}
            disabled={isLoading}
          />
        </div>

        <div>
          <Input
            label="दुकान या बिज़नेस का नाम"
            placeholder="उदा. शर्मा जनरल स्टोर"
            required
            value={shopName}
            onChange={(e) => setShopName(e.target.value)}
            disabled={isLoading}
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <Input
              label="मोबाइल नंबर"
              placeholder="10-अंकों का मोबाइल नंबर"
              required
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              disabled={isLoading}
            />
          </div>

          <div>
            <Input
              label="ईमेल"
              placeholder="owner@yourshop.com"
              type="email"
              autoComplete="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={isLoading}
            />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="block text-sm font-medium text-slate-700">
                पासवर्ड
              </label>
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="text-[11px] text-indigo-600 hover:text-indigo-800 font-medium"
              >
                {showPassword ? "छुपाएं" : "दिखाएं"}
              </button>
            </div>
            <Input
              type={showPassword ? "text" : "password"}
              autoComplete="new-password"
              placeholder="कम से कम 6 अक्षर"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              disabled={isLoading}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              पासवर्ड दोबारा दर्ज करें
            </label>
            <Input
              type={showPassword ? "text" : "password"}
              autoComplete="new-password"
              placeholder="पासवर्ड दोबारा लिखें"
              required
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              disabled={isLoading}
            />
          </div>
        </div>

        <div>
          <Input
            label="Google Maps रिव्यू लिंक (वैकल्पिक)"
            placeholder="https://maps.app.goo.gl/..."
            value={googleMapsUrl}
            onChange={(e) => setGoogleMapsUrl(e.target.value)}
            helperText="ग्राहकों से Google रिव्यू पाने के लिए।"
            disabled={isLoading}
          />
        </div>

        <p className="text-[11px] text-slate-500 text-center leading-relaxed pt-1">
          अकाउंट बनाकर आप हमारी{" "}
          <Link
            href="/terms"
            target="_blank"
            className="text-indigo-600 hover:text-indigo-700 underline font-semibold"
          >
            नियम और शर्तें
          </Link>{" "}
          और{" "}
          <Link
            href="/privacy-policy"
            target="_blank"
            className="text-indigo-600 hover:text-indigo-700 underline font-semibold"
          >
            गोपनीयता नीति
          </Link>{" "}
          स्वीकार करते हैं।
        </p>

        <Button
          type="submit"
          className="w-full min-h-[46px] text-sm font-bold bg-indigo-600 hover:bg-indigo-700 shadow-xs"
          size="lg"
          isLoading={isLoading}
          disabled={isLoading}
        >
          मुफ्त अकाउंट बनाएं
        </Button>
      </form>

      <div className="pt-3 border-t border-slate-100 flex flex-col items-center gap-3 text-center">
        <p className="text-xs text-slate-600">
          पहले से अकाउंट है?{" "}
          <Link
            href="/login"
            className="font-bold text-indigo-600 hover:text-indigo-700 underline"
          >
            लॉग इन करें
          </Link>
        </p>

        <div className="flex items-center gap-1.5 text-[11px] text-slate-400 bg-slate-50 px-3 py-1.5 rounded-xl border border-slate-100">
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 flex-shrink-0" />
          <span>फ्री प्लान से शुरुआत करें &bull; कोई क्रेडिट कार्ड नहीं</span>
        </div>
      </div>
    </div>
  );
};
