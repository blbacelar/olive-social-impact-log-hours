"use client";

import { AlertCircle } from "lucide-react";

import { useWorkspace } from "@/components/workspace-provider";

export function WorkspaceErrorBanner() {
  const { error } = useWorkspace();

  if (!error) return null;

  return (
    <div
      className="mb-6 flex items-start gap-3 rounded-md border border-destructive/30 bg-destructive/5 p-3 text-sm text-destructive"
      role="alert"
    >
      <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
      <span>{error}</span>
    </div>
  );
}
