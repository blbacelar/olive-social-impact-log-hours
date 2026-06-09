"use client";

import { useMemo, useState } from "react";
import { Clock3, Pause, Play, RotateCcw } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
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
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import { useWorkspace } from "@/components/workspace-provider";
import { createTimeLog } from "@/lib/firebase/db";
import { getUserName } from "@/lib/types";
import { formatTimer, isValidDateInput } from "@/lib/utils";

export function TimeLogger() {
  const {
    user,
    userHourlyRate,
    isUserRateLoaded,
    projects,
    elapsedSeconds,
    isTimerRunning,
    startTimer,
    pauseTimer,
    resetTimer,
    clearTimerDraft,
    activeProject,
    setActiveProject,
    activeDescription,
    setActiveDescription,
    activeDate,
    setActiveDate,
    resetActiveDate,
  } = useWorkspace();
  const [mode, setMode] = useState("live");
  const [hours, setHours] = useState("0");
  const [minutes, setMinutes] = useState("30");
  const [isSaving, setIsSaving] = useState(false);
  const [feedback, setFeedback] = useState("");

  const manualTotalMinutes = useMemo(
    () => Number(hours) * 60 + Number(minutes),
    [hours, minutes],
  );

  async function handleSubmit() {
    if (!isUserRateLoaded) {
      setFeedback("Your account settings are still loading. Try again shortly.");
      return;
    }

    const manualHours = Number(hours);
    const manualMinutes = Number(minutes);
    const totalMinutes =
      mode === "live" ? Math.ceil(elapsedSeconds / 60) : manualTotalMinutes;

    if (
      mode === "manual" &&
      (!Number.isInteger(manualHours) ||
        manualHours < 0 ||
        !Number.isInteger(manualMinutes) ||
        manualMinutes < 0 ||
        manualMinutes > 59)
    ) {
      setFeedback("Enter whole hours and between 0 and 59 minutes.");
      return;
    }

    if (
      !activeProject ||
      !projects.includes(activeProject) ||
      !activeDescription.trim() ||
      !isValidDateInput(activeDate) ||
      !Number.isInteger(totalMinutes) ||
      !Number.isFinite(totalMinutes) ||
      totalMinutes < 1
    ) {
      setFeedback(
        "Add an active project, description, valid date, and at least one minute.",
      );
      return;
    }

    setIsSaving(true);
    setFeedback("");

    try {
      await createTimeLog({
        userId: user.uid,
        userName: getUserName(user.displayName, user.email),
        project: activeProject,
        description: activeDescription.trim(),
        date: activeDate,
        totalMinutes,
        rate: userHourlyRate,
      });

      if (mode === "live") {
        clearTimerDraft();
      } else {
        setActiveDescription("");
        resetActiveDate();
      }
      setHours("0");
      setMinutes("30");
      setFeedback("Time entry saved as pending.");
    } catch (error) {
      setFeedback(
        error instanceof Error ? error.message : "Unable to save the entry.",
      );
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <Card className="border-primary/10 shadow-soft">
      <CardHeader>
        <div className="flex items-start justify-between gap-4">
          <div>
            <CardTitle className="text-xl">Log hours</CardTitle>
          </div>
          <div className="rounded-full bg-primary/10 p-2 text-primary">
            <Clock3 className="h-5 w-5" />
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <Tabs value={mode} onValueChange={setMode}>
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="live">Live Timer</TabsTrigger>
            <TabsTrigger value="manual">Manual Entry</TabsTrigger>
          </TabsList>

          <TabsContent value="live">
            <div className="mb-6 rounded-lg border bg-secondary/35 p-6 text-center">
              <p className="font-mono text-4xl font-semibold tracking-tight text-primary">
                {formatTimer(elapsedSeconds)}
              </p>
              <div className="mt-5 flex justify-center gap-2">
                <Button
                  type="button"
                  onClick={isTimerRunning ? pauseTimer : startTimer}
                >
                  {isTimerRunning ? (
                    <Pause className="h-4 w-4" />
                  ) : (
                    <Play className="h-4 w-4" />
                  )}
                  {isTimerRunning ? "Pause" : elapsedSeconds > 0 ? "Resume" : "Start"}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={resetTimer}
                >
                  <RotateCcw className="h-4 w-4" />
                  Reset
                </Button>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="manual">
            <div className="mb-6 grid grid-cols-2 gap-4 rounded-lg border bg-secondary/35 p-5">
              <div className="space-y-2">
                <Label htmlFor="hours">Hours</Label>
                <Input
                  id="hours"
                  min="0"
                  step="1"
                  type="number"
                  value={hours}
                  onChange={(event) => setHours(event.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="minutes">Minutes</Label>
                <Input
                  id="minutes"
                  max="59"
                  min="0"
                  step="1"
                  type="number"
                  value={minutes}
                  onChange={(event) => setMinutes(event.target.value)}
                />
              </div>
            </div>
          </TabsContent>

          <div className="grid gap-4">
            <div className="space-y-2">
              <Label htmlFor="project">Project / Client</Label>
              <Select value={activeProject} onValueChange={setActiveProject}>
                <SelectTrigger id="project">
                  <SelectValue placeholder="Select a project" />
                </SelectTrigger>
                <SelectContent>
                  {projects.map((item) => (
                    <SelectItem key={item} value={item}>
                      {item}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Input
                id="description"
                placeholder="What did you work on?"
                value={activeDescription}
                onChange={(event) => setActiveDescription(event.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="date">Date</Label>
              <Input
                id="date"
                type="date"
                value={activeDate}
                onChange={(event) => setActiveDate(event.target.value)}
              />
            </div>
            {feedback && (
              <p className="text-sm text-muted-foreground" role="status">
                {feedback}
              </p>
            )}
            {projects.length === 0 && (
              <p className="text-sm text-amber-700">
                An admin must add a project or client before time can be saved.
              </p>
            )}
            <Button
              className="w-full"
              disabled={
                isSaving || projects.length === 0 || !isUserRateLoaded
              }
              onClick={handleSubmit}
            >
              {isSaving
                ? "Saving..."
                : isUserRateLoaded
                  ? "Save time entry"
                  : "Loading account..."}
            </Button>
          </div>
        </Tabs>
      </CardContent>
    </Card>
  );
}
