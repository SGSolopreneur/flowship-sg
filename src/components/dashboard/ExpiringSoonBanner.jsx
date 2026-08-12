import React from "react";
import { Link } from "react-router-dom";
import { AlertTriangle, ChevronRight } from "lucide-react";
import { differenceInDays } from "date-fns";
import { cn } from "@/lib/utils";

export default function ExpiringSoonBanner({ inventory, linkTo }) {
  const today = new Date();
  const expiringSoon = inventory
    .filter(i => {
      if (!i.expiry_date) return false;
      const days = differenceInDays(new Date(i.expiry_date), today);
      return days >= 0 && days <= 7;
    })
    .sort((a, b) => new Date(a.expiry_date) - new Date(b.expiry_date));

  if (expiringSoon.length === 0) return null;

  const Wrapper = linkTo ? Link : "div";
  const wrapperProps = linkTo ? { to: linkTo } : {};

  return (
    <Wrapper
      {...wrapperProps}
      className={cn(
        "block bg-gradient-to-r from-amber-50 to-orange-50 rounded-xl border border-amber-300 p-4 shadow-sm",
        linkTo && "hover:border-amber-400 transition-colors cursor-pointer"
      )}
    >
      <div className="flex items-center gap-3">
        <div className="relative w-10 h-10 rounded-lg bg-amber-100 flex items-center justify-center shrink-0">
          <AlertTriangle className="w-5 h-5 text-amber-600" />
          <span className="absolute -top-1 -right-1 flex h-3 w-3">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-3 w-3 bg-amber-500"></span>
          </span>
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-amber-900 flex items-center gap-2 flex-wrap">
            {expiringSoon.length} item{expiringSoon.length === 1 ? "" : "s"} expiring within 7 days
            <span className="text-[10px] font-medium text-amber-700 bg-amber-100 px-1.5 py-0.5 rounded-full">Action needed</span>
          </p>
          <p className="text-xs text-amber-700 mt-0.5 truncate">
            {expiringSoon.slice(0, 3).map(i => i.product_name).join(", ")}
            {expiringSoon.length > 3 && ` · +${expiringSoon.length - 3} more`}
          </p>
        </div>
        {linkTo && <ChevronRight className="w-5 h-5 text-amber-500 shrink-0" />}
      </div>
    </Wrapper>
  );
}