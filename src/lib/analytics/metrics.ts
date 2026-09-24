import type { Customer, CustomerVisit, Reward, Offer, NotificationLog } from "@/lib/types/database";

export type DateRangeFilter = "7d" | "30d" | "90d" | "all";

export interface AnalyticsSummary {
  dateRange: DateRangeFilter;
  // Customer metrics
  totalCustomers: number;
  newCustomersInRange: number;
  repeatCustomers: number;
  repeatCustomerRate: number;
  avgVisitsPerCustomer: number;
  // Visit metrics
  totalVisitsInRange: number;
  firstVisitsInRange: number;
  repeatVisitsInRange: number;
  // Reward metrics
  rewardsIssued: number;
  rewardsRedeemed: number;
  redemptionRate: number;
  // Offer & Notification metrics
  totalOffers: number;
  activeOffers: number;
  totalNotificationsSent: number;
  totalNotificationsFailed: number;
  // Chart trend data (daily visits)
  dailyTrends: {
    date: string;
    visits: number;
    newCustomers: number;
  }[];
}

export function computeMerchantAnalytics({
  customers,
  visits,
  rewards,
  offers,
  notificationLogs,
  filter = "30d",
}: {
  customers: Customer[];
  visits: CustomerVisit[];
  rewards: Reward[];
  offers: Offer[];
  notificationLogs: NotificationLog[];
  filter?: DateRangeFilter;
}): AnalyticsSummary {
  // Determine cutoff timestamp
  const now = Date.now();
  let cutoffMs = 0;
  let numDays = 30;

  if (filter === "7d") {
    numDays = 7;
    cutoffMs = now - 7 * 24 * 60 * 60 * 1000;
  } else if (filter === "30d") {
    numDays = 30;
    cutoffMs = now - 30 * 24 * 60 * 60 * 1000;
  } else if (filter === "90d") {
    numDays = 90;
    cutoffMs = now - 90 * 24 * 60 * 60 * 1000;
  } else {
    numDays = 365;
    cutoffMs = 0; // All time
  }

  // Filter entities by date range
  const filteredVisits = visits.filter((v) => new Date(v.visited_at).getTime() >= cutoffMs);
  const filteredCustomers = customers.filter(
    (c) => new Date(c.first_visit_at).getTime() >= cutoffMs
  );
  const filteredRewards = rewards.filter((r) => new Date(r.issued_at).getTime() >= cutoffMs);
  const filteredLogs = notificationLogs.filter((l) => new Date(l.sent_at).getTime() >= cutoffMs);

  const totalCustomers = customers.length;
  const newCustomersInRange = filteredCustomers.length;
  const repeatCustomers = customers.filter((c) => c.visit_count > 1).length;
  const repeatCustomerRate = totalCustomers > 0 ? (repeatCustomers / totalCustomers) * 100 : 0;

  const totalVisitsInRange = filteredVisits.length;
  const firstVisitsInRange = filteredVisits.filter((v) => v.visit_type === "FIRST_VISIT").length;
  const repeatVisitsInRange = filteredVisits.filter((v) => v.visit_type === "REPEAT_VISIT").length;

  const totalAllTimeVisits = visits.length;
  const avgVisitsPerCustomer = totalCustomers > 0 ? totalAllTimeVisits / totalCustomers : 0;

  const rewardsIssued = filteredRewards.length;
  const rewardsRedeemed = filteredRewards.filter((r) => r.status === "REDEEMED").length;
  const redemptionRate = rewardsIssued > 0 ? (rewardsRedeemed / rewardsIssued) * 100 : 0;

  const totalOffers = offers.length;
  const activeOffers = offers.filter((o) => o.status === "ACTIVE").length;

  const totalNotificationsSent = filteredLogs.filter((l) => l.status === "SENT").length;
  const totalNotificationsFailed = filteredLogs.filter(
    (l) => l.status === "FAILED" || l.status === "INVALID_TOKEN"
  ).length;

  // Generate Daily Trend buckets for the selected days (up to 30 days max for chart)
  const chartDays = Math.min(numDays, 30);
  const dailyTrends: { date: string; visits: number; newCustomers: number }[] = [];

  for (let i = chartDays - 1; i >= 0; i--) {
    const d = new Date(now - i * 24 * 60 * 60 * 1000);
    const dateStr = d.toISOString().slice(0, 10);
    const displayDate = d.toLocaleDateString(undefined, { month: "short", day: "numeric" });

    const dayVisits = filteredVisits.filter((v) => v.visited_at.slice(0, 10) === dateStr).length;
    const dayNewCust = filteredCustomers.filter((c) => c.first_visit_at.slice(0, 10) === dateStr).length;

    dailyTrends.push({
      date: displayDate,
      visits: dayVisits,
      newCustomers: dayNewCust,
    });
  }

  return {
    dateRange: filter,
    totalCustomers,
    newCustomersInRange,
    repeatCustomers,
    repeatCustomerRate: Math.round(repeatCustomerRate * 10) / 10,
    avgVisitsPerCustomer: Math.round(avgVisitsPerCustomer * 10) / 10,
    totalVisitsInRange,
    firstVisitsInRange,
    repeatVisitsInRange,
    rewardsIssued,
    rewardsRedeemed,
    redemptionRate: Math.round(redemptionRate * 10) / 10,
    totalOffers,
    activeOffers,
    totalNotificationsSent,
    totalNotificationsFailed,
    dailyTrends,
  };
}

