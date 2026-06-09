"use client";

import Link from "next/link";

import { PageHeader } from "@/components/page-header";
import { ProjectManager } from "@/components/project-manager";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { useWorkspace } from "@/components/workspace-provider";

export default function ProjectsPage() {
  const { isAdmin, projects } = useWorkspace();

  if (!isAdmin) {
    return (
      <Card className="max-w-lg">
        <CardHeader>
          <CardTitle>Admin access required</CardTitle>
          <CardDescription>
            Your account cannot manage projects and clients.
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
        title="Projects and clients"
        description="Add, rename, or remove the options contributors use when recording time."
      />
      <ProjectManager projects={projects} />
    </>
  );
}
