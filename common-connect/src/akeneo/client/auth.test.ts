import { jest } from "@jest/globals";
import getAccessToken from "./auth";

// Mock environment variables
const mockEnv = {
  AKENEO_CLIENT_ID: "test-client-id",
  AKENEO_CLIENT_SECRET: "test-client-secret",
  AKENEO_USERNAME: "test-username",
  AKENEO_PASSWORD: "test-password",
  AKENEO_BASE_URL: "https://test.akeneo.com",
};

jest.mock("dotenv", () => ({
  config: jest.fn(),
}));

// Mock the logger to prevent actual logging during tests
jest.mock("../../commercetools/utils/logger.utils", () => ({
  logger: {
    error: jest.fn(),
  },
}));

describe("getAccessToken", () => {
  beforeEach(() => {
    // Reset all mocks before each test
    jest.clearAllMocks();
    
    // Setup process.env for each test
    process.env = {};
    (Object.keys(mockEnv) as Array<keyof typeof mockEnv>).forEach(key => {
      process.env[key] = mockEnv[key];
    });
    
    // Mock global fetch
    global.fetch = jest.fn() as jest.MockedFunction<typeof fetch>;
  });

  afterEach(() => {
    // Clean up
    jest.restoreAllMocks();
    process.env = {};
  });

  it("should successfully retrieve an access token", async () => {
    const mockResponse = {
      access_token: "test-access-token",
      expires_in: 3600,
      token_type: "bearer",
      scope: null,
    };

    (global.fetch as jest.MockedFunction<typeof fetch>).mockResolvedValue({
      ok: true,
      json: async () => mockResponse,
    } as Response);

    const result = await getAccessToken();

    // Check if fetch was called with correct parameters
    expect(global.fetch).toHaveBeenCalledWith(
      `${mockEnv.AKENEO_BASE_URL}/api/oauth/v1/token`,
      {
        method: "POST",
        headers: {
          Authorization: expect.any(String),
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          grant_type: "password",
          username: mockEnv.AKENEO_USERNAME,
          password: mockEnv.AKENEO_PASSWORD,
        }),
      }
    );

    expect(result).toBe(mockResponse.access_token);
  });

  it("should throw an error when authentication fails", async () => {
    const mockErrorResponse = {
      error: "invalid_grant",
      error_description: "Invalid credentials",
    };

    (global.fetch as jest.MockedFunction<typeof fetch>).mockResolvedValue({
      ok: false,
      json: async () => mockErrorResponse,
    } as Response);

    const mockExit = jest.spyOn(process, "exit").mockImplementation((number) => {
      throw new Error("process.exit: " + number);
    });

    await expect(getAccessToken()).rejects.toThrow();

    expect(mockExit).toHaveBeenCalledWith(1);
  });

  it("should handle network errors", async () => {
    (global.fetch as jest.MockedFunction<typeof fetch>).mockRejectedValue(
      new Error("Network error")
    );

    const mockExit = jest.spyOn(process, "exit").mockImplementation((number) => {
      throw new Error("process.exit: " + number);
    });

    await expect(getAccessToken()).rejects.toThrow();

    expect(mockExit).toHaveBeenCalledWith(1);
  });

  it("should throw error when environment variables are missing", async () => {
    // Clear all environment variables
    process.env = {};

    const mockExit = jest.spyOn(process, "exit").mockImplementation((number) => {
      throw new Error("process.exit: " + number);
    });

    const mockLogger = jest.spyOn(require("../../commercetools/utils/logger.utils").logger, "error");

    await expect(getAccessToken()).rejects.toThrow();

    expect(mockLogger).toHaveBeenCalledWith(
      "Missing Akeneo environment variables. Please check your .env file."
    );
    expect(mockExit).toHaveBeenCalledWith(1);
  });
}); 