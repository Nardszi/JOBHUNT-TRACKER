"use client";

import { useLocalStorage } from "@/lib/useLocalStorage";
import { Application, AppStatus, ApplicationSource } from "@/lib/types";
import { useState, useMemo, useRef, useEffect } from "react";
import {
  Plus,
  ClipboardPaste,
  Pencil,
  Trash2,
  ChevronUp,
  ChevronDown,
  Filter,
  Upload,
  X,
  FileText,
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

const sources: ApplicationSource[] = [
  "LinkedIn",
  "JobStreet",
  "Referral",
  "Company Site",
  "Indeed",
  "Facebook Group",
  "Other",
];

const sourceColors: Record<ApplicationSource, string> = {
  LinkedIn: "bg-blue-500/10 text-blue-500",
  JobStreet: "bg-emerald-500/10 text-emerald-500",
  Referral: "bg-amber-500/10 text-amber-500",
  "Company Site": "bg-violet-500/10 text-violet-500",
  Indeed: "bg-sky-500/10 text-sky-500",
  "Facebook Group": "bg-indigo-500/10 text-indigo-500",
  Other: "bg-neutral-500/10 text-neutral-500",
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
    source: "LinkedIn",
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

interface ParsedEntry {
  company: string;
  role: string;
  dateApplied: string;
  status: AppStatus;
  source: ApplicationSource;
}

function parseBulkImport(text: string): ParsedEntry[] {
  const lines = text.split("\n").map((l) => l.trim()).filter(Boolean);
  if (lines.length === 0) return [];
  const entries: ParsedEntry[] = [];
  const today = new Date().toISOString().slice(0, 10);

  const firstLine = lines[0].toLowerCase();
  const isCSV = lines[0].includes(",") && !lines[0].includes("\t");
  const isTSV = lines[0].includes("\t");
  const hasHeader = firstLine.includes("company") || firstLine.includes("role") || firstLine.includes("position") || firstLine.includes("applied");

  if (isCSV || isTSV) {
    const sep = isCSV ? "," : "\t";
    const dataLines = hasHeader ? lines.slice(1) : lines;
    for (const line of dataLines) {
      const cols = line.split(sep).map((c) => c.replace(/^["']|["']$/g, "").trim());
      if (cols.length < 2) continue;
      const company = cols[0] || "";
      const role = cols[1] || "";
      const dateRaw = cols[2] || "";
      const statusRaw = cols[3] || "";
      const sourceRaw = cols[4] || "";
      if (!company || !role) continue;
      const dateApplied = parseDateStr(dateRaw) || today;
      const status = parseStatusStr(statusRaw);
      const source = parseSourceStr(sourceRaw);
      entries.push({ company: company.slice(0, 100), role: role.slice(0, 100), dateApplied, status, source });
    }
  } else {
    for (const line of lines) {
      const lower = line.toLowerCase();
      if (lower.startsWith("company") || lower.startsWith("position") || lower.startsWith("role") || lower.startsWith("applied") || lower.startsWith("date") || lower.startsWith("#")) {
        continue;
      }
      const companyMatch = line.match(/^(.+?)[\s\-–—:|]+(.+?)(?:[\s\-–—:|]+(\d{4}[-/]\d{1,2}[-/]\d{1,2}|\d{1,2}[-/]\d{1,2}[-/]\d{4}))?$/);
      if (companyMatch) {
        const company = companyMatch[1].trim();
        const role = companyMatch[2].trim();
        const dateApplied = companyMatch[3] ? parseDateStr(companyMatch[3]) || today : today;
        entries.push({ company: company.slice(0, 100), role: role.slice(0, 100), dateApplied, status: "Applied", source: "Other" });
        continue;
      }
      const parts = line.split(/[\t|]/).map((p) => p.trim()).filter(Boolean);
      if (parts.length >= 2) {
        const company = parts[0];
        const role = parts[1];
        const dateApplied = parts[2] ? parseDateStr(parts[2]) || today : today;
        entries.push({ company: company.slice(0, 100), role: role.slice(0, 100), dateApplied, status: "Applied", source: "Other" });
      }
    }
  }

  return entries;
}

function parseDateStr(raw: string): string | null {
  if (!raw) return null;
  const cleaned = raw.replace(/["']/g, "").trim();
  const isoMatch = cleaned.match(/(\d{4})[-/](\d{1,2})[-/](\d{1,2})/);
  if (isoMatch) {
    const [, y, m, d] = isoMatch;
    return `${y}-${m.padStart(2, "0")}-${d.padStart(2, "0")}`;
  }
  const usMatch = cleaned.match(/(\d{1,2})[-/](\d{1,2})[-/](\d{4})/);
  if (usMatch) {
    const [, m, d, y] = usMatch;
    return `${y}-${m.padStart(2, "0")}-${d.padStart(2, "0")}`;
  }
  const d = new Date(cleaned);
  if (!isNaN(d.getTime())) return d.toISOString().slice(0, 10);
  return null;
}

function parseStatusStr(raw: string): AppStatus {
  const lower = raw.toLowerCase().trim();
  if (lower.includes("interview")) return "Interview Scheduled";
  if (lower.includes("case")) return "Case Study";
  if (lower.includes("offer")) return "Offer";
  if (lower.includes("reject")) return "Rejected";
  if (lower.includes("ghost")) return "Ghosted";
  return "Applied";
}

function parseSourceStr(raw: string): ApplicationSource {
  const lower = raw.toLowerCase().trim();
  if (lower.includes("linkedin")) return "LinkedIn";
  if (lower.includes("jobstreet")) return "JobStreet";
  if (lower.includes("indeed")) return "Indeed";
  if (lower.includes("referral")) return "Referral";
  if (lower.includes("facebook")) return "Facebook Group";
  if (lower.includes("company")) return "Company Site";
  return "Other";
}

export default function ApplicationsPage() {
  const [apps, setApps] = useLocalStorage<Application[]>("jh_applications", []);
  const [filter, setFilter] = useState<AppStatus | "All">("All");
  const [sourceFilter, setSourceFilter] = useState<ApplicationSource | "All">("All");
  const [editing, setEditing] = useState<Application | null>(null);
  const [sortKey, setSortKey] = useState<SortKey>("followUpDate");
  const [sortAsc, setSortAsc] = useState(true);
  const [pasteError, setPasteError] = useState<string | null>(null);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [bulkStatus, setBulkStatus] = useState<AppStatus | "">("");
  const [viewMode, setViewMode] = useState<"table" | "timeline">("table");
  const [showBulkImport, setShowBulkImport] = useState(false);
  const [bulkText, setBulkText] = useState("");
  const [parsedEntries, setParsedEntries] = useState<ParsedEntry[]>([]);
  const bulkModalRef = useRef<HTMLDivElement>(null);
  const bulkBackdropRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!showBulkImport) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setShowBulkImport(false);
    }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [showBulkImport]);

  function handleBulkParse() {
    const entries = parseBulkImport(bulkText);
    setParsedEntries(entries);
  }

  function handleBulkImport() {
    const newApps: Application[] = parsedEntries.map((e) => ({
      id: crypto.randomUUID(),
      company: e.company,
      role: e.role,
      dateApplied: e.dateApplied,
      status: e.status,
      followUpDate: "",
      notes: "",
      jobUrl: "",
      source: e.source,
    }));
    setApps((prev) => [...prev, ...newApps]);
    setParsedEntries([]);
    setBulkText("");
    setShowBulkImport(false);
  }

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
    let filtered = filter === "All" ? apps : apps.filter((a) => a.status === filter);
    if (sourceFilter !== "All") {
      filtered = filtered.filter((a) => (a.source || "Other") === sourceFilter);
    }
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
  }, [apps, filter, sourceFilter, sortKey, sortAsc]);

  const sourceCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    apps.forEach((a) => {
      const s = a.source || "Other";
      counts[s] = (counts[s] || 0) + 1;
    });
    return counts;
  }, [apps]);

  const conversionRate = useMemo(() => {
    if (apps.length === 0) return 0;
    const interviews = apps.filter(
      (a) => a.status === "Interview Scheduled" || a.status === "Case Study" || a.status === "Offer"
    ).length;
    return Math.round((interviews / apps.length) * 100);
  }, [apps]);

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
            onClick={() => { setShowBulkImport(true); setBulkText(""); setParsedEntries([]); }}
            className="glass hover:bg-white/[0.06] text-neutral-700 dark:text-neutral-300 px-4 py-2 rounded-xl text-sm font-medium transition-all duration-200 active:scale-95 flex items-center gap-2"
          >
            <Upload className="h-4 w-4" />
            Bulk Import
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

      {/* Status Filters */}
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

      {/* Source Filters */}
      <div className="flex flex-wrap gap-2 animate-in stagger-3">
        <span className="text-[11px] text-neutral-400 self-center mr-1">Source:</span>
        <button
          onClick={() => setSourceFilter("All")}
          className={`px-2.5 py-1 rounded-lg text-[11px] font-medium transition-all duration-200 ${sourceFilter === "All" ? "bg-violet-500 text-white" : "bg-neutral-100 dark:bg-white/[0.06] text-neutral-500 dark:text-neutral-400 border border-neutral-200 dark:border-white/[0.08]"}`}
        >
          All
        </button>
        {sources.map((s) => (
          <button
            key={s}
            onClick={() => setSourceFilter(s)}
            className={`px-2.5 py-1 rounded-lg text-[11px] font-medium transition-all duration-200 ${sourceFilter === s ? "bg-violet-500 text-white" : "bg-neutral-100 dark:bg-white/[0.06] text-neutral-500 dark:text-neutral-400 border border-neutral-200 dark:border-white/[0.08]"}`}
          >
            {s} ({sourceCounts[s] || 0})
          </button>
        ))}
      </div>

      <div className="flex items-center justify-between gap-4 animate-in stagger-3">
        <div className="glass rounded-xl px-4 py-2 flex items-center gap-2">
          <span className="text-sm font-bold text-violet-500">{conversionRate}%</span>
          <span className="text-xs text-neutral-500">interview rate</span>
        </div>
        <div className="flex gap-1 glass rounded-lg p-0.5">
          <button
            onClick={() => setViewMode("table")}
            className={`px-3 py-1 rounded-md text-xs font-medium transition-all ${viewMode === "table" ? "bg-violet-500 text-white" : "text-neutral-500 hover:text-neutral-900 dark:hover:text-white"}`}
          >
            Table
          </button>
          <button
            onClick={() => setViewMode("timeline")}
            className={`px-3 py-1 rounded-md text-xs font-medium transition-all ${viewMode === "timeline" ? "bg-violet-500 text-white" : "text-neutral-500 hover:text-neutral-900 dark:hover:text-white"}`}
          >
            Timeline
          </button>
        </div>
      </div>

      {viewMode === "timeline" ? (
        <div className="space-y-3 animate-in stagger-4">
          {[...apps].sort((a, b) => b.dateApplied.localeCompare(a.dateApplied)).map((a, i) => {
            const statusIndex = statuses.indexOf(a.status);
            const progress = Math.round(((statusIndex + 1) / statuses.length) * 100);
            return (
              <div key={a.id} className={`glass rounded-2xl p-4 hover:scale-[1.01] transition-all duration-200 animate-in stagger-${Math.min(i + 1, 12)}`}>
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="text-neutral-900 dark:text-white font-semibold text-sm">{a.company}</h3>
                      <span className={`px-2 py-0.5 rounded-full text-[11px] ${statusColors[a.status]}`}>{a.status}</span>
                      <span className={`px-1.5 py-0.5 rounded-full text-[10px] ${sourceColors[(a.source || "Other") as ApplicationSource]}`}>{a.source || "Other"}</span>
                    </div>
                    <p className="text-xs text-neutral-500 mt-1">{a.role} — applied {a.dateApplied}</p>
                  </div>
                </div>
                <div className="mt-3">
                  <div className="h-1.5 rounded-full bg-neutral-200 dark:bg-white/[0.06] overflow-hidden">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-violet-500 to-emerald-400 transition-all duration-500"
                      style={{ width: `${progress}%` }}
                    />
                  </div>
                  <div className="flex justify-between mt-1">
                    <span className="text-[10px] text-neutral-400">Applied</span>
                    <span className="text-[10px] text-neutral-400">{a.status}</span>
                  </div>
                </div>
                {a.followUpDate && (
                  <p className={`text-[11px] mt-2 ${isOverdue(a) ? "text-rose-400" : "text-neutral-400"}`}>
                    Follow-up: {a.followUpDate} {isOverdue(a) && "— overdue"}
                  </p>
                )}
              </div>
            );
          })}
          {apps.length === 0 && (
            <div className="glass rounded-2xl p-8 text-center">
              <p className="text-neutral-500">No applications to show in timeline view.</p>
            </div>
          )}
        </div>
      ) : (
        <div className="glass rounded-2xl overflow-x-auto animate-in stagger-4">
          <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-neutral-500 border-b border-white/[0.08]">
              <th className="p-3 w-10">
                <input
                  type="checkbox"
                  checked={visible.length > 0 && visible.every((a) => selectedIds.has(a.id))}
                  onChange={() => {
                    if (visible.every((a) => selectedIds.has(a.id))) {
                      setSelectedIds(new Set());
                    } else {
                      setSelectedIds(new Set(visible.map((a) => a.id)));
                    }
                  }}
                  className="rounded"
                />
              </th>
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
              <th className="p-3">Source</th>
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
                <td className="p-3">
                  <input
                    type="checkbox"
                    checked={selectedIds.has(a.id)}
                    onChange={() => {
                      const next = new Set(selectedIds);
                      if (next.has(a.id)) next.delete(a.id);
                      else next.add(a.id);
                      setSelectedIds(next);
                    }}
                    className="rounded"
                  />
                </td>
                <td className="p-3 text-neutral-900 dark:text-white font-medium">{a.company}</td>
                <td className="p-3 text-neutral-600 dark:text-neutral-300">{a.role}</td>
                <td className="p-3 text-neutral-500 dark:text-neutral-400 tabular-nums">{a.dateApplied}</td>
                <td className="p-3">
                  <span className={`px-2 py-1 rounded-full text-xs ${statusColors[a.status]}`}>
                    {a.status}
                  </span>
                </td>
                <td className="p-3">
                  <span className={`px-2 py-1 rounded-full text-[11px] font-medium ${sourceColors[(a.source || "Other") as ApplicationSource]}`}>
                    {a.source || "Other"}
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
                <td colSpan={8} className="p-6 text-center text-neutral-500">
                  No applications yet. Click &quot;Add Application&quot; to start tracking.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
      )}

      {selectedIds.size > 0 && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 glass rounded-2xl px-5 py-3 flex items-center gap-4 shadow-2xl z-50 animate-in border border-white/[0.1]">
          <span className="text-sm text-neutral-300">{selectedIds.size} selected</span>
          <select
            value={bulkStatus}
            onChange={(e) => setBulkStatus(e.target.value as AppStatus | "")}
            className="glass rounded-lg px-3 py-1.5 text-sm text-white"
          >
            <option value="">Change status...</option>
            {statuses.map((s) => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>
          <button
            onClick={() => {
              if (!bulkStatus) return;
              setApps((prev) =>
                prev.map((a) => selectedIds.has(a.id) ? { ...a, status: bulkStatus } : a)
              );
              setSelectedIds(new Set());
              setBulkStatus("");
            }}
            disabled={!bulkStatus}
            className="bg-violet-600 hover:bg-violet-500 disabled:opacity-40 text-white px-3 py-1.5 rounded-lg text-sm font-medium transition-all duration-200 active:scale-95"
          >
            Apply
          </button>
          <button
            onClick={() => setSelectedIds(new Set())}
            className="text-neutral-400 hover:text-white text-sm transition-colors"
          >
            Cancel
          </button>
        </div>
      )}

      {editing && (
        <div className="fixed inset-0 bg-black/50 modal-backdrop flex items-center justify-center p-4 z-50">
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
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs text-neutral-500">Status</label>
                <select
                  value={editing.status}
                  onChange={(e) => setEditing({ ...editing, status: e.target.value as AppStatus })}
                  className="w-full glass rounded-xl px-3 py-2 text-sm text-neutral-900 dark:text-white transition-all duration-200 mt-1"
                >
                  {statuses.map((s) => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-xs text-neutral-500">Source</label>
                <select
                  value={editing.source || "Other"}
                  onChange={(e) => setEditing({ ...editing, source: e.target.value as ApplicationSource })}
                  className="w-full glass rounded-xl px-3 py-2 text-sm text-neutral-900 dark:text-white transition-all duration-200 mt-1"
                >
                  {sources.map((s) => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </select>
              </div>
            </div>
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

      {showBulkImport && (
        <div
          ref={bulkBackdropRef}
          className="fixed inset-0 bg-black/50 modal-backdrop flex items-center justify-center p-4 z-50 animate-in"
          onMouseDown={(e) => {
            if (e.target === bulkBackdropRef.current) setShowBulkImport(false);
          }}
        >
          <div ref={bulkModalRef} className="bg-white dark:bg-neutral-900 rounded-2xl p-6 w-full max-w-2xl max-h-[85vh] flex flex-col shadow-2xl border border-neutral-200 dark:border-white/[0.08] modal-content animate-in stagger-1">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-neutral-900 dark:text-white font-semibold text-lg flex items-center gap-2">
                <FileText size={18} className="text-violet-400" />
                Bulk Import Applications
              </h2>
              <button
                onClick={() => setShowBulkImport(false)}
                className="text-neutral-400 hover:text-neutral-900 dark:hover:text-white p-1 transition-colors"
              >
                <X size={18} />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto space-y-4">
              <div>
                <p className="text-xs text-neutral-500 dark:text-neutral-400 mb-2">
                  Paste your applications below. Supported formats:
                </p>
                <ul className="text-[11px] text-neutral-400 space-y-1 mb-3">
                  <li><strong>CSV:</strong> Company, Role, Date, Status, Source (with or without header)</li>
                  <li><strong>Tab-separated:</strong> Company&lt;tab&gt;Role&lt;tab&gt;Date</li>
                  <li><strong>One per line:</strong> Company - Role - Date</li>
                  <li><strong>LinkedIn:</strong> Copy from &quot;My Jobs&quot; or job listing pages</li>
                </ul>
                <textarea
                  value={bulkText}
                  onChange={(e) => { setBulkText(e.target.value); setParsedEntries([]); }}
                  placeholder={`Company, Role, Date, Status, Source\nAcme Corp, Frontend Dev, 2026-01-15, Applied, LinkedIn\nTechCo, React Engineer, 2026-01-10, Interview Scheduled, JobStreet\n\n--- or one per line ---\nAcme Corp - Frontend Dev - 2026-01-15\nTechCo - React Engineer - 2026-01-10`}
                  rows={10}
                  className="w-full rounded-xl px-3 py-2 text-sm text-neutral-900 dark:text-white bg-neutral-100 dark:bg-white/[0.06] border border-neutral-200 dark:border-white/[0.08] transition-all duration-200 font-mono focus:outline-none focus:ring-2 focus:ring-violet-500/50 resize-none"
                />
              </div>

              {parsedEntries.length > 0 && (
                <div>
                  <p className="text-xs text-neutral-500 dark:text-neutral-400 mb-2">
                    Preview — {parsedEntries.length} application{parsedEntries.length !== 1 ? "s" : ""} found:
                  </p>
                  <div className="max-h-60 overflow-y-auto rounded-xl border border-neutral-200 dark:border-white/[0.08] divide-y divide-neutral-100 dark:divide-white/[0.04]">
                    {parsedEntries.map((e, i) => (
                      <div key={i} className="px-3 py-2 flex items-center gap-3 text-sm">
                        <span className="text-neutral-900 dark:text-white font-medium min-w-0 truncate flex-1">{e.company}</span>
                        <span className="text-neutral-500 dark:text-neutral-400 min-w-0 truncate flex-1">{e.role}</span>
                        <span className="text-neutral-400 tabular-nums text-xs shrink-0">{e.dateApplied}</span>
                        <span className={`px-1.5 py-0.5 rounded-full text-[10px] shrink-0 ${statusColors[e.status]}`}>{e.status}</span>
                        <span className={`px-1.5 py-0.5 rounded-full text-[10px] shrink-0 ${sourceColors[e.source]}`}>{e.source}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div className="flex justify-end gap-2 pt-4 mt-4 border-t border-neutral-200 dark:border-white/[0.08]">
              <button
                onClick={() => setShowBulkImport(false)}
                className="px-4 py-2 rounded-xl text-sm text-neutral-500 hover:text-neutral-900 dark:hover:text-white transition-all duration-200 active:scale-95"
              >
                Cancel
              </button>
              {parsedEntries.length === 0 ? (
                <button
                  onClick={handleBulkParse}
                  disabled={!bulkText.trim()}
                  className="bg-violet-600 hover:bg-violet-500 disabled:opacity-40 text-white px-4 py-2 rounded-xl text-sm font-medium transition-all duration-200 active:scale-95"
                >
                  Parse
                </button>
              ) : (
                <button
                  onClick={handleBulkImport}
                  className="bg-emerald-600 hover:bg-emerald-500 text-white px-4 py-2 rounded-xl text-sm font-medium transition-all duration-200 active:scale-95"
                >
                  Import {parsedEntries.length} Application{parsedEntries.length !== 1 ? "s" : ""}
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
