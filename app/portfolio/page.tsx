"use client";

import { useLocalStorage } from "@/lib/useLocalStorage";
import { defaultProjects } from "@/lib/planData";
import { Project } from "@/lib/types";
import { useState, useEffect, useCallback } from "react";
import {
  ExternalLink,
  Code2,
  Pencil,
  Star,
  RefreshCw,
  GitFork,
  Eye,
  EyeOff,
  AlertCircle,
} from "lucide-react";
import { fetchGitHubRepos, GitHubRepo } from "@/lib/github";

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `${days}d ago`;
  const months = Math.floor(days / 30);
  return `${months}mo ago`;
}

const LANG_COLORS: Record<string, string> = {
  TypeScript: "bg-blue-500/15 text-blue-500",
  JavaScript: "bg-yellow-500/15 text-yellow-500",
  PHP: "bg-purple-500/15 text-purple-500",
  Python: "bg-green-500/15 text-green-500",
  Java: "bg-orange-500/15 text-orange-500",
  HTML: "bg-orange-400/15 text-orange-400",
  CSS: "bg-sky-500/15 text-sky-500",
  Ruby: "bg-red-500/15 text-red-500",
  Go: "bg-cyan-500/15 text-cyan-500",
  Rust: "bg-amber-600/15 text-amber-600",
  "C++": "bg-pink-500/15 text-pink-500",
  C: "bg-gray-500/15 text-gray-500",
  Shell: "bg-emerald-500/15 text-emerald-500",
  Dart: "bg-sky-400/15 text-sky-400",
  Kotlin: "bg-violet-500/15 text-violet-500",
  Swift: "bg-orange-500/15 text-orange-500",
};

function RepoCard({
  repo,
  isPinned,
  onTogglePin,
  customDescription,
  onEditDescription,
}: {
  repo: GitHubRepo;
  isPinned: boolean;
  onTogglePin: () => void;
  customDescription: string;
  onEditDescription: (desc: string) => void;
}) {
  const langClass = repo.language
    ? LANG_COLORS[repo.language] ?? "bg-neutral-500/15 text-neutral-500"
    : null;

  return (
    <div className="glass rounded-2xl p-5 space-y-3 hover:scale-[1.02] transition-all duration-200">
      <div className="flex justify-between items-start gap-2">
        <h3 className="text-neutral-900 dark:text-white font-semibold text-sm truncate">
          {repo.name}
        </h3>
        <div className="flex items-center gap-2 shrink-0">
          {repo.fork && (
            <span className="flex items-center gap-1 text-[11px] text-neutral-400">
              <GitFork size={11} />
              fork
            </span>
          )}
          <button
            onClick={onTogglePin}
            className={`text-[11px] flex items-center gap-1 px-2 py-0.5 rounded-lg transition-all duration-200 active:scale-95 ${
              isPinned
                ? "bg-amber-500/10 text-amber-500 border border-amber-500/20"
                : "text-neutral-400 hover:text-amber-400 border border-transparent"
            }`}
          >
            {isPinned ? "★ Pinned" : "☆ Pin"}
          </button>
        </div>
      </div>
      <div className="group relative">
        <p className="text-xs text-neutral-500 dark:text-neutral-400 line-clamp-2">
          {customDescription || repo.description || "No description provided"}
        </p>
        <button
          onClick={() => {
            const desc = prompt("Edit description:", customDescription || repo.description || "");
            if (desc !== null) onEditDescription(desc);
          }}
          className="absolute -right-1 -top-1 opacity-0 group-hover:opacity-100 text-[10px] text-neutral-400 hover:text-violet-400 transition-all"
        >
          edit
        </button>
      </div>
      <div className="flex flex-wrap items-center gap-2">
        {repo.language && langClass && (
          <span className={`text-[11px] px-2 py-0.5 rounded-lg font-medium ${langClass}`}>
            {repo.language}
          </span>
        )}
        {repo.stargazers_count > 0 && (
          <span className="flex items-center gap-1 text-[11px] text-neutral-500">
            <Star size={11} />
            {repo.stargazers_count}
          </span>
        )}
        <span className="text-[11px] text-neutral-400">
          {timeAgo(repo.updated_at)}
        </span>
      </div>
      <div className="flex gap-3 text-sm pt-1">
        {repo.homepage && (
          <a
            href={repo.homepage}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400 hover:underline transition-all duration-200"
          >
            <ExternalLink size={13} />
            Live
          </a>
        )}
        <a
          href={repo.html_url}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-1 text-neutral-500 dark:text-neutral-400 hover:underline transition-all duration-200"
        >
          <Code2 size={13} />
          GitHub
        </a>
      </div>
    </div>
  );
}

