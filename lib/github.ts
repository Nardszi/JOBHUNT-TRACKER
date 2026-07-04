"use client";

export interface GitHubRepo {
  name: string;
  description: string | null;
  html_url: string;
  homepage: string | null;
  language: string | null;
  topics: string[];
  stargazers_count: number;
  updated_at: string;
  fork: boolean;
}

interface GitHubCache {
  username: string;
  repos: GitHubRepo[];
  fetchedAt: number;
}

const CACHE_KEY = "jh_github_cache";
const CACHE_TTL = 60 * 60 * 1000; // 1 hour

function readCache(): GitHubCache | null {
  try {
    const raw = localStorage.getItem(CACHE_KEY);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

function writeCache(username: string, repos: GitHubRepo[]) {
  const cache: GitHubCache = { username, repos, fetchedAt: Date.now() };
  try {
    localStorage.setItem(CACHE_KEY, JSON.stringify(cache));
  } catch {
    // localStorage full or unavailable
  }
}

export async function fetchGitHubRepos(
  username: string,
  force = false
): Promise<{ repos: GitHubRepo[]; cached: boolean }> {
  const cached = readCache();

  if (
    !force &&
    cached &&
    cached.username === username &&
    Date.now() - cached.fetchedAt < CACHE_TTL
  ) {
    return { repos: cached.repos, cached: true };
  }

  try {
    const res = await fetch(
      `https://api.github.com/users/${encodeURIComponent(username)}/repos?sort=updated&per_page=100`,
      {
        headers: { Accept: "application/vnd.github.v3+json" },
      }
    );

    if (!res.ok) {
      if (cached && cached.username === username) {
        return { repos: cached.repos, cached: true };
      }
      throw new Error(`GitHub API error: ${res.status}`);
    }

    const data: GitHubRepo[] = await res.json();
    writeCache(username, data);
    return { repos: data, cached: false };
  } catch (err) {
    if (cached && cached.username === username) {
      return { repos: cached.repos, cached: true };
    }
    throw err;
  }
}

export function clearGitHubCache() {
  localStorage.removeItem(CACHE_KEY);
}
