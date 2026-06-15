"use client";

import { useRouter } from "next/navigation";
import AppShell from "@/components/AppShell";
import { useAuth } from "@/context/AuthContext";
import { LogOut, Mail, User, Calendar, Shield, Sparkles } from "lucide-react";
import { ProfileSkeleton } from "@/components/Skeleton";
import { format } from "date-fns";

export default function ProfilePage() {
  const { user, logout, loading } = useAuth();
  const router = useRouter();

  const handleLogout = async () => {
    await logout();
    router.push("/login");
  };

  if (loading) {
    return (
      <AppShell>
        <div className="max-w-2xl mx-auto">
          <ProfileSkeleton />
        </div>
      </AppShell>
    );
  }

  const initial = (user?.displayName || user?.email || "U")[0].toUpperCase();

  return (
    <AppShell>
      <div className="max-w-2xl mx-auto">
        <h1 className="text-2xl font-bold text-white mb-6">Профиль</h1>

        <div className="rounded-2xl border border-slate-700/50 bg-slate-900/50 backdrop-blur-sm overflow-hidden">
          {/* Gradient header */}
          <div className="h-24 bg-gradient-to-r from-indigo-600/40 via-purple-600/30 to-indigo-600/40 relative">
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,rgba(99,102,241,0.15),transparent_50%)]" />
          </div>

          <div className="px-6 pb-6">
            {/* Avatar - overlapping the header */}
            <div className="flex items-end -mt-12 mb-5">
              <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-3xl font-bold text-white shadow-lg shadow-indigo-500/20 ring-4 ring-slate-900">
                {initial}
              </div>
              <div className="ml-4 pb-1">
                <h2 className="text-xl font-bold text-white">
                  {user?.displayName || "Без имени"}
                </h2>
                <p className="text-sm text-slate-400">{user?.email}</p>
              </div>
            </div>

            {/* Info cards */}
            <div className="grid gap-3">
              <div className="flex items-center gap-3.5 p-4 rounded-xl bg-slate-800/50 border border-slate-700/30">
                <div className="w-9 h-9 rounded-lg bg-indigo-500/10 flex items-center justify-center">
                  <User className="w-4 h-4 text-indigo-400" />
                </div>
                <div>
                  <p className="text-xs text-slate-500 font-medium">Имя</p>
                  <p className="text-sm text-slate-200">{user?.displayName || "Не указано"}</p>
                </div>
              </div>

              <div className="flex items-center gap-3.5 p-4 rounded-xl bg-slate-800/50 border border-slate-700/30">
                <div className="w-9 h-9 rounded-lg bg-indigo-500/10 flex items-center justify-center">
                  <Mail className="w-4 h-4 text-indigo-400" />
                </div>
                <div>
                  <p className="text-xs text-slate-500 font-medium">Email</p>
                  <p className="text-sm text-slate-200">{user?.email}</p>
                </div>
              </div>

              {user?.metadata?.creationTime && (
                <div className="flex items-center gap-3.5 p-4 rounded-xl bg-slate-800/50 border border-slate-700/30">
                  <div className="w-9 h-9 rounded-lg bg-indigo-500/10 flex items-center justify-center">
                    <Calendar className="w-4 h-4 text-indigo-400" />
                  </div>
                  <div>
                    <p className="text-xs text-slate-500 font-medium">Дата регистрации</p>
                    <p className="text-sm text-slate-200">
                      {format(new Date(user.metadata.creationTime), "d MMMM yyyy")}
                    </p>
                  </div>
                </div>
              )}

              <div className="flex items-center gap-3.5 p-4 rounded-xl bg-slate-800/50 border border-slate-700/30">
                <div className="w-9 h-9 rounded-lg bg-indigo-500/10 flex items-center justify-center">
                  <Shield className="w-4 h-4 text-indigo-400" />
                </div>
                <div>
                  <p className="text-xs text-slate-500 font-medium">UID</p>
                  <p className="text-sm text-slate-200 font-mono text-xs">{user?.uid}</p>
                </div>
              </div>
            </div>

            {/* Logout */}
            <div className="mt-6 pt-4 border-t border-slate-700/30">
              <button
                onClick={handleLogout}
                className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium text-red-400 hover:bg-red-400/10 transition w-full"
              >
                <LogOut className="w-4 h-4" />
                Выйти из аккаунта
              </button>
            </div>
          </div>
        </div>
      </div>
    </AppShell>
  );
}
