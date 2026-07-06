"use client";

import { useLocalStorage } from "@/lib/useLocalStorage";
import { defaultTasks, defaultProfile, normalizeTask, dailyResetTasks } from "@/lib/planData";
import { Task, Application, Profile, Workout, Note, DailyCheckin } from "@/lib/types";
import { generateCheckinsFromData, calculateStreak, getTodayStatus } from "@/lib/streaks";
import StreakHeatmap from "@/components/StreakHeatmap";
import TodayChecklist from "@/components/TodayChecklist";
import Link from "next/link";
import { useMemo, useEffect, useState } from "react";
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";
import { startNotificationChecks, stopNotificationChecks } from "@/lib/notifications";
import { TrendingUp, Briefcase, Video, Trophy, Flame, Dumbbell, ArrowRight, StickyNote, Calendar, Target } from "lucide-react";

function ProgressRing({ percent }: { percent: number }) {
  const radius = 54;
  const circumference = 2 * Math.PI * radius;
  const [offset, setOffset] = useState(circumference);

  useEffect(() => {
    const timer = setTimeout(() => {
      setOffset(circumference - (percent / 100) * circumference);
    }, 100);
    return () => clearTimeout(timer);
  }, [percent, circumference]);

  return (
    <div className="relative">
      <div className="absolute inset-0 rounded-full bg-emerald-500/10 blur-xl" />
      <svg width="130" height="130" className="mx-auto relative">
        <circle cx="65" cy="65" r={radius} stroke="currentColor" strokeWidth="10" fill="none" className="text-neutral-200 dark:text-white/[0.06]" />
        <circle
          cx="65"
          cy="65"
          r={radius}
          stroke="url(#emerald-gradient)"
          strokeWidth="10"
          fill="none"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          transform="rotate(-90 65 65)"
          className="progress-ring-circle"
        />
        <defs>
          <linearGradient id="emerald-gradient" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#34d399" />
            <stop offset="100%" stopColor="#10b981" />
          </linearGradient>
        </defs>
        <text x="65" y="72" textAnchor="middle" fontSize="26" fill="currentColor" fontWeight="bold" className="tabular-nums">
          {percent}%
        </text>
      </svg>
    </div>
  );
}

function getWeekKey(dateStr: string): string {
  const d = new Date(dateStr);
  const jan1 = new Date(d.getFullYear(), 0, 1);
  const week = Math.ceil(((d.getTime() - jan1.getTime()) / 86400000 + jan1.getDay() + 1) / 7);
  return `${d.getFullYear()}-W${String(week).padStart(2, "0")}`;
}

function getWeekLabel(weekKey: string): string {
  const [, w] = weekKey.split("-W");
  return `W${parseInt(w)}`;
}

function getLastNWeeks(n: number): string[] {
  const weeks: string[] = [];
  const now = new Date();
  for (let i = n - 1; i >= 0; i--) {
    const d = new Date(now);
    d.setDate(d.getDate() - i * 7);
    weeks.push(getWeekKey(d.toISOString()));
  }
  return weeks;
}

function StatCard({ icon: Icon, value, label, color, delay }: {
  icon: React.ElementType;
  value: React.ReactNode;
  label: string;
  color: string;
  delay: string;
}) {
  return (
    <div className={`glass rounded-2xl p-5 flex flex-col justify-center animate-in ${delay} transition-all duration-300 hover:scale-[1.02]`}>
      <div className={`w-8 h-8 rounded-lg flex items-center justify-center mb-3 ${color}`}>
        <Icon size={16} />
      </div>
      <p className="text-2xl font-bold text-neutral-900 dark:text-white tabular-nums">{value}</p>
      <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-0.5">{label}</p>
    </div>
  );
}

