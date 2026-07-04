"use client";

import { useLocalStorage } from "@/lib/useLocalStorage";
import { defaultTasks, defaultProfile } from "@/lib/planData";
import { Task, Application, Profile, Workout } from "@/lib/types";
import Link from "next/link";
import { useMemo, useEffect } from "react";
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";
import { startNotificationChecks, stopNotificationChecks } from "@/lib/notifications";

function ProgressRing({ percent }: { percent: number }) {
  const radius = 54;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (percent / 100) * circumference;
  return (
    <svg width="130" height="130" className="mx-auto">
      <circle cx="65" cy="65" r={radius} stroke="#e5e7eb" strokeWidth="12" fill="none" className="dark:stroke-neutral-700" />
      <circle
        cx="65"
        cy="65"
        r={radius}
        stroke="#10b981"
        strokeWidth="12"
        fill="none"
        strokeDasharray={circumference}
        strokeDashoffset={offset}
        strokeLinecap="round"
        transform="rotate(-90 65 65)"
      />
      <text x="65" y="72" textAnchor="middle" fontSize="24" fill="currentColor" fontWeight="bold">
        {percent}%
      </text>
    </svg>
  );
}

function getWeekKey(dateStr: string): string {
  const d = new Date(dateStr);
  const jan1 = new Date(d.getFullYear(), 0, 1);
  const week = Math.ceil(((d.getTime() - jan1.getTime()) / 86400000 + jan1.getDay() + 1) / 7);
  return `${d.getFullYear()}-W${String(week).padStart(2, "0")}`;
}

