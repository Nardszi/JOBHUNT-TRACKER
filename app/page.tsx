"use client";

import { useLocalStorage } from "@/lib/useLocalStorage";
import { defaultTasks, defaultProfile } from "@/lib/planData";
import { Task, Application, Profile } from "@/lib/types";
import Link from "next/link";

function ProgressRing({ percent }: { percent: number }) {
  const radius = 54;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (percent / 100) * circumference;
  return (
    <svg width="130" height="130" className="mx-auto">
      <circle cx="65" cy="65" r={radius} stroke="#262626" strokeWidth="12" fill="none" />
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
      <text x="65" y="72" textAnchor="middle" fontSize="24" fill="white" fontWeight="bold">
        {percent}%
      </text>
    </svg>
  );
}

export default function OverviewPage() {
  const [tasks] = useLocalStorage<Task[]>("jh_tasks", defaultTasks);
  const [applications] = useLocalStorage<Application[]>("jh_applications", []);
  const [profile] = useLocalStorage<Profile>("jh_profile", defaultProfile);

  const completed = tasks.filter((t) => t.completed).length;
  const percent = tasks.length ? Math.round((completed / tasks.length) * 100) : 0;

  const interviews = applications.filter(
    (a) => a.status === "Interview Scheduled" || a.status === "Case Study"
  ).length;
  const offers = applications.filter((a) => a.status === "Offer").length;

  const phases = [
    { key: "30", label: "Days 1-30" },
    { key: "60", label: "Days 31-60" },
    { key: "90", label: "Days 61-90" },
  ] as const;

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-white">{profile.name}</h1>
        <p className="text-neutral-400">{profile.targetRoles}</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-neutral-950 border border-neutral-800 rounded-xl p-6 flex flex-col items-center justify-center">
          <ProgressRing percent={percent} />
          <p className="text-sm text-neutral-400 mt-2">Overall plan progress</p>
        </div>
        <div className="bg-neutral-950 border border-neutral-800 rounded-xl p-6 flex flex-col justify-center">
          <p className="text-3xl font-bold text-white">{applications.length}</p>
          <p className="text-sm text-neutral-400">Applications sent</p>
        </div>
        <div className="bg-neutral-950 border border-neutral-800 rounded-xl p-6 flex flex-col justify-center">
          <p className="text-3xl font-bold text-white">{interviews}</p>
          <p className="text-sm text-neutral-400">Interviews / Case studies</p>
        </div>
        <div className="bg-neutral-950 border border-neutral-800 rounded-xl p-6 flex flex-col justify-center">
          <p className="text-3xl font-bold text-emerald-400">{offers}</p>
          <p className="text-sm text-neutral-400">Offers</p>
        </div>
      </div>

      <div>
        <h2 className="text-lg font-semibold text-white mb-3">Phase progress</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {phases.map((p) => {
            const phaseTasks = tasks.filter((t) => t.phase === p.key);
            const done = phaseTasks.filter((t) => t.completed).length;
            const pct = phaseTasks.length ? Math.round((done / phaseTasks.length) * 100) : 0;
            return (
              <Link
                key={p.key}
                href="/plan"
                className="bg-neutral-950 border border-neutral-800 rounded-xl p-5 hover:border-emerald-600 transition"
              >
                <p className="text-white font-medium">{p.label}</p>
                <div className="w-full bg-neutral-800 rounded-full h-2 mt-3">
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
    </div>
  );
}
