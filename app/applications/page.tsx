"use client";

import { useLocalStorage } from "@/lib/useLocalStorage";
import { Application, AppStatus } from "@/lib/types";
import { useState } from "react";

const statuses: AppStatus[] = [
  "Applied",
  "Interview Scheduled",
  "Case Study",
  "Offer",
  "Rejected",
  "Ghosted",
];

const statusColors: Record<AppStatus, string> = {
  Applied: "bg-neutral-700 text-neutral-200",
  "Interview Scheduled": "bg-blue-900 text-blue-300",
  "Case Study": "bg-purple-900 text-purple-300",
  Offer: "bg-emerald-900 text-emerald-300",
  Rejected: "bg-red-900 text-red-300",
  Ghosted: "bg-yellow-900 text-yellow-300",
};

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

export default function ApplicationsPage() {
  const [apps, setApps] = useLocalStorage<Application[]>("jh_applications", []);
  const [filter, setFilter] = useState<AppStatus | "All">("All");
  const [editing, setEditing] = useState<Application | null>(null);

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

  const visible = filter === "All" ? apps : apps.filter((a) => a.status === filter);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-bold text-white">Application Tracker</h1>
        <button
          onClick={() => setEditing(emptyApp())}
          className="bg-emerald-600 hover:bg-emerald-500 text-white px-4 py-2 rounded-lg text-sm font-medium"
        >
          + Add Application
        </button>
      </div>

      <div className="flex flex-wrap gap-2">
        <button
          onClick={() => setFilter("All")}
          className={`px-3 py-1 rounded-full text-xs ${filter === "All" ? "bg-white text-black" : "bg-neutral-800 text-neutral-300"}`}
        >
          All ({apps.length})
        </button>
        {statuses.map((s) => (
          <button
            key={s}
            onClick={() => setFilter(s)}
            className={`px-3 py-1 rounded-full text-xs ${filter === s ? "bg-white text-black" : "bg-neutral-800 text-neutral-300"}`}
          >
            {s} ({apps.filter((a) => a.status === s).length})
          </button>
        ))}
      </div>

      <div className="overflow-x-auto bg-neutral-950 border border-neutral-800 rounded-xl">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-neutral-500 border-b border-neutral-800">
              <th className="p-3">Company</th>
              <th className="p-3">Role</th>
              <th className="p-3">Applied</th>
              <th className="p-3">Status</th>
              <th className="p-3">Follow-up</th>
              <th className="p-3"></th>
            </tr>
          </thead>
          <tbody>
            {visible.map((a) => (
              <tr key={a.id} className="border-b border-neutral-900 hover:bg-neutral-900">
                <td className="p-3 text-white">{a.company}</td>
                <td className="p-3 text-neutral-300">{a.role}</td>
                <td className="p-3 text-neutral-400">{a.dateApplied}</td>
                <td className="p-3">
                  <span className={`px-2 py-1 rounded-full text-xs ${statusColors[a.status]}`}>
                    {a.status}
                  </span>
                </td>
                <td className="p-3 text-neutral-400">{a.followUpDate || "—"}</td>
                <td className="p-3 text-right whitespace-nowrap">
                  <button onClick={() => setEditing(a)} className="text-neutral-400 hover:text-white mr-3 text-xs">
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
          <div className="bg-neutral-950 border border-neutral-800 rounded-xl p-6 w-full max-w-lg space-y-3">
            <h2 className="text-white font-semibold text-lg">
              {apps.some((a) => a.id === editing.id) ? "Edit" : "Add"} Application
            </h2>
            <input
              placeholder="Company"
              value={editing.company}
              onChange={(e) => setEditing({ ...editing, company: e.target.value })}
              className="w-full bg-neutral-900 border border-neutral-700 rounded-lg px-3 py-2 text-sm text-white"
            />
            <input
              placeholder="Role"
              value={editing.role}
              onChange={(e) => setEditing({ ...editing, role: e.target.value })}
              className="w-full bg-neutral-900 border border-neutral-700 rounded-lg px-3 py-2 text-sm text-white"
            />
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs text-neutral-500">Date Applied</label>
                <input
                  type="date"
                  value={editing.dateApplied}
                  onChange={(e) => setEditing({ ...editing, dateApplied: e.target.value })}
                  className="w-full bg-neutral-900 border border-neutral-700 rounded-lg px-3 py-2 text-sm text-white"
                />
              </div>
              <div>
                <label className="text-xs text-neutral-500">Follow-up Date</label>
                <input
                  type="date"
                  value={editing.followUpDate}
                  onChange={(e) => setEditing({ ...editing, followUpDate: e.target.value })}
                  className="w-full bg-neutral-900 border border-neutral-700 rounded-lg px-3 py-2 text-sm text-white"
                />
              </div>
            </div>
            <select
              value={editing.status}
              onChange={(e) => setEditing({ ...editing, status: e.target.value as AppStatus })}
              className="w-full bg-neutral-900 border border-neutral-700 rounded-lg px-3 py-2 text-sm text-white"
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
              className="w-full bg-neutral-900 border border-neutral-700 rounded-lg px-3 py-2 text-sm text-white"
            />
            <textarea
              placeholder="Notes"
              value={editing.notes}
              onChange={(e) => setEditing({ ...editing, notes: e.target.value })}
              rows={3}
              className="w-full bg-neutral-900 border border-neutral-700 rounded-lg px-3 py-2 text-sm text-white"
            />
            <div className="flex justify-end gap-2 pt-2">
              <button
                onClick={() => setEditing(null)}
                className="px-4 py-2 rounded-lg text-sm text-neutral-400 hover:text-white"
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