export default function PortfolioPage() {
  const [projects, setProjects] = useLocalStorage<Project[]>(
    "jh_projects",
    defaultProjects
  );
  const [editing, setEditing] = useState<Project | null>(null);
  const [githubUsername] = useLocalStorage<string>(
    "jh_github_username",
    "Nardszi"
  );
  const [pinnedRepos, setPinnedRepos] = useLocalStorage<string[]>("jh_pinnedRepos", []);
  const [projectDescriptions, setProjectDescriptions] = useLocalStorage<Record<string, string>>("jh_projectDescriptions", {});

  const [repos, setRepos] = useState<GitHubRepo[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showForks, setShowForks] = useState(false);
  const [lastCached, setLastCached] = useState(false);

  const loadRepos = useCallback(
    async (force = false) => {
      setLoading(true);
      setError(null);
      try {
        const result = await fetchGitHubRepos(githubUsername, force);
        setRepos(result.repos);
        setLastCached(result.cached);
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "Failed to fetch repositories"
        );
      } finally {
        setLoading(false);
      }
    },
    [githubUsername]
  );

  useEffect(() => {
    loadRepos();
  }, [loadRepos]);

  function save(p: Project) {
    setProjects((prev) => prev.map((x) => (x.id === p.id ? p : x)));
    setEditing(null);
  }

  const filteredRepos = showForks ? repos : repos.filter((r) => !r.fork);
  const forkCount = repos.filter((r) => r.fork).length;

  const sortedRepos = [...filteredRepos].sort((a, b) => {
    const aPinned = pinnedRepos.includes(a.name) ? 0 : 1;
    const bPinned = pinnedRepos.includes(b.name) ? 0 : 1;
    return aPinned - bPinned;
  });

  return (
    <div className="space-y-8">
      <div className="animate-in">
        <h1 className="text-2xl font-bold text-neutral-900 dark:text-white tracking-tight">
          Portfolio
        </h1>
        <p className="text-sm text-neutral-500 dark:text-neutral-400 mt-0.5">
          Featured projects and live GitHub activity
        </p>
      </div>

      {/* Featured Projects */}
      <div className="space-y-4 animate-in stagger-1">
        <h2 className="text-lg font-semibold text-neutral-900 dark:text-white">
          Featured Projects
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {projects.map((p, i) => (
            <div
              key={p.id}
              className={`glass rounded-2xl p-5 space-y-3 hover:scale-[1.02] transition-all duration-200 animate-in stagger-${i + 2}`}
            >
              <div className="flex justify-between items-start">
                <h3 className="text-neutral-900 dark:text-white font-semibold">
                  {p.name}
                </h3>
                <span className="glass text-xs px-2 py-1 rounded-full text-neutral-600 dark:text-neutral-300 shrink-0">
                  {p.status}
                </span>
              </div>
              <p className="text-sm text-neutral-500 dark:text-neutral-400">
                {p.description}
              </p>
              <div className="flex flex-wrap gap-1.5">
                {p.techStack.map((t) => (
                  <span
                    key={t}
                    className="glass text-xs px-2 py-0.5 rounded-lg text-neutral-600 dark:text-neutral-300"
                  >
                    {t}
                  </span>
                ))}
              </div>
              <div className="flex gap-4 text-sm">
                {p.liveUrl ? (
                  <a
                    href={p.liveUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400 hover:underline transition-all duration-200"
                  >
                    <ExternalLink size={14} />
                    Live
                  </a>
                ) : (
                  <span className="text-neutral-400">Not deployed yet</span>
                )}
                {p.githubUrl && (
                  <a
                    href={p.githubUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1 text-neutral-500 dark:text-neutral-400 hover:underline transition-all duration-200"
                  >
                    <Code2 size={14} />
                    GitHub
                  </a>
                )}
              </div>
              <button
                onClick={() => setEditing(p)}
                className="flex items-center gap-1 text-xs text-neutral-500 hover:text-neutral-900 dark:hover:text-white active:scale-95 transition-all duration-200"
              >
                <Pencil size={12} />
                Edit links / details
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* GitHub Repositories */}
      <div className="space-y-4 animate-in stagger-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-lg font-semibold text-neutral-900 dark:text-white">
              GitHub Repositories
            </h2>
            <p className="text-xs text-neutral-500 mt-0.5">
              from github.com/{githubUsername}
              {lastCached && " (cached)"}
            </p>
          </div>
          <div className="flex items-center gap-2">
            {forkCount > 0 && (
              <button
                onClick={() => setShowForks(!showForks)}
                className="flex items-center gap-1.5 glass px-3 py-1.5 rounded-lg text-xs text-neutral-500 dark:text-neutral-400 hover:bg-white/[0.06] dark:hover:bg-white/[0.04] active:scale-95 transition-all duration-200"
              >
                {showForks ? <EyeOff size={13} /> : <Eye size={13} />}
                {showForks ? "Hide" : "Show"} forks ({forkCount})
              </button>
            )}
            <button
              onClick={() => loadRepos(true)}
              disabled={loading}
              className="flex items-center gap-1.5 glass px-3 py-1.5 rounded-lg text-xs text-neutral-500 dark:text-neutral-400 hover:bg-white/[0.06] dark:hover:bg-white/[0.04] active:scale-95 transition-all duration-200 disabled:opacity-50"
            >
              <RefreshCw
                size={13}
                className={loading ? "animate-spin" : ""}
              />
              Refresh
            </button>
          </div>
        </div>

        {error && (
          <div className="glass rounded-2xl p-5 text-center space-y-3">
            <AlertCircle size={24} className="mx-auto text-rose-400" />
            <p className="text-sm text-neutral-500">{error}</p>
            <button
              onClick={() => loadRepos(true)}
              className="text-sm text-violet-500 hover:underline"
            >
              Try again
            </button>
          </div>
        )}

        {!error && loading && repos.length === 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {[1, 2, 3, 4].map((i) => (
              <div
                key={i}
                className="glass rounded-2xl p-5 space-y-3 animate-pulse"
              >
                <div className="h-4 bg-neutral-200 dark:bg-white/[0.06] rounded w-1/3" />
                <div className="h-3 bg-neutral-200 dark:bg-white/[0.06] rounded w-full" />
                <div className="h-3 bg-neutral-200 dark:bg-white/[0.06] rounded w-2/3" />
              </div>
            ))}
          </div>
        )}

        {!error && !loading && filteredRepos.length === 0 && repos.length > 0 && (
          <div className="glass rounded-2xl p-8 text-center">
            <p className="text-sm text-neutral-500">
              All repos are forks.{" "}
              <button
                onClick={() => setShowForks(true)}
                className="text-violet-500 hover:underline"
              >
                Show forks
              </button>
            </p>
          </div>
        )}

        {!error && !loading && repos.length === 0 && (
          <div className="glass rounded-2xl p-8 text-center space-y-2">
            <p className="text-sm text-neutral-500">
              No public repositories found for{" "}
              <span className="font-medium text-neutral-700 dark:text-neutral-300">
                {githubUsername}
              </span>
            </p>
            <p className="text-xs text-neutral-400">
              Check your GitHub username in Settings
            </p>
          </div>
        )}

        {!error && sortedRepos.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {sortedRepos.map((repo) => (
              <RepoCard
                key={repo.name}
                repo={repo}
                isPinned={pinnedRepos.includes(repo.name)}
                onTogglePin={() => {
                  setPinnedRepos((prev) =>
                    prev.includes(repo.name)
                      ? prev.filter((n) => n !== repo.name)
                      : [...prev, repo.name]
                  );
                }}
                customDescription={projectDescriptions[repo.name] || ""}
                onEditDescription={(desc) => {
                  setProjectDescriptions((prev) => ({ ...prev, [repo.name]: desc }));
                }}
              />
            ))}
          </div>
        )}
      </div>

      {/* Edit Modal */}
      {editing && (
        <div className="modal-backdrop fixed inset-0 bg-black/60 flex items-center justify-center p-4 z-50">
          <div className="modal-content glass rounded-2xl p-6 w-full max-w-lg space-y-3">
            <h2 className="text-neutral-900 dark:text-white font-semibold text-lg">
              Edit {editing.name}
            </h2>
            <textarea
              value={editing.description}
              onChange={(e) =>
                setEditing({ ...editing, description: e.target.value })
              }
              rows={3}
              className="w-full glass rounded-xl px-3 py-2 text-sm text-neutral-900 dark:text-white transition-all duration-200"
            />
            <input
              placeholder="Live URL"
              value={editing.liveUrl}
              onChange={(e) =>
                setEditing({ ...editing, liveUrl: e.target.value })
              }
              className="w-full glass rounded-xl px-3 py-2 text-sm text-neutral-900 dark:text-white transition-all duration-200"
            />
            <input
              placeholder="GitHub URL"
              value={editing.githubUrl}
              onChange={(e) =>
                setEditing({ ...editing, githubUrl: e.target.value })
              }
              className="w-full glass rounded-xl px-3 py-2 text-sm text-neutral-900 dark:text-white transition-all duration-200"
            />
            <input
              placeholder="Status"
              value={editing.status}
              onChange={(e) =>
                setEditing({ ...editing, status: e.target.value })
              }
              className="w-full glass rounded-xl px-3 py-2 text-sm text-neutral-900 dark:text-white transition-all duration-200"
            />
            <div className="flex justify-end gap-2 pt-2">
              <button
                onClick={() => setEditing(null)}
                className="px-4 py-2 rounded-xl text-sm text-neutral-500 hover:text-neutral-900 dark:hover:text-white active:scale-95 transition-all duration-200"
              >
                Cancel
              </button>
              <button
                onClick={() => save(editing)}
                className="bg-emerald-600 hover:bg-emerald-500 text-white px-4 py-2 rounded-xl text-sm font-medium active:scale-95 transition-all duration-200"
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
