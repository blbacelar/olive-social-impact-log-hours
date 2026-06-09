"use client";

import { LogTable } from "@/components/log-table";
import { PageHeader } from "@/components/page-header";
import { useWorkspace } from "@/components/workspace-provider";

export default function HistoryPage() {
  const { logs, isAdmin, projects, user, userProfiles } = useWorkspace();

  return (
    <>
      <PageHeader
        eyebrow="Records"
        title="Time history"
        description={
          isAdmin
            ? "Review, approve, edit, or delete recorded time across the team."
            : "Review your entries and follow their approval and payment status."
        }
      />
      <LogTable
        currentUserId={user.uid}
        isAdmin={isAdmin}
        logs={logs}
        projects={projects}
        userProfiles={userProfiles}
      />
    </>
  );
}
