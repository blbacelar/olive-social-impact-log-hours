"use client";

import Link from "next/link";

import { ApprovalCenter } from "@/components/approval-center";
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

export default function ApprovalsPage() {
  const { logs, isAdmin, userProfiles } = useWorkspace();

  if (!isAdmin) {
    return (
      <Card className="max-w-lg">
        <CardHeader>
          <CardTitle>Admin access required</CardTitle>
          <CardDescription>
            Your account does not have permission to review team approvals.
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
        title="Approvals"
        description="Review pending contributions, group them into billing periods, and record completed payments."
      />
      <ApprovalCenter logs={logs} userProfiles={userProfiles} />
    </>
  );
}
