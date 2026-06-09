"use client";

import { useMemo, useState } from "react";
import { CheckCheck, Pencil, Trash2 } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  approveTimeLogs,
  deleteTimeLog,
  updateTimeLog,
} from "@/lib/firebase/db";
import { getApprovalRate, getLogUserName } from "@/lib/rates";
import {
  matchesCycle,
  type CycleFilter,
} from "@/lib/time-filters";
import type { LogStatus, TimeLog, UserProfile } from "@/lib/types";
import { formatDate, formatMinutes, isValidDateInput } from "@/lib/utils";

type LogTableProps = {
  logs: TimeLog[];
  isAdmin: boolean;
  projects: string[];
  currentUserId: string;
  userProfiles: UserProfile[];
};

type EditingLog = Omit<TimeLog, "totalMinutes"> & {
  hours: number | "";
  minutes: number | "";
};

export function LogTable({
  logs,
  isAdmin,
  projects,
  currentUserId,
  userProfiles,
}: LogTableProps) {
  const [filter, setFilter] = useState<CycleFilter>(
    isAdmin ? "pending" : "monthly",
  );
  const [editingLog, setEditingLog] = useState<EditingLog | null>(null);
  const [approvingLog, setApprovingLog] = useState<TimeLog | null>(null);
  const [deletingLog, setDeletingLog] = useState<TimeLog | null>(null);
  const [approvalPeriod, setApprovalPeriod] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [feedback, setFeedback] = useState("");
  const [editFeedback, setEditFeedback] = useState("");

  const filteredLogs = useMemo(
    () => logs.filter((log) => matchesCycle(log, filter)),
    [filter, logs],
  );
  const editableProjects = useMemo(() => {
    if (!editingLog || projects.includes(editingLog.project)) return projects;
    return [editingLog.project, ...projects];
  }, [editingLog, projects]);
  const editValidationMessage = useMemo(() => {
    if (!editingLog) return "";
    if (!editingLog.project.trim()) return "Select a project or client.";
    if (!editingLog.description.trim()) return "Description is required.";
    if (!isValidDateInput(editingLog.date)) return "A valid date is required.";
    if (
      editingLog.hours === "" ||
      !Number.isFinite(editingLog.hours) ||
      !Number.isInteger(editingLog.hours) ||
      editingLog.hours < 0
    ) {
      return "Hours must be a whole number of zero or more.";
    }
    if (
      editingLog.minutes === "" ||
      !Number.isFinite(editingLog.minutes) ||
      !Number.isInteger(editingLog.minutes) ||
      editingLog.minutes < 0 ||
      editingLog.minutes > 59
    ) {
      return "Minutes must be a whole number between 0 and 59.";
    }
    if (editingLog.hours === 0 && editingLog.minutes === 0) {
      return "Duration must be at least one minute.";
    }
    if (
      isAdmin &&
      editingLog.rate !== null &&
      (!Number.isFinite(editingLog.rate) || editingLog.rate < 0)
    ) {
      return "Hourly rate must be blank or a non-negative number.";
    }
    if (
      isAdmin &&
      editingLog.status !== "pending" &&
      editingLog.rate === null
    ) {
      return "Approved and paid entries require an hourly rate.";
    }
    if (
      isAdmin &&
      editingLog.status !== "pending" &&
      !editingLog.periodId.trim()
    ) {
      return "Approved and paid entries require a billing period.";
    }
    return "";
  }, [editingLog, isAdmin]);

  async function saveEdit() {
    if (!editingLog) return;
    if (
      editValidationMessage ||
      editingLog.hours === "" ||
      editingLog.minutes === ""
    ) {
      setEditFeedback(editValidationMessage);
      return;
    }

    setIsSaving(true);
    setEditFeedback("");

    try {
      const editableFields = {
        project: editingLog.project,
        description: editingLog.description.trim(),
        date: editingLog.date,
        totalMinutes: editingLog.hours * 60 + editingLog.minutes,
      };

      await updateTimeLog(
        editingLog.id,
        isAdmin
          ? {
              ...editableFields,
              rate: editingLog.rate,
              status: editingLog.status,
              periodId: editingLog.periodId,
            }
          : editableFields,
      );
      setEditingLog(null);
      setFeedback("Time entry updated.");
    } catch (error) {
      setEditFeedback(
        error instanceof Error ? error.message : "Unable to update the entry.",
      );
    } finally {
      setIsSaving(false);
    }
  }

  async function approveLog() {
    if (!approvingLog || !approvalPeriod.trim()) return;
    const approvalRate = getApprovalRate(approvingLog, userProfiles);

    if (approvalRate === null) {
      setFeedback(
        "Set this contributor's hourly rate before approving the entry.",
      );
      setApprovingLog(null);
      return;
    }

    setIsSaving(true);
    setFeedback("");

    try {
      await approveTimeLogs(
        [{ id: approvingLog.id, rate: approvalRate }],
        approvalPeriod.trim(),
      );
      setApprovingLog(null);
      setApprovalPeriod("");
      setFeedback("Time entry approved.");
    } catch (error) {
      setFeedback(
        error instanceof Error ? error.message : "Unable to approve the entry.",
      );
    } finally {
      setIsSaving(false);
    }
  }

  async function removeLog() {
    if (!deletingLog) return;
    setIsSaving(true);
    setFeedback("");

    try {
      await deleteTimeLog(deletingLog.id);
      setDeletingLog(null);
      setFeedback("Time entry deleted.");
    } catch (error) {
      setFeedback(
        error instanceof Error ? error.message : "Unable to delete the entry.",
      );
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <>
      <Card className="border-primary/10">
        <CardHeader className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <CardTitle className="text-xl">Time history</CardTitle>
          <Select
            value={filter}
            onValueChange={(value) => setFilter(value as CycleFilter)}
          >
            <SelectTrigger
              aria-label="Filter time history by cycle"
              className="w-full sm:w-52"
            >
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {isAdmin && <SelectItem value="all">All Entries</SelectItem>}
              <SelectItem value="weekly">Weekly</SelectItem>
              <SelectItem value="biweekly">Bi-Weekly</SelectItem>
              <SelectItem value="monthly">Monthly</SelectItem>
              <SelectItem value="pending">All Pending</SelectItem>
            </SelectContent>
          </Select>
        </CardHeader>
        <CardContent>
          {feedback && (
            <p className="mb-4 text-sm text-muted-foreground" role="status">
              {feedback}
            </p>
          )}
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>User</TableHead>
                <TableHead>Project</TableHead>
                <TableHead>Description</TableHead>
                <TableHead>Duration</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredLogs.map((log) => (
                <TableRow key={log.id}>
                  <TableCell className="whitespace-nowrap">
                    {formatDate(log.date)}
                  </TableCell>
                  <TableCell>{getLogUserName(log, userProfiles)}</TableCell>
                  <TableCell className="font-medium">{log.project}</TableCell>
                  <TableCell className="min-w-56 text-muted-foreground">
                    {log.description}
                  </TableCell>
                  <TableCell>{formatMinutes(log.totalMinutes)}</TableCell>
                  <TableCell>
                    <Badge variant={log.status}>{log.status}</Badge>
                  </TableCell>
                  <TableCell>
                    {isAdmin ||
                    (log.userId === currentUserId &&
                      log.status === "pending") ? (
                      <div className="flex justify-end gap-2">
                        {isAdmin && log.status === "pending" && (
                          <Button
                            disabled={
                              getApprovalRate(log, userProfiles) === null
                            }
                            size="sm"
                            title={
                              getApprovalRate(log, userProfiles) === null
                                ? "Set this user's hourly rate before approval"
                                : undefined
                            }
                            onClick={() => {
                              setApprovalPeriod("");
                              setApprovingLog(log);
                            }}
                          >
                            <CheckCheck className="h-4 w-4" />
                            Approve
                          </Button>
                        )}
                        {(isAdmin ||
                          (log.userId === currentUserId &&
                            log.status === "pending")) && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => {
                              setEditFeedback("");
                              setEditingLog({
                                ...log,
                                hours: Math.floor(log.totalMinutes / 60),
                                minutes: log.totalMinutes % 60,
                              });
                            }}
                          >
                            <Pencil className="h-4 w-4" />
                            Edit
                          </Button>
                        )}
                        {(isAdmin ||
                          (log.userId === currentUserId &&
                            log.status === "pending")) && (
                          <Button
                            aria-label="Delete time entry"
                            size="icon"
                            variant="ghost"
                            onClick={() => setDeletingLog(log)}
                          >
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        )}
                      </div>
                    ) : (
                      <span className="block text-right text-xs text-muted-foreground">
                        Locked
                      </span>
                    )}
                  </TableCell>
                </TableRow>
              ))}
              {filteredLogs.length === 0 && (
                <TableRow>
                  <TableCell
                    className="h-28 text-center text-muted-foreground"
                    colSpan={7}
                  >
                    No entries match this cycle.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Dialog
        open={Boolean(editingLog)}
        onOpenChange={(open) => {
          if (!open) {
            setEditingLog(null);
            setEditFeedback("");
          }
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit time entry</DialogTitle>
            <DialogDescription>
              {isAdmin
                ? "Update the entry details, rate, billing period, or payment status."
                : "Update your pending entry details and recorded duration."}
            </DialogDescription>
          </DialogHeader>
          {editingLog && (
            <div className="grid gap-4">
              <div className="space-y-2">
                <Label htmlFor="edit-project">Project</Label>
                <Select
                  value={editingLog.project}
                  onValueChange={(project) =>
                    setEditingLog({ ...editingLog, project })
                  }
                >
                  <SelectTrigger id="edit-project">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {editableProjects.map((project) => (
                      <SelectItem key={project} value={project}>
                        {project}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-description">Description</Label>
                <Input
                  id="edit-description"
                  value={editingLog.description}
                  onChange={(event) =>
                    setEditingLog({
                      ...editingLog,
                      description: event.target.value,
                    })
                  }
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-date">Date</Label>
                <Input
                  id="edit-date"
                  aria-invalid={!isValidDateInput(editingLog.date)}
                  required
                  type="date"
                  value={editingLog.date}
                  onChange={(event) =>
                    setEditingLog({ ...editingLog, date: event.target.value })
                  }
                />
              </div>
              <div className="grid grid-cols-2 gap-4 rounded-lg border bg-secondary/35 p-4">
                <div className="space-y-2">
                  <Label htmlFor="edit-hours">Hours</Label>
                  <Input
                    id="edit-hours"
                    aria-invalid={
                      editingLog.hours === "" || editingLog.hours < 0
                    }
                    min="0"
                    step="1"
                    type="number"
                    value={editingLog.hours}
                    onChange={(event) =>
                      setEditingLog({
                        ...editingLog,
                        hours:
                          event.target.value === ""
                            ? ""
                            : Number(event.target.value),
                      })
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-minutes">Minutes</Label>
                  <Input
                    id="edit-minutes"
                    aria-invalid={
                      editingLog.minutes === "" ||
                      editingLog.minutes < 0 ||
                      editingLog.minutes > 59
                    }
                    max="59"
                    min="0"
                    step="1"
                    type="number"
                    value={editingLog.minutes}
                    onChange={(event) =>
                      setEditingLog({
                        ...editingLog,
                        minutes:
                          event.target.value === ""
                            ? ""
                            : Number(event.target.value),
                      })
                    }
                  />
                </div>
              </div>
              {isAdmin && (
                <>
                  <div className="space-y-2">
                    <Label htmlFor="edit-status">Status</Label>
                    <Select
                      value={editingLog.status}
                      onValueChange={(status) =>
                        setEditingLog({
                          ...editingLog,
                          status: status as LogStatus,
                        })
                      }
                    >
                      <SelectTrigger id="edit-status">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="pending">Pending</SelectItem>
                        <SelectItem value="approved">Approved</SelectItem>
                        <SelectItem value="paid">Paid</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="edit-rate">Hourly rate (CAD)</Label>
                      <Input
                        id="edit-rate"
                        min="0"
                        placeholder="Not set"
                        step="0.01"
                        type="number"
                        value={editingLog.rate ?? ""}
                        onChange={(event) =>
                          setEditingLog({
                            ...editingLog,
                            rate:
                              event.target.value === ""
                                ? null
                                : Number(event.target.value),
                          })
                        }
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="edit-period">Billing period</Label>
                      <Input
                        id="edit-period"
                        placeholder="June 1-15 Cycle"
                        value={editingLog.periodId}
                        onChange={(event) =>
                          setEditingLog({
                            ...editingLog,
                            periodId: event.target.value,
                          })
                        }
                      />
                    </div>
                  </div>
                </>
              )}
              {(editFeedback || editValidationMessage) && (
                <p className="text-sm text-destructive" role="alert">
                  {editFeedback || editValidationMessage}
                </p>
              )}
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditingLog(null)}>
              Cancel
            </Button>
            <Button
              disabled={
                isSaving || !editingLog || Boolean(editValidationMessage)
              }
              onClick={saveEdit}
            >
              {isSaving ? "Saving..." : "Save changes"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog
        open={Boolean(approvingLog)}
        onOpenChange={(open) => !open && setApprovingLog(null)}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Approve time entry</DialogTitle>
            <DialogDescription>
              {approvingLog
                ? `Approve ${getLogUserName(
                    approvingLog,
                    userProfiles,
                  )}'s ${formatMinutes(
                    approvingLog.totalMinutes,
                  )} entry for ${approvingLog.project}.`
                : "Approve this time entry."}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2">
            <Label htmlFor="approval-period">Billing period</Label>
            <Input
              id="approval-period"
              placeholder="June 1-15 Cycle"
              value={approvalPeriod}
              onChange={(event) => setApprovalPeriod(event.target.value)}
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setApprovingLog(null)}>
              Cancel
            </Button>
            <Button
              disabled={!approvalPeriod.trim() || isSaving}
              onClick={approveLog}
            >
              <CheckCheck className="h-4 w-4" />
              {isSaving ? "Approving..." : "Approve entry"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog
        open={Boolean(deletingLog)}
        onOpenChange={(open) => !open && setDeletingLog(null)}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete time entry?</DialogTitle>
            <DialogDescription>
              This action permanently removes the entry and cannot be undone.
            </DialogDescription>
          </DialogHeader>
          {deletingLog && (
            <div className="rounded-md border bg-muted/40 p-4">
              <p className="font-medium">
                {getLogUserName(deletingLog, userProfiles)} ·{" "}
                {deletingLog.project}
              </p>
              <p className="mt-1 text-sm text-muted-foreground">
                {formatDate(deletingLog.date)} ·{" "}
                {formatMinutes(deletingLog.totalMinutes)}
              </p>
              <p className="mt-2 text-sm">{deletingLog.description}</p>
            </div>
          )}
          <DialogFooter>
            <Button
              disabled={isSaving}
              variant="outline"
              onClick={() => setDeletingLog(null)}
            >
              Cancel
            </Button>
            <Button
              disabled={isSaving}
              variant="destructive"
              onClick={removeLog}
            >
              <Trash2 className="h-4 w-4" />
              {isSaving ? "Deleting..." : "Delete entry"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
