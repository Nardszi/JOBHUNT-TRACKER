"use client";

import { useLocalStorage } from "@/lib/useLocalStorage";
import { Application, AppStatus } from "@/lib/types";
import { useState, useMemo } from "react";

const statuses: AppStatus[] = [
  "Applied",
  "Interview Scheduled",
  "Case Study",
  "Offer",
  "Rejected",
  "Ghosted",
];

const statusColors: Record<AppStatus, string> = {
  Applied: "bg-neutral-200 dark:bg-neutral-700 text-neutral-700 dark:text-neutral-200",
  "Interview Scheduled": "bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300",
  "Case Study": "bg-purple-100 dark:bg-purple-900 text-purple-700 dark:text-purple-300",
  Offer: "bg-emerald-100 dark:bg-emerald-900 text-emerald-700 dark:text-emerald-300",
  Rejected: "bg-red-100 dark:bg-red-900 text-red-700 dark:text-red-300",
  Ghosted: "bg-yellow-100 dark:bg-yellow-900 text-yellow-700 dark:text-yellow-300",
};

type SortKey = "company" | "dateApplied" | "followUpDate" | "status";

function emptyApp(): Application {
  return {
    id: crypto.randomUUID(),
    company: "",
    role: "",
    dateApplied: new Date().toISOString().slice(0, 10),
    status: "Applied",
    followUpDate: "",
    notes: "",
    jobUrl: "",
  };
}

function isOverdue(app: Application): boolean {
  if (!app.followUpDate) return false;
  if (app.status === "Offer" || app.status === "Rejected") return false;
  const today = new Date().toISOString().slice(0, 10);
  return app.followUpDate <= today;
}

function parseClipboardJob(text: string): { company: string; role: string } {
  const lines = text.split("\n").map((l) => l.trim()).filter(Boolean);
  let company = "";
  let role = "";

  for (const line of lines) {
    const lower = line.toLowerCase();
    if (lower.includes("company:") || lower.includes("company -")) {
      company = line.replace(/.*company[:\-]\s*/i, "").trim();
    }
    if (lower.includes("position:") || lower.includes("role:") || lower.includes("job title:")) {
      role = line.replace(/.*(?:position|role|job title)[:\-]\s*/i, "").trim();
    }
  }

  if (!company && !role && lines.length >= 2) {
    company = lines[0];
    role = lines[1];
  } else if (!company && lines.length >= 1) {
    company = lines[0];
  }

  return { company: company.slice(0, 100), role: role.slice(0, 100) };
}

