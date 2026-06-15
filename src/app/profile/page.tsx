"use client";

import { useRouter } from "next/navigation";
import AppShell from "@/components/AppShell";
import { useAuth } from "@/context/AuthContext";
import { LogOut, Mail, User, Calendar } from "lucide-react";
import { format } from "date-fns";

export default function ProfilePage() {
  const { user, logout } = useAuth();
  const router = useRouter();

  const handleLogout = async () => {
    await logout();
    router.push("/login");
  };

  return (
    <AppShell>
      <div className="max-w-2xl mx-auto">
        <h1 className="text-2xl font-bold text-white mb-6">Профиль</h1>

        <div className="rounded-xl border border-white/5 bg-white/[0.02] p-6">
          <div className="flex items-center gap-4 mb-6">
            <div className="w-16 h-16 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-2xl font-bold text-white">
              {(user?.displayName || user?.email || "U")[0].toUpperCase()}
            </div>
            <div>
              <h2 className="text-lg font-semibold text-white">
                {user?.displayName || "Без имени"}
              </h2>
              <p className="text-sm text-gray-400">{user?.email}</p>
            </div>
          </div>

          <div className="space-y-3">
            <div className="flex items-center gap-3 text-sm text-gray-400">
              <User className="w-4 h-4 text-gray-500" />
              <span>{user?.displayName || "Не указано"}</span>
            </div>
            <div className="flex items-center gap-3 text-sm text-gray-400">
              <Mail className="w-4 h-4 text-gray-500" />
              <span>{user?.email}</span>
            </div>
            {user?.metadata?.creationTime && (
              <div className="flex items-center gap-3 text-sm text-gray-400">
                <Calendar className="w-4 h-4 text-gray-500" />
                <span>Присоединился {format(new Date(user.metadata.creationTime), "MMMM d, yyyy")}</span>
              </div>
            )}
          </div>

          <div className="mt-8 pt-6 border-t border-white/10">
            <button
              onClick={handleLogout}
              className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium text-red-400 hover:bg-red-400/10 transition"
            >
              <LogOut className="w-4 h-4" />
              Выйти
            </button>
          </div>
        </div>
      </div>
    </AppShell>
  );
}
