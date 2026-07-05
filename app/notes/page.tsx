"use client";

import { useLocalStorage } from "@/lib/useLocalStorage";
import { Note } from "@/lib/types";
import { seedNotes } from "@/lib/notesData";
import { useState, useMemo, useEffect, useRef } from "react";
import { Plus, Pencil, Trash2, StickyNote, X, Check, CheckCircle2, Circle, Download } from "lucide-react";

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
type PracticedFilter = "All" | "Practiced" | "Not Practiced";

function emptyNote(): Note {
  return {
    id: crypto.randomUUID(),
    title: "",
    content: "",
    category: "Behavioral",
    createdAt: new Date().toISOString().slice(0, 10),
    practiced: false,
  };
}

function ViewModal({
  note,
  onClose,
  onEdit,
  onDelete,
  onTogglePracticed,
}: {
  note: Note;
  onClose: () => void;
  onEdit: () => void;
  onDelete: () => void;
  onTogglePracticed: () => void;
}) {
  const backdropRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [onClose]);

  return (
    <div
      ref={backdropRef}
      className="fixed inset-0 bg-black/60 flex items-center justify-center p-4 z-50 animate-in"
      onMouseDown={(e) => {
        if (e.target === backdropRef.current) onClose();
      }}
    >
      <div className="bg-white dark:bg-neutral-900 rounded-2xl p-6 w-full max-w-lg max-h-[85vh] flex flex-col shadow-2xl border border-neutral-200 dark:border-white/[0.08] animate-in stagger-1">
        <div className="flex justify-between items-start gap-3 mb-4">
          <div className="flex-1 min-w-0">
            <h2 className="text-neutral-900 dark:text-white font-semibold text-lg leading-snug">
              {note.title}
            </h2>
            <span className="text-[11px] px-2 py-0.5 rounded-full bg-violet-500/10 text-violet-600 dark:text-violet-400 mt-1 inline-block">
              {note.category}
            </span>
            {note.practiced && note.lastPracticedAt && (
              <p className="text-[11px] text-neutral-400 dark:text-neutral-500 mt-1.5">
                Last practiced: {Math.floor((Date.now() - new Date(note.lastPracticedAt).getTime()) / 86400000)} days ago
              </p>
            )}
          </div>
          <button
            onClick={onClose}
            className="text-neutral-400 hover:text-neutral-900 dark:hover:text-white p-1 shrink-0 transition-colors"
          >
            <X size={18} />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto">
          <p className="text-sm text-neutral-600 dark:text-neutral-300 whitespace-pre-wrap leading-relaxed">
            {note.content}
          </p>
        </div>
        <div className="flex items-center gap-3 pt-4 mt-4 border-t border-neutral-200 dark:border-white/[0.08]">
          <button
            onClick={onTogglePracticed}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all duration-200 active:scale-95 ${
              note.practiced
                ? "bg-emerald-500/10 text-emerald-500 border border-emerald-500/20"
                : "bg-neutral-100 dark:bg-white/[0.06] text-neutral-500 dark:text-neutral-400 border border-neutral-200 dark:border-white/[0.08]"
            }`}
          >
            {note.practiced ? <CheckCircle2 size={14} /> : <Circle size={14} />}
            {note.practiced ? "Practiced" : "Mark as Practiced"}
          </button>
          <div className="flex-1" />
          <button
            onClick={onEdit}
            className="text-xs text-neutral-500 hover:text-neutral-900 dark:hover:text-white flex items-center gap-1 active:scale-95 transition-all duration-200"
          >
            <Pencil size={12} /> Edit
          </button>
          <button
            onClick={onDelete}
            className="text-xs text-red-500 hover:text-red-400 flex items-center gap-1 active:scale-95 transition-all duration-200"
          >
            <Trash2 size={12} /> Delete
          </button>
        </div>
      </div>
    </div>
  );
}

function EditModal({
  note,
  categories,
  onClose,
  onSave,
}: {
  note: Note;
  categories: readonly string[];
  onClose: () => void;
  onSave: (n: Note) => void;
}) {
  const [draft, setDraft] = useState(note);
  const backdropRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [onClose]);

  return (
    <div
      ref={backdropRef}
      className="fixed inset-0 bg-black/60 flex items-center justify-center p-4 z-50 animate-in"
      onMouseDown={(e) => {
        if (e.target === backdropRef.current) onClose();
      }}
    >
      <div className="bg-white dark:bg-neutral-900 rounded-2xl p-6 w-full max-w-lg max-h-[85vh] flex flex-col shadow-2xl border border-neutral-200 dark:border-white/[0.08] animate-in stagger-1">
        <h2 className="text-neutral-900 dark:text-white font-semibold text-lg flex items-center gap-2 mb-3">
          <StickyNote size={18} className="text-emerald-400" /> Note
        </h2>
        <div className="flex-1 overflow-y-auto space-y-3">
          <input
            placeholder="Title"
            value={draft.title}
            onChange={(e) => setDraft({ ...draft, title: e.target.value })}
            className="w-full rounded-xl px-3 py-2 text-sm text-neutral-900 dark:text-white bg-neutral-100 dark:bg-white/[0.06] border border-neutral-200 dark:border-white/[0.08] transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-violet-500/50"
          />
          <select
            value={draft.category}
            onChange={(e) => setDraft({ ...draft, category: e.target.value })}
            className="w-full rounded-xl px-3 py-2 text-sm text-neutral-900 dark:text-white bg-neutral-100 dark:bg-white/[0.06] border border-neutral-200 dark:border-white/[0.08] transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-violet-500/50"
          >
            {categories.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
          <textarea
            placeholder="Content"
            value={draft.content}
            onChange={(e) => setDraft({ ...draft, content: e.target.value })}
            rows={12}
            className="w-full rounded-xl px-3 py-2 text-sm text-neutral-900 dark:text-white bg-neutral-100 dark:bg-white/[0.06] border border-neutral-200 dark:border-white/[0.08] transition-all duration-200 font-mono focus:outline-none focus:ring-2 focus:ring-violet-500/50"
          />
        </div>
        <div className="flex justify-end gap-2 pt-3 mt-3 border-t border-neutral-200 dark:border-white/[0.08]">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-sm text-neutral-500 hover:text-neutral-900 dark:hover:text-white active:scale-95 transition-all duration-200"
          >
            Cancel
          </button>
          <button
            onClick={() => onSave(draft)}
            disabled={!draft.title}
            className="bg-emerald-600 hover:bg-emerald-500 disabled:opacity-40 text-white px-4 py-2 rounded-xl text-sm font-medium active:scale-95 transition-all duration-200"
          >
            Save
          </button>
        </div>
      </div>
    </div>
  );
}

export default function NotesPage() {
  const [notes, setNotes] = useLocalStorage<Note[]>("jh_notes", seedNotes);
  const [viewing, setViewing] = useState<Note | null>(null);
  const [editing, setEditing] = useState<Note | null>(null);
  const [filter, setFilter] = useState<CategoryFilter>("All");
  const [practicedFilter, setPracticedFilter] = useState<PracticedFilter>("All");
  const [search, setSearch] = useState("");

  const filtered = useMemo(() => {
    let result = notes;
    if (filter !== "All") {
      result = result.filter((n) => n.category === filter);
    }
    if (practicedFilter === "Practiced") {
      result = result.filter((n) => n.practiced);
    } else if (practicedFilter === "Not Practiced") {
      result = result.filter((n) => !n.practiced);
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
  }, [notes, filter, practicedFilter, search]);

  const categoryCounts = useMemo(() => {
    const counts: Record<string, number> = { All: notes.length };
    for (const n of notes) {
      counts[n.category] = (counts[n.category] || 0) + 1;
    }
    return counts;
  }, [notes]);

  const practicedCount = useMemo(() => notes.filter((n) => n.practiced).length, [notes]);
  const totalCount = notes.length;
  const progressPct = totalCount > 0 ? Math.round((practicedCount / totalCount) * 100) : 0;

  function save(n: Note) {
    setNotes((prev) => {
      const exists = prev.some((x) => x.id === n.id);
      return exists ? prev.map((x) => (x.id === n.id ? n : x)) : [...prev, n];
    });
    setEditing(null);
  }

  function togglePracticed(id: string) {
    setNotes((prev) =>
      prev.map((n) => {
        if (n.id !== id) return n;
        const newPracticed = !n.practiced;
        return { ...n, practiced: newPracticed, lastPracticedAt: newPracticed ? new Date().toISOString() : undefined };
      })
    );
  }

  function remove(id: string) {
    setNotes((prev) => prev.filter((n) => n.id !== id));
    if (viewing?.id === id) setViewing(null);
    if (editing?.id === id) setEditing(null);
  }

  function exportNotesAsMarkdown() {
    const lines: string[] = [`# Interview Prep Notes\n`];
    lines.push(`*Exported ${new Date().toISOString().slice(0, 10)}*\n`);
    const byCategory: Record<string, Note[]> = {};
    notes.forEach((n) => {
      if (!byCategory[n.category]) byCategory[n.category] = [];
      byCategory[n.category].push(n);
    });
    for (const [cat, catNotes] of Object.entries(byCategory)) {
      lines.push(`\n## ${cat}\n`);
      catNotes.forEach((n) => {
        lines.push(`### ${n.title}\n`);
        if (n.practiced) lines.push(`*Practiced on ${n.lastPracticedAt ? new Date(n.lastPracticedAt).toLocaleDateString() : "unknown date"}*\n`);
        lines.push(`${n.content}\n`);
        lines.push(`---\n`);
      });
    }
    const blob = new Blob([lines.join("\n")], { type: "text/markdown" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `interview-prep-notes-${new Date().toISOString().slice(0, 10)}.md`;
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap justify-between items-center gap-3 animate-in">
        <div>
          <h1 className="text-2xl font-bold text-neutral-900 dark:text-white tracking-tight">
            Interview Prep Notes
          </h1>
          <p className="text-sm text-neutral-500 dark:text-neutral-400 mt-0.5">
            {notes.length} notes across {Object.keys(categoryCounts).length - 1} categories
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={exportNotesAsMarkdown}
            className="glass hover:bg-white/[0.06] text-neutral-700 dark:text-neutral-300 px-4 py-2 rounded-xl text-sm font-medium flex items-center gap-2 active:scale-95 transition-all duration-200"
          >
            <Download size={16} /> Export MD
          </button>
          <button
            onClick={() => setEditing(emptyNote())}
            className="bg-emerald-600 hover:bg-emerald-500 text-white px-4 py-2 rounded-xl text-sm font-medium flex items-center gap-2 active:scale-95 transition-all duration-200"
          >
            <Plus size={16} /> Add Note
          </button>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="glass rounded-xl p-3 animate-in stagger-1">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs text-neutral-500 dark:text-neutral-400 font-medium">Practice Progress</span>
          <span className="text-xs text-neutral-700 dark:text-neutral-200 font-bold tabular-nums">
            {practicedCount} / {totalCount} ({progressPct}%)
          </span>
        </div>
        <div className="h-2 rounded-full bg-neutral-200 dark:bg-white/[0.06] overflow-hidden">
          <div
            className="h-full rounded-full bg-gradient-to-r from-emerald-500 to-emerald-400 transition-all duration-500"
            style={{ width: `${progressPct}%` }}
          />
        </div>
      </div>

      {/* Search + Filters Row */}
      <div className="flex flex-wrap items-center gap-3 animate-in stagger-1">
        <input
          type="text"
          placeholder="Search notes..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="flex-1 min-w-[200px] rounded-xl px-3 py-2 text-sm text-neutral-900 dark:text-white bg-neutral-100 dark:bg-white/[0.06] border border-neutral-200 dark:border-white/[0.08] transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-violet-500/50"
        />
        <div className="flex flex-wrap gap-1.5">
          {CATEGORIES.map((cat) => (
            <button
              key={cat}
              onClick={() => setFilter(cat)}
              className={`px-2.5 py-1 rounded-lg text-[11px] font-medium transition-all duration-200 active:scale-95 whitespace-nowrap ${
                filter === cat
                  ? "bg-violet-500 text-white"
                  : "bg-neutral-100 dark:bg-white/[0.06] text-neutral-500 dark:text-neutral-400 hover:bg-neutral-200 dark:hover:bg-white/[0.1] border border-neutral-200 dark:border-white/[0.08]"
              }`}
            >
              {cat} <span className="opacity-60">{categoryCounts[cat] || 0}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Practiced Filter */}
      <div className="flex gap-2 animate-in stagger-2">
        {(["All", "Practiced", "Not Practiced"] as PracticedFilter[]).map((pf) => (
          <button
            key={pf}
            onClick={() => setPracticedFilter(pf)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-medium transition-all duration-200 active:scale-95 ${
              practicedFilter === pf
                ? "bg-emerald-500/10 text-emerald-500 border border-emerald-500/20"
                : "bg-neutral-100 dark:bg-white/[0.06] text-neutral-500 dark:text-neutral-400 border border-neutral-200 dark:border-white/[0.08]"
            }`}
          >
            {pf === "Practiced" && <CheckCircle2 size={12} />}
            {pf === "Not Practiced" && <Circle size={12} />}
            {pf}
          </button>
        ))}
      </div>

      {/* Notes Grid — compact 3/4 columns */}
      <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-2.5">
        {filtered.map((n, i) => (
          <div
            key={n.id}
            className={`bg-white dark:bg-white/[0.04] rounded-xl p-3 border border-neutral-200 dark:border-white/[0.08] hover:bg-neutral-50 dark:hover:bg-white/[0.06] transition-all duration-200 animate-in stagger-${(i % 6) + 1} flex flex-col`}
          >
            <div
              className="cursor-pointer flex-1"
              onClick={() => setViewing(n)}
            >
              <div className="flex justify-between items-start gap-1.5 mb-1.5">
                <h2 className="text-neutral-900 dark:text-white font-medium text-xs leading-snug line-clamp-2">
                  {n.title}
                </h2>
                <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-violet-500/10 text-violet-600 dark:text-violet-400 shrink-0 leading-none">
                  {n.category}
                </span>
              </div>
              <p className="text-[11px] text-neutral-500 dark:text-neutral-400 whitespace-pre-wrap line-clamp-3 leading-relaxed">
                {n.content}
              </p>
              {!n.practiced && (() => {
                const lastDate = n.lastPracticedAt || n.createdAt;
                const daysSince = Math.floor((Date.now() - new Date(lastDate).getTime()) / 86400000);
                if (daysSince > 7) {
                  return (
                    <p className="text-[10px] text-amber-500/80 mt-1 italic">
                      Not practiced in {daysSince} days
                    </p>
                  );
                }
                return null;
              })()}
            </div>
            <div className="flex items-center justify-between pt-1.5 mt-1.5 border-t border-neutral-100 dark:border-white/[0.06]">
              <div className="flex gap-2">
                <button
                  onClick={() => setEditing(n)}
                  className="text-[11px] text-neutral-400 hover:text-neutral-900 dark:hover:text-white flex items-center gap-0.5 active:scale-95 transition-all duration-200"
                >
                  <Pencil size={10} /> Edit
                </button>
                <button
                  onClick={() => remove(n.id)}
                  className="text-[11px] text-red-400 hover:text-red-500 flex items-center gap-0.5 active:scale-95 transition-all duration-200"
                >
                  <Trash2 size={10} /> Del
                </button>
              </div>
              <button
                onClick={() => togglePracticed(n.id)}
                className={`text-[11px] flex items-center gap-0.5 active:scale-95 transition-all duration-200 ${
                  n.practiced
                    ? "text-emerald-500"
                    : "text-neutral-300 dark:text-neutral-600 hover:text-emerald-400"
                }`}
                title={n.practiced ? "Practiced" : "Mark as practiced"}
              >
                {n.practiced ? <CheckCircle2 size={13} /> : <Circle size={13} />}
              </button>
            </div>
          </div>
        ))}
        {filtered.length === 0 && (
          <p className="text-neutral-500 text-sm col-span-2 md:col-span-3 xl:col-span-4 flex items-center gap-2 py-8 justify-center">
            <StickyNote size={16} />
            {search ? "No notes match your search." : "No notes in this category."}
          </p>
        )}
      </div>

      {/* View Modal */}
      {viewing && (
        <ViewModal
          note={viewing}
          onClose={() => setViewing(null)}
          onEdit={() => {
            setEditing(viewing);
            setViewing(null);
          }}
          onDelete={() => remove(viewing.id)}
          onTogglePracticed={() => togglePracticed(viewing.id)}
        />
      )}

      {/* Edit Modal */}
      {editing && (
        <EditModal
          note={editing}
          categories={CATEGORIES.filter((c) => c !== "All")}
          onClose={() => setEditing(null)}
          onSave={save}
        />
      )}
    </div>
  );
}
