import React from "react";
import Image from "next/image";
import Link from "next/link";

interface BrandLogoProps {
  className?: string;
  size?: "sm" | "md" | "lg" | "xl";
  showTagline?: boolean;
  taglineText?: string;
  href?: string;
  priority?: boolean;
}

const SIZE_MAP = {
  sm: { width: 99, height: 28, imgClass: "h-5 sm:h-6 w-auto", badgeClass: "px-2 py-0.5 rounded-lg" },
  md: { width: 127, height: 36, imgClass: "h-6 sm:h-7 w-auto", badgeClass: "px-2.5 py-1 rounded-xl" },
  lg: { width: 155, height: 44, imgClass: "h-8 sm:h-9 w-auto", badgeClass: "px-3 py-1.5 rounded-xl" },
  xl: { width: 198, height: 56, imgClass: "h-10 sm:h-12 w-auto", badgeClass: "px-3.5 py-2 rounded-2xl" },
};

export const BrandLogo: React.FC<BrandLogoProps> = ({
  className = "",
  size = "md",
  showTagline = false,
  taglineText = "Local Business. Stronger Customers.",
  href,
  priority = false,
}) => {
  const { width, height, imgClass, badgeClass } = SIZE_MAP[size];

  const content = (
    <div className={`inline-flex items-center gap-2.5 ${className}`}>
      <div className={`relative flex items-center justify-center bg-black border border-slate-900/60 shadow-xs ${badgeClass} select-none transition-transform duration-200 hover:scale-[1.02]`}>
        <Image
          src="/ugrahak-logo.png"
          alt="U-Grahak Logo"
          width={width}
          height={height}
          priority={priority}
          className={`${imgClass} object-contain select-none`}
        />
      </div>
      {showTagline && (
        <span className="hidden sm:inline-block text-[10px] font-semibold text-slate-500 tracking-wide uppercase border-l border-slate-200 pl-2.5 my-auto">
          {taglineText}
        </span>
      )}
    </div>
  );

  if (href) {
    return (
      <Link href={href} className="inline-flex items-center focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 rounded-xl">
        {content}
      </Link>
    );
  }

  return content;
};

export default BrandLogo;

