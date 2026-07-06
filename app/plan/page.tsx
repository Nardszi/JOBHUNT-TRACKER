"use client";

import { useLocalStorage } from "@/lib/useLocalStorage";
import { defaultTasks, normalizeTask, dailyResetTasks } from "@/lib/planData";
import { Task, Application } from "@/lib/types";
import { useState, useMemo, useCallback, useEffect, useRef } from "react";
import dynamic from "next/dynamic";
import {
  Check,
  Minus,
  Plus,
  RotateCcw,
  Trash2,
  ChevronDown,
  ChevronUp,
  MessageSquare,
  GripVertical,
  PartyPopper,
  AlertTriangle,
} from "lucide-react";

const PlanScene3D = dynamic(() => import("@/components3d/PlanScene3D"), { ssr: false });

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

function getFollowUpCount(apps: Application[]): number {
  const today = new Date().toISOString().slice(0, 10);
  return apps.filter(
    (a) =>
      a.followUpDate &&
      a.followUpDate <= today &&
      a.status !== "Offer" &&
      a.status !== "Rejected"
  ).length;
}

function CelebrationModal({
  phase,
  onNext,
  onDismiss,
}: {
  phase: string;
  onNext: () => void;
  onDismiss: () => void;
}) {
  const label = phase === "30" ? "Days 1-30" : phase === "60" ? "Days 31-60" : "Days 61-90";
  const nextLabel = phase === "30" ? "Days 31-60" : phase === "60" ? "Days 61-90" : null;

  return (
    <div className="fixed inset-0 bg-black/50 modal-backdrop flex items-center justify-center p-4 z-50 animate-in">
      <div className="bg-white dark:bg-neutral-900 rounded-2xl p-6 w-full max-w-sm text-center shadow-2xl border border-neutral-200 dark:border-white/[0.08] modal-content animate-in stagger-1">
        <PartyPopper size={40} className="mx-auto text-amber-400 mb-3" />
        <h2 className="text-lg font-bold text-neutral-900 dark:text-white mb-2">
          {label} complete!
        </h2>
        <p className="text-sm text-neutral-500 dark:text-neutral-400 mb-4">
          Great work! You&apos;ve finished all tasks in this phase.
          {nextLabel && ` Ready to move into ${nextLabel}?`}
        </p>
        <div className="flex justify-center gap-3">
          {nextLabel && (
            <button
              onClick={onNext}
              className="bg-violet-600 hover:bg-violet-500 text-white px-4 py-2 rounded-xl text-sm font-medium active:scale-95 transition-all duration-200"
            >
              Go to {nextLabel}
            </button>
          )}
          <button
            onClick={onDismiss}
            className="px-4 py-2 rounded-xl text-sm text-neutral-500 hover:text-neutral-900 dark:hover:text-white active:scale-95 transition-all duration-200"
          >
            Dismiss
          </button>
        </div>
      </div>
    </div>
  );
}

