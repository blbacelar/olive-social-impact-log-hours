export type LogStatus = "pending" | "approved" | "paid";

export type TimeLog = {
  id: string;
  userId: string;
  userName: string;
  project: string;
  description: string;
  date: string;
  totalMinutes: number;
  rate: number | null;
  status: LogStatus;
  periodId: string;
};

export type NewTimeLog = Omit<TimeLog, "id" | "status" | "periodId">;

export type TimeTrackingSettings = {
  projects: string[];
};

export type UserProfile = {
  id: string;
  email: string;
  displayName: string;
  hourlyRate: number | null;
};

export const DEFAULT_PROJECTS = [
  "Governance Consulting",
  "Policy Development",
  "Client Facilitation",
  "Research & Analysis",
  "Platform Development",
];

export const ADMIN_EMAILS = (
  process.env.NEXT_PUBLIC_ADMIN_EMAILS ||
  "rosalyn@olivesocialimpact.com,bacelardigitaltech@gmail.com"
)
  .split(",")
  .map((email) => email.trim().toLowerCase())
  .filter(Boolean);

export function getUserName(
  displayName: string | null | undefined,
  email: string | null | undefined,
) {
  const normalizedName = displayName?.trim();
  if (normalizedName) return normalizedName;

  const emailName = email?.split("@")[0]?.trim();
  return emailName || "Team member";
}
