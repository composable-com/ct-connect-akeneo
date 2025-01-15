import { createApiRoot, getProject } from "./create.client";

const mockedExecute = jest.fn();
const mockedGet = jest.fn();
const mockedWithProjectKey = jest.fn();
const mockApiRoot = {
  get: mockedGet,
};

jest.mock("@commercetools/platform-sdk", () => {
  return {
    createApiBuilderFromCtpClient: jest.fn().mockImplementation(() => ({
      withProjectKey: mockedWithProjectKey,
    })),
  };
});

jest.mock("./build.client");

jest.mock("../utils/config.utils", () => ({
  readConfiguration: jest.fn().mockImplementation(() => ({
    projectKey: "test-project-key",
    clientId: "test-client-id",
    clientSecret: "test-client-secret",
    scope: "test-scope",
    region: "test-region",
  })),
}));

describe("createApiRoot function", () => {
  beforeEach(() => {
    mockedWithProjectKey.mockReturnValue(mockApiRoot);
    jest.resetModules();
  });

  afterEach(() => {
    jest.resetAllMocks();
    jest.restoreAllMocks();
  });

  it("should create an API root with the correct project key", () => {
    createApiRoot();

    expect(mockedWithProjectKey).toBeCalledWith({
      projectKey: "test-project-key",
    });
  });

  it("should return the same instance on subsequent calls", () => {
    jest.isolateModules(() => {
      const { createApiRoot } = require("./create.client");
      const firstCall = createApiRoot();
      const secondCall = createApiRoot();

      expect(firstCall).toBe(secondCall);
      expect(mockedWithProjectKey).toHaveBeenCalledTimes(1);
    });
  });
});

describe("getProject function", () => {
  beforeEach(() => {
    mockedGet.mockReturnValue({ execute: mockedExecute });
    mockedExecute.mockResolvedValue({ body: { key: "test-project" } });
    mockedWithProjectKey.mockReturnValue(mockApiRoot);
  });

  afterEach(() => {
    jest.resetAllMocks();
    jest.restoreAllMocks();
  });

  it("should call get and execute methods", async () => {
    await getProject();

    expect(mockedGet).toHaveBeenCalled();
    expect(mockedExecute).toHaveBeenCalled();
  });

  it("should return the project data", async () => {
    const result = await getProject();

    expect(result).toEqual({ body: { key: "test-project" } });
  });
});
