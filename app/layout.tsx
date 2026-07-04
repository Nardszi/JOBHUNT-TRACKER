import type { Metadata } from "next";
import "./globals.css";
import Sidebar from "@/components/Sidebar";

export const metadata: Metadata = {
  title: "Job Hunt HQ — Nard's Tracker",
  description: "30-60-90 day job hunt plan and application tracker",
};

function ThemeScript() {
  return (
    <script
      dangerouslySetInnerHTML={{
        __html: `
          (function() {
            try {
              var theme = localStorage.getItem('jh_theme');
              if (theme === 'light') {
                document.documentElement.classList.remove('dark');
              } else if (theme === 'dark') {
                document.documentElement.classList.add('dark');
              } else {
                document.documentElement.classList.add('dark');
              }
            } catch(e) {}
          })();
        `,
      }}
    />
  );
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full antialiased dark" suppressHydrationWarning>
      <head>
        <ThemeScript />
      </head>
      <body className="min-h-full flex flex-col md:flex-row bg-neutral-50 dark:bg-[#09090b] text-neutral-900 dark:text-neutral-100 font-sans">
        <Sidebar />
        <main className="flex-1 p-4 md:p-8 max-w-5xl mx-auto w-full page-enter">{children}</main>
      </body>
    </html>
  );
}
