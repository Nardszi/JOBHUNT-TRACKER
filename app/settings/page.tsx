"use client";

import { useLocalStorage } from "@/lib/useLocalStorage";
import { defaultProfile } from "@/lib/planData";
import { Profile } from "@/lib/types";
import { useRef, useState, useEffect } from "react";
import {
  isNotificationsSupported,
  getNotificationPermission,
  requestNotificationPermission,
  getNotificationsEnabled,
  setNotificationsEnabled,
  getNotificationTime,
  setNotificationTime,
} from "@/lib/notifications";
import { Download, Upload, Trash2, Bell, BellOff, User, Shield, GitBranch } from "lucide-react";

const CURRENT_VERSION = 1;

export default function SettingsPage() {
  const [profile, setProfile] = useLocalStorage<Profile>("jh_profile", defaultProfile);
  const [githubUsername, setGithubUsername] = useLocalStorage<string>("jh_github_username", "Nardszi");
  const [planStartDate, setPlanStartDate] = useLocalStorage<string>("jh_planStartDate", new Date().toISOString().slice(0, 10));
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [notifSupported, setNotifSupported] = useState(false);
  const [notifPermission, setNotifPermission] = useState<NotificationPermission | "unsupported">("unsupported");
  const [notifEnabled, setNotifEnabled] = useState(false);
  const [notifTime, setNotifTimeState] = useState("09:00");

  useEffect(() => {
    setNotifSupported(isNotificationsSupported());
    setNotifPermission(getNotificationPermission());
    setNotifEnabled(getNotificationsEnabled());
    setNotifTimeState(getNotificationTime());
  }, []);

  async function toggleNotifications() {
    if (notifEnabled) {
      setNotificationsEnabled(false);
      setNotifEnabled(false);
      return;
    }
    const perm = await requestNotificationPermission();
    setNotifPermission(perm);
    if (perm === "granted") {
      setNotificationsEnabled(true);
      setNotifEnabled(true);
    }
  }

  function handleNotifTimeChange(time: string) {
    setNotifTimeState(time);
    setNotificationTime(time);
  }

  function clearAllData() {
    if (confirm("This will erase all tasks, applications, projects, and notes stored in this browser. Continue?")) {
      localStorage.clear();
      window.location.reload();
    }
  }

  function exportData() {
    const data: Record<string, unknown> = { version: CURRENT_VERSION, exportedAt: new Date().toISOString() };
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith("jh_")) {
        try {
          data[key] = JSON.parse(localStorage.getItem(key) || "null");
        } catch {
          data[key] = localStorage.getItem(key);
        }
      }
    }
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `nardz-tracker-backup-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }

  function importData(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (ev) => {
      try {
        const raw = JSON.parse(ev.target?.result as string);
        if (typeof raw !== "object" || raw === null) {
          alert("Invalid file format. Please select a valid Nardz Tracker backup file.");
          return;
        }
        if (raw.version === undefined) {
          alert("Unrecognized backup format (missing version field). Please select a valid Nardz Tracker backup file.");
          return;
        }
        if (!confirm(`Import data from backup (version ${raw.version})? This will overwrite your current data.`)) {
          return;
        }
        for (const [key, value] of Object.entries(raw)) {
          if (key === "version" || key === "exportedAt") continue;
          if (key.startsWith("jh_")) {
            localStorage.setItem(key, typeof value === "string" ? value : JSON.stringify(value));
          }
        }
        window.location.reload();
      } catch {
        alert("Failed to parse the file. Make sure it is a valid JSON backup.");
      }
    };
    reader.readAsText(file);
    e.target.value = "";
  }

  return (
    <div className="space-y-6 max-w-lg">
      <h1 className="text-2xl font-bold text-neutral-900 dark:text-white animate-in stagger-1">Settings / Profile</h1>

      <div className="glass rounded-2xl p-5 space-y-3 animate-in stagger-2">
        <h2 className="text-neutral-900 dark:text-white font-semibold flex items-center gap-2"><User className="w-4 h-4" /> Profile</h2>
        <div>
          <label className="text-xs text-neutral-500">Full Name</label>
          <input
            value={profile.name}
            onChange={(e) => setProfile({ ...profile, name: e.target.value })}
            className="w-full glass rounded-xl px-3 py-2 text-sm text-neutral-900 dark:text-white mt-1 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-violet-500/50"
          />
        </div>
        <div>
          <label className="text-xs text-neutral-500">Target Roles</label>
          <input
            value={profile.targetRoles}
            onChange={(e) => setProfile({ ...profile, targetRoles: e.target.value })}
            className="w-full glass rounded-xl px-3 py-2 text-sm text-neutral-900 dark:text-white mt-1 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-violet-500/50"
          />
        </div>
        <div>
          <label className="text-xs text-neutral-500">GitHub</label>
          <input
            value={profile.github}
            onChange={(e) => setProfile({ ...profile, github: e.target.value })}
            className="w-full glass rounded-xl px-3 py-2 text-sm text-neutral-900 dark:text-white mt-1 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-violet-500/50"
          />
        </div>
        <div>
          <label className="text-xs text-neutral-500">Email</label>
          <input
            value={profile.email}
            onChange={(e) => setProfile({ ...profile, email: e.target.value })}
            className="w-full glass rounded-xl px-3 py-2 text-sm text-neutral-900 dark:text-white mt-1 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-violet-500/50"
          />
        </div>
        <div>
          <label className="text-xs text-neutral-500">Phone</label>
          <input
            value={profile.phone}
            onChange={(e) => setProfile({ ...profile, phone: e.target.value })}
            className="w-full glass rounded-xl px-3 py-2 text-sm text-neutral-900 dark:text-white mt-1 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-violet-500/50"
          />
        </div>
        <div>
          <label className="text-xs text-neutral-500">Plan start date</label>
          <input
            type="date"
            value={planStartDate}
            onChange={(e) => setPlanStartDate(e.target.value)}
            className="w-full glass rounded-xl px-3 py-2 text-sm text-neutral-900 dark:text-white mt-1 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-violet-500/50"
          />
          <p className="text-[11px] text-neutral-400 mt-1">Controls &quot;Day X of 90&quot; on the Plan page.</p>
        </div>
      </div>

      <div className="glass rounded-2xl p-5 space-y-3 animate-in stagger-2">
        <h2 className="text-neutral-900 dark:text-white font-semibold flex items-center gap-2"><GitBranch className="w-4 h-4" /> GitHub Integration</h2>
        <p className="text-xs text-neutral-500">Public repos are fetched from the GitHub API (60 requests/hour without auth).</p>
        <div>
          <label className="text-xs text-neutral-500">GitHub Username</label>
          <input
            value={githubUsername}
            onChange={(e) => setGithubUsername(e.target.value)}
            placeholder="e.g. Nardszi"
            className="w-full glass rounded-xl px-3 py-2 text-sm text-neutral-900 dark:text-white mt-1 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-violet-500/50"
          />
          <p className="text-[11px] text-neutral-400 mt-1">Used to fetch your public repos for the Portfolio page.</p>
        </div>
      </div>

      <div className="glass rounded-2xl p-5 space-y-3 animate-in stagger-3">
        <h2 className="text-neutral-900 dark:text-white font-semibold flex items-center gap-2">
          {notifEnabled ? <Bell className="w-4 h-4" /> : <BellOff className="w-4 h-4" />} Reminders
        </h2>
        {!notifSupported ? (
          <p className="text-sm text-neutral-500">
            Notifications are not supported in this browser.
          </p>
        ) : notifPermission === "denied" ? (
          <p className="text-sm text-neutral-500">
            Notification permission was denied. Please enable it in your browser settings.
          </p>
        ) : (
          <>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-neutral-700 dark:text-neutral-300">Enable reminders</p>
                <p className="text-xs text-neutral-500">Get daily task nudges and follow-up reminders</p>
              </div>
              <button
                onClick={toggleNotifications}
                className={`relative w-11 h-6 rounded-full transition-all duration-200 active:scale-95 ${
                  notifEnabled ? "bg-violet-500" : "bg-neutral-300 dark:bg-neutral-700"
                }`}
              >
                <span
                  className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full transition-transform ${
                    notifEnabled ? "translate-x-5" : ""
                  }`}
                />
              </button>
            </div>
            {notifEnabled && (
              <div className="flex items-center gap-3">
                <label className="text-xs text-neutral-500">Daily reminder time</label>
                <input
                  type="time"
                  value={notifTime}
                  onChange={(e) => handleNotifTimeChange(e.target.value)}
                  className="glass rounded-xl px-3 py-1 text-sm text-neutral-900 dark:text-white transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-violet-500/50"
                />
              </div>
            )}
            <p className="text-xs text-neutral-400 italic">
              Note: Background notifications have limited support on iOS Safari PWAs. Reminders only work while the app is open.
            </p>
          </>
        )}
      </div>

      <div className="glass rounded-2xl p-5 space-y-3 animate-in stagger-4">
        <h2 className="text-neutral-900 dark:text-white font-semibold flex items-center gap-2"><Shield className="w-4 h-4" /> Data Backup</h2>
        <p className="text-sm text-neutral-500">
          Export all your data as a JSON file, or import from a previous backup.
        </p>
        <div className="flex gap-3">
          <button
            onClick={exportData}
            className="glass hover:bg-white/[0.06] text-neutral-700 dark:text-neutral-300 px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2 transition-all duration-200 active:scale-95"
          >
            <Download className="w-4 h-4" /> Export Data
          </button>
          <button
            onClick={() => fileInputRef.current?.click()}
            className="glass hover:bg-white/[0.06] text-neutral-700 dark:text-neutral-300 px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2 transition-all duration-200 active:scale-95"
          >
            <Upload className="w-4 h-4" /> Import Data
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept=".json"
            onChange={importData}
            className="hidden"
          />
        </div>
      </div>

      <div className="glass rounded-2xl border-rose-500/20 bg-rose-500/5 p-5 animate-in stagger-5">
        <h2 className="text-neutral-900 dark:text-white font-semibold mb-2 flex items-center gap-2"><Trash2 className="w-4 h-4" /> Danger Zone</h2>
        <p className="text-sm text-neutral-500 mb-3">
          All data is stored only in this browser (localStorage). Clearing it cannot be undone.
        </p>
        <button
          onClick={clearAllData}
          className="bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 active:scale-95 flex items-center gap-2"
        >
          <Trash2 className="w-4 h-4" /> Clear All Data
        </button>
      </div>
    </div>
  );
}