function AddTaskModal({
  phase,
  sections,
  onClose,
  onAdd,
}: {
  phase: string;
  sections: string[];
  onClose: () => void;
  onAdd: (task: Task) => void;
}) {
  const [title, setTitle] = useState("");
  const [section, setSection] = useState(sections[0] || "");
  const [newSection, setNewSection] = useState("");
  const [kind, setKind] = useState<"binary" | "progress">("binary");
  const [target, setTarget] = useState(5);
  const backdropRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [onClose]);

  function handleAdd() {
    const finalSection = newSection.trim() || section;
    if (!title.trim() || !finalSection) return;

    const task: Task = {
      id: `custom-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      phase: phase as Task["phase"],
      section: finalSection,
      title: title.trim(),
      completed: false,
      custom: true,
      kind,
      ...(kind === "progress" ? { target, current: 0 } : {}),
    };
    onAdd(task);
    onClose();
  }

  return (
    <div
      ref={backdropRef}
      className="fixed inset-0 bg-black/50 modal-backdrop flex items-center justify-center p-4 z-50 animate-in"
      onMouseDown={(e) => {
        if (e.target === backdropRef.current) onClose();
      }}
    >
      <div className="bg-white dark:bg-neutral-900 rounded-2xl p-6 w-full max-w-md shadow-2xl border border-neutral-200 dark:border-white/[0.08] modal-content animate-in stagger-1">
        <h2 className="text-lg font-bold text-neutral-900 dark:text-white mb-4">Add Task</h2>
        <div className="space-y-3">
          <div>
            <label className="text-xs text-neutral-500">Title</label>
            <input
              autoFocus
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleAdd()}
              placeholder="e.g. Apply to 5 remote jobs"
              className="w-full rounded-xl px-3 py-2 text-sm text-neutral-900 dark:text-white bg-neutral-100 dark:bg-white/[0.06] border border-neutral-200 dark:border-white/[0.08] focus:outline-none focus:ring-2 focus:ring-violet-500/50 transition-all duration-200"
            />
          </div>
          <div>
            <label className="text-xs text-neutral-500">Section</label>
            {sections.length > 0 && !newSection && (
              <select
                value={section}
                onChange={(e) => setSection(e.target.value)}
                className="w-full rounded-xl px-3 py-2 text-sm text-neutral-900 dark:text-white bg-neutral-100 dark:bg-white/[0.06] border border-neutral-200 dark:border-white/[0.08] focus:outline-none focus:ring-2 focus:ring-violet-500/50 transition-all duration-200 mt-1"
              >
                {sections.map((s) => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
            )}
            <input
              value={newSection}
              onChange={(e) => setNewSection(e.target.value)}
              placeholder={sections.length > 0 ? "Or type new section name" : "Section name"}
              className="w-full rounded-xl px-3 py-2 text-sm text-neutral-900 dark:text-white bg-neutral-100 dark:bg-white/[0.06] border border-neutral-200 dark:border-white/[0.08] focus:outline-none focus:ring-2 focus:ring-violet-500/50 transition-all duration-200 mt-1"
            />
          </div>
          <div>
            <label className="text-xs text-neutral-500">Type</label>
            <div className="flex gap-2 mt-1">
              <button
                onClick={() => setKind("binary")}
                className={`flex-1 px-3 py-2 rounded-xl text-sm font-medium transition-all duration-200 ${
                  kind === "binary"
                    ? "bg-violet-500 text-white"
                    : "bg-neutral-100 dark:bg-white/[0.06] text-neutral-500 border border-neutral-200 dark:border-white/[0.08]"
                }`}
              >
                Checklist
              </button>
              <button
                onClick={() => setKind("progress")}
                className={`flex-1 px-3 py-2 rounded-xl text-sm font-medium transition-all duration-200 ${
                  kind === "progress"
                    ? "bg-violet-500 text-white"
                    : "bg-neutral-100 dark:bg-white/[0.06] text-neutral-500 border border-neutral-200 dark:border-white/[0.08]"
                }`}
              >
                Counter
              </button>
            </div>
          </div>
          {kind === "progress" && (
            <div>
              <label className="text-xs text-neutral-500">Target</label>
              <input
                type="number"
                min={1}
                value={target}
                onChange={(e) => setTarget(Math.max(1, parseInt(e.target.value) || 1))}
                className="w-full rounded-xl px-3 py-2 text-sm text-neutral-900 dark:text-white bg-neutral-100 dark:bg-white/[0.06] border border-neutral-200 dark:border-white/[0.08] focus:outline-none focus:ring-2 focus:ring-violet-500/50 transition-all duration-200 mt-1"
              />
            </div>
          )}
        </div>
        <div className="flex justify-end gap-2 pt-4">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-sm text-neutral-500 hover:text-neutral-900 dark:hover:text-white active:scale-95 transition-all duration-200"
          >
            Cancel
          </button>
          <button
            onClick={handleAdd}
            disabled={!title.trim() || (!newSection.trim() && !section)}
            className="bg-emerald-600 hover:bg-emerald-500 disabled:opacity-40 text-white px-4 py-2 rounded-xl text-sm font-medium active:scale-95 transition-all duration-200"
          >
            Add Task
          </button>
        </div>
      </div>
    </div>
  );
}

function TaskRow({
  task,
  followUpCount,
  onToggle,
  onIncrement,
  onDecrement,
  onReset,
  onDelete,
  onNoteChange,
  onDragStart,
  onDragOver,
  onDrop,
}: {
  task: Task;
  followUpCount?: number;
  onToggle: () => void;
  onIncrement?: () => void;
  onDecrement?: () => void;
  onReset?: () => void;
  onDelete?: () => void;
  onNoteChange?: (note: string) => void;
  onDragStart?: () => void;
  onDragOver?: (e: React.DragEvent) => void;
  onDrop?: (e: React.DragEvent) => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const done = task.completed;
  const hasNote = !!(task.note && task.note.trim());
  const isFollowUpTask =
    task.title.toLowerCase().includes("follow up") &&
    task.title.toLowerCase().includes("application");

  if (task.kind === "progress") {
    const current = task.current ?? 0;
    const target = task.target ?? 1;
    const pct = Math.min(100, Math.round((current / target) * 100));

    return (
      <div
        draggable
        onDragStart={onDragStart}
        onDragOver={onDragOver}
        onDrop={onDrop}
        className="group relative"
      >
        <div className="absolute left-0 top-0 bottom-0 w-6 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-grab active:cursor-grabbing">
          <GripVertical size={14} className="text-neutral-300 dark:text-neutral-600" />
        </div>
        <div className="pl-6 space-y-2">
          <div className="flex items-center gap-2">
            {done && (
              <span className="w-5 h-5 rounded-full bg-emerald-500/20 flex items-center justify-center shrink-0">
                <Check size={12} className="text-emerald-500" />
              </span>
            )}
            <span className={`text-sm transition-all duration-200 ${done ? "line-through text-neutral-400 dark:text-neutral-500" : "text-neutral-700 dark:text-neutral-200"}`}>
              {task.title}
              {isFollowUpTask && followUpCount !== undefined && followUpCount > 0 && (
                <span className="ml-2 text-[11px] px-1.5 py-0.5 rounded-full bg-amber-500/15 text-amber-600 dark:text-amber-400 font-medium">
                  {followUpCount} need follow-up
                </span>
              )}
            </span>
            {hasNote && !expanded && (
              <MessageSquare size={12} className="text-violet-400 shrink-0" />
            )}
            {task.custom && onDelete && (
              <button
                onClick={onDelete}
                className="ml-auto opacity-0 group-hover:opacity-100 text-neutral-300 hover:text-red-400 transition-all p-0.5"
                title="Delete task"
              >
                <Trash2 size={13} />
              </button>
            )}
          </div>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1">
              <button
                onClick={onDecrement}
                disabled={current <= 0}
                className="w-8 h-8 flex items-center justify-center rounded-lg bg-neutral-100 dark:bg-white/[0.06] text-neutral-600 dark:text-neutral-300 hover:bg-neutral-200 dark:hover:bg-white/[0.1] active:scale-95 disabled:opacity-30 disabled:cursor-not-allowed transition-all duration-150 border border-neutral-200 dark:border-white/[0.08]"
              >
                <Minus size={13} />
              </button>
              <span className="w-16 text-center text-sm font-medium text-neutral-900 dark:text-white tabular-nums" key={current}>
                {current}/{target}
              </span>
              <button
                onClick={onIncrement}
                className="w-8 h-8 flex items-center justify-center rounded-lg bg-neutral-100 dark:bg-white/[0.06] text-neutral-600 dark:text-neutral-300 hover:bg-neutral-200 dark:hover:bg-white/[0.1] active:scale-95 transition-all duration-150 border border-neutral-200 dark:border-white/[0.08]"
              >
                <Plus size={13} />
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
            <button
              onClick={() => setExpanded(!expanded)}
              className="text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-300 transition-colors p-1"
              title={expanded ? "Collapse note" : "Add note"}
            >
              {expanded ? <ChevronUp size={13} /> : <MessageSquare size={13} />}
            </button>
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
          {expanded && (
            <textarea
              value={task.note || ""}
              onChange={(e) => onNoteChange?.(e.target.value)}
              placeholder="Quick note..."
              rows={2}
              className="w-full rounded-lg px-3 py-2 text-xs text-neutral-700 dark:text-neutral-300 bg-neutral-50 dark:bg-white/[0.03] border border-neutral-200 dark:border-white/[0.08] focus:outline-none focus:ring-1 focus:ring-violet-500/50 resize-none transition-all duration-200"
            />
          )}
        </div>
      </div>
    );
  }

  return (
    <div
      draggable
      onDragStart={onDragStart}
      onDragOver={onDragOver}
      onDrop={onDrop}
      className="group relative"
    >
      <div className="absolute left-0 top-0 bottom-0 w-6 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-grab active:cursor-grabbing">
        <GripVertical size={14} className="text-neutral-300 dark:text-neutral-600" />
      </div>
      <div className="pl-6">
        <div className="flex items-start gap-3">
          <button
            onClick={onToggle}
            className={`mt-0.5 w-5 h-5 rounded-lg border-2 flex items-center justify-center transition-all duration-200 active:scale-90 shrink-0 ${
              done
                ? "bg-emerald-500 border-emerald-500"
                : "border-neutral-300 dark:border-white/[0.2] hover:border-violet-400"
            }`}
          >
            {done && <Check size={12} className="text-white" />}
          </button>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <span
                className={`text-sm transition-all duration-200 cursor-pointer ${done ? "line-through text-neutral-400 dark:text-neutral-500" : "text-neutral-700 dark:text-neutral-200"}`}
                onClick={() => setExpanded(!expanded)}
              >
                {task.title}
                {isFollowUpTask && followUpCount !== undefined && followUpCount > 0 && (
                  <span className="ml-2 text-[11px] px-1.5 py-0.5 rounded-full bg-amber-500/15 text-amber-600 dark:text-amber-400 font-medium">
                    {followUpCount} need follow-up
                  </span>
                )}
              </span>
              {hasNote && !expanded && (
                <MessageSquare size={12} className="text-violet-400 shrink-0" />
              )}
              {task.custom && onDelete && (
                <button
                  onClick={onDelete}
                  className="ml-auto opacity-0 group-hover:opacity-100 text-neutral-300 hover:text-red-400 transition-all p-0.5"
                  title="Delete task"
                >
                  <Trash2 size={13} />
                </button>
              )}
            </div>
            {expanded && (
              <div className="mt-2">
                <textarea
                  value={task.note || ""}
                  onChange={(e) => onNoteChange?.(e.target.value)}
                  placeholder="Quick note..."
                  rows={2}
                  className="w-full rounded-lg px-3 py-2 text-xs text-neutral-700 dark:text-neutral-300 bg-neutral-50 dark:bg-white/[0.03] border border-neutral-200 dark:border-white/[0.08] focus:outline-none focus:ring-1 focus:ring-violet-500/50 resize-none transition-all duration-200"
                />
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default function PlanPage() {
  const [rawTasks, setRawTasks, loaded] = useLocalStorage<Task[]>("jh_tasks", defaultTasks);
  const [planStartDate, setPlanStartDate] = useLocalStorage<string>("jh_planStartDate", new Date().toISOString().slice(0, 10));
  const [celebrations, setCelebrations] = useLocalStorage<Record<string, boolean>>("jh_phaseCelebrationShown", { "30": false, "60": false, "90": false });
  const [applications] = useLocalStorage<Application[]>("jh_applications", []);
  const [tab, setTab] = useState<TabKey>("today");
  const [showAddTask, setShowAddTask] = useState(false);
  const [celebrationPhase, setCelebrationPhase] = useState<string | null>(null);
  const [dragId, setDragId] = useState<string | null>(null);

  const tasks = useMemo(() => dailyResetTasks(rawTasks.map(normalizeTask)), [rawTasks]);

  useEffect(() => {
    if (!loaded) return;
    const reset = dailyResetTasks(rawTasks.map(normalizeTask));
    if (JSON.stringify(reset) !== JSON.stringify(rawTasks)) {
      setRawTasks(reset);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loaded]);

  const dayNumber = getDayNumber(planStartDate);
  const currentPhase = dayToPhase(dayNumber);

  // Phase completion check
  useEffect(() => {
    const phasesToCheck = ["30", "60", "90"] as const;
    for (const p of phasesToCheck) {
      const phaseTasks = tasks.filter((t) => t.phase === p);
      if (phaseTasks.length > 0 && phaseTasks.every((t) => t.completed) && !celebrations[p]) {
        setCelebrationPhase(p);
        break;
      }
    }
  }, [tasks, celebrations, setCelebrations]);

  function dismissCelebration() {
    if (celebrationPhase) {
      setCelebrations((prev) => ({ ...prev, [celebrationPhase]: true }));
      setCelebrationPhase(null);
    }
  }

  function goToPhase(phase: string) {
    dismissCelebration();
    setTab(phase as TabKey);
  }

  // Behind-schedule check
  const behindSchedule = useMemo(() => {
    if (dayNumber <= 30) return null;
    if (dayNumber <= 60) {
      const incomplete30 = tasks.filter((t) => t.phase === "30" && !t.completed).length;
      if (incomplete30 > 0) {
        return `You're on Day ${dayNumber} but still have ${incomplete30} task${incomplete30 > 1 ? "s" : ""} left in Days 1-30 — that's okay, keep going.`;
      }
    }
    if (dayNumber <= 90) {
      const incomplete60 = tasks.filter((t) => t.phase === "60" && !t.completed).length;
      if (incomplete60 > 0) {
        return `You're on Day ${dayNumber} but still have ${incomplete60} task${incomplete60 > 1 ? "s" : ""} left in Days 31-60 — that's okay, keep going.`;
      }
    }
    return null;
  }, [dayNumber, tasks]);

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

  const updateNote = useCallback((id: string, note: string) => {
    setRawTasks((prev) =>
      prev.map((t) => (t.id === id ? { ...t, note } : t))
    );
  }, [setRawTasks]);

  const addTask = useCallback((task: Task) => {
    setRawTasks((prev) => [...prev, task]);
  }, [setRawTasks]);

  const deleteTask = useCallback((id: string) => {
    if (confirm("Delete this custom task?")) {
      setRawTasks((prev) => prev.filter((t) => t.id !== id));
    }
  }, [setRawTasks]);

  const handleDragStart = useCallback((id: string) => {
    setDragId(id);
  }, []);

  const handleDrop = useCallback((targetId: string) => {
    if (!dragId || dragId === targetId) return;
    setRawTasks((prev) => {
      const dragTask = prev.find((t) => t.id === dragId);
      const targetTask = prev.find((t) => t.id === targetId);
      if (!dragTask || !targetTask || dragTask.section !== targetTask.section) return prev;

      const sectionTasks = prev
        .filter((t) => t.section === dragTask.section && t.phase === dragTask.phase)
        .sort((a, b) => (a.order ?? 0) - (b.order ?? 0));

      const fromIdx = sectionTasks.findIndex((t) => t.id === dragId);
      const toIdx = sectionTasks.findIndex((t) => t.id === targetId);
      if (fromIdx === -1 || toIdx === -1) return prev;

      const reordered = [...sectionTasks];
      const [moved] = reordered.splice(fromIdx, 1);
      reordered.splice(toIdx, 0, moved);

      const orderMap = new Map<string, number>();
      reordered.forEach((t, i) => orderMap.set(t.id, i));

      return prev.map((t) => {
        if (orderMap.has(t.id)) {
          return { ...t, order: orderMap.get(t.id) };
        }
        return t;
      });
    });
    setDragId(null);
  }, [dragId, setRawTasks]);

  const phaseTasks = tab !== "today" ? tasks.filter((t) => t.phase === tab) : [];
  const sections = tab !== "today"
    ? Array.from(new Set(phaseTasks.map((t) => t.section)))
    : [];

  const followUpCount = getFollowUpCount(applications);

  // Compute which days had any task completed (for the timeline)
  const completedDays = useMemo(() => {
    const days = new Set<string>();
    for (const task of tasks) {
      if (task.completed) {
        // Mark the plan start + phase offset as completed
        const start = new Date(planStartDate);
        const phaseOffset = task.phase === "30" ? 0 : task.phase === "60" ? 30 : 60;
        const d = new Date(start);
        d.setDate(d.getDate() + phaseOffset);
        days.add(toLocalDateStr(d));
      }
    }
    return days;
  }, [tasks, planStartDate]);

  function toLocalDateStr(date: Date): string {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, "0");
    const d = String(date.getDate()).padStart(2, "0");
    return `${y}-${m}-${d}`;
  }

  return (
    <div className="space-y-6">
      {/* 3D Timeline */}
      <div className="glass rounded-2xl overflow-hidden animate-in" style={{ height: "360px" }}>
        <PlanScene3D
          planStartDate={planStartDate}
          dayNumber={dayNumber}
          completedDays={completedDays}
          applications={applications}
        />
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3 animate-in">
        <div>
          <h1 className="text-2xl font-bold text-neutral-900 dark:text-white tracking-tight">30-60-90 Day Plan</h1>
          <p className="text-sm text-neutral-500 dark:text-neutral-400 mt-0.5">
            Day <span className="font-medium text-violet-600 dark:text-violet-400 tabular-nums">{dayNumber}</span> of 90 · Phase: {currentPhase === "30" ? "Days 1-30" : currentPhase === "60" ? "Days 31-60" : "Days 61-90"}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs text-neutral-400">{planStartDate}</span>
        </div>
      </div>

      {/* Behind-schedule indicator */}
      {behindSchedule && (
        <div className="rounded-2xl p-4 text-sm bg-amber-500/10 border border-amber-500/20 text-amber-700 dark:text-amber-300 flex items-start gap-2 animate-in stagger-1">
          <AlertTriangle size={16} className="shrink-0 mt-0.5" />
          <span>{behindSchedule}</span>
        </div>
      )}

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
            <div className="rounded-2xl p-5 bg-white dark:bg-white/[0.04] border border-neutral-200 dark:border-white/[0.08] animate-in">
              <h2 className="text-neutral-900 dark:text-white font-semibold mb-4 flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                Today&apos;s focus
              </h2>
              <ul className="space-y-4">
                {todayTasks.map((t, i) => (
                  <li key={t.id} className={`animate-in stagger-${i + 1}`}>
                    <TaskRow
                      task={t}
                      followUpCount={followUpCount}
                      onToggle={() => toggleBinary(t.id)}
                      onIncrement={t.kind === "progress" ? () => updateProgress(t.id, 1) : undefined}
                      onDecrement={t.kind === "progress" ? () => updateProgress(t.id, -1) : undefined}
                      onReset={t.kind === "progress" ? () => resetProgress(t.id) : undefined}
                      onDelete={t.custom ? () => deleteTask(t.id) : undefined}
                      onNoteChange={(note) => updateNote(t.id, note)}
                    />
                  </li>
                ))}
              </ul>
            </div>
          ) : (
            <div className="rounded-2xl p-8 text-center bg-white dark:bg-white/[0.04] border border-neutral-200 dark:border-white/[0.08] animate-in">
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
          {sections.map((section, si) => {
            const sectionTasks = phaseTasks
              .filter((t) => t.section === section)
              .sort((a, b) => (a.order ?? 0) - (b.order ?? 0));

            return (
              <div key={section} className={`rounded-2xl p-5 bg-white dark:bg-white/[0.04] border border-neutral-200 dark:border-white/[0.08] animate-in stagger-${si + 1}`}>
                <div className="flex justify-between items-center mb-4">
                  <h2 className="text-neutral-900 dark:text-white font-semibold text-sm">{section}</h2>
                  <span className="text-[11px] text-neutral-400">
                    {sectionTasks.filter((t) => t.completed).length}/{sectionTasks.length}
                  </span>
                </div>
                <ul className="space-y-3">
                  {sectionTasks.map((t, i) => (
                    <li key={t.id}>
                      <TaskRow
                        task={t}
                        followUpCount={followUpCount}
                        onToggle={() => toggleBinary(t.id)}
                        onIncrement={t.kind === "progress" ? () => updateProgress(t.id, 1) : undefined}
                        onDecrement={t.kind === "progress" ? () => updateProgress(t.id, -1) : undefined}
                        onReset={t.kind === "progress" ? () => resetProgress(t.id) : undefined}
                        onDelete={t.custom ? () => deleteTask(t.id) : undefined}
                        onNoteChange={(note) => updateNote(t.id, note)}
                        onDragStart={() => handleDragStart(t.id)}
                        onDragOver={(e) => e.preventDefault()}
                        onDrop={() => handleDrop(t.id)}
                      />
                    </li>
                  ))}
                </ul>
              </div>
            );
          })}

          {/* Add Task Button */}
          <button
            onClick={() => setShowAddTask(true)}
            className="w-full rounded-2xl p-4 border-2 border-dashed border-neutral-200 dark:border-white/[0.1] text-neutral-400 hover:text-violet-500 hover:border-violet-400 dark:hover:border-violet-500/50 text-sm font-medium flex items-center justify-center gap-2 transition-all duration-200 active:scale-[0.98]"
          >
            <Plus size={16} /> Add Task to {phases.find((p) => p.key === tab)?.label}
          </button>
        </div>
      )}

      {/* Add Task Modal */}
      {showAddTask && (
        <AddTaskModal
          phase={tab === "today" ? currentPhase : tab}
          sections={sections}
          onClose={() => setShowAddTask(false)}
          onAdd={addTask}
        />
      )}

      {/* Celebration Modal */}
      {celebrationPhase && (
        <CelebrationModal
          phase={celebrationPhase}
          onNext={() => goToPhase(celebrationPhase === "30" ? "60" : "90")}
          onDismiss={dismissCelebration}
        />
      )}
    </div>
  );
}
