"use client";

import { useLocalStorage } from "@/lib/useLocalStorage";
import { Application, AppStatus } from "@/lib/types";
import { useState, useMemo } from "react";
import {
  Plus,
  ClipboardPaste,
  Pencil,
  Trash2,
  ChevronUp,
  ChevronDown,
  Filter,
} from "lucide-react";

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
  "Interview Scheduled": "bg-blue-500/10 text-blue-400",
  "Case Study": "bg-purple-500/10 text-purple-400",
  Offer: "bg-emerald-500/10 text-emerald-400",
  Rejected: "bg-red-500/10 text-red-400",
  Ghosted: "bg-yellow-500/10 text-yellow-400",
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
    if (sortKey !== col) return <Filter className="inline ml-1 h-3 w-3 text-neutral-300 dark:text-neutral-600" />;
    return sortAsc ? (
      <ChevronUp className="inline ml-1 h-3 w-3 text-violet-400" />
    ) : (
      <ChevronDown className="inline ml-1 h-3 w-3 text-violet-400" />
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3 animate-in stagger-1">
        <h1 className="text-2xl font-bold text-neutral-900 dark:text-white">Application Tracker</h1>
        <div className="flex gap-2">
          <button
            onClick={pasteFromClipboard}
            className="glass hover:bg-white/[0.06] text-neutral-700 dark:text-neutral-300 px-4 py-2 rounded-xl text-sm font-medium transition-all duration-200 active:scale-95 flex items-center gap-2"
          >
            <ClipboardPaste className="h-4 w-4" />
            Paste Job Post
          </button>
          <button
            onClick={() => setEditing(emptyApp())}
            className="bg-emerald-600 hover:bg-emerald-500 text-white px-4 py-2 rounded-xl text-sm font-medium transition-all duration-200 active:scale-95 flex items-center gap-2"
          >
            <Plus className="h-4 w-4" />
            Add Application
          </button>
        </div>
      </div>

      {pasteError && (
        <div className="glass rounded-xl p-3 text-sm text-yellow-400 animate-in">
          {pasteError}
        </div>
      )}

      <div className="flex flex-wrap gap-2 animate-in stagger-2">
        <button
          onClick={() => setFilter("All")}
          className={`px-3 py-1 rounded-full text-xs transition-all duration-200 ${filter === "All" ? "bg-violet-500/10 text-violet-400" : "glass text-neutral-600 dark:text-neutral-300"}`}
        >
          All ({apps.length})
        </button>
        {statuses.map((s) => (
          <button
            key={s}
            onClick={() => setFilter(s)}
            className={`px-3 py-1 rounded-full text-xs transition-all duration-200 ${filter === s ? "bg-violet-500/10 text-violet-400" : "glass text-neutral-600 dark:text-neutral-300"}`}
          >
            {s} ({apps.filter((a) => a.status === s).length})
          </button>
        ))}
      </div>

      <div className="glass rounded-2xl overflow-x-auto animate-in stagger-3">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-neutral-500 border-b border-white/[0.08]">
              <th className="p-3 cursor-pointer hover:text-neutral-900 dark:hover:text-white transition-colors duration-200" onClick={() => toggleSort("company")}>
                Company <SortIcon col="company" />
              </th>
              <th className="p-3">Role</th>
              <th className="p-3 cursor-pointer hover:text-neutral-900 dark:hover:text-white transition-colors duration-200" onClick={() => toggleSort("dateApplied")}>
                Applied <SortIcon col="dateApplied" />
              </th>
              <th className="p-3 cursor-pointer hover:text-neutral-900 dark:hover:text-white transition-colors duration-200" onClick={() => toggleSort("status")}>
                Status <SortIcon col="status" />
              </th>
              <th className="p-3 cursor-pointer hover:text-neutral-900 dark:hover:text-white transition-colors duration-200" onClick={() => toggleSort("followUpDate")}>
                Follow-up <SortIcon col="followUpDate" />
              </th>
              <th className="p-3"></th>
            </tr>
          </thead>
          <tbody>
            {visible.map((a, i) => (
              <tr
                key={a.id}
                className={`border-b border-white/[0.04] hover:bg-white/[0.03] transition-all duration-200 hover:scale-[1.02] animate-in stagger-${Math.min(i + 1, 12)}`}
              >
                <td className="p-3 text-neutral-900 dark:text-white font-medium">{a.company}</td>
                <td className="p-3 text-neutral-600 dark:text-neutral-300">{a.role}</td>
                <td className="p-3 text-neutral-500 dark:text-neutral-400 tabular-nums">{a.dateApplied}</td>
                <td className="p-3">
                  <span className={`px-2 py-1 rounded-full text-xs ${statusColors[a.status]}`}>
                    {a.status}
                  </span>
                </td>
                <td className="p-3">
                  <div className="flex items-center gap-2">
                    <span className="text-neutral-500 dark:text-neutral-400 tabular-nums">{a.followUpDate || "—"}</span>
                    {isOverdue(a) && (
                      <span className="px-2 py-0.5 rounded-full text-xs bg-rose-500/10 text-rose-400 border border-rose-500/20 font-medium">
                        Overdue
                      </span>
                    )}
                  </div>
                </td>
                <td className="p-3 text-right whitespace-nowrap">
                  <button onClick={() => setEditing(a)} className="text-neutral-500 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white mr-3 text-xs transition-all duration-200 active:scale-95 flex items-center gap-1 inline-flex">
                    <Pencil className="h-3 w-3" />
                    Edit
                  </button>
                  <button onClick={() => remove(a.id)} className="text-red-500 hover:text-red-400 text-xs transition-all duration-200 active:scale-95 flex items-center gap-1 inline-flex">
                    <Trash2 className="h-3 w-3" />
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
        <div className="fixed inset-0 bg-black/60 modal-backdrop flex items-center justify-center p-4 z-50">
          <div className="glass rounded-2xl p-6 w-full max-w-lg space-y-3 modal-content">
            <h2 className="text-neutral-900 dark:text-white font-semibold text-lg">
              {apps.some((a) => a.id === editing.id) ? "Edit" : "Add"} Application
            </h2>
            <input
              placeholder="Company"
              value={editing.company}
              onChange={(e) => setEditing({ ...editing, company: e.target.value })}
              className="w-full glass rounded-xl px-3 py-2 text-sm text-neutral-900 dark:text-white transition-all duration-200"
            />
            <input
              placeholder="Role"
              value={editing.role}
              onChange={(e) => setEditing({ ...editing, role: e.target.value })}
              className="w-full glass rounded-xl px-3 py-2 text-sm text-neutral-900 dark:text-white transition-all duration-200"
            />
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs text-neutral-500">Date Applied</label>
                <input
                  type="date"
                  value={editing.dateApplied}
                  onChange={(e) => setEditing({ ...editing, dateApplied: e.target.value })}
                  className="w-full glass rounded-xl px-3 py-2 text-sm text-neutral-900 dark:text-white transition-all duration-200 tabular-nums"
                />
              </div>
              <div>
                <label className="text-xs text-neutral-500">Follow-up Date</label>
                <input
                  type="date"
                  value={editing.followUpDate}
                  onChange={(e) => setEditing({ ...editing, followUpDate: e.target.value })}
                  className="w-full glass rounded-xl px-3 py-2 text-sm text-neutral-900 dark:text-white transition-all duration-200 tabular-nums"
                />
              </div>
            </div>
            <select
              value={editing.status}
              onChange={(e) => setEditing({ ...editing, status: e.target.value as AppStatus })}
              className="w-full glass rounded-xl px-3 py-2 text-sm text-neutral-900 dark:text-white transition-all duration-200"
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
              className="w-full glass rounded-xl px-3 py-2 text-sm text-neutral-900 dark:text-white transition-all duration-200"
            />
            <textarea
              placeholder="Notes"
              value={editing.notes}
              onChange={(e) => setEditing({ ...editing, notes: e.target.value })}
              rows={3}
              className="w-full glass rounded-xl px-3 py-2 text-sm text-neutral-900 dark:text-white transition-all duration-200"
            />
            <div className="flex justify-end gap-2 pt-2">
              <button
                onClick={() => setEditing(null)}
                className="px-4 py-2 rounded-xl text-sm text-neutral-500 hover:text-neutral-900 dark:hover:text-white transition-all duration-200 active:scale-95"
              >
                Cancel
              </button>
              <button
                onClick={() => save(editing)}
                disabled={!editing.company || !editing.role}
                className="bg-emerald-600 hover:bg-emerald-500 disabled:opacity-40 text-white px-4 py-2 rounded-xl text-sm font-medium transition-all duration-200 active:scale-95"
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
