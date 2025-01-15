import { JobStatus, JobStateTransitions, createJobHandler } from "./index";
import { fetchCustomObject, updateCustomObject } from "../commercetools";

// Mock the commercetools functions
jest.mock("../commercetools", () => ({
  fetchCustomObject: jest.fn(),
  updateCustomObject: jest.fn(),
}));

describe("JobStateTransitions", () => {
  describe("toRunning", () => {
    it("should create running state with total products", () => {
      const totalProducts = 100;
      const result = JobStateTransitions.toRunning(totalProducts);

      expect(result).toEqual({
        status: JobStatus.RUNNING,
        totalToSync: totalProducts,
        remainingToSync: totalProducts,
      });
    });

    it("should create running state without total products", () => {
      const result = JobStateTransitions.toRunning();

      expect(result).toEqual({
        status: JobStatus.RUNNING,
        totalToSync: undefined,
        remainingToSync: undefined,
      });
    });
  });

  describe("toToStop", () => {
    it("should create to-stop state", () => {
      const result = JobStateTransitions.toToStop();

      expect(result).toEqual({
        status: JobStatus.TO_STOP,
        lastCursor: null,
        lastSyncDate: null,
        remainingToSync: null,
        totalToSync: null,
      });
    });
  });

  describe("toStopped", () => {
    it("should create stopped state with failed syncs", () => {
      const failedSyncs = [
        { identifier: "test", errorMessage: "error", date: "2023-01-01" },
      ];
      const result = JobStateTransitions.toStopped(failedSyncs);

      expect(result).toEqual({
        status: JobStatus.STOPPED,
        lastCursor: null,
        lastSyncDate: result.lastSyncDate,
        failedSyncs,
      });
    });

    it("should create stopped state without failed syncs", () => {
      const result = JobStateTransitions.toStopped();

      expect(result).toEqual({
        status: JobStatus.STOPPED,
        lastCursor: null,
        lastSyncDate: result.lastSyncDate,
        failedSyncs: undefined,
      });
    });
  });

  describe("toScheduled", () => {
    it("should create scheduled state", () => {
      const result = JobStateTransitions.toScheduled();

      expect(result).toEqual({
        status: JobStatus.SCHEDULED,
        lastCursor: null,
        lastSyncDate: null,
        remainingToSync: null,
        totalToSync: null,
        failedSyncs: null,
      });
    });
  });

  describe("toResumable", () => {
    it("should create resumable state", () => {
      const cursor = "test-cursor";
      const failedSyncs = [
        { identifier: "test", errorMessage: "error", date: "2023-01-01" },
      ];
      const result = JobStateTransitions.toResumable(cursor, failedSyncs);

      expect(result).toEqual({
        status: JobStatus.RESUMABLE,
        lastCursor: cursor,
        failedSyncs,
      });
    });
  });
});

describe("createJobHandler", () => {
  const container = "test-container";
  const key = "test-key";
  const jobHandler = createJobHandler({ container, key });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("checkJobStatus", () => {
    it("should return existing job status", async () => {
      const mockStatus = { status: JobStatus.RUNNING };
      (fetchCustomObject as jest.Mock).mockResolvedValueOnce({
        value: JSON.stringify(mockStatus),
      });

      const result = await jobHandler.checkJobStatus();

      expect(result).toEqual(mockStatus);
      expect(fetchCustomObject).toHaveBeenCalledWith({ container, key });
    });

    it("should return default scheduled status when no status exists", async () => {
      (fetchCustomObject as jest.Mock).mockResolvedValueOnce({ value: null });

      const result = await jobHandler.checkJobStatus();

      expect(result).toEqual({ status: JobStatus.SCHEDULED });
    });
  });

  describe("updateJobStatus", () => {
    it("should update job status with new payload", async () => {
      const currentStatus = { status: JobStatus.RUNNING };
      const newPayload = { remainingToSync: 50 };

      (fetchCustomObject as jest.Mock).mockResolvedValueOnce({
        value: JSON.stringify(currentStatus),
      });

      await jobHandler.updateJobStatus(newPayload);

      expect(updateCustomObject).toHaveBeenCalledWith({
        container,
        key,
        value: JSON.stringify({ ...currentStatus, ...newPayload }),
      });
    });
  });

  describe("startJobHandler", () => {
    it("should set job to scheduled state", async () => {
      await jobHandler.startJobHandler();

      expect(updateCustomObject).toHaveBeenCalledWith({
        container,
        key,
        value: JSON.stringify(JobStateTransitions.toScheduled()),
      });
    });
  });

  describe("cancelJobHandler", () => {
    it("should set job to to-stop state", async () => {
      await jobHandler.cancelJobHandler();

      expect(updateCustomObject).toHaveBeenCalledWith({
        container,
        key,
        value: JSON.stringify(JobStateTransitions.toToStop()),
      });
    });
  });
});
