"use client";

import Link from "next/link";
import { Clock3, Pause, Play } from "lucide-react";

import { Button } from "@/components/ui/button";
import { useWorkspace } from "@/components/workspace-provider";
import { cn, formatTimer } from "@/lib/utils";

export function PersistentTimer({
  compact = false,
  className,
}: {
  compact?: boolean;
  className?: string;
}) {
  const {
    elapsedSeconds,
    isTimerRunning,
    pauseTimer,
    startTimer,
    activeProject,
  } = useWorkspace();

  if (elapsedSeconds === 0 && !isTimerRunning) return null;

  return (
    <div
      className={cn(
        "flex items-center gap-2 rounded-md border border-primary/20 bg-primary/[0.06] p-2",
        className,
      )}
    >
      <Link
        className="flex min-w-0 flex-1 items-center gap-2"
        href="/log-time"
      >
        <span
          className={cn(
            "rounded-full bg-primary/10 p-1.5 text-primary",
            isTimerRunning && "animate-pulse",
          )}
        >
          <Clock3 className="h-4 w-4" />
        </span>
        <span className="min-w-0">
          {!compact && (
            <span className="block truncate text-xs text-muted-foreground">
              {activeProject ||
                (isTimerRunning ? "Timer running" : "Timer paused")}
            </span>
          )}
          <span className="block font-mono text-sm font-semibold">
            {formatTimer(elapsedSeconds)}
          </span>
        </span>
      </Link>
      <Button
        aria-label={isTimerRunning ? "Pause timer" : "Resume timer"}
        size="icon"
        variant="ghost"
        onClick={isTimerRunning ? pauseTimer : startTimer}
      >
        {isTimerRunning ? (
          <Pause className="h-4 w-4" />
        ) : (
          <Play className="h-4 w-4" />
        )}
      </Button>
    </div>
  );
}
