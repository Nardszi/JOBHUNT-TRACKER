"use client";

import { CheckCircle2, Circle, Briefcase, Dumbbell, Phone, StickyNote } from "lucide-react";

interface TodayChecklistProps {
  categories: {
    applied: boolean;
    exercised: boolean;
    followedUp: boolean;
    notesOrPrep: boolean;
  };
  isTodayActive: boolean;
}

const items = [
  { key: "applied" as const, label: "Applied to a job", icon: Briefcase, color: "text-blue-500" },
  { key: "exercised" as const, label: "Exercised", icon: Dumbbell, color: "text-emerald-500" },
  { key: "followedUp" as const, label: "Followed up", icon: Phone, color: "text-amber-500" },
  { key: "notesOrPrep" as const, label: "Notes / prep", icon: StickyNote, color: "text-violet-500" },
];

export default function TodayChecklist({ categories, isTodayActive }: TodayChecklistProps) {
  const doneCount = Object.values(categories).filter(Boolean).length;
  const total = items.length;

  return (
    <div className="glass rounded-2xl p-4">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-semibold text-neutral-900 dark:text-white">
          Today&apos;s Activity
        </h3>
        <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${
          isTodayActive
            ? "bg-emerald-500/10 text-emerald-500 border border-emerald-500/20"
            : "bg-neutral-100 dark:bg-white/[0.06] text-neutral-500 border border-neutral-200 dark:border-white/[0.08]"
        }`}>
          {isTodayActive ? "✓ Active" : "No activity yet"}
        </span>
      </div>

      <div className="space-y-2">
        {items.map((item) => {
          const done = categories[item.key];
          const Icon = item.icon;
          return (
            <div
              key={item.key}
              className={`flex items-center gap-3 px-3 py-2 rounded-xl transition-all duration-200 ${
                done
                  ? "bg-emerald-500/5 border border-emerald-500/10"
                  : "bg-neutral-50 dark:bg-white/[0.02] border border-transparent"
              }`}
            >
              {done ? (
                <CheckCircle2 size={16} className="text-emerald-500 shrink-0" />
              ) : (
                <Circle size={16} className="text-neutral-300 dark:text-neutral-600 shrink-0" />
              )}
              <Icon size={14} className={`${done ? item.color : "text-neutral-400 dark:text-neutral-500"} shrink-0`} />
              <span className={`text-sm ${done ? "text-neutral-900 dark:text-white" : "text-neutral-500 dark:text-neutral-400"}`}>
                {item.label}
              </span>
            </div>
          );
        })}
      </div>

      {doneCount > 0 && doneCount < total && (
        <p className="text-[11px] text-amber-500 mt-3 text-center">
          {total - doneCount} more to go — any activity keeps the streak alive
        </p>
      )}
      {doneCount === total && (
        <p className="text-[11px] text-emerald-500 mt-3 text-center font-medium">
          All categories active today!
        </p>
      )}
    </div>
  );
}
