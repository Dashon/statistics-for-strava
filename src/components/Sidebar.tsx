
"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { clsx } from "clsx";
import { 
  LayoutDashboard, 
  List, 
  Map, 
  BookOpen, 
  Calendar, 
  TrendingUp, 
  MapPin, 
  History,
  Trophy,
  Zap
} from "lucide-react";

const navigation = [
  { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { name: "Activities", href: "/dashboard/activities", icon: List },
  { name: "Segments", href: "/dashboard/segments", icon: Map },
  { name: "Run Letters", href: "/dashboard/run-letters", icon: BookOpen },
  { name: "Monthly Stats", href: "/dashboard/monthly-stats", icon: Calendar },
  { name: "Eddington", href: "/dashboard/eddington", icon: TrendingUp },
  { name: "Heatmap", href: "/dashboard/heatmap", icon: MapPin },
  { name: "Challenges", href: "/dashboard/challenges", icon: Trophy },
  { name: "Gear", href: "/dashboard/gear", icon: Zap },
  { name: "Rewind", href: "/dashboard/rewind", icon: History },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <div className="flex flex-col w-64 border-r border-zinc-800 bg-zinc-950 min-h-screen">
      <div className="p-6">
        <h1 className="text-2xl font-bold bg-gradient-to-r from-orange-400 to-red-600 bg-clip-text text-transparent italic">
            QT.run
        </h1>
      </div>
      <nav className="flex-1 px-4 space-y-1">
        {navigation.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.name}
              href={item.href}
              className={clsx(
                "flex items-center gap-3 px-3 py-2.5 text-sm font-medium rounded-lg transition-colors",
                isActive
                  ? "bg-zinc-900 text-white"
                  : "text-zinc-400 hover:text-white hover:bg-zinc-900/50"
              )}
            >
              <item.icon className={clsx("w-5 h-5", isActive ? "text-orange-500" : "text-zinc-500")} />
              {item.name}
            </Link>
          );
        })}
      </nav>
      <div className="p-4 border-t border-zinc-800">
         <div className="text-xs text-zinc-600 uppercase tracking-widest font-bold">QT.run v2.0</div>
      </div>
    </div>
  );
}
