import { fetchCustomObject, updateCustomObject } from "../commercetools";

export type JobStatusType =
  | "running"
  | "scheduled"
  | "to-stop"
  | "stopped"
  | "resumable";

export const JobStatus = {
  IDLE: "idle" as JobStatusType,
  RUNNING: "running" as JobStatusType,
  SCHEDULED: "scheduled" as JobStatusType,
  TO_STOP: "to-stop" as JobStatusType,
  STOPPED: "stopped" as JobStatusType,
  RESUMABLE: "resumable" as JobStatusType,
};

export interface SyncError {
  identifier: string;
  errorMessage: string;
  date: string;
}

export interface JobStatus {
  status: JobStatusType;
  lastCursor?: string | null;
  lastSyncDate?: Date | null;
  failedSyncs?: SyncError[] | null;
  remainingToSync?: number | null;
  totalToSync?: number | null;
}

export const JobStateTransitions = {
  toIdle: (): Partial<JobStatus> => ({
    status: JobStatus.IDLE,
  }),

  toRunning: (totalProducts?: number): Partial<JobStatus> => ({
    status: JobStatus.RUNNING,
    totalToSync: totalProducts,
    remainingToSync: totalProducts,
  }),

  toToStop: (): Partial<JobStatus> => ({
    status: JobStatus.TO_STOP,
    lastCursor: null,
    lastSyncDate: null,
    remainingToSync: null,
    totalToSync: null,
  }),

  toStopped: (failedSyncs?: SyncError[]): Partial<JobStatus> => ({
    status: JobStatus.STOPPED,
    lastCursor: null,
    lastSyncDate: new Date(),
    failedSyncs,
  }),

  toScheduled: (
    failedSyncs?: SyncError[] | null | undefined
  ): Partial<JobStatus> => ({
    status: JobStatus.SCHEDULED,
    lastCursor: null,
    lastSyncDate: null,
    remainingToSync: null,
    totalToSync: null,
    failedSyncs: failedSyncs ?? null,
  }),

  toResumable: (
    cursor: string,
    failedSyncs: SyncError[]
  ): Partial<JobStatus> => ({
    status: JobStatus.RESUMABLE,
    lastCursor: cursor,
    failedSyncs,
  }),
};

export const createJobHandler = ({
  container,
  key,
}: {
  container: string;
  key: string;
}) => {
  const checkJobStatus = async (): Promise<JobStatus> => {
    const { value } = await fetchCustomObject({ container, key });

    return value ? JSON.parse(value) : { status: JobStatus.SCHEDULED };
  };

  const updateJobStatus = async (payload: any) => {
    const currentStatus = await checkJobStatus();

    await updateCustomObject({
      container,
      key,
      value: JSON.stringify({ ...currentStatus, ...payload }),
    });
  };

  const startJobHandler = async () => {
    await updateCustomObject({
      container,
      key,
      value: JSON.stringify(JobStateTransitions.toScheduled()),
    });
  };

  const cancelJobHandler = async () => {
    await updateCustomObject({
      container,
      key,
      value: JSON.stringify(JobStateTransitions.toToStop()),
    });
  };

  const stopJobHandler = async () => {
    await updateCustomObject({
      container,
      key,
      value: JSON.stringify(JobStateTransitions.toStopped()),
    });
  };

  return {
    checkJobStatus,
    updateJobStatus,
    startJobHandler,
    cancelJobHandler,
    stopJobHandler,
  };
};
