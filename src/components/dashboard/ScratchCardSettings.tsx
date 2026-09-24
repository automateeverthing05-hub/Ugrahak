"use client";

import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Alert } from "@/components/ui/Alert";
import {
  Gift,
  Plus,
  Edit2,
  Trash2,
  CheckCircle2,
  X,
  Sparkles,
  ToggleLeft,
  ToggleRight,
  Eye,
  RotateCcw,
} from "lucide-react";
import { ScratchCard } from "@/components/shop/ScratchCard";
import type { ScratchCardReward } from "@/lib/types/database";

interface ScratchCardSettingsProps {
  initialRewards?: ScratchCardReward[];
  shopName: string;
}

export const ScratchCardSettings: React.FC<ScratchCardSettingsProps> = ({
  initialRewards = [],
  shopName,
}) => {
  const [rewards, setRewards] = useState<ScratchCardReward[]>(initialRewards);
  const [isLoading, setIsLoading] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingReward, setEditingReward] = useState<ScratchCardReward | null>(null);

  // Form Fields
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [value, setValue] = useState("");
  const [isEnabled, setIsEnabled] = useState(true);

  const [formError, setFormError] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<{
    type: "success" | "error";
    message: string;
  } | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  // Fetch latest rewards on mount if not provided
  useEffect(() => {
    fetchRewards();
  }, []);

  const fetchRewards = async () => {
    try {
      setIsLoading(true);
      const res = await fetch("/api/merchant/scratch-rewards");
      const data = await res.json();
      if (res.ok && data.rewards) {
        setRewards(data.rewards);
      }
      setIsLoading(false);
    } catch {
      setIsLoading(false);
    }
  };

  const openCreateModal = () => {
    if (rewards.length >= 5) {
      setFeedback({
        type: "error",
        message: "Maximum 5 rewards allowed. Please delete or edit an existing reward.",
      });
      return;
    }
    setEditingReward(null);
    setName("");
    setDescription("");
    setValue("");
    setIsEnabled(true);
    setFormError(null);
    setIsModalOpen(true);
  };

  const openEditModal = (reward: ScratchCardReward) => {
    setEditingReward(reward);
    setName(reward.name);
    setDescription(reward.description || "");
    setValue(reward.value);
    setIsEnabled(reward.is_enabled);
    setFormError(null);
    setIsModalOpen(true);
  };

  const handleSaveReward = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (!name.trim()) {
      setFormError("Reward name is required (e.g. 10% OFF, ₹50 OFF).");
      return;
    }

    if (!value.trim()) {
      setFormError("Reward value is required (e.g. 10%, ₹50, Free Gift).");
      return;
    }

    setIsSaving(true);

    try {
      const url = editingReward
        ? `/api/merchant/scratch-rewards/${editingReward.id}`
        : `/api/merchant/scratch-rewards`;
      const method = editingReward ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          description: description.trim() || null,
          value: value.trim(),
          is_enabled: isEnabled,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setFormError(data.error || "Failed to save reward.");
        setIsSaving(false);
        return;
      }

      setFeedback({
        type: "success",
        message: editingReward
          ? "Reward updated successfully!"
          : "New scratch card reward added!",
      });

      setIsModalOpen(false);
      setIsSaving(false);
      fetchRewards();
    } catch (err: unknown) {
      setFormError(err instanceof Error ? err.message : "An unexpected error occurred.");
      setIsSaving(false);
    }
  };

  const handleToggleEnable = async (reward: ScratchCardReward) => {
    try {
      const res = await fetch(`/api/merchant/scratch-rewards/${reward.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ is_enabled: !reward.is_enabled }),
      });

      if (res.ok) {
        setRewards(
          rewards.map((r) =>
            r.id === reward.id ? { ...r, is_enabled: !r.is_enabled } : r
          )
        );
        setFeedback({
          type: "success",
          message: `Reward "${reward.name}" ${
            !reward.is_enabled ? "enabled" : "disabled"
          }.`,
        });
      }
    } catch {
      // Ignore
    }
  };

  const handleDeleteReward = async (id: string, rewardName: string) => {
    if (!confirm(`Are you sure you want to delete reward "${rewardName}"?`)) {
      return;
    }

    try {
      const res = await fetch(`/api/merchant/scratch-rewards/${id}`, {
        method: "DELETE",
      });

      if (res.ok) {
        setRewards(rewards.filter((r) => r.id !== id));
        setFeedback({
          type: "success",
          message: `Reward "${rewardName}" deleted.`,
        });
      }
    } catch {
      // Ignore
    }
  };

  // Select reward to preview (first enabled, or first, or fallback)
  const previewReward =
    rewards.find((r) => r.is_enabled) ||
    rewards[0] || {
      name: "10% OFF",
      description: "Welcome reward on your first purchase!",
      value: "10%",
    };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-white border border-slate-200 rounded-2xl p-5 sm:p-6 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center flex-shrink-0">
            <Gift className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-base sm:text-lg font-bold text-slate-900">
              First-Visit Scratch Card Rewards
            </h3>
            <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
              Create up to 5 rewards for your first-visit scratch card.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3 self-start sm:self-auto">
          <span className="text-xs font-bold text-purple-800 bg-purple-50 border border-purple-200 px-3 py-1.5 rounded-xl">
            {rewards.length} / 5 Rewards
          </span>

          <Button
            onClick={openCreateModal}
            disabled={rewards.length >= 5}
            size="sm"
            className="gap-1.5 min-h-[40px] bg-purple-600 hover:bg-purple-700"
          >
            <Plus className="w-4 h-4" />
            <span>Add Reward</span>
          </Button>
        </div>
      </div>

      {feedback && (
        <Alert
          type={feedback.type}
          message={feedback.message}
          className="text-xs"
        />
      )}

      {/* Main Grid: Left Rewards List, Right Live Scratch Card Preview */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column (2 Cols): Configured Rewards List */}
        <div className="lg:col-span-2 space-y-3">
          <div className="flex items-center justify-between">
            <h4 className="text-sm font-bold text-slate-900">
              Configured Reward Options
            </h4>
            <span className="text-xs text-slate-500">
              Randomly picked server-side when customer scans QR
            </span>
          </div>

          {rewards.length === 0 ? (
            <div className="bg-white border border-dashed border-slate-300 rounded-2xl p-8 text-center space-y-3">
              <div className="w-12 h-12 rounded-xl bg-slate-50 text-slate-400 flex items-center justify-center mx-auto">
                <Sparkles className="w-6 h-6" />
              </div>
              <div>
                <p className="text-sm font-bold text-slate-700">
                  No Custom Rewards Configured
                </p>
                <p className="text-xs text-slate-500 max-w-sm mx-auto mt-1">
                  Default <strong>Flat 10% Off</strong> reward is active. Add up to 5 custom options (e.g. 15% OFF, ₹50 OFF, Free Gift) to excite your customers!
                </p>
              </div>
              <Button
                onClick={openCreateModal}
                size="sm"
                className="gap-1.5 bg-purple-600 hover:bg-purple-700"
              >
                <Plus className="w-4 h-4" />
                <span>Create First Reward</span>
              </Button>
            </div>
          ) : (
            <div className="space-y-3">
              {rewards.map((reward, index) => (
                <div
                  key={reward.id}
                  className={`bg-white border rounded-2xl p-4 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3 transition-all ${
                    reward.is_enabled
                      ? "border-slate-200"
                      : "border-slate-200 bg-slate-50/60 opacity-75"
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <span className="w-6 h-6 rounded-full bg-purple-100 text-purple-800 text-xs font-black flex items-center justify-center flex-shrink-0 mt-0.5">
                      {index + 1}
                    </span>
                    <div>
                      <div className="flex items-center gap-2">
                        <h5 className="text-sm font-bold text-slate-900">
                          {reward.name}
                        </h5>
                        <span className="text-xs font-mono font-bold text-purple-700 bg-purple-50 px-2 py-0.5 rounded-md border border-purple-200">
                          {reward.value}
                        </span>
                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                            reward.is_enabled
                              ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                              : "bg-slate-100 text-slate-500 border border-slate-200"
                          }`}
                        >
                          {reward.is_enabled ? "Enabled" : "Disabled"}
                        </span>
                      </div>
                      {reward.description && (
                        <p className="text-xs text-slate-500 mt-1">
                          {reward.description}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-1.5 self-end sm:self-auto pt-2 sm:pt-0 border-t sm:border-0 border-slate-100 w-full sm:w-auto justify-end">
                    <button
                      onClick={() => handleToggleEnable(reward)}
                      className={`inline-flex items-center gap-1 px-2.5 py-1.5 rounded-xl text-xs font-semibold transition-colors min-h-[36px] ${
                        reward.is_enabled
                          ? "text-emerald-700 hover:bg-emerald-50"
                          : "text-slate-500 hover:bg-slate-100"
                      }`}
                      title={reward.is_enabled ? "Disable reward" : "Enable reward"}
                    >
                      {reward.is_enabled ? (
                        <>
                          <ToggleRight className="w-5 h-5 text-emerald-600" />
                          <span className="hidden sm:inline">Active</span>
                        </>
                      ) : (
                        <>
                          <ToggleLeft className="w-5 h-5 text-slate-400" />
                          <span className="hidden sm:inline">Disabled</span>
                        </>
                      )}
                    </button>

                    <button
                      onClick={() => openEditModal(reward)}
                      className="p-2 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-xl transition-colors min-h-[36px] min-w-[36px] flex items-center justify-center"
                      title="Edit Reward"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>

                    <button
                      onClick={() => handleDeleteReward(reward.id, reward.name)}
                      className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-colors min-h-[36px] min-w-[36px] flex items-center justify-center"
                      title="Delete Reward"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Guidelines Box */}
          <div className="p-4 bg-purple-50/70 border border-purple-200 rounded-2xl text-xs text-purple-900 space-y-1.5">
            <p className="font-bold flex items-center gap-1.5">
              <Sparkles className="w-4 h-4 text-purple-600" />
              <span>How Scratch Card Allocation Works:</span>
            </p>
            <ul className="list-disc list-inside space-y-1 text-purple-800 text-[11px]">
              <li>When a customer completes their 1st QR scan, 1 enabled reward is picked <strong>server-side</strong>.</li>
              <li>Customer scratches the interactive card on their smartphone screen to reveal their reward and 6-digit reference code.</li>
              <li>If no custom rewards are enabled, Ugrahak automatically uses the standard <strong>Flat 10% Off</strong>.</li>
            </ul>
          </div>
        </div>

        {/* Right Column (1 Col): Live Scratch Card Preview */}
        <div className="space-y-3">
          <div className="flex items-center gap-1.5 text-sm font-bold text-slate-900">
            <Eye className="w-4 h-4 text-purple-600" />
            <span>Interactive Scratch Preview</span>
          </div>

          <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-xs space-y-3">
            <p className="text-xs text-slate-500 text-center">
              Try scratching below to test customer experience:
            </p>

            <ScratchCard
              key={`${previewReward.name}_${previewReward.value}`}
              rewardTitle={previewReward.name}
              rewardDescription={previewReward.description || "Welcome discount"}
              referenceCode="AG-SAMPLE"
              shopName={shopName}
              expiresAt={new Date(Date.now() + 30 * 86400000).toISOString()}
            />
          </div>
        </div>
      </div>

      {/* Add / Edit Reward Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-5 sm:p-6 shadow-2xl border border-slate-200 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="text-base font-bold text-slate-900">
                {editingReward ? "Edit Scratch Reward" : "Add Scratch Reward"}
              </h3>
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

            <form onSubmit={handleSaveReward} className="space-y-3.5 mt-3">
              <div>
                <Input
                  label="Reward Name"
                  placeholder="e.g. 10% OFF, ₹50 OFF, Free Item, Better Luck"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  helperText="Displayed in large bold letters on the scratch card."
                />
              </div>

              <div>
                <Input
                  label="Reward Value / Discount"
                  placeholder="e.g. 10%, ₹50, Free Gift, None"
                  required
                  value={value}
                  onChange={(e) => setValue(e.target.value)}
                  helperText="The actual discount or gift applied at billing counter."
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  Reward Description / Condition (Optional)
                </label>
                <textarea
                  rows={2}
                  placeholder="e.g. On minimum purchase of ₹200. Valid for 30 days."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full px-3 py-2 text-xs sm:text-sm text-slate-900 bg-white border border-slate-300 rounded-xl shadow-xs placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                />
              </div>

              <div className="flex items-center gap-2 pt-1">
                <input
                  type="checkbox"
                  id="isEnabledCheckbox"
                  checked={isEnabled}
                  onChange={(e) => setIsEnabled(e.target.checked)}
                  className="w-4 h-4 text-purple-600 rounded border-slate-300 focus:ring-purple-500"
                />
                <label
                  htmlFor="isEnabledCheckbox"
                  className="text-xs font-semibold text-slate-700 cursor-pointer"
                >
                  Enable this reward option for first-visit customers
                </label>
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
                  className="min-h-[40px] bg-purple-600 hover:bg-purple-700"
                >
                  {editingReward ? "Update Reward" : "Save Reward"}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

