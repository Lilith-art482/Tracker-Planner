"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import AppShell from "@/components/AppShell";
import { useAuth } from "@/context/AuthContext";
import { cn } from "@/lib/cn";
import {
  CheckCircle2,
  AlertCircle,
  ListTodo,
  TrendingUp,
  Flag,
} from "lucide-react";

/* ───────── Data ───────── */

const CATEGORY_META: Record<string, { label: string; color: string }> = {
  work: { label: "Работа/Учеба", color: "#3b82f6" },
  client: { label: "Клиентские проекты", color: "#f97316" },
  home: { label: "Домашние дела", color: "#eab308" },
  sport: { label: "Спорт/Мероприятия", color: "#a855f7" },
};

interface Task {
  time: string;
  description: string;
  category: string;
  completed: boolean;
}

const TASKS: Task[] = [
  { time: "8:00", description: "Утренняя зарядка", category: "sport", completed: true },
  { time: "9:00", description: "Проверка рабочей почты", category: "work", completed: true },
  { time: "10:00", description: "Разработка прототипа", category: "work", completed: true },
  { time: "11:00", description: "Встреча с клиентом", category: "client", completed: true },
  { time: "12:00", description: "Обед", category: "home", completed: true },
  { time: "13:00", description: "Курс по UI/UX дизайну", category: "work", completed: true },
  { time: "14:00", description: "Правки по проекту Alpha", category: "client", completed: true },
  { time: "15:00", description: "Уборка в квартире", category: "home", completed: true },
  { time: "16:00", description: "Силовая тренировка", category: "sport", completed: true },
  { time: "17:00", description: "Чтение документации API", category: "work", completed: true },
  { time: "18:00", description: "Планирование задач на завтра", category: "work", completed: false },
  { time: "19:00", description: "Прогулка в парке", category: "sport", completed: false },
];

const TOTAL = TASKS.length;
const COMPLETED = TASKS.filter((t) => t.completed).length;
const OVERDUE = TOTAL - COMPLETED;
const COMPLETED_PCT = Math.round((COMPLETED / TOTAL) * 1000) / 10;
const OVERDUE_PCT = Math.round((OVERDUE / TOTAL) * 1000) / 10;

function categoryCount(tasks: Task[], completedOnly = false) {
  const filtered = completedOnly ? tasks.filter((t) => t.completed) : tasks;
  const counts: Record<string, number> = {};
  for (const t of filtered) {
    counts[t.category] = (counts[t.category] || 0) + 1;
  }
  return counts;
}

function toSegments(
  counts: Record<string, number>,
  meta: Record<string, { label: string; color: string }>
) {
  const total = Object.values(counts).reduce((a, b) => a + b, 0);
  return Object.entries(counts).map(([key, value]) => ({
    key,
    label: meta[key]?.label ?? key,
    value,
    percent: Math.round((value / total) * 1000) / 10,
    color: meta[key]?.color ?? "#666",
  }));
}

const CHART1_SEGMENTS = [
  { key: "overdue", label: "Просроченные", value: OVERDUE, percent: OVERDUE_PCT, color: "#f43f5e" },
  { key: "completed", label: "Выполненные", value: COMPLETED, percent: COMPLETED_PCT, color: "#22c55e" },
];

const CHART2_SEGMENTS = toSegments(categoryCount(TASKS), CATEGORY_META);
const CHART3_SEGMENTS = toSegments(categoryCount(TASKS, true), CATEGORY_META);

/* ───────── helpers ───────── */

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

/* ───────── Easing ───────── */

function easeOutQuart(t: number) {
  return 1 - Math.pow(1 - t, 4);
}

/* ───────── SVG Filter id generator ───────── */

let filterCounter = 0;
function uniqueFilterId() {
  return `donut-shadow-${++filterCounter}`;
}

