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
  sm: { width: 100, height: 44, imgClass: "h-7 w-auto" },
  md: { width: 130, height: 58, imgClass: "h-9 w-auto" },
  lg: { width: 160, height: 71, imgClass: "h-11 w-auto" },
  xl: { width: 210, height: 93, imgClass: "h-14 w-auto" },
};

export const BrandLogo: React.FC<BrandLogoProps> = ({
  className = "",
  size = "md",
  showTagline = false,
  taglineText = "Local Retail SaaS",
  href,
  priority = false,
}) => {
  const { width, height, imgClass } = SIZE_MAP[size];

  const content = (
    <div className={`inline-flex items-center gap-2.5 ${className}`}>
      <div className="relative flex items-center justify-center">
        <Image
          src="/ugrahak-logo.png"
          alt="U-Grahak Logo"
          width={width}
          height={height}
          priority={priority}
          className={`${imgClass} object-contain select-none transition-transform duration-200 hover:scale-105`}
        />
      </div>
      {showTagline && (
        <span className="hidden sm:inline-block text-[10px] font-semibold text-slate-400 tracking-wide uppercase border-l border-slate-200 pl-2.5 my-auto">
          {taglineText}
        </span>
      )}
    </div>
  );

  if (href) {
    return (
      <Link href={href} className="inline-flex items-center focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 rounded-lg">
        {content}
      </Link>
    );
  }

  return content;
};

export default BrandLogo;

