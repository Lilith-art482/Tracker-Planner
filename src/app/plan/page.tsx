"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import AppShell from "@/components/AppShell";
import { useAuth } from "@/context/AuthContext";
import { cn } from "@/lib/cn";
import { getTasks, createTask, updateTask, deleteTask } from "@/lib/db";
import type { Task, Priority } from "@/types";
import {
  CheckCircle2,
  AlertCircle,
  ListTodo,
  TrendingUp,
  Flag,
  Plus,
  Trash2,
  Pencil,
  X,
} from "lucide-react";

/* ───────── Category config ───────── */

const CATEGORIES = [
  { key: "work", label: "Работа/Учеба", color: "#3b82f6" },
  { key: "client", label: "Клиентские проекты", color: "#f97316" },
  { key: "home", label: "Домашние дела", color: "#eab308" },
  { key: "sport", label: "Спорт/Мероприятия", color: "#a855f7" },
] as const;

const CATEGORY_MAP = Object.fromEntries(CATEGORIES.map((c) => [c.key, c]));

const PRIORITY_LABELS: Record<Priority, string> = {
  low: "Низкий",
  medium: "Средний",
  high: "Высокий",
};

/* ───────── Helpers ───────── */

function formatDateRu(d: Date) {
  const months = [
    "января", "февраля", "марта", "апреля", "мая", "июня",
    "июля", "августа", "сентября", "октября", "ноября", "декабря",
  ];
  const days = [
    "воскресенье", "понедельник", "вторник", "среда",
    "четверг", "пятница", "суббота",
  ];
  return `${d.getDate()} ${months[d.getMonth()]} ${d.getFullYear()} г., ${days[d.getDay()]}`;
}

