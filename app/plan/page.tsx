"use client";

import { useLocalStorage } from "@/lib/useLocalStorage";
import { defaultTasks, normalizeTask, dailyResetTasks } from "@/lib/planData";
import { Task } from "@/lib/types";
import { useState, useMemo, useCallback } from "react";
import { Check, Minus, Plus, RotateCcw } from "lucide-react";

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
  if (pct >= 80) return "from-emerald-500 to-emerald-400";
  if (pct >= 34) return "from-amber-500 to-amber-400";
  return "from-rose-500 to-rose-400";
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
    <div className="space-y-2.5">
      <div className="flex items-center gap-2">
        {done && (
          <span className="w-5 h-5 rounded-full bg-emerald-500/20 flex items-center justify-center">
            <Check size={12} className="text-emerald-500" />
          </span>
        )}
        <span className={`text-sm transition-all duration-200 ${done ? "line-through text-neutral-400 dark:text-neutral-500" : "text-neutral-700 dark:text-neutral-200"}`}>
          {task.title}
        </span>
      </div>
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-1">
          <button
            onClick={onDecrement}
            disabled={current <= 0}
            className="w-9 h-9 flex items-center justify-center rounded-xl glass text-neutral-600 dark:text-neutral-300 hover:bg-neutral-200/50 dark:hover:bg-white/[0.08] active:scale-95 disabled:opacity-30 disabled:cursor-not-allowed transition-all duration-150"
          >
            <Minus size={14} />
          </button>
          <span className="w-20 text-center text-sm font-medium text-neutral-900 dark:text-white tabular-nums animate-count-up" key={current}>
            {current}/{target}
          </span>
          <button
            onClick={onIncrement}
            className="w-9 h-9 flex items-center justify-center rounded-xl glass text-neutral-600 dark:text-neutral-300 hover:bg-neutral-200/50 dark:hover:bg-white/[0.08] active:scale-95 transition-all duration-150"
          >
            <Plus size={14} />
          </button>
        </div>
        {task.resetCadence === "none" && onReset && current > 0 && (
          <button
            onClick={onReset}
            className="text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-300 transition-colors p-1"
            title="Reset counter"
          >
            <RotateCcw size={12} />
          </button>
        )}
      </div>
      <div className="w-full bg-neutral-200 dark:bg-white/[0.06] rounded-full h-1.5 overflow-hidden">
        <div
          className={`h-1.5 rounded-full bg-gradient-to-r ${getProgressColor(pct)} transition-all duration-500 ease-out`}
          style={{ width: `${pct}%` }}
        />
      </div>
      {task.resetCadence === "daily" && (
        <p className="text-[11px] text-neutral-400 tracking-wide">resets tomorrow</p>
      )}
    </div>
  );
}

