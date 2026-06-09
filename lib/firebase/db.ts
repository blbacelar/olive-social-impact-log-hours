import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  onSnapshot,
  query,
  serverTimestamp,
  setDoc,
  updateDoc,
  where,
  writeBatch,
  type Unsubscribe,
} from "firebase/firestore";

import { chunkItems } from "@/lib/arrays";
import { db } from "@/lib/firebase/config";
import type {
  LogStatus,
  NewTimeLog,
  TimeLog,
  TimeTrackingSettings,
  UserProfile,
} from "@/lib/types";
import { DEFAULT_PROJECTS } from "@/lib/types";

const timeLogs = collection(db, "time_logs");
const timeTrackingSettings = doc(db, "app_settings", "time_tracking");
const userProfiles = collection(db, "user_profiles");
const MAX_BATCH_WRITES = 450;

async function commitInChunks<T>(
  items: T[],
  addToBatch: (batch: ReturnType<typeof writeBatch>, item: T) => void,
) {
  for (const itemsChunk of chunkItems(items, MAX_BATCH_WRITES)) {
    const batch = writeBatch(db);
    itemsChunk.forEach((item) => addToBatch(batch, item));
    await batch.commit();
  }
}

export function subscribeToTimeTrackingSettings(
  onData: (settings: TimeTrackingSettings) => void,
  onError: (error: Error) => void,
): Unsubscribe {
  return onSnapshot(
    timeTrackingSettings,
    (snapshot) => {
      const data = snapshot.data();
      onData({
        projects:
          Array.isArray(data?.projects)
            ? data.projects.filter(
                (project): project is string => typeof project === "string",
              )
            : DEFAULT_PROJECTS,
      });
    },
    onError,
  );
}

export async function ensureUserProfile(profile: {
  id: string;
  email: string;
  displayName: string;
}) {
  return setDoc(
    doc(db, "user_profiles", profile.id),
    {
      email: profile.email,
      displayName: profile.displayName,
      lastSeenAt: serverTimestamp(),
    },
    { merge: true },
  );
}

export function subscribeToUserProfiles(
  userId: string,
  isAdmin: boolean,
  onData: (profiles: UserProfile[]) => void,
  onError: (error: Error) => void,
): Unsubscribe {
  if (!isAdmin) {
    return onSnapshot(
      doc(db, "user_profiles", userId),
      (snapshot) => {
        const data = snapshot.data();
        onData(
          data
            ? [
                {
                  id: snapshot.id,
                  email: typeof data.email === "string" ? data.email : "",
                  displayName:
                    typeof data.displayName === "string"
                      ? data.displayName
                      : "",
                  hourlyRate:
                    typeof data.hourlyRate === "number"
                      ? data.hourlyRate
                      : null,
                },
              ]
            : [],
        );
      },
      onError,
    );
  }

  return onSnapshot(
    query(userProfiles),
    (snapshot) => {
      onData(
        snapshot.docs.map((profileDocument) => {
          const data = profileDocument.data();
          return {
            id: profileDocument.id,
            email: typeof data.email === "string" ? data.email : "",
            displayName:
              typeof data.displayName === "string" ? data.displayName : "",
            hourlyRate:
              typeof data.hourlyRate === "number" ? data.hourlyRate : null,
          };
        }),
      );
    },
    onError,
  );
}

export async function updateUserHourlyRate(
  userId: string,
  hourlyRate: number | null,
  profile?: { displayName?: string; email?: string },
) {
  return setDoc(
    doc(db, "user_profiles", userId),
    {
      ...profile,
      hourlyRate,
      updatedAt: serverTimestamp(),
    },
    { merge: true },
  );
}

export async function updateProjects(projects: string[]) {
  return setDoc(
    timeTrackingSettings,
    {
      projects,
      updatedAt: serverTimestamp(),
    },
    { merge: true },
  );
}

export function subscribeToTimeLogs(
  userId: string,
  isAdmin: boolean,
  onData: (logs: TimeLog[]) => void,
  onError: (error: Error) => void,
): Unsubscribe {
  const logsQuery = isAdmin
    ? query(timeLogs)
    : query(timeLogs, where("userId", "==", userId));

  return onSnapshot(
    logsQuery,
    (snapshot) => {
      const logs = snapshot.docs
        .map((logDocument) => {
          const data = logDocument.data();

          return {
            id: logDocument.id,
            ...data,
            rate: typeof data.rate === "number" ? data.rate : null,
          };
        }) as TimeLog[];

      onData(logs.sort((a, b) => b.date.localeCompare(a.date)));
    },
    onError,
  );
}

export async function createTimeLog(log: NewTimeLog) {
  return addDoc(timeLogs, {
    ...log,
    status: "pending" satisfies LogStatus,
    periodId: "",
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
}

export async function updateTimeLog(
  id: string,
  updates: Partial<
    Pick<
      TimeLog,
      | "project"
      | "description"
      | "date"
      | "totalMinutes"
      | "rate"
      | "status"
      | "periodId"
    >
  >,
) {
  return updateDoc(doc(db, "time_logs", id), {
    ...updates,
    updatedAt: serverTimestamp(),
  });
}

export async function deleteTimeLog(id: string) {
  return deleteDoc(doc(db, "time_logs", id));
}

export async function approveTimeLogs(
  logs: Array<Pick<TimeLog, "id" | "rate">>,
  periodId: string,
) {
  if (logs.length === 0 || logs.some((log) => log.rate === null)) {
    throw new Error(
      "Every selected entry must have an hourly rate before approval.",
    );
  }

  return commitInChunks(logs, (batch, log) => {
    batch.update(doc(db, "time_logs", log.id), {
      rate: log.rate,
      status: "approved" satisfies LogStatus,
      periodId,
      updatedAt: serverTimestamp(),
    });
  });
}

export async function markPeriodPaid(periodId: string, logs: TimeLog[]) {
  const periodLogs = logs.filter(
    (log) => log.periodId === periodId && log.status === "approved",
  );

  return commitInChunks(periodLogs, (batch, log) => {
    batch.update(doc(db, "time_logs", log.id), {
        status: "paid" satisfies LogStatus,
        updatedAt: serverTimestamp(),
    });
  });
}
