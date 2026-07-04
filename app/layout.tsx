import type { Metadata } from "next";
import "./globals.css";
import Sidebar from "@/components/Sidebar";

export const metadata: Metadata = {
  title: "Job Hunt HQ — Nard's Tracker",
  description: "30-60-90 day job hunt plan and application tracker",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full antialiased">
      <body className="min-h-full flex flex-col md:flex-row bg-neutral-900 text-neutral-100">
        <Sidebar />
        <main className="flex-1 p-4 md:p-8 max-w-5xl mx-auto w-full">{children}</main>
      </body>
    </html>
  );
}
