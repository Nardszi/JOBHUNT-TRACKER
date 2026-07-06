"use client";

import { useState, useMemo, useEffect } from "react";
import dynamic from "next/dynamic";
import { useRouter } from "next/navigation";
import { useLocalStorage } from "@/lib/useLocalStorage";
import { defaultTasks, defaultProfile, normalizeTask, dailyResetTasks } from "@/lib/planData";
import { Task, Application, Profile, Workout, Note, DailyCheckin } from "@/lib/types";
import { generateCheckinsFromData, calculateStreak } from "@/lib/streaks";
import { isWebGLSupported, isLowPowerDevice } from "@/lib/webgl";
import {
  Briefcase,
  Dumbbell,
  StickyNote,
  Users,
  Flame,
  TrendingUp,
  Video,
  Trophy,
} from "lucide-react";

const Scene3D = dynamic(() => import("./Scene3D"), { ssr: false });

const PANEL_ROUTES: Record<string, string> = {
  applications: "/applications",
  exercise: "/exercise",
  notes: "/notes",
  recruiters: "#",
  streaks: "#",
};

export default function Dashboard3D() {
  const router = useRouter();
  const [rawTasks] = useLocalStorage<Task[]>("jh_tasks", defaultTasks);
  const [applications] = useLocalStorage<Application[]>("jh_applications", []);
  const [profile] = useLocalStorage<Profile>("jh_profile", defaultProfile);
  const [workouts] = useLocalStorage<Workout[]>("jh_workouts", []);
  const [restDays] = useLocalStorage<string[]>("jh_restDays", []);
  const [notes] = useLocalStorage<Note[]>("jh_notes", []);

  const [webglOk, setWebglOk] = useState<boolean | null>(null);

  const tasks = useMemo(() => dailyResetTasks(rawTasks.map(normalizeTask)), [rawTasks]);
  const checkins = useMemo(() => generateCheckinsFromData(applications, workouts, notes), [applications, workouts, notes]);
  const streakData = useMemo(() => calculateStreak(checkins, new Date()), [checkins]);

  useEffect(() => {
    setWebglOk(isWebGLSupported() && !isLowPowerDevice());
  }, []);

  const completed = tasks.filter((t) => t.completed).length;
  const percent = tasks.length ? Math.round((completed / tasks.length) * 100) : 0;
  const interviews = applications.filter(
    (a) => a.status === "Interview Scheduled" || a.status === "Case Study"
  ).length;
  const offers = applications.filter((a) => a.status === "Offer").length;

  function handlePanelClick(panelId: string) {
    const route = PANEL_ROUTES[panelId];
    if (route && route !== "#") {
      router.push(route);
    }
  }

  if (webglOk === null) {
    return (
      <div className="flex items-center justify-center h-[60vh]">
        <div className="glass rounded-2xl p-8 text-center">
          <div className="w-12 h-12 border-2 border-violet-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-neutral-500">Loading 3D scene...</p>
        </div>
      </div>
    );
  }

  if (!webglOk) {
    return <FallbackDashboard />;
  }

  return (
    <div className="space-y-6">
      {/* Streak Counter */}
      <div className="glass rounded-2xl p-5 animate-in relative overflow-hidden">
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
              <p className="text-xs text-neutral-500 dark:text-neutral-400">
                {streakData.lastCheckinDate
                  ? "Keep it going!"
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

      {/* 3D Scene */}
      <div className="glass rounded-2xl overflow-hidden animate-in stagger-1" style={{ height: "50vh", minHeight: "350px" }}>
        <Scene3D
          checkins={checkins}
          onPanelClick={handlePanelClick}
          activePanel={null}
        />
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 animate-in stagger-3">
        <div className="glass rounded-2xl p-4 flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-blue-500/10 flex items-center justify-center">
            <Briefcase size={16} className="text-blue-500" />
          </div>
          <div>
            <p className="text-lg font-bold text-neutral-900 dark:text-white tabular-nums">{applications.length}</p>
            <p className="text-xs text-neutral-500">Applications</p>
          </div>
        </div>
        <div className="glass rounded-2xl p-4 flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-violet-500/10 flex items-center justify-center">
            <Video size={16} className="text-violet-500" />
          </div>
          <div>
            <p className="text-lg font-bold text-neutral-900 dark:text-white tabular-nums">{interviews}</p>
            <p className="text-xs text-neutral-500">Interviews</p>
          </div>
        </div>
        <div className="glass rounded-2xl p-4 flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-emerald-500/10 flex items-center justify-center">
            <Trophy size={16} className="text-emerald-500" />
          </div>
          <div>
            <p className="text-lg font-bold text-neutral-900 dark:text-white tabular-nums">{offers}</p>
            <p className="text-xs text-neutral-500">Offers</p>
          </div>
        </div>
        <div className="glass rounded-2xl p-4 flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-orange-500/10 flex items-center justify-center">
            <TrendingUp size={16} className="text-orange-500" />
          </div>
          <div>
            <p className="text-lg font-bold text-neutral-900 dark:text-white tabular-nums">{notes.filter((n) => n.practiced).length}</p>
            <p className="text-xs text-neutral-500">Notes practiced</p>
          </div>
        </div>
      </div>
    </div>
  );
}

function FallbackDashboard() {
  const [rawTasks] = useLocalStorage<Task[]>("jh_tasks", defaultTasks);
  const [applications] = useLocalStorage<Application[]>("jh_applications", []);
  const [profile] = useLocalStorage<Profile>("jh_profile", defaultProfile);
  const [workouts] = useLocalStorage<Workout[]>("jh_workouts", []);
  const [restDays] = useLocalStorage<string[]>("jh_restDays", []);
  const [notes] = useLocalStorage<Note[]>("jh_notes", []);

  const tasks = useMemo(() => dailyResetTasks(rawTasks.map(normalizeTask)), [rawTasks]);
  const checkins = useMemo(() => generateCheckinsFromData(applications, workouts, notes), [applications, workouts, notes]);
  const streakData = useMemo(() => calculateStreak(checkins, new Date()), [checkins]);

  const completed = tasks.filter((t) => t.completed).length;
  const percent = tasks.length ? Math.round((completed / tasks.length) * 100) : 0;

  return (
    <div className="space-y-6">
      <div className="glass rounded-2xl p-5 animate-in">
        <h1 className="text-2xl font-bold text-neutral-900 dark:text-white tracking-tight">{profile.name}</h1>
        <p className="text-neutral-500 dark:text-neutral-400 text-sm mt-0.5">{profile.targetRoles}</p>
      </div>

      <div className="glass rounded-2xl p-5 animate-in stagger-1">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-orange-500/10 flex items-center justify-center">
            <Flame size={28} className="text-orange-500" />
          </div>
          <div>
            <p className="text-3xl font-bold text-neutral-900 dark:text-white tabular-nums">
              {streakData.currentStreak}
              <span className="text-base font-normal text-neutral-500 ml-1">day streak</span>
            </p>
            <p className="text-xs text-neutral-500">Longest: {streakData.longestStreak} · Total active: {streakData.totalDaysActive}</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 animate-in stagger-2">
        {[
          { label: "Applications", icon: Briefcase, color: "bg-blue-500/10 text-blue-500", href: "/applications" },
          { label: "Exercise", icon: Dumbbell, color: "bg-emerald-500/10 text-emerald-500", href: "/exercise" },
          { label: "Notes", icon: StickyNote, color: "bg-violet-500/10 text-violet-500", href: "/notes" },
          { label: "Streaks", icon: Flame, color: "bg-orange-500/10 text-orange-500", href: "#" },
        ].map((section) => {
          const Icon = section.icon;
          return (
            <div
              key={section.label}
              className="glass rounded-2xl p-4 flex flex-col items-center gap-2 hover:scale-[1.02] transition-all duration-200"
            >
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${section.color}`}>
                <Icon size={18} />
              </div>
              <span className="text-xs font-medium text-neutral-700 dark:text-neutral-300">{section.label}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
