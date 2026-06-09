"use client";

import { useState } from "react";
import { FolderKanban, Pencil, Plus, Trash2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { updateProjects } from "@/lib/firebase/db";

export function ProjectManager({ projects }: { projects: string[] }) {
  const [newProject, setNewProject] = useState("");
  const [editingProject, setEditingProject] = useState<string | null>(null);
  const [editedName, setEditedName] = useState("");
  const [projectToDelete, setProjectToDelete] = useState<string | null>(null);
  const [feedback, setFeedback] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  function validateName(name: string, currentName?: string) {
    const normalized = name.trim();
    if (!normalized) return "Enter a project or client name.";
    if (
      projects.some(
        (project) =>
          project !== currentName &&
          project.toLowerCase() === normalized.toLowerCase(),
      )
    ) {
      return "That project or client already exists.";
    }
    return "";
  }

  async function addProject() {
    const error = validateName(newProject);
    if (error) {
      setFeedback(error);
      return;
    }

    setIsSaving(true);
    setFeedback("");
    try {
      await updateProjects([...projects, newProject.trim()]);
      setNewProject("");
      setFeedback("Project or client added.");
    } catch (error) {
      setFeedback(
        error instanceof Error ? error.message : "Unable to add the project.",
      );
    } finally {
      setIsSaving(false);
    }
  }

  async function renameProject() {
    if (!editingProject) return;
    const error = validateName(editedName, editingProject);
    if (error) {
      setFeedback(error);
      return;
    }

    setIsSaving(true);
    setFeedback("");
    try {
      await updateProjects(
        projects.map((project) =>
          project === editingProject ? editedName.trim() : project,
        ),
      );
      setEditingProject(null);
      setEditedName("");
      setFeedback(
        "Project or client renamed. Historical entries keep their original name.",
      );
    } catch (error) {
      setFeedback(
        error instanceof Error
          ? error.message
          : "Unable to rename the project.",
      );
    } finally {
      setIsSaving(false);
    }
  }

  async function removeProject() {
    if (!projectToDelete) return;
    setIsSaving(true);
    setFeedback("");
    try {
      await updateProjects(
        projects.filter((project) => project !== projectToDelete),
      );
      setProjectToDelete(null);
      setFeedback("Project or client removed.");
    } catch (error) {
      setFeedback(
        error instanceof Error
          ? error.message
          : "Unable to remove the project.",
      );
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <>
      <Card className="border-primary/15 shadow-soft">
        <CardHeader className="gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <CardTitle>Projects and clients</CardTitle>
            <CardDescription className="mt-2">
              Manage the options available when contributors log or edit time.
            </CardDescription>
          </div>
          <FolderKanban className="h-5 w-5 text-primary" />
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="max-w-xl space-y-2">
            <Label htmlFor="new-project">New project or client</Label>
            <div className="flex gap-2">
              <Input
                id="new-project"
                placeholder="Enter a name"
                value={newProject}
                onChange={(event) => setNewProject(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === "Enter") {
                    event.preventDefault();
                    void addProject();
                  }
                }}
              />
              <Button disabled={isSaving} onClick={addProject}>
                <Plus className="h-4 w-4" />
                Add
              </Button>
            </div>
          </div>

          <div className="overflow-hidden rounded-md border">
            {projects.map((project) => (
              <div
                key={project}
                className="flex items-center justify-between gap-4 border-b px-4 py-3 last:border-b-0"
              >
                <p className="font-medium">{project}</p>
                <div className="flex gap-1">
                  <Button
                    aria-label={`Rename ${project}`}
                    size="icon"
                    variant="ghost"
                    onClick={() => {
                      setEditingProject(project);
                      setEditedName(project);
                      setFeedback("");
                    }}
                  >
                    <Pencil className="h-4 w-4" />
                  </Button>
                  <Button
                    aria-label={`Remove ${project}`}
                    size="icon"
                    variant="ghost"
                    onClick={() => {
                      setProjectToDelete(project);
                      setFeedback("");
                    }}
                  >
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </div>
              </div>
            ))}
            {projects.length === 0 && (
              <p className="p-10 text-center text-sm text-muted-foreground">
                Add the first project or client to enable time entry.
              </p>
            )}
          </div>

          {feedback && (
            <p className="text-sm text-muted-foreground" role="status">
              {feedback}
            </p>
          )}
        </CardContent>
      </Card>

      <Dialog
        open={Boolean(editingProject)}
        onOpenChange={(open) => !open && setEditingProject(null)}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Rename project or client</DialogTitle>
            <DialogDescription>
              The new name will appear in future selectors. Historical time
              entries keep their original project name.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2">
            <Label htmlFor="edited-project-name">Name</Label>
            <Input
              id="edited-project-name"
              value={editedName}
              onChange={(event) => setEditedName(event.target.value)}
            />
          </div>
          <DialogFooter>
            <Button
              disabled={isSaving}
              variant="outline"
              onClick={() => setEditingProject(null)}
            >
              Cancel
            </Button>
            <Button disabled={isSaving} onClick={renameProject}>
              {isSaving ? "Saving..." : "Save name"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog
        open={Boolean(projectToDelete)}
        onOpenChange={(open) => !open && setProjectToDelete(null)}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Remove project or client?</DialogTitle>
            <DialogDescription>
              Existing entries will keep this name, but it will no longer be
              available for new time entries.
            </DialogDescription>
          </DialogHeader>
          <div className="rounded-md border bg-muted/40 p-4 font-medium">
            {projectToDelete}
          </div>
          <DialogFooter>
            <Button
              disabled={isSaving}
              variant="outline"
              onClick={() => setProjectToDelete(null)}
            >
              Cancel
            </Button>
            <Button
              disabled={isSaving}
              variant="destructive"
              onClick={removeProject}
            >
              <Trash2 className="h-4 w-4" />
              {isSaving ? "Removing..." : "Remove"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
