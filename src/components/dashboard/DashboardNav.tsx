"use client";

import React, { useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import {
  Store,
  Users,
  Send,
  Settings,
  LogOut,
  ExternalLink,
  Menu,
  X,
  ChevronRight,
  BarChart3,
  Home,
} from "lucide-react";
import type { Merchant } from "@/lib/types/database";

interface DashboardNavProps {
  merchant: Merchant | null;
  userEmail: string;
}

export const DashboardNav: React.FC<DashboardNavProps> = ({ merchant, userEmail }) => {
  const pathname = usePathname();
  const router = useRouter();
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleLogout = async () => {
    setIsLoggingOut(true);
    try {
      const supabase = createClient();
      await supabase.auth.signOut();
      router.push("/login");
      router.refresh();
    } catch {
      setIsLoggingOut(false);
    }
  };

  // Primary navigation items (Strictly 3 main functional sections + Dashboard Home)
  const navItems = [
    {
      href: "/dashboard/customers",
      label: "Customers",
      icon: Users,
      active: pathname.startsWith("/dashboard/customers"),
    },
    {
      href: "/dashboard/offers",
      label: "Send Offer",
      icon: Send,
      active: pathname.startsWith("/dashboard/offers"),
    },
    {
      href: "/dashboard/settings",
      label: "Settings",
      icon: Settings,
      active: pathname === "/dashboard/settings" || pathname === "/dashboard/profile" || pathname === "/dashboard/billing",
    },
  ];

  return (
    <>
      {/* Desktop & Mobile Top Header */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-30 shadow-xs">
        <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-14 sm:h-16">
            {/* Brand Logo & Name */}
            <div className="flex items-center gap-4 sm:gap-8">
              <Link href="/dashboard" className="flex items-center gap-2 group">
                <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-indigo-600 flex items-center justify-center text-white font-bold shadow-xs group-hover:bg-indigo-700 transition-colors">
                  <Store className="w-4 h-4 sm:w-5 sm:h-5" />
                </div>
                <div className="flex flex-col">
                  <span className="font-extrabold text-base sm:text-lg text-slate-900 tracking-tight leading-tight">
                    Ugrahak
                  </span>
                  {merchant?.shop_name && (
                    <span className="text-[10px] text-slate-500 font-medium truncate max-w-[120px] sm:max-w-[180px]">
                      {merchant.shop_name}
                    </span>
                  )}
                </div>
              </Link>

              {/* Desktop Navigation (Customers, Send Offer, Settings) */}
              <nav className="hidden md:flex items-center gap-1.5">
                <Link
                  href="/dashboard"
                  className={`px-3 py-1.5 rounded-xl text-xs sm:text-sm font-semibold transition-colors flex items-center gap-1.5 ${
                    pathname === "/dashboard"
                      ? "bg-slate-100 text-slate-900 font-bold"
                      : "text-slate-600 hover:text-slate-900 hover:bg-slate-50"
                  }`}
                >
                  <Home className="w-4 h-4" />
                  <span>Dashboard</span>
                </Link>

                {navItems.map((item) => {
                  const Icon = item.icon;
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      className={`px-3 py-1.5 rounded-xl text-xs sm:text-sm font-semibold transition-colors flex items-center gap-1.5 ${
                        item.active
                          ? "bg-indigo-50 text-indigo-700 font-bold"
                          : "text-slate-600 hover:text-slate-900 hover:bg-slate-50"
                      }`}
                    >
                      <Icon className="w-4 h-4" />
                      <span>{item.label}</span>
                    </Link>
                  );
                })}
              </nav>
            </div>

            {/* Right Action Menu */}
            <div className="flex items-center gap-2 sm:gap-3">
              {merchant?.slug && (
                <a
                  href={`/shop/${merchant.slug}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 text-xs font-semibold text-indigo-700 bg-indigo-50 border border-indigo-200 rounded-xl hover:bg-indigo-100 transition-colors shadow-2xs"
                  title="Open Customer QR Check-in Page"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Shop QR Page</span>
                </a>
              )}

              {/* Desktop Logout Button */}
              <button
                onClick={handleLogout}
                disabled={isLoggingOut}
                className="hidden md:inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-600 hover:text-rose-600 hover:bg-rose-50 rounded-xl border border-slate-200 transition-colors min-h-[36px]"
                title="Sign Out"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span>{isLoggingOut ? "..." : "Logout"}</span>
              </button>

              {/* Mobile Drawer Button */}
              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="md:hidden p-2 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-xl transition-colors min-h-[40px] min-w-[40px] flex items-center justify-center"
                aria-label="Open Navigation Menu"
              >
                {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Mobile Drawer Overlay */}
      {mobileMenuOpen && (
        <div className="md:hidden fixed inset-0 z-40 bg-slate-900/50 backdrop-blur-xs flex justify-end">
          <div className="bg-white w-4/5 max-w-xs h-full shadow-2xl p-5 flex flex-col justify-between overflow-y-auto">
            <div className="space-y-4">
              {/* Drawer Header */}
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-xl bg-indigo-600 flex items-center justify-center text-white font-bold text-xs">
                    <Store className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="font-bold text-sm text-slate-900 block truncate max-w-[140px]">
                      {merchant?.shop_name || "Ugrahak"}
                    </span>
                    <span className="text-[10px] text-slate-400">Merchant Dashboard</span>
                  </div>
                </div>
                <button
                  onClick={() => setMobileMenuOpen(false)}
                  className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Navigation Links */}
              <nav className="space-y-1.5">
                <Link
                  href="/dashboard"
                  onClick={() => setMobileMenuOpen(false)}
                  className={`flex items-center justify-between px-3.5 py-3 rounded-xl text-xs font-bold transition-colors min-h-[44px] ${
                    pathname === "/dashboard"
                      ? "bg-indigo-50 text-indigo-700"
                      : "text-slate-700 hover:bg-slate-50"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <Home className="w-4 h-4 text-indigo-600" />
                    <span>Dashboard Home</span>
                  </div>
                  <ChevronRight className="w-3.5 h-3.5 text-slate-300" />
                </Link>

                <Link
                  href="/dashboard/customers"
                  onClick={() => setMobileMenuOpen(false)}
                  className={`flex items-center justify-between px-3.5 py-3 rounded-xl text-xs font-bold transition-colors min-h-[44px] ${
                    pathname.startsWith("/dashboard/customers")
                      ? "bg-indigo-50 text-indigo-700"
                      : "text-slate-700 hover:bg-slate-50"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <Users className="w-4 h-4 text-indigo-600" />
                    <span>Customers</span>
                  </div>
                  <ChevronRight className="w-3.5 h-3.5 text-slate-300" />
                </Link>

                <Link
                  href="/dashboard/offers"
                  onClick={() => setMobileMenuOpen(false)}
                  className={`flex items-center justify-between px-3.5 py-3 rounded-xl text-xs font-bold transition-colors min-h-[44px] ${
                    pathname.startsWith("/dashboard/offers")
                      ? "bg-indigo-50 text-indigo-700"
                      : "text-slate-700 hover:bg-slate-50"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <Send className="w-4 h-4 text-indigo-600" />
                    <span>Send Offer</span>
                  </div>
                  <ChevronRight className="w-3.5 h-3.5 text-slate-300" />
                </Link>

                <Link
                  href="/dashboard/analytics"
                  onClick={() => setMobileMenuOpen(false)}
                  className={`flex items-center justify-between px-3.5 py-3 rounded-xl text-xs font-bold transition-colors min-h-[44px] ${
                    pathname === "/dashboard/analytics"
                      ? "bg-indigo-50 text-indigo-700"
                      : "text-slate-700 hover:bg-slate-50"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <BarChart3 className="w-4 h-4 text-indigo-600" />
                    <span>Store Analytics</span>
                  </div>
                  <ChevronRight className="w-3.5 h-3.5 text-slate-300" />
                </Link>

                <Link
                  href="/dashboard/settings"
                  onClick={() => setMobileMenuOpen(false)}
                  className={`flex items-center justify-between px-3.5 py-3 rounded-xl text-xs font-bold transition-colors min-h-[44px] ${
                    pathname === "/dashboard/settings" || pathname === "/dashboard/profile" || pathname === "/dashboard/billing"
                      ? "bg-indigo-50 text-indigo-700"
                      : "text-slate-700 hover:bg-slate-50"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <Settings className="w-4 h-4 text-indigo-600" />
                    <span>Settings</span>
                  </div>
                  <ChevronRight className="w-3.5 h-3.5 text-slate-300" />
                </Link>
              </nav>

              {/* Shop Page link */}
              {merchant?.slug && (
                <div className="pt-2">
                  <a
                    href={`/shop/${merchant.slug}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-between px-3.5 py-3 bg-indigo-50 text-indigo-700 rounded-xl text-xs font-bold min-h-[44px]"
                  >
                    <div className="flex items-center gap-2.5">
                      <ExternalLink className="w-4 h-4 text-indigo-600" />
                      <span>Open Shop QR Page</span>
                    </div>
                    <ChevronRight className="w-3.5 h-3.5 text-indigo-300" />
                  </a>
                </div>
              )}
            </div>

            {/* Drawer Footer */}
            <div className="pt-4 border-t border-slate-100 space-y-3">
              <div className="text-xs">
                <p className="font-semibold text-slate-900 truncate">
                  {merchant?.shop_name || "Merchant Store"}
                </p>
                <p className="text-slate-400 text-[11px] truncate">{userEmail}</p>
              </div>

              <button
                onClick={handleLogout}
                disabled={isLoggingOut}
                className="w-full flex items-center justify-center gap-2 py-3 px-3 rounded-xl bg-rose-50 text-rose-700 font-bold text-xs border border-rose-200 hover:bg-rose-100 transition-colors min-h-[44px]"
              >
                <LogOut className="w-4 h-4" />
                <span>{isLoggingOut ? "Signing out..." : "Sign Out"}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Mobile Bottom Navigation Bar (ONLY 3 primary options: Customers, Send Offer, Settings) */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-30 bg-white/95 backdrop-blur-md border-t border-slate-200 px-3 py-1 flex items-center justify-around shadow-lg safe-area-bottom">
        <Link
          href="/dashboard/customers"
          className={`flex-1 flex flex-col items-center justify-center py-1.5 px-2 rounded-xl transition-colors min-h-[48px] ${
            pathname.startsWith("/dashboard/customers")
              ? "text-indigo-600 font-extrabold"
              : "text-slate-500 hover:text-slate-800 font-medium"
          }`}
        >
          <Users className={`w-5 h-5 ${pathname.startsWith("/dashboard/customers") ? "text-indigo-600 scale-110" : "text-slate-400"} transition-transform`} />
          <span className="text-[11px] mt-0.5">Customers</span>
        </Link>

        <Link
          href="/dashboard/offers"
          className={`flex-1 flex flex-col items-center justify-center py-1.5 px-2 rounded-xl transition-colors min-h-[48px] ${
            pathname.startsWith("/dashboard/offers")
              ? "text-indigo-600 font-extrabold"
              : "text-slate-500 hover:text-slate-800 font-medium"
          }`}
        >
          <div className="relative">
            <Send className={`w-5 h-5 ${pathname.startsWith("/dashboard/offers") ? "text-indigo-600 scale-110" : "text-slate-400"} transition-transform`} />
          </div>
          <span className="text-[11px] mt-0.5">Send Offer</span>
        </Link>

        <Link
          href="/dashboard/settings"
          className={`flex-1 flex flex-col items-center justify-center py-1.5 px-2 rounded-xl transition-colors min-h-[48px] ${
            pathname === "/dashboard/settings" || pathname === "/dashboard/profile" || pathname === "/dashboard/billing"
              ? "text-indigo-600 font-extrabold"
              : "text-slate-500 hover:text-slate-800 font-medium"
          }`}
        >
          <Settings className={`w-5 h-5 ${pathname === "/dashboard/settings" || pathname === "/dashboard/profile" || pathname === "/dashboard/billing" ? "text-indigo-600 scale-110" : "text-slate-400"} transition-transform`} />
          <span className="text-[11px] mt-0.5">Settings</span>
        </Link>
      </nav>
    </>
  );
};
