import { ReactNode } from "react";
import { cn } from "@/lib/utils";

interface DashboardCardProps {
  title: string;
  value: string | number;
  unit?: string;
  className?: string;
  children?: ReactNode;
}

export default function DashboardCard({ title, value, unit, className, children }: DashboardCardProps) {
  return (
    <div className={cn("bg-orange-600 p-4 flex flex-col justify-between min-h-[100px]", className)}>
      <div className="flex justify-between items-start">
        <span className="text-white text-lg font-medium">{title}</span>
      </div>
      <div className="flex items-baseline gap-2">
        <span className="text-5xl font-bold text-white tracking-tight">{value}</span>
        {unit && <span className="text-lg font-medium text-white/80">{unit}</span>}
      </div>
      {children}
    </div>
  );
}
