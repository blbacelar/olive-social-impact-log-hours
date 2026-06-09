"use client";

import { useEffect, useMemo, useState } from "react";
import {
  BadgeDollarSign,
  CalendarDays,
  Clock3,
  FileBarChart,
  UsersRound,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
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
import { getLogUserName } from "@/lib/rates";
import type { TimeLog, UserProfile } from "@/lib/types";
import { formatCurrency, formatDate, formatMinutes } from "@/lib/utils";

type PeriodReport = {
  id: string;
  logs: TimeLog[];
  totalMinutes: number;
  totalValue: number;
  unratedEntries: number;
  status: "approved" | "paid" | "mixed";
  startDate: string;
  endDate: string;
  contributors: Array<{
    name: string;
    minutes: number;
    value: number;
    unratedEntries: number;
  }>;
};

function buildPeriodReports(
  logs: TimeLog[],
  userProfiles: UserProfile[],
): PeriodReport[] {
  const periodMap = new Map<string, TimeLog[]>();

  logs
    .filter((log) => log.periodId && log.status !== "pending")
    .forEach((log) => {
      const periodLogs = periodMap.get(log.periodId) ?? [];
      periodLogs.push(log);
      periodMap.set(log.periodId, periodLogs);
    });

  return Array.from(periodMap.entries())
    .map(([id, periodLogs]) => {
      const dates = periodLogs.map((log) => log.date).sort();
      const statuses = new Set(periodLogs.map((log) => log.status));
      const contributorMap = new Map<
        string,
        {
          name: string;
          minutes: number;
          value: number;
          unratedEntries: number;
        }
      >();

      periodLogs.forEach((log) => {
        const contributor = contributorMap.get(log.userId) ?? {
          name: getLogUserName(log, userProfiles),
          minutes: 0,
          value: 0,
          unratedEntries: 0,
        };
        contributor.minutes += log.totalMinutes;
        if (log.rate === null) {
          contributor.unratedEntries += 1;
        } else {
          contributor.value += (log.totalMinutes / 60) * log.rate;
        }
        contributorMap.set(log.userId, contributor);
      });

      return {
        id,
        logs: periodLogs,
        totalMinutes: periodLogs.reduce(
          (sum, log) => sum + log.totalMinutes,
          0,
        ),
        totalValue: periodLogs.reduce(
          (sum, log) =>
            sum +
            (log.rate === null ? 0 : (log.totalMinutes / 60) * log.rate),
          0,
        ),
        unratedEntries: periodLogs.filter((log) => log.rate === null).length,
        status:
          statuses.size > 1
            ? "mixed"
            : periodLogs.every((log) => log.status === "paid")
              ? "paid"
              : "approved",
        startDate: dates[0],
        endDate: dates[dates.length - 1],
        contributors: Array.from(contributorMap.values()),
      } satisfies PeriodReport;
    })
    .sort((a, b) => b.endDate.localeCompare(a.endDate));
}

export function FinancialReport({
  logs,
  projects,
  userProfiles,
}: {
  logs: TimeLog[];
  projects: string[];
  userProfiles: UserProfile[];
}) {
  const [selectedProject, setSelectedProject] = useState("all");
  const [selectedPeriod, setSelectedPeriod] = useState("all");
  const availableProjects = useMemo(
    () =>
      Array.from(
        new Set([
          ...projects,
          ...logs.map((log) => log.project).filter(Boolean),
        ]),
      ).sort((a, b) => a.localeCompare(b)),
    [logs, projects],
  );
  const projectLogs = useMemo(
    () =>
      selectedProject === "all"
        ? logs
        : logs.filter((log) => log.project === selectedProject),
    [logs, selectedProject],
  );
  const reports = useMemo(
    () => buildPeriodReports(projectLogs, userProfiles),
    [projectLogs, userProfiles],
  );

  useEffect(() => {
    if (
      selectedPeriod !== "all" &&
      !reports.some((report) => report.id === selectedPeriod)
    ) {
      setSelectedPeriod("all");
    }
  }, [reports, selectedPeriod]);

  const visibleReports =
    selectedPeriod === "all"
      ? reports
      : reports.filter((report) => report.id === selectedPeriod);
  const paidLogs = projectLogs.filter((log) => log.status === "paid");
  const closedPeriods = reports.filter((report) => report.status === "paid");
  const totalPaidValue = paidLogs.reduce(
    (sum, log) =>
      sum + (log.rate === null ? 0 : (log.totalMinutes / 60) * log.rate),
    0,
  );
  const totalPaidMinutes = paidLogs.reduce(
    (sum, log) => sum + log.totalMinutes,
    0,
  );

  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-3">
        <Card className="border-primary/10">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm text-muted-foreground">
              Closed periods
            </CardTitle>
            <CalendarDays className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent className="text-2xl font-semibold">
            {closedPeriods.length}
          </CardContent>
        </Card>
        <Card className="border-primary/10">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm text-muted-foreground">
              Paid hours
            </CardTitle>
            <Clock3 className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent className="text-2xl font-semibold">
            {formatMinutes(totalPaidMinutes)}
          </CardContent>
        </Card>
        <Card className="border-primary/10">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm text-muted-foreground">
              Paid amount
            </CardTitle>
            <BadgeDollarSign className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent className="text-2xl font-semibold">
            {formatCurrency(totalPaidValue)}
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <Select value={selectedProject} onValueChange={setSelectedProject}>
          <SelectTrigger aria-label="Filter by project or client">
            <SelectValue placeholder="Filter by project or client" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All projects and clients</SelectItem>
            {availableProjects.map((project) => (
              <SelectItem key={project} value={project}>
                {project}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={selectedPeriod} onValueChange={setSelectedPeriod}>
          <SelectTrigger aria-label="Filter by billing period">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All billing periods</SelectItem>
            {reports.map((report) => (
              <SelectItem key={report.id} value={report.id}>
                {report.id}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {visibleReports.map((report) => (
        <Card key={report.id} className="border-primary/15">
          <CardHeader className="gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <CardTitle>{report.id}</CardTitle>
                <Badge
                  variant={report.status === "paid" ? "paid" : "approved"}
                >
                  {report.status}
                </Badge>
              </div>
              <p className="mt-2 text-sm text-muted-foreground">
                {formatDate(report.startDate)} to {formatDate(report.endDate)}
              </p>
            </div>
            <div className="grid grid-cols-2 gap-x-8 gap-y-1 text-sm sm:text-right">
              <span className="text-muted-foreground">Hours</span>
              <span className="font-medium">
                {formatMinutes(report.totalMinutes)}
              </span>
              <span className="text-muted-foreground">Value</span>
              <span className="font-medium">
                {formatCurrency(report.totalValue)}
                {report.unratedEntries > 0 ? "*" : ""}
              </span>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            <div>
              <div className="mb-3 flex items-center gap-2">
                <UsersRound className="h-4 w-4 text-primary" />
                <h3 className="font-medium">Contributor summary</h3>
              </div>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Contributor</TableHead>
                    <TableHead>Hours</TableHead>
                    <TableHead className="text-right">Amount</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {report.contributors.map((contributor) => (
                    <TableRow key={contributor.name}>
                      <TableCell className="font-medium">
                        {contributor.name}
                      </TableCell>
                      <TableCell>
                        {formatMinutes(contributor.minutes)}
                      </TableCell>
                      <TableCell className="text-right">
                        {formatCurrency(contributor.value)}
                        {contributor.unratedEntries > 0 ? "*" : ""}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>

            <div>
              <div className="mb-3 flex items-center gap-2">
                <FileBarChart className="h-4 w-4 text-primary" />
                <h3 className="font-medium">Entry detail</h3>
              </div>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>User</TableHead>
                    <TableHead>Project</TableHead>
                    <TableHead>Hours</TableHead>
                    <TableHead>Rate</TableHead>
                    <TableHead className="text-right">Value</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {report.logs.map((log) => (
                    <TableRow key={log.id}>
                      <TableCell>{formatDate(log.date)}</TableCell>
                      <TableCell>
                        {getLogUserName(log, userProfiles)}
                      </TableCell>
                      <TableCell>{log.project}</TableCell>
                      <TableCell>{formatMinutes(log.totalMinutes)}</TableCell>
                      <TableCell>
                        {log.rate === null
                          ? "Not set"
                          : `${formatCurrency(log.rate)}/hr`}
                      </TableCell>
                      <TableCell className="text-right">
                        {log.rate === null
                          ? "Unrated"
                          : formatCurrency(
                              (log.totalMinutes / 60) * log.rate,
                            )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
            {report.unratedEntries > 0 && (
              <p className="text-xs text-muted-foreground">
                * {report.unratedEntries} entry
                {report.unratedEntries === 1 ? "" : "ies"} had no hourly rate
                and are excluded from monetary totals.
              </p>
            )}
          </CardContent>
        </Card>
      ))}

      {visibleReports.length === 0 && (
        <Card className="border-dashed">
          <CardContent className="p-12 text-center">
            <FileBarChart className="mx-auto mb-3 h-8 w-8 text-muted-foreground" />
            <p className="font-medium">No matching financial reports</p>
            <p className="mt-1 text-sm text-muted-foreground">
              Try another project or billing-period filter.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
