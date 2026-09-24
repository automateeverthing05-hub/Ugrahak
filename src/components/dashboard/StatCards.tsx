import React from "react";
import { Users, RotateCcw, Tag, TrendingUp } from "lucide-react";

interface StatCardsProps {
  totalCustomers?: number;
  repeatCustomers?: number;
  activeOffers?: number;
  thisMonthVisits?: number;
}

export const StatCards: React.FC<StatCardsProps> = ({
  totalCustomers = 0,
  repeatCustomers = 0,
  activeOffers = 0,
  thisMonthVisits = 0,
}) => {
  const stats = [
    {
      label: "Total Customers",
      value: totalCustomers.toLocaleString(),
      icon: Users,
      description: "Enrolled in store",
      color: "text-blue-600 bg-blue-50",
    },
    {
      label: "Repeat Customers",
      value: repeatCustomers.toLocaleString(),
      icon: RotateCcw,
      description: "Visited > 1 time",
      color: "text-emerald-600 bg-emerald-50",
    },
    {
      label: "Active Offers",
      value: activeOffers.toLocaleString(),
      icon: Tag,
      description: "Ready to broadcast",
      color: "text-indigo-600 bg-indigo-50",
    },
    {
      label: "This Month",
      value: thisMonthVisits.toLocaleString(),
      icon: TrendingUp,
      description: "Store QR visits",
      color: "text-amber-600 bg-amber-50",
    },
  ];

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
      {stats.map((stat, i) => {
        const Icon = stat.icon;
        return (
          <div
            key={i}
            className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-5 shadow-xs flex flex-col justify-between hover:border-slate-300 transition-colors"
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-500 truncate">
                {stat.label}
              </span>
              <div className={`p-2 rounded-xl ${stat.color} flex-shrink-0`}>
                <Icon className="w-4 h-4" />
              </div>
            </div>
            <div className="mt-2">
              <h3 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
                {stat.value}
              </h3>
              <p className="text-[11px] text-slate-400 mt-0.5 truncate">{stat.description}</p>
            </div>
          </div>
        );
      })}
    </div>
  );
};
