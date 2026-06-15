"use client";

import { useState, useEffect, useCallback } from "react";
import AppShell from "@/components/AppShell";
import { useAuth } from "@/context/AuthContext";
import {
  getPlanItems,
  createPlanItem,
  updatePlanItem,
  deletePlanItem,
} from "@/lib/db";
import type { PlanItem } from "@/types";
import {
  getWeekDays,
  getMonthDays,
  getWeekStart,
  getMonthKey,
  formatDate,
  addWeeks,
  subWeeks,
  addMonths,
  subMonths,
  isSameDay,
  isSameMonth,
  format,
} from "@/lib/dates";
import { cn } from "@/lib/cn";
import { Plus, ChevronLeft, ChevronRight, Pencil, Trash2, CalendarDays, List } from "lucide-react";
import { PlanGridSkeleton } from "@/components/Skeleton";

type ViewMode = "weekly" | "monthly";

export default function PlanPage() {
  const { user } = useAuth();
  const uid = user?.uid;
  if (!uid) return null;

  const [view, setView] = useState<ViewMode>("weekly");
  const [currentDate, setCurrentDate] = useState(new Date());
  const [items, setItems] = useState<PlanItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Modal state
  const [showModal, setShowModal] = useState(false);
  const [editingItem, setEditingItem] = useState<PlanItem | null>(null);
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [formTitle, setFormTitle] = useState("");
  const [formDesc, setFormDesc] = useState("");
  const [formError, setFormError] = useState<string | null>(null);

  const weekStart = getWeekStart(currentDate);
  const monthKey = getMonthKey(currentDate);

  const days = view === "weekly" ? getWeekDays(currentDate) : getMonthDays(currentDate);

  const fetchItems = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await getPlanItems(uid, view, view === "weekly" ? weekStart : monthKey);
      setItems(data);
    } catch (err: any) {
      setError(err.message || "Ошибка загрузки данных");
      setItems([]);
    } finally {
      setLoading(false);
    }
  }, [uid, view, weekStart, monthKey]);

  useEffect(() => {
    fetchItems();
  }, [fetchItems]);

  const itemsForDay = (day: Date) =>
    items.filter((item) => isSameDay(new Date(item.date), day));

  const openAdd = (day: Date) => {
    setEditingItem(null);
    setSelectedDate(day);
    setFormTitle("");
    setFormDesc("");
    setShowModal(true);
  };

  const openEdit = (item: PlanItem) => {
    setEditingItem(item);
    setSelectedDate(new Date(item.date));
    setFormTitle(item.title);
    setFormDesc(item.description);
    setShowModal(true);
  };

  const handleSave = async () => {
    setFormError(null);
    if (!formTitle.trim()) return;
    try {
      if (editingItem) {
        await updatePlanItem(uid, editingItem.id, {
          title: formTitle,
          description: formDesc,
          date: selectedDate,
        });
      } else {
        await createPlanItem(uid, {
          title: formTitle,
          description: formDesc,
          date: selectedDate,
          type: view,
          weekStart: getWeekStart(selectedDate),
          month: getMonthKey(selectedDate),
          userId: uid,
        });
      }
      setShowModal(false);
      setFormError(null);
      fetchItems();
    } catch (err: any) {
      setFormError(err.message || "Ошибка");
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await deletePlanItem(uid, id);
      fetchItems();
    } catch (err: any) {
      setError(err.message || "Ошибка");
    }
  };

  const navigate = (dir: "prev" | "next") => {
    setCurrentDate(
      view === "weekly"
        ? dir === "prev" ? subWeeks(currentDate, 1) : addWeeks(currentDate, 1)
        : dir === "prev" ? subMonths(currentDate, 1) : addMonths(currentDate, 1)
    );
  };

  const today = new Date();

  return (
    <AppShell>
      <div className="max-w-6xl mx-auto">
        {error && (
          <div className="mb-4 p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
            {error}
          </div>
        )}

        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold text-white">План</h1>
          <div className="flex items-center gap-3">
            {/* View toggle */}
            <div className="flex bg-slate-800 rounded-lg p-0.5 border border-white/10">
              <button
                onClick={() => setView("weekly")}
                className={cn(
                  "flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium transition",
                  view === "weekly" ? "bg-indigo-600 text-white" : "text-gray-400 hover:text-white"
                )}
              >
                <List className="w-4 h-4" />
                Неделя
              </button>
              <button
                onClick={() => setView("monthly")}
                className={cn(
                  "flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium transition",
                  view === "monthly" ? "bg-indigo-600 text-white" : "text-gray-400 hover:text-white"
                )}
              >
                <CalendarDays className="w-4 h-4" />
                Месяц
              </button>
            </div>
            {/* Navigation */}
            <div className="flex items-center gap-1">
              <button
                onClick={() => navigate("prev")}
                className="p-1.5 rounded-lg hover:bg-white/5 text-gray-400 hover:text-white transition"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
              <span className="text-sm text-gray-300 font-medium min-w-[120px] text-center">
                {view === "weekly"
                  ? `${formatDate(days[0], "MMM d")} – ${formatDate(days[days.length - 1], "MMM d, yyyy")}`
                  : formatDate(currentDate, "MMMM yyyy")}
              </span>
              <button
                onClick={() => navigate("next")}
                className="p-1.5 rounded-lg hover:bg-white/5 text-gray-400 hover:text-white transition"
              >
                <ChevronRight className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>

        {loading ? (
          <PlanGridSkeleton />
        ) : (
          /* Grid */
          <div
            className={cn(
              "grid gap-2",
              view === "weekly" ? "grid-cols-7" : "grid-cols-7"
            )}
          >
            {/* Day headers */}
            {["Пн", "Вт", "Ср", "Чт", "Пт", "Сб", "Вс"].map((d) => (
              <div
                key={d}
                className="text-xs font-semibold text-gray-500 uppercase tracking-wider text-center py-2"
              >
                {d}
              </div>
            ))}

            {/* Empty cells for monthly view offset */}
            {view === "monthly" &&
              Array.from({ length: days[0].getDay() === 0 ? 6 : days[0].getDay() - 1 }).map((_, i) => (
                <div key={`offset-${i}`} />
              ))}

            {/* Day cells */}
            {days.map((day) => {
              const dayItems = itemsForDay(day);
              const isToday = isSameDay(day, today);
              const isCurrentMonth = view === "monthly" ? isSameMonth(day, currentDate) : true;

              return (
                <div
                  key={day.toISOString()}
                  className={cn(
                    "min-h-[100px] md:min-h-[120px] rounded-lg border p-1.5 transition group",
                    isToday
                      ? "border-indigo-500/50 bg-indigo-500/5"
                      : "border-white/5 bg-white/[0.02] hover:bg-white/[0.04]",
                    !isCurrentMonth && "opacity-30"
                  )}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span
                      className={cn(
                        "text-xs font-medium",
                        isToday ? "text-indigo-400" : "text-gray-500"
                      )}
                    >
                      {formatDate(day, "d")}
                    </span>
                    <button
                      onClick={() => openAdd(day)}
                      className="opacity-0 group-hover:opacity-100 p-0.5 rounded hover:bg-white/10 text-gray-500 hover:text-white transition"
                    >
                      <Plus className="w-3 h-3" />
                    </button>
                  </div>
                  <div className="space-y-1">
                    {dayItems.slice(0, 3).map((item) => (
                      <div
                        key={item.id}
                        className="group/item flex items-start gap-1 px-1.5 py-1 rounded bg-indigo-500/15 text-xs text-indigo-200 cursor-pointer hover:bg-indigo-500/25 transition"
                        onClick={() => openEdit(item)}
                      >
                        <span className="flex-1 truncate">{item.title}</span>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDelete(item.id);
                          }}
                          className="opacity-0 group-hover/item:opacity-100 p-0.5 hover:text-red-400 transition"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </div>
                    ))}
                    {dayItems.length > 3 && (
                      <span className="text-[10px] text-gray-500 pl-1">+{dayItems.length - 3} ещё</span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="w-full max-w-md rounded-xl bg-slate-800 border border-white/10 p-6 shadow-2xl">
            <h2 className="text-lg font-semibold text-white mb-4">
              {editingItem ? "Редактировать пункт" : "Новый пункт"}
            </h2>
            <div className="space-y-3">
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-1">Дата</label>
                <input
                  type="date"
                  value={format(selectedDate, "yyyy-MM-dd")}
                  onChange={(e) => setSelectedDate(new Date(e.target.value + "T12:00:00"))}
                  className="w-full px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-1">Название</label>
                <input
                  type="text"
                  value={formTitle}
                  onChange={(e) => setFormTitle(e.target.value)}
                  placeholder="Что планируете сделать?"
                  className="w-full px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-1">Описание</label>
                <textarea
                  value={formDesc}
                  onChange={(e) => setFormDesc(e.target.value)}
                  rows={3}
                  placeholder="Детали (необязательно)..."
                  className="w-full px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm resize-none"
                />
              </div>
            </div>
            {formError && (
              <div className="mt-4 p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
                {formError}
              </div>
            )}
            <div className="flex justify-end gap-2 mt-5">
              <button
                onClick={() => { setShowModal(false); setFormError(null); }}
                className="px-4 py-2 rounded-lg text-sm text-gray-400 hover:text-white hover:bg-white/5 transition"
              >
                Отмена
              </button>
              <button
                onClick={handleSave}
                className="px-4 py-2 rounded-lg text-sm font-medium bg-indigo-600 text-white hover:bg-indigo-500 transition"
              >
                {editingItem ? "Обновить" : "Создать"}
              </button>
            </div>
          </div>
        </div>
      )}
    </AppShell>
  );
}
