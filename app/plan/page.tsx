"use client";

import { useLocalStorage } from "@/lib/useLocalStorage";
import { defaultTasks } from "@/lib/planData";
import { Task } from "@/lib/types";
import { useState, useMemo } from "react";

const phases = [
  { key: "today", label: "Today" },
  { key: "30", label: "Days 1-30" },
  { key: "60", label: "Days 31-60" },
  { key: "90", label: "Days 61-90" },
] as const;

type TabKey = (typeof phases)[number]["key"];

function getDayNumber(startDate: string): number {
  const start = new Date(startDate);
  const now = new Date();
  const diff = Math.floor((now.getTime() - start.getTime()) / 86400000) + 1;
  return Math.max(1, diff);
}

function dayToPhase(day: number): "30" | "60" | "90" {
  if (day <= 30) return "30";
  if (day <= 60) return "60";
  return "90";
}

export default function PlanPage() {
  const [tasks, setTasks] = useLocalStorage<Task[]>("jh_tasks", defaultTasks);
  const [planStartDate, setPlanStartDate] = useLocalStorage<string>("jh_planStartDate", new Date().toISOString().slice(0, 10));
  const [tab, setTab] = useState<TabKey>("today");
  const [editingStart, setEditingStart] = useState(false);

  const dayNumber = useMemo(() => getDayNumber(planStartDate), [planStartDate]);
  const currentPhase = dayToPhase(dayNumber);

  const todayTasks = useMemo(() => {
    const phaseTasks = tasks.filter((t) => t.phase === currentPhase);
    const incomplete = phaseTasks.filter((t) => !t.completed);
    return incomplete.slice(0, 5);
  }, [tasks, currentPhase]);

  function toggle(id: string) {
    setTasks((prev) =>
      prev.map((t) => (t.id === id ? { ...t, completed: !t.completed } : t))
    );
  }

  const phaseTasks = tab !== "today" ? tasks.filter((t) => t.phase === tab) : [];
  const sections = tab !== "today" ? Array.from(new Set(phaseTasks.map((t) => t.section))) : [];

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-neutral-900 dark:text-white">30-60-90 Day Plan</h1>
          <p className="text-sm text-neutral-500 dark:text-neutral-400 mt-1">
            Day {dayNumber} of 90 · Phase: {currentPhase === "30" ? "Days 1-30" : currentPhase === "60" ? "Days 31-60" : "Days 61-90"}
          </p>
        </div>
        <div className="flex items-center gap-2">
          {editingStart ? (
            <div className="flex items-center gap-2">
              <input
                type="date"
                value={planStartDate}
                onChange={(e) => setPlanStartDate(e.target.value)}
                className="bg-neutral-100 dark:bg-neutral-900 border border-neutral-300 dark:border-neutral-700 rounded-lg px-3 py-1 text-sm text-neutral-900 dark:text-white"
              />
              <button
                onClick={() => setEditingStart(false)}
                className="text-xs text-emerald-600 dark:text-emerald-400 hover:underline"
              >
                Done
              </button>
            </div>
          ) : (
            <button
              onClick={() => setEditingStart(true)}
              className="text-xs text-neutral-500 hover:text-neutral-900 dark:hover:text-white"
            >
              Start: {planStartDate} ✏️
            </button>
          )}
        </div>
      </div>

      <div className="flex gap-2 border-b border-neutral-200 dark:border-neutral-800 overflow-x-auto">
        {phases.map((p) => (
          <button
            key={p.key}
            onClick={() => setTab(p.key)}
            className={`px-4 py-2 text-sm font-medium whitespace-nowrap ${
              tab === p.key
                ? "text-emerald-600 dark:text-emerald-400 border-b-2 border-emerald-500"
                : "text-neutral-500 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white"
            }`}
          >
            {p.label}
          </button>
        ))}
      </div>

      {tab === "today" ? (
        <div className="space-y-6">
          {todayTasks.length > 0 ? (
            <div className="bg-white dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-800 rounded-xl p-5">
              <h2 className="text-neutral-900 dark:text-white font-semibold mb-3">
                Today&apos;s focus
              </h2>
              <ul className="space-y-2">
                {todayTasks.map((t) => (
                  <li key={t.id} className="flex items-start gap-3">
                    <input
                      type="checkbox"
                      checked={t.completed}
                      onChange={() => toggle(t.id)}
                      className="mt-1 h-4 w-4 accent-emerald-500"
                    />
                    <div>
                      <span className="text-neutral-700 dark:text-neutral-200">{t.title}</span>
                      <span className="ml-2 text-xs text-neutral-400">({t.section})</span>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          ) : (
            <div className="bg-white dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-800 rounded-xl p-8 text-center">
              <p className="text-neutral-500 dark:text-neutral-400">
                {dayNumber > 90
                  ? "You've completed the 90-day plan! Time to evaluate your progress."
                  : "All tasks for today are done. Great work!"}
              </p>
            </div>
          )}
        </div>
      ) : (
        <div className="space-y-6">
          {sections.map((section) => (
            <div key={section} className="bg-white dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-800 rounded-xl p-5">
              <h2 className="text-neutral-900 dark:text-white font-semibold mb-3">{section}</h2>
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
                      <span className={t.completed ? "line-through text-neutral-400 dark:text-neutral-500" : "text-neutral-700 dark:text-neutral-200"}>
                        {t.title}
                      </span>
                    </li>
                  ))}
              </ul>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
