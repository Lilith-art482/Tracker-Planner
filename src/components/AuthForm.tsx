"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";
import { cn } from "@/lib/cn";
import { Mail, Lock, User, Eye, EyeOff, Sparkles } from "lucide-react";

interface AuthFormProps {
  mode: "login" | "register";
}

export default function AuthForm({ mode }: AuthFormProps) {
  const { login, register } = useAuth();
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => { setMounted(true); }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSubmitting(true);
    try {
      if (mode === "login") {
        await login(email, password);
      } else {
        await register(email, password, name);
      }
      router.push("/plan");
    } catch (err: any) {
      const errorMap: Record<string, string> = {
        "auth/user-not-found": "Пользователь не найден",
        "auth/wrong-password": "Неверный пароль",
        "auth/email-already-in-use": "Этот email уже зарегистрирован",
        "auth/weak-password": "Пароль должен быть минимум 6 символов",
        "auth/invalid-credential": "Неверный email или пароль",
        "auth/too-many-requests": "Слишком много попыток. Попробуйте позже",
      };
      const msg = err.code ? errorMap[err.code] : undefined;
      setError(msg || err.message || "Что-то пошло не так");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="relative min-h-screen flex items-center justify-center overflow-hidden bg-slate-950">
      {/* Animated gradient orbs */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-96 h-96 rounded-full bg-indigo-600/20 blur-[120px] animate-pulse" />
        <div className="absolute -bottom-40 -left-40 w-96 h-96 rounded-full bg-purple-600/20 blur-[120px] animate-pulse [animation-delay:2s]" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full bg-indigo-500/5 blur-[100px]" />
      </div>

      {/* Floating particles */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {Array.from({ length: 6 }).map((_, i) => (
          <div
            key={i}
            className="absolute w-1 h-1 rounded-full bg-indigo-400/30"
            style={{
              top: `${15 + i * 15}%`,
              left: `${10 + i * 14}%`,
              animation: `float ${3 + i * 0.5}s ease-in-out infinite alternate`,
              animationDelay: `${i * 0.7}s`,
            }}
          />
        ))}
      </div>

      <style>{`
        @keyframes float {
          from { transform: translateY(0) translateX(0); opacity: 0.3; }
          to { transform: translateY(-30px) translateX(10px); opacity: 0.8; }
        }
        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>

      <div
        className={cn(
          "relative w-full max-w-md p-8 rounded-2xl",
          "bg-slate-900/70 backdrop-blur-2xl border border-slate-700/50 shadow-2xl shadow-indigo-500/5",
          mounted && "animate-[fadeUp_0.6s_ease-out]"
        )}
      >
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 mb-4 shadow-lg shadow-indigo-500/25">
            <Sparkles className="w-7 h-7 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-white mb-1">FlowPlan</h1>
          <p className="text-slate-400 text-sm">
            {mode === "login" ? "С возвращением!" : "Создайте аккаунт"}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {mode === "register" && (
            <div className="group">
              <label className="block text-xs font-medium text-slate-400 mb-1.5">Имя</label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 group-focus-within:text-indigo-400 transition" />
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-800/50 border border-slate-700/60 text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500/50 focus:ring-1 focus:ring-indigo-500/30 transition text-sm"
                  placeholder="Ваше имя"
                />
              </div>
            </div>
          )}

          <div className="group">
            <label className="block text-xs font-medium text-slate-400 mb-1.5">Электронная почта</label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 group-focus-within:text-indigo-400 transition" />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-800/50 border border-slate-700/60 text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500/50 focus:ring-1 focus:ring-indigo-500/30 transition text-sm"
                placeholder="you@example.com"
              />
            </div>
          </div>

          <div className="group">
            <label className="block text-xs font-medium text-slate-400 mb-1.5">Пароль</label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 group-focus-within:text-indigo-400 transition" />
              <input
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={6}
                className="w-full pl-10 pr-10 py-2.5 rounded-xl bg-slate-800/50 border border-slate-700/60 text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500/50 focus:ring-1 focus:ring-indigo-500/30 transition text-sm"
                placeholder="••••••••"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 transition"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {error && (
            <div className="flex items-start gap-2 p-3 rounded-xl bg-red-500/10 border border-red-500/20">
              <span className="text-red-400 text-xs leading-5">{error}</span>
            </div>
          )}

          <button
            type="submit"
            disabled={submitting}
            className={cn(
              "relative w-full py-2.5 rounded-xl font-semibold text-white text-sm overflow-hidden transition",
              "bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500",
              "disabled:opacity-50 disabled:cursor-not-allowed",
              "shadow-lg shadow-indigo-600/20 hover:shadow-indigo-600/30"
            )}
          >
            {submitting ? (
              <span className="flex items-center justify-center gap-2">
                <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Подождите...
              </span>
            ) : (
              mode === "login" ? "Войти" : "Создать аккаунт"
            )}
          </button>
        </form>

        <p className="mt-6 text-center text-xs text-slate-500">
          {mode === "login" ? (
            <>
              Нет аккаунта?{" "}
              <Link href="/register" className="text-indigo-400 font-medium hover:text-indigo-300 transition">
                Зарегистрироваться
              </Link>
            </>
          ) : (
            <>
              Уже есть аккаунт?{" "}
              <Link href="/login" className="text-indigo-400 font-medium hover:text-indigo-300 transition">
                Войти
              </Link>
            </>
          )}
        </p>
      </div>
    </div>
  );
}