/* ═════════════════════════════════════════
   DonutChart Component
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
      const seg = segments[i];
      const length = circumference * (seg.percent / 100);
      circle.setAttribute("stroke-dasharray", `${length} ${circumference - length}`);
      circle.setAttribute("stroke-dashoffset", `${length}`);

      const startAngle = angle;
      angle += (seg.percent / 100) * 360;
      circle.dataset.startAngle = String(startAngle);
    });

    const timer = setTimeout(() => {
      circleRefs.current.forEach((circle, i) => {
        if (!circle) return;
        animateIn(circle, circumference * (segments[i].percent / 100), i * 80);
      });
    }, animDelay);

    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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
        if (progress < 1) {
          requestAnimationFrame(tick);
        }
      }
      requestAnimationFrame(tick);
    }, delay);
  }

  const onHover = useCallback(
    (e: React.MouseEvent, idx: number) => {
      setHoveredIdx(idx);
      const seg = segments[idx];
      if (seg && onSegmentHover) {
        onSegmentHover({ seg, x: e.clientX, y: e.clientY });
      }
    },
    [segments, onSegmentHover]
  );

  const onLeave = useCallback(() => {
    setHoveredIdx(null);
  }, []);

  const onChartLeave = useCallback(() => {
    setHoveredIdx(null);
    if (onSegmentHover) onSegmentHover(null);
  }, [onSegmentHover]);

  return (
    <div className="relative inline-flex flex-col items-center" onMouseLeave={onChartLeave}>
      <svg
        width={size}
        height={size}
        viewBox={`0 0 ${size} ${size}`}
      >
        <defs>
          <filter id={filterId} x="-20%" y="-20%" width="140%" height="140%">
            <feDropShadow dx="0" dy="0" stdDeviation="4" floodOpacity="0.35" />
          </filter>
        </defs>

        <circle
          cx={cx}
          cy={cy}
          r={radius}
          fill="none"
          stroke="rgba(255,255,255,0.06)"
          strokeWidth={strokeWidth}
        />

        {segments.map((seg, i) => {
          const isHovered = hoveredIdx === i;
          return (
            <circle
              key={seg.key}
              ref={(el) => {
                circleRefs.current[i] = el;
              }}
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
        {centerText && (
          <span className="text-2xl font-bold text-white">{centerText}</span>
        )}
        {centerSubtext && (
          <span className="text-[10px] text-gray-400 mt-0.5">{centerSubtext}</span>
        )}
      </div>
    </div>
  );
}

/* ═════════════════════════════════════════
   Tooltip Component
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
      <span
        className="w-2.5 h-2.5 rounded-full flex-shrink-0"
        style={{ background: data.color }}
      />
      <span className="text-gray-200 font-medium">{data.label}</span>
      <span className="text-gray-400">
        {data.value} ({data.percent}%)
      </span>
    </div>
  );
}

/* ═════════════════════════════════════════
   Legend Component
   ═════════════════════════════════════════ */

function Legend({ segments }: { segments: Segment[] }) {
  return (
    <div className="flex flex-wrap gap-x-4 gap-y-1.5 mt-3">
      {segments.map((seg) => (
        <div key={seg.key} className="flex items-center gap-1.5">
          <span
            className="w-2 h-2 rounded-full flex-shrink-0"
            style={{ background: seg.color }}
          />
          <span className="text-[11px] text-gray-400 whitespace-nowrap">
            {seg.label} — {seg.percent}%
          </span>
        </div>
      ))}
    </div>
  );
}

/* ═════════════════════════════════════════
   ProgressBar Component
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
        <div
          className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0"
          style={{ background: `${barColor}18` }}
        >
          {icon}
        </div>
        <span className="text-xs font-medium text-gray-300">{label}</span>
        <span
          className="ml-auto text-sm font-bold tabular-nums"
          style={{ color: barColor }}
        >
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
   Main Page Component
   ═════════════════════════════════════════ */

