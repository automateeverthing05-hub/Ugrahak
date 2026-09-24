"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Alert } from "@/components/ui/Alert";
import {
  Tag,
  Plus,
  Send,
  Edit2,
  Trash2,
  Calendar,
  X,
  Smartphone,
  CheckCircle2,
  History,
  Users,
  AlertCircle,
  Clock,
  Sparkles,
  Phone,
  Store,
} from "lucide-react";
import type { Offer } from "@/lib/types/database";

interface OfferStats {
  totalSent: number;
  totalFailed: number;
  invalidCount: number;
}

interface MerchantInfo {
  shopName: string;
  phone: string;
  slug: string;
}

interface OffersListProps {
  initialOffers: Offer[];
  subscriberCount: number;
  customerCount: number;
  merchantInfo: MerchantInfo;
  initialStats?: Record<string, OfferStats>;
}

export const OffersList: React.FC<OffersListProps> = ({
  initialOffers,
  subscriberCount,
  customerCount,
  merchantInfo,
  initialStats = {},
}) => {
  const router = useRouter();

  const [offers, setOffers] = useState<Offer[]>(initialOffers);
  const [stats, setStats] = useState<Record<string, OfferStats>>(initialStats);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingOffer, setEditingOffer] = useState<Offer | null>(null);

  // Form State
  const [title, setTitle] = useState("");
  const [message, setMessage] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [status, setStatus] = useState<"ACTIVE" | "INACTIVE">("ACTIVE");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  const [formError, setFormError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  // Broadcast confirmation & sending state
  const [confirmSendOffer, setConfirmSendOffer] = useState<Offer | null>(null);
  const [isSending, setIsSending] = useState(false);
  const [broadcastResultModal, setBroadcastResultModal] = useState<{
    offerTitle: string;
    totalTargeted: number;
    totalSent: number;
    totalFailed: number;
    invalidCount: number;
    message: string;
  } | null>(null);

  const openCreateModal = () => {
    setEditingOffer(null);
    setTitle("");
    setMessage("");
    setImageUrl("");
    setStatus("ACTIVE");
    setStartDate("");
    setEndDate("");
    setFormError(null);
    setIsModalOpen(true);
  };

  const openEditModal = (offer: Offer) => {
    setEditingOffer(offer);
    setTitle(offer.title);
    setMessage(offer.message);
    setImageUrl(offer.image_url || "");
    setStatus(offer.status === "ACTIVE" ? "ACTIVE" : "INACTIVE");
    setStartDate(offer.start_at ? offer.start_at.slice(0, 10) : "");
    setEndDate(offer.end_at ? offer.end_at.slice(0, 10) : "");
    setFormError(null);
    setIsModalOpen(true);
  };

  const handleSaveOffer = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (!title.trim()) {
      setFormError("Offer title is required.");
      return;
    }

    if (!message.trim()) {
      setFormError("Offer message is required.");
      return;
    }

    setIsSaving(true);

    try {
      const url = editingOffer
        ? `/api/merchant/offers/${editingOffer.id}`
        : `/api/merchant/offers`;
      const method = editingOffer ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: title.trim(),
          message: message.trim(),
          image_url: imageUrl.trim() || null,
          status,
          start_at: startDate || null,
          end_at: endDate || null,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setFormError(data.error || "Failed to save offer.");
        setIsSaving(false);
        return;
      }

      setIsModalOpen(false);
      setIsSaving(false);
      router.refresh();
    } catch (err: unknown) {
      setFormError(err instanceof Error ? err.message : "Unexpected error.");
      setIsSaving(false);
    }
  };

  const handleDeleteOffer = async (id: string) => {
    if (!confirm("Are you sure you want to delete this offer?")) return;

    try {
      const res = await fetch(`/api/merchant/offers/${id}`, {
        method: "DELETE",
      });

      if (res.ok) {
        setOffers(offers.filter((o) => o.id !== id));
        router.refresh();
      }
    } catch {
      // Ignore
    }
  };

  const handleTriggerSendBroadcast = async () => {
    if (!confirmSendOffer) return;
    const offer = confirmSendOffer;

    if (subscriberCount === 0) {
      alert(
        "You currently have 0 customers enabled to receive offers. When customers scan your QR code and enable offers, they are enrolled to receive your offers."
      );
      setConfirmSendOffer(null);
      return;
    }

    setIsSending(true);

    try {
      const res = await fetch(`/api/merchant/offers/${offer.id}/send`, {
        method: "POST",
      });

      const data = await res.json();

      if (!res.ok) {
        alert(data.error || "Failed to send broadcast.");
      } else {
        // Update local stats
        setStats((prev) => ({
          ...prev,
          [offer.id]: {
            totalSent: (prev[offer.id]?.totalSent || 0) + (data.totalSent || 0),
            totalFailed: (prev[offer.id]?.totalFailed || 0) + (data.totalFailed || 0),
            invalidCount:
              (prev[offer.id]?.invalidCount || 0) + (data.invalidTokensCount || 0),
          },
        }));

        setConfirmSendOffer(null);
        setBroadcastResultModal({
          offerTitle: offer.title,
          totalTargeted: data.targetedCount || subscriberCount,
          totalSent: data.totalSent || 0,
          totalFailed: data.totalFailed || 0,
          invalidCount: data.invalidTokensCount || 0,
          message: data.message || "Offer sent successfully to customers!",
        });
      }
      setIsSending(false);
      router.refresh();
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : "Broadcast error.");
      setIsSending(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Main Action Banner */}
      <div className="bg-gradient-to-r from-indigo-700 via-indigo-600 to-purple-700 rounded-3xl p-5 sm:p-6 text-white shadow-md flex flex-col md:flex-row md:items-center justify-between gap-5">
        <div className="space-y-1.5 max-w-xl">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/20 backdrop-blur-md text-xs font-bold uppercase tracking-wider">
            <Send className="w-3.5 h-3.5" />
            <span>SEND OFFER TO YOUR CUSTOMERS</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-black tracking-tight">
            Broadcast Deals & Offers with 1 Tap
          </h2>
          <p className="text-xs sm:text-sm text-indigo-100">
            Select any offer below and click <strong>&quot;SEND TO ALL CUSTOMERS&quot;</strong> to deliver personalized notifications to your customers.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
          <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl p-3 text-center sm:text-left">
            <span className="text-[11px] text-indigo-200 block uppercase font-bold">
              Your Customers
            </span>
            <span className="text-xl sm:text-2xl font-black">
              {customerCount}
            </span>
          </div>

          <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl p-3 text-center sm:text-left">
            <span className="text-[11px] text-indigo-200 block uppercase font-bold">
              Customers Receiving Offers
            </span>
            <span className="text-xl sm:text-2xl font-black">
              {subscriberCount}
            </span>
          </div>

          <Button
            onClick={openCreateModal}
            size="md"
            className="gap-2 bg-white text-indigo-700 hover:bg-indigo-50 font-bold min-h-[46px] shadow-md self-stretch sm:self-auto"
          >
            <Plus className="w-4 h-4 text-indigo-600" />
            <span>+ Create New Offer</span>
          </Button>
        </div>
      </div>

      {/* Your Offers Section */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Tag className="w-5 h-5 text-indigo-600" />
            <h3 className="text-base sm:text-lg font-bold text-slate-900">
              Your Offers
            </h3>
          </div>
          <span className="text-xs text-slate-500 font-semibold">
            {offers.length} {offers.length === 1 ? "offer" : "offers"} available
          </span>
        </div>

        {offers.length === 0 ? (
          /* Clean Empty State: Single Create CTA */
          <div className="bg-white border border-slate-200 rounded-3xl p-8 sm:p-12 text-center shadow-xs space-y-4">
            <div className="w-14 h-14 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center mx-auto">
              <Sparkles className="w-7 h-7" />
            </div>
            <div className="space-y-1">
              <h4 className="text-base font-bold text-slate-900">
                No Offers Created Yet
              </h4>
              <p className="text-xs sm:text-sm text-slate-500 max-w-md mx-auto">
                Create an offer first, then send it to all your customers.
              </p>
            </div>
            <div>
              <Button
                onClick={openCreateModal}
                size="md"
                className="gap-2 min-h-[42px] bg-indigo-600 hover:bg-indigo-700 font-bold"
              >
                <Plus className="w-4 h-4" />
                <span>+ Create New Offer</span>
              </Button>
            </div>
          </div>
        ) : (
          /* Grid of Existing Offers */
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {offers.map((offer) => {
              const offerStat = stats[offer.id] || {
                totalSent: 0,
                totalFailed: 0,
                invalidCount: 0,
              };

              return (
                <div
                  key={offer.id}
                  className="bg-white border border-slate-200 rounded-3xl p-5 shadow-xs flex flex-col justify-between hover:border-slate-300 transition-all space-y-4"
                >
                  <div className="space-y-3">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span
                          className={`text-[10px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full ${
                            offer.status === "ACTIVE"
                              ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                              : "bg-slate-100 text-slate-600 border border-slate-200"
                          }`}
                        >
                          {offer.status}
                        </span>

                        {offerStat.totalSent > 0 && (
                          <span className="inline-flex items-center gap-1 text-[10px] font-bold text-indigo-700 bg-indigo-50 border border-indigo-200 px-2 py-0.5 rounded-full">
                            <CheckCircle2 className="w-3 h-3 text-indigo-600" />
                            <span>Delivered to {offerStat.totalSent}</span>
                          </span>
                        )}
                      </div>

                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => openEditModal(offer)}
                          className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors min-h-[36px] min-w-[36px] flex items-center justify-center"
                          title="Edit Offer"
                          aria-label="Edit Offer"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleDeleteOffer(offer.id)}
                          className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors min-h-[36px] min-w-[36px] flex items-center justify-center"
                          title="Delete Offer"
                          aria-label="Delete Offer"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>

                    <div>
                      <h4 className="text-base font-bold text-slate-900 leading-snug">
                        {offer.title}
                      </h4>
                      <p className="text-xs text-slate-600 mt-1 line-clamp-3 leading-relaxed">
                        {offer.message}
                      </p>
                    </div>

                    <div className="flex flex-wrap items-center gap-3 text-[11px] text-slate-400 pt-1">
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        Created {new Date(offer.created_at).toLocaleDateString()}
                      </span>
                      {offer.start_at && (
                        <span className="flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          Valid: {new Date(offer.start_at).toLocaleDateString()}
                          {offer.end_at
                            ? ` - ${new Date(offer.end_at).toLocaleDateString()}`
                            : ""}
                        </span>
                      )}
                      <span className="flex items-center gap-1 font-semibold text-slate-500">
                        <Users className="w-3 h-3 text-indigo-500" />
                        {subscriberCount} Receiving Offers
                      </span>
                    </div>
                  </div>

                  {/* Card Footer Actions */}
                  <div className="pt-3 border-t border-slate-100 flex items-center justify-between gap-2">
                    <Link
                      href={`/dashboard/offers/${offer.id}`}
                      className="text-xs font-semibold text-indigo-600 hover:text-indigo-800 hover:underline p-1"
                    >
                      View Delivery Logs
                    </Link>

                    <Button
                      size="sm"
                      onClick={() => setConfirmSendOffer(offer)}
                      disabled={offer.status !== "ACTIVE" || isSending}
                      className="gap-1.5 text-xs bg-indigo-600 hover:bg-indigo-700 min-h-[40px] px-4 font-bold shadow-xs"
                    >
                      <Send className="w-3.5 h-3.5" />
                      <span>SEND TO ALL CUSTOMERS</span>
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Confirmation Modal Before Sending to All Customers */}
      {confirmSendOffer && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-5 sm:p-6 shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center">
                  <Send className="w-4 h-4" />
                </div>
                <h3 className="text-base sm:text-lg font-bold text-slate-900">
                  Send Offer to All Customers
                </h3>
              </div>
              <button
                onClick={() => !isSending && setConfirmSendOffer(null)}
                disabled={isSending}
                className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg min-h-[36px] min-w-[36px] flex items-center justify-center"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-xs sm:text-sm text-slate-600">
              Send this offer to all your customers? This will send the personalized offer to{" "}
              <strong>{subscriberCount}</strong> registered customer device(s).
            </p>

            {subscriberCount === 0 && (
              <div className="p-3 rounded-2xl bg-amber-50 border border-amber-200 text-amber-800 text-xs flex items-start gap-2">
                <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                <div>
                  <strong>0 Customers Receiving Offers:</strong> Customers must first scan your shop QR code and enable offers to receive your messages.
                </div>
              </div>
            )}

            {/* Live Personalized Notification Preview */}
            <div className="bg-slate-50 border border-slate-200 rounded-2xl p-3.5 space-y-2">
              <div className="flex items-center justify-between text-[11px] font-bold text-slate-700">
                <span className="flex items-center gap-1">
                  <Smartphone className="w-3.5 h-3.5 text-indigo-600" />
                  Personalized Customer Offer Preview
                </span>
                <span className="text-[10px] text-slate-400 font-normal">Lockscreen View</span>
              </div>

              <div className="bg-white rounded-xl p-3 shadow-xs border border-slate-200 space-y-2 text-xs">
                <div className="flex items-center justify-between text-[10px] text-slate-400">
                  <span className="font-bold text-indigo-600">Ugrahak</span>
                  <span>Just now</span>
                </div>

                <div className="font-bold text-slate-900 text-sm">
                  {confirmSendOffer.title}
                </div>

                <div className="text-slate-700 whitespace-pre-line leading-relaxed font-normal bg-slate-50/70 p-2.5 rounded-lg border border-slate-100 text-xs">
                  <span className="text-indigo-600 font-medium">Hi [Customer Name],</span>
                  {"\n\n"}
                  {confirmSendOffer.message}
                  {"\n\n"}
                  <span className="text-slate-500 font-medium">
                    Shop: {merchantInfo.shopName}
                    {merchantInfo.phone ? `\nContact: ${merchantInfo.phone}` : ""}
                  </span>
                </div>
              </div>
            </div>

            <div className="pt-2 flex items-center justify-end gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setConfirmSendOffer(null)}
                disabled={isSending}
                className="min-h-[40px]"
              >
                Cancel
              </Button>
              <Button
                type="button"
                size="sm"
                onClick={handleTriggerSendBroadcast}
                isLoading={isSending}
                disabled={subscriberCount === 0 || isSending}
                className="min-h-[40px] bg-indigo-600 hover:bg-indigo-700 font-bold px-5 gap-1.5 shadow-sm"
              >
                <Send className="w-3.5 h-3.5" />
                <span>Confirm & Send to All Customers</span>
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Create / Edit Offer Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4">
          <div className="bg-white rounded-3xl max-w-2xl w-full p-5 sm:p-6 shadow-2xl border border-slate-200 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div>
                <h3 className="text-base sm:text-lg font-bold text-slate-900">
                  {editingOffer ? "Edit Offer" : "Create New Offer"}
                </h3>
                <p className="text-xs text-slate-500">
                  Compose your promotional message and preview your offer.
                </p>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg min-h-[36px] min-w-[36px] flex items-center justify-center"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {formError && (
              <Alert type="error" message={formError} className="my-3 text-xs" />
            )}

            <form onSubmit={handleSaveOffer} className="space-y-4 mt-3">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Left Column: Form Fields */}
                <div className="space-y-3">
                  <div>
                    <Input
                      label="1. Offer Title / Headline"
                      placeholder="e.g. Weekend Special: 20% Off"
                      required
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-slate-700 mb-1">
                      2. Offer Message
                    </label>
                    <textarea
                      rows={3}
                      required
                      placeholder="e.g. Visit our store this weekend for 20% flat discount on all items!"
                      value={message}
                      onChange={(e) => setMessage(e.target.value)}
                      className="w-full px-3 py-2 text-xs sm:text-sm text-slate-900 bg-white border border-slate-300 rounded-xl shadow-xs placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-xs font-medium text-slate-700 mb-1">
                        Status
                      </label>
                      <select
                        value={status}
                        onChange={(e) =>
                          setStatus(e.target.value as "ACTIVE" | "INACTIVE")
                        }
                        className="w-full px-3 py-2 text-xs bg-white border border-slate-300 rounded-xl"
                      >
                        <option value="ACTIVE">Active</option>
                        <option value="INACTIVE">Draft</option>
                      </select>
                    </div>

                    <div>
                      <Input
                        label="3. Image URL (Opt)"
                        placeholder="https://..."
                        value={imageUrl}
                        onChange={(e) => setImageUrl(e.target.value)}
                        className="text-xs"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <Input
                        type="date"
                        label="4. Start Date (Opt)"
                        value={startDate}
                        onChange={(e) => setStartDate(e.target.value)}
                        className="text-xs"
                      />
                    </div>
                    <div>
                      <Input
                        type="date"
                        label="5. End Date (Opt)"
                        value={endDate}
                        onChange={(e) => setEndDate(e.target.value)}
                        className="text-xs"
                      />
                    </div>
                  </div>
                </div>

                {/* Right Column: PREVIEW */}
                <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 flex flex-col justify-between space-y-3">
                  <div>
                    <div className="flex items-center gap-1.5 text-xs font-bold text-slate-700 mb-3">
                      <Smartphone className="w-4 h-4 text-indigo-600" />
                      <span>PREVIEW: Customer Smartphone View</span>
                    </div>

                    {/* Smartphone Offer Card Simulation */}
                    <div className="bg-white/95 backdrop-blur-md rounded-2xl p-3.5 shadow-md border border-slate-200 space-y-2">
                      <div className="flex items-center justify-between text-[11px] text-slate-400">
                        <div className="flex items-center gap-1.5">
                          <div className="w-4 h-4 rounded-md bg-indigo-600 flex items-center justify-center text-white text-[9px] font-black">
                            UG
                          </div>
                          <span className="font-semibold text-slate-700">Ugrahak</span>
                        </div>
                        <span className="text-[10px]">Just now</span>
                      </div>

                      <p className="text-xs font-bold text-slate-900 leading-snug">
                        {title || "Offer Title will appear here"}
                      </p>

                      <div className="text-[11px] text-slate-600 leading-relaxed whitespace-pre-line bg-slate-50/70 p-2.5 rounded-lg border border-slate-100">
                        <span className="text-indigo-600 font-medium">Hi [Customer Name],</span>
                        {"\n\n"}
                        {message || "Type your offer message on the left to see live preview."}
                        {"\n\n"}
                        <span className="text-slate-500 font-medium">
                          Shop: {merchantInfo.shopName}
                          {merchantInfo.phone ? `\nContact: ${merchantInfo.phone}` : ""}
                        </span>
                      </div>
                    </div>
                  </div>

                  <p className="text-[10px] text-slate-400 text-center">
                    Personalized offer preview with your shop details
                  </p>
                </div>
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setIsModalOpen(false)}
                  className="min-h-[40px]"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  size="sm"
                  isLoading={isSaving}
                  className="min-h-[40px] bg-indigo-600 hover:bg-indigo-700 font-bold px-6"
                >
                  {editingOffer ? "Update Offer" : "Save Offer"}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Broadcast Result Modal */}
      {broadcastResultModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-200 text-center space-y-4">
            <div className="w-14 h-14 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto">
              <CheckCircle2 className="w-8 h-8" />
            </div>

            <div>
              <h3 className="text-lg font-bold text-slate-900">
                Offer Sent Successfully!
              </h3>
              <p className="text-xs text-slate-500 mt-1 font-medium">
                &ldquo;{broadcastResultModal.offerTitle}&rdquo; has been sent to your customers.
              </p>
            </div>

            {/* Metrics Breakdown Grid */}
            <div className="grid grid-cols-3 gap-2 bg-slate-50 p-3 rounded-2xl border border-slate-200 text-center">
              <div>
                <span className="text-[10px] uppercase font-bold text-slate-400">Targeted</span>
                <p className="text-base font-extrabold text-slate-900">
                  {broadcastResultModal.totalTargeted}
                </p>
              </div>
              <div>
                <span className="text-[10px] uppercase font-bold text-emerald-600">Delivered</span>
                <p className="text-base font-extrabold text-emerald-700">
                  {broadcastResultModal.totalSent}
                </p>
              </div>
              <div>
                <span className="text-[10px] uppercase font-bold text-slate-400">Failed/Invalid</span>
                <p className="text-base font-extrabold text-slate-600">
                  {broadcastResultModal.totalFailed + broadcastResultModal.invalidCount}
                </p>
              </div>
            </div>

            <Button
              size="md"
              onClick={() => setBroadcastResultModal(null)}
              className="w-full bg-indigo-600 hover:bg-indigo-700 min-h-[42px] font-bold"
            >
              Done
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};
