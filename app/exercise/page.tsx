"use client";

import { useLocalStorage } from "@/lib/useLocalStorage";
import { defaultTemplates } from "@/lib/exerciseData";
import { Workout, WorkoutTemplate, ExerciseEntry, BodyStat, ExerciseType, TemplateCategory } from "@/lib/types";
import { useState, useMemo, useEffect } from "react";
import dynamic from "next/dynamic";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, LineChart, Line } from "recharts";
import { Plus, Trash2, Pencil, Play, Flame, Trophy, ChevronDown, ChevronUp, Dumbbell, Search } from "lucide-react";

const ExerciseScene3D = dynamic(() => import("@/components3d/ExerciseScene3D"), { ssr: false });

const exerciseTypes: ExerciseType[] = ["strength", "cardio", "flexibility", "other"];

const categories: { value: TemplateCategory | "all"; label: string }[] = [
  { value: "all", label: "All" },
  { value: "bodyweight", label: "Bodyweight" },
  { value: "cardio", label: "Cardio" },
  { value: "stretching", label: "Stretching" },
  { value: "strength", label: "Strength" },
  { value: "yoga", label: "Yoga" },
  { value: "desk_break", label: "Desk Break" },
  { value: "core", label: "Core" },
  { value: "full_body", label: "Full Body" },
];

const templateCategories: TemplateCategory[] = [
  "bodyweight", "cardio", "stretching", "strength", "yoga", "desk_break", "core", "full_body",
];

const categoryLabels: Record<TemplateCategory, string> = {
  bodyweight: "Bodyweight",
  cardio: "Cardio",
  stretching: "Stretching",
  strength: "Strength",
  yoga: "Yoga",
  desk_break: "Desk Break",
  core: "Core",
  full_body: "Full Body",
};

const durations: { value: "all" | "short" | "medium" | "long" | "xlong"; label: string }[] = [
  { value: "all", label: "Any" },
  { value: "short", label: "Under 10 min" },
  { value: "medium", label: "10-20 min" },
  { value: "long", label: "20-30 min" },
  { value: "xlong", label: "30+ min" },
];

function emptyExercise(): ExerciseEntry {
  return { id: crypto.randomUUID(), name: "", type: "strength" };
}

function computeStreak(workouts: Workout[], restDays: string[]): number {
  const activeDates = [...new Set(workouts.filter((w) => w.completed).map((w) => w.date))];
  const allValidDates = [...new Set([...activeDates, ...restDays])].sort().reverse();
  if (allValidDates.length === 0) return 0;
  let streak = 0;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  for (let i = 0; i < 365; i++) {
    const d = new Date(today);
    d.setDate(d.getDate() - i);
    const key = d.toISOString().slice(0, 10);
    if (allValidDates.includes(key)) {
      streak++;
    } else if (i > 0) {
      break;
    }
  }
  return streak;
}

function getWeekDays(): string[] {
  const days: string[] = [];
  const now = new Date();
  const monday = new Date(now);
  monday.setDate(now.getDate() - ((now.getDay() + 6) % 7));
  for (let i = 0; i < 7; i++) {
    const d = new Date(monday);
    d.setDate(monday.getDate() + i);
    days.push(d.toISOString().slice(0, 10));
  }
  return days;
}

const dayLabels = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

