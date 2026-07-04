"use client";

import { useLocalStorage } from "@/lib/useLocalStorage";
import { defaultTasks, normalizeTask, dailyResetTasks } from "@/lib/planData";
import { Task } from "@/lib/types";
import { useState, useEffect, useCallback } from "react";

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

function getProgressColor(pct: number): string {
  if (pct >= 80) return "bg-emerald-500";
  if (pct >= 34) return "bg-amber-500";
  return "bg-rose-500";
}

function ProgressTask({ task, onIncrement, onDecrement, onReset }: {
  task: Task;
  onIncrement: () => void;
  onDecrement: () => void;
  onReset?: () => void;
}) {
  const current = task.current ?? 0;
  const target = task.target ?? 1;
  const pct = Math.min(100, Math.round((current / target) * 100));
  const done = task.completed;

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2">
        {done && <span className="text-emerald-500 text-sm">✓</span>}
        <span className={done ? "line-through text-neutral-400 dark:text-neutral-500" : "text-neutral-700 dark:text-neutral-200"}>
          {task.title}
        </span>
      </div>
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-1">
          <button
            onClick={onDecrement}
            disabled={current <= 0}
            className="w-9 h-9 flex items-center justify-center rounded-lg bg-neutral-100 dark:bg-neutral-800 border border-neutral-300 dark:border-neutral-700 text-neutral-600 dark:text-neutral-300 hover:bg-neutral-200 dark:hover:bg-neutral-700 disabled:opacity-30 disabled:cursor-not-allowed text-lg font-bold"
          >
            −
          </button>
          <span className="w-20 text-center text-sm font-medium text-neutral-900 dark:text-white">
            {current}/{target}
          </span>
          <button
            onClick={onIncrement}
            className="w-9 h-9 flex items-center justify-center rounded-lg bg-neutral-100 dark:bg-neutral-800 border border-neutral-300 dark:border-neutral-700 text-neutral-600 dark:text-neutral-300 hover:bg-neutral-200 dark:hover:bg-neutral-700 text-lg font-bold"
          >
            +
          </button>
        </div>
        {task.resetCadence === "none" && onReset && current > 0 && (
          <button
            onClick={onReset}
            className="text-xs text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-300"
          >
            reset
          </button>
        )}
      </div>
      <div className="w-full bg-neutral-200 dark:bg-neutral-800 rounded-full h-2">
        <div
          className={`h-2 rounded-full transition-all ${getProgressColor(pct)}`}
          style={{ width: `${pct}%` }}
        />
      </div>
      {task.resetCadence === "daily" && (
        <p className="text-xs text-neutral-400">resets tomorrow</p>
      )}
    </div>
  );
}

export default function PlanPage() {
  const [rawTasks, setRawTasks] = useLocalStorage<Task[]>("jh_tasks", defaultTasks);
  const [planStartDate, setPlanStartDate] = useLocalStorage<string>("jh_planStartDate", new Date().toISOString().slice(0, 10));
  const [tab, setTab] = useState<TabKey>("today");
  const [editingStart, setEditingStart] = useState(false);

  // Normalize tasks on first load and apply daily resets
  const [tasks, setTasks] = useState<Task[]>([]);
  const [initialized, setInitialized] = useState(false);

  useEffect(() => {
    const normalized = rawTasks.map(normalizeTask);
    const reset = dailyResetTasks(normalized);
    setTasks(reset);
    setInitialized(true);
    // Only run reset check if tasks changed
    if (JSON.stringify(reset) !== JSON.stringify(rawTasks)) {
      setRawTasks(reset);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const dayNumber = getDayNumber(planStartDate);
  const currentPhase = dayToPhase(dayNumber);

  const todayTasks = tasks
    .filter((t) => t.phase === currentPhase && !t.completed)
    .slice(0, 5);

  function toggleBinary(id: string) {
    setTasks((prev) =>
      prev.map((t) => (t.id === id ? { ...t, completed: !t.completed } : t))
    );
    setRawTasks((prev) =>
      prev.map((t) => (t.id === id ? { ...t, completed: !t.completed } : t))
    );
  }

  const incrementProgress = useCallback((id: string) => {
    setTasks((prev) =>
      prev.map((t) => {
        if (t.id !== id || t.kind !== "progress") return t;
        const next = (t.current ?? 0) + 1;
        const target = t.target ?? 1;
        return { ...t, current: next, completed: next >= target };
      })
    );
    setRawTasks((prev) =>
      prev.map((t) => {
        if (t.id !== id || t.kind !== "progress") return t;
        const next = (t.current ?? 0) + 1;
        const target = t.target ?? 1;
        return { ...t, current: next, completed: next >= target };
      })
    );
  }, [setRawTasks]);

  const decrementProgress = useCallback((id: string) => {
    setTasks((prev) =>
      prev.map((t) => {
        if (t.id !== id || t.kind !== "progress") return t;
        const next = Math.max(0, (t.current ?? 0) - 1);
        const target = t.target ?? 1;
        return { ...t, current: next, completed: next >= target };
      })
    );
    setRawTasks((prev) =>
      prev.map((t) => {
        if (t.id !== id || t.kind !== "progress") return t;
        const next = Math.max(0, (t.current ?? 0) - 1);
        const target = t.target ?? 1;
        return { ...t, current: next, completed: next >= target };
      })
    );
  }, [setRawTasks]);

  const resetProgress = useCallback((id: string) => {
    setTasks((prev) =>
      prev.map((t) => (t.id === id ? { ...t, current: 0, completed: false } : t))
    );
    setRawTasks((prev) =>
      prev.map((t) => (t.id === id ? { ...t, current: 0, completed: false } : t))
    );
  }, [setRawTasks]);

  const phaseTasks = tab !== "today" ? tasks.filter((t) => t.phase === tab) : [];
  const sections = tab !== "today" ? Array.from(new Set(phaseTasks.map((t) => t.section))) : [];

  if (!initialized) return null;

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
              <ul className="space-y-4">
                {todayTasks.map((t) => (
                  <li key={t.id}>
                    {t.kind === "progress" ? (
                      <ProgressTask
                        task={t}
                        onIncrement={() => incrementProgress(t.id)}
                        onDecrement={() => decrementProgress(t.id)}
                        onReset={() => resetProgress(t.id)}
                      />
                    ) : (
                      <div className="flex items-start gap-3">
                        <input
                          type="checkbox"
                          checked={t.completed}
                          onChange={() => toggleBinary(t.id)}
                          className="mt-1 h-4 w-4 accent-emerald-500"
                        />
                        <div>
                          <span className="text-neutral-700 dark:text-neutral-200">{t.title}</span>
                          <span className="ml-2 text-xs text-neutral-400">({t.section})</span>
                        </div>
                      </div>
                    )}
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
              <ul className="space-y-4">
                {phaseTasks
                  .filter((t) => t.section === section)
                  .map((t) => (
                    <li key={t.id}>
                      {t.kind === "progress" ? (
                        <ProgressTask
                          task={t}
                          onIncrement={() => incrementProgress(t.id)}
                          onDecrement={() => decrementProgress(t.id)}
                          onReset={() => resetProgress(t.id)}
                        />
                      ) : (
                        <div className="flex items-start gap-3">
                          <input
                            type="checkbox"
                            checked={t.completed}
                            onChange={() => toggleBinary(t.id)}
                            className="mt-1 h-4 w-4 accent-emerald-500"
                          />
                          <span className={t.completed ? "line-through text-neutral-400 dark:text-neutral-500" : "text-neutral-700 dark:text-neutral-200"}>
                            {t.title}
                          </span>
                        </div>
                      )}
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