function getWeekLabel(weekKey: string): string {
  const [year, w] = weekKey.split("-W");
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

export default function OverviewPage() {
  const [tasks] = useLocalStorage<Task[]>("jh_tasks", defaultTasks);
  const [applications] = useLocalStorage<Application[]>("jh_applications", []);
  const [profile] = useLocalStorage<Profile>("jh_profile", defaultProfile);
  const [workouts] = useLocalStorage<Workout[]>("jh_workouts", []);

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

  // Weekly streak
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

  // Days since last application
  const daysSinceLastApp = useMemo(() => {
    if (applications.length === 0) return null;
    const sorted = [...applications].sort((a, b) => b.dateApplied.localeCompare(a.dateApplied));
    const last = new Date(sorted[0].dateApplied);
    const now = new Date();
    const diff = Math.floor((now.getTime() - last.getTime()) / 86400000);
    return diff;
  }, [applications]);

  // Chart data: applications per week (last 8 weeks)
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

  // Chart data: response rate per week (last 8 weeks)
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

  // Exercise streak
  const exerciseStreak = useMemo(() => {
    const dates = [...new Set(workouts.filter((w) => w.completed).map((w) => w.date))].sort().reverse();
    if (dates.length === 0) return 0;
    let count = 0;
    const now = new Date();
    now.setHours(0, 0, 0, 0);
    for (let i = 0; i < 365; i++) {
      const d = new Date(now);
      d.setDate(d.getDate() - i);
      const key = d.toISOString().slice(0, 10);
      if (dates.includes(key)) {
        count++;
      } else if (i > 0) {
        break;
      }
    }
    return count;
  }, [workouts]);

  const phases = [
    { key: "30", label: "Days 1-30" },
    { key: "60", label: "Days 31-60" },
    { key: "90", label: "Days 61-90" },
  ] as const;

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-neutral-900 dark:text-white">{profile.name}</h1>
        <p className="text-neutral-500 dark:text-neutral-400">{profile.targetRoles}</p>
      </div>

      {daysSinceLastApp !== null && daysSinceLastApp > 3 && (
        <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-xl p-4 text-sm text-yellow-700 dark:text-yellow-300">
          It&apos;s been {daysSinceLastApp} days since your last application — keep the momentum going!
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-6 gap-4">
        <div className="bg-white dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-800 rounded-xl p-6 flex flex-col items-center justify-center">
          <ProgressRing percent={percent} />
          <p className="text-sm text-neutral-500 dark:text-neutral-400 mt-2">Overall plan progress</p>
        </div>
        <div className="bg-white dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-800 rounded-xl p-6 flex flex-col justify-center">
          <p className="text-3xl font-bold text-neutral-900 dark:text-white">{applications.length}</p>
          <p className="text-sm text-neutral-500 dark:text-neutral-400">Applications sent</p>
        </div>
        <div className="bg-white dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-800 rounded-xl p-6 flex flex-col justify-center">
          <p className="text-3xl font-bold text-neutral-900 dark:text-white">{interviews}</p>
          <p className="text-sm text-neutral-500 dark:text-neutral-400">Interviews / Case studies</p>
        </div>
        <div className="bg-white dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-800 rounded-xl p-6 flex flex-col justify-center">
          <p className="text-3xl font-bold text-emerald-600 dark:text-emerald-400">{offers}</p>
          <p className="text-sm text-neutral-500 dark:text-neutral-400">Offers</p>
        </div>
        <div className="bg-white dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-800 rounded-xl p-6 flex flex-col items-center justify-center">
          <p className="text-3xl font-bold text-orange-500">🔥 {streak}</p>
          <p className="text-sm text-neutral-500 dark:text-neutral-400 mt-1">Week streak</p>
        </div>
        <Link
          href="/exercise"
          className="bg-white dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-800 rounded-xl p-6 flex flex-col items-center justify-center hover:border-emerald-500 transition"
        >
          <p className="text-3xl font-bold text-orange-500">🏋️ {exerciseStreak}</p>
          <p className="text-sm text-neutral-500 dark:text-neutral-400 mt-1">Exercise streak</p>
        </Link>
      </div>

      <div>
        <h2 className="text-lg font-semibold text-neutral-900 dark:text-white mb-3">Phase progress</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {phases.map((p) => {
            const phaseTasks = tasks.filter((t) => t.phase === p.key);
            const done = phaseTasks.filter((t) => t.completed).length;
            const pct = phaseTasks.length ? Math.round((done / phaseTasks.length) * 100) : 0;
            return (
              <Link
                key={p.key}
                href="/plan"
                className="bg-white dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-800 rounded-xl p-5 hover:border-emerald-500 transition"
              >
                <p className="text-neutral-900 dark:text-white font-medium">{p.label}</p>
                <div className="w-full bg-neutral-200 dark:bg-neutral-800 rounded-full h-2 mt-3">
                  <div
                    className="bg-emerald-500 h-2 rounded-full transition-all"
                    style={{ width: `${pct}%` }}
                  />
                </div>
                <p className="text-xs text-neutral-500 mt-2">
                  {done}/{phaseTasks.length} tasks done
                </p>
              </Link>
            );
          })}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-800 rounded-xl p-5">
          <h2 className="text-lg font-semibold text-neutral-900 dark:text-white mb-3">Applications per week</h2>
          {hasEnoughData ? (
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={appPerWeekData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" className="dark:stroke-neutral-700" />
                <XAxis dataKey="week" tick={{ fontSize: 12, fill: '#737373' }} />
                <YAxis allowDecimals={false} tick={{ fontSize: 12, fill: '#737373' }} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#171717', border: '1px solid #404040', borderRadius: '8px', color: '#fff' }}
                />
                <Bar dataKey="applications" fill="#10b981" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <p className="text-sm text-neutral-500 text-center py-12">Not enough data yet</p>
          )}
        </div>

        <div className="bg-white dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-800 rounded-xl p-5">
          <h2 className="text-lg font-semibold text-neutral-900 dark:text-white mb-3">Response rate over time</h2>
          {hasEnoughData ? (
            <ResponsiveContainer width="100%" height={200}>
              <LineChart data={responseRateData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" className="dark:stroke-neutral-700" />
                <XAxis dataKey="week" tick={{ fontSize: 12, fill: '#737373' }} />
                <YAxis domain={[0, 100]} tick={{ fontSize: 12, fill: '#737373' }} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#171717', border: '1px solid #404040', borderRadius: '8px', color: '#fff' }}
                  formatter={(value) => [`${value}%`, "Response rate"]}
                />
                <Line type="monotone" dataKey="rate" stroke="#10b981" strokeWidth={2} dot={{ fill: "#10b981" }} />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <p className="text-sm text-neutral-500 text-center py-12">Not enough data yet</p>
          )}
        </div>
      </div>
    </div>
  );
}
