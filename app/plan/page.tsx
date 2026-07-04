"use client";

import { useLocalStorage } from "@/lib/useLocalStorage";
import { defaultTasks } from "@/lib/planData";
import { Task } from "@/lib/types";
import { useState } from "react";

const phases = [
  { key: "30", label: "Days 1-30" },
  { key: "60", label: "Days 31-60" },
  { key: "90", label: "Days 61-90" },
] as const;

export default function PlanPage() {
  const [tasks, setTasks] = useLocalStorage<Task[]>("jh_tasks", defaultTasks);
  const [tab, setTab] = useState<(typeof phases)[number]["key"]>("30");

  function toggle(id: string) {
    setTasks((prev) =>
      prev.map((t) => (t.id === id ? { ...t, completed: !t.completed } : t))
    );
  }

  const phaseTasks = tasks.filter((t) => t.phase === tab);
  const sections = Array.from(new Set(phaseTasks.map((t) => t.section)));

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-white">30-60-90 Day Plan</h1>

      <div className="flex gap-2 border-b border-neutral-800">
        {phases.map((p) => (
          <button
            key={p.key}
            onClick={() => setTab(p.key)}
            className={`px-4 py-2 text-sm font-medium ${
              tab === p.key
                ? "text-emerald-400 border-b-2 border-emerald-500"
                : "text-neutral-400 hover:text-white"
            }`}
          >
            {p.label}
          </button>
        ))}
      </div>

      <div className="space-y-6">
        {sections.map((section) => (
          <div key={section} className="bg-neutral-950 border border-neutral-800 rounded-xl p-5">
            <h2 className="text-white font-semibold mb-3">{section}</h2>
            <ul className="space-y-2">
              {phaseTasks
                .filter((t) => t.section === section)
                .map((t) => (
                  <li key={t.id} className="flex items-start gap-3">
                    <input
                      type="checkbox"
                      checked={t.completed}
                      onChange={() => toggle(t.id)}
                      className="mt-1 h-4 w-4 accent-emerald-500"
                    />
                    <span className={t.completed ? "line-through text-neutral-500" : "text-neutral-200"}>
                      {t.title}
                    </span>
                  </li>
                ))}
            </ul>
          </div>
        ))}
      </div>
    </div>
  );
}
