import { fetchCustomObject } from "../commercetools";
import { logger } from "../commercetools/utils/logger.utils";
import { CustomObjectStorage } from "../constants";
import {
  createJobHandler,
  JobStateTransitions,
  JobStatus,
  JobStatusType,
  SyncError,
} from "../job-status";
import { startSyncProcess } from "../sync";
import { Config } from "../types/config.types";
import { getTotalProductsCount } from "./akeneo.utils";

export type JobConfig = {
  isDelta: boolean;
  lastCursor?: string;
  lastSyncDate?: string;
  shouldContinue: () => Promise<boolean>;
  saveLastExecution: (result: ExecutionResult) => Promise<void>;
};

export type ExecutionResult = {
  cursor: string | null;
  failedSyncs: SyncError[] | null;
};

export const JobConfig = {
  EXECUTION_TIME_LIMIT: 25 * 60 * 1000, // 25 minutes
  MAX_FAILED_SYNCS: 100,
  BATCH_SIZE: 5,
} as const;

export const JobValidation = {
  isInProgress: (status: JobStatusType): boolean =>
    [JobStatus.RUNNING, JobStatus.STOPPED].includes(status),

  isReady: (status: JobStatusType): boolean =>
    [JobStatus.RESUMABLE, JobStatus.SCHEDULED].includes(status),

  hasReachedFailureLimit: (failedSyncs: SyncError[]): boolean =>
    failedSyncs.length >= JobConfig.MAX_FAILED_SYNCS,

  hasReachedTimeLimit: (startTime: Date): boolean =>
    new Date().getTime() - startTime.getTime() >=
    JobConfig.EXECUTION_TIME_LIMIT,
};

export const createShouldContinueHandler =
  (
    checkJobStatus: () => Promise<JobStatus>,
    updateJobStatus: (state: Partial<JobStatus>) => Promise<void>,
    batchSize: number = JobConfig.BATCH_SIZE
  ) =>
  async (): Promise<boolean> => {
    const { status, failedSyncs, remainingToSync = 0 } = await checkJobStatus();

    if (status !== JobStatus.RUNNING) {
      if (status === JobStatus.TO_STOP) {
        await updateJobStatus(JobStateTransitions.toStopped(failedSyncs ?? []));
      }

      return false;
    }

    if (failedSyncs && JobValidation.hasReachedFailureLimit(failedSyncs)) {
      await updateJobStatus(JobStateTransitions.toStopped(failedSyncs ?? []));

      return false;
    }

    await updateJobStatus({
      remainingToSync: Math.max((remainingToSync ?? 0) - batchSize, 0),
    });

    return true;
  };

export const createExecutionHandler =
  (
    startTime: Date,
    updateJobStatus: (state: Partial<JobStatus>) => Promise<void>,
    storageKey: "full" | "delta" | "all"
  ) =>
  async ({ cursor, failedSyncs }: ExecutionResult): Promise<void> => {
    if (!cursor) {
      if (storageKey === "delta") {
        await updateJobStatus(JobStateTransitions.toScheduled(failedSyncs));
      } else {
        await updateJobStatus(JobStateTransitions.toIdle());
      }

      return;
    }

    if (JobValidation.hasReachedTimeLimit(startTime)) {
      await updateJobStatus(
        JobStateTransitions.toResumable(cursor, failedSyncs ?? [])
      );
    }
  };

export const createJobProcessor = async (
  storageKey: "full" | "delta" | "all",
  customObjectStorage: CustomObjectStorage
) => {
  const { container, key } = customObjectStorage[storageKey];
  const { checkJobStatus, updateJobStatus } = createJobHandler({
    container,
    key,
  });

  const { status, lastCursor, lastSyncDate } = await checkJobStatus();

  if (status === JobStatus.IDLE) {
    return;
  }

  if (JobValidation.isInProgress(status)) {
    return;
  }

  // should the job be stopped here ?
  if (status === JobStatus.TO_STOP) {
    await updateJobStatus(JobStateTransitions.toStopped());

    return;
  }

  if (!JobValidation.isReady(status)) {
    return;
  }

  const { value } = await fetchCustomObject(customObjectStorage.all);

  const { config } = value
    ? (JSON.parse(value) as { config: Config })
    : { config: null };

  if (!config) {
    logger.info("No config found, skipping job");
    return;
  }

  const executionTime = new Date();

  await updateJobStatus({
    ...(status === JobStatus.RESUMABLE ? JobStateTransitions.toRunning() : {}),
    ...(status === JobStatus.SCHEDULED
      ? {
          ...JobStateTransitions.toRunning(await getTotalProductsCount(config)),
        }
      : {}),
  });

  return startSyncProcess({
    config,
    isDelta: storageKey === "delta",
    lastCursor: lastCursor ?? undefined,
    lastSyncDate: lastSyncDate ?? new Date(Date.now() - 5 * 60 * 1000),
    shouldContinue: createShouldContinueHandler(
      checkJobStatus,
      updateJobStatus
    ),
    saveLastExecution: createExecutionHandler(
      executionTime,
      updateJobStatus,
      storageKey
    ),
  });
};