function formatTime(d: Date) {
  return `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
}

function toDateWithTime(base: Date, time: string) {
  const [h, m] = time.split(":").map(Number);
  const d = new Date(base);
  d.setHours(h, m, 0, 0);
  return d;
}

function getTodayRange() {
  const now = new Date();
  const start = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const end = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59);
  return { start, end };
}

function easeOutQuart(t: number) {
  return 1 - Math.pow(1 - t, 4);
}

function categoryCount(tasks: Task[], completedOnly = false) {
  const filtered = completedOnly ? tasks.filter((t) => t.status === "done") : tasks;
  const counts: Record<string, number> = {};
  for (const t of filtered) {
    const cat = t.category || "other";
    counts[cat] = (counts[cat] || 0) + 1;
  }
  return counts;
}

function toSegments(counts: Record<string, number>) {
  const total = Object.values(counts).reduce((a, b) => a + b, 0);
  if (total === 0) return [];
  return Object.entries(counts).map(([key, value]) => {
    const meta = CATEGORY_MAP[key as keyof typeof CATEGORY_MAP];
    return {
      key,
      label: meta?.label ?? key,
      value,
      percent: Math.round((value / total) * 1000) / 10,
      color: meta?.color ?? "#6b7280",
    };
  });
}

/* ───────── SVG Filter id generator ───────── */

let filterCounter = 0;
function uniqueFilterId() {
  return `donut-shadow-${++filterCounter}`;
}

/* ═════════════════════════════════════════
   Segment / DonutChart types
   ═════════════════════════════════════════ */

interface Segment {
  key: string;
  label: string;
  value: number;
  percent: number;
  color: string;
}

interface DonutChartProps {
  segments: Segment[];
  size?: number;
  strokeWidth?: number;
  centerText?: string;
  centerSubtext?: string;
  animDelay?: number;
  onSegmentHover?: (data: { seg: Segment; x: number; y: number } | null) => void;
}

function DonutChart({
  segments,
  size = 200,
  strokeWidth = 24,
  centerText,
  centerSubtext,
  animDelay = 0,
  onSegmentHover,
}: DonutChartProps) {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const cx = size / 2;
  const cy = size / 2;

  const circleRefs = useRef<(SVGCircleElement | null)[]>([]);
  const [hoveredIdx, setHoveredIdx] = useState<number | null>(null);
  const filterId = useRef(uniqueFilterId()).current;

  useEffect(() => {
    let angle = -90;
    circleRefs.current.forEach((circle, i) => {
      if (!circle) return;
      const seg = segments[i] || { percent: 0 };
      const length = circumference * (seg.percent / 100);
      circle.setAttribute("stroke-dasharray", `${length} ${circumference - length}`);
      circle.setAttribute("stroke-dashoffset", `${length}`);
      circle.dataset.startAngle = String(angle);
      angle += (seg.percent / 100) * 360;
    });

    const timer = setTimeout(() => {
      circleRefs.current.forEach((circle, i) => {
        if (!circle) return;
        const seg = segments[i] || { percent: 0 };
        animateIn(circle, circumference * (seg.percent / 100), i * 80);
      });
    }, animDelay);

    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [segments]);

  function animateIn(circle: SVGCircleElement, length: number, delay: number) {
    setTimeout(() => {
      const from = length;
      const to = 0;
      const duration = 1400;
      const startTime = performance.now();

      function tick(now: number) {
        const elapsed = now - startTime;
        const progress = Math.min(elapsed / duration, 1);
        const eased = easeOutQuart(progress);
        const current = from + (to - from) * eased;
        circle.setAttribute("stroke-dashoffset", `${current}`);
        if (progress < 1) requestAnimationFrame(tick);
      }
      requestAnimationFrame(tick);
    }, delay);
  }

  const onHover = useCallback(
    (e: React.MouseEvent, idx: number) => {
      setHoveredIdx(idx);
      const seg = segments[idx];
      if (seg && onSegmentHover) onSegmentHover({ seg, x: e.clientX, y: e.clientY });
    },
    [segments, onSegmentHover]
  );

  const onLeave = useCallback(() => setHoveredIdx(null), []);

  const onChartLeave = useCallback(() => {
    setHoveredIdx(null);
    if (onSegmentHover) onSegmentHover(null);
  }, [onSegmentHover]);

  return (
    <div className="relative inline-flex flex-col items-center" onMouseLeave={onChartLeave}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        <defs>
          <filter id={filterId} x="-20%" y="-20%" width="140%" height="140%">
            <feDropShadow dx="0" dy="0" stdDeviation="4" floodOpacity="0.35" />
          </filter>
        </defs>

        <circle cx={cx} cy={cy} r={radius} fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth={strokeWidth} />

        {segments.map((seg, i) => {
          const isHovered = hoveredIdx === i;
          return (
            <circle
              key={seg.key}
              ref={(el) => { circleRefs.current[i] = el; }}
              cx={cx}
              cy={cy}
              r={radius}
              fill="none"
              stroke={seg.color}
              strokeWidth={isHovered ? strokeWidth + 6 : strokeWidth}
              strokeLinecap="butt"
              transform={`rotate(${-90}, ${cx}, ${cy})`}
              className="transition-all duration-200 ease-out"
              style={{ cursor: "pointer", filter: isHovered ? `url(#${filterId})` : "none" }}
              onMouseEnter={(e) => onHover(e, i)}
              onMouseLeave={onLeave}
            />
          );
        })}
      </svg>

      <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
        {centerText && <span className="text-2xl font-bold text-white">{centerText}</span>}
        {centerSubtext && <span className="text-[10px] text-gray-400 mt-0.5">{centerSubtext}</span>}
      </div>
    </div>
  );
}

/* ═════════════════════════════════════════
   Tooltip
   ═════════════════════════════════════════ */

interface TooltipData {
  label: string;
  value: number;
  percent: number;
  color: string;
  x: number;
  y: number;
}

function Tooltip({ data }: { data: TooltipData | null }) {
  if (!data) return null;
  return (
    <div
      className="fixed z-[100] pointer-events-none flex items-center gap-2 px-3 py-2 rounded-lg bg-slate-800 border border-slate-600/40 shadow-xl text-sm"
      style={{ left: data.x + 14, top: data.y - 10 }}
    >
      <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ background: data.color }} />
      <span className="text-gray-200 font-medium">{data.label}</span>
      <span className="text-gray-400">{data.value} ({data.percent}%)</span>
    </div>
  );
}

/* ═════════════════════════════════════════
   Legend
   ═════════════════════════════════════════ */

function Legend({ segments }: { segments: Segment[] }) {
  if (segments.length === 0) return <span className="text-[11px] text-gray-500 mt-3">Нет данных</span>;
  return (
    <div className="flex flex-wrap gap-x-4 gap-y-1.5 mt-3">
      {segments.map((seg) => (
        <div key={seg.key} className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: seg.color }} />
          <span className="text-[11px] text-gray-400 whitespace-nowrap">{seg.label} — {seg.percent}%</span>
        </div>
      ))}
    </div>
  );
}

