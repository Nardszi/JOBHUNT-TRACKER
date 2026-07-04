"use client";

import { useLocalStorage } from "@/lib/useLocalStorage";
import { Note } from "@/lib/types";
import { seedNotes } from "@/lib/notesData";
import { useState, useMemo } from "react";
import { Plus, Pencil, Trash2, StickyNote, X } from "lucide-react";

const CATEGORIES = [
  "All",
  "Behavioral",
  "Web Fundamentals",
  "React",
  "PHP/Laravel",
  "Troubleshooting",
  "Networking",
] as const;

type CategoryFilter = (typeof CATEGORIES)[number];

function emptyNote(): Note {
  return {
    id: crypto.randomUUID(),
    title: "",
    content: "",
    category: "Behavioral",
    createdAt: new Date().toISOString().slice(0, 10),
  };
}

export default function NotesPage() {
  const [notes, setNotes] = useLocalStorage<Note[]>("jh_notes", seedNotes);
  const [viewing, setViewing] = useState<Note | null>(null);
  const [editing, setEditing] = useState<Note | null>(null);
  const [filter, setFilter] = useState<CategoryFilter>("All");
  const [search, setSearch] = useState("");

  const filtered = useMemo(() => {
    let result = notes;
    if (filter !== "All") {
      result = result.filter((n) => n.category === filter);
    }
    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter(
        (n) =>
          n.title.toLowerCase().includes(q) ||
          n.content.toLowerCase().includes(q) ||
          n.category.toLowerCase().includes(q)
      );
    }
    return result;
  }, [notes, filter, search]);

  const categoryCounts = useMemo(() => {
    const counts: Record<string, number> = { All: notes.length };
    for (const n of notes) {
      counts[n.category] = (counts[n.category] || 0) + 1;
    }
    return counts;
  }, [notes]);

  function save(n: Note) {
    setNotes((prev) => {
      const exists = prev.some((x) => x.id === n.id);
      return exists ? prev.map((x) => (x.id === n.id ? n : x)) : [...prev, n];
    });
    setEditing(null);
  }

  function remove(id: string) {
    setNotes((prev) => prev.filter((n) => n.id !== id));
    if (viewing?.id === id) setViewing(null);
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap justify-between items-center gap-3 animate-in">
        <div>
          <h1 className="text-2xl font-bold text-neutral-900 dark:text-white tracking-tight">
            Interview Prep Notes
          </h1>
          <p className="text-sm text-neutral-500 dark:text-neutral-400 mt-0.5">
            {notes.length} notes across {Object.keys(categoryCounts).length - 1} categories
          </p>
        </div>
        <button
          onClick={() => setEditing(emptyNote())}
          className="bg-emerald-600 hover:bg-emerald-500 text-white px-4 py-2 rounded-xl text-sm font-medium flex items-center gap-2 active:scale-95 transition-all duration-200"
        >
          <Plus size={16} /> Add Note
        </button>
      </div>

      {/* Search */}
      <div className="animate-in stagger-1">
        <input
          type="text"
          placeholder="Search notes..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full glass rounded-xl px-4 py-2.5 text-sm text-neutral-900 dark:text-white transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-violet-500/50"
        />
      </div>

      {/* Category Filter Pills */}
      <div className="flex flex-wrap gap-2 animate-in stagger-2">
        {CATEGORIES.map((cat) => (
          <button
            key={cat}
            onClick={() => setFilter(cat)}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all duration-200 active:scale-95 ${
              filter === cat
                ? "bg-violet-500 text-white"
                : "glass text-neutral-500 dark:text-neutral-400 hover:bg-white/[0.06] dark:hover:bg-white/[0.04]"
            }`}
          >
            {cat}
            <span className="ml-1 opacity-60">{categoryCounts[cat] || 0}</span>
          </button>
        ))}
      </div>

      {/* Notes Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {filtered.map((n, i) => (
          <div
            key={n.id}
            onClick={() => setViewing(n)}
            className={`glass rounded-2xl p-5 space-y-2 hover:scale-[1.02] transition-all duration-200 animate-in stagger-${(i % 6) + 1} cursor-pointer`}
          >
            <div className="flex justify-between items-start gap-2">
              <h2 className="text-neutral-900 dark:text-white font-semibold flex items-center gap-2 text-sm">
                <StickyNote size={14} className="text-emerald-400 shrink-0" />
                <span className="line-clamp-2">{n.title}</span>
              </h2>
              <span className="glass text-[11px] px-2 py-0.5 rounded-full text-neutral-500 dark:text-neutral-400 shrink-0">
                {n.category}
              </span>
            </div>
            <p className="text-xs text-neutral-500 dark:text-neutral-400 whitespace-pre-wrap line-clamp-6">
              {n.content}
            </p>
          </div>
        ))}
        {filtered.length === 0 && (
          <p className="text-neutral-500 text-sm col-span-2 flex items-center gap-2">
            <StickyNote size={16} />
            {search ? "No notes match your search." : "No notes in this category."}
          </p>
        )}
      </div>

      {/* View Modal */}
      {viewing && (
        <div
          className="fixed inset-0 bg-black/60 modal-backdrop flex items-center justify-center p-4 z-50"
          onClick={() => setViewing(null)}
        >
          <div
            className="glass rounded-2xl p-6 w-full max-w-lg max-h-[85vh] flex flex-col modal-content"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex justify-between items-start gap-3 mb-4">
              <div className="flex-1 min-w-0">
                <h2 className="text-neutral-900 dark:text-white font-semibold text-lg leading-snug">
                  {viewing.title}
                </h2>
                <span className="glass text-[11px] px-2 py-0.5 rounded-full text-neutral-500 dark:text-neutral-400 mt-1 inline-block">
                  {viewing.category}
                </span>
              </div>
              <button
                onClick={() => setViewing(null)}
                className="text-neutral-400 hover:text-neutral-900 dark:hover:text-white p-1 shrink-0 transition-colors"
              >
                <X size={18} />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto">
              <p className="text-sm text-neutral-600 dark:text-neutral-300 whitespace-pre-wrap leading-relaxed">
                {viewing.content}
              </p>
            </div>
            <div className="flex gap-3 pt-4 mt-4 border-t border-neutral-200 dark:border-white/[0.08]">
              <button
                onClick={() => {
                  setEditing(viewing);
                  setViewing(null);
                }}
                className="text-xs text-neutral-500 hover:text-neutral-900 dark:hover:text-white flex items-center gap-1 active:scale-95 transition-all duration-200"
              >
                <Pencil size={12} /> Edit
              </button>
              <button
                onClick={() => {
                  remove(viewing.id);
                }}
                className="text-xs text-red-500 hover:text-red-400 flex items-center gap-1 active:scale-95 transition-all duration-200"
              >
                <Trash2 size={12} /> Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Modal */}
      {editing && (
        <div
          className="fixed inset-0 bg-black/60 modal-backdrop flex items-center justify-center p-4 z-50"
          onClick={() => setEditing(null)}
        >
          <div
            className="glass rounded-2xl p-6 w-full max-w-lg max-h-[85vh] flex flex-col modal-content"
            onClick={(e) => e.stopPropagation()}
          >
            <h2 className="text-neutral-900 dark:text-white font-semibold text-lg flex items-center gap-2 mb-3">
              <StickyNote size={18} className="text-emerald-400" /> Note
            </h2>
            <div className="flex-1 overflow-y-auto space-y-3">
              <input
                placeholder="Title"
                value={editing.title}
                onChange={(e) => setEditing({ ...editing, title: e.target.value })}
                className="w-full glass rounded-xl px-3 py-2 text-sm text-neutral-900 dark:text-white transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-violet-500/50"
              />
              <select
                value={editing.category}
                onChange={(e) => setEditing({ ...editing, category: e.target.value })}
                className="w-full glass rounded-xl px-3 py-2 text-sm text-neutral-900 dark:text-white transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-violet-500/50"
              >
                {CATEGORIES.filter((c) => c !== "All").map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
              <textarea
                placeholder="Content"
                value={editing.content}
                onChange={(e) => setEditing({ ...editing, content: e.target.value })}
                rows={12}
                className="w-full glass rounded-xl px-3 py-2 text-sm text-neutral-900 dark:text-white transition-all duration-200 font-mono focus:outline-none focus:ring-2 focus:ring-violet-500/50"
              />
            </div>
            <div className="flex justify-end gap-2 pt-3 mt-3 border-t border-neutral-200 dark:border-white/[0.08]">
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
