import type { Metadata } from "next";
import { BusinessGrowthView } from "@/components/dashboard/BusinessGrowthView";

export const metadata: Metadata = {
  title: "Business Growth - Ugrahak",
  description: "Get more customers and grow your business with Ugrahak growth services.",
};

export default function BusinessGrowthPage() {
  return <BusinessGrowthView />;
}