/* ═════════════════════════════════════════
   ProgressBar
   ═════════════════════════════════════════ */

interface ProgressBarProps {
  label: string;
  percent: number;
  icon: React.ReactNode;
  delay?: number;
}

function ProgressBar({ label, percent, icon, delay = 0 }: ProgressBarProps) {
  const [width, setWidth] = useState(0);

  useEffect(() => {
    const timer = setTimeout(() => setWidth(percent), delay);
    return () => clearTimeout(timer);
  }, [percent, delay]);

  const barColor = percent >= 80 ? "#22c55e" : percent >= 50 ? "#f59e0b" : "#ef4444";

  return (
    <div className="stagger-item" style={{ animationDelay: `${delay}ms` }}>
      <div className="flex items-center gap-2.5 mb-1.5">
        <div className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: `${barColor}18` }}>
          {icon}
        </div>
        <span className="text-xs font-medium text-gray-300">{label}</span>
        <span className="ml-auto text-sm font-bold tabular-nums" style={{ color: barColor }}>
          {percent}%
        </span>
      </div>
      <div className="h-2.5 rounded-full bg-white/5 overflow-hidden">
        <div
          className="h-full rounded-full transition-all duration-[1500ms] ease-out"
          style={{
            width: `${width}%`,
            background: `linear-gradient(90deg, ${barColor}88, ${barColor})`,
            transitionDelay: `${delay + 200}ms`,
          }}
        />
      </div>
    </div>
  );
}

/* ═════════════════════════════════════════
   Task Modal
   ═════════════════════════════════════════ */

interface ModalProps {
  open: boolean;
  onClose: () => void;
  onSave: (data: {
    title: string;
    description: string;
    time: string;
    category: string;
    priority: Priority;
  }) => Promise<void>;
  initial?: {
    title: string;
    description: string;
    time: string;
    category: string;
    priority: Priority;
  };
  submitting: boolean;
}