export default function DayPlanPage() {
  const { user } = useAuth();
  const uid = user?.uid;
  if (!uid) return null;

  const [mounted, setMounted] = useState(false);
  const [today, setToday] = useState(new Date());
  const [tooltip, setTooltip] = useState<TooltipData | null>(null);

  useEffect(() => {
    setToday(new Date());
    setMounted(true);
  }, []);

  /* ─── Chart hover handlers ─── */

  const handleSegmentHover = useCallback(
    (data: { seg: Segment; x: number; y: number } | null) => {
      if (data) {
        setTooltip({
          label: data.seg.label,
          value: data.seg.value,
          percent: data.seg.percent,
          color: data.seg.color,
          x: data.x,
          y: data.y,
        });
      } else {
        setTooltip(null);
      }
    },
    []
  );

  const chartOnMove = useCallback((e: React.MouseEvent) => {
    setTooltip((prev) =>
      prev ? { ...prev, x: e.clientX, y: e.clientY } : prev
    );
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
          <h1 className="text-3xl font-bold text-white tracking-tight">План на день</h1>
          <p className="text-sm text-gray-400 mt-1">
            ДАТА СЕГОДНЯ: <span className="text-gray-200 font-medium">{formatDateRu(today)}</span>
          </p>
        </header>

        {/* ═══ Tasks Section ═══ */}
        <section className="space-y-4">
          {/* Stats cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {[
              {
                label: "Всего задач на сегодня",
                value: TOTAL,
                icon: ListTodo,
                color: "from-blue-500 to-indigo-600",
                delay: 80,
              },
              {
                label: "Просроченные",
                value: OVERDUE,
                icon: AlertCircle,
                color: "from-rose-500 to-pink-600",
                delay: 160,
              },
              {
                label: "Выполненные",
                value: COMPLETED,
                icon: CheckCircle2,
                color: "from-emerald-500 to-teal-600",
                delay: 240,
              },
            ].map((card) => (
              <div
                key={card.label}
                className="stagger-item relative overflow-hidden rounded-xl bg-slate-800/60 border border-slate-700/40 p-4"
                style={{ animationDelay: `${card.delay}ms` }}
              >
                <div
                  className="absolute -top-6 -right-6 w-16 h-16 rounded-full bg-gradient-to-br opacity-10"
                  style={{
                    background: `linear-gradient(135deg, ${card.color.split(" ")[0].replace("from-", "")}, ${card.color.split(" ")[1].replace("to-", "")})`,
                  }}
                />
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs text-gray-400 font-medium uppercase tracking-wider">
                      {card.label}
                    </p>
                    <p className="text-3xl font-bold text-white mt-1 tabular-nums">
                      {card.value}
                    </p>
                  </div>
                  <div
                    className="w-10 h-10 rounded-xl flex items-center justify-center bg-gradient-to-br shadow-lg flex-shrink-0"
                    style={{
                      background: `linear-gradient(135deg, ${card.color.split(" ")[0].replace("from-", "")}, ${card.color.split(" ")[1].replace("to-", "")})`,
                    }}
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
            <div className="px-4 py-3 border-b border-slate-700/30">
              <h3 className="text-sm font-semibold text-gray-200">Список задач на сегодня</h3>
            </div>
            <div className="divide-y divide-slate-700/20">
              {TASKS.map((task, i) => {
                const meta = CATEGORY_META[task.category];
                const delay = 350 + i * 50;
                return (
                  <div
                    key={`${task.time}-${i}`}
                    className="stagger-item flex items-center gap-3 px-4 py-2.5 hover:bg-white/[0.02] transition"
                    style={{ animationDelay: `${delay}ms` }}
                  >
                    <span className="text-xs text-gray-500 font-mono tabular-nums w-10 flex-shrink-0">
                      {task.time}
                    </span>
                    <span
                      className={cn(
                        "flex-1 text-sm",
                        task.completed
                          ? "text-gray-400 line-through"
                          : "text-gray-200"
                      )}
                    >
                      {task.description}
                    </span>
                    <span
                      className="flex items-center gap-1.5 text-[11px] font-medium px-2 py-0.5 rounded-full"
                      style={{
                        background: `${meta.color}18`,
                        color: meta.color,
                      }}
                    >
                      <span
                        className="w-1.5 h-1.5 rounded-full"
                        style={{ background: meta.color }}
                      />
                      {meta.label}
                    </span>
                  </div>
                );
              })}
            </div>
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
              percent={COMPLETED_PCT}
              icon={<CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />}
              delay={600}
            />

            <ProgressBar
              label="Приоритет"
              percent={60}
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
                <h4 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">
                  Общий статус
                </h4>
                <DonutChart
                  segments={CHART1_SEGMENTS}
                  size={160}
                  strokeWidth={20}
                  centerText={`${COMPLETED_PCT}%`}
                  centerSubtext="выполнено"
                  animDelay={700}
                  onSegmentHover={handleSegmentHover}
                />
                <Legend segments={CHART1_SEGMENTS} />
              </div>

              {/* Chart 2: By Category */}
              <div className="flex flex-col items-center">
                <h4 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">
                  По категориям
                </h4>
                <DonutChart
                  segments={CHART2_SEGMENTS}
                  size={160}
                  strokeWidth={20}
                  centerText={`${TOTAL}`}
                  centerSubtext="всего"
                  animDelay={900}
                  onSegmentHover={handleSegmentHover}
                />
                <Legend segments={CHART2_SEGMENTS} />
              </div>

              {/* Chart 3: Completed by Category */}
              <div className="flex flex-col items-center">
                <h4 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">
                  Выполненные по категориям
                </h4>
                <DonutChart
                  segments={CHART3_SEGMENTS}
                  size={160}
                  strokeWidth={20}
                  centerText={`${COMPLETED}`}
                  centerSubtext="выполнено"
                  animDelay={1100}
                  onSegmentHover={handleSegmentHover}
                />
                <Legend segments={CHART3_SEGMENTS} />
              </div>
            </div>
          </div>
        </section>
      </div>

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
