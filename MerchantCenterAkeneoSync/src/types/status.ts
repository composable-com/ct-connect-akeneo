export type JobStatusType =
  | 'running'
  | 'scheduled'
  | 'to-stop'
  | 'stopped'
  | 'resumable'
  | 'idle'
  | 'unknown';

export const JobStatus = {
  RUNNING: 'running' as JobStatusType,
  SCHEDULED: 'scheduled' as JobStatusType,
  TO_STOP: 'to-stop' as JobStatusType,
  STOPPED: 'stopped' as JobStatusType,
  RESUMABLE: 'resumable' as JobStatusType,
  IDLE: 'idle' as JobStatusType,
  UNKNOWN: 'unknown' as JobStatusType,
};

export interface SyncError {
  identifier: string;
  errorMessage: string;
  date: string;
}

export interface JobStatus {
  status: JobStatusType;
  lastCursor?: string | null;
  lastSyncDate?: string | null;
  failedSyncs?: SyncError[] | null;
  remainingToSync?: number | null;
  totalToSync?: number | null;
}
