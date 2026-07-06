"use client";

import { Html } from "@react-three/drei";

export interface TooltipData {
  position: [number, number, number];
  dayNumber: number;
  date: string;
  label: string;
  company?: string;
  status?: string;
  isMilestone?: boolean;
  milestoneSummary?: {
    totalApps: number;
    interviews: number;
    offers: number;
    rejected: number;
  };
}

interface MarkerTooltipProps {
  data: TooltipData;
  onClose: () => void;
}

export default function MarkerTooltip({ data, onClose }: MarkerTooltipProps) {
  return (
    <Html
      position={[data.position[0], data.position[1] + 0.35, data.position[2]]}
      center
      distanceFactor={7}
      zIndexRange={[100, 0]}
      style={{ pointerEvents: "auto" }}
    >
      <div
        className="bg-[#0a0f1a]/95 border border-white/10 rounded-xl px-4 py-3 text-center whitespace-nowrap shadow-2xl"
        onClick={(e) => e.stopPropagation()}
        onMouseLeave={onClose}
      >
        {data.isMilestone ? (
          <>
            <div className="text-amber-400 text-xs font-bold uppercase tracking-wider mb-1">
              Milestone: Day {data.dayNumber}
            </div>
            <div className="text-white text-sm font-medium mb-1.5">{data.date}</div>
            {data.milestoneSummary && (
              <div className="space-y-0.5 text-[11px] text-neutral-400">
                <div>
                  <span className="text-blue-400">{data.milestoneSummary.totalApps}</span> applications sent
                </div>
                <div>
                  <span className="text-amber-400">{data.milestoneSummary.interviews}</span> interviews
                </div>
                {data.milestoneSummary.offers > 0 && (
                  <div>
                    <span className="text-emerald-400">{data.milestoneSummary.offers}</span> offers
                  </div>
                )}
                {data.milestoneSummary.rejected > 0 && (
                  <div>
                    <span className="text-red-400">{data.milestoneSummary.rejected}</span> rejected
                  </div>
                )}
              </div>
            )}
          </>
        ) : data.status ? (
          <>
            <div className="text-white text-sm font-medium">{data.label}</div>
            {data.company && (
              <div className="text-neutral-400 text-[11px] mt-0.5">{data.company}</div>
            )}
            <div className="text-[10px] text-neutral-500 mt-1">
              Day {data.dayNumber} · {data.date}
            </div>
          </>
        ) : (
          <>
            <div className="text-white text-sm font-medium">Day {data.dayNumber}</div>
            <div className="text-neutral-400 text-[11px]">{data.date}</div>
            {data.label && <div className="text-neutral-500 text-[10px] mt-0.5">{data.label}</div>}
          </>
        )}
      </div>
    </Html>
  );
}
