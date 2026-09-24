import React, { type ReactNode } from "react";
import { ArrowUpRight, ArrowDownRight } from "lucide-react";

interface StatCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  change?: string;
  changeType?: "positive" | "negative" | "neutral";
  icon: React.ComponentType<{ className?: string }>;
  onClick?: () => void;
}

export const StatCard: React.FC<StatCardProps> = ({
  title,
  value,
  subtitle,
  change,
  changeType = "positive",
  icon: Icon,
  onClick,
}) => {
  return (
    <div
      onClick={onClick}
      className={`bg-[#FAF9F6] border border-[#E8E1D5] hover:border-[#8B6D43]/60 rounded-2xl p-5 sm:p-6 transition-all duration-200 shadow-2xs group ${
        onClick ? "cursor-pointer hover:shadow-md hover:-translate-y-0.5" : ""
      }`}
    >
      <div className="flex items-start justify-between">
        <span className="text-[11px] uppercase tracking-[0.16em] font-semibold text-[#8B6D43]">
          {title}
        </span>
        <div className="h-10 w-10 rounded-xl bg-[#F4EFE6] border border-[#D2C2AD]/50 flex items-center justify-center text-[#8B6D43] group-hover:bg-[#8B6D43] group-hover:text-white transition-colors">
          <Icon className="h-5 w-5" />
        </div>
      </div>

      <div className="mt-4">
        <p className="font-serif text-2xl sm:text-3xl font-bold tracking-tight text-[#2D2A26]">
          {value}
        </p>

        {(change || subtitle) && (
          <div className="mt-2 flex items-center gap-2 text-xs">
            {change && (
              <span
                className={`inline-flex items-center gap-0.5 px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                  changeType === "positive"
                    ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                    : changeType === "negative"
                    ? "bg-rose-50 text-rose-700 border border-rose-200"
                    : "bg-[#F4EFE6] text-[#8B6D43] border border-[#D2C2AD]/50"
                }`}
              >
                {changeType === "positive" && <ArrowUpRight className="h-3 w-3" />}
                {changeType === "negative" && <ArrowDownRight className="h-3 w-3" />}
                {change}
              </span>
            )}
            {subtitle && <span className="text-[#2D2A26]/50">{subtitle}</span>}
          </div>
        )}
      </div>
    </div>
  );
};
