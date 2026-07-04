"use client";

import { useLocalStorage } from "@/lib/useLocalStorage";
import { Note } from "@/lib/types";
import { useState } from "react";
import { Plus, Pencil, Trash2, StickyNote } from "lucide-react";

function emptyNote(): Note {
  return {
    id: crypto.randomUUID(),
    title: "",
    content: "",
    category: "General",
    createdAt: new Date().toISOString().slice(0, 10),
  };
}

export default function NotesPage() {
  const [notes, setNotes] = useLocalStorage<Note[]>("jh_notes", []);
  const [editing, setEditing] = useState<Note | null>(null);

  function save(n: Note) {
    setNotes((prev) => {
      const exists = prev.some((x) => x.id === n.id);
      return exists ? prev.map((x) => (x.id === n.id ? n : x)) : [...prev, n];
    });
    setEditing(null);
  }

  function remove(id: string) {
    setNotes((prev) => prev.filter((n) => n.id !== id));
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-neutral-900 dark:text-white">Interview Prep Notes</h1>
        <button
          onClick={() => setEditing(emptyNote())}
          className="bg-emerald-600 hover:bg-emerald-500 text-white px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2 active:scale-95 transition-all duration-200"
        >
          <Plus size={16} /> Add Note
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {notes.map((n, i) => (
          <div
            key={n.id}
            className={`glass rounded-2xl p-5 space-y-2 hover:scale-[1.02] transition-all duration-200 animate-in stagger-${i + 1}`}
          >
            <div className="flex justify-between items-start">
              <h2 className="text-neutral-900 dark:text-white font-semibold flex items-center gap-2">
                <StickyNote size={16} className="text-emerald-400" />
                {n.title}
              </h2>
              <span className="glass text-xs px-2 py-1 rounded-full">{n.category}</span>
            </div>
            <p className="text-sm text-neutral-500 dark:text-neutral-400 whitespace-pre-wrap">{n.content}</p>
            <div className="flex gap-3 pt-2">
              <button
                onClick={() => setEditing(n)}
                className="text-xs text-neutral-500 hover:text-neutral-900 dark:hover:text-white flex items-center gap-1 active:scale-95 transition-all duration-200"
              >
                <Pencil size={12} /> Edit
              </button>
              <button
                onClick={() => remove(n.id)}
                className="text-xs text-red-500 hover:text-red-400 flex items-center gap-1 active:scale-95 transition-all duration-200"
              >
                <Trash2 size={12} /> Delete
              </button>
            </div>
          </div>
        ))}
        {notes.length === 0 && (
          <p className="text-neutral-500 text-sm col-span-2 flex items-center gap-2">
            <StickyNote size={16} /> No notes yet. Add your STAR answers, common questions, or company-specific prep.
          </p>
        )}
      </div>

      {editing && (
        <div className="fixed inset-0 modal-backdrop flex items-center justify-center p-4 z-50">
          <div className="glass rounded-2xl p-6 w-full max-w-lg space-y-3 modal-content">
            <h2 className="text-neutral-900 dark:text-white font-semibold text-lg flex items-center gap-2">
              <StickyNote size={18} className="text-emerald-400" /> Note
            </h2>
            <input
              placeholder="Title"
              value={editing.title}
              onChange={(e) => setEditing({ ...editing, title: e.target.value })}
              className="w-full glass rounded-xl px-3 py-2 text-sm text-neutral-900 dark:text-white transition-all duration-200"
            />
            <input
              placeholder="Category (e.g. STAR Answer, Technical, Company-specific)"
              value={editing.category}
              onChange={(e) => setEditing({ ...editing, category: e.target.value })}
              className="w-full glass rounded-xl px-3 py-2 text-sm text-neutral-900 dark:text-white transition-all duration-200"
            />
            <textarea
              placeholder="Content"
              value={editing.content}
              onChange={(e) => setEditing({ ...editing, content: e.target.value })}
              rows={6}
              className="w-full glass rounded-xl px-3 py-2 text-sm text-neutral-900 dark:text-white transition-all duration-200"
            />
            <div className="flex justify-end gap-2 pt-2">
              <button
                onClick={() => setEditing(null)}
                className="px-4 py-2 rounded-xl text-sm text-neutral-500 hover:text-neutral-900 dark:hover:text-white active:scale-95 transition-all duration-200"
              >
                Cancel
              </button>
              <button
                onClick={() => save(editing)}
                disabled={!editing.title}
                className="bg-emerald-600 hover:bg-emerald-500 disabled:opacity-40 text-white px-4 py-2 rounded-xl text-sm font-medium active:scale-95 transition-all duration-200"
              >
                Save
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
