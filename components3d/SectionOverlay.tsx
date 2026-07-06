"use client";

import { useEffect, useRef } from "react";
import { X } from "lucide-react";

interface SectionOverlayProps {
  sectionId: string;
  onClose: () => void;
  children: React.ReactNode;
}

export default function SectionOverlay({ sectionId, onClose, children }: SectionOverlayProps) {
  const backdropRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [onClose]);

  useEffect(() => {
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = ""; };
  }, []);

  const sectionTitles: Record<string, string> = {
    applications: "Applications",
    exercise: "Exercise",
    notes: "Interview Prep Notes",
    recruiters: "Recruiters",
    streaks: "Streaks & Activity",
  };

  return (
    <div
      ref={backdropRef}
      className="fixed inset-0 bg-black/70 modal-backdrop flex items-center justify-center p-4 z-50"
      onMouseDown={(e) => {
        if (e.target === backdropRef.current) onClose();
      }}
    >
      <div className="modal-content bg-white dark:bg-neutral-950 rounded-2xl w-full max-w-4xl max-h-[90vh] overflow-y-auto shadow-2xl border border-neutral-200 dark:border-white/[0.08]">
        <div className="sticky top-0 z-10 bg-white dark:bg-neutral-950 border-b border-neutral-200 dark:border-white/[0.08] px-6 py-4 flex items-center justify-between rounded-t-2xl">
          <h2 className="text-lg font-bold text-neutral-900 dark:text-white">
            {sectionTitles[sectionId] || sectionId}
          </h2>
          <button
            onClick={onClose}
            className="text-neutral-400 hover:text-neutral-900 dark:hover:text-white p-1 transition-colors"
          >
            <X size={20} />
          </button>
        </div>
        <div className="p-6">
          {children}
        </div>
      </div>
    </div>
  );
}
