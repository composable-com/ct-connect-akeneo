import { createApiRoot } from "../client/create.client";
import { fetchCustomObject, updateCustomObject, deleteCustomObject } from "./custom-objects";

jest.mock("../client/create.client");

describe("Custom Objects API", () => {
  const mockExecute = jest.fn();
  const mockGet = jest.fn().mockReturnValue({ execute: mockExecute });
  const mockPost = jest.fn().mockReturnValue({ execute: mockExecute });
  const mockDelete = jest.fn().mockReturnValue({ execute: mockExecute });
  const mockWithContainerAndKey = jest.fn().mockReturnValue({
    get: mockGet,
    delete: mockDelete,
  });
  const mockCustomObjects = jest.fn().mockReturnValue({
    withContainerAndKey: mockWithContainerAndKey,
    post: mockPost,
  });

  const mockCreateApiRoot = createApiRoot as jest.Mock;
  mockCreateApiRoot.mockReturnValue({
    customObjects: mockCustomObjects,
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("fetchCustomObject", () => {
    it("should fetch custom object successfully", async () => {
      const expectedResponse = { value: "test-value" };
      mockExecute.mockResolvedValueOnce({ body: expectedResponse });

      const result = await fetchCustomObject({
        container: "test-container",
        key: "test-key",
      });

      expect(result).toEqual(expectedResponse);
      expect(mockWithContainerAndKey).toHaveBeenCalledWith({
        container: "test-container",
        key: "test-key",
      });
      expect(mockGet).toHaveBeenCalled();
      expect(mockExecute).toHaveBeenCalled();
    });

    it("should return null value when fetch fails", async () => {
      mockExecute.mockRejectedValueOnce(new Error("API Error"));

      const result = await fetchCustomObject({
        container: "test-container",
        key: "test-key",
      });

      expect(result).toEqual({ value: null });
    });
  });

  describe("updateCustomObject", () => {
    it("should update custom object successfully", async () => {
      mockExecute.mockResolvedValueOnce({});

      await updateCustomObject({
        container: "test-container",
        key: "test-key",
        value: "test-value",
      });

      expect(mockPost).toHaveBeenCalledWith({
        body: {
          container: "test-container",
          key: "test-key",
          value: "test-value",
        },
      });
      expect(mockExecute).toHaveBeenCalled();
    });
  });

  describe("deleteCustomObject", () => {
    it("should delete custom object successfully", async () => {
      mockExecute.mockResolvedValueOnce({});

      await deleteCustomObject({
        container: "test-container",
        key: "test-key",
      });

      expect(mockWithContainerAndKey).toHaveBeenCalledWith({
        container: "test-container",
        key: "test-key",
      });
      expect(mockDelete).toHaveBeenCalled();
      expect(mockExecute).toHaveBeenCalled();
    });

    it("should handle delete failure gracefully", async () => {
      mockExecute.mockRejectedValueOnce(new Error("API Error"));

      await deleteCustomObject({
        container: "test-container",
        key: "test-key",
      });

      expect(mockWithContainerAndKey).toHaveBeenCalledWith({
        container: "test-container",
        key: "test-key",
      });
      expect(mockDelete).toHaveBeenCalled();
      expect(mockExecute).toHaveBeenCalled();
    });
  });
}); 