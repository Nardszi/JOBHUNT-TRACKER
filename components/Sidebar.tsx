"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";

const links = [
  { href: "/", label: "Overview", icon: "📊" },
  { href: "/plan", label: "Plan", icon: "🗓️" },
  { href: "/applications", label: "Applications", icon: "📨" },
  { href: "/portfolio", label: "Portfolio", icon: "💼" },
  { href: "/notes", label: "Prep Notes", icon: "📝" },
  { href: "/settings", label: "Settings", icon: "⚙️" },
];

export default function Sidebar() {
  const pathname = usePathname();
  const [dark, setDark] = useState(true);

  useEffect(() => {
    const stored = localStorage.getItem("jh_theme");
    const isDark = stored !== "light";
    setDark(isDark);
  }, []);

  function toggleTheme() {
    const next = !dark;
    setDark(next);
    if (next) {
      document.documentElement.classList.add("dark");
      localStorage.setItem("jh_theme", "dark");
    } else {
      document.documentElement.classList.remove("dark");
      localStorage.setItem("jh_theme", "light");
    }
  }

  return (
    <aside className="w-full md:w-56 md:min-h-screen bg-neutral-50 dark:bg-neutral-950 border-r border-neutral-200 dark:border-neutral-800 flex md:flex-col">
      <div className="p-4 hidden md:block">
        <h1 className="text-lg font-bold text-neutral-900 dark:text-white">Job Hunt HQ</h1>
        <p className="text-xs text-neutral-500">30-60-90 tracker</p>
      </div>
      <nav className="flex md:flex-col flex-1 overflow-x-auto md:overflow-visible">
        {links.map((link) => {
          const active = pathname === link.href;
          return (
            <Link
              key={link.href}
              href={link.href}
              className={`flex items-center gap-2 px-4 py-3 text-sm whitespace-nowrap border-b md:border-b-0 md:border-l-2 ${
                active
                  ? "border-emerald-500 bg-neutral-100 dark:bg-neutral-900 text-emerald-600 dark:text-emerald-400"
                  : "border-transparent text-neutral-500 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white hover:bg-neutral-100 dark:hover:bg-neutral-900"
              }`}
            >
              <span>{link.icon}</span>
              <span>{link.label}</span>
            </Link>
          );
        })}
      </nav>
      <div className="p-4 border-t border-neutral-200 dark:border-neutral-800 hidden md:block">
        <button
          onClick={toggleTheme}
          className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-lg text-sm bg-neutral-100 dark:bg-neutral-900 hover:bg-neutral-200 dark:hover:bg-neutral-800 text-neutral-700 dark:text-neutral-300 transition"
        >
          {dark ? "☀️ Light Mode" : "🌙 Dark Mode"}
        </button>
      </div>
    </aside>
  );
}
