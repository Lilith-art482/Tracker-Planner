"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import AppShell from "@/components/AppShell";
import { useAuth } from "@/context/AuthContext";
import { cn } from "@/lib/cn";

type Challenge = {
  id: string;
  title: string;
  days: number;
  progress: boolean[]; // index 0..days-1
};

function CircularTracker({ challenge, onToggle }: { challenge: Challenge; onToggle: (idx: number) => void }) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [size, setSize] = useState(0);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const resize = () => setSize(el.clientWidth);
    resize();
    const ro = new ResizeObserver(resize);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const center = size / 2;
  const radius = Math.max(40, center - 40);
  const dotSize = 30;

  return (
    <div className="w-full flex justify-center">
      <div ref={containerRef} className="relative" style={{ width: 360, height: 360 }}>
        {/* Center icon */}
        <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 text-gray-300">
          <div className="w-28 h-28 rounded-full border border-white/10 flex items-center justify-center bg-slate-900/30">
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} className="text-white/80">
              <path d="M11.5 3C11.5 3 10 4 8.5 4C7 4 5.5 3 5.5 3C5.5 5 6 6.5 8.5 8C11 9.5 12 9 12 9C12 9 11.5 6 11.5 3Z" />
              <path d="M12 9C9.5 9 7 11 7 14C7 17 9 20 12 20C15 20 17 17 17 14C17 11 14.5 9 12 9Z" />
            </svg>
          </div>
        </div>

        {challenge.progress.map((done, i) => {
          const angle = (i / challenge.days) * Math.PI * 2 - Math.PI / 2; // start at top
          const x = center + radius * Math.cos(angle) - dotSize / 2;
          const y = center + radius * Math.sin(angle) - dotSize / 2;
          return (
            <button
              key={i}
              onClick={() => onToggle(i)}
              title={`День ${i + 1}`}
              className={cn(
                "absolute flex items-center justify-center rounded-full text-[11px] font-medium border transition",
                done ? "bg-indigo-600 text-white border-indigo-500" : "bg-slate-800/60 text-gray-300 border-white/10 hover:bg-white/5"
              )}
              style={{ left: x, top: y, width: dotSize, height: dotSize }}
            >
              {i + 1}
            </button>
          );
        })}
      </div>
    </div>
  );
}

export default function ChallengesPage() {
  const { user } = useAuth();
  const uid = user?.uid;
  const [challenges, setChallenges] = useState<Challenge[]>([]);
  const [title, setTitle] = useState("");
  const [days, setDays] = useState<number>(30);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const storageKey = useMemo(() => (uid ? `challenges_${uid}` : null), [uid]);

  useEffect(() => {
    if (!storageKey) return;
    try {
      const raw = localStorage.getItem(storageKey);
      if (raw) setChallenges(JSON.parse(raw));
    } catch (e) {
      console.warn("Failed to load challenges", e);
    }
  }, [storageKey]);

  useEffect(() => {
    if (!storageKey) return;
    try {
      localStorage.setItem(storageKey, JSON.stringify(challenges));
    } catch (e) {
      console.warn("Failed to save challenges", e);
    }
  }, [storageKey, challenges]);

  const addChallenge = () => {
    if (!title.trim() || days <= 0) return;
    const id = `c_${Date.now()}`;
    const ch: Challenge = { id, title: title.trim(), days, progress: Array.from({ length: days }).map(() => false) };
    setChallenges((s) => [ch, ...s]);
    setTitle("");
    setDays(30);
    setSelectedId(id);
  };

  const removeChallenge = (id: string) => {
    setChallenges((s) => s.filter((c) => c.id !== id));
    if (selectedId === id) setSelectedId(null);
  };

  const selected = challenges.find((c) => c.id === selectedId) ?? challenges[0] ?? null;

  const toggleDay = (idx: number) => {
    if (!selected) return;
    setChallenges((list) => list.map((c) => {
      if (c.id !== selected.id) return c;
      const p = [...c.progress];
      p[idx] = !p[idx];
      return { ...c, progress: p };
    }));
  };

  return (
    <AppShell>
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold text-white">Челенджи</h1>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="col-span-1">
            <div className="rounded-xl border border-white/10 bg-slate-800 p-4 space-y-4">
              <h2 className="text-sm font-semibold text-white">Добавить челендж</h2>
              <input
                placeholder="Название челенджа"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-white text-sm"
              />
              <div className="flex gap-2">
                <input
                  type="number"
                  min={1}
                  max={365}
                  value={days}
                  onChange={(e) => setDays(Number(e.target.value))}
                  className="w-24 px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-white text-sm"
                />
                <button onClick={addChallenge} className="px-3 py-2 rounded-lg bg-indigo-600 text-white">Добавить</button>
              </div>
            </div>

            <div className="mt-4 rounded-xl border border-white/10 bg-slate-800 p-3">
              <h3 className="text-sm font-semibold text-white mb-2">Мои челенджи</h3>
              {challenges.length === 0 && <p className="text-sm text-gray-400">Пока нет челенджей</p>}
              <ul className="space-y-2">
                {challenges.map((c) => (
                  <li key={c.id} className="flex items-center justify-between gap-2">
                    <button onClick={() => setSelectedId(c.id)} className={cn("text-left flex-1 text-sm px-2 py-1 rounded hover:bg-white/5", selectedId === c.id ? "bg-indigo-500/10 text-white" : "text-gray-300")}>{c.title} <span className="text-xs text-gray-400">· {c.days} дн.</span></button>
                    <button onClick={() => removeChallenge(c.id)} className="text-red-400 px-2 py-1 rounded hover:bg-white/5">Удалить</button>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          <div className="col-span-2">
            {selected ? (
              <div className="rounded-xl border border-white/10 bg-slate-800 p-6">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-lg font-semibold text-white">{selected.title}</h2>
                  <div className="text-sm text-gray-400">Дней: {selected.days}</div>
                </div>
                <CircularTracker challenge={selected} onToggle={toggleDay} />
                <div className="mt-4 text-sm text-gray-400">Кликните по дню, чтобы отметить выполнение.</div>
              </div>
            ) : (
              <div className="rounded-xl border border-white/10 bg-slate-800 p-6 text-gray-400">Выберите челендж слева или создайте новый.</div>
            )}
          </div>
        </div>
      </div>
    </AppShell>
  );
}
