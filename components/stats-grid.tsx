import { BadgeDollarSign, CircleDollarSign, Timer } from "lucide-react";

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import type { TimeLog } from "@/lib/types";
import { formatCurrency, formatMinutes } from "@/lib/utils";

type StatsGridProps = {
  logs: TimeLog[];
};

export function StatsGrid({ logs }: StatsGridProps) {
  const pendingMinutes = logs
    .filter((log) => log.status === "pending")
    .reduce((sum, log) => sum + log.totalMinutes, 0);
  const approvedAmount = logs
    .filter((log) => log.status === "approved" && log.rate !== null)
    .reduce(
      (sum, log) => sum + (log.totalMinutes / 60) * (log.rate ?? 0),
      0,
    );
  const paidAmount = logs
    .filter((log) => log.status === "paid" && log.rate !== null)
    .reduce(
      (sum, log) => sum + (log.totalMinutes / 60) * (log.rate ?? 0),
      0,
    );
  const approvedHasUnratedLogs = logs.some(
    (log) => log.status === "approved" && log.rate === null,
  );
  const paidHasUnratedLogs = logs.some(
    (log) => log.status === "paid" && log.rate === null,
  );

  const stats = [
    {
      label: "Total Pending Hours",
      value: formatMinutes(pendingMinutes),
      icon: Timer,
    },
    {
      label: "Total Approved (Unpaid)",
      value: approvedHasUnratedLogs
        ? `${formatCurrency(approvedAmount)}*`
        : formatCurrency(approvedAmount),
      icon: BadgeDollarSign,
    },
    {
      label: "Total Paid to Date",
      value: paidHasUnratedLogs
        ? `${formatCurrency(paidAmount)}*`
        : formatCurrency(paidAmount),
      icon: CircleDollarSign,
    },
  ];

  return (
    <div className="space-y-2">
      <div className="grid gap-4 md:grid-cols-3">
        {stats.map(({ label, value, icon: Icon }) => (
          <Card key={label} className="border-primary/10">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                {label}
              </CardTitle>
              <Icon className="h-4 w-4 text-primary" />
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-semibold tracking-tight">{value}</p>
            </CardContent>
          </Card>
        ))}
      </div>
      {(approvedHasUnratedLogs || paidHasUnratedLogs) && (
        <p className="text-xs text-muted-foreground">
          * Excludes entries recorded before an hourly rate was configured.
        </p>
      )}
    </div>
  );
}
