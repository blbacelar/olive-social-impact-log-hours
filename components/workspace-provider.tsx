"use client";

import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import type { User } from "firebase/auth";

import { useAuth } from "@/hooks/use-auth";
import { isFirebaseConfigured } from "@/lib/firebase/config";
import {
  ensureUserProfile,
  subscribeToTimeLogs,
  subscribeToTimeTrackingSettings,
  subscribeToUserProfiles,
} from "@/lib/firebase/db";
import type { TimeLog, UserProfile } from "@/lib/types";
import { DEFAULT_PROJECTS, getUserName } from "@/lib/types";
import { getLocalDateInputValue } from "@/lib/utils";

type WorkspaceContextValue = {
  user: User;
  isAdmin: boolean;
  logs: TimeLog[];
  userHourlyRate: number | null;
  userProfiles: UserProfile[];
  isUserRateLoaded: boolean;
  projects: string[];
  elapsedSeconds: number;
  isTimerRunning: boolean;
  startTimer: () => void;
  pauseTimer: () => void;
  resetTimer: () => void;
  clearTimerDraft: () => void;
  activeProject: string;
  setActiveProject: (project: string) => void;
  activeDescription: string;
  setActiveDescription: (description: string) => void;
  activeDate: string;
  setActiveDate: (date: string) => void;
  resetActiveDate: () => void;
  error: string;
  signOut: () => Promise<void>;
};

const WorkspaceContext = createContext<WorkspaceContextValue | null>(null);

type StoredTimer = {
  accumulatedSeconds: number;
  startedAt: number | null;
  isRunning: boolean;
  project?: string;
  description?: string;
  date?: string;
  dateWasChanged?: boolean;
};

type WorkspaceProviderProps = {
  children: ReactNode;
  user: User;
  isAdmin: boolean;
  signOut: () => Promise<void>;
};

