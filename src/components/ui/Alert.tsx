import React from "react";
import { clsx } from "clsx";
import { twMerge } from "tailwind-merge";
import { AlertCircle, CheckCircle, Info, XCircle } from "lucide-react";

interface AlertProps {
  type?: "info" | "success" | "warning" | "error";
  title?: string;
  message: string;
  className?: string;
}

export const Alert: React.FC<AlertProps> = ({
  type = "info",
  title,
  message,
  className,
}) => {
  const styles = {
    info: "bg-blue-50 border-blue-200 text-blue-800",
    success: "bg-emerald-50 border-emerald-200 text-emerald-800",
    warning: "bg-amber-50 border-amber-200 text-amber-800",
    error: "bg-rose-50 border-rose-200 text-rose-800",
  };

  const icons = {
    info: <Info className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />,
    success: <CheckCircle className="w-5 h-5 text-emerald-600 flex-shrink-0 mt-0.5" />,
    warning: <AlertCircle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />,
    error: <XCircle className="w-5 h-5 text-rose-600 flex-shrink-0 mt-0.5" />,
  };

  return (
    <div
      className={twMerge(
        clsx("flex gap-3 p-4 rounded-lg border text-sm", styles[type], className)
      )}
      role="alert"
    >
      {icons[type]}
      <div className="flex-1">
        {title && <h4 className="font-medium">{title}</h4>}
        <p className={title ? "mt-0.5 text-xs opacity-90" : ""}>{message}</p>
      </div>
    </div>
  );
};

