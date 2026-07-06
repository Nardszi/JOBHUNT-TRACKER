import { Application, Workout, Note, DailyCheckin, StreakData } from "./types";

function toLocalDateStr(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

function parseLocalDate(dateStr: string): Date {
  const [y, m, d] = dateStr.split("-").map(Number);
  return new Date(y, m - 1, d);
}

function daysBetween(a: string, b: string): number {
  const da = parseLocalDate(a);
  const db = parseLocalDate(b);
  return Math.round((db.getTime() - da.getTime()) / 86400000);
}

export function isDayActive(checkin: DailyCheckin): boolean {
  return checkin.activityCount > 0;
}

export function generateCheckinsFromData(
  applications: Application[],
  workouts: Workout[],
  notes: Note[]
): DailyCheckin[] {
  const dayMap: Record<string, DailyCheckin> = {};

  function getOrCreate(date: string): DailyCheckin {
    if (!dayMap[date]) {
      dayMap[date] = {
        id: date,
        date,
        categoriesCompleted: { applied: false, exercised: false, followedUp: false, notesOrPrep: false },
        activityCount: 0,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
    }
    return dayMap[date];
  }

  applications.forEach((a) => {
    const c = getOrCreate(a.dateApplied);
    c.categoriesCompleted.applied = true;
    c.activityCount++;
    c.updatedAt = new Date().toISOString();
  });

  applications.forEach((a) => {
    if (a.followUpDate && a.followUpDate !== a.dateApplied) {
      const c = getOrCreate(a.followUpDate);
      c.categoriesCompleted.followedUp = true;
      c.activityCount++;
      c.updatedAt = new Date().toISOString();
    }
  });

  workouts.filter((w) => w.completed).forEach((w) => {
    const c = getOrCreate(w.date);
    c.categoriesCompleted.exercised = true;
    c.activityCount++;
    c.updatedAt = new Date().toISOString();
  });

  notes.filter((n) => n.practiced).forEach((n) => {
    const date = n.lastPracticedAt ? n.lastPracticedAt.slice(0, 10) : n.createdAt.slice(0, 10);
    const c = getOrCreate(date);
    c.categoriesCompleted.notesOrPrep = true;
    c.activityCount++;
    c.updatedAt = new Date().toISOString();
  });

  return Object.values(dayMap).sort((a, b) => a.date.localeCompare(b.date));
}

export function calculateStreak(checkins: DailyCheckin[], today: Date): StreakData {
  const activeDates = checkins.filter(isDayActive).map((c) => c.date);
  const uniqueActive = [...new Set(activeDates)].sort();
  if (uniqueActive.length === 0) {
    return { currentStreak: 0, longestStreak: 0, lastCheckinDate: null, totalDaysActive: 0 };
  }

  const todayStr = toLocalDateStr(today);
  const yesterdayStr = toLocalDateStr(new Date(today.getFullYear(), today.getMonth(), today.getDate() - 1));
  const lastActive = uniqueActive[uniqueActive.length - 1];
  const gapFromToday = daysBetween(lastActive, todayStr);

  let currentStreak = 0;
  if (gapFromToday <= 1) {
    for (let i = uniqueActive.length - 1; i >= 0; i--) {
      if (i === uniqueActive.length - 1) {
        currentStreak = 1;
      } else {
        const gap = daysBetween(uniqueActive[i], uniqueActive[i + 1]);
        if (gap === 1) {
          currentStreak++;
        } else {
          break;
        }
      }
    }
  }

  let longestStreak = 0;
  let run = 0;
  for (let i = 0; i < uniqueActive.length; i++) {
    if (i === 0) {
      run = 1;
    } else {
      const gap = daysBetween(uniqueActive[i - 1], uniqueActive[i]);
      if (gap === 1) {
        run++;
      } else {
        run = 1;
      }
    }
    longestStreak = Math.max(longestStreak, run);
  }

  return {
    currentStreak: Math.max(currentStreak, longestStreak > 0 ? 0 : 0),
    longestStreak,
    lastCheckinDate: lastActive,
    totalDaysActive: uniqueActive.length,
  };
}

export function getTodayStatus(
  checkins: DailyCheckin[],
  today: Date
): {
  isTodayActive: boolean;
  categories: { applied: boolean; exercised: boolean; followedUp: boolean; notesOrPrep: boolean };
} {
  const todayStr = toLocalDateStr(today);
  const todayCheckin = checkins.find((c) => c.date === todayStr);
  if (!todayCheckin) {
    return {
      isTodayActive: false,
      categories: { applied: false, exercised: false, followedUp: false, notesOrPrep: false },
    };
  }
  return {
    isTodayActive: isDayActive(todayCheckin),
    categories: todayCheckin.categoriesCompleted,
  };
}
