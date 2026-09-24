"use client";

import React, { useState, useMemo } from "react";
import { computeMerchantAnalytics, type DateRangeFilter } from "@/lib/analytics/metrics";
import { Card } from "@/components/ui/Card";
import {
  Users,
  RotateCcw,
  Gift,
  CheckCircle2,
  Bell,
  TrendingUp,
  Calendar,
  Sparkles,
  BarChart2,
  Percent,
} from "lucide-react";
import type { Customer, CustomerVisit, Reward, Offer, NotificationLog } from "@/lib/types/database";

interface AnalyticsDashboardProps {
  customers: Customer[];
  visits: CustomerVisit[];
  rewards: Reward[];
  offers: Offer[];
  notificationLogs: NotificationLog[];
}

export const AnalyticsDashboard: React.FC<AnalyticsDashboardProps> = ({
  customers,
  visits,
  rewards,
  offers,
  notificationLogs,
}) => {
  const [filter, setFilter] = useState<DateRangeFilter>("30d");

  const metrics = useMemo(() => {
    return computeMerchantAnalytics({
      customers,
      visits,
      rewards,
      offers,
      notificationLogs,
      filter,
    });
  }, [customers, visits, rewards, offers, notificationLogs, filter]);

  // Max value for chart scaling
  const maxVisits = useMemo(() => {
    const max = Math.max(...metrics.dailyTrends.map((d) => d.visits), 5);
    return max;
  }, [metrics.dailyTrends]);

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Date Filter Tabs (Responsive) */}
      <div className="bg-white border border-slate-200 rounded-2xl p-3 sm:p-4 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Calendar className="w-4 h-4 text-indigo-600" />
          <span className="text-xs font-bold text-slate-900">
            Analytics Timeframe
          </span>
        </div>

        <div className="grid grid-cols-2 sm:flex sm:items-center gap-1 bg-slate-100 p-1 rounded-xl">
          <button
            onClick={() => setFilter("7d")}
            className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors text-center min-h-[36px] ${
              filter === "7d"
                ? "bg-white text-indigo-700 shadow-xs"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            Last 7 Days
          </button>
          <button
            onClick={() => setFilter("30d")}
            className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors text-center min-h-[36px] ${
              filter === "30d"
                ? "bg-white text-indigo-700 shadow-xs"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            Last 30 Days
          </button>
          <button
            onClick={() => setFilter("90d")}
            className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors text-center min-h-[36px] ${
              filter === "90d"
                ? "bg-white text-indigo-700 shadow-xs"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            Last 90 Days
          </button>
          <button
            onClick={() => setFilter("all")}
            className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors text-center min-h-[36px] ${
              filter === "all"
                ? "bg-white text-indigo-700 shadow-xs"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            All Time
          </button>
        </div>
      </div>

      {/* Grid 1: Customer Acquisition & Retention Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <div className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500">
              Total Enrolled
            </span>
            <div className="p-2 rounded-lg bg-blue-50 text-blue-600">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <h3 className="text-xl sm:text-2xl font-bold text-slate-900 mt-2">
            {metrics.totalCustomers.toLocaleString()}
          </h3>
          <p className="text-[11px] text-slate-500 mt-1">
            +{metrics.newCustomersInRange} new in period
          </p>
        </div>

        <div className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500">
              Repeat Rate
            </span>
            <div className="p-2 rounded-lg bg-emerald-50 text-emerald-600">
              <RotateCcw className="w-4 h-4" />
            </div>
          </div>
          <h3 className="text-xl sm:text-2xl font-bold text-slate-900 mt-2">
            {metrics.repeatCustomerRate}%
          </h3>
          <p className="text-[11px] text-slate-500 mt-1">
            {metrics.repeatCustomers} customers &gt; 1 visit
          </p>
        </div>

        <div className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500">
              Store Visits
            </span>
            <div className="p-2 rounded-lg bg-indigo-50 text-indigo-600">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <h3 className="text-xl sm:text-2xl font-bold text-slate-900 mt-2">
            {metrics.totalVisitsInRange.toLocaleString()}
          </h3>
          <p className="text-[11px] text-slate-500 mt-1">
            {metrics.repeatVisitsInRange} repeat check-ins
          </p>
        </div>

        <div className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500">
              Redemption Rate
            </span>
            <div className="p-2 rounded-lg bg-amber-50 text-amber-600">
              <Percent className="w-4 h-4" />
            </div>
          </div>
          <h3 className="text-xl sm:text-2xl font-bold text-slate-900 mt-2">
            {metrics.redemptionRate}%
          </h3>
          <p className="text-[11px] text-slate-500 mt-1">
            {metrics.rewardsRedeemed} / {metrics.rewardsIssued} redeemed
          </p>
        </div>
      </div>

      {/* Daily Footfall Trend Chart */}
      <Card
        title="Store Footfall & QR Scans Trend"
        description="Daily visitor check-ins recorded via store QR scans."
      >
        <div className="pt-4 overflow-x-auto">
          <div className="h-44 sm:h-48 flex items-end gap-1.5 sm:gap-3 border-b border-slate-200 pb-2 min-w-[280px]">
            {metrics.dailyTrends.map((d, i) => {
              const heightPct = Math.max(Math.round((d.visits / maxVisits) * 100), 4);
              return (
                <div
                  key={i}
                  className="flex-1 flex flex-col items-center gap-1 group relative h-full justify-end"
                >
                  {/* Tooltip on hover */}
                  <div className="absolute -top-10 bg-slate-900 text-white text-[10px] py-1 px-2 rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-20 shadow-md">
                    {d.date}: {d.visits} visit(s)
                  </div>

                  <div
                    style={{ height: `${heightPct}%` }}
                    className={`w-full rounded-t transition-all ${
                      d.visits > 0
                        ? "bg-indigo-600 group-hover:bg-indigo-700"
                        : "bg-slate-100"
                    }`}
                  />
                  <span className="text-[8px] sm:text-[9px] text-slate-400 truncate w-full text-center">
                    {i % Math.ceil(metrics.dailyTrends.length / 5) === 0 ? d.date : ""}
                  </span>
                </div>
              );
            })}
          </div>

          <div className="mt-3 flex flex-col sm:flex-row sm:items-center justify-between gap-1 text-xs text-slate-500">
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-xs bg-indigo-600 inline-block" />
              Daily Store Check-ins
            </span>
            <span>Peak: {maxVisits} visits/day</span>
          </div>
        </div>
      </Card>

      {/* Grid 2: Push Notifications & Reward Funnel */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
        {/* Left: Reward Funnel */}
        <Card
          title="Reward Program Performance"
          description="Conversion from first-visit scratch cards to store redemptions."
        >
          <div className="space-y-4 py-2">
            <div>
              <div className="flex items-center justify-between text-xs mb-1.5">
                <span className="text-slate-600 font-medium">
                  Scratch Rewards Issued
                </span>
                <span className="font-bold text-slate-900">
                  {metrics.rewardsIssued}
                </span>
              </div>
              <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden">
                <div className="bg-indigo-500 h-full rounded-full w-full" />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between text-xs mb-1.5">
                <span className="text-slate-600 font-medium">
                  Successfully Redeemed at Billing
                </span>
                <span className="font-bold text-emerald-600">
                  {metrics.rewardsRedeemed} ({metrics.redemptionRate}%)
                </span>
              </div>
              <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden">
                <div
                  style={{ width: `${Math.min(metrics.redemptionRate, 100)}%` }}
                  className="bg-emerald-500 h-full rounded-full transition-all"
                />
              </div>
            </div>

            <div className="pt-2 border-t border-slate-100 text-xs text-slate-500">
              Avg visits per customer:{" "}
              <strong className="text-slate-900">
                {metrics.avgVisitsPerCustomer}
              </strong>
            </div>
          </div>
        </Card>

        {/* Right: Notification Delivery Stats */}
        <Card
          title="Push Notification Broadcasts"
          description="Delivery success rates across your customer audience."
        >
          <div className="space-y-4 py-2">
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-slate-50 p-3 rounded-xl border border-slate-200">
                <span className="text-[11px] text-slate-500 font-medium">
                  Promotions Sent
                </span>
                <p className="text-lg sm:text-xl font-bold text-slate-900 mt-1">
                  {metrics.totalNotificationsSent.toLocaleString()}
                </p>
              </div>

              <div className="bg-slate-50 p-3 rounded-xl border border-slate-200">
                <span className="text-[11px] text-slate-500 font-medium">
                  Active Campaigns
                </span>
                <p className="text-lg sm:text-xl font-bold text-indigo-600 mt-1">
                  {metrics.activeOffers}
                </p>
              </div>
            </div>

            <div className="text-xs text-slate-500 pt-2 border-t border-slate-100 flex items-center justify-between">
              <span>Unreachable Tokens:</span>
              <span className="font-semibold text-rose-600">
                {metrics.totalNotificationsFailed}
              </span>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
};
