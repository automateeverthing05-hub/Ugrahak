"use client";

import React from "react";
import {
  Globe,
  Megaphone,
  Share2,
  Search,
  Store,
  Check,
  TrendingUp,
  MessageCircle,
  Clock,
  Info,
  Sparkles,
  ArrowUpRight,
} from "lucide-react";
import {
  BUSINESS_GROWTH_SERVICES,
  getWhatsAppUrl,
  type GrowthService,
} from "@/lib/constants/growth-services";

const iconMap = {
  Globe,
  Megaphone,
  Share2,
  Search,
  Store,
};

export const BusinessGrowthView: React.FC = () => {
  return (
    <div className="space-y-6 sm:space-y-8">
      {/* Page Header */}
      <div className="bg-gradient-to-r from-indigo-900 via-indigo-800 to-slate-900 rounded-3xl p-6 sm:p-8 text-white shadow-md relative overflow-hidden">
        <div className="absolute top-0 right-0 -mt-10 -mr-10 w-48 h-48 sm:w-64 sm:h-64 rounded-full bg-indigo-500/10 blur-2xl pointer-events-none" />
        <div className="relative z-10 max-w-3xl space-y-3">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-indigo-500/20 text-indigo-200 border border-indigo-400/30 text-xs font-semibold">
            <Sparkles className="w-3.5 h-3.5 text-amber-300" />
            Grow Your Business
          </span>
          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold tracking-tight text-white">
            Business Growth
          </h1>
          <p className="text-sm sm:text-base text-indigo-100/90 leading-relaxed">
            Get more customers and grow your business with Ugrahak growth services.
          </p>
        </div>
      </div>

      {/* Services Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 sm:gap-6">
        {BUSINESS_GROWTH_SERVICES.map((service: GrowthService) => {
          const IconComponent = iconMap[service.iconName] || TrendingUp;
          const whatsappUrl = getWhatsAppUrl(service.whatsappMessage);

          return (
            <div
              key={service.id}
              className="bg-white rounded-3xl border border-slate-200 p-6 shadow-xs hover:shadow-md transition-shadow flex flex-col justify-between"
            >
              <div className="space-y-4">
                {/* Header: Icon & Price */}
                <div className="flex items-start justify-between gap-3">
                  <div className="w-12 h-12 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center shadow-xs flex-shrink-0">
                    <IconComponent className="w-6 h-6" />
                  </div>
                  <div className="text-right">
                    <span className="inline-block px-2.5 py-1 rounded-xl bg-emerald-50 text-emerald-800 font-bold text-xs sm:text-sm border border-emerald-200">
                      {service.startingPrice}
                    </span>
                  </div>
                </div>

                {/* Service Name & Description */}
                <div>
                  <h3 className="text-lg font-bold text-slate-900 tracking-tight">
                    {service.name}
                  </h3>
                  <p className="text-xs sm:text-sm text-slate-500 mt-1 leading-relaxed">
                    {service.description}
                  </p>
                </div>

                {/* Special Notes & Delivery Times */}
                {(service.delivery || service.note) && (
                  <div className="space-y-1.5 pt-1">
                    {service.delivery && (
                      <div className="flex items-center gap-1.5 text-xs text-slate-600 font-medium bg-slate-50 px-2.5 py-1.5 rounded-xl border border-slate-200">
                        <Clock className="w-3.5 h-3.5 text-indigo-600 flex-shrink-0" />
                        <span>{service.delivery}</span>
                      </div>
                    )}
                    {service.note && (
                      <div className="flex items-center gap-1.5 text-xs text-amber-800 font-medium bg-amber-50 px-2.5 py-1.5 rounded-xl border border-amber-200">
                        <Info className="w-3.5 h-3.5 text-amber-600 flex-shrink-0" />
                        <span>{service.note}</span>
                      </div>
                    )}
                  </div>
                )}

                {/* What is Included List */}
                <div className="pt-2 border-t border-slate-100">
                  <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2.5">
                    What is included:
                  </p>
                  <ul className="space-y-2">
                    {service.included.map((item, index) => (
                      <li
                        key={index}
                        className="flex items-start gap-2 text-xs text-slate-700"
                      >
                        <div className="w-4 h-4 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center flex-shrink-0 mt-0.5">
                          <Check className="w-2.5 h-2.5 stroke-[3]" />
                        </div>
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              {/* Action Button */}
              <div className="pt-5 mt-4 border-t border-slate-100">
                <a
                  href={whatsappUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full inline-flex items-center justify-center gap-2 py-3 px-4 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs sm:text-sm transition-all shadow-sm hover:shadow-md min-h-[46px] group"
                >
                  <MessageCircle className="w-4 h-4 text-emerald-100" />
                  <span>{service.ctaText}</span>
                  <ArrowUpRight className="w-3.5 h-3.5 opacity-70 group-hover:opacity-100 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
                </a>
              </div>
            </div>
          );
        })}
      </div>

      {/* Service Terms / Note */}
      <div className="p-4 sm:p-5 rounded-2xl bg-slate-100 border border-slate-200 text-center text-xs text-slate-500">
        <p>
          Final pricing and delivery time may vary depending on your business requirements.
        </p>
      </div>
    </div>
  );
};

