"use client";

import dynamic from "next/dynamic";

const Dashboard3D = dynamic(() => import("@/components3d/Dashboard3D"), {
  ssr: false,
  loading: () => (
    <div className="flex items-center justify-center h-[60vh]">
      <div className="glass rounded-2xl p-8 text-center">
        <div className="w-12 h-12 border-2 border-violet-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
        <p className="text-neutral-500">Loading 3D dashboard...</p>
      </div>
    </div>
  ),
});

export default function OverviewPage() {
  return <Dashboard3D />;
}
