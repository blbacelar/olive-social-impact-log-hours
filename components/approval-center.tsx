"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  CheckCheck,
  CircleDollarSign,
  Clock3,
  Settings2,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
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
import { approveTimeLogs, markPeriodPaid } from "@/lib/firebase/db";
import { getApprovalRate, getLogUserName } from "@/lib/rates";
import type { TimeLog, UserProfile } from "@/lib/types";
import {
  formatCurrency,
  formatDate,
  formatMinutes,
} from "@/lib/utils";

export function ApprovalCenter({
  logs,
  userProfiles,
}: {
  logs: TimeLog[];
  userProfiles: UserProfile[];
}) {
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [periodLabel, setPeriodLabel] = useState("");
  const [selectedPeriod, setSelectedPeriod] = useState("");
  const [approvalOpen, setApprovalOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [feedback, setFeedback] = useState("");

  const pendingLogs = useMemo(
    () => logs.filter((log) => log.status === "pending"),
    [logs],
  );
  const eligibleLogs = useMemo(
    () =>
      pendingLogs.filter(
        (log) => getApprovalRate(log, userProfiles) !== null,
      ),
    [pendingLogs, userProfiles],
  );
  const selectedLogs = useMemo(
    () => pendingLogs.filter((log) => selectedIds.includes(log.id)),
    [pendingLogs, selectedIds],
  );
  const approvedPeriods = useMemo(
    () =>
      Array.from(
        new Set(
          logs
            .filter((log) => log.status === "approved" && log.periodId)
            .map((log) => log.periodId),
        ),
      ).sort(),
    [logs],
  );
  const selectedMinutes = selectedLogs.reduce(
    (total, log) => total + log.totalMinutes,
    0,
  );
  const allEligibleSelected =
    eligibleLogs.length > 0 &&
    eligibleLogs.every((log) => selectedIds.includes(log.id));
  const someEligibleSelected =
    eligibleLogs.some((log) => selectedIds.includes(log.id)) &&
    !allEligibleSelected;

  useEffect(() => {
    const pendingIds = new Set(pendingLogs.map((log) => log.id));
    setSelectedIds((current) =>
      current.filter((id) => pendingIds.has(id)),
    );
  }, [pendingLogs]);

  function toggleLog(id: string, checked: boolean) {
    setSelectedIds((current) =>
      checked
        ? Array.from(new Set([...current, id]))
        : current.filter((item) => item !== id),
    );
  }

  function toggleAllEligible(checked: boolean) {
    setSelectedIds(checked ? eligibleLogs.map((log) => log.id) : []);
  }

  async function approveSelected() {
    if (!periodLabel.trim() || selectedLogs.length === 0) return;

    const approvalLogs = selectedLogs.map((log) => ({
      id: log.id,
      rate: getApprovalRate(log, userProfiles),
    }));

    if (approvalLogs.some((log) => log.rate === null)) {
      setFeedback(
        "Set an hourly rate for every selected contributor before approval.",
      );
      return;
    }

    setIsSaving(true);
    setFeedback("");
    try {
      await approveTimeLogs(approvalLogs, periodLabel.trim());
      setSelectedIds([]);
      setPeriodLabel("");
      setApprovalOpen(false);
      setFeedback("Selected entries approved.");
    } catch (error) {
      setFeedback(
        error instanceof Error ? error.message : "Unable to approve entries.",
      );
    } finally {
      setIsSaving(false);
    }
  }

  async function payPeriod() {
    if (!selectedPeriod) return;
    setIsSaving(true);
    setFeedback("");
    try {
      await markPeriodPaid(selectedPeriod, logs);
      setSelectedPeriod("");
      setFeedback("Billing period marked as paid.");
    } catch (error) {
      setFeedback(
        error instanceof Error
          ? error.message
          : "Unable to mark the billing period as paid.",
      );
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <div className="space-y-6">
      <Card className="border-primary/15">
        <CardHeader className="gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <CardTitle>Pending time entries</CardTitle>
            <CardDescription className="mt-2">
              Review entries, select the approved work, and assign it to a
              billing period.
            </CardDescription>
          </div>
          <Badge variant="pending">
            {pendingLogs.length} pending
          </Badge>
        </CardHeader>
        <CardContent className="space-y-4">
          {feedback && (
            <div
              className="rounded-md border bg-muted/30 px-4 py-3 text-sm"
              role="status"
            >
              {feedback}
            </div>
          )}

          <div className="overflow-hidden rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-12">
                    <Checkbox
                      aria-label="Select all eligible pending entries"
                      checked={
                        allEligibleSelected
                          ? true
                          : someEligibleSelected
                            ? "indeterminate"
                            : false
                      }
                      disabled={eligibleLogs.length === 0}
                      onCheckedChange={(checked) =>
                        toggleAllEligible(checked === true)
                      }
                    />
                  </TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Contributor</TableHead>
                  <TableHead>Project / Client</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead>Duration</TableHead>
                  <TableHead>Rate</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {pendingLogs.map((log) => {
                  const approvalRate = getApprovalRate(log, userProfiles);
                  const canApprove = approvalRate !== null;
                  const isSelected = selectedIds.includes(log.id);

                  return (
                    <TableRow
                      key={log.id}
                      data-state={isSelected ? "selected" : undefined}
                    >
                      <TableCell>
                        <Checkbox
                          aria-label={`Select ${getLogUserName(
                            log,
                            userProfiles,
                          )}'s entry`}
                          checked={isSelected}
                          disabled={!canApprove}
                          onCheckedChange={(checked) =>
                            toggleLog(log.id, checked === true)
                          }
                        />
                      </TableCell>
                      <TableCell className="whitespace-nowrap">
                        {formatDate(log.date)}
                      </TableCell>
                      <TableCell className="font-medium">
                        {getLogUserName(log, userProfiles)}
                      </TableCell>
                      <TableCell>{log.project}</TableCell>
                      <TableCell className="min-w-64 text-muted-foreground">
                        {log.description}
                      </TableCell>
                      <TableCell className="whitespace-nowrap font-medium">
                        {formatMinutes(log.totalMinutes)}
                      </TableCell>
                      <TableCell>
                        {canApprove ? (
                          <Badge variant="approved">
                            {formatCurrency(approvalRate)}/hr
                          </Badge>
                        ) : (
                          <Badge variant="pending">Rate required</Badge>
                        )}
                      </TableCell>
                    </TableRow>
                  );
                })}
                {pendingLogs.length === 0 && (
                  <TableRow>
                    <TableCell
                      className="h-32 text-center text-muted-foreground"
                      colSpan={7}
                    >
                      No entries are waiting for approval.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>

          <div className="flex flex-col gap-3 rounded-md border bg-muted/20 p-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="font-medium">
                {selectedLogs.length} selected
              </p>
              <p className="text-sm text-muted-foreground">
                {formatMinutes(selectedMinutes)} total
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              {selectedLogs.length > 0 && (
                <Button
                  disabled={isSaving}
                  variant="outline"
                  onClick={() => setSelectedIds([])}
                >
                  Clear selection
                </Button>
              )}
              <Button
                disabled={selectedLogs.length === 0 || isSaving}
                onClick={() => {
                  setPeriodLabel("");
                  setApprovalOpen(true);
                }}
              >
                <CheckCheck className="h-4 w-4" />
                Approve selected
              </Button>
            </div>
          </div>

          {pendingLogs.some(
            (log) => getApprovalRate(log, userProfiles) === null,
          ) && (
            <div className="flex flex-col gap-3 rounded-md border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900 sm:flex-row sm:items-center sm:justify-between">
              <span>
                Entries without a configured hourly rate cannot be selected.
              </span>
              <Button asChild size="sm" variant="outline">
                <Link href="/admin/settings">
                  <Settings2 className="h-4 w-4" />
                  Configure rates
                </Link>
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(280px,0.45fr)]">
        <Card className="border-primary/15">
          <CardHeader>
            <div className="mb-2 flex h-9 w-9 items-center justify-center rounded-md bg-primary/10 text-primary">
              <CircleDollarSign className="h-5 w-5" />
            </div>
            <CardTitle>Close billing period</CardTitle>
            <CardDescription>
              Mark every approved entry in a billing period as paid.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-4 sm:flex-row sm:items-end">
            <div className="flex-1 space-y-2">
              <Label htmlFor="approved-period">Approved period</Label>
              <Select value={selectedPeriod} onValueChange={setSelectedPeriod}>
                <SelectTrigger id="approved-period">
                  <SelectValue placeholder="Select a period" />
                </SelectTrigger>
                <SelectContent>
                  {approvedPeriods.map((period) => (
                    <SelectItem key={period} value={period}>
                      {period}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <Button
              disabled={!selectedPeriod || isSaving}
              variant="secondary"
              onClick={payPeriod}
            >
              {isSaving ? "Updating..." : "Mark as paid"}
            </Button>
          </CardContent>
        </Card>

        <Card className="border-primary/15 bg-primary/[0.03]">
          <CardHeader>
            <div className="mb-2 flex h-9 w-9 items-center justify-center rounded-md bg-primary/10 text-primary">
              <Clock3 className="h-5 w-5" />
            </div>
            <CardTitle>Financial history</CardTitle>
            <CardDescription>
              Review approved and paid billing periods in the reports area.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild className="w-full" variant="outline">
              <Link href="/admin/reports">View financial reports</Link>
            </Button>
          </CardContent>
        </Card>
      </div>

      <Dialog open={approvalOpen} onOpenChange={setApprovalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Approve selected entries</DialogTitle>
            <DialogDescription>
              Assign {selectedLogs.length} selected{" "}
              {selectedLogs.length === 1 ? "entry" : "entries"} totaling{" "}
              {formatMinutes(selectedMinutes)} to a billing period.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2">
            <Label htmlFor="period-label">Billing period</Label>
            <Input
              id="period-label"
              placeholder="June 1-15 Cycle"
              value={periodLabel}
              onChange={(event) => setPeriodLabel(event.target.value)}
            />
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setApprovalOpen(false)}
            >
              Cancel
            </Button>
            <Button
              disabled={
                !periodLabel.trim() ||
                selectedLogs.length === 0 ||
                isSaving
              }
              onClick={approveSelected}
            >
              {isSaving ? "Approving..." : "Approve entries"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
