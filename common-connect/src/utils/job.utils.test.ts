import {
  JobStatus,
  JobStateTransitions,
  createJobHandler,
} from "../job-status";
import { getTotalProductsCount } from "./akeneo.utils";
import { startSyncProcess } from "../sync";
import { fetchCustomObject } from "../commercetools";
import {
  JobValidation,
  JobConfig,
  createShouldContinueHandler,
  createExecutionHandler,
  createJobProcessor,
  type ExecutionResult,
} from "./job.utils";

jest.mock("../job-status", () => ({
  createJobHandler: jest.fn(),
  JobStatus: {
    RUNNING: "RUNNING",
    STOPPED: "STOPPED",
    IDLE: "IDLE",
    SCHEDULED: "SCHEDULED",
    RESUMABLE: "RESUMABLE",
    TO_STOP: "TO_STOP",
  },
  JobStateTransitions: {
    toStopped: jest.fn().mockImplementation((failedSyncs = []) => ({
      status: "STOPPED",
      failedSyncs,
    })),
    toScheduled: jest.fn().mockReturnValue({ status: "SCHEDULED" }),
    toResumable: jest.fn().mockImplementation((cursor, failedSyncs = []) => ({
      status: "RESUMABLE",
      lastCursor: cursor,
      failedSyncs,
    })),
    toIdle: jest.fn().mockImplementation(() => ({
      status: "IDLE",
    })),
    toRunning: jest.fn().mockImplementation((remainingToSync) => ({
      status: "RUNNING",
      ...(remainingToSync && { remainingToSync }),
      lastSyncDate: expect.any(String),
    })),
  },
}));

jest.mock("../sync", () => ({
  startSyncProcess: jest.fn(),
}));

jest.mock("../commercetools", () => ({
  fetchCustomObject: jest.fn(),
}));

jest.mock("./akeneo.utils", () => ({
  getTotalProductsCount: jest.fn(),
}));

describe("JobValidation", () => {
  describe("isInProgress", () => {
    it("should return true for RUNNING status", () => {
      expect(JobValidation.isInProgress(JobStatus.RUNNING)).toBe(true);
    });

    it("should return true for STOPPED status", () => {
      expect(JobValidation.isInProgress(JobStatus.STOPPED)).toBe(true);
    });

    it("should return false for other statuses", () => {
      expect(JobValidation.isInProgress(JobStatus.SCHEDULED)).toBe(false);
      expect(JobValidation.isInProgress(JobStatus.RESUMABLE)).toBe(false);
      expect(JobValidation.isInProgress(JobStatus.TO_STOP)).toBe(false);
    });
  });

  describe("isReady", () => {
    it("should return true for RESUMABLE status", () => {
      expect(JobValidation.isReady(JobStatus.RESUMABLE)).toBe(true);
    });

    it("should return true for SCHEDULED status", () => {
      expect(JobValidation.isReady(JobStatus.SCHEDULED)).toBe(true);
    });

    it("should return false for other statuses", () => {
      expect(JobValidation.isReady(JobStatus.RUNNING)).toBe(false);
      expect(JobValidation.isReady(JobStatus.STOPPED)).toBe(false);
      expect(JobValidation.isReady(JobStatus.TO_STOP)).toBe(false);
    });
  });

  describe("hasReachedFailureLimit", () => {
    it("should return true when failed syncs exceed limit", () => {
      const failedSyncs = Array(JobConfig.MAX_FAILED_SYNCS + 1).fill({
        error: "test error",
      });
      expect(JobValidation.hasReachedFailureLimit(failedSyncs)).toBe(true);
    });

    it("should return false when failed syncs are below limit", () => {
      const failedSyncs = Array(JobConfig.MAX_FAILED_SYNCS - 1).fill({
        error: "test error",
      });
      expect(JobValidation.hasReachedFailureLimit(failedSyncs)).toBe(false);
    });
  });

  describe("hasReachedTimeLimit", () => {
    it("should return true when execution time exceeds limit", () => {
      const startTime = new Date(
        Date.now() - (JobConfig.EXECUTION_TIME_LIMIT + 1000)
      );
      expect(JobValidation.hasReachedTimeLimit(startTime)).toBe(true);
    });

    it("should return false when execution time is within limit", () => {
      const startTime = new Date(
        Date.now() - (JobConfig.EXECUTION_TIME_LIMIT - 1000)
      );
      expect(JobValidation.hasReachedTimeLimit(startTime)).toBe(false);
    });
  });
});