export default function OverviewPage() {
  const [rawTasks] = useLocalStorage<Task[]>("jh_tasks", defaultTasks);
  const [applications] = useLocalStorage<Application[]>("jh_applications", []);
  const [profile] = useLocalStorage<Profile>("jh_profile", defaultProfile);
  const [workouts] = useLocalStorage<Workout[]>("jh_workouts", []);
  const [restDays] = useLocalStorage<string[]>("jh_restDays", []);
  const [notes] = useLocalStorage<Note[]>("jh_notes", []);
  const [viewMode, setViewMode] = useState<"daily" | "plan">("daily");

  const tasks = useMemo(() => dailyResetTasks(rawTasks.map(normalizeTask)), [rawTasks]);

  const checkins = useMemo(() => generateCheckinsFromData(applications, workouts, notes), [applications, workouts, notes]);
  const streakData = useMemo(() => calculateStreak(checkins, new Date()), [checkins]);
  const todayStatus = useMemo(() => getTodayStatus(checkins, new Date()), [checkins]);

  useEffect(() => {
    startNotificationChecks(() => applications);
    return () => stopNotificationChecks();
  }, [applications]);

  const completed = tasks.filter((t) => t.completed).length;
  const percent = tasks.length ? Math.round((completed / tasks.length) * 100) : 0;

  const interviews = applications.filter(
    (a) => a.status === "Interview Scheduled" || a.status === "Case Study"
  ).length;
  const offers = applications.filter((a) => a.status === "Offer").length;

  const streak = useMemo(() => {
    if (applications.length === 0) return 0;
    const weekSet = new Set(applications.map((a) => getWeekKey(a.dateApplied)));
    let count = 0;
    const now = new Date();
    for (let i = 0; i < 52; i++) {
      const d = new Date(now);
      d.setDate(d.getDate() - i * 7);
      const wk = getWeekKey(d.toISOString());
      if (weekSet.has(wk)) {
        count++;
      } else if (i > 0) {
        break;
      }
    }
    return count;
  }, [applications]);

  const exerciseStreak = useMemo(() => {
    const activeDates = [...new Set(workouts.filter((w) => w.completed).map((w) => w.date))];
    const allValidDates = [...new Set([...activeDates, ...restDays])].sort().reverse();
    if (allValidDates.length === 0) return 0;
    let count = 0;
    const now = new Date();
    now.setHours(0, 0, 0, 0);
    for (let i = 0; i < 365; i++) {
      const d = new Date(now);
      d.setDate(d.getDate() - i);
      const key = d.toISOString().slice(0, 10);
      if (allValidDates.includes(key)) {
        count++;
      } else if (i > 0) {
        break;
      }
    }
    return count;
  }, [workouts, restDays]);

  const daysSinceLastApp = useMemo(() => {
    if (applications.length === 0) return null;
    const sorted = [...applications].sort((a, b) => b.dateApplied.localeCompare(a.dateApplied));
    const last = new Date(sorted[0].dateApplied);
    const now = new Date();
    const diff = Math.floor((now.getTime() - last.getTime()) / 86400000);
    return diff;
  }, [applications]);

  const appPerWeekData = useMemo(() => {
    const last8 = getLastNWeeks(8);
    const counts: Record<string, number> = {};
    last8.forEach((w) => (counts[w] = 0));
    applications.forEach((a) => {
      const wk = getWeekKey(a.dateApplied);
      if (wk in counts) counts[wk]++;
    });
    return last8.map((w) => ({ week: getWeekLabel(w), applications: counts[w] }));
  }, [applications]);

  const responseRateData = useMemo(() => {
    const last8 = getLastNWeeks(8);
    const totals: Record<string, number> = {};
    const responded: Record<string, number> = {};
    last8.forEach((w) => {
      totals[w] = 0;
      responded[w] = 0;
    });
    applications.forEach((a) => {
      const wk = getWeekKey(a.dateApplied);
      if (wk in totals) {
        totals[wk]++;
        if (a.status !== "Applied") responded[wk]++;
      }
    });
    return last8.map((w) => ({
      week: getWeekLabel(w),
      rate: totals[w] > 0 ? Math.round((responded[w] / totals[w]) * 100) : 0,
    }));
  }, [applications]);

  const hasEnoughData = applications.length >= 2;

  const phases = [
    { key: "30", label: "Days 1-30" },
    { key: "60", label: "Days 31-60" },
    { key: "90", label: "Days 61-90" },
  ] as const;

  return (
    <div className="space-y-8">
      <div className="animate-in">
        <h1 className="text-2xl font-bold text-neutral-900 dark:text-white tracking-tight">{profile.name}</h1>
        <p className="text-neutral-500 dark:text-neutral-400 text-sm mt-0.5">{profile.targetRoles}</p>
      </div>

      {/* Streak Counter */}
      <div className="glass rounded-2xl p-5 animate-in stagger-1 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-orange-500/5 to-emerald-500/5" />
        <div className="relative flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-orange-500/10 flex items-center justify-center glow-emerald">
              <Flame size={28} className="text-orange-500" />
            </div>
            <div>
              <p className="text-3xl font-bold text-neutral-900 dark:text-white tabular-nums">
                {streakData.currentStreak}
                <span className="text-base font-normal text-neutral-500 ml-1">day streak</span>
              </p>
              <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-0.5">
                {streakData.lastCheckinDate
                  ? todayStatus.isTodayActive
                    ? "✓ Active today — streak alive!"
                    : "No activity yet today — log something to keep it going"
                  : "Start your streak by logging any activity"}
              </p>
            </div>
          </div>
          <div className="flex gap-4 text-center">
            <div>
              <p className="text-lg font-bold text-neutral-900 dark:text-white tabular-nums">{streakData.longestStreak}</p>
              <p className="text-[10px] text-neutral-500 uppercase tracking-wider">Longest</p>
            </div>
            <div className="w-px bg-neutral-200 dark:bg-white/[0.08]" />
            <div>
              <p className="text-lg font-bold text-neutral-900 dark:text-white tabular-nums">{streakData.totalDaysActive}</p>
              <p className="text-[10px] text-neutral-500 uppercase tracking-wider">Total Active</p>
            </div>
          </div>
        </div>
      </div>

      {daysSinceLastApp !== null && daysSinceLastApp > 3 && (
        <div className="glass rounded-2xl p-4 text-sm text-amber-700 dark:text-amber-300 bg-amber-500/10 border-amber-500/20 animate-in stagger-1">
          It&apos;s been {daysSinceLastApp} days since your last application — keep the momentum going!
        </div>
      )}

      {/* Heatmap + Today's Checklist */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 animate-in stagger-2">
        <div className="lg:col-span-2 glass rounded-2xl p-5">
          <h2 className="text-sm font-semibold text-neutral-500 dark:text-neutral-400 mb-3 uppercase tracking-wider">Activity Heatmap</h2>
          <StreakHeatmap checkins={checkins} weeksToShow={20} />
        </div>
        <TodayChecklist categories={todayStatus.categories} isTodayActive={todayStatus.isTodayActive} />
      </div>

      {/* View Mode Toggle */}
      <div className="flex justify-center animate-in stagger-3">
        <div className="glass rounded-xl p-1 flex gap-1">
          <button
            onClick={() => setViewMode("daily")}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
              viewMode === "daily"
                ? "bg-violet-500 text-white"
                : "text-neutral-500 hover:text-neutral-900 dark:hover:text-white"
            }`}
          >
            <Calendar size={14} />
            Daily View
          </button>
          <button
            onClick={() => setViewMode("plan")}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
              viewMode === "plan"
                ? "bg-violet-500 text-white"
                : "text-neutral-500 hover:text-neutral-900 dark:hover:text-white"
            }`}
          >
            <Target size={14} />
            90-Day Plan
          </button>
        </div>
      </div>

      {viewMode === "daily" ? (
        <div className="space-y-6">
          {/* Stat Cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 animate-in stagger-4">
            <StatCard icon={Briefcase} value={applications.length} label="Applications" color="bg-blue-500/10 text-blue-500" delay="stagger-4" />
            <StatCard icon={Video} value={interviews} label="Interviews" color="bg-violet-500/10 text-violet-500" delay="stagger-5" />
            <StatCard icon={Trophy} value={offers} label="Offers" color="bg-emerald-500/10 text-emerald-500" delay="stagger-6" />
            <StatCard icon={Dumbbell} value={workouts.filter((w) => w.completed).length} label="Workouts" color="bg-orange-500/10 text-orange-500" delay="stagger-7" />
          </div>

          {/* Weekly Charts */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="glass rounded-2xl p-5 animate-in stagger-8">
              <h2 className="text-sm font-semibold text-neutral-500 dark:text-neutral-400 mb-3 uppercase tracking-wider">Applications per week</h2>
              {hasEnoughData ? (
                <ResponsiveContainer width="100%" height={200}>
                  <BarChart data={appPerWeekData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="currentColor" className="text-neutral-200 dark:text-white/[0.06]" />
                    <XAxis dataKey="week" tick={{ fontSize: 11, fill: '#737373' }} />
                    <YAxis allowDecimals={false} tick={{ fontSize: 11, fill: '#737373' }} />
                    <Tooltip
                      contentStyle={{ backgroundColor: 'rgba(15,23,42,0.9)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px', color: '#fff', backdropFilter: 'blur(8px)' }}
                    />
                    <Bar dataKey="applications" fill="url(#emerald-bar)" radius={[6, 6, 0, 0]} animationDuration={800} />
                    <defs>
                      <linearGradient id="emerald-bar" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#34d399" />
                        <stop offset="100%" stopColor="#10b981" />
                      </linearGradient>
                    </defs>
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <p className="text-sm text-neutral-500 text-center py-12">Not enough data yet</p>
              )}
            </div>

            <div className="glass rounded-2xl p-5 animate-in stagger-9">
              <h2 className="text-sm font-semibold text-neutral-500 dark:text-neutral-400 mb-3 uppercase tracking-wider">Response rate</h2>
              {hasEnoughData ? (
                <ResponsiveContainer width="100%" height={200}>
                  <LineChart data={responseRateData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="currentColor" className="text-neutral-200 dark:text-white/[0.06]" />
                    <XAxis dataKey="week" tick={{ fontSize: 11, fill: '#737373' }} />
                    <YAxis domain={[0, 100]} tick={{ fontSize: 11, fill: '#737373' }} />
                    <Tooltip
                      contentStyle={{ backgroundColor: 'rgba(15,23,42,0.9)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px', color: '#fff', backdropFilter: 'blur(8px)' }}
                      formatter={(value) => [`${value}%`, "Response rate"]}
                    />
                    <Line type="monotone" dataKey="rate" stroke="#a78bfa" strokeWidth={2} dot={{ fill: "#a78bfa", r: 4 }} animationDuration={800} />
                  </LineChart>
                </ResponsiveContainer>
              ) : (
                <p className="text-sm text-neutral-500 text-center py-12">Not enough data yet</p>
              )}
            </div>
          </div>
        </div>
      ) : (
        /* 90-Day Plan View */
        <div className="space-y-6 animate-in stagger-4">
          <div className="glass rounded-2xl p-6 flex flex-col items-center justify-center relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/5 to-violet-500/5" />
            <div className="relative">
              <ProgressRing percent={percent} />
            </div>
            <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-3 relative">Overall progress</p>
          </div>

          <div>
            <h2 className="text-sm font-semibold text-neutral-500 dark:text-neutral-400 mb-3 uppercase tracking-wider">Phase progress</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              {phases.map((p, i) => {
                const phaseTasks = tasks.filter((t) => t.phase === p.key);
                const done = phaseTasks.filter((t) => t.completed).length;
                const pct = phaseTasks.length ? Math.round((done / phaseTasks.length) * 100) : 0;
                return (
                  <Link
                    key={p.key}
                    href="/plan"
                    className={`glass rounded-2xl p-5 hover:bg-white/[0.06] dark:hover:bg-white/[0.04] transition-all duration-300 animate-in hover:scale-[1.02] stagger-${i + 5}`}
                  >
                    <p className="text-neutral-900 dark:text-white font-medium text-sm">{p.label}</p>
                    <div className="w-full bg-neutral-200 dark:bg-white/[0.06] rounded-full h-1.5 mt-3 overflow-hidden">
                      <div
                        className="bg-gradient-to-r from-emerald-500 to-emerald-400 h-1.5 rounded-full transition-all duration-500 ease-out"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                    <p className="text-xs text-neutral-500 mt-2 tabular-nums">
                      {done}/{phaseTasks.length} tasks
                    </p>
                  </Link>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
