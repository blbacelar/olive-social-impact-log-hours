"use client";

import Link from "next/link";

import { FinancialReport } from "@/components/financial-report";
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

export default function FinancialReportsPage() {
  const { logs, isAdmin, projects, userProfiles } = useWorkspace();

  if (!isAdmin) {
    return (
      <Card className="max-w-lg">
        <CardHeader>
          <CardTitle>Admin access required</CardTitle>
          <CardDescription>
            Your account does not have permission to view financial reports.
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
        title="Financial reports"
        description="Review hours, compensation, contributors, and payment status for every billing period."
      />
      <FinancialReport
        logs={logs}
        projects={projects}
        userProfiles={userProfiles}
      />
    </>
  );
}