describe("createContinuationHandler", () => {
  const mockCheckJobStatus = jest.fn();
  const mockUpdateJobStatus = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should return false when status is TO_STOP", async () => {
    mockCheckJobStatus.mockResolvedValue({
      status: JobStatus.TO_STOP,
      failedSyncs: [],
    });

    const continuationHandler = createShouldContinueHandler(
      mockCheckJobStatus,
      mockUpdateJobStatus
    );

    const result = await continuationHandler();
    expect(result).toBe(false);
    expect(mockUpdateJobStatus).toHaveBeenCalledWith(
      expect.objectContaining({ status: JobStatus.STOPPED })
    );
  });

  it("should return false when failed syncs reach limit", async () => {
    const failedSyncs = Array(JobConfig.MAX_FAILED_SYNCS).fill({
      error: "test error",
    });
    mockCheckJobStatus.mockResolvedValue({
      status: JobStatus.RUNNING,
      failedSyncs,
    });

    const continuationHandler = createShouldContinueHandler(
      mockCheckJobStatus,
      mockUpdateJobStatus
    );

    const result = await continuationHandler();
    expect(result).toBe(false);
    expect(mockUpdateJobStatus).toHaveBeenCalledWith(
      expect.objectContaining({ status: JobStatus.STOPPED })
    );
  });

  it("should update remaining items and return true when running normally", async () => {
    mockCheckJobStatus.mockResolvedValue({
      status: JobStatus.RUNNING,
      failedSyncs: [],
      remainingToSync: 10,
    });

    const continuationHandler = createShouldContinueHandler(
      mockCheckJobStatus,
      mockUpdateJobStatus
    );

    const result = await continuationHandler();
    expect(result).toBe(true);
    expect(mockUpdateJobStatus).toHaveBeenCalledWith({
      remainingToSync: 5, // 10 - BATCH_SIZE
    });
  });
});

describe("createExecutionHandler", () => {
  const mockUpdateJobStatus = jest.fn();
  const startTime = new Date();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should transition to IDLE when cursor is null and is FullSync", async () => {
    const executionHandler = createExecutionHandler(
      startTime,
      mockUpdateJobStatus,
      "full"
    );
    const result: ExecutionResult = { cursor: null, failedSyncs: null };

    await executionHandler(result);
    expect(mockUpdateJobStatus).toHaveBeenCalledWith(
      expect.objectContaining({ status: "IDLE" })
    );
  });

  it("should transition to SCHEDULED when cursor is null and is DeltaSync", async () => {
    const executionHandler = createExecutionHandler(
      startTime,
      mockUpdateJobStatus,
      "delta"
    );
    const result: ExecutionResult = { cursor: null, failedSyncs: null };

    await executionHandler(result);
    expect(mockUpdateJobStatus).toHaveBeenCalledWith(
      expect.objectContaining({ status: JobStatus.SCHEDULED })
    );
  });

  it("should transition to RESUMABLE when time limit is reached", async () => {
    const oldStartTime = new Date(
      Date.now() - JobConfig.EXECUTION_TIME_LIMIT - 1000
    );
    const executionHandler = createExecutionHandler(
      oldStartTime,
      mockUpdateJobStatus,
      "full"
    );
    const result: ExecutionResult = { cursor: "test-cursor", failedSyncs: [] };

    await executionHandler(result);
    expect(mockUpdateJobStatus).toHaveBeenCalledWith(
      expect.objectContaining({
        status: JobStatus.RESUMABLE,
        lastCursor: "test-cursor",
      })
    );
  });
});

