"use client";

import { useLocalStorage } from "@/lib/useLocalStorage";
import { Note } from "@/lib/types";
import { useState } from "react";

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
        <h1 className="text-2xl font-bold text-white">Interview Prep Notes</h1>
        <button
          onClick={() => setEditing(emptyNote())}
          className="bg-emerald-600 hover:bg-emerald-500 text-white px-4 py-2 rounded-lg text-sm font-medium"
        >
          + Add Note
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {notes.map((n) => (
          <div key={n.id} className="bg-neutral-950 border border-neutral-800 rounded-xl p-5 space-y-2">
            <div className="flex justify-between items-start">
              <h2 className="text-white font-semibold">{n.title}</h2>
              <span className="text-xs px-2 py-1 rounded-full bg-neutral-800 text-neutral-400">{n.category}</span>
            </div>
            <p className="text-sm text-neutral-400 whitespace-pre-wrap">{n.content}</p>
            <div className="flex gap-3 pt-2">
              <button onClick={() => setEditing(n)} className="text-xs text-neutral-500 hover:text-white">Edit</button>
              <button onClick={() => remove(n.id)} className="text-xs text-red-500 hover:text-red-400">Delete</button>
            </div>
          </div>
        ))}
        {notes.length === 0 && (
          <p className="text-neutral-500 text-sm col-span-2">No notes yet. Add your STAR answers, common questions, or company-specific prep.</p>
        )}
      </div>

      {editing && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center p-4 z-50">
          <div className="bg-neutral-950 border border-neutral-800 rounded-xl p-6 w-full max-w-lg space-y-3">
            <h2 className="text-white font-semibold text-lg">Note</h2>
            <input
              placeholder="Title"
              value={editing.title}
              onChange={(e) => setEditing({ ...editing, title: e.target.value })}
              className="w-full bg-neutral-900 border border-neutral-700 rounded-lg px-3 py-2 text-sm text-white"
            />
            <input
              placeholder="Category (e.g. STAR Answer, Technical, Company-specific)"
              value={editing.category}
              onChange={(e) => setEditing({ ...editing, category: e.target.value })}
              className="w-full bg-neutral-900 border border-neutral-700 rounded-lg px-3 py-2 text-sm text-white"
            />
            <textarea
              placeholder="Content"
              value={editing.content}
              onChange={(e) => setEditing({ ...editing, content: e.target.value })}
              rows={6}
              className="w-full bg-neutral-900 border border-neutral-700 rounded-lg px-3 py-2 text-sm text-white"
            />
            <div className="flex justify-end gap-2 pt-2">
              <button onClick={() => setEditing(null)} className="px-4 py-2 rounded-lg text-sm text-neutral-400 hover:text-white">
                Cancel
              </button>
              <button
                onClick={() => save(editing)}
                disabled={!editing.title}
                className="bg-emerald-600 hover:bg-emerald-500 disabled:opacity-40 text-white px-4 py-2 rounded-lg text-sm font-medium"
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
