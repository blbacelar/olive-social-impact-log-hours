"use client";

import Link from "next/link";

import { AdminSettingsPanel } from "@/components/admin-settings-panel";
import { PageHeader } from "@/components/page-header";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { useWorkspace } from "@/components/workspace-provider";

export default function AdminSettingsPage() {
  const { isAdmin, logs, userProfiles } = useWorkspace();

  if (!isAdmin) {
    return (
      <Card className="max-w-lg">
        <CardHeader>
          <CardTitle>Admin access required</CardTitle>
          <CardDescription>
            Your account does not have permission to change app settings.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button asChild>
            <Link href="/">Return to overview</Link>
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <PageHeader
        eyebrow="Admin"
        title="Settings"
        description="Configure compensation rates for each team member."
      />
      <AdminSettingsPanel logs={logs} userProfiles={userProfiles} />
    </>
  );
}
