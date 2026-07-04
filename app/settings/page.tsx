"use client";

import { useLocalStorage } from "@/lib/useLocalStorage";
import { defaultProfile } from "@/lib/planData";
import { Profile } from "@/lib/types";

export default function SettingsPage() {
  const [profile, setProfile] = useLocalStorage<Profile>("jh_profile", defaultProfile);

  function clearAllData() {
    if (confirm("This will erase all tasks, applications, projects, and notes stored in this browser. Continue?")) {
      localStorage.clear();
      window.location.reload();
    }
  }

  return (
    <div className="space-y-6 max-w-lg">
      <h1 className="text-2xl font-bold text-white">Settings / Profile</h1>

      <div className="bg-neutral-950 border border-neutral-800 rounded-xl p-5 space-y-3">
        <div>
          <label className="text-xs text-neutral-500">Full Name</label>
          <input
            value={profile.name}
            onChange={(e) => setProfile({ ...profile, name: e.target.value })}
            className="w-full bg-neutral-900 border border-neutral-700 rounded-lg px-3 py-2 text-sm text-white mt-1"
          />
        </div>
        <div>
          <label className="text-xs text-neutral-500">Target Roles</label>
          <input
            value={profile.targetRoles}
            onChange={(e) => setProfile({ ...profile, targetRoles: e.target.value })}
            className="w-full bg-neutral-900 border border-neutral-700 rounded-lg px-3 py-2 text-sm text-white mt-1"
          />
        </div>
        <div>
          <label className="text-xs text-neutral-500">GitHub</label>
          <input
            value={profile.github}
            onChange={(e) => setProfile({ ...profile, github: e.target.value })}
            className="w-full bg-neutral-900 border border-neutral-700 rounded-lg px-3 py-2 text-sm text-white mt-1"
          />
        </div>
        <div>
          <label className="text-xs text-neutral-500">Email</label>
          <input
            value={profile.email}
            onChange={(e) => setProfile({ ...profile, email: e.target.value })}
            className="w-full bg-neutral-900 border border-neutral-700 rounded-lg px-3 py-2 text-sm text-white mt-1"
          />
        </div>
        <div>
          <label className="text-xs text-neutral-500">Phone</label>
          <input
            value={profile.phone}
            onChange={(e) => setProfile({ ...profile, phone: e.target.value })}
            className="w-full bg-neutral-900 border border-neutral-700 rounded-lg px-3 py-2 text-sm text-white mt-1"
          />
        </div>
      </div>

      <div className="bg-neutral-950 border border-red-900/50 rounded-xl p-5">
        <h2 className="text-white font-semibold mb-2">Danger Zone</h2>
        <p className="text-sm text-neutral-500 mb-3">
          All data is stored only in this browser (localStorage). Clearing it cannot be undone.
        </p>
        <button
          onClick={clearAllData}
          className="bg-red-900/50 hover:bg-red-900 text-red-300 px-4 py-2 rounded-lg text-sm font-medium"
        >
          Clear All Data
        </button>
      </div>
    </div>
  );
}