describe("createJobProcessor", () => {
  const mockCustomObjectStorage = {
    full: {
      container: "full-container",
      key: "full-key",
    },
    delta: {
      container: "delta-container",
      key: "delta-key",
    },
    all: {
      container: "all-container",
      key: "all-key",
    },
  };

  const mockCheckJobStatus = jest.fn();
  const mockUpdateJobStatus = jest.fn();
  const mockGetTotalProductsCount = jest.fn();
  const mockStartSyncProcess = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    (createJobHandler as jest.Mock).mockReturnValue({
      checkJobStatus: mockCheckJobStatus,
      updateJobStatus: mockUpdateJobStatus,
    });
    (getTotalProductsCount as jest.Mock).mockImplementation(
      mockGetTotalProductsCount
    );
    (startSyncProcess as jest.Mock).mockImplementation(mockStartSyncProcess);
    mockStartSyncProcess.mockResolvedValue({ success: true });
    (fetchCustomObject as jest.Mock).mockResolvedValue({
      value: JSON.stringify({ config: { someConfig: "value" } }),
    });
  });

  it("should not process when job is in progress", async () => {
    mockCheckJobStatus.mockResolvedValue({
      status: JobStatus.RUNNING,
    });

    const result = await createJobProcessor("full", mockCustomObjectStorage);
    expect(result).toBeUndefined();
    expect(mockUpdateJobStatus).not.toHaveBeenCalled();
  });

  it("should stop when status is TO_STOP", async () => {
    mockCheckJobStatus.mockResolvedValue({
      status: JobStatus.TO_STOP,
    });

    const result = await createJobProcessor("full", mockCustomObjectStorage);
    expect(result).toBeUndefined();
    expect(mockUpdateJobStatus).toHaveBeenCalledWith(
      expect.objectContaining({ status: JobStatus.STOPPED })
    );
  });

  it("should return undefined when status is not ready or in progress", async () => {
    mockCheckJobStatus.mockResolvedValue({
      status: "INVALID_STATUS",
    });

    const result = await createJobProcessor("full", mockCustomObjectStorage);
    expect(result).toBeUndefined();
    expect(mockUpdateJobStatus).not.toHaveBeenCalled();
  });

  it("should start sync process when status is SCHEDULED", async () => {
    mockCheckJobStatus.mockResolvedValue({
      status: JobStatus.SCHEDULED,
    });
    mockGetTotalProductsCount.mockResolvedValue(100);

    const result = await createJobProcessor("full", mockCustomObjectStorage);

    expect(mockUpdateJobStatus).toHaveBeenCalledWith(
      expect.objectContaining({
        status: JobStatus.RUNNING,
        remainingToSync: 100,
        lastSyncDate: expect.any(String),
      })
    );
    expect(mockStartSyncProcess).toHaveBeenCalledWith(
      expect.objectContaining({
        isDelta: false,
        config: { someConfig: "value" },
        lastSyncDate: expect.any(Date),
        saveLastExecution: expect.any(Function),
        shouldContinue: expect.any(Function),
        lastCursor: undefined,
      })
    );
    expect(result).toEqual({ success: true });
  });

  it("should start sync process when status is RESUMABLE", async () => {
    const lastCursor = "test-cursor";
    const lastSyncDate = "test-date";
    mockCheckJobStatus.mockResolvedValue({
      status: JobStatus.RESUMABLE,
      lastCursor,
      lastSyncDate,
    });

    const result = await createJobProcessor("delta", mockCustomObjectStorage);

    expect(mockUpdateJobStatus).toHaveBeenCalledWith(
      expect.objectContaining({
        status: JobStatus.RUNNING,
      })
    );
    expect(mockStartSyncProcess).toHaveBeenCalledWith(
      expect.objectContaining({
        isDelta: true,
        lastCursor,
        lastSyncDate,
      })
    );
    expect(result).toEqual({ success: true });
  });
});
