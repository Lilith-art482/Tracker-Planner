"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { cn } from "@/lib/cn";
import {
  CalendarCheck,
  ListChecks,
  FolderKanban,
  StickyNote,
  User,
  LogOut,
  Menu,
  X,
  Award,
  CreditCard,
  Repeat,
} from "lucide-react";
import { useState } from "react";

const navItems = [
  { href: "/plan", label: "План", icon: CalendarCheck, color: "from-indigo-500 to-blue-600" },
  { href: "/tasks", label: "Задачи", icon: ListChecks, color: "from-emerald-500 to-teal-600" },
  { href: "/projects", label: "Проекты", icon: FolderKanban, color: "from-violet-500 to-purple-600" },
  { href: "/challenges", label: "Челенджи", icon: Award, color: "from-rose-500 to-pink-600" },
  { href: "/finance", label: "Финансы", icon: CreditCard, color: "from-emerald-500 to-green-600" },
  { href: "/habits", label: "Привычки", icon: Repeat, color: "from-yellow-500 to-amber-600" },
  { href: "/notes", label: "Заметки", icon: StickyNote, color: "from-amber-500 to-orange-600" },
];

export default function Sidebar() {
  const pathname = usePathname();
  const { user, logout } = useAuth();
  const router = useRouter();
  const [mobileOpen, setMobileOpen] = useState(false);

  const handleLogout = async () => {
    await logout();
    router.push("/login");
  };

  const content = (
    <div className="flex flex-col h-full">
      {/* Logo */}
      <div className="p-5 border-b border-slate-700/50">
        <Link href="/plan" className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-lg shadow-indigo-500/20">
            <CalendarCheck className="w-4 h-4 text-white" />
          </div>
          <span className="text-lg font-bold text-white tracking-tight">FlowPlan</span>
        </Link>
      </div>

      {/* Navigation */}
      <nav className="flex-1 py-3 px-2 space-y-0.5">
        {navItems.map((item) => {
            const active = pathname?.startsWith(item.href) ?? false;
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => setMobileOpen(false)}
              className="group relative flex items-center gap-3 px-3 py-2.5"
            >
              {/* Active indicator */}
              <div
                className={cn(
                  "absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-6 rounded-full transition-all duration-200",
                  active ? "opacity-100 scale-100" : "opacity-0 scale-0 group-hover:opacity-50 group-hover:scale-100",
                  item.color.replace("from-", "bg-").split(" ")[0]
                )}
              />
              {/* Icon */}
              <div
                className={cn(
                  "w-8 h-8 rounded-lg flex items-center justify-center transition-all duration-200",
                  active
                    ? `bg-gradient-to-br ${item.color} shadow-lg shadow-${item.color.split(" ")[0].replace("from-", "")}/20`
                    : "bg-slate-800/50 group-hover:bg-slate-700/50"
                )}
              >
                <item.icon className={cn("w-4 h-4 transition", active ? "text-white" : "text-slate-400 group-hover:text-slate-200")} />
              </div>
              {/* Label */}
              <span
                className={cn(
                  "text-sm font-medium transition",
                  active ? "text-white" : "text-slate-400 group-hover:text-slate-200"
                )}
              >
                {item.label}
              </span>
            </Link>
          );
        })}
      </nav>

      {/* Bottom section */}
      <div className="px-2 py-3 border-t border-slate-700/50 space-y-0.5">
        <Link
          href="/profile"
          onClick={() => setMobileOpen(false)}
          className="group relative flex items-center gap-3 px-3 py-2.5"
        >
          <div
            className={cn(
              "absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-6 rounded-full transition-all duration-200",
              pathname === "/profile" ? "opacity-100 bg-sky-400" : "opacity-0 group-hover:opacity-50"
            )}
          />
          <div
            className={cn(
              "w-8 h-8 rounded-lg flex items-center justify-center transition-all duration-200",
              pathname === "/profile"
                ? "bg-gradient-to-br from-sky-500 to-cyan-600 shadow-lg shadow-sky-500/20"
                : "bg-slate-800/50 group-hover:bg-slate-700/50"
            )}
          >
            <span className="text-xs font-bold text-white">
              {(user?.displayName || user?.email || "U")[0].toUpperCase()}
            </span>
          </div>
          <div className="flex-1 min-w-0">
            <p className={cn("text-sm font-medium truncate transition", pathname === "/profile" ? "text-white" : "text-slate-400 group-hover:text-slate-200")}>
              {user?.displayName || "Профиль"}
            </p>
            <p className="text-[10px] text-slate-500 truncate">{user?.email}</p>
          </div>
        </Link>

        <button
          onClick={handleLogout}
          className="group relative flex items-center gap-3 w-full px-3 py-2.5"
        >
          <div className="w-8 h-8 rounded-lg flex items-center justify-center bg-slate-800/50 group-hover:bg-red-500/10 transition-all duration-200">
            <LogOut className="w-4 h-4 text-slate-400 group-hover:text-red-400 transition" />
          </div>
          <span className="text-sm font-medium text-slate-400 group-hover:text-red-400 transition">Выйти</span>
        </button>
      </div>
    </div>
  );

  return (
    <>
      {/* Mobile toggle */}
      <button
        className="lg:hidden fixed top-4 left-4 z-50 p-2 rounded-xl bg-slate-900 border border-slate-700/50 text-white shadow-lg"
        onClick={() => setMobileOpen(!mobileOpen)}
      >
        {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
      </button>

      {/* Desktop sidebar */}
      <aside className="hidden lg:flex w-64 h-screen bg-slate-950/90 backdrop-blur-2xl border-r border-slate-800/50 flex-shrink-0">
        {content}
      </aside>

      {/* Mobile overlay */}
      {mobileOpen && (
        <div className="lg:hidden fixed inset-0 z-40">
          <div
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={() => setMobileOpen(false)}
          />
          <aside className="relative w-72 h-full bg-slate-950 border-r border-slate-800/50 shadow-2xl">
            {content}
          </aside>
        </div>
      )}
    </>
  );
}
