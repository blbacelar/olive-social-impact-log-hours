"use client";

import Link from "next/link";
import {
  ArrowRight,
  CheckCheck,
  Clock3,
  FileBarChart,
  FolderKanban,
  History,
} from "lucide-react";

import { PageHeader } from "@/components/page-header";
import { StatsGrid } from "@/components/stats-grid";
import { Card, CardContent } from "@/components/ui/card";
import { useWorkspace } from "@/components/workspace-provider";

export default function OverviewPage() {
  const { logs, isAdmin } = useWorkspace();

  const actions = [
    {
      href: "/log-time",
      title: "Log time",
      description: "Start a live timer or record completed work.",
      icon: Clock3,
    },
    {
      href: "/history",
      title: "View history",
      description: isAdmin
        ? "Review and manage all recorded entries."
        : "Review your recorded time and statuses.",
      icon: History,
    },
    ...(isAdmin
      ? [
          {
            href: "/admin/approvals",
            title: "Review approvals",
            description: "Approve pending work and close billing periods.",
            icon: CheckCheck,
          },
          {
            href: "/admin/reports",
            title: "Financial reports",
            description: "Review period totals, contributors, and payments.",
            icon: FileBarChart,
          },
          {
            href: "/admin/projects",
            title: "Projects and clients",
            description: "Manage selectable projects and client names.",
            icon: FolderKanban,
          },
        ]
      : []),
  ];

  return (
    <>
      <PageHeader
        eyebrow="Overview"
        title="Time tracking"
        description="A concise view of contributions, approvals, and payments."
      />
      <StatsGrid logs={logs} />
      <div className="mt-8 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {actions.map(({ href, title, description, icon: Icon }) => (
          <Link key={href} href={href}>
            <Card className="h-full border-primary/10 transition hover:border-primary/30 hover:shadow-soft">
              <CardContent className="flex h-full items-start gap-4 p-5">
                <span className="rounded-md bg-primary/10 p-2 text-primary">
                  <Icon className="h-5 w-5" />
                </span>
                <span className="flex-1">
                  <span className="block font-medium">{title}</span>
                  <span className="mt-1 block text-sm text-muted-foreground">
                    {description}
                  </span>
                </span>
                <ArrowRight className="mt-1 h-4 w-4 text-muted-foreground" />
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>
    </>
  );
}
