"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import AppShell from "@/components/AppShell";
import { useAuth } from "@/context/AuthContext";
import { getProjects, createProject, deleteProject } from "@/lib/db";
import type { Project } from "@/types";
import { cn } from "@/lib/cn";
import { Plus, FolderKanban, Trash2, Pencil, ArrowRight } from "lucide-react";

export default function ProjectsPage() {
  const { user } = useAuth();
  const router = useRouter();
  const uid = user?.uid;
  if (!uid) return null;

  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [formName, setFormName] = useState("");
  const [formDesc, setFormDesc] = useState("");

  const fetchProjects = useCallback(async () => {
    setLoading(true);
    const data = await getProjects(uid);
    setProjects(data);
    setLoading(false);
  }, [uid]);

  useEffect(() => {
    fetchProjects();
  }, [fetchProjects]);

  const handleCreate = async () => {
    if (!formName.trim()) return;
    await createProject(uid, {
      name: formName,
      description: formDesc,
      features: [],
      notes: "",
      userId: uid,
    });
    setShowModal(false);
    setFormName("");
    setFormDesc("");
    fetchProjects();
  };

  const handleDelete = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    await deleteProject(uid, id);
    fetchProjects();
  };

  return (
    <AppShell>
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold text-white">Проекты</h1>
          <button
            onClick={() => setShowModal(true)}
            className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium bg-indigo-600 text-white hover:bg-indigo-500 transition"
          >
            <Plus className="w-4 h-4" />
            Новый проект
          </button>
        </div>

        {loading ? (
          <div className="flex justify-center py-20">
            <div className="w-6 h-6 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : projects.length === 0 ? (
          <div className="text-center py-20 text-gray-500">
            <FolderKanban className="w-12 h-12 mx-auto mb-3 opacity-50" />
            <p className="text-sm">Пока нет проектов</p>
            <button
              onClick={() => setShowModal(true)}
              className="mt-3 text-sm text-indigo-400 hover:text-indigo-300 transition"
            >
              Создайте первый проект
            </button>
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {projects.map((project) => (
              <div
                key={project.id}
                onClick={() => router.push(`/projects/${project.id}`)}
                className="group rounded-xl border border-white/5 bg-white/[0.02] p-5 cursor-pointer hover:bg-white/[0.04] hover:border-white/10 transition"
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-lg bg-indigo-500/15 flex items-center justify-center">
                      <FolderKanban className="w-4 h-4 text-indigo-400" />
                    </div>
                    <h3 className="font-semibold text-white">{project.name}</h3>
                  </div>
                  <button
                    onClick={(e) => handleDelete(project.id, e)}
                    className="opacity-0 group-hover:opacity-100 p-1 hover:text-red-400 transition"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
                <p className="text-sm text-gray-400 line-clamp-2 mb-3">
                  {project.description || "Нет описания"}
                </p>
                <div className="flex items-center justify-between">
                  <span className="text-xs text-gray-500">
                    {project.features?.length || 0} функций
                  </span>
                  <ArrowRight className="w-4 h-4 text-gray-600 group-hover:text-indigo-400 transition" />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Create modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="w-full max-w-md rounded-xl bg-slate-800 border border-white/10 p-6 shadow-2xl">
            <h2 className="text-lg font-semibold text-white mb-4">Новый проект</h2>
            <div className="space-y-3">
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-1">Название</label>
                <input
                  type="text"
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  placeholder="Название проекта"
                  className="w-full px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-1">Описание</label>
                <textarea
                  value={formDesc}
                  onChange={(e) => setFormDesc(e.target.value)}
                  rows={3}
                  placeholder="О чём этот проект?"
                  className="w-full px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm resize-none"
                />
              </div>
            </div>
            <div className="flex justify-end gap-2 mt-5">
              <button
                onClick={() => setShowModal(false)}
                className="px-4 py-2 rounded-lg text-sm text-gray-400 hover:text-white hover:bg-white/5 transition"
              >
                Отмена
              </button>
              <button
                onClick={handleCreate}
                className="px-4 py-2 rounded-lg text-sm font-medium bg-indigo-600 text-white hover:bg-indigo-500 transition"
              >
                Создать
              </button>
            </div>
          </div>
        </div>
      )}
    </AppShell>
  );
}