export default function PlanPage() {
  const [rawTasks, setRawTasks] = useLocalStorage<Task[]>("jh_tasks", defaultTasks);
  const [planStartDate, setPlanStartDate] = useLocalStorage<string>("jh_planStartDate", new Date().toISOString().slice(0, 10));
  const [tab, setTab] = useState<TabKey>("today");
  const [editingStart, setEditingStart] = useState(false);

  // Derive normalized tasks directly from rawTasks — no separate local state
  const tasks = useMemo(() => {
    const normalized = rawTasks.map(normalizeTask);
    return dailyResetTasks(normalized);
  }, [rawTasks]);

  const dayNumber = getDayNumber(planStartDate);
  const currentPhase = dayToPhase(dayNumber);

  const todayTasks = tasks
    .filter((t) => t.phase === currentPhase && !t.completed)
    .slice(0, 5);

  const toggleBinary = useCallback((id: string) => {
    setRawTasks((prev) =>
      prev.map((t) => (t.id === id ? { ...t, completed: !t.completed } : t))
    );
  }, [setRawTasks]);

  const updateProgress = useCallback((id: string, delta: number) => {
    setRawTasks((prev) =>
      prev.map((t) => {
        if (t.id !== id || t.kind !== "progress") return t;
        const next = Math.max(0, (t.current ?? 0) + delta);
        const target = t.target ?? 1;
        return { ...t, current: next, completed: next >= target };
      })
    );
  }, [setRawTasks]);

  const resetProgress = useCallback((id: string) => {
    setRawTasks((prev) =>
      prev.map((t) => (t.id === id ? { ...t, current: 0, completed: false } : t))
    );
  }, [setRawTasks]);

  const phaseTasks = tab !== "today" ? tasks.filter((t) => t.phase === tab) : [];
  const sections = tab !== "today" ? Array.from(new Set(phaseTasks.map((t) => t.section))) : [];

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3 animate-in">
        <div>
          <h1 className="text-2xl font-bold text-neutral-900 dark:text-white tracking-tight">30-60-90 Day Plan</h1>
          <p className="text-sm text-neutral-500 dark:text-neutral-400 mt-0.5">
            Day <span className="font-medium text-violet-600 dark:text-violet-400 tabular-nums">{dayNumber}</span> of 90 · Phase: {currentPhase === "30" ? "Days 1-30" : currentPhase === "60" ? "Days 31-60" : "Days 61-90"}
          </p>
        </div>
        <div className="flex items-center gap-2">
          {editingStart ? (
            <div className="flex items-center gap-2">
              <input
                type="date"
                value={planStartDate}
                onChange={(e) => setPlanStartDate(e.target.value)}
                className="glass rounded-xl px-3 py-1.5 text-sm text-neutral-900 dark:text-white"
              />
              <button
                onClick={() => setEditingStart(false)}
                className="text-xs text-violet-600 dark:text-violet-400 hover:underline"
              >
                Done
              </button>
            </div>
          ) : (
            <button
              onClick={() => setEditingStart(true)}
              className="text-xs text-neutral-400 hover:text-neutral-900 dark:hover:text-white transition-colors"
            >
              Start: {planStartDate} ✏️
            </button>
          )}
        </div>
      </div>

      <div className="flex gap-1 border-b border-neutral-200 dark:border-white/[0.08] overflow-x-auto">
        {phases.map((p) => (
          <button
            key={p.key}
            onClick={() => setTab(p.key)}
            className={`px-4 py-2.5 text-sm font-medium whitespace-nowrap transition-all duration-200 relative ${
              tab === p.key
                ? "text-violet-600 dark:text-violet-400"
                : "text-neutral-500 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white"
            }`}
          >
            {p.label}
            {tab === p.key && (
              <span className="absolute bottom-0 left-0 right-0 h-[2px] bg-gradient-to-r from-violet-500 to-violet-400 rounded-full" />
            )}
          </button>
        ))}
      </div>

      {tab === "today" ? (
        <div className="space-y-4">
          {todayTasks.length > 0 ? (
            <div className="glass rounded-2xl p-5 animate-in">
              <h2 className="text-neutral-900 dark:text-white font-semibold mb-4 flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                Today&apos;s focus
              </h2>
              <ul className="space-y-4">
                {todayTasks.map((t, i) => (
                  <li key={t.id} className={`animate-in stagger-${i + 1}`}>
                    {t.kind === "progress" ? (
                      <ProgressTask
                        task={t}
                        onIncrement={() => updateProgress(t.id, 1)}
                        onDecrement={() => updateProgress(t.id, -1)}
                        onReset={() => resetProgress(t.id)}
                      />
                    ) : (
                      <div className="flex items-start gap-3 group">
                        <button
                          onClick={() => toggleBinary(t.id)}
                          className={`mt-0.5 w-5 h-5 rounded-lg border-2 flex items-center justify-center transition-all duration-200 active:scale-90 ${
                            t.completed
                              ? "bg-emerald-500 border-emerald-500"
                              : "border-neutral-300 dark:border-white/[0.2] group-hover:border-violet-400"
                          }`}
                        >
                          {t.completed && <Check size={12} className="text-white" />}
                        </button>
                        <div>
                          <span className={`text-sm transition-all duration-200 ${t.completed ? "line-through text-neutral-400 dark:text-neutral-500" : "text-neutral-700 dark:text-neutral-200"}`}>
                            {t.title}
                          </span>
                          <span className="ml-2 text-[11px] text-neutral-400">({t.section})</span>
                        </div>
                      </div>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          ) : (
            <div className="glass rounded-2xl p-8 text-center animate-in">
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
          {sections.map((section, si) => (
            <div key={section} className={`glass rounded-2xl p-5 animate-in stagger-${si + 1}`}>
              <h2 className="text-neutral-900 dark:text-white font-semibold mb-4">{section}</h2>
              <ul className="space-y-4">
                {phaseTasks
                  .filter((t) => t.section === section)
                  .map((t, i) => (
                    <li key={t.id} className={`animate-in stagger-${i + 1}`}>
                      {t.kind === "progress" ? (
                        <ProgressTask
                          task={t}
                          onIncrement={() => updateProgress(t.id, 1)}
                          onDecrement={() => updateProgress(t.id, -1)}
                          onReset={() => resetProgress(t.id)}
                        />
                      ) : (
                        <div className="flex items-start gap-3 group">
                          <button
                            onClick={() => toggleBinary(t.id)}
                            className={`mt-0.5 w-5 h-5 rounded-lg border-2 flex items-center justify-center transition-all duration-200 active:scale-90 ${
                              t.completed
                                ? "bg-emerald-500 border-emerald-500"
                                : "border-neutral-300 dark:border-white/[0.2] group-hover:border-violet-400"
                            }`}
                          >
                            {t.completed && <Check size={12} className="text-white" />}
                          </button>
                          <span className={`text-sm transition-all duration-200 ${t.completed ? "line-through text-neutral-400 dark:text-neutral-500" : "text-neutral-700 dark:text-neutral-200"}`}>
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
