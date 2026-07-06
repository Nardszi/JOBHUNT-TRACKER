"use client";

import { DailyCheckin } from "@/lib/types";
import { useMemo, useState, useRef, useEffect } from "react";

const CATEGORY_LABELS: Record<string, string> = {
  applied: "Applied",
  exercised: "Exercised",
  followedUp: "Followed Up",
  notesOrPrep: "Notes / Prep",
};

function toLocalDateStr(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

function getColorClass(count: number): string {
  if (count === 0) return "bg-neutral-100 dark:bg-white/[0.04]";
  if (count === 1) return "bg-emerald-200 dark:bg-emerald-900/40";
  if (count <= 3) return "bg-emerald-400 dark:bg-emerald-600/60";
  return "bg-emerald-500 dark:bg-emerald-500/80";
}

function Tooltip({ checkin, position }: { checkin: DailyCheckin | null; position: { x: number; y: number } }) {
  if (!checkin) return null;
  const cats = Object.entries(checkin.categoriesCompleted).filter(([, v]) => v).map(([k]) => CATEGORY_LABELS[k] || k);
  return (
    <div
      className="fixed z-[200] glass-strong rounded-xl px-3 py-2 text-xs pointer-events-none shadow-2xl max-w-[200px]"
      style={{ left: position.x, top: position.y - 8, transform: "translateY(-100%)" }}
    >
      <p className="text-neutral-900 dark:text-white font-medium mb-1">{checkin.date}</p>
      <p className="text-neutral-500 dark:text-neutral-400">{checkin.activityCount} activit{checkin.activityCount === 1 ? "y" : "ies"}</p>
      {cats.length > 0 && (
        <div className="mt-1 flex flex-wrap gap-1">
          {cats.map((c) => (
            <span key={c} className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
              {c}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}

export default function StreakHeatmap({ checkins, weeksToShow = 20 }: { checkins: DailyCheckin[]; weeksToShow?: number }) {
  const [hoveredCheckin, setHoveredCheckin] = useState<DailyCheckin | null>(null);
  const [tooltipPos, setTooltipPos] = useState({ x: 0, y: 0 });
  const gridRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setHoveredCheckin(null);
    }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, []);

  const { weeks, monthLabels } = useMemo(() => {
    const today = new Date();
    const endDate = new Date(today);
    const startDate = new Date(today);
    startDate.setDate(startDate.getDate() - (weeksToShow * 7) - ((today.getDay() + 6) % 7));

    const checkinMap: Record<string, DailyCheckin> = {};
    checkins.forEach((c) => { checkinMap[c.date] = c; });

    const weeks: (DailyCheckin | null)[][] = [];
    const monthLabels: { week: number; label: string }[] = [];
    let currentDate = new Date(startDate);
    let currentMonth = -1;

    for (let w = 0; w < weeksToShow; w++) {
      const week: (DailyCheckin | null)[] = [];
      for (let d = 0; d < 7; d++) {
        const dateStr = toLocalDateStr(currentDate);
        const isActive = dateStr <= toLocalDateStr(today);
        week.push(isActive ? (checkinMap[dateStr] || null) : null);

        if (currentDate.getMonth() !== currentMonth) {
          currentMonth = currentDate.getMonth();
          monthLabels.push({ week: w, label: currentDate.toLocaleDateString("en-US", { month: "short" }) });
        }
        currentDate.setDate(currentDate.getDate() + 1);
      }
      weeks.push(week);
    }

    return { weeks, monthLabels };
  }, [checkins, weeksToShow]);

  const dayLabels = ["Mon", "", "Wed", "", "Fri", "", ""];

  return (
    <div className="relative">
      {/* Month labels */}
      <div className="flex ml-8 mb-1">
        {monthLabels.map((m, i) => (
          <span
            key={i}
            className="text-[10px] text-neutral-400 dark:text-neutral-500 absolute"
            style={{ left: `${32 + m.week * 15}px` }}
          >
            {m.label}
          </span>
        ))}
      </div>

      <div className="flex gap-0 overflow-x-auto pb-1">
        {/* Day labels */}
        <div className="flex flex-col gap-[3px] mr-1 pt-4 shrink-0">
          {dayLabels.map((label, i) => (
            <div key={i} className="h-[11px] flex items-center">
              <span className="text-[9px] text-neutral-400 dark:text-neutral-500 w-7 text-right pr-1">{label}</span>
            </div>
          ))}
        </div>

        {/* Grid */}
        <div ref={gridRef} className="flex gap-[3px]">
          {weeks.map((week, wi) => (
            <div key={wi} className="flex flex-col gap-[3px]">
              {week.map((checkin, di) => (
                <div
                  key={di}
                  className={`w-[11px] h-[11px] rounded-[2px] transition-all duration-150 cursor-pointer ${
                    checkin ? getColorClass(checkin.activityCount) : "bg-neutral-100 dark:bg-white/[0.02] opacity-30"
                  } ${checkin && checkin.activityCount > 0 ? "hover:ring-1 hover:ring-emerald-400/50 hover:scale-150" : ""}`}
                  onMouseEnter={(e) => {
                    if (checkin) {
                      setHoveredCheckin(checkin);
                      const rect = e.currentTarget.getBoundingClientRect();
                      setTooltipPos({ x: rect.left + rect.width / 2, y: rect.top });
                    }
                  }}
                  onMouseLeave={() => setHoveredCheckin(null)}
                />
              ))}
            </div>
          ))}
        </div>
      </div>

      {/* Legend */}
      <div className="flex items-center gap-2 mt-3 ml-8">
        <span className="text-[10px] text-neutral-400">Less</span>
        {[0, 1, 2, 4].map((count) => (
          <div key={count} className={`w-[11px] h-[11px] rounded-[2px] ${getColorClass(count)}`} />
        ))}
        <span className="text-[10px] text-neutral-400">More</span>
      </div>

      <Tooltip checkin={hoveredCheckin} position={tooltipPos} />
    </div>
  );
}
