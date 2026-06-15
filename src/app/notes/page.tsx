"use client";

import { useState, useEffect, useCallback } from "react";
import AppShell from "@/components/AppShell";
import { useAuth } from "@/context/AuthContext";
import { getNotes, createNote, updateNote, deleteNote } from "@/lib/db";
import type { Note } from "@/types";
import { cn } from "@/lib/cn";
import { Plus, Trash2, Pencil, StickyNote, X, Check } from "lucide-react";
import { format } from "date-fns";

export default function NotesPage() {
  const { user } = useAuth();
  const uid = user?.uid;
  if (!uid) return null;

  const [notes, setNotes] = useState<Note[]>([]);
  const [loading, setLoading] = useState(true);

  // Create
  const [showCreate, setShowCreate] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [newContent, setNewContent] = useState("");

  // Edit
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState("");
  const [editContent, setEditContent] = useState("");

  const fetchNotes = useCallback(async () => {
    setLoading(true);
    const data = await getNotes(uid);
    setNotes(data);
    setLoading(false);
  }, [uid]);

  useEffect(() => {
    fetchNotes();
  }, [fetchNotes]);

  const handleCreate = async () => {
    if (!newTitle.trim()) return;
    await createNote(uid, {
      title: newTitle,
      content: newContent,
      userId: uid,
    });
    setShowCreate(false);
    setNewTitle("");
    setNewContent("");
    fetchNotes();
  };

  const startEdit = (note: Note) => {
    setEditingId(note.id);
    setEditTitle(note.title);
    setEditContent(note.content);
  };

  const handleUpdate = async () => {
    if (!editingId || !editTitle.trim()) return;
    await updateNote(uid, editingId, {
      title: editTitle,
      content: editContent,
    });
    setEditingId(null);
    fetchNotes();
  };

  const handleDelete = async (id: string) => {
    await deleteNote(uid, id);
    fetchNotes();
  };

  return (
    <AppShell>
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold text-white">Заметки</h1>
          <button
            onClick={() => setShowCreate(true)}
            className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium bg-indigo-600 text-white hover:bg-indigo-500 transition"
          >
            <Plus className="w-4 h-4" />
            Новая заметка
          </button>
        </div>

        {loading ? (
          <div className="flex justify-center py-20">
            <div className="w-6 h-6 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : notes.length === 0 && !showCreate ? (
          <div className="text-center py-20 text-gray-500">
            <StickyNote className="w-12 h-12 mx-auto mb-3 opacity-50" />
            <p className="text-sm">Пока нет заметок</p>
            <button
              onClick={() => setShowCreate(true)}
              className="mt-3 text-sm text-indigo-400 hover:text-indigo-300 transition"
            >
              Напишите первую заметку
            </button>
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2">
            {notes.map((note) => (
              <div
                key={note.id}
                className="rounded-xl border border-white/5 bg-white/[0.02] p-5 group"
              >
                {editingId === note.id ? (
                  <div className="space-y-2">
                    <input
                      type="text"
                      value={editTitle}
                      onChange={(e) => setEditTitle(e.target.value)}
                      className="w-full text-sm font-semibold bg-transparent border-b border-white/10 text-white focus:outline-none focus:border-indigo-500 pb-1"
                    />
                    <textarea
                      value={editContent}
                      onChange={(e) => setEditContent(e.target.value)}
                      rows={4}
                      className="w-full text-sm bg-transparent border border-white/10 rounded-lg px-3 py-2 text-gray-300 focus:outline-none focus:border-indigo-500 resize-none"
                    />
                    <div className="flex justify-end gap-2">
                      <button
                        onClick={() => setEditingId(null)}
                        className="p-1.5 rounded-lg hover:bg-white/5 text-gray-400 transition"
                      >
                        <X className="w-4 h-4" />
                      </button>
                      <button
                        onClick={handleUpdate}
                        className="p-1.5 rounded-lg bg-indigo-600 text-white hover:bg-indigo-500 transition"
                      >
                        <Check className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ) : (
                  <>
                    <div className="flex items-start justify-between mb-2">
                      <h3 className="font-semibold text-white text-sm">{note.title}</h3>
                      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition">
                        <button
                          onClick={() => startEdit(note)}
                          className="p-1 hover:text-white text-gray-500 transition"
                        >
                          <Pencil className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleDelete(note.id)}
                          className="p-1 hover:text-red-400 text-gray-500 transition"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                    <p className="text-sm text-gray-400 whitespace-pre-wrap line-clamp-4">
                      {note.content || "Нет содержимого"}
                    </p>
                    <p className="text-[10px] text-gray-600 mt-3">
                      {format(new Date(note.createdAt), "MMM d, yyyy")}
                    </p>
                  </>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Create modal */}
      {showCreate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="w-full max-w-lg rounded-xl bg-slate-800 border border-white/10 p-6 shadow-2xl">
            <h2 className="text-lg font-semibold text-white mb-4">Новая заметка</h2>
            <div className="space-y-3">
              <div>
                <input
                  type="text"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  placeholder="Название заметки"
                  className="w-full px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm"
                />
              </div>
              <div>
                <textarea
                  value={newContent}
                  onChange={(e) => setNewContent(e.target.value)}
                  rows={6}
                  placeholder="Напишите что-нибудь..."
                  className="w-full px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm resize-none"
                />
              </div>
            </div>
            <div className="flex justify-end gap-2 mt-5">
              <button
                onClick={() => setShowCreate(false)}
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
