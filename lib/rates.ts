import type { TimeLog, UserProfile } from "@/lib/types";

export function getLogUserName(
  log: TimeLog,
  userProfiles: UserProfile[],
): string {
  const profile = userProfiles.find((item) => item.id === log.userId);
  return profile?.displayName || profile?.email || log.userName || "Team member";
}

export function getApprovalRate(
  log: TimeLog,
  userProfiles: UserProfile[],
): number | null {
  if (log.rate !== null) return log.rate;

  return (
    userProfiles.find((profile) => profile.id === log.userId)?.hourlyRate ??
    null
  );
}