export default function ExercisePage() {
  const [workouts, setWorkouts] = useLocalStorage<Workout[]>("jh_workouts", []);
  const [rawTemplates, setRawTemplates, templatesLoaded] = useLocalStorage<WorkoutTemplate[]>("jh_templates", defaultTemplates);
  const [bestStreak, setBestStreak] = useLocalStorage<number>("jh_bestStreak", 0);
  const [bodyStats, setBodyStats] = useLocalStorage<BodyStat[]>("jh_bodyStats", []);
  const [restDays, setRestDays] = useLocalStorage<string[]>("jh_restDays", []);
  const [weeklyGoal] = useLocalStorage<number>("jh_weeklyGoal", 5);

  // Force-refresh templates if old data has fewer than 100 templates
  const [refreshed, setRefreshed] = useState(false);
  useEffect(() => {
    if (templatesLoaded && rawTemplates.length < 100) {
      setRawTemplates(defaultTemplates);
    }
    if (templatesLoaded) setRefreshed(true);
  }, [templatesLoaded, rawTemplates.length, setRawTemplates]);

  const templates = refreshed ? rawTemplates : defaultTemplates;

  const [tab, setTab] = useState<"log" | "history" | "templates">("log");
  const [editing, setEditing] = useState<Workout | null>(null);
  const [showBodyStats, setShowBodyStats] = useState(false);
  const [bodyStatForm, setBodyStatForm] = useState({ weightKg: "", notes: "" });

  const [categoryFilter, setCategoryFilter] = useState<TemplateCategory | "all">("all");
  const [durationFilter, setDurationFilter] = useState<"all" | "short" | "medium" | "long" | "xlong">("all");
  const [templateSearch, setTemplateSearch] = useState("");
  const [expandedTemplate, setExpandedTemplate] = useState<string | null>(null);

  const streak = useMemo(() => computeStreak(workouts, restDays), [workouts, restDays]);
  const currentBest = useMemo(() => Math.max(bestStreak, streak), [bestStreak, streak]);

  useMemo(() => {
    if (streak > bestStreak) setBestStreak(streak);
  }, [streak, bestStreak, setBestStreak]);

  const todayStr = new Date().toISOString().slice(0, 10);
  const isTodayRestDay = restDays.includes(todayStr);

  function toggleRestDay() {
    setRestDays((prev) =>
      prev.includes(todayStr) ? prev.filter((d) => d !== todayStr) : [...prev, todayStr]
    );
  }

  const weekData = useMemo(() => {
    const weekDays = getWeekDays();
    const counts: Record<string, number> = {};
    weekDays.forEach((d) => (counts[d] = 0));
    workouts.filter((w) => w.completed).forEach((w) => {
      if (w.date in counts) counts[w.date]++;
    });
    return weekDays.map((d, i) => ({
      day: dayLabels[i],
      workouts: counts[d],
      restDay: restDays.includes(d),
    }));
  }, [workouts, restDays]);

  const weekTotal = weekData.reduce((sum, d) => sum + d.workouts, 0);

  const weekMinutes = useMemo(() => {
    const weekDays = getWeekDays();
    return workouts
      .filter((w) => w.completed && weekDays.includes(w.date))
      .reduce((sum, w) => sum + (w.durationMinutes || 0), 0);
  }, [workouts]);

  const weekRestDays = useMemo(() => {
    const weekDays = getWeekDays();
    return restDays.filter((d) => weekDays.includes(d)).length;
  }, [restDays]);

  const bodyStatData = useMemo(() => {
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - 90);
    const cutoffStr = cutoff.toISOString().slice(0, 10);
    return bodyStats
      .filter((b) => b.date >= cutoffStr && b.weightKg)
      .sort((a, b) => a.date.localeCompare(b.date))
      .map((b) => ({
        date: b.date.slice(5),
        weight: b.weightKg,
      }));
  }, [bodyStats]);

  const hasActiveFilters = categoryFilter !== "all" || durationFilter !== "all" || templateSearch.trim() !== "";

  const filteredTemplates = useMemo(() => {
    return templates.filter((tpl) => {
      if (categoryFilter !== "all" && tpl.category !== categoryFilter) return false;

      if (durationFilter !== "all") {
        const d = tpl.durationMinutes;
        switch (durationFilter) {
          case "short": if (d >= 10) return false; break;
          case "medium": if (d < 10 || d >= 20) return false; break;
          case "long": if (d < 20 || d >= 30) return false; break;
          case "xlong": if (d < 30) return false; break;
        }
      }

      if (templateSearch.trim()) {
        const q = templateSearch.toLowerCase();
        const matchName = tpl.name.toLowerCase().includes(q);
        const matchDesc = tpl.description.toLowerCase().includes(q);
        if (!matchName && !matchDesc) return false;
      }

      return true;
    });
  }, [templates, categoryFilter, durationFilter, templateSearch]);

  const quickStartTemplates = useMemo(() => {
    const source = hasActiveFilters ? filteredTemplates : templates;
    return source.slice(0, 5);
  }, [templates, filteredTemplates, hasActiveFilters]);

  function startFromTemplate(template: WorkoutTemplate) {
    const workout: Workout = {
      id: crypto.randomUUID(),
      date: new Date().toISOString().slice(0, 10),
      templateId: template.id,
      exercises: template.exercises.map((e) => ({ ...e, id: crypto.randomUUID() })),
      completed: false,
    };
    setEditing(workout);
  }

  function startCustomWorkout() {
    const workout: Workout = {
      id: crypto.randomUUID(),
      date: new Date().toISOString().slice(0, 10),
      exercises: [emptyExercise()],
      completed: false,
    };
    setEditing(workout);
  }

  function saveWorkout() {
    if (!editing) return;
    let totalMinutes = 0;
    for (const ex of editing.exercises) {
      if (ex.type === "cardio" || ex.type === "flexibility") {
        totalMinutes += ex.durationMinutes || 10;
      } else {
        totalMinutes += Math.ceil(((ex.sets || 1) * (ex.reps || 1) * 3) / 60);
      }
    }
    const workoutToSave = { ...editing, durationMinutes: totalMinutes, completed: true };
    setWorkouts((prev) => {
      const exists = prev.some((w) => w.id === editing.id);
      return exists ? prev.map((w) => (w.id === editing.id ? workoutToSave : w)) : [...prev, workoutToSave];
    });
    setEditing(null);
  }

  function deleteWorkout(id: string) {
    setWorkouts((prev) => prev.filter((w) => w.id !== id));
  }

  function updateExercise(index: number, field: keyof ExerciseEntry, value: string | number | undefined) {
    if (!editing) return;
    const updated = [...editing.exercises];
    updated[index] = { ...updated[index], [field]: value };
    setEditing({ ...editing, exercises: updated });
  }

  function addExercise() {
    if (!editing) return;
    setEditing({ ...editing, exercises: [...editing.exercises, emptyExercise()] });
  }

  function removeExercise(index: number) {
    if (!editing) return;
    setEditing({ ...editing, exercises: editing.exercises.filter((_, i) => i !== index) });
  }

  const [editingTemplate, setEditingTemplate] = useState<WorkoutTemplate | null>(null);

  function saveTemplate(tpl: WorkoutTemplate) {
    const templateToSave = {
      ...tpl,
      category: tpl.category || "bodyweight",
      durationMinutes: tpl.durationMinutes || 15,
    };
    setRawTemplates((prev) => {
      const exists = prev.some((t) => t.id === templateToSave.id);
      if (exists) {
        return prev.map((t) => (t.id === templateToSave.id ? templateToSave : t));
      }
      return [...prev, templateToSave];
    });
    setEditingTemplate(null);
  }

  function deleteTemplate(id: string) {
    setRawTemplates((prev) => prev.filter((t) => t.id !== id));
  }

  function newTemplate() {
    setEditingTemplate({
      id: crypto.randomUUID(),
      name: "",
      description: "",
      category: "bodyweight",
      durationMinutes: 15,
      exercises: [emptyExercise()],
    });
  }

  function saveBodyStat() {
    if (!bodyStatForm.weightKg) return;
    const stat: BodyStat = {
      id: crypto.randomUUID(),
      date: new Date().toISOString().slice(0, 10),
      weightKg: parseFloat(bodyStatForm.weightKg),
      notes: bodyStatForm.notes || undefined,
    };
    setBodyStats((prev) => [...prev, stat]);
    setBodyStatForm({ weightKg: "", notes: "" });
  }

  const groupedHistory = useMemo(() => {
    const sorted = [...workouts].sort((a, b) => b.date.localeCompare(a.date));
    const groups: Record<string, Workout[]> = {};
    sorted.forEach((w) => {
      if (!groups[w.date]) groups[w.date] = [];
      groups[w.date].push(w);
    });
    return Object.entries(groups);
  }, [workouts]);

  const historyWithRestDays = useMemo(() => {
    const allDates = new Set([...groupedHistory.map(([d]) => d), ...restDays]);
    const result: { date: string; workouts: Workout[]; isRestDay: boolean }[] = [];
    allDates.forEach((date) => {
      const dayWorkouts = groupedHistory.find(([d]) => d === date)?.[1] || [];
      result.push({ date, workouts: dayWorkouts, isRestDay: restDays.includes(date) && dayWorkouts.length === 0 });
    });
    return result.sort((a, b) => b.date.localeCompare(a.date)).slice(0, 30);
  }, [groupedHistory, restDays]);

  const tabs = [
    { key: "log" as const, label: "Log Workout", icon: Play },
    { key: "history" as const, label: "History", icon: null },
    { key: "templates" as const, label: "Templates", icon: null },
  ];

  return (
    <div className="space-y-6">
      {/* 3D Exercise Ring */}
      <div className="glass rounded-2xl overflow-hidden animate-in" style={{ height: "320px" }}>
        <ExerciseScene3D workouts={workouts} />
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3 animate-in">
        <div>
          <h1 className="text-2xl font-bold text-neutral-900 dark:text-white tracking-tight">Exercise</h1>
          <p className="text-sm text-neutral-500 dark:text-neutral-400 mt-0.5">
            Build consistency alongside your job hunt.
          </p>
        </div>
        <div className="flex gap-3 items-center">
          <button
            onClick={toggleRestDay}
            className={`glass rounded-2xl px-4 py-2 flex items-center gap-2 transition-all duration-200 active:scale-95 ${
              isTodayRestDay
                ? "bg-amber-500/10 border border-amber-500/20 text-amber-500"
                : "hover:bg-white/[0.06] text-neutral-500 dark:text-neutral-400"
            }`}
            title={isTodayRestDay ? "Rest day active" : "Mark today as rest day"}
          >
            <span className="text-lg">{isTodayRestDay ? "🛌" : "🧘"}</span>
            <div className="text-left">
              <p className="text-xs font-medium leading-tight">{isTodayRestDay ? "Rest day" : "Rest day?"}</p>
              <p className="text-[10px] opacity-60">{isTodayRestDay ? "tap to undo" : "tap to mark"}</p>
            </div>
          </button>
          <div className="glass glow-emerald rounded-2xl px-4 py-2 flex items-center gap-2 transition-all duration-200">
            <Flame className="w-5 h-5 text-emerald-500" />
            <div>
              <p className="text-lg font-bold text-neutral-900 dark:text-white leading-tight">{streak}</p>
              <p className="text-xs text-neutral-500">day streak</p>
            </div>
          </div>
          {currentBest > 0 && (
            <div className="glass rounded-2xl px-4 py-2 flex items-center gap-2 transition-all duration-200">
              <Trophy className="w-5 h-5 text-amber-500" />
              <div>
                <p className="text-lg font-bold text-neutral-900 dark:text-white leading-tight">{currentBest}</p>
                <p className="text-xs text-neutral-500">best streak</p>
              </div>
            </div>
          )}
          <div className="glass rounded-2xl px-4 py-2 flex items-center gap-2 transition-all duration-200">
            <span className="text-lg">🛌</span>
            <div>
              <p className="text-lg font-bold text-neutral-900 dark:text-white leading-tight">{weekRestDays}</p>
              <p className="text-xs text-neutral-500">rest days (week)</p>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="glass rounded-2xl p-5 animate-in stagger-1 transition-all duration-200 hover:scale-[1.02]">
          <h2 className="text-sm font-semibold text-neutral-900 dark:text-white mb-2">This week</h2>
          <ResponsiveContainer width="100%" height={120}>
            <BarChart data={weekData}>
              <defs>
                <linearGradient id="violetGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#8b5cf6" stopOpacity={0.9} />
                  <stop offset="100%" stopColor="#7c3aed" stopOpacity={0.6} />
                </linearGradient>
                <linearGradient id="amberGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#f59e0b" stopOpacity={0.7} />
                  <stop offset="100%" stopColor="#d97706" stopOpacity={0.4} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
              <XAxis dataKey="day" tick={{ fontSize: 11, fill: '#737373' }} />
              <YAxis allowDecimals={false} tick={{ fontSize: 11, fill: '#737373' }} />
              <Tooltip
                contentStyle={{
                  background: 'rgba(255,255,255,0.06)',
                  backdropFilter: 'blur(12px)',
                  border: '1px solid rgba(255,255,255,0.08)',
                  borderRadius: '12px',
                  color: '#fff',
                  boxShadow: '0 4px 24px rgba(0,0,0,0.3)',
                }}
                formatter={(value, name, props) => {
                  if (props?.payload?.restDay) return ["Rest day", "Status"];
                  return [String(value), "Workouts"];
                }}
              />
              <Bar dataKey="workouts" fill="url(#violetGradient)" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
          <div className="flex items-center justify-center gap-4 mt-2">
            <div className="flex items-center justify-between mt-2 w-full">
              <p className="text-xs text-neutral-500 text-center">
                {weekTotal} workouts this week
              </p>
              <p className="text-xs text-neutral-500 text-center">
                {weekMinutes} min / {weeklyGoal * 30} min goal
              </p>
            </div>
            {restDays.some((d) => getWeekDays().includes(d)) && (
              <p className="text-xs text-amber-500 mt-2 text-center flex items-center gap-1">
                <span>🛌</span> Rest days count toward your streak
              </p>
            )}
          </div>
        </div>

        <div className="glass rounded-2xl p-5 animate-in stagger-2 transition-all duration-200 hover:scale-[1.02]">
          <div className="flex items-center justify-between mb-2">
            <h2 className="text-sm font-semibold text-neutral-900 dark:text-white">Quick start</h2>
            <button
              onClick={() => setTab("templates")}
              className="text-xs text-violet-500 dark:text-violet-400 hover:underline"
            >
              Browse all {templates.length} →
            </button>
          </div>
          <div className="space-y-2">
            {quickStartTemplates.map((tpl) => (
              <button
                key={tpl.id}
                onClick={() => startFromTemplate(tpl)}
                className="w-full text-left glass hover:bg-white/[0.06] rounded-xl px-3 py-2 transition-all duration-200 active:scale-95"
              >
                <div className="flex items-center gap-2">
                  <Dumbbell className="w-4 h-4 text-violet-400" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-neutral-900 dark:text-white truncate">{tpl.name}</p>
                    <p className="text-xs text-neutral-500 truncate">{tpl.description}</p>
                  </div>
                  <span className="text-[10px] glass rounded-full px-1.5 py-0.5 text-emerald-500 dark:text-emerald-400 shrink-0">
                    {tpl.durationMinutes}m
                  </span>
                </div>
              </button>
            ))}
            <button
              onClick={startCustomWorkout}
              className="w-full text-left glass hover:bg-white/[0.06] rounded-xl px-3 py-2 transition-all duration-200 active:scale-95 border border-emerald-500/20"
            >
              <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400">
                <Plus className="w-4 h-4" />
                <p className="text-sm font-medium">Custom workout</p>
              </div>
            </button>
          </div>
        </div>
      </div>

      <div className="flex gap-1 border-b border-neutral-200 dark:border-white/[0.08] overflow-x-auto">
        {tabs.map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`px-4 py-2.5 text-sm font-medium whitespace-nowrap transition-all duration-200 relative ${
              tab === t.key
                ? "text-violet-600 dark:text-violet-400"
                : "text-neutral-500 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white"
            }`}
          >
            {t.label}
            {tab === t.key && (
              <span className="absolute bottom-0 left-0 right-0 h-[2px] bg-gradient-to-r from-violet-500 to-violet-400 rounded-full" />
            )}
          </button>
        ))}
      </div>

      {tab === "log" && (
        <div className="space-y-4">
          {editing ? (
            <div className="glass rounded-2xl p-5 space-y-4 animate-in">
              <div className="flex items-center justify-between">
                <h2 className="text-neutral-900 dark:text-white font-semibold">
                  {editing.exercises.length > 0 && editing.exercises[0].name ? "Log Workout" : "New Workout"}
                </h2>
                <input
                  type="date"
                  value={editing.date}
                  onChange={(e) => setEditing({ ...editing, date: e.target.value })}
                  className="glass rounded-xl px-3 py-1.5 text-sm text-neutral-900 dark:text-white transition-all duration-200"
                />
              </div>
              <div className="space-y-3">
                {editing.exercises.map((ex, i) => (
                  <div key={ex.id} className={`glass rounded-xl p-3 space-y-2 animate-in stagger-${Math.min(i + 1, 12)}`}>
                    <div className="flex gap-2">
                      <input
                        placeholder="Exercise name"
                        value={ex.name}
                        onChange={(e) => updateExercise(i, "name", e.target.value)}
                        className="flex-1 glass rounded-xl px-3 py-1.5 text-sm text-neutral-900 dark:text-white transition-all duration-200"
                      />
                      <select
                        value={ex.type}
                        onChange={(e) => updateExercise(i, "type", e.target.value)}
                        className="glass rounded-xl px-2 py-1.5 text-sm text-neutral-900 dark:text-white transition-all duration-200"
                      >
                        {exerciseTypes.map((t) => (
                          <option key={t} value={t}>{t}</option>
                        ))}
                      </select>
                      <button
                        onClick={() => removeExercise(i)}
                        className="text-red-500 hover:text-red-400 text-sm px-2 transition-all duration-200 active:scale-95"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                    <div className="flex gap-2 flex-wrap">
                      {(ex.type === "strength" || ex.type === "other") && (
                        <>
                          <div>
                            <label className="text-xs text-neutral-500">Sets</label>
                            <input
                              type="number"
                              min={1}
                              value={ex.sets ?? ""}
                              onChange={(e) => updateExercise(i, "sets", e.target.value ? parseInt(e.target.value) : undefined)}
                              className="w-16 glass rounded-xl px-2 py-1 text-sm text-neutral-900 dark:text-white transition-all duration-200"
                            />
                          </div>
                          <div>
                            <label className="text-xs text-neutral-500">Reps</label>
                            <input
                              type="number"
                              min={1}
                              value={ex.reps ?? ""}
                              onChange={(e) => updateExercise(i, "reps", e.target.value ? parseInt(e.target.value) : undefined)}
                              className="w-16 glass rounded-xl px-2 py-1 text-sm text-neutral-900 dark:text-white transition-all duration-200"
                            />
                          </div>
                          <div>
                            <label className="text-xs text-neutral-500">Weight (kg)</label>
                            <input
                              type="number"
                              min={0}
                              step={0.5}
                              value={ex.weightKg ?? ""}
                              onChange={(e) => updateExercise(i, "weightKg", e.target.value ? parseFloat(e.target.value) : undefined)}
                              className="w-20 glass rounded-xl px-2 py-1 text-sm text-neutral-900 dark:text-white transition-all duration-200"
                            />
                          </div>
                        </>
                      )}
                      {(ex.type === "cardio" || ex.type === "flexibility") && (
                        <div>
                          <label className="text-xs text-neutral-500">Duration (min)</label>
                          <input
                            type="number"
                            min={1}
                            value={ex.durationMinutes ?? ""}
                            onChange={(e) => updateExercise(i, "durationMinutes", e.target.value ? parseInt(e.target.value) : undefined)}
                            className="w-20 glass rounded-xl px-2 py-1 text-sm text-neutral-900 dark:text-white transition-all duration-200"
                          />
                        </div>
                      )}
                    </div>
                    <input
                      placeholder="Notes (optional)"
                      value={ex.notes ?? ""}
                      onChange={(e) => updateExercise(i, "notes", e.target.value || undefined)}
                      className="w-full glass rounded-xl px-3 py-1.5 text-sm text-neutral-900 dark:text-white transition-all duration-200"
                    />
                  </div>
                ))}
              </div>
              <div className="flex gap-2">
                <button
                  onClick={addExercise}
                  className="text-sm text-emerald-600 dark:text-emerald-400 hover:underline flex items-center gap-1 transition-all duration-200 active:scale-95"
                >
                  <Plus className="w-4 h-4" />
                  Add exercise
                </button>
              </div>
              <div className="flex justify-end gap-2 pt-2 border-t border-neutral-200 dark:border-white/[0.08]">
                <button
                  onClick={() => setEditing(null)}
                  className="px-4 py-2 rounded-xl text-sm text-neutral-500 hover:text-neutral-900 dark:hover:text-white transition-all duration-200 active:scale-95"
                >
                  Cancel
                </button>
                <button
                  onClick={saveWorkout}
                  disabled={editing.exercises.length === 0 || editing.exercises.every((e) => !e.name)}
                  className="bg-emerald-600 hover:bg-emerald-500 disabled:opacity-40 text-white px-4 py-2 rounded-xl text-sm font-medium transition-all duration-200 active:scale-95"
                >
                  Save Workout
                </button>
              </div>
            </div>
          ) : (
            <div className="glass rounded-2xl p-8 text-center animate-in">
              <Dumbbell className="w-10 h-10 text-neutral-400 mx-auto mb-3" />
              <p className="text-neutral-500 dark:text-neutral-400">
                Pick a template above or start a custom workout.
              </p>
            </div>
          )}
        </div>
      )}

      {tab === "history" && (
        <div className="space-y-4">
          {historyWithRestDays.length === 0 ? (
            <div className="glass rounded-2xl p-8 text-center animate-in">
              <Dumbbell className="w-10 h-10 text-neutral-400 mx-auto mb-3" />
              <p className="text-neutral-500 dark:text-neutral-400">
                No workouts logged yet. Start your first one!
              </p>
            </div>
          ) : (
            historyWithRestDays.map((entry) => (
              <div key={entry.date} className="space-y-2">
                <p className="text-xs font-medium text-neutral-500 dark:text-neutral-400 px-1 flex items-center gap-2">
                  {new Date(entry.date + "T00:00:00").toLocaleDateString("en-US", { weekday: "long", month: "short", day: "numeric" })}
                  {entry.isRestDay && (
                    <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-amber-500/10 text-amber-500 border border-amber-500/20">
                      🛌 Rest day
                    </span>
                  )}
                </p>
                <div className="space-y-2">
                  {entry.workouts.length > 0 ? (
                    entry.workouts.map((w) => (
                      <div key={w.id} className="glass rounded-2xl p-4 hover:scale-[1.02] transition-all duration-200">
                        <div className="flex items-start justify-between">
                          <div className="space-y-1">
                            {w.exercises.map((ex) => (
                              <div key={ex.id} className="flex items-center gap-2 text-sm">
                                <span className="text-neutral-900 dark:text-white font-medium">{ex.name}</span>
                                <span className="text-neutral-400 text-xs">
                                  {ex.sets && ex.reps ? `${ex.sets}×${ex.reps}` : ""}
                                  {ex.weightKg ? ` @ ${ex.weightKg}kg` : ""}
                                  {ex.durationMinutes ? `${ex.durationMinutes} min` : ""}
                                </span>
                              </div>
                            ))}
                          </div>
                          <button
                            onClick={() => deleteWorkout(w.id)}
                            className="text-red-500 hover:text-red-400 text-xs flex items-center gap-1 transition-all duration-200 active:scale-95"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                            Delete
                          </button>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="glass rounded-2xl p-3 text-center">
                      <p className="text-xs text-amber-500/80">🛌 Rest day — recovery is part of the process</p>
                    </div>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {tab === "templates" && (
        <div className="space-y-4">
          <div className="space-y-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
              <input
                placeholder="Search templates..."
                value={templateSearch}
                onChange={(e) => setTemplateSearch(e.target.value)}
                className="w-full glass rounded-xl pl-9 pr-3 py-2 text-sm text-neutral-900 dark:text-white transition-all duration-200"
              />
            </div>

            <div className="flex flex-wrap gap-1.5">
              {categories.map((cat) => (
                <button
                  key={cat.value}
                  onClick={() => setCategoryFilter(cat.value)}
                  className={`px-3 py-1 rounded-full text-xs font-medium transition-all duration-200 active:scale-95 ${
                    categoryFilter === cat.value
                      ? "bg-violet-600 text-white"
                      : "glass text-neutral-500 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white"
                  }`}
                >
                  {cat.label}
                </button>
              ))}
            </div>

            <div className="flex flex-wrap gap-1.5">
              {durations.map((dur) => (
                <button
                  key={dur.value}
                  onClick={() => setDurationFilter(dur.value)}
                  className={`px-3 py-1 rounded-full text-xs font-medium transition-all duration-200 active:scale-95 ${
                    durationFilter === dur.value
                      ? "bg-violet-600 text-white"
                      : "glass text-neutral-500 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white"
                  }`}
                >
                  {dur.label}
                </button>
              ))}
            </div>
          </div>

          <div className="flex items-center justify-between">
            <p className="text-xs text-neutral-500 dark:text-neutral-400">
              {filteredTemplates.length} template{filteredTemplates.length !== 1 ? "s" : ""} match
            </p>
            <button
              onClick={newTemplate}
              className="glass hover:bg-white/[0.06] text-white bg-violet-600 px-4 py-2 rounded-xl text-sm font-medium flex items-center gap-2 transition-all duration-200 active:scale-95"
            >
              <Plus className="w-4 h-4" />
              New Template
            </button>
          </div>

          {filteredTemplates.length === 0 ? (
            <div className="glass rounded-2xl p-8 text-center animate-in">
              <Dumbbell className="w-10 h-10 text-neutral-400 mx-auto mb-3" />
              <p className="text-neutral-500 dark:text-neutral-400">
                No templates match your filters.
              </p>
            </div>
          ) : (
            filteredTemplates.map((tpl) => (
              <div key={tpl.id} className="glass rounded-2xl p-4 hover:scale-[1.02] transition-all duration-200 animate-in">
                <div className="flex items-start justify-between">
                  <div className="space-y-1.5 flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="text-neutral-900 dark:text-white font-semibold">{tpl.name}</h3>
                      <span className="text-[10px] glass rounded-full px-2 py-0.5 text-violet-500 dark:text-violet-400 font-medium">
                        {categoryLabels[tpl.category]}
                      </span>
                      <span className="text-[10px] glass rounded-full px-2 py-0.5 text-emerald-500 dark:text-emerald-400 font-medium">
                        {tpl.durationMinutes} min
                      </span>
                    </div>
                    <p className="text-sm text-neutral-500">{tpl.description}</p>
                    {expandedTemplate === tpl.id ? (
                      <div className="space-y-2 mt-2">
                        <div className="flex flex-wrap gap-1.5">
                          {tpl.exercises.map((ex, i) => (
                            <span key={i} className="text-xs glass rounded-lg px-2 py-0.5 text-neutral-600 dark:text-neutral-300">
                              {ex.name}
                              {ex.sets && ex.reps ? ` (${ex.sets}×${ex.reps})` : ""}
                              {ex.durationMinutes ? ` (${ex.durationMinutes}m)` : ""}
                            </span>
                          ))}
                        </div>
                        <div className="flex gap-2">
                          <button
                            onClick={() => { startFromTemplate(tpl); setExpandedTemplate(null); }}
                            className="text-xs text-emerald-600 dark:text-emerald-400 hover:underline flex items-center gap-1 transition-all duration-200 active:scale-95"
                          >
                            <Play className="w-3.5 h-3.5" />
                            Start Workout
                          </button>
                          <button
                            onClick={() => setExpandedTemplate(null)}
                            className="text-xs text-neutral-500 hover:text-neutral-900 dark:hover:text-white transition-all duration-200 active:scale-95"
                          >
                            Collapse
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="flex gap-2 mt-1">
                        <button
                          onClick={() => setExpandedTemplate(tpl.id)}
                          className="text-xs text-violet-600 dark:text-violet-400 hover:underline flex items-center gap-1 transition-all duration-200 active:scale-95"
                        >
                          View / Start
                          <ChevronDown className="w-3 h-3" />
                        </button>
                      </div>
                    )}
                  </div>
                  <div className="flex gap-2 ml-2 shrink-0">
                    <button
                      onClick={() => setEditingTemplate(tpl)}
                      className="text-xs text-neutral-500 hover:text-neutral-900 dark:hover:text-white flex items-center gap-1 transition-all duration-200 active:scale-95"
                    >
                      <Pencil className="w-3.5 h-3.5" />
                      Edit
                    </button>
                    <button
                      onClick={() => deleteTemplate(tpl.id)}
                      className="text-xs text-red-500 hover:text-red-400 flex items-center gap-1 transition-all duration-200 active:scale-95"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      Delete
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {editingTemplate && (
        <div className="fixed inset-0 bg-black/50 modal-backdrop flex items-center justify-center p-4 z-50">
          <div className="glass rounded-2xl p-6 w-full max-w-lg space-y-3 modal-content animate-in max-h-[90vh] overflow-y-auto">
            <h2 className="text-neutral-900 dark:text-white font-semibold text-lg">
              {templates.some((t) => t.id === editingTemplate.id) ? "Edit" : "New"} Template
            </h2>
            <input
              placeholder="Template name"
              value={editingTemplate.name}
              onChange={(e) => setEditingTemplate({ ...editingTemplate, name: e.target.value })}
              className="w-full glass rounded-xl px-3 py-2 text-sm text-neutral-900 dark:text-white transition-all duration-200"
            />
            <input
              placeholder="Description"
              value={editingTemplate.description}
              onChange={(e) => setEditingTemplate({ ...editingTemplate, description: e.target.value })}
              className="w-full glass rounded-xl px-3 py-2 text-sm text-neutral-900 dark:text-white transition-all duration-200"
            />
            <div className="flex gap-2">
              <div className="flex-1">
                <label className="text-xs text-neutral-500 mb-1 block">Category *</label>
                <select
                  value={editingTemplate.category}
                  onChange={(e) => setEditingTemplate({ ...editingTemplate, category: e.target.value as TemplateCategory })}
                  className="w-full glass rounded-xl px-3 py-2 text-sm text-neutral-900 dark:text-white transition-all duration-200"
                >
                  {templateCategories.map((c) => (
                    <option key={c} value={c}>{categoryLabels[c]}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-xs text-neutral-500 mb-1 block">Duration (min) *</label>
                <input
                  type="number"
                  min={1}
                  value={editingTemplate.durationMinutes}
                  onChange={(e) => setEditingTemplate({ ...editingTemplate, durationMinutes: parseInt(e.target.value) || 15 })}
                  className="w-24 glass rounded-xl px-3 py-2 text-sm text-neutral-900 dark:text-white transition-all duration-200"
                />
              </div>
            </div>
            <div className="space-y-2">
              {editingTemplate.exercises.map((ex, i) => (
                <div key={i} className="flex gap-2 items-end">
                  <input
                    placeholder="Exercise name"
                    value={ex.name}
                    onChange={(e) => {
                      const updated = [...editingTemplate.exercises];
                      updated[i] = { ...updated[i], name: e.target.value };
                      setEditingTemplate({ ...editingTemplate, exercises: updated });
                    }}
                    className="flex-1 glass rounded-xl px-3 py-1.5 text-sm text-neutral-900 dark:text-white transition-all duration-200"
                  />
                  <select
                    value={ex.type}
                    onChange={(e) => {
                      const updated = [...editingTemplate.exercises];
                      updated[i] = { ...updated[i], type: e.target.value as ExerciseType };
                      setEditingTemplate({ ...editingTemplate, exercises: updated });
                    }}
                    className="glass rounded-xl px-2 py-1.5 text-sm text-neutral-900 dark:text-white transition-all duration-200"
                  >
                    {exerciseTypes.map((t) => (
                      <option key={t} value={t}>{t}</option>
                    ))}
                  </select>
                  <button
                    onClick={() => setEditingTemplate({ ...editingTemplate, exercises: editingTemplate.exercises.filter((_, j) => j !== i) })}
                    className="text-red-500 hover:text-red-400 text-sm px-2 transition-all duration-200 active:scale-95"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
            <button
              onClick={() => setEditingTemplate({ ...editingTemplate, exercises: [...editingTemplate.exercises, { name: "", type: "strength" }] })}
              className="text-sm text-emerald-600 dark:text-emerald-400 hover:underline flex items-center gap-1 transition-all duration-200 active:scale-95"
            >
              <Plus className="w-4 h-4" />
              Add exercise
            </button>
            <div className="flex justify-end gap-2 pt-2">
              <button
                onClick={() => setEditingTemplate(null)}
                className="px-4 py-2 rounded-xl text-sm text-neutral-500 hover:text-neutral-900 dark:hover:text-white transition-all duration-200 active:scale-95"
              >
                Cancel
              </button>
              <button
                onClick={() => saveTemplate(editingTemplate)}
                disabled={!editingTemplate.name}
                className="bg-emerald-600 hover:bg-emerald-500 disabled:opacity-40 text-white px-4 py-2 rounded-xl text-sm font-medium transition-all duration-200 active:scale-95"
              >
                Save
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="glass rounded-2xl overflow-hidden animate-in">
        <button
          onClick={() => setShowBodyStats(!showBodyStats)}
          className="w-full flex items-center justify-between p-4 text-left hover:bg-white/[0.03] transition-all duration-200"
        >
          <h2 className="text-sm font-semibold text-neutral-900 dark:text-white">Body Stats (optional)</h2>
          {showBodyStats ? (
            <ChevronUp className="w-4 h-4 text-neutral-400" />
          ) : (
            <ChevronDown className="w-4 h-4 text-neutral-400" />
          )}
        </button>
        <div
          className={`transition-all duration-300 ease-in-out ${
            showBodyStats ? "max-h-[500px] opacity-100" : "max-h-0 opacity-0"
          } overflow-hidden`}
        >
          <div className="px-4 pb-4 space-y-4 border-t border-neutral-200 dark:border-white/[0.08] pt-4">
            <div className="flex gap-2">
              <div>
                <label className="text-xs text-neutral-500">Weight (kg)</label>
                <input
                  type="number"
                  step={0.1}
                  value={bodyStatForm.weightKg}
                  onChange={(e) => setBodyStatForm({ ...bodyStatForm, weightKg: e.target.value })}
                  className="w-24 glass rounded-xl px-2 py-1 text-sm text-neutral-900 dark:text-white transition-all duration-200"
                />
              </div>
              <div className="flex-1">
                <label className="text-xs text-neutral-500">Notes</label>
                <input
                  placeholder="Optional"
                  value={bodyStatForm.notes}
                  onChange={(e) => setBodyStatForm({ ...bodyStatForm, notes: e.target.value })}
                  className="w-full glass rounded-xl px-2 py-1 text-sm text-neutral-900 dark:text-white transition-all duration-200"
                />
              </div>
              <button
                onClick={saveBodyStat}
                disabled={!bodyStatForm.weightKg}
                className="bg-emerald-600 hover:bg-emerald-500 disabled:opacity-40 text-white px-3 py-1 rounded-xl text-sm font-medium self-end transition-all duration-200 active:scale-95"
              >
                Log
              </button>
            </div>
            {bodyStatData.length >= 2 && (
              <ResponsiveContainer width="100%" height={150}>
                <LineChart data={bodyStatData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
                  <XAxis dataKey="date" tick={{ fontSize: 11, fill: '#737373' }} />
                  <YAxis domain={["dataMin - 1", "dataMax + 1"]} tick={{ fontSize: 11, fill: '#737373' }} />
                  <Tooltip
                    contentStyle={{
                      background: 'rgba(255,255,255,0.06)',
                      backdropFilter: 'blur(12px)',
                      border: '1px solid rgba(255,255,255,0.08)',
                      borderRadius: '12px',
                      color: '#fff',
                      boxShadow: '0 4px 24px rgba(0,0,0,0.3)',
                    }}
                    formatter={(value) => [`${value} kg`, "Weight"]}
                  />
                  <Line type="monotone" dataKey="weight" stroke="#8b5cf6" strokeWidth={2} dot={{ fill: "#8b5cf6" }} />
                </LineChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
