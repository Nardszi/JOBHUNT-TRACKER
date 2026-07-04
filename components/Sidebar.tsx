"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import {
  LayoutDashboard,
  CalendarRange,
  Send,
  Briefcase,
  Dumbbell,
  StickyNote,
  Settings,
  Sun,
  Moon,
} from "lucide-react";

const links = [
  { href: "/", label: "Overview", icon: LayoutDashboard },
  { href: "/plan", label: "Plan", icon: CalendarRange },
  { href: "/applications", label: "Applications", icon: Send },
  { href: "/portfolio", label: "Portfolio", icon: Briefcase },
  { href: "/exercise", label: "Exercise", icon: Dumbbell },
  { href: "/notes", label: "Prep Notes", icon: StickyNote },
  { href: "/settings", label: "Settings", icon: Settings },
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
    <aside className="w-full md:w-56 md:min-h-screen glass-strong md:border-r border-neutral-200 dark:border-white/[0.08] flex md:flex-col">
      <div className="p-4 hidden md:block">
        <h1 className="text-lg font-bold text-neutral-900 dark:text-white tracking-tight">
          Nardz Tracker
        </h1>
        <p className="text-xs text-neutral-500 dark:text-neutral-500 tracking-wide uppercase mt-0.5">
          Job hunt & growth tracker
        </p>
      </div>
      <nav className="flex md:flex-col flex-1 overflow-x-auto md:overflow-visible">
        {links.map((link) => {
          const active = pathname === link.href;
          const Icon = link.icon;
          return (
            <Link
              key={link.href}
              href={link.href}
              className={`relative flex items-center gap-2.5 px-4 py-3 text-sm whitespace-nowrap transition-all duration-200 ${
                active
                  ? "text-violet-600 dark:text-violet-400 bg-violet-500/10"
                  : "text-neutral-500 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white hover:bg-neutral-100 dark:hover:bg-white/[0.04]"
              }`}
            >
              {active && (
                <span className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-5 bg-violet-500 rounded-r-full transition-all duration-300" />
              )}
              <Icon size={16} className={`transition-colors duration-200 ${active ? "text-violet-500" : ""}`} />
              <span>{link.label}</span>
            </Link>
          );
        })}
      </nav>
      <div className="p-4 border-t border-neutral-200 dark:border-white/[0.08] hidden md:block">
        <button
          onClick={toggleTheme}
          className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-lg text-sm glass hover:bg-neutral-200/50 dark:hover:bg-white/[0.06] text-neutral-600 dark:text-neutral-300 transition-all duration-200"
        >
          {dark ? <Sun size={14} /> : <Moon size={14} />}
          <span>{dark ? "Light Mode" : "Dark Mode"}</span>
        </button>
      </div>
    </aside>
  );
}
