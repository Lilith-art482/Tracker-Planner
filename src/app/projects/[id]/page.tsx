"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import AppShell from "@/components/AppShell";
import { useAuth } from "@/context/AuthContext";
import {
  getProject,
  updateProject,
  deleteProject,
  getTasks,
  createTask,
  updateTask,
  deleteTask,
} from "@/lib/db";
import type { Project, Task, Priority, TaskStatus } from "@/types";
import { cn } from "@/lib/cn";
import {
  ArrowLeft,
  Plus,
  Trash2,
  Pencil,
  MessageSquare,
  Check,
  X,
  GripVertical,
} from "lucide-react";
import { format } from "date-fns";
import { Skeleton } from "@/components/Skeleton";

const priorityColors: Record<Priority, string> = {
  low: "text-green-400 bg-green-400/10",
  medium: "text-yellow-400 bg-yellow-400/10",
  high: "text-red-400 bg-red-400/10",
};

export default function ProjectDetailPage() {
  const { user } = useAuth();
  const params = useParams();
  const router = useRouter();
  const uid = user?.uid;
  if (!uid) return null;
  const projectId = params.id as string;

  const [project, setProject] = useState<Project | null>(null);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [features, setFeatures] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Edit mode
  const [editing, setEditing] = useState(false);
  const [editName, setEditName] = useState("");
  const [editDesc, setEditDesc] = useState("");
  const [editNotes, setEditNotes] = useState("");

  // Features
  const [newFeature, setNewFeature] = useState("");

  // Task modal
  const [showTaskModal, setShowTaskModal] = useState(false);
  const [taskTitle, setTaskTitle] = useState("");
  const [taskDeadline, setTaskDeadline] = useState(new Date().toISOString().slice(0, 10));
  const [taskPriority, setTaskPriority] = useState<Priority>("medium");
  const [taskComment, setTaskComment] = useState("");
  const [formError, setFormError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const [p, t] = await Promise.all([
        getProject(uid, projectId),
        getTasks(uid, undefined, undefined, projectId),
      ]);
      setProject(p);
      setFeatures(p?.features || []);
      setTasks(t);
    } catch (err: any) {
      setError(err.message || "Ошибка загрузки данных");
      setProject(null);
      setTasks([]);
    } finally {
      setLoading(false);
    }
  }, [uid, projectId]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const startEditing = () => {
    if (!project) return;
    setEditName(project.name);
    setEditDesc(project.description);
    setEditNotes(project.notes || "");
    setEditing(true);
  };

  const saveProject = async () => {
    if (submitting || !editName.trim()) return;
    const prevProject = project;
    if (!project) return;
    setProject({
      ...project,
      name: editName,
      description: editDesc,
      notes: editNotes,
    });
    setEditing(false);
    setSubmitting(true);
    try {
      await updateProject(uid, projectId, {
        name: editName,
        description: editDesc,
        notes: editNotes,
      });
    } catch (err: any) {
      setProject(prevProject);
      setEditing(true);
      setError(err.message || "Ошибка");
    } finally {
      setSubmitting(false);
    }
  };

  const addFeature = async () => {
    if (!newFeature.trim()) return;
    const trimmed = newFeature.trim();
    const prev = features;
    setFeatures(prev => [...prev, trimmed]);
    setNewFeature("");
    try {
      await updateProject(uid, projectId, { features: [...prev, trimmed] });
    } catch {
      setFeatures(prev);
      setError("Ошибка при добавлении функции");
    }
  };

  const removeFeature = async (idx: number) => {
    const prev = features;
    setFeatures(prev => prev.filter((_, i) => i !== idx));
    try {
      await updateProject(uid, projectId, { features: prev.filter((_, i) => i !== idx) });
    } catch {
      setFeatures(prev);
      setError("Ошибка при удалении функции");
    }
  };

  const handleDeleteProject = async () => {
    router.push("/projects");
    try {
      await deleteProject(uid, projectId);
    } catch (err: any) {
      setError(err.message || "Ошибка");
    }
  };

  const addTask = async () => {
    if (submitting) return;
    setFormError(null);
    if (!taskTitle.trim()) return;
    const tempId = `temp_${Date.now()}`;
    const deadline = new Date(taskDeadline + "T12:00:00");
    const newTask: Task = {
      id: tempId,
      title: taskTitle,
      description: "",
      date: deadline,
      deadline,
      priority: taskPriority,
      comment: taskComment,
      status: "todo",
      projectId,
      planId: null,
      userId: uid,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    setShowTaskModal(false);
    setTasks(prev => [...prev, newTask]);
    setTaskTitle("");
    setTaskComment("");
    setSubmitting(true);
    try {
      const realId = await createTask(uid, {
        title: taskTitle,
        description: "",
        date: deadline,
        deadline,
        priority: taskPriority,
        comment: taskComment,
        status: "todo",
        projectId,
        planId: null,
        userId: uid,
      });
      setTasks(prev => prev.map(t => t.id === tempId ? { ...t, id: realId } : t));
    } catch (err: any) {
      setTasks(prev => prev.filter(t => t.id !== tempId));
      setFormError(err.message || "Ошибка");
    } finally {
      setSubmitting(false);
    }
  };

  const toggleTaskDone = async (task: Task) => {
    const nextStatus: TaskStatus = task.status === "done" ? "todo" : "done";
    setTasks(prev => prev.map(t => t.id === task.id ? { ...t, status: nextStatus } : t));
    try {
      await updateTask(uid, task.id, { status: nextStatus });
    } catch {
      setTasks(prev => prev.map(t => t.id === task.id ? { ...t, status: task.status } : t));
      setError("Ошибка при обновлении статуса");
    }
  };

  const removeTask = async (id: string) => {
    const prev = tasks;
    setTasks(prev => prev.filter(t => t.id !== id));
    try {
      await deleteTask(uid, id);
    } catch {
      setTasks(prev);
      setError("Ошибка при удалении задачи");
    }
  };

  if (loading) {
    return (
      <AppShell>
        <div className="max-w-4xl mx-auto space-y-4">
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-8 w-64" />
          <div className="grid gap-6 md:grid-cols-2">
            <div className="rounded-xl border border-slate-700/30 bg-slate-900/30 p-5 space-y-3">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-full" />
            </div>
            <div className="rounded-xl border border-slate-700/30 bg-slate-900/30 p-5 space-y-3">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-20 w-full" />
            </div>
          </div>
        </div>
      </AppShell>
    );
  }

  if (!project) {
    return (
      <AppShell>
        <div className="text-center py-20 text-gray-400">Проект не найден</div>
      </AppShell>
    );
  }

  return (
    <AppShell>
      <div className="max-w-4xl mx-auto">
        {error && (
          <div className="mb-4 p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
            {error}
          </div>
        )}

        {/* Back */}
        <button
          onClick={() => router.push("/projects")}
          className="flex items-center gap-1.5 text-sm text-gray-400 hover:text-white mb-4 transition"
        >
          <ArrowLeft className="w-4 h-4" />
          Назад к проектам
        </button>

        {/* Header */}
        <div className="flex items-start justify-between mb-6">
          {editing ? (
            <div className="flex-1 space-y-2">
              <input
                type="text"
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
                className="w-full text-2xl font-bold bg-transparent border-b border-white/10 text-white focus:outline-none focus:border-indigo-500 pb-1"
              />
              <textarea
                value={editDesc}
                onChange={(e) => setEditDesc(e.target.value)}
                rows={2}
                placeholder="Описание"
                className="w-full text-sm bg-transparent border border-white/10 rounded-lg px-3 py-2 text-gray-300 focus:outline-none focus:border-indigo-500 resize-none"
              />
            </div>
          ) : (
            <div>
              <h1 className="text-2xl font-bold text-white">{project.name}</h1>
              {project.description && (
                <p className="text-sm text-gray-400 mt-1">{project.description}</p>
              )}
            </div>
          )}
          <div className="flex items-center gap-2">
            {editing ? (
              <>
                <button
                  onClick={saveProject}
                  disabled={submitting}
                  className="p-2 rounded-lg bg-indigo-600 text-white hover:bg-indigo-500 transition disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {submitting ? <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <Check className="w-4 h-4" />}
                </button>
                <button
                  onClick={() => setEditing(false)}
                  className="p-2 rounded-lg hover:bg-white/5 text-gray-400 transition"
                >
                  <X className="w-4 h-4" />
                </button>
              </>
            ) : (
              <>
                <button
                  onClick={startEditing}
                  className="p-2 rounded-lg hover:bg-white/5 text-gray-400 hover:text-white transition"
                >
                  <Pencil className="w-4 h-4" />
                </button>
                <button
                  onClick={handleDeleteProject}
                  className="p-2 rounded-lg hover:bg-red-400/10 text-gray-400 hover:text-red-400 transition"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </>
            )}
          </div>
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          {/* Features */}
          <div className="rounded-xl border border-white/5 bg-white/[0.02] p-5">
            <h2 className="text-sm font-semibold text-gray-300 uppercase tracking-wider mb-3">Функции</h2>
            <ul className="space-y-1.5 mb-3">
              {features.map((f, i) => (
                <li key={i} className="flex items-center gap-2 text-sm text-gray-400 group/feat">
                  <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 flex-shrink-0" />
                  <span className="flex-1">{f}</span>
                  <button
                    onClick={() => removeFeature(i)}
                    className="opacity-0 group-hover/feat:opacity-100 p-0.5 hover:text-red-400 transition"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </li>
              ))}
            </ul>
            <div className="flex gap-2">
              <input
                type="text"
                value={newFeature}
                onChange={(e) => setNewFeature(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && addFeature()}
                placeholder="Добавить функцию..."
                className="flex-1 px-3 py-1.5 rounded-lg bg-white/5 border border-white/10 text-white placeholder-gray-500 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
              <button
                onClick={addFeature}
                className="p-1.5 rounded-lg bg-indigo-600 text-white hover:bg-indigo-500 transition"
              >
                <Plus className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Notes */}
          <div className="rounded-xl border border-white/5 bg-white/[0.02] p-5">
            <h2 className="text-sm font-semibold text-gray-300 uppercase tracking-wider mb-3">Заметки</h2>
            {editing ? (
              <textarea
                value={editNotes}
                onChange={(e) => setEditNotes(e.target.value)}
                rows={6}
                placeholder="Заметки проекта..."
                className="w-full px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-white placeholder-gray-500 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
              />
            ) : (
              <p className="text-sm text-gray-400 whitespace-pre-wrap">
                {project.notes || "Нет заметок"}
              </p>
            )}
          </div>
        </div>

        {/* Tasks */}
        <div className="mt-6 rounded-xl border border-white/5 bg-white/[0.02] p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-semibold text-gray-300 uppercase tracking-wider">
              Задачи ({tasks.length})
            </h2>
            <button
              onClick={() => setShowTaskModal(true)}
              className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-sm font-medium bg-indigo-600 text-white hover:bg-indigo-500 transition"
            >
              <Plus className="w-3.5 h-3.5" />
              Добавить задачу
            </button>
          </div>
          {tasks.length === 0 ? (
            <p className="text-sm text-gray-500 text-center py-6">Пока нет задач</p>
          ) : (
            <div className="space-y-2">
              {tasks.map((task) => (
                <div
                  key={task.id}
                  className={cn(
                    "flex items-center gap-3 rounded-lg border p-3 transition",
                    task.status === "done"
                      ? "border-green-500/20 bg-green-500/5"
                      : "border-white/5 bg-white/[0.02]"
                  )}
                >
                  <input
                    type="checkbox"
                    checked={task.status === "done"}
                    onChange={() => toggleTaskDone(task)}
                    className="accent-indigo-500 cursor-pointer"
                  />
                  <div className="flex-1 min-w-0">
                    <p
                      className={cn(
                        "text-sm",
                        task.status === "done" ? "text-gray-500 line-through" : "text-gray-200"
                      )}
                    >
                      {task.title}
                    </p>
                    <div className="flex items-center gap-2 mt-1">
                      <span className={cn("text-[10px] px-1.5 py-0.5 rounded font-medium", priorityColors[task.priority])}>
                        {task.priority === "low" ? "Низкий" : task.priority === "medium" ? "Средний" : "Высокий"}
                      </span>
                      <span className="text-[10px] text-gray-500">
                        {format(new Date(task.deadline), "MMM d")}
                      </span>
                      {task.comment && <MessageSquare className="w-3 h-3 text-gray-600" />}
                    </div>
                  </div>
                  <button
                    onClick={() => removeTask(task.id)}
                    className="p-1 hover:text-red-400 text-gray-500 transition"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Task modal */}
      {showTaskModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="w-full max-w-md rounded-xl bg-slate-800 border border-white/10 p-6 shadow-2xl">
            <h2 className="text-lg font-semibold text-white mb-4">Добавить задачу</h2>
            <div className="space-y-3">
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-1">Название</label>
                <input
                  type="text"
                  value={taskTitle}
                  onChange={(e) => setTaskTitle(e.target.value)}
                  placeholder="Название задачи"
                  className="w-full px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-1">Срок</label>
                <input
                  type="date"
                  value={taskDeadline}
                  onChange={(e) => setTaskDeadline(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-1">Приоритет</label>
                <div className="flex gap-2">
                  {(["low", "medium", "high"] as Priority[]).map((p) => (
                    <button
                      key={p}
                      onClick={() => setTaskPriority(p)}
                      className={cn(
                        "flex-1 px-3 py-1.5 rounded-lg text-xs font-medium border transition",
                        taskPriority === p
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
                  value={taskComment}
                  onChange={(e) => setTaskComment(e.target.value)}
                  rows={2}
                  placeholder="Комментарий..."
                  className="w-full px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm resize-none"
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
                onClick={() => { setShowTaskModal(false); setFormError(null); }}
                className="px-4 py-2 rounded-lg text-sm text-gray-400 hover:text-white hover:bg-white/5 transition"
              >
                Отмена
              </button>
              <button
                onClick={addTask}
                disabled={submitting}
                className="px-4 py-2 rounded-lg text-sm font-medium bg-indigo-600 text-white hover:bg-indigo-500 transition disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {submitting ? <span className="flex items-center gap-1.5"><span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />Сохранение...</span> : "Добавить"}
              </button>
            </div>
          </div>
        </div>
      )}
    </AppShell>
  );
}
