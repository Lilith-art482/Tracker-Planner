"use client";

import { useRouter } from "next/navigation";
import AppShell from "@/components/AppShell";
import { useAuth } from "@/context/AuthContext";
import { LogOut, Mail, User, Calendar, Shield, Sparkles } from "lucide-react";
import { ProfileSkeleton } from "@/components/Skeleton";
import { format } from "date-fns";

export default function ProfilePage() {
  const { user, logout } = useAuth();
  const router = useRouter();

  const handleLogout = async () => {
    await logout();
    router.push("/login");
  };

  const initial = (user?.displayName || user?.email || "U")[0].toUpperCase();

  return (
    <AppShell>
      <div className="max-w-2xl mx-auto">
        <h1 className="text-2xl font-bold text-white mb-6">Профиль</h1>

        <div className="rounded-2xl border border-slate-700/50 bg-slate-900/50 backdrop-blur-sm overflow-hidden shadow-xl shadow-black/20">
          {/* Gradient header с орбами */}
          <div className="relative h-28 bg-gradient-to-br from-indigo-600 via-purple-600/80 to-pink-600/60 overflow-hidden">
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_left,rgba(255,255,255,0.1),transparent_60%)]" />
            <div className="absolute -top-10 -right-10 w-40 h-40 rounded-full bg-white/5 blur-3xl" />
            <div className="absolute -bottom-10 -left-10 w-40 h-40 rounded-full bg-indigo-400/10 blur-3xl" />
          </div>

          <div className="px-6 pb-6">
            {/* Аватар с обводкой */}
            <div className="flex items-end -mt-14 mb-6">
              <div className="relative">
                <div className="w-24 h-24 rounded-2xl bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 flex items-center justify-center text-4xl font-bold text-white shadow-xl shadow-indigo-500/20 ring-[3px] ring-slate-900 relative z-10">
                  {initial}
                </div>
                <div className="absolute inset-0 w-24 h-24 rounded-2xl bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 blur-xl opacity-40" />
              </div>
              <div className="ml-4 pb-1.5">
                <h2 className="text-xl font-bold text-white">
                  {user?.displayName || "Без имени"}
                </h2>
                <p className="text-sm text-slate-400">{user?.email}</p>
              </div>
            </div>

            {/* Статистика */}
            <div className="grid grid-cols-3 gap-3 mb-5">
              {[
                { label: "Задачи", value: "—", icon: "✓", color: "from-emerald-500 to-teal-600" },
                { label: "Проекты", value: "—", icon: "◆", color: "from-violet-500 to-purple-600" },
                { label: "Заметки", value: "—", icon: "●", color: "from-amber-500 to-orange-600" },
              ].map((s) => (
                <div
                  key={s.label}
                  className="relative rounded-xl bg-slate-800/50 border border-slate-700/30 p-3.5 text-center overflow-hidden group"
                >
                  <div className="absolute inset-0 bg-gradient-to-br from-slate-700/0 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition" />
                  <p className="text-2xl font-bold text-white mb-0.5">{s.value}</p>
                  <p className="text-[10px] text-slate-500 font-medium uppercase tracking-wider">{s.label}</p>
                </div>
              ))}
            </div>

            {/* Инфо-карточки */}
            <div className="space-y-2">
              <div className="flex items-center gap-3.5 p-3.5 rounded-xl bg-slate-800/30 border border-slate-700/20 hover:bg-slate-800/50 transition">
                <div className="w-9 h-9 rounded-lg bg-indigo-500/10 flex items-center justify-center flex-shrink-0">
                  <User className="w-4 h-4 text-indigo-400" />
                </div>
                <div className="min-w-0">
                  <p className="text-[10px] text-slate-500 font-medium uppercase tracking-wider">Имя</p>
                  <p className="text-sm text-slate-200 truncate">{user?.displayName || "Не указано"}</p>
                </div>
              </div>

              <div className="flex items-center gap-3.5 p-3.5 rounded-xl bg-slate-800/30 border border-slate-700/20 hover:bg-slate-800/50 transition">
                <div className="w-9 h-9 rounded-lg bg-indigo-500/10 flex items-center justify-center flex-shrink-0">
                  <Mail className="w-4 h-4 text-indigo-400" />
                </div>
                <div className="min-w-0">
                  <p className="text-[10px] text-slate-500 font-medium uppercase tracking-wider">Email</p>
                  <p className="text-sm text-slate-200 truncate">{user?.email}</p>
                </div>
              </div>

              {user?.metadata?.creationTime && (
                <div className="flex items-center gap-3.5 p-3.5 rounded-xl bg-slate-800/30 border border-slate-700/20 hover:bg-slate-800/50 transition">
                  <div className="w-9 h-9 rounded-lg bg-indigo-500/10 flex items-center justify-center flex-shrink-0">
                    <Calendar className="w-4 h-4 text-indigo-400" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-[10px] text-slate-500 font-medium uppercase tracking-wider">Дата регистрации</p>
                    <p className="text-sm text-slate-200">
                      {format(new Date(user.metadata.creationTime), "d MMMM yyyy")}
                    </p>
                  </div>
                </div>
              )}

              <div className="flex items-center gap-3.5 p-3.5 rounded-xl bg-slate-800/30 border border-slate-700/20 hover:bg-slate-800/50 transition">
                <div className="w-9 h-9 rounded-lg bg-indigo-500/10 flex items-center justify-center flex-shrink-0">
                  <Shield className="w-4 h-4 text-indigo-400" />
                </div>
                <div className="min-w-0">
                  <p className="text-[10px] text-slate-500 font-medium uppercase tracking-wider">UID</p>
                  <p className="text-sm text-slate-200 font-mono text-xs truncate">{user?.uid}</p>
                </div>
              </div>
            </div>

            {/* Выход */}
            <div className="mt-5 pt-4 border-t border-slate-700/30">
              <button
                onClick={handleLogout}
                className="group flex items-center justify-center gap-2 w-full px-4 py-3 rounded-xl text-sm font-medium bg-red-500/5 border border-red-500/10 text-red-400 hover:bg-red-500/10 hover:border-red-500/20 transition"
              >
                <LogOut className="w-4 h-4 transition group-hover:-translate-x-0.5" />
                Выйти из аккаунта
              </button>
            </div>
          </div>
        </div>
      </div>
    </AppShell>
  );
}