export default function ApplicationsPage() {
  const [apps, setApps] = useLocalStorage<Application[]>("jh_applications", []);
  const [filter, setFilter] = useState<AppStatus | "All">("All");
  const [editing, setEditing] = useState<Application | null>(null);
  const [sortKey, setSortKey] = useState<SortKey>("followUpDate");
  const [sortAsc, setSortAsc] = useState(true);
  const [pasteError, setPasteError] = useState<string | null>(null);

  function save(app: Application) {
    setApps((prev) => {
      const exists = prev.some((a) => a.id === app.id);
      return exists ? prev.map((a) => (a.id === app.id ? app : a)) : [...prev, app];
    });
    setEditing(null);
  }

  function remove(id: string) {
    setApps((prev) => prev.filter((a) => a.id !== id));
  }

  function toggleSort(key: SortKey) {
    if (sortKey === key) {
      setSortAsc(!sortAsc);
    } else {
      setSortKey(key);
      setSortAsc(key === "followUpDate");
    }
  }

  async function pasteFromClipboard() {
    setPasteError(null);
    try {
      const text = await navigator.clipboard.readText();
      const { company, role } = parseClipboardJob(text);
      const newApp = emptyApp();
      newApp.company = company;
      newApp.role = role;
      setEditing(newApp);
    } catch {
      setPasteError("Clipboard access denied. Please paste manually.");
    }
  }

  const visible = useMemo(() => {
    const filtered = filter === "All" ? apps : apps.filter((a) => a.status === filter);
    return [...filtered].sort((a, b) => {
      if (sortKey === "followUpDate") {
        const aOverdue = isOverdue(a) ? 0 : 1;
        const bOverdue = isOverdue(b) ? 0 : 1;
        if (aOverdue !== bOverdue) return aOverdue - bOverdue;
        const aDate = a.followUpDate || "9999-99-99";
        const bDate = b.followUpDate || "9999-99-99";
        return sortAsc ? aDate.localeCompare(bDate) : bDate.localeCompare(aDate);
      }
      const aVal = a[sortKey] || "";
      const bVal = b[sortKey] || "";
      return sortAsc ? aVal.localeCompare(bVal) : bVal.localeCompare(aVal);
    });
  }, [apps, filter, sortKey, sortAsc]);

  function SortIcon({ col }: { col: SortKey }) {
    if (sortKey !== col) return <span className="text-neutral-300 dark:text-neutral-600 ml-1">↕</span>;
    return <span className="text-emerald-500 ml-1">{sortAsc ? "↑" : "↓"}</span>;
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-bold text-neutral-900 dark:text-white">Application Tracker</h1>
        <div className="flex gap-2">
          <button
            onClick={pasteFromClipboard}
            className="bg-neutral-200 dark:bg-neutral-800 hover:bg-neutral-300 dark:hover:bg-neutral-700 text-neutral-700 dark:text-neutral-300 px-4 py-2 rounded-lg text-sm font-medium border border-neutral-300 dark:border-neutral-700"
          >
            📋 Paste Job Post
          </button>
          <button
            onClick={() => setEditing(emptyApp())}
            className="bg-emerald-600 hover:bg-emerald-500 text-white px-4 py-2 rounded-lg text-sm font-medium"
          >
            + Add Application
          </button>
        </div>
      </div>

      {pasteError && (
        <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-xl p-3 text-sm text-yellow-700 dark:text-yellow-300">
          {pasteError}
        </div>
      )}

      <div className="flex flex-wrap gap-2">
        <button
          onClick={() => setFilter("All")}
          className={`px-3 py-1 rounded-full text-xs ${filter === "All" ? "bg-neutral-900 dark:bg-white text-white dark:text-black" : "bg-neutral-200 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-300"}`}
        >
          All ({apps.length})
        </button>
        {statuses.map((s) => (
          <button
            key={s}
            onClick={() => setFilter(s)}
            className={`px-3 py-1 rounded-full text-xs ${filter === s ? "bg-neutral-900 dark:bg-white text-white dark:text-black" : "bg-neutral-200 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-300"}`}
          >
            {s} ({apps.filter((a) => a.status === s).length})
          </button>
        ))}
      </div>

      <div className="overflow-x-auto bg-white dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-800 rounded-xl">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-neutral-500 border-b border-neutral-200 dark:border-neutral-800">
              <th className="p-3 cursor-pointer hover:text-neutral-900 dark:hover:text-white" onClick={() => toggleSort("company")}>
                Company <SortIcon col="company" />
              </th>
              <th className="p-3">Role</th>
              <th className="p-3 cursor-pointer hover:text-neutral-900 dark:hover:text-white" onClick={() => toggleSort("dateApplied")}>
                Applied <SortIcon col="dateApplied" />
              </th>
              <th className="p-3 cursor-pointer hover:text-neutral-900 dark:hover:text-white" onClick={() => toggleSort("status")}>
                Status <SortIcon col="status" />
              </th>
              <th className="p-3 cursor-pointer hover:text-neutral-900 dark:hover:text-white" onClick={() => toggleSort("followUpDate")}>
                Follow-up <SortIcon col="followUpDate" />
              </th>
              <th className="p-3"></th>
            </tr>
          </thead>
          <tbody>
            {visible.map((a) => (
              <tr key={a.id} className="border-b border-neutral-100 dark:border-neutral-900 hover:bg-neutral-50 dark:hover:bg-neutral-900">
                <td className="p-3 text-neutral-900 dark:text-white font-medium">{a.company}</td>
                <td className="p-3 text-neutral-600 dark:text-neutral-300">{a.role}</td>
                <td className="p-3 text-neutral-500 dark:text-neutral-400">{a.dateApplied}</td>
                <td className="p-3">
                  <span className={`px-2 py-1 rounded-full text-xs ${statusColors[a.status]}`}>
                    {a.status}
                  </span>
                </td>
                <td className="p-3">
                  <div className="flex items-center gap-2">
                    <span className="text-neutral-500 dark:text-neutral-400">{a.followUpDate || "—"}</span>
                    {isOverdue(a) && (
                      <span className="px-2 py-0.5 rounded-full text-xs bg-red-100 dark:bg-red-900 text-red-700 dark:text-red-300 font-medium">
                        Overdue
                      </span>
                    )}
                  </div>
                </td>
                <td className="p-3 text-right whitespace-nowrap">
                  <button onClick={() => setEditing(a)} className="text-neutral-500 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white mr-3 text-xs">
                    Edit
                  </button>
                  <button onClick={() => remove(a.id)} className="text-red-500 hover:text-red-400 text-xs">
                    Delete
                  </button>
                </td>
              </tr>
            ))}
            {visible.length === 0 && (
              <tr>
                <td colSpan={6} className="p-6 text-center text-neutral-500">
                  No applications yet. Click &quot;Add Application&quot; to start tracking.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {editing && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-800 rounded-xl p-6 w-full max-w-lg space-y-3">
            <h2 className="text-neutral-900 dark:text-white font-semibold text-lg">
              {apps.some((a) => a.id === editing.id) ? "Edit" : "Add"} Application
            </h2>
            <input
              placeholder="Company"
              value={editing.company}
              onChange={(e) => setEditing({ ...editing, company: e.target.value })}
              className="w-full bg-neutral-100 dark:bg-neutral-900 border border-neutral-300 dark:border-neutral-700 rounded-lg px-3 py-2 text-sm text-neutral-900 dark:text-white"
            />
            <input
              placeholder="Role"
              value={editing.role}
              onChange={(e) => setEditing({ ...editing, role: e.target.value })}
              className="w-full bg-neutral-100 dark:bg-neutral-900 border border-neutral-300 dark:border-neutral-700 rounded-lg px-3 py-2 text-sm text-neutral-900 dark:text-white"
            />
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs text-neutral-500">Date Applied</label>
                <input
                  type="date"
                  value={editing.dateApplied}
                  onChange={(e) => setEditing({ ...editing, dateApplied: e.target.value })}
                  className="w-full bg-neutral-100 dark:bg-neutral-900 border border-neutral-300 dark:border-neutral-700 rounded-lg px-3 py-2 text-sm text-neutral-900 dark:text-white"
                />
              </div>
              <div>
                <label className="text-xs text-neutral-500">Follow-up Date</label>
                <input
                  type="date"
                  value={editing.followUpDate}
                  onChange={(e) => setEditing({ ...editing, followUpDate: e.target.value })}
                  className="w-full bg-neutral-100 dark:bg-neutral-900 border border-neutral-300 dark:border-neutral-700 rounded-lg px-3 py-2 text-sm text-neutral-900 dark:text-white"
                />
              </div>
            </div>
            <select
              value={editing.status}
              onChange={(e) => setEditing({ ...editing, status: e.target.value as AppStatus })}
              className="w-full bg-neutral-100 dark:bg-neutral-900 border border-neutral-300 dark:border-neutral-700 rounded-lg px-3 py-2 text-sm text-neutral-900 dark:text-white"
            >
              {statuses.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
            <input
              placeholder="Job posting URL"
              value={editing.jobUrl}
              onChange={(e) => setEditing({ ...editing, jobUrl: e.target.value })}
              className="w-full bg-neutral-100 dark:bg-neutral-900 border border-neutral-300 dark:border-neutral-700 rounded-lg px-3 py-2 text-sm text-neutral-900 dark:text-white"
            />
            <textarea
              placeholder="Notes"
              value={editing.notes}
              onChange={(e) => setEditing({ ...editing, notes: e.target.value })}
              rows={3}
              className="w-full bg-neutral-100 dark:bg-neutral-900 border border-neutral-300 dark:border-neutral-700 rounded-lg px-3 py-2 text-sm text-neutral-900 dark:text-white"
            />
            <div className="flex justify-end gap-2 pt-2">
              <button
                onClick={() => setEditing(null)}
                className="px-4 py-2 rounded-lg text-sm text-neutral-500 hover:text-neutral-900 dark:hover:text-white"
              >
                Cancel
              </button>
              <button
                onClick={() => save(editing)}
                disabled={!editing.company || !editing.role}
                className="bg-emerald-600 hover:bg-emerald-500 disabled:opacity-40 text-white px-4 py-2 rounded-lg text-sm font-medium"
              >
                Save
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