export function WorkspaceProvider({
  children,
  user,
  isAdmin,
  signOut,
}: WorkspaceProviderProps) {
  const [logs, setLogs] = useState<TimeLog[]>([]);
  const [userProfiles, setUserProfiles] = useState<UserProfile[]>([]);
  const [profileEnsured, setProfileEnsured] = useState(false);
  const [profilesLoaded, setProfilesLoaded] = useState(false);
  const [projects, setProjects] = useState<string[]>(DEFAULT_PROJECTS);
  const [accumulatedSeconds, setAccumulatedSeconds] = useState(0);
  const [startedAt, setStartedAt] = useState<number | null>(null);
  const [isTimerRunning, setIsTimerRunning] = useState(false);
  const [now, setNow] = useState(() => Date.now());
  const [timerLoaded, setTimerLoaded] = useState(false);
  const [activeProject, setActiveProject] = useState("");
  const [activeDescription, setActiveDescription] = useState("");
  const [activeDate, setActiveDateState] = useState(getLocalDateInputValue);
  const [dateWasChanged, setDateWasChanged] = useState(false);
  const [error, setError] = useState("");
  const timerStorageKey = `olive-time-tracker:${user.uid}`;

  useEffect(
    () =>
      subscribeToTimeLogs(
        user.uid,
        isAdmin,
        setLogs,
        (subscriptionError) => setError(subscriptionError.message),
      ),
    [isAdmin, user.uid],
  );

  useEffect(() => {
    setProfileEnsured(false);
    void ensureUserProfile({
      id: user.uid,
      email: user.email ?? "",
      displayName: getUserName(user.displayName, user.email),
    })
      .then(() => setProfileEnsured(true))
      .catch((profileError: Error) => setError(profileError.message));
  }, [user.displayName, user.email, user.uid]);

  useEffect(
    () => {
      setProfilesLoaded(false);
      return (
      subscribeToUserProfiles(
        user.uid,
        isAdmin,
        (profiles) => {
          setUserProfiles(profiles);
          setProfilesLoaded(true);
        },
        (subscriptionError) => setError(subscriptionError.message),
      )
      );
    },
    [isAdmin, user.uid],
  );

  useEffect(
    () =>
      subscribeToTimeTrackingSettings(
        (settings) => setProjects(settings.projects),
        (subscriptionError) => setError(subscriptionError.message),
      ),
    [],
  );

  useEffect(() => {
    try {
      const storedTimer = window.localStorage.getItem(timerStorageKey);
      if (storedTimer) {
        const parsed = JSON.parse(storedTimer) as StoredTimer;
        setAccumulatedSeconds(
          Number.isFinite(parsed.accumulatedSeconds)
            ? Math.max(0, parsed.accumulatedSeconds)
            : 0,
        );
        setStartedAt(
          typeof parsed.startedAt === "number" ? parsed.startedAt : null,
        );
        setIsTimerRunning(
          parsed.isRunning && typeof parsed.startedAt === "number",
        );
        setActiveProject(
          typeof parsed.project === "string" ? parsed.project : "",
        );
        setActiveDescription(
          typeof parsed.description === "string" ? parsed.description : "",
        );
        const hasDraft =
          parsed.isRunning ||
          parsed.accumulatedSeconds > 0 ||
          Boolean(parsed.project) ||
          Boolean(parsed.description);
        setActiveDateState(
          hasDraft &&
            parsed.dateWasChanged === true &&
            typeof parsed.date === "string"
            ? parsed.date
            : getLocalDateInputValue(),
        );
        setDateWasChanged(hasDraft && parsed.dateWasChanged === true);
      }
    } catch {
      window.localStorage.removeItem(timerStorageKey);
    } finally {
      setNow(Date.now());
      setTimerLoaded(true);
    }
  }, [timerStorageKey]);

  useEffect(() => {
    if (!timerLoaded) return;

    const timer: StoredTimer = {
      accumulatedSeconds,
      startedAt,
      isRunning: isTimerRunning,
      project: activeProject,
      description: activeDescription,
      date: activeDate,
      dateWasChanged,
    };
    window.localStorage.setItem(timerStorageKey, JSON.stringify(timer));
  }, [
    accumulatedSeconds,
    activeDate,
    activeDescription,
    activeProject,
    dateWasChanged,
    isTimerRunning,
    startedAt,
    timerLoaded,
    timerStorageKey,
  ]);

  useEffect(() => {
    if (!isTimerRunning) return;
    const interval = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(interval);
  }, [isTimerRunning]);

  useEffect(() => {
    if (dateWasChanged) return;

    const syncDate = () => setActiveDateState(getLocalDateInputValue());
    const interval = window.setInterval(syncDate, 60_000);
    window.addEventListener("focus", syncDate);
    document.addEventListener("visibilitychange", syncDate);

    return () => {
      window.clearInterval(interval);
      window.removeEventListener("focus", syncDate);
      document.removeEventListener("visibilitychange", syncDate);
    };
  }, [dateWasChanged]);

  const elapsedSeconds =
    accumulatedSeconds +
    (isTimerRunning && startedAt !== null
      ? Math.max(0, Math.floor((now - startedAt) / 1000))
      : 0);
  const userHourlyRate =
    userProfiles.find((profile) => profile.id === user.uid)?.hourlyRate ?? null;
  const isUserRateLoaded = profileEnsured && profilesLoaded;

  function startTimer() {
    if (isTimerRunning) return;
    const startTime = Date.now();
    setStartedAt(startTime);
    setNow(startTime);
    setIsTimerRunning(true);
  }

  function pauseTimer() {
    if (!isTimerRunning || startedAt === null) return;
    setAccumulatedSeconds(
      (current) =>
        current + Math.max(0, Math.floor((Date.now() - startedAt) / 1000)),
    );
    setStartedAt(null);
    setIsTimerRunning(false);
  }

  function resetTimer() {
    setAccumulatedSeconds(0);
    setStartedAt(null);
    setIsTimerRunning(false);
    setNow(Date.now());
  }

  function setActiveDate(date: string) {
    setActiveDateState(date);
    setDateWasChanged(true);
  }

  function resetActiveDate() {
    setActiveDateState(getLocalDateInputValue());
    setDateWasChanged(false);
  }

  function clearTimerDraft() {
    resetTimer();
    setActiveProject("");
    setActiveDescription("");
    resetActiveDate();
  }

  const value = {
    user,
    isAdmin,
    logs,
    userHourlyRate,
    userProfiles,
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
    error,
    signOut,
  };

  return (
    <WorkspaceContext.Provider value={value}>
      {children}
    </WorkspaceContext.Provider>
  );
}

export function useWorkspace() {
  const context = useContext(WorkspaceContext);

  if (!context) {
    throw new Error("useWorkspace must be used inside WorkspaceProvider.");
  }

  return context;
}

export function useWorkspaceAuth() {
  return {
    ...useAuth(),
    isFirebaseConfigured,
  };
}
