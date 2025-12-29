'use client';

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { clsx } from "clsx";
import { useState, useRef, useEffect } from "react";
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
  LogOut,
  ChevronRight
} from "lucide-react";
import { signOut } from "next-auth/react";

const navigation = [
  { 
    group: "Main",
    items: [
      { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
      { name: "Activities", href: "/dashboard/activities", icon: List },
      { name: "Heatmap", href: "/dashboard/heatmap", icon: MapPin },
    ]
  },
  {
    group: "Analysis",
    items: [
      { name: "Run Letters", href: "/dashboard/run-letters", icon: BookOpen },
      { name: "Monthly Stats", href: "/dashboard/monthly-stats", icon: Calendar },
      { name: "Eddington", href: "/dashboard/eddington", icon: TrendingUp },
      { name: "Rewind", href: "/dashboard/rewind", icon: History },
    ]
  },
  {
    group: "Achievements & Gear",
    items: [
      { name: "Segments", href: "/dashboard/segments", icon: Map },
      { name: "Challenges", href: "/dashboard/challenges", icon: Trophy },
      { name: "Gear", href: "/dashboard/gear", icon: Zap },
    ]
  },
  {
    group: "System",
    items: [
      { name: "Settings", href: "/dashboard/settings", icon: Settings },
    ]
  }
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

  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);
  const profileMenuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (profileMenuRef.current && !profileMenuRef.current.contains(event.target as Node)) {
        setIsProfileMenuOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const NavItem = ({ item }: { item: typeof navigation[0]['items'][0] }) => {
    const isActive = pathname === item.href || pathname?.startsWith(item.href + '/');
    return (
      <Link
        key={item.name}
        href={item.href}
        onClick={() => setMobileMenuOpen(false)}
        className={clsx(
          "group flex items-center justify-between px-3 py-2 text-sm font-medium rounded-xl transition-all duration-200",
          isActive
            ? "bg-orange-500/10 text-orange-500"
            : "text-zinc-400 hover:text-white hover:bg-zinc-900"
        )}
      >
        <div className="flex items-center gap-3">
          <item.icon className={clsx("w-5 h-5 transition-colors", isActive ? "text-orange-500" : "text-zinc-500 group-hover:text-zinc-300")} />
          {item.name}
        </div>
        {isActive && <ChevronRight className="w-4 h-4" />}
      </Link>
    );
  };

  return (
    <>
      {/* Mobile Top Header */}
      <div className="lg:hidden fixed top-0 inset-x-0 h-16 bg-zinc-950/80 backdrop-blur-md border-b border-zinc-900 z-50 flex items-center justify-between px-4">
        <h1 className="text-xl font-bold bg-gradient-to-r from-orange-400 to-red-600 bg-clip-text text-transparent italic">
          QT.run
        </h1>
        <button
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="p-2 text-zinc-400 hover:text-white hover:bg-zinc-900 rounded-lg transition-colors"
        >
          {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      </div>

      {/* Mobile overlay */}
      {mobileMenuOpen && (
        <div
          className="lg:hidden fixed inset-0 bg-black/60 backdrop-blur-sm z-40"
          onClick={() => setMobileMenuOpen(false)}
        />
      )}

      {/* Sidebar Container */}
      <aside className={clsx(
        "flex flex-col w-72 border-r border-zinc-900 bg-zinc-950 h-screen fixed inset-y-0 left-0 z-40 transition-transform duration-300 ease-in-out lg:translate-x-0",
        mobileMenuOpen ? "translate-x-0" : "-translate-x-full"
      )}>
        {/* Logo Section */}
        <div className="p-6 h-16 flex items-center">
          <Link href="/dashboard" className="flex items-center gap-2">
            <h1 className="text-2xl font-bold bg-gradient-to-r from-orange-400 to-red-600 bg-clip-text text-transparent italic">
                QT.run
            </h1>
          </Link>
        </div>

        {/* Navigation Section */}
        <div className="flex-1 px-4 py-4 overflow-y-auto custom-scrollbar space-y-8">
          {navigation.map((group) => (
            <div key={group.group} className="space-y-1">
              <h3 className="px-3 text-[10px] font-bold uppercase tracking-widest text-zinc-500 mb-2">
                {group.group}
              </h3>
              <div className="space-y-1">
                {group.items.map((item) => (
                  <NavItem key={item.name} item={item} />
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* User Profile Footer Section */}
        <div 
          ref={profileMenuRef}
          className="p-4 bg-zinc-950/50 backdrop-blur-md border-t border-zinc-900 relative"
        >
          {/* Profile Menu Popover */}
          {isProfileMenuOpen && (
            <div className="absolute bottom-full left-4 right-4 mb-2 bg-zinc-900 border border-zinc-800 rounded-2xl shadow-2xl overflow-hidden animate-in slide-in-from-bottom-2 duration-200">
              <div className="p-1.5 space-y-0.5">
                <Link 
                  href="/dashboard/settings"
                  onClick={() => {
                    setMobileMenuOpen(false);
                    setIsProfileMenuOpen(false);
                  }}
                  className="flex items-center gap-3 px-3 py-2 text-sm font-medium text-zinc-400 hover:text-white hover:bg-zinc-800 rounded-xl transition-all"
                >
                  <Settings className="w-4 h-4" />
                  Settings
                </Link>
                <button
                  onClick={() => signOut({ callbackUrl: '/' })}
                  className="w-full flex items-center gap-3 px-3 py-2 text-sm font-medium text-zinc-400 hover:text-red-400 hover:bg-red-500/10 rounded-xl transition-all"
                >
                  <LogOut className="w-4 h-4" />
                  Sign Out
                </button>
              </div>
            </div>
          )}

          <button 
            onClick={() => setIsProfileMenuOpen(!isProfileMenuOpen)}
            className={clsx(
              "w-full flex items-center gap-3 p-2 rounded-2xl transition-all duration-200 border",
              isProfileMenuOpen 
                ? "bg-zinc-900 border-zinc-700" 
                : "bg-zinc-900/50 border-zinc-800/50 hover:border-zinc-700"
            )}
          >
            <div className="w-10 h-10 rounded-xl overflow-hidden bg-zinc-800 flex items-center justify-center border border-zinc-700/50 flex-shrink-0">
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
            <div className="flex-1 min-w-0 text-left">
              <p className="text-sm font-semibold text-white truncate leading-none mb-1">{displayName}</p>
              <p className="text-[10px] text-zinc-500 font-medium flex items-center gap-1">
                Strava Connected
              </p>
            </div>
            <div className={clsx("transition-transform duration-200", isProfileMenuOpen ? "rotate-180" : "")}>
              <ChevronRight className="w-4 h-4 text-zinc-500 -rotate-90" />
            </div>
          </button>
          
          <div className="mt-4 flex items-center justify-between px-2">
            <span className="text-[10px] font-bold text-zinc-700 tracking-tighter uppercase">QT.run v2.0.4</span>
            <div className="flex gap-1.5">
              <div className="w-1 h-1 rounded-full bg-zinc-800" />
              <div className="w-1 h-1 rounded-full bg-zinc-800" />
              <div className="w-1 h-1 rounded-full bg-zinc-800" />
            </div>
          </div>
        </div>
      </aside>
    </>
  );
}
