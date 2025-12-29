'use client';

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { clsx } from "clsx";
import { useState } from "react";
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
  Zap,
  Settings,
  Menu,
  X,
  User,
  LogOut
} from "lucide-react";
import { signOut } from "next-auth/react";

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
  { name: "Settings", href: "/dashboard/settings", icon: Settings },
];

interface SidebarProps {
  profile?: {
    displayName: string;
    profilePicture: string | null;
  } | null;
}

export function Sidebar({ profile }: SidebarProps) {
  const pathname = usePathname();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const displayName = profile?.displayName || 'Athlete';
  const profilePicture = profile?.profilePicture;

  return (
    <>
      {/* Mobile menu button */}
      <button
        onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
        className="lg:hidden fixed top-4 left-4 z-50 p-2 bg-zinc-900 rounded-lg text-white"
      >
        {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
      </button>

      {/* Mobile overlay */}
      {mobileMenuOpen && (
        <div
          className="lg:hidden fixed inset-0 bg-black/50 z-40"
          onClick={() => setMobileMenuOpen(false)}
        />
      )}

      {/* Sidebar */}
      <div className={clsx(
        "flex flex-col w-64 border-r border-zinc-800 bg-zinc-950 min-h-screen",
        "fixed lg:static inset-y-0 left-0 z-40 transition-transform duration-300",
        mobileMenuOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
      )}>
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

      {/* User Profile Section */}
      <div className="p-4 border-t border-zinc-800">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-10 h-10 rounded-full overflow-hidden bg-zinc-800 flex items-center justify-center border border-zinc-700 flex-shrink-0">
            {profilePicture ? (
              <Image
                src={profilePicture}
                alt={displayName}
                width={40}
                height={40}
                className="object-cover"
              />
            ) : (
              <User className="w-5 h-5 text-zinc-500" />
            )}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-white truncate">{displayName}</p>
            <p className="text-xs text-zinc-500">Connected to Strava</p>
          </div>
        </div>
        <button
          onClick={() => signOut({ callbackUrl: '/' })}
          className="w-full flex items-center gap-2 px-3 py-2 text-sm text-zinc-400 hover:text-white hover:bg-zinc-900/50 rounded-lg transition-colors"
        >
          <LogOut className="w-4 h-4" />
          Sign Out
        </button>
      </div>

      <div className="px-4 pb-4">
         <div className="text-xs text-zinc-600 uppercase tracking-widest font-bold">QT.run v2.0</div>
      </div>
    </div>
    </>
  );
}
