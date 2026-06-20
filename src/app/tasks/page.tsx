"use client";

import { useState, useEffect } from "react";
import AppShell from "@/components/AppShell";
import { useAuth } from "@/context/AuthContext";
import { getTasks, createTask, updateTask, deleteTask } from "@/lib/db";
import type { Task, Priority, TaskStatus } from "@/types";
import {
  getWeekDays,
  getWeekStart,
  formatDate,
  addWeeks,
  subWeeks,
  isSameDay,
  format,
} from "@/lib/dates";
import { cn } from "@/lib/cn";
import {
  Plus,
  ChevronLeft,
  ChevronRight,
  Pencil,
  Trash2,
  Flag,
  MessageSquare,
  CalendarDays,
} from "lucide-react";
import { TaskGridSkeleton } from "@/components/Skeleton";

const priorityColors: Record<Priority, string> = {
  low: "text-green-400 bg-green-400/10",
  medium: "text-yellow-400 bg-yellow-400/10",
  high: "text-red-400 bg-red-400/10",
};

export default function TasksPage() {
  const { user } = useAuth();
  const uid = user?.uid;
  if (!uid) return null;

  const [currentDate, setCurrentDate] = useState(new Date());
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // Modal
  const [showModal, setShowModal] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [formDate, setFormDate] = useState<Date>(new Date());
  const [formTitle, setFormTitle] = useState("");
  const [formDesc, setFormDesc] = useState("");
  const [formDeadline, setFormDeadline] = useState<Date>(new Date());
  const [formPriority, setFormPriority] = useState<Priority>("medium");
  const [formComment, setFormComment] = useState("");
  const [formStatus, setFormStatus] = useState<TaskStatus>("todo");
  const [formError, setFormError] = useState<string | null>(null);

  const days = getWeekDays(currentDate);

  useEffect(() => {
    if (!uid) {
      setLoading(false);
      return;
    }
    let cancelled = false;
    setLoading(true);
    setError(null);
    (async () => {
      try {
        const weekDays = getWeekDays(currentDate);
        const from = weekDays[0];
        const to = weekDays[weekDays.length - 1];
        const data = await getTasks(uid, from, to);
        if (cancelled) return;
        setTasks(data);
      } catch (err: any) {
        if (!cancelled) {
          setError(err.message || "Ошибка загрузки данных");
          setTasks([]);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [uid, currentDate]);

  const tasksForDay = (day: Date) =>
    tasks.filter((t) => isSameDay(new Date(t.date), day));

  const openAdd = (day: Date) => {
    setEditingTask(null);
    setFormDate(day);
    setFormTitle("");
    setFormDesc("");
    setFormDeadline(day);
    setFormPriority("medium");
    setFormComment("");
    setFormStatus("todo");
    setShowModal(true);
  };

  const openEdit = (task: Task) => {
    setEditingTask(task);
    setFormDate(new Date(task.date));
    setFormTitle(task.title);
    setFormDesc(task.description);
    setFormDeadline(new Date(task.deadline));
    setFormPriority(task.priority);
    setFormComment(task.comment);
    setFormStatus(task.status);
    setShowModal(true);
  };

  const handleSave = async () => {
    if (submitting || !formTitle.trim()) return;
    setFormError(null);
    if (editingTask) {
      const updated: Task = {
        ...editingTask,
        title: formTitle,
        description: formDesc,
        date: formDate,
        deadline: formDeadline,
        priority: formPriority,
        comment: formComment,
        status: formStatus,
      };
      setTasks(prev => prev.map(t => t.id === editingTask.id ? updated : t));
      setShowModal(false);
      setSubmitting(true);
      try {
        await updateTask(uid, editingTask.id, {
          title: formTitle,
          description: formDesc,
          date: formDate,
          deadline: formDeadline,
          priority: formPriority,
          comment: formComment,
          status: formStatus,
        });
      } catch {
        setTasks(prev => prev.map(t => t.id === editingTask.id ? editingTask : t));
        setFormError("Ошибка при обновлении");
      } finally {
        setSubmitting(false);
      }
    } else {
      const tempId = `temp_${Date.now()}`;
      const newTask: Task = {
        id: tempId,
        title: formTitle,
        description: formDesc,
        date: formDate,
        deadline: formDeadline,
        priority: formPriority,
        comment: formComment,
        status: formStatus,
        projectId: null,
        planId: null,
        userId: uid,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      setShowModal(false);
      setTasks(prev => [newTask, ...prev]);
      setSubmitting(true);
      try {
        const realId = await createTask(uid, {
          title: formTitle,
          description: formDesc,
          date: formDate,
          deadline: formDeadline,
          priority: formPriority,
          comment: formComment,
          status: formStatus,
          projectId: null,
          planId: null,
          userId: uid,
        });
        setTasks(prev => prev.map(t => t.id === tempId ? { ...t, id: realId } : t));
      } catch (err: any) {
        setTasks(prev => prev.filter(t => t.id !== tempId));
        setFormError(err.message || "Ошибка при создании");
      } finally {
        setSubmitting(false);
      }
    }
  };

  const handleDelete = async (id: string) => {
    const prev = tasks;
    setTasks(prev => prev.filter(t => t.id !== id));
    try {
      await deleteTask(uid, id);
    } catch {
      setTasks(prev);
      setError("Ошибка при удалении");
    }
  };

  const handleToggleStatus = async (task: Task) => {
    const nextStatus: TaskStatus = task.status === "done" ? "todo" : "done";
    setTasks(prev => prev.map(t => t.id === task.id ? { ...t, status: nextStatus } : t));
    try {
      await updateTask(uid, task.id, { status: nextStatus });
    } catch {
      setTasks(prev => prev.map(t => t.id === task.id ? { ...t, status: task.status } : t));
      setError("Ошибка при обновлении статуса");
    }
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
          <h1 className="text-2xl font-bold text-white">Задачи</h1>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1">
              <button
                onClick={() => setCurrentDate(subWeeks(currentDate, 1))}
                className="p-1.5 rounded-lg hover:bg-white/5 text-gray-400 hover:text-white transition"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
              <span className="text-sm text-gray-300 font-medium min-w-[180px] text-center">
                {formatDate(days[0], "MMM d")} – {formatDate(days[days.length - 1], "MMM d, yyyy")}
              </span>
              <button
                onClick={() => setCurrentDate(addWeeks(currentDate, 1))}
                className="p-1.5 rounded-lg hover:bg-white/5 text-gray-400 hover:text-white transition"
              >
                <ChevronRight className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>

        {loading ? (
          <TaskGridSkeleton />
        ) : (
          /* Day columns */
          <div className="grid grid-cols-7 gap-2">
            {["Пн", "Вт", "Ср", "Чт", "Пт", "Сб", "Вс"].map((d) => (
              <div key={d} className="text-xs font-semibold text-gray-500 uppercase tracking-wider text-center py-2">
                {d}
              </div>
            ))}
            {days.map((day) => {
              const dayTasks = tasksForDay(day);
              const isToday = isSameDay(day, today);
              return (
                <div
                  key={day.toISOString()}
                  className={cn(
                    "min-h-[200px] md:min-h-[300px] rounded-lg border p-2 transition group",
                    isToday
                      ? "border-indigo-500/50 bg-indigo-500/5"
                      : "border-white/5 bg-white/[0.02]"
                  )}
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className={cn("text-xs font-medium", isToday ? "text-indigo-400" : "text-gray-500")}>
                      {formatDate(day, "d")}
                    </span>
                    <button
                      onClick={() => openAdd(day)}
                      className="opacity-0 group-hover:opacity-100 p-0.5 rounded hover:bg-white/10 text-gray-500 hover:text-white transition"
                    >
                      <Plus className="w-3.5 h-3.5" />
                    </button>
                  </div>
                  <div className="space-y-1.5">
                    {dayTasks.map((task) => (
                      <div
                        key={task.id}
                        className={cn(
                          "group/task rounded-lg border p-2 cursor-pointer transition",
                          task.status === "done"
                            ? "border-green-500/20 bg-green-500/5"
                            : "border-white/5 bg-white/[0.03] hover:bg-white/[0.06]"
                        )}
                        onClick={() => openEdit(task)}
                      >
                        <div className="flex items-start gap-2">
                          <input
                            type="checkbox"
                            checked={task.status === "done"}
                            onChange={(e) => {
                              e.stopPropagation();
                              handleToggleStatus(task);
                            }}
                            className="mt-0.5 accent-indigo-500 cursor-pointer"
                          />
                          <div className="flex-1 min-w-0">
                            <p
                              className={cn(
                                "text-xs font-medium truncate",
                                task.status === "done" ? "text-gray-500 line-through" : "text-gray-200"
                              )}
                            >
                              {task.title}
                            </p>
                            <div className="flex items-center gap-1.5 mt-1">
                              <span className={cn("text-[10px] px-1.5 py-0.5 rounded font-medium", priorityColors[task.priority])}>
                                {task.priority === "low" ? "Низкий" : task.priority === "medium" ? "Средний" : "Высокий"}
                              </span>
                              {task.comment && (
                                <MessageSquare className="w-3 h-3 text-gray-600" />
                              )}
                            </div>
                          </div>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDelete(task.id);
                            }}
                            className="opacity-0 group-hover/task:opacity-100 p-0.5 hover:text-red-400 transition flex-shrink-0"
                          >
                            <Trash2 className="w-3 h-3" />
                          </button>
                        </div>
                      </div>
                    ))}
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
          <div className="w-full max-w-lg rounded-xl bg-slate-800 border border-white/10 p-6 shadow-2xl max-h-[90vh] overflow-y-auto">
            <h2 className="text-lg font-semibold text-white mb-4">
              {editingTask ? "Редактировать задачу" : "Новая задача"}
            </h2>
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-1">Дата</label>
                  <input
                    type="date"
                    value={format(formDate, "yyyy-MM-dd")}
                    onChange={(e) => setFormDate(new Date(e.target.value + "T12:00:00"))}
                    className="w-full px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-1">Срок</label>
                  <input
                    type="date"
                    value={format(formDeadline, "yyyy-MM-dd")}
                    onChange={(e) => setFormDeadline(new Date(e.target.value + "T12:00:00"))}
                    className="w-full px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-1">Название</label>
                <input
                  type="text"
                  value={formTitle}
                  onChange={(e) => setFormTitle(e.target.value)}
                  placeholder="Название задачи"
                  className="w-full px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-1">Описание</label>
                <textarea
                  value={formDesc}
                  onChange={(e) => setFormDesc(e.target.value)}
                  rows={2}
                  placeholder="Описание (необязательно)..."
                  className="w-full px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm resize-none"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-1">Приоритет</label>
                <div className="flex gap-2">
                  {(["low", "medium", "high"] as Priority[]).map((p) => (
                    <button
                      key={p}
                      onClick={() => setFormPriority(p)}
                      className={cn(
                        "flex-1 px-3 py-1.5 rounded-lg text-xs font-medium border transition",
                        formPriority === p
                          ? "border-indigo-500 bg-indigo-500/20 text-indigo-300"
                          : "border-white/10 text-gray-400 hover:border-white/20"
                      )}
                    >
                      {p === "low" ? "Низкий" : p === "medium" ? "Средний" : "Высокий"}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-1">Комментарий</label>
                <textarea
                  value={formComment}
                  onChange={(e) => setFormComment(e.target.value)}
                  rows={2}
                  placeholder="Заметка или комментарий..."
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
                disabled={submitting}
                className="px-4 py-2 rounded-lg text-sm font-medium bg-indigo-600 text-white hover:bg-indigo-500 transition disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {submitting ? <span className="flex items-center gap-1.5"><span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />Сохранение...</span> : (editingTask ? "Обновить" : "Создать")}
              </button>
            </div>
          </div>
        </div>
      )}
    </AppShell>
  );
}
