"use client";

import { useLocalStorage } from "@/lib/useLocalStorage";
import { defaultProjects } from "@/lib/planData";
import { Project } from "@/lib/types";
import { useState } from "react";
import { ExternalLink, Code2, Pencil } from "lucide-react";

export default function PortfolioPage() {
  const [projects, setProjects] = useLocalStorage<Project[]>("jh_projects", defaultProjects);
  const [editing, setEditing] = useState<Project | null>(null);

  function save(p: Project) {
    setProjects((prev) => prev.map((x) => (x.id === p.id ? p : x)));
    setEditing(null);
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-neutral-900 dark:text-white">Portfolio Projects</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {projects.map((p, i) => (
          <div
            key={p.id}
            className={`glass rounded-2xl p-5 space-y-3 hover:scale-[1.02] transition-all duration-200 animate-in stagger-${i + 1}`}
          >
            <div className="flex justify-between items-start">
              <h2 className="text-neutral-900 dark:text-white font-semibold">{p.name}</h2>
              <span className="glass text-xs px-2 py-1 rounded-full text-neutral-600 dark:text-neutral-300">
                {p.status}
              </span>
            </div>
            <p className="text-sm text-neutral-500 dark:text-neutral-400">{p.description}</p>
            <div className="flex flex-wrap gap-1.5">
              {p.techStack.map((t) => (
                <span key={t} className="glass text-xs px-2 py-0.5 rounded-lg text-neutral-600 dark:text-neutral-300">
                  {t}
                </span>
              ))}
            </div>
            <div className="flex gap-4 text-sm">
              {p.liveUrl ? (
                <a
                  href={p.liveUrl}
                  target="_blank"
                  className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400 hover:underline transition-all duration-200"
                >
                  <ExternalLink size={14} />
                  Live
                </a>
              ) : (
                <span className="text-neutral-400">Not deployed yet</span>
              )}
              {p.githubUrl && (
                <a
                  href={p.githubUrl}
                  target="_blank"
                  className="flex items-center gap-1 text-neutral-500 dark:text-neutral-400 hover:underline transition-all duration-200"
                >
                  <Code2 size={14} />
                  GitHub
                </a>
              )}
            </div>
            <button
              onClick={() => setEditing(p)}
              className="flex items-center gap-1 text-xs text-neutral-500 hover:text-neutral-900 dark:hover:text-white active:scale-95 transition-all duration-200"
            >
              <Pencil size={12} />
              Edit links / details
            </button>
          </div>
        ))}
      </div>

      {editing && (
        <div className="modal-backdrop fixed inset-0 bg-black/60 flex items-center justify-center p-4 z-50">
          <div className="modal-content glass rounded-2xl p-6 w-full max-w-lg space-y-3">
            <h2 className="text-neutral-900 dark:text-white font-semibold text-lg">Edit {editing.name}</h2>
            <textarea
              value={editing.description}
              onChange={(e) => setEditing({ ...editing, description: e.target.value })}
              rows={3}
              className="w-full glass rounded-xl px-3 py-2 text-sm text-neutral-900 dark:text-white transition-all duration-200"
            />
            <input
              placeholder="Live URL"
              value={editing.liveUrl}
              onChange={(e) => setEditing({ ...editing, liveUrl: e.target.value })}
              className="w-full glass rounded-xl px-3 py-2 text-sm text-neutral-900 dark:text-white transition-all duration-200"
            />
            <input
              placeholder="GitHub URL"
              value={editing.githubUrl}
              onChange={(e) => setEditing({ ...editing, githubUrl: e.target.value })}
              className="w-full glass rounded-xl px-3 py-2 text-sm text-neutral-900 dark:text-white transition-all duration-200"
            />
            <input
              placeholder="Status"
              value={editing.status}
              onChange={(e) => setEditing({ ...editing, status: e.target.value })}
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
                className="bg-emerald-600 hover:bg-emerald-500 text-white px-4 py-2 rounded-xl text-sm font-medium active:scale-95 transition-all duration-200"
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
