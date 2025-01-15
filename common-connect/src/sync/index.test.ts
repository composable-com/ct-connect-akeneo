import { createActor } from "xstate";
import { startSyncProcess, syncProduct } from "./index";
import { getAkeneoClient } from "../akeneo/client/client";
import { logger } from "../commercetools/utils/logger.utils";
import { AkeneoProduct } from "../types/akeneo.types";
import { Config } from "../types/config.types";
import { akeneoMachine } from "../machines/akeneoMachine";

// Define type for state snapshots
interface StateSnapshot {
  status: "done" | "error";
  context?: { error: string | null };
  error?: string;
}

// Mock dependencies
jest.mock("xstate", () => {
  const originalModule = jest.requireActual("xstate");
  return {
    ...originalModule,
    createActor: jest.fn((machine, options) => ({
      subscribe: jest.fn(),
      start: jest.fn(),
      stop: jest.fn(),
    })),
    fromPromise: jest.fn(),
    setup: jest.fn().mockReturnValue({
      createMachine: jest.fn(),
    }),
    assign: jest.fn(),
  };
});

jest.mock("../akeneo/client/client", () => ({
  getAkeneoClient: jest.fn(),
}));

jest.mock("../commercetools/utils/logger.utils", () => ({
  logger: {
    info: jest.fn(),
    error: jest.fn(),
  },
}));

jest.mock("../akeneo/client/auth", () => ({
  authenticate: jest.fn().mockResolvedValue({ access_token: "test-token" }),
}));

