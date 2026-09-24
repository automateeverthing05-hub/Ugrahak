"use client";

import React, { useState, useMemo } from "react";
import Link from "next/link";
import { maskPhone } from "@/lib/utils/referenceCode";
import {
  Users,
  Search,
  RotateCcw,
  Calendar,
  ChevronRight,
  UserPlus,
  Sparkles,
  Phone,
  Ticket,
  X,
  CheckCircle2,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Alert } from "@/components/ui/Alert";
import type { Customer, Reward } from "@/lib/types/database";

export interface CustomerWithReward extends Customer {
  rewards?: Reward[];
}

interface CustomersListProps {
  initialCustomers: CustomerWithReward[];
  initialTotalCount?: number;
}

interface RedemptionResult {
  message: string;
  reward: {
    id: string;
    title: string;
    description: string | null;
    discount_value: string | null;
    reference_code: string;
    redeemed_at: string;
  };
  customer: {
    name: string;
    phone: string;
  } | null;
}

export const CustomersList: React.FC<CustomersListProps> = ({
  initialCustomers,
  initialTotalCount,
}) => {
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<"ALL" | "FIRST" | "REPEAT">("ALL");
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(25);

  // Quick Redeem Modal State
  const [isRedeemModalOpen, setIsRedeemModalOpen] = useState(false);
  const [redeemCode, setRedeemCode] = useState("");
  const [redeemError, setRedeemError] = useState<string | null>(null);
  const [redeemSuccess, setRedeemSuccess] = useState<string | null>(null);
  const [redeemResult, setRedeemResult] = useState<RedemptionResult | null>(null);
  const [isRedeeming, setIsRedeeming] = useState(false);

  const filteredCustomers = useMemo(() => {
    return initialCustomers.filter((cust) => {
      // Filter by type
      if (filter === "FIRST" && cust.visit_count > 1) return false;
      if (filter === "REPEAT" && cust.visit_count <= 1) return false;

      // Filter by search
      if (!search.trim()) return true;
      const q = search.toLowerCase().trim();
      const matchName = cust.name.toLowerCase().includes(q);
      const matchPhone = cust.phone.includes(q);
      return matchName || matchPhone;
    });
  }, [initialCustomers, search, filter]);

  // Total pages and paginated view
  const totalItems = filteredCustomers.length;
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));
  const safeCurrentPage = Math.min(currentPage, totalPages);

  const paginatedCustomers = useMemo(() => {
    const startIndex = (safeCurrentPage - 1) * pageSize;
    return filteredCustomers.slice(startIndex, startIndex + pageSize);
  }, [filteredCustomers, safeCurrentPage, pageSize]);

  // Reset to page 1 on search or filter change
  const handleSearchChange = (val: string) => {
    setSearch(val);
    setCurrentPage(1);
  };

  const handleFilterChange = (val: "ALL" | "FIRST" | "REPEAT") => {
    setFilter(val);
    setCurrentPage(1);
  };

  const handleQuickRedeem = async (e: React.FormEvent) => {
    e.preventDefault();
    setRedeemError(null);
    setRedeemSuccess(null);
    setRedeemResult(null);

    const cleanCode = redeemCode.trim().toUpperCase();
    if (!cleanCode) {
      setRedeemError("Please enter the customer's 6-digit reference code.");
      return;
    }

    setIsRedeeming(true);

    try {
      const response = await fetch("/api/merchant/redeem", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reference_code: cleanCode }),
      });

      const data = await response.json();

      if (!response.ok) {
        setRedeemError(data.error || "Failed to redeem code.");
        setIsRedeeming(false);
        return;
      }

      setRedeemSuccess(data.message || "Reward redeemed successfully!");
      setRedeemResult(data);
      setRedeemCode("");
      setIsRedeeming(false);
    } catch (err: unknown) {
      setRedeemError(err instanceof Error ? err.message : "An unexpected error occurred.");
      setIsRedeeming(false);
    }
  };

  const handleResetRedeem = () => {
    setRedeemResult(null);
    setRedeemSuccess(null);
    setRedeemError(null);
    setRedeemCode("");
  };

  return (
    <div className="space-y-4">
      {/* Top Action Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white border border-slate-200 rounded-2xl p-4 shadow-xs">
        <div>
          <h2 className="text-base font-bold text-slate-900">
            Customer Directory
          </h2>
          <p className="text-xs text-slate-500">
            {initialCustomers.length} total enrolled customer(s)
          </p>
        </div>

        <button
          onClick={() => {
            handleResetRedeem();
            setIsRedeemModalOpen(true);
          }}
          className="inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl shadow-xs transition-colors min-h-[42px]"
        >
          <Ticket className="w-4 h-4" />
          <span>Verify & Redeem Code</span>
        </button>
      </div>

      {/* Search & Filter Bar */}
      <div className="bg-white border border-slate-200 rounded-2xl p-3 sm:p-4 shadow-xs flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search name or phone..."
            value={search}
            onChange={(e) => handleSearchChange(e.target.value)}
            className="w-full pl-9 pr-4 py-2 text-xs sm:text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-colors"
          />
        </div>

        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
          <button
            onClick={() => handleFilterChange("ALL")}
            className={`px-3 py-1.5 text-xs font-semibold rounded-xl transition-colors whitespace-nowrap min-h-[36px] ${
              filter === "ALL"
                ? "bg-indigo-600 text-white"
                : "bg-slate-100 text-slate-600 hover:bg-slate-200"
            }`}
          >
            All ({initialCustomers.length})
          </button>
          <button
            onClick={() => handleFilterChange("FIRST")}
            className={`px-3 py-1.5 text-xs font-semibold rounded-xl transition-colors whitespace-nowrap min-h-[36px] ${
              filter === "FIRST"
                ? "bg-indigo-600 text-white"
                : "bg-slate-100 text-slate-600 hover:bg-slate-200"
            }`}
          >
            1st-Time ({initialCustomers.filter((c) => c.visit_count === 1).length})
          </button>
          <button
            onClick={() => handleFilterChange("REPEAT")}
            className={`px-3 py-1.5 text-xs font-semibold rounded-xl transition-colors whitespace-nowrap min-h-[36px] ${
              filter === "REPEAT"
                ? "bg-indigo-600 text-white"
                : "bg-slate-100 text-slate-600 hover:bg-slate-200"
            }`}
          >
            Repeat ({initialCustomers.filter((c) => c.visit_count > 1).length})
          </button>
        </div>
      </div>

      {initialCustomers.length === 0 ? (
        <div className="bg-white border border-slate-200 rounded-2xl p-8 sm:p-12 text-center shadow-xs">
          <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center mx-auto mb-4">
            <Users className="w-7 h-7 sm:w-8 sm:h-8" />
          </div>
          <h3 className="text-base sm:text-lg font-bold text-slate-900">
            No Customers Enrolled Yet
          </h3>
          <p className="text-xs sm:text-sm text-slate-500 max-w-md mx-auto mt-1.5">
            Display your store QR code at your billing counter. When customers scan and enter their details, they will automatically appear here.
          </p>
          <div className="mt-6">
            <Link
              href="/dashboard/settings"
              className="inline-flex items-center gap-2 px-4 py-2.5 text-xs sm:text-sm font-semibold text-white bg-indigo-600 rounded-xl hover:bg-indigo-700 transition-colors shadow-xs"
            >
              Get Store QR Code
            </Link>
          </div>
        </div>
      ) : filteredCustomers.length === 0 ? (
        <div className="bg-white border border-slate-200 rounded-2xl p-8 text-center text-slate-500 text-xs shadow-xs">
          No matching customers found for &quot;{search}&quot;.
        </div>
      ) : (
        <>
          {/* Mobile Card List (< 640px) */}
          <div className="block sm:hidden space-y-3">
            {paginatedCustomers.map((cust) => {
              const hasActiveReward = cust.rewards?.some(
                (r) => r.status === "ACTIVE"
              );

              return (
                <div
                  key={cust.id}
                  className="bg-white border border-slate-200 rounded-2xl p-4 shadow-xs space-y-3"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-indigo-50 text-indigo-700 flex items-center justify-center font-bold text-sm">
                        {cust.name.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <h4 className="font-bold text-sm text-slate-900">
                          {cust.name}
                        </h4>
                        <span className="text-xs font-mono text-slate-500 flex items-center gap-1">
                          <Phone className="w-3 h-3 text-slate-400" />
                          {maskPhone(cust.phone)}
                        </span>
                      </div>
                    </div>

                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                        cust.visit_count > 1
                          ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                          : "bg-blue-50 text-blue-700 border border-blue-200"
                      }`}
                    >
                      {cust.visit_count > 1 ? `${cust.visit_count} visits` : "1st visit"}
                    </span>
                  </div>

                  <div className="flex items-center justify-between text-[11px] text-slate-500 pt-2 border-t border-slate-100">
                    <span>Joined: {new Date(cust.first_visit_at).toLocaleDateString()}</span>
                    {hasActiveReward && (
                      <span className="inline-flex items-center gap-1 text-[10px] text-amber-800 font-semibold bg-amber-50 px-1.5 py-0.5 rounded border border-amber-200">
                        <Sparkles className="w-2.5 h-2.5 text-amber-500" />
                        Active Reward
                      </span>
                    )}
                  </div>

                  <Link
                    href={`/dashboard/customers/${cust.id}`}
                    className="w-full flex items-center justify-center gap-1 py-2 px-3 bg-slate-50 hover:bg-slate-100 text-indigo-600 font-semibold text-xs rounded-xl border border-slate-200 transition-colors min-h-[40px]"
                  >
                    <span>View Customer History</span>
                    <ChevronRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              );
            })}
          </div>

          {/* Desktop Table View (>= 640px) */}
          <div className="hidden sm:block bg-white border border-slate-200 rounded-2xl shadow-xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="bg-slate-50 border-b border-slate-200 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                  <tr>
                    <th className="px-5 py-3.5">Customer Name</th>
                    <th className="px-5 py-3.5">Phone Number</th>
                    <th className="px-5 py-3.5">Visits</th>
                    <th className="px-5 py-3.5">First Seen</th>
                    <th className="px-5 py-3.5">Last Visit</th>
                    <th className="px-5 py-3.5 text-right">Details</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {paginatedCustomers.map((cust) => {
                    const hasActiveReward = cust.rewards?.some(
                      (r) => r.status === "ACTIVE"
                    );

                    return (
                      <tr
                        key={cust.id}
                        className="hover:bg-slate-50/80 transition-colors"
                      >
                        <td className="px-5 py-4 font-medium text-slate-900">
                          <div className="flex items-center gap-2.5">
                            <div className="w-8 h-8 rounded-full bg-indigo-50 text-indigo-700 flex items-center justify-center font-bold text-xs flex-shrink-0">
                              {cust.name.charAt(0).toUpperCase()}
                            </div>
                            <div>
                              <p className="font-semibold text-slate-900">{cust.name}</p>
                              {hasActiveReward && (
                                <span className="inline-flex items-center gap-1 text-[10px] text-amber-700 font-medium bg-amber-50 px-1.5 py-0.5 rounded border border-amber-200">
                                  <Sparkles className="w-2.5 h-2.5" />
                                  Active Reward
                                </span>
                              )}
                            </div>
                          </div>
                        </td>

                        <td className="px-5 py-4 font-mono text-xs text-slate-600">
                          {maskPhone(cust.phone)}
                        </td>

                        <td className="px-5 py-4">
                          {cust.visit_count > 1 ? (
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                              <RotateCcw className="w-3 h-3" />
                              {cust.visit_count} visits
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-50 text-blue-700 border border-blue-200">
                              <UserPlus className="w-3 h-3" />
                              1st visit
                            </span>
                          )}
                        </td>

                        <td className="px-5 py-4 text-xs text-slate-500">
                          {new Date(cust.first_visit_at).toLocaleDateString()}
                        </td>

                        <td className="px-5 py-4 text-xs text-slate-500">
                          {new Date(cust.last_visit_at).toLocaleDateString()}
                        </td>

                        <td className="px-5 py-4 text-right">
                          <Link
                            href={`/dashboard/customers/${cust.id}`}
                            className="inline-flex items-center gap-1 text-xs font-semibold text-indigo-600 hover:text-indigo-800 hover:underline"
                          >
                            <span>View</span>
                            <ChevronRight className="w-3.5 h-3.5" />
                          </Link>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* Pagination Controls Bar */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-white border border-slate-200 rounded-2xl p-3 sm:p-4 shadow-xs text-xs text-slate-600">
            <div className="flex items-center gap-2">
              <span>
                Showing <strong>{(safeCurrentPage - 1) * pageSize + 1}</strong>–
                <strong>{Math.min(safeCurrentPage * pageSize, totalItems)}</strong> of{" "}
                <strong>{totalItems}</strong> customers
              </span>
              <span className="text-slate-300">|</span>
              <div className="flex items-center gap-1">
                <span>Per page:</span>
                <select
                  value={pageSize}
                  onChange={(e) => {
                    setPageSize(Number(e.target.value));
                    setCurrentPage(1);
                  }}
                  className="bg-slate-50 border border-slate-200 rounded-lg px-2 py-1 font-semibold text-slate-700 focus:outline-none"
                >
                  <option value={25}>25</option>
                  <option value={50}>50</option>
                  <option value={100}>100</option>
                </select>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-slate-500">
                Page {safeCurrentPage} of {totalPages}
              </span>
              <button
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                disabled={safeCurrentPage <= 1}
                className="px-3 py-1.5 rounded-xl border border-slate-200 bg-white font-semibold text-slate-700 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-slate-50 transition-colors min-h-[36px]"
              >
                Previous
              </button>
              <button
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                disabled={safeCurrentPage >= totalPages}
                className="px-3 py-1.5 rounded-xl border border-slate-200 bg-white font-semibold text-slate-700 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-slate-50 transition-colors min-h-[36px]"
              >
                Next
              </button>
            </div>
          </div>
        </>
      )}

      {/* Quick Redeem Modal */}
      {isRedeemModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-5 sm:p-6 shadow-2xl border border-slate-200 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <Ticket className="w-5 h-5 text-emerald-600" />
                <h3 className="text-base font-bold text-slate-900">
                  Verify & Redeem Reward
                </h3>
              </div>
              <button
                onClick={() => setIsRedeemModalOpen(false)}
                className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {redeemError && (
              <Alert type="error" message={redeemError} className="my-3 text-xs" />
            )}
            {redeemSuccess && (
              <Alert type="success" message={redeemSuccess} className="my-3 text-xs" />
            )}

            {redeemResult ? (
              <div className="my-4 bg-emerald-50/70 border border-emerald-300 rounded-2xl p-4 space-y-3">
                <div className="flex items-center gap-2 text-emerald-950 font-bold text-sm">
                  <CheckCircle2 className="w-5 h-5 text-emerald-600 flex-shrink-0" />
                  <span>Valid Reward Verified!</span>
                </div>
                <div className="bg-white p-3 rounded-xl border border-emerald-200 text-xs space-y-1">
                  <p className="font-bold text-slate-900">
                    {redeemResult.customer?.name || "Customer"} (
                    {redeemResult.customer?.phone
                      ? maskPhone(redeemResult.customer.phone)
                      : "Verified"}
                    )
                  </p>
                  <p className="text-indigo-700 font-semibold">
                    {redeemResult.reward.title}
                  </p>
                  <p className="font-mono text-[11px] text-slate-500">
                    Code: {redeemResult.reward.reference_code}
                  </p>
                </div>
                <Button
                  size="sm"
                  onClick={handleResetRedeem}
                  className="w-full text-xs bg-emerald-600 hover:bg-emerald-700"
                >
                  Redeem Another Code
                </Button>
              </div>
            ) : (
              <form onSubmit={handleQuickRedeem} className="space-y-4 my-4">
                <Input
                  label="Enter Customer Reward Code"
                  placeholder="e.g. AG-7K9M-3P2Q"
                  required
                  value={redeemCode}
                  onChange={(e) => setRedeemCode(e.target.value.toUpperCase())}
                  className="font-mono uppercase tracking-wider text-center text-base"
                  helperText="Ask the customer for the code shown on their scratch card screen."
                />

                <div className="pt-2 flex items-center justify-end gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setIsRedeemModalOpen(false)}
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    size="sm"
                    isLoading={isRedeeming}
                    className="bg-emerald-600 hover:bg-emerald-700"
                  >
                    Redeem Code
                  </Button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
