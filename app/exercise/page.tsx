"use client";

import { useLocalStorage } from "@/lib/useLocalStorage";
import { defaultTemplates } from "@/lib/exerciseData";
import { Workout, WorkoutTemplate, ExerciseEntry, BodyStat, ExerciseType } from "@/lib/types";
import { useState, useMemo } from "react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, LineChart, Line } from "recharts";
import { Plus, Trash2, Pencil, Play, Flame, Trophy, ChevronDown, ChevronUp, Dumbbell } from "lucide-react";

const exerciseTypes: ExerciseType[] = ["strength", "cardio", "flexibility", "other"];

function emptyExercise(): ExerciseEntry {
  return { id: crypto.randomUUID(), name: "", type: "strength" };
}

function computeStreak(workouts: Workout[]): number {
  const dates = [...new Set(workouts.filter((w) => w.completed).map((w) => w.date))].sort().reverse();
  if (dates.length === 0) return 0;
  let streak = 0;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  for (let i = 0; i < 365; i++) {
    const d = new Date(today);
    d.setDate(d.getDate() - i);
    const key = d.toISOString().slice(0, 10);
    if (dates.includes(key)) {
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
  const [templates, setTemplates] = useLocalStorage<WorkoutTemplate[]>("jh_templates", defaultTemplates);
  const [bestStreak, setBestStreak] = useLocalStorage<number>("jh_bestStreak", 0);
  const [bodyStats, setBodyStats] = useLocalStorage<BodyStat[]>("jh_bodyStats", []);

  const [tab, setTab] = useState<"log" | "history" | "templates">("log");
  const [editing, setEditing] = useState<Workout | null>(null);
  const [showBodyStats, setShowBodyStats] = useState(false);
  const [bodyStatForm, setBodyStatForm] = useState({ weightKg: "", notes: "" });

  const streak = useMemo(() => computeStreak(workouts), [workouts]);
  const currentBest = useMemo(() => Math.max(bestStreak, streak), [bestStreak, streak]);

  useMemo(() => {
    if (streak > bestStreak) setBestStreak(streak);
  }, [streak, bestStreak, setBestStreak]);

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
    }));
  }, [workouts]);

  const weekTotal = weekData.reduce((sum, d) => sum + d.workouts, 0);

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
    setWorkouts((prev) => {
      const exists = prev.some((w) => w.id === editing.id);
      return exists ? prev.map((w) => (w.id === editing.id ? editing : w)) : [...prev, { ...editing, completed: true }];
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
    setTemplates((prev) => {
      const exists = prev.some((t) => t.id === tpl.id);
      return exists ? prev.map((t) => (t.id === tpl.id ? tpl : t)) : [...prev, tpl];
    });
    setEditingTemplate(null);
  }

  function deleteTemplate(id: string) {
    setTemplates((prev) => prev.filter((t) => t.id !== id));
  }

  function newTemplate() {
    setEditingTemplate({
      id: crypto.randomUUID(),
      name: "",
      description: "",
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

  const tabs = [
    { key: "log" as const, label: "Log Workout", icon: Play },
    { key: "history" as const, label: "History", icon: null },
    { key: "templates" as const, label: "Templates", icon: null },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3 animate-in">
        <div>
          <h1 className="text-2xl font-bold text-neutral-900 dark:text-white tracking-tight">Exercise</h1>
          <p className="text-sm text-neutral-500 dark:text-neutral-400 mt-0.5">
            Build consistency alongside your job hunt.
          </p>
        </div>
        <div className="flex gap-3 items-center">
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
              />
              <Bar dataKey="workouts" fill="url(#violetGradient)" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
          <p className="text-xs text-neutral-500 mt-2 text-center">
            {weekTotal} of 7 days this week
          </p>
        </div>

        <div className="glass rounded-2xl p-5 animate-in stagger-2 transition-all duration-200 hover:scale-[1.02]">
          <h2 className="text-sm font-semibold text-neutral-900 dark:text-white mb-2">Quick start</h2>
          <div className="space-y-2">
            {templates.slice(0, 3).map((tpl) => (
              <button
                key={tpl.id}
                onClick={() => startFromTemplate(tpl)}
                className="w-full text-left glass hover:bg-white/[0.06] rounded-xl px-3 py-2 transition-all duration-200 active:scale-95"
              >
                <div className="flex items-center gap-2">
                  <Dumbbell className="w-4 h-4 text-violet-400" />
                  <div>
                    <p className="text-sm font-medium text-neutral-900 dark:text-white">{tpl.name}</p>
                    <p className="text-xs text-neutral-500">{tpl.description}</p>
                  </div>
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
          {groupedHistory.length === 0 ? (
            <div className="glass rounded-2xl p-8 text-center animate-in">
              <Dumbbell className="w-10 h-10 text-neutral-400 mx-auto mb-3" />
              <p className="text-neutral-500 dark:text-neutral-400">
                No workouts logged yet. Start your first one!
              </p>
            </div>
          ) : (
            groupedHistory.map(([date, dayWorkouts]) => (
              <div key={date} className="space-y-2">
                <p className="text-xs font-medium text-neutral-500 dark:text-neutral-400 px-1">
                  {new Date(date + "T00:00:00").toLocaleDateString("en-US", { weekday: "long", month: "short", day: "numeric" })}
                </p>
                <div className="space-y-2">
                  {dayWorkouts.map((w) => (
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
                  ))}
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {tab === "templates" && (
        <div className="space-y-4">
          <div className="flex justify-end">
            <button
              onClick={newTemplate}
              className="glass hover:bg-white/[0.06] text-white bg-violet-600 px-4 py-2 rounded-xl text-sm font-medium flex items-center gap-2 transition-all duration-200 active:scale-95"
            >
              <Plus className="w-4 h-4" />
              New Template
            </button>
          </div>
          {templates.map((tpl) => (
            <div key={tpl.id} className="glass rounded-2xl p-4 hover:scale-[1.02] transition-all duration-200 animate-in">
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="text-neutral-900 dark:text-white font-semibold">{tpl.name}</h3>
                  <p className="text-sm text-neutral-500">{tpl.description}</p>
                  <div className="flex flex-wrap gap-2 mt-2">
                    {tpl.exercises.map((ex, i) => (
                      <span key={i} className="text-xs glass rounded-lg px-2 py-0.5 text-neutral-600 dark:text-neutral-300">
                        {ex.name}
                        {ex.sets && ex.reps ? ` (${ex.sets}×${ex.reps})` : ""}
                        {ex.durationMinutes ? ` (${ex.durationMinutes}m)` : ""}
                      </span>
                    ))}
                  </div>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => startFromTemplate(tpl)}
                    className="text-xs text-emerald-600 dark:text-emerald-400 hover:underline flex items-center gap-1 transition-all duration-200 active:scale-95"
                  >
                    <Play className="w-3.5 h-3.5" />
                    Use
                  </button>
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
          ))}
        </div>
      )}

      {editingTemplate && (
        <div className="fixed inset-0 bg-black/60 modal-backdrop flex items-center justify-center p-4 z-50">
          <div className="glass rounded-2xl p-6 w-full max-w-lg space-y-3 modal-content animate-in">
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