function TaskModal({ open, onClose, onSave, initial, submitting }: ModalProps) {
  const [title, setTitle] = useState(initial?.title ?? "");
  const [description, setDescription] = useState(initial?.description ?? "");
  const [time, setTime] = useState(initial?.time ?? "09:00");
  const [category, setCategory] = useState(initial?.category ?? "work");
  const [priority, setPriority] = useState<Priority>(initial?.priority ?? "medium");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (open) {
      setTitle(initial?.title ?? "");
      setDescription(initial?.description ?? "");
      setTime(initial?.time ?? formatTime(new Date()));
      setCategory(initial?.category ?? "work");
      setPriority(initial?.priority ?? "medium");
      setError(null);
    }
  }, [open, initial]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="w-full max-w-md rounded-xl bg-slate-800 border border-slate-700/50 p-6 shadow-2xl">
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-lg font-semibold text-white">
            {initial ? "Редактировать задачу" : "Новая задача"}
          </h2>
          <button onClick={onClose} className="p-1 rounded-lg hover:bg-white/5 text-gray-400 hover:text-white transition">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="space-y-4">
          {/* Title */}
          <div>
            <label className="block text-xs font-medium text-gray-400 mb-1.5">Название *</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Что нужно сделать?"
              className="w-full px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm"
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-xs font-medium text-gray-400 mb-1.5">Описание</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={2}
              placeholder="Детали (необязательно)..."
              className="w-full px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm resize-none"
            />
          </div>

          {/* Time + Priority row */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-gray-400 mb-1.5">Время</label>
              <input
                type="time"
                value={time}
                onChange={(e) => setTime(e.target.value)}
                className="w-full px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-400 mb-1.5">Приоритет</label>
              <div className="flex gap-1.5 h-full items-center">
                {(["low", "medium", "high"] as Priority[]).map((p) => (
                  <button
                    key={p}
                    onClick={() => setPriority(p)}
                    className={cn(
                      "flex-1 px-2 py-1.5 rounded-lg text-[11px] font-medium border transition",
                      priority === p
                        ? "border-indigo-500 bg-indigo-500/20 text-indigo-300"
                        : "border-white/10 text-gray-400 hover:border-white/20"
                    )}
                  >
                    {PRIORITY_LABELS[p]}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Category */}
          <div>
            <label className="block text-xs font-medium text-gray-400 mb-1.5">Категория</label>
            <div className="grid grid-cols-2 gap-2">
              {CATEGORIES.map((cat) => (
                <button
                  key={cat.key}
                  onClick={() => setCategory(cat.key)}
                  className={cn(
                    "flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-medium border transition",
                    category === cat.key
                      ? "border-slate-500 bg-white/10 text-white"
                      : "border-white/5 bg-white/[0.02] text-gray-400 hover:bg-white/[0.04]"
                  )}
                >
                  <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ background: cat.color }} />
                  {cat.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {error && (
          <div className="mt-4 p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
            {error}
          </div>
        )}

        <div className="flex justify-end gap-2 mt-5">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-lg text-sm text-gray-400 hover:text-white hover:bg-white/5 transition"
          >
            Отмена
          </button>
          <button
            onClick={async () => {
              if (!title.trim()) { setError("Введите название задачи"); return; }
              setError(null);
              await onSave({ title: title.trim(), description, time, category, priority });
            }}
            disabled={submitting}
            className="px-4 py-2 rounded-lg text-sm font-medium bg-indigo-600 text-white hover:bg-indigo-500 transition disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {submitting ? (
              <span className="flex items-center gap-1.5">
                <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Сохранение...
              </span>
            ) : (
              initial ? "Сохранить" : "Создать"
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

/* ═════════════════════════════════════════
   Main Page
   ═════════════════════════════════════════ */

export default function DayPlanPage() {
  const { user } = useAuth();
  const uid = user?.uid;
  if (!uid) return null;

  const [mounted, setMounted] = useState(false);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [tooltip, setTooltip] = useState<TooltipData | null>(null);

  // Modal
  const [showModal, setShowModal] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);

  const today = new Date();
  const todayKey = formatDateRu(today);

  useEffect(() => {
    setMounted(true);
  }, []);

  const fetchTasks = useCallback(async () => {
    if (!uid) return;
    try {
      setLoading(true);
      setError(null);
      const { start, end } = getTodayRange();
      const data = await getTasks(uid, start, end);
      setTasks(data);
    } catch (err: any) {
      setError(err.message || "Ошибка загрузки данных");
      setTasks([]);
    } finally {
      setLoading(false);
    }
  }, [uid]);

  useEffect(() => {
    fetchTasks();
  }, [fetchTasks]);

  /* ─── Computed stats ─── */

  const total = tasks.length;
  const completed = tasks.filter((t) => t.status === "done").length;
  const overdue = total - completed;
  const completedPct = total > 0 ? Math.round((completed / total) * 1000) / 10 : 0;
  const overduePct = total > 0 ? Math.round((overdue / total) * 1000) / 10 : 0;

  // Priority score: weighted by priority, computed from completed tasks
  const priorityScore = (() => {
    if (total === 0) return 0;
    const weights: Record<Priority, number> = { high: 3, medium: 2, low: 1 };
    const totalWeight = tasks.reduce((s, t) => s + weights[t.priority], 0);
    const doneWeight = tasks.filter((t) => t.status === "done").reduce((s, t) => s + weights[t.priority], 0);
    return totalWeight > 0 ? Math.round((doneWeight / totalWeight) * 100) : 0;
  })();

  /* ─── Chart data ─── */

  const chartOverall = total > 0
    ? [
        { key: "overdue", label: "Просроченные", value: overdue, percent: overduePct, color: "#f43f5e" },
        { key: "completed", label: "Выполненные", value: completed, percent: completedPct, color: "#22c55e" },
      ]
    : [];

  const allCatCounts = categoryCount(tasks);
  const doneCatCounts = categoryCount(tasks, true);
  const chartByCategory = toSegments(allCatCounts);
  const chartDoneByCategory = toSegments(doneCatCounts);

  /* ─── CRUD handlers ─── */

  const handleSave = async (data: {
    title: string;
    description: string;
    time: string;
    category: string;
    priority: Priority;
  }) => {
    if (submitting) return;
    setSubmitting(true);
    try {
      if (editingTask) {
        const updatedDate = toDateWithTime(new Date(editingTask.date), data.time);
        await updateTask(uid, editingTask.id, {
          title: data.title,
          description: data.description,
          date: updatedDate,
          deadline: updatedDate,
          priority: data.priority,
          category: data.category,
        });
        setTasks((prev) =>
          prev.map((t) =>
            t.id === editingTask.id
              ? { ...t, title: data.title, description: data.description, date: updatedDate, deadline: updatedDate, priority: data.priority, category: data.category }
              : t
          )
        );
      } else {
        const taskDate = toDateWithTime(today, data.time);
        const tempId = `temp_${Date.now()}`;
        const newTask: Task = {
          id: tempId,
          title: data.title,
          description: data.description,
          date: taskDate,
          deadline: taskDate,
          priority: data.priority,
          comment: "",
          status: "todo",
          projectId: null,
          planId: null,
          userId: uid,
          category: data.category,
          createdAt: new Date(),
          updatedAt: new Date(),
        };
        setTasks((prev) => [...prev, newTask]);
        const realId = await createTask(uid, {
          title: data.title,
          description: data.description,
          date: taskDate,
          deadline: taskDate,
          priority: data.priority,
          comment: "",
          status: "todo",
          projectId: null,
          planId: null,
          userId: uid,
          category: data.category,
        });
        setTasks((prev) => prev.map((t) => (t.id === tempId ? { ...t, id: realId } : t)));
      }
      setShowModal(false);
      setEditingTask(null);
    } catch (err: any) {
      setError(err.message || "Ошибка сохранения");
    } finally {
      setSubmitting(false);
    }
  };

  const handleToggleStatus = async (task: Task) => {
    const nextStatus = task.status === "done" ? "todo" : "done";
    setTasks((prev) => prev.map((t) => (t.id === task.id ? { ...t, status: nextStatus } : t)));
    try {
      await updateTask(uid, task.id, { status: nextStatus });
    } catch {
      setTasks((prev) => prev.map((t) => (t.id === task.id ? { ...t, status: task.status } : t)));
      setError("Ошибка обновления статуса");
    }
  };

  const handleDelete = async (id: string) => {
    const prev = tasks;
    setTasks((prev) => prev.filter((t) => t.id !== id));
    try {
      await deleteTask(uid, id);
    } catch {
      setTasks(prev);
      setError("Ошибка при удалении");
    }
  };

  const openEdit = (task: Task) => {
    setEditingTask(task);
    setShowModal(true);
  };

  const openAdd = () => {
    setEditingTask(null);
    setShowModal(true);
  };

  /* ─── Tooltip handlers ─── */

  const handleSegmentHover = useCallback(
    (data: { seg: Segment; x: number; y: number } | null) => {
      if (data) {
        setTooltip({ label: data.seg.label, value: data.seg.value, percent: data.seg.percent, color: data.seg.color, x: data.x, y: data.y });
      } else {
        setTooltip(null);
      }
    },
    []
  );

  const chartOnMove = useCallback((e: React.MouseEvent) => {
    setTooltip((prev) => (prev ? { ...prev, x: e.clientX, y: e.clientY } : prev));
  }, []);

  if (!mounted) {
    return (
      <AppShell>
        <div className="max-w-7xl mx-auto" />
      </AppShell>
    );
  }

  return (
    <AppShell>
      <div className="max-w-7xl mx-auto space-y-8">
        {/* ═══ Header ═══ */}
        <header className="stagger-item" style={{ animationDelay: "0ms" }}>
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-white tracking-tight">План на день</h1>
              <p className="text-sm text-gray-400 mt-1">
                ДАТА СЕГОДНЯ: <span className="text-gray-200 font-medium">{todayKey}</span>
              </p>
            </div>
            <button
              onClick={openAdd}
              className="stagger-item flex items-center gap-2 px-4 py-2.5 rounded-xl bg-indigo-600 text-white text-sm font-medium hover:bg-indigo-500 transition shadow-lg shadow-indigo-600/20"
              style={{ animationDelay: "50ms" }}
            >
              <Plus className="w-4 h-4" />
              Добавить
            </button>
          </div>
        </header>

        {error && (
          <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
            {error}
            <button onClick={() => setError(null)} className="ml-2 underline hover:no-underline">Закрыть</button>
          </div>
        )}

        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : (
          <>
            {/* ═══ Tasks Section ═══ */}
            <section className="space-y-4">
              {/* Stats cards */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {[
                  { label: "Всего задач на сегодня", value: total, icon: ListTodo, from: "from-blue-500", to: "to-indigo-600", delay: 80 },
                  { label: "Просроченные", value: overdue, icon: AlertCircle, from: "from-rose-500", to: "to-pink-600", delay: 160 },
                  { label: "Выполненные", value: completed, icon: CheckCircle2, from: "from-emerald-500", to: "to-teal-600", delay: 240 },
                ].map((card) => (
                  <div
                    key={card.label}
                    className="stagger-item relative overflow-hidden rounded-xl bg-slate-800/60 border border-slate-700/40 p-4"
                    style={{ animationDelay: `${card.delay}ms` }}
                  >
                    <div
                      className="absolute -top-6 -right-6 w-16 h-16 rounded-full opacity-10"
                      style={{ background: `linear-gradient(135deg, ${card.from.replace("from-", "")}, ${card.to.replace("to-", "")})` }}
                    />
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-xs text-gray-400 font-medium uppercase tracking-wider">{card.label}</p>
                        <p className="text-3xl font-bold text-white mt-1 tabular-nums">{card.value}</p>
                      </div>
                      <div
                        className="w-10 h-10 rounded-xl flex items-center justify-center shadow-lg flex-shrink-0"
                        style={{ background: `linear-gradient(135deg, ${card.from.replace("from-", "")}, ${card.to.replace("to-", "")})` }}
                      >
                        <card.icon className="w-5 h-5 text-white" />
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Task list */}
              <div
                className="stagger-item rounded-xl bg-slate-800/60 border border-slate-700/40 overflow-hidden"
                style={{ animationDelay: "320ms" }}
              >
                <div className="px-4 py-3 border-b border-slate-700/30 flex items-center justify-between">
                  <h3 className="text-sm font-semibold text-gray-200">Список задач</h3>
                  <span className="text-[11px] text-gray-500">{total} задач</span>
                </div>

                {tasks.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-12 text-gray-500">
                    <ListTodo className="w-8 h-8 mb-2 opacity-40" />
                    <p className="text-sm">На сегодня задач нет</p>
                    <button onClick={openAdd} className="mt-3 text-xs text-indigo-400 hover:text-indigo-300 transition">
                      + Добавить задачу
                    </button>
                  </div>
                ) : (
                  <div className="divide-y divide-slate-700/20">
                    {tasks.map((task, i) => {
                      const catMeta = CATEGORY_MAP[task.category as keyof typeof CATEGORY_MAP] || { label: task.category || "Без категории", color: "#6b7280" };
                      const delay = 350 + i * 50;
                      const isDone = task.status === "done";
                      return (
                        <div
                          key={task.id}
                          className="stagger-item flex items-center gap-3 px-4 py-2.5 hover:bg-white/[0.02] transition group"
                          style={{ animationDelay: `${delay}ms` }}
                        >
                          {/* Checkbox */}
                          <button
                            onClick={() => handleToggleStatus(task)}
                            className={cn(
                              "w-4 h-4 rounded-full border-2 flex-shrink-0 transition flex items-center justify-center",
                              isDone
                                ? "border-emerald-500 bg-emerald-500/20 text-emerald-400"
                                : "border-slate-500 hover:border-slate-400"
                            )}
                          >
                            {isDone && <CheckCircle2 className="w-3 h-3" />}
                          </button>

                          {/* Time */}
                          <span className="text-xs text-gray-500 font-mono tabular-nums w-10 flex-shrink-0">
                            {formatTime(task.date)}
                          </span>

                          {/* Title + Desc */}
                          <div className="flex-1 min-w-0">
                            <span
                              className={cn(
                                "text-sm block truncate",
                                isDone ? "text-gray-500 line-through" : "text-gray-200"
                              )}
                            >
                              {task.title}
                            </span>
                            {task.description && (
                              <span className="text-[11px] text-gray-500 truncate block">{task.description}</span>
                            )}
                          </div>

                          {/* Category badge */}
                          <span
                            className="flex items-center gap-1.5 text-[11px] font-medium px-2 py-0.5 rounded-full flex-shrink-0"
                            style={{ background: `${catMeta.color}18`, color: catMeta.color }}
                          >
                            <span className="w-1.5 h-1.5 rounded-full" style={{ background: catMeta.color }} />
                            {catMeta.label}
                          </span>

                          {/* Priority indicator */}
                          <span
                            className={cn(
                              "text-[10px] font-medium px-1.5 py-0.5 rounded flex-shrink-0",
                              task.priority === "high" && "text-red-400 bg-red-400/10",
                              task.priority === "medium" && "text-amber-400 bg-amber-400/10",
                              task.priority === "low" && "text-green-400 bg-green-400/10",
                            )}
                          >
                            {PRIORITY_LABELS[task.priority]}
                          </span>

                          {/* Actions */}
                          <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition">
                            <button
                              onClick={() => openEdit(task)}
                              className="p-1 rounded hover:bg-white/10 text-gray-500 hover:text-white transition"
                            >
                              <Pencil className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => handleDelete(task.id)}
                              className="p-1 rounded hover:bg-red-500/10 text-gray-500 hover:text-red-400 transition"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </section>

            {/* ═══ Analytics Section ═══ */}
            <section className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              {/* Left: Progress Summary */}
              <div
                className="stagger-item lg:col-span-4 rounded-xl bg-slate-800/60 border border-slate-700/40 p-5 space-y-5"
                style={{ animationDelay: "500ms" }}
              >
                <div className="flex items-center gap-2">
                  <TrendingUp className="w-4 h-4 text-indigo-400" />
                  <h3 className="text-sm font-semibold text-gray-200">Сводка прогресса</h3>
                </div>

                <ProgressBar
                  label="Прогресс"
                  percent={completedPct}
                  icon={<CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />}
                  delay={600}
                />

                <ProgressBar
                  label="Приоритет"
                  percent={priorityScore}
                  icon={<Flag className="w-3.5 h-3.5 text-amber-400" />}
                  delay={800}
                />
              </div>

              {/* Right: Charts */}
              <div
                className="stagger-item lg:col-span-8 rounded-xl bg-slate-800/60 border border-slate-700/40 p-5"
                style={{ animationDelay: "600ms" }}
                onMouseMove={chartOnMove}
              >
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {/* Chart 1: Overall Status */}
                  <div className="flex flex-col items-center">
                    <h4 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Общий статус</h4>
                    <DonutChart
                      segments={chartOverall}
                      size={160}
                      strokeWidth={20}
                      centerText={total > 0 ? `${completedPct}%` : "—"}
                      centerSubtext={total > 0 ? "выполнено" : "нет задач"}
                      animDelay={700}
                      onSegmentHover={handleSegmentHover}
                    />
                    <Legend segments={chartOverall} />
                  </div>

                  {/* Chart 2: By Category */}
                  <div className="flex flex-col items-center">
                    <h4 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">По категориям</h4>
                    <DonutChart
                      segments={chartByCategory}
                      size={160}
                      strokeWidth={20}
                      centerText={`${total}`}
                      centerSubtext="всего"
                      animDelay={900}
                      onSegmentHover={handleSegmentHover}
                    />
                    <Legend segments={chartByCategory} />
                  </div>

                  {/* Chart 3: Completed by Category */}
                  <div className="flex flex-col items-center">
                    <h4 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Выполненные по категориям</h4>
                    <DonutChart
                      segments={chartDoneByCategory}
                      size={160}
                      strokeWidth={20}
                      centerText={`${completed}`}
                      centerSubtext="выполнено"
                      animDelay={1100}
                      onSegmentHover={handleSegmentHover}
                    />
                    <Legend segments={chartDoneByCategory} />
                  </div>
                </div>
              </div>
            </section>
          </>
        )}
      </div>

      {/* Modal */}
      <TaskModal
        open={showModal}
        onClose={() => { setShowModal(false); setEditingTask(null); }}
        onSave={handleSave}
        initial={
          editingTask
            ? {
                title: editingTask.title,
                description: editingTask.description,
                time: formatTime(editingTask.date),
                category: editingTask.category || "work",
                priority: editingTask.priority,
              }
            : undefined
        }
        submitting={submitting}
      />

      {/* Tooltip */}
      <Tooltip data={tooltip} />

      {/* ─── Styles ─── */}
      <style>{`
        @keyframes fadeInUp {
          from { opacity: 0; transform: translateY(16px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        .stagger-item {
          opacity: 0;
          animation: fadeInUp 0.6s ease forwards;
          animation-delay: var(--delay, 0ms);
        }
      `}</style>
    </AppShell>
  );
}
