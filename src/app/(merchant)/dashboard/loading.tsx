import React from "react";

export default function DashboardLoading() {
  return (
    <div className="space-y-6 animate-pulse max-w-7xl mx-auto p-4 sm:p-6" aria-busy="true" aria-label="डैशबोर्ड लोड हो रहा है">
      {/* Top Banner / Header Skeleton */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200">
        <div className="space-y-2">
          <div className="h-7 w-48 sm:w-64 bg-slate-200 rounded-xl" />
          <div className="h-4 w-36 sm:w-48 bg-slate-100 rounded-lg" />
        </div>
        <div className="flex gap-2">
          <div className="h-10 w-28 bg-slate-200 rounded-xl" />
          <div className="h-10 w-28 bg-emerald-100 rounded-xl" />
        </div>
      </div>

      {/* Top Stat Cards Skeleton */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-5 space-y-3 shadow-2xs">
            <div className="flex items-center justify-between">
              <div className="h-4 w-20 bg-slate-200 rounded" />
              <div className="h-8 w-8 bg-slate-100 rounded-lg" />
            </div>
            <div className="h-8 w-16 bg-slate-200 rounded-lg" />
            <div className="h-3 w-28 bg-slate-100 rounded" />
          </div>
        ))}
      </div>

      {/* Main Content Skeleton Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white border border-slate-200 rounded-3xl p-6 space-y-4 shadow-2xs">
          <div className="h-6 w-40 bg-slate-200 rounded-lg" />
          <div className="space-y-3 pt-2">
            {[1, 2, 3, 4].map((row) => (
              <div key={row} className="h-14 bg-slate-50 border border-slate-100 rounded-2xl" />
            ))}
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-3xl p-6 space-y-4 shadow-2xs">
          <div className="h-6 w-32 bg-slate-200 rounded-lg" />
          <div className="h-40 bg-slate-100 rounded-2xl" />
          <div className="h-10 w-full bg-slate-200 rounded-xl" />
        </div>
      </div>
    </div>
  );
}

