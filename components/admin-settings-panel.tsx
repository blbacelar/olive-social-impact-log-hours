"use client";

import { useEffect, useMemo, useState } from "react";
import { CircleDollarSign, UserRound } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { updateUserHourlyRate } from "@/lib/firebase/db";
import type { TimeLog, UserProfile } from "@/lib/types";

type AdminSettingsPanelProps = {
  userProfiles: UserProfile[];
  logs: TimeLog[];
};

function UserRateRow({ member }: { member: UserProfile }) {
  const [rateInput, setRateInput] = useState(
    member.hourlyRate === null ? "" : member.hourlyRate.toString(),
  );
  const [feedback, setFeedback] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    setRateInput(
      member.hourlyRate === null ? "" : member.hourlyRate.toString(),
    );
  }, [member.hourlyRate]);

  async function saveRate() {
    const nextRate = rateInput.trim() === "" ? null : Number(rateInput);

    if (nextRate !== null && (!Number.isFinite(nextRate) || nextRate < 0)) {
      setFeedback("Enter a valid non-negative hourly rate.");
      return;
    }

    setIsSaving(true);
    setFeedback("");
    try {
      await updateUserHourlyRate(member.id, nextRate, {
        displayName: member.displayName,
        email: member.email,
      });
      setFeedback(nextRate === null ? "Rate cleared." : "Rate saved.");
    } catch (error) {
      setFeedback(
        error instanceof Error ? error.message : "Unable to update the rate.",
      );
    } finally {
      setIsSaving(false);
    }
  }

  const inputId = `hourly-rate-${member.id}`;

  return (
    <div className="grid gap-4 border-b p-4 last:border-b-0 md:grid-cols-[minmax(0,1fr)_minmax(180px,240px)_auto] md:items-end">
      <div className="flex min-w-0 items-center gap-3">
        <div className="rounded-full bg-primary/10 p-2 text-primary">
          <UserRound className="h-4 w-4" />
        </div>
        <div className="min-w-0">
          <p className="truncate font-medium">
            {member.displayName || member.email || "Team member"}
          </p>
          <p className="truncate text-sm text-muted-foreground">
            {member.email || "Email available after next sign-in"}
          </p>
        </div>
      </div>
      <div className="space-y-2">
        <Label htmlFor={inputId}>Rate per hour (CAD)</Label>
        <Input
          id={inputId}
          min="0"
          placeholder="Not set"
          step="0.01"
          type="number"
          value={rateInput}
          onChange={(event) => {
            setRateInput(event.target.value);
            setFeedback("");
          }}
        />
        {feedback && (
          <p className="text-xs text-muted-foreground" role="status">
            {feedback}
          </p>
        )}
      </div>
      <Button disabled={isSaving} onClick={saveRate}>
        {isSaving ? "Saving..." : "Save rate"}
      </Button>
    </div>
  );
}

export function AdminSettingsPanel({
  userProfiles,
  logs,
}: AdminSettingsPanelProps) {
  const teamMembers = useMemo(() => {
    const members = new Map<string, UserProfile>();

    userProfiles.forEach((profile) => members.set(profile.id, profile));
    logs.forEach((log) => {
      if (!members.has(log.userId)) {
        members.set(log.userId, {
          id: log.userId,
          email: "",
          displayName: log.userName,
          hourlyRate: null,
        });
      }
    });

    return [...members.values()].sort((a, b) =>
      (a.displayName || a.email).localeCompare(b.displayName || b.email),
    );
  }, [logs, userProfiles]);

  return (
    <Card className="border-primary/15 shadow-soft">
      <CardHeader className="gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <CardTitle>Team hourly rates</CardTitle>
          <CardDescription className="mt-2">
            Set each contributor&apos;s compensation rate. A user&apos;s rate
            is copied onto future entries; existing entries keep their original
            value.
          </CardDescription>
        </div>
        <CircleDollarSign className="h-5 w-5 text-primary" />
      </CardHeader>
      <CardContent>
        <div className="overflow-hidden rounded-md border">
          {teamMembers.map((member) => (
            <UserRateRow key={member.id} member={member} />
          ))}
          {teamMembers.length === 0 && (
            <p className="p-10 text-center text-sm text-muted-foreground">
              Team members will appear after they sign in.
            </p>
          )}
        </div>
        <p className="mt-4 text-xs text-muted-foreground">
          Leave a rate blank while that contributor&apos;s compensation is
          undecided.
        </p>
      </CardContent>
    </Card>
  );
}
