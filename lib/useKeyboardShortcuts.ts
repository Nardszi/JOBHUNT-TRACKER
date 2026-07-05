"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export function useKeyboardShortcuts() {
  const router = useRouter();

  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement || e.target instanceof HTMLSelectElement) {
        return;
      }

      const ctrl = e.ctrlKey || e.metaKey;

      if (ctrl && e.key === "n") {
        e.preventDefault();
        router.push("/applications");
      }
      if (ctrl && e.key === "w") {
        e.preventDefault();
        router.push("/exercise");
      }
      if (ctrl && e.key === "p") {
        e.preventDefault();
        router.push("/plan");
      }
      if (ctrl && e.key === "k") {
        e.preventDefault();
        router.push("/notes");
      }
      if (ctrl && e.key === "j") {
        e.preventDefault();
        router.push("/portfolio");
      }
      if (e.key === "?") {
        e.preventDefault();
        const helpEl = document.getElementById("keyboard-shortcuts-help");
        if (helpEl) helpEl.classList.toggle("hidden");
      }
    }

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [router]);
}