describe("Sync Module", () => {
  const mockAkeneoClient = {
    getProducts: jest.fn(),
  };

  const mockActor = {
    subscribe: jest.fn(),
    start: jest.fn(),
    stop: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
    (getAkeneoClient as jest.Mock).mockResolvedValue(mockAkeneoClient);
    (createActor as jest.Mock).mockReturnValue(mockActor);
  });

  describe("startSyncProcess", () => {
    it("should process products and save execution state", async () => {
      const mockSaveLastExecution = jest.fn();
      const mockShouldContinue = jest.fn().mockResolvedValue(true);

      const mockProducts: AkeneoProduct[] = [
        {
          uuid: "uuid1",
          identifier: "product1",
          enabled: true,
          family: "family1",
          categories: [],
          groups: [],
          values: {},
          created: "",
          updated: "",
          parent: null,
        },
        {
          uuid: "uuid2",
          identifier: "product2",
          enabled: true,
          family: "family1",
          categories: [],
          groups: [],
          values: {},
          created: "",
          updated: "",
          parent: null,
        },
      ];

      mockAkeneoClient.getProducts
        .mockResolvedValue({
          products: mockProducts,
          searchAfter: "cursor1",
        })
        .mockResolvedValueOnce({
          products: [],
          searchAfter: null,
        });

      await startSyncProcess({
        isDelta: false,
        saveLastExecution: mockSaveLastExecution,
        shouldContinue: mockShouldContinue,
        config: {
          familyMapping: {
            family1: {
              commercetoolsProductTypeId: "mapping1",
              akeneoImagesAttribute: "images",
              coreAttributeMapping: {},
              attributeMapping: {},
            },
            family2: {
              commercetoolsProductTypeId: "mapping2",
              akeneoImagesAttribute: "images",
              coreAttributeMapping: {},
              attributeMapping: {},
            },
          },
          localeMapping: {},
          categoryMapping: {},
          akeneoScope: "test_scope",
        },
      });

      expect(mockAkeneoClient.getProducts).toHaveBeenCalledWith({
        searchAfterParam: null,
        limit: 5,
        lastSyncDate: undefined,
        searchFilters: {
          families: ["family1", "family2"],
          completeness: "100",
          scope: "test_scope",
        },
        isDelta: false,
      });

      expect(mockSaveLastExecution).toHaveBeenCalledWith({
        cursor: null,
        failedSyncs: null,
      });
    });

    it("should stop processing when shouldContinue returns false", async () => {
      const mockSaveLastExecution = jest.fn();
      const mockShouldContinue = jest.fn().mockResolvedValue(false);

      await startSyncProcess({
        isDelta: false,
        saveLastExecution: mockSaveLastExecution,
        shouldContinue: mockShouldContinue,
        config: {
          familyMapping: {
            family1: {
              commercetoolsProductTypeId: "mapping1",
              akeneoImagesAttribute: "images",
              coreAttributeMapping: {},
              attributeMapping: {},
            },
            family2: {
              commercetoolsProductTypeId: "mapping2",
              akeneoImagesAttribute: "images",
              coreAttributeMapping: {},
              attributeMapping: {},
            },
          },
          localeMapping: {},
          categoryMapping: {},
          akeneoScope: "test_scope",
        },
      });

      expect(mockAkeneoClient.getProducts).not.toHaveBeenCalled();
    });

    it("should handle sync failures and collect errors", async () => {
      const mockSaveLastExecution = jest.fn();
      const mockShouldContinue = jest.fn().mockResolvedValue(true);

      const mockProducts: AkeneoProduct[] = [
        {
          uuid: "uuid1",
          identifier: "product1",
          enabled: true,
          family: "family1",
          categories: [],
          groups: [],
          values: {},
          created: "",
          updated: "",
          parent: null,
        },
      ];

      mockAkeneoClient.getProducts.mockResolvedValueOnce({
        products: mockProducts,
        searchAfter: null,
      });

      // Simulate a sync failure
      mockActor.subscribe.mockImplementation(
        (callback: (state: StateSnapshot) => void) => {
          callback({
            status: "error",
            error: "Failed to sync product",
          });
        }
      );

      await startSyncProcess({
        isDelta: false,
        saveLastExecution: mockSaveLastExecution,
        shouldContinue: mockShouldContinue,
        config: {
          familyMapping: {
            family1: {
              commercetoolsProductTypeId: "mapping1",
              akeneoImagesAttribute: "images",
              coreAttributeMapping: {},
              attributeMapping: {},
            },
            family2: {
              commercetoolsProductTypeId: "mapping2",
              akeneoImagesAttribute: "images",
              coreAttributeMapping: {},
              attributeMapping: {},
            },
          },
          localeMapping: {},
          categoryMapping: {},
          akeneoScope: "test_scope",
        },
      });

      const failedSync = mockSaveLastExecution.mock.calls[0][0].failedSyncs[0];
      expect(failedSync).toMatchObject({
        identifier: "product1",
        errorMessage: "Failed to sync product",
      });
      expect(failedSync.date).toBeDefined();
      expect(new Date(failedSync.date)).toBeInstanceOf(Date);
      expect(logger.error).toHaveBeenCalled();
    });
  });

  describe("syncProduct", () => {
    it("should successfully sync a product", async () => {
      const mockProduct: AkeneoProduct = {
        uuid: "test-uuid",
        identifier: "test-product",
        enabled: true,
        family: "family1",
        categories: [],
        groups: [],
        values: {},
        created: "",
        updated: "",
        parent: null,
      };
      const mockConfig: Config = {
        familyMapping: {},
        akeneoScope: "test",
        localeMapping: {},
        categoryMapping: {},
      };

      mockActor.subscribe.mockImplementation(
        (callback: (state: StateSnapshot) => void) => {
          callback({
            status: "done",
            context: { error: null },
          });
        }
      );

      await expect(syncProduct(mockProduct, mockConfig)).resolves.not.toThrow();

      expect(createActor).toHaveBeenCalledWith(akeneoMachine, {
        input: {
          incomingProduct: mockProduct,
          config: mockConfig,
        },
      });
      expect(logger.info).toHaveBeenCalledWith(
        "Akeneo Product test-uuid synced successfully."
      );
    });

    it("should handle sync errors", async () => {
      const mockProduct: AkeneoProduct = {
        uuid: "test-uuid",
        identifier: "test-product",
        enabled: true,
        family: "family1",
        categories: [],
        groups: [],
        values: {},
        created: "",
        updated: "",
        parent: null,
      };
      const mockConfig: Config = {
        familyMapping: {},
        akeneoScope: "test",
        localeMapping: {},
        categoryMapping: {},
      };
      const errorMessage = "Sync failed";

      mockActor.subscribe.mockImplementation(
        (callback: (state: StateSnapshot) => void) => {
          callback({
            status: "error",
            error: errorMessage,
          });
        }
      );

      await expect(syncProduct(mockProduct, mockConfig)).rejects.toThrow(
        errorMessage
      );
    });
  });
});
