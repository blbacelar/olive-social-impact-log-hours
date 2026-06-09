import type { TimeLog } from "@/lib/types";

export type CycleFilter =
  | "all"
  | "weekly"
  | "biweekly"
  | "monthly"
  | "pending";

export function matchesCycle(
  log: TimeLog,
  filter: CycleFilter,
  now = new Date(),
) {
  if (filter === "all") return true;
  if (filter === "pending") return log.status === "pending";

  const logDate = new Date(`${log.date}T00:00:00`);

  if (filter === "monthly") {
    return (
      logDate.getFullYear() === now.getFullYear() &&
      logDate.getMonth() === now.getMonth()
    );
  }

  const days = filter === "weekly" ? 7 : 14;
  const threshold = new Date(now);
  threshold.setHours(0, 0, 0, 0);
  threshold.setDate(threshold.getDate() - days + 1);

  const endOfToday = new Date(now);
  endOfToday.setHours(23, 59, 59, 999);
  return logDate >= threshold && logDate <= endOfToday;
}
