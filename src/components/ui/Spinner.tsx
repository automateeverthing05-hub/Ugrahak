import React from "react";
import { clsx } from "clsx";
import { twMerge } from "tailwind-merge";

interface SpinnerProps {
  size?: "sm" | "md" | "lg";
  className?: string;
}

export const Spinner: React.FC<SpinnerProps> = ({ size = "md", className }) => {
  const sizes = {
    sm: "w-4 h-4 border-2",
    md: "w-8 h-8 border-3",
    lg: "w-12 h-12 border-4",
  };

  return (
    <div
      className={twMerge(
        clsx(
          "animate-spin rounded-full border-slate-200 border-t-indigo-600",
          sizes[size],
          className
        )
      )}
      role="status"
    >
      <span className="sr-only">Loading...</span>
    </div>
  );
};

