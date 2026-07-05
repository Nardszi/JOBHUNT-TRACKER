"use client";

import { useKeyboardShortcuts } from "@/lib/useKeyboardShortcuts";

export default function KeyboardShortcutsProvider({ children }: { children: React.ReactNode }) {
  useKeyboardShortcuts();

  return (
    <>
      {children}
      <div id="keyboard-shortcuts-help" className="hidden fixed inset-0 bg-black/60 flex items-center justify-center p-4 z-[100]">
        <div className="bg-white dark:bg-neutral-900 rounded-2xl p-6 w-full max-w-sm shadow-2xl border border-neutral-200 dark:border-white/[0.08]">
          <h2 className="text-neutral-900 dark:text-white font-semibold mb-4">Keyboard Shortcuts</h2>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-neutral-500">New Application</span>
              <kbd className="px-1.5 py-0.5 rounded bg-neutral-100 dark:bg-white/[0.06] text-xs font-mono text-neutral-600 dark:text-neutral-300 border border-neutral-200 dark:border-white/[0.08]">Ctrl+N</kbd>
            </div>
            <div className="flex justify-between">
              <span className="text-neutral-500">New Workout</span>
              <kbd className="px-1.5 py-0.5 rounded bg-neutral-100 dark:bg-white/[0.06] text-xs font-mono text-neutral-600 dark:text-neutral-300 border border-neutral-200 dark:border-white/[0.08]">Ctrl+W</kbd>
            </div>
            <div className="flex justify-between">
              <span className="text-neutral-500">Plan Page</span>
              <kbd className="px-1.5 py-0.5 rounded bg-neutral-100 dark:bg-white/[0.06] text-xs font-mono text-neutral-600 dark:text-neutral-300 border border-neutral-200 dark:border-white/[0.08]">Ctrl+P</kbd>
            </div>
            <div className="flex justify-between">
              <span className="text-neutral-500">Notes</span>
              <kbd className="px-1.5 py-0.5 rounded bg-neutral-100 dark:bg-white/[0.06] text-xs font-mono text-neutral-600 dark:text-neutral-300 border border-neutral-200 dark:border-white/[0.08]">Ctrl+K</kbd>
            </div>
            <div className="flex justify-between">
              <span className="text-neutral-500">Portfolio</span>
              <kbd className="px-1.5 py-0.5 rounded bg-neutral-100 dark:bg-white/[0.06] text-xs font-mono text-neutral-600 dark:text-neutral-300 border border-neutral-200 dark:border-white/[0.08]">Ctrl+J</kbd>
            </div>
            <div className="flex justify-between">
              <span className="text-neutral-500">Show/Hide Shortcuts</span>
              <kbd className="px-1.5 py-0.5 rounded bg-neutral-100 dark:bg-white/[0.06] text-xs font-mono text-neutral-600 dark:text-neutral-300 border border-neutral-200 dark:border-white/[0.08]">?</kbd>
            </div>
          </div>
          <button
            onClick={() => document.getElementById("keyboard-shortcuts-help")?.classList.add("hidden")}
            className="mt-4 w-full text-center text-xs text-neutral-400 hover:text-neutral-900 dark:hover:text-white transition-colors"
          >
            Press ? or click to close
          </button>
        </div>
      </div>
    </>
  );
}
