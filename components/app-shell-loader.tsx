"use client";

import dynamic from "next/dynamic";
import type { ReactNode } from "react";

const AppShell = dynamic(
  () => import("@/components/app-shell").then((module) => module.AppShell),
  {
    loading: () => (
      <main className="grid min-h-screen place-items-center">
        <p className="text-sm text-muted-foreground">Loading workspace...</p>
      </main>
    ),
    ssr: false,
  },
);

export function AppShellLoader({ children }: { children: ReactNode }) {
  return <AppShell>{children}</AppShell>;
}
