"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { Alert } from "@/components/ui/Alert";
import { Card } from "@/components/ui/Card";
import { generateSlug } from "@/lib/utils/slugify";
import { isValidPhone, isValidGoogleMapsUrl } from "@/lib/utils/validation";
import type { Merchant } from "@/lib/types/database";
import { Navigation } from "lucide-react";

interface MerchantProfileFormProps {
  initialMerchant: (Merchant & { latitude?: number | null; longitude?: number | null }) | null;
  onSuccess?: () => void;
}

export const MerchantProfileForm: React.FC<MerchantProfileFormProps> = ({
  initialMerchant,
  onSuccess,
}) => {
  const router = useRouter();

  const [shopName, setShopName] = useState(initialMerchant?.shop_name || "");
  const [ownerName, setOwnerName] = useState(initialMerchant?.owner_name || "");
  const [phone, setPhone] = useState(initialMerchant?.phone || "");
  const [googleMapsUrl, setGoogleMapsUrl] = useState(initialMerchant?.google_maps_url || "");
  const [slug, setSlug] = useState(initialMerchant?.slug || "");
  const [latitude, setLatitude] = useState(initialMerchant?.latitude?.toString() || "");
  const [longitude, setLongitude] = useState(initialMerchant?.longitude?.toString() || "");
  const [autoSlug, setAutoSlug] = useState(!initialMerchant?.slug);

  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isLocating, setIsLocating] = useState(false);

  const handleShopNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setShopName(val);
    if (autoSlug && !initialMerchant) {
      setSlug(generateSlug(val));
    }
  };

  const handleSlugChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setAutoSlug(false);
    setSlug(generateSlug(e.target.value));
  };

  const handleFetchCurrentLocation = () => {
    if (!navigator.geolocation) {
      setError("Geolocation is not supported by your browser.");
      return;
    }

    setIsLocating(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setLatitude(pos.coords.latitude.toFixed(6));
        setLongitude(pos.coords.longitude.toFixed(6));
        setIsLocating(false);
      },
      (err) => {
        setError(`Could not fetch location: ${err.message}`);
        setIsLocating(false);
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    // Form Validations
    if (!shopName.trim()) {
      setError("Shop name is required.");
      return;
    }

    if (!phone.trim() || !isValidPhone(phone)) {
      setError("Please enter a valid 10-digit phone number.");
      return;
    }

    if (!slug.trim()) {
      setError("Shop URL slug is required.");
      return;
    }

    if (googleMapsUrl.trim() && !isValidGoogleMapsUrl(googleMapsUrl)) {
      setError("Please enter a valid Google Maps link (e.g. https://maps.app.goo.gl/...).");
      return;
    }

    setIsLoading(true);

    try {
      const response = await fetch("/api/merchant/profile", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          shop_name: shopName.trim(),
          owner_name: ownerName.trim() || null,
          phone: phone.trim(),
          google_maps_url: googleMapsUrl.trim() || null,
          slug: slug.trim(),
          latitude: latitude.trim() || null,
          longitude: longitude.trim() || null,
        }),
      });

      const resData = await response.json();

      if (!response.ok) {
        setError(resData.error || "Failed to save merchant profile.");
        setIsLoading(false);
        return;
      }

      setSuccess("Shop profile saved successfully!");
      setIsLoading(false);
      router.refresh();
      if (onSuccess) {
        onSuccess();
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "An unexpected error occurred.");
      setIsLoading(false);
    }
  };

  return (
    <Card
      title={initialMerchant ? "Edit Shop Profile" : "Complete Your Shop Setup"}
      description={
        initialMerchant
          ? "Update your business details, contact information, and store GPS coordinates."
          : "Please provide your shop details to generate your unique shop URL and QR code."
      }
    >
      {error && <Alert type="error" message={error} className="mb-4 text-xs" />}
      {success && <Alert type="success" message={success} className="mb-4 text-xs" />}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <Input
            label="Shop / Business Name"
            placeholder="e.g. Royal Sweets & Bakery"
            required
            value={shopName}
            onChange={handleShopNameChange}
            helperText="This name is shown to your customers on the QR landing page."
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Input
              label="Owner / Contact Person Name"
              placeholder="e.g. Rajesh Kumar"
              value={ownerName}
              onChange={(e) => setOwnerName(e.target.value)}
            />
          </div>

          <div>
            <Input
              label="Business Phone Number"
              placeholder="e.g. 9876543210"
              required
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              helperText="For customer inquiries and store contact."
            />
          </div>
        </div>

        <div>
          <Input
            label="Shop URL Slug"
            placeholder="e.g. royal-sweets"
            required
            value={slug}
            onChange={handleSlugChange}
            helperText={`Your unique shop link will be: /shop/${slug || "your-shop"}`}
          />
        </div>

        <div>
          <Input
            label="Google Maps / Review Location URL (Optional)"
            placeholder="https://maps.app.goo.gl/..."
            value={googleMapsUrl}
            onChange={(e) => setGoogleMapsUrl(e.target.value)}
            helperText="Customers can tap this to view directions or leave a Google Review."
          />
        </div>

        {/* GPS Coordinates Section for Nearby Offers */}
        <div className="p-3.5 sm:p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <span className="text-xs font-bold text-slate-800 block">
                Store GPS Location (For Nearby Offers 100–200m)
              </span>
              <p className="text-[11px] text-slate-500">
                Required if you want nearby shoppers within 200m to unlock store offers.
              </p>
            </div>

            <button
              type="button"
              onClick={handleFetchCurrentLocation}
              disabled={isLocating}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-indigo-700 bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 rounded-xl transition-colors self-start sm:self-auto min-h-[36px]"
            >
              <Navigation className="w-3.5 h-3.5" />
              <span>{isLocating ? "Locating..." : "Use Current Location"}</span>
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Input
              label="Latitude"
              placeholder="e.g. 28.613939"
              value={latitude}
              onChange={(e) => setLatitude(e.target.value)}
              className="text-xs font-mono"
            />
            <Input
              label="Longitude"
              placeholder="e.g. 77.209021"
              value={longitude}
              onChange={(e) => setLongitude(e.target.value)}
              className="text-xs font-mono"
            />
          </div>
        </div>

        <div className="pt-2">
          <Button type="submit" size="md" isLoading={isLoading} className="w-full sm:w-auto min-h-[42px]">
            {initialMerchant ? "Update Profile & Settings" : "Save & Generate QR Code"}
          </Button>
        </div>
      </form>
    </Card>
  );
};
