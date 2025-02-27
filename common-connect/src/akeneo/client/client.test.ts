import { jest } from "@jest/globals";
import axios from "axios";
import { getAkeneoClient, AkeneoAPI } from "./client";
import getAccessToken from "./auth";

// Mock dependencies
jest.mock("./auth");
jest.mock("axios");
jest.mock("../../commercetools/utils/logger.utils", () => ({
  logger: {
    error: jest.fn(),
  },
}));

const mockExit = jest
  .spyOn(process, "exit")
  .mockImplementation((code?: string | number | null | undefined) => {
    throw new Error(`Process.exit called with code: ${code}`);
  });

// Mock global fetch with proper typing
global.fetch = jest.fn() as jest.MockedFunction<typeof fetch>;

describe("AkeneoAPI", () => {
  let akeneoClient: Awaited<ReturnType<typeof getAkeneoClient>>;
  const mockAccessToken = "mock-access-token";
  const mockBaseUrl = "https://akeneo.test";

  beforeEach(async () => {
    // Reset all mocks and the singleton instance
    jest.clearAllMocks();
    AkeneoAPI.resetInstance();

    // Setup mocks
    (
      getAccessToken as jest.MockedFunction<typeof getAccessToken>
    ).mockResolvedValue(mockAccessToken);
    process.env.AKENEO_BASE_URL = mockBaseUrl;

    // Get a fresh instance for each test
    akeneoClient = await getAkeneoClient();
  });

  afterEach(() => {
    // Reset the singleton instance after each test
    AkeneoAPI.resetInstance();
  });

  describe("getInstance", () => {
    it("should initialize with access token", async () => {
      expect(getAccessToken).toHaveBeenCalled();
      expect(akeneoClient).toBeDefined();
    });

    it("should reuse the same instance", async () => {
      const instance1 = await getAkeneoClient();
      const instance2 = await getAkeneoClient();
      expect(instance1).toBe(instance2);
      expect(getAccessToken).toHaveBeenCalledTimes(1);
    });

    it("should throw error if access token is undefined", async () => {
      AkeneoAPI.resetInstance();
      (
        getAccessToken as jest.MockedFunction<typeof getAccessToken>
      ).mockResolvedValueOnce(undefined as any);
      await expect(getAkeneoClient()).rejects.toThrow(
        "Access token is undefined"
      );
    });
  });

  describe("getProductModel", () => {
    const mockCode = "test-product";
    const mockResponse = { id: 1, code: mockCode };

    beforeEach(() => {
      (global.fetch as jest.MockedFunction<typeof fetch>).mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(mockResponse),
      } as Response);
    });

    it("should fetch product model successfully", async () => {
      const result = await akeneoClient.getProductModel(mockCode);

      expect(global.fetch).toHaveBeenCalledWith(
        `${mockBaseUrl}/api/rest/v1/product-models/${mockCode}`,
        expect.objectContaining({
          headers: {
            Authorization: `Bearer ${mockAccessToken}`,
            "Content-Type": "application/json",
          },
        })
      );
      expect(result).toEqual(mockResponse);
    });

    it("should throw error on failed request", async () => {
      const errorMessage = "Not found";
      (global.fetch as jest.MockedFunction<typeof fetch>).mockResolvedValue({
        ok: false,
        json: () => Promise.resolve({ message: errorMessage }),
      } as Response);

      await expect(akeneoClient.getProductModel(mockCode)).rejects.toThrow(
        `Failed to fetch product model: ${errorMessage}`
      );
    });
  });

  describe("getProductImageUrl", () => {
    const mockAssetFamily = "images";
    const mockFileName = "test.jpg";
    const mockDownloadUrl = "https://download.url/image.jpg";
    const mockResponse = {
      values: {
        media: [{ _links: { download: { href: mockDownloadUrl } } }],
      },
    };

    beforeEach(() => {
      (global.fetch as jest.MockedFunction<typeof fetch>).mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(mockResponse),
      } as Response);
    });

    it("should fetch image URL successfully", async () => {
      const result = await akeneoClient.getProductImageUrl(
        mockAssetFamily,
        mockFileName
      );

      expect(global.fetch).toHaveBeenCalledWith(
        `${mockBaseUrl}/api/rest/v1/asset-families/${mockAssetFamily}/assets/${mockFileName}`,
        expect.any(Object)
      );
      expect(result).toBe(mockDownloadUrl);
    });

    it("should throw error on failed request", async () => {
      (global.fetch as jest.MockedFunction<typeof fetch>).mockResolvedValue({
        ok: false,
        json: () => Promise.resolve({ message: "Not found" }),
      } as Response);

      await expect(
        akeneoClient.getProductImageUrl(mockAssetFamily, mockFileName)
      ).rejects.toThrow("Failed to fetch product image: Not found");
    });

    it("should handle missing media data", async () => {
      const responseWithoutMedia = {
        values: {
          media: [],
        },
      };

      (global.fetch as jest.MockedFunction<typeof fetch>).mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(responseWithoutMedia),
      } as Response);

      await expect(
        akeneoClient.getProductImageUrl(mockAssetFamily, mockFileName)
      ).rejects.toThrow("Cannot read properties of undefined");
    });

    it("should handle malformed response", async () => {
      const malformedResponse = {
        values: {},
      };

      (global.fetch as jest.MockedFunction<typeof fetch>).mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(malformedResponse),
      } as Response);

      await expect(
        akeneoClient.getProductImageUrl(mockAssetFamily, mockFileName)
      ).rejects.toThrow();
    });
  });

  describe("getFileBufferFromUrl", () => {
    const mockFileUrl = "https://example.com/file.pdf";
    const mockBuffer = Buffer.from("test");

    beforeEach(() => {
      (axios.get as jest.MockedFunction<typeof axios.get>).mockResolvedValue({
        data: mockBuffer,
      });
    });

    it("should fetch file buffer successfully", async () => {
      const result = await akeneoClient.getFileBufferFromUrl(mockFileUrl);

      expect(axios.get).toHaveBeenCalledWith(
        mockFileUrl,
        expect.objectContaining({
          responseType: "arraybuffer",
          headers: {
            Authorization: `Bearer ${mockAccessToken}`,
            "Content-Type": "application/json",
          },
        })
      );
      expect(Buffer.isBuffer(result)).toBe(true);
    });

    it("should throw error when no data received", async () => {
      (axios.get as jest.MockedFunction<typeof axios.get>).mockResolvedValue({
        data: null,
      });

      await expect(
        akeneoClient.getFileBufferFromUrl(mockFileUrl)
      ).rejects.toThrow("Failed to fetch file stream");
    });
  });

  describe("getProducts", () => {
    const mockProducts = {
      _embedded: {
        items: [{ id: 1 }, { id: 2 }],
      },
      _links: {
        next: { href: "https://next.page?search_after=abc" },
      },
      items_count: 2,
    };

    beforeEach(() => {
      (global.fetch as jest.MockedFunction<typeof fetch>).mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(mockProducts),
      } as Response);
    });

    it("should fetch products with default parameters", async () => {
      const params = {
        searchFilters: {
          families: ["family1"],
          completeness: "100",
          scope: "ecommerce",
        },
      };

      const result = await akeneoClient.getProducts(params);

      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining(`${mockBaseUrl}/api/rest/v1/products`),
        expect.any(Object)
      );
      expect(result).toEqual({
        searchAfter: "abc",
        products: mockProducts._embedded.items,
        total: mockProducts.items_count,
      });
    });

    it("should handle delta sync parameters", async () => {
      const params = {
        searchFilters: {
          families: ["family1"],
          completeness: "100",
          scope: "ecommerce",
        },
        isDelta: true,
        lastSyncDate: new Date("2023-01-01"),
      };

      await akeneoClient.getProducts(params);

      const fetchCall = (global.fetch as jest.MockedFunction<typeof fetch>).mock
        .calls[0][0];

      expect(fetchCall).toContain("updated");
    });

    it("should throw error on failed request", async () => {
      (global.fetch as jest.MockedFunction<typeof fetch>).mockResolvedValue({
        ok: false,
        json: () => Promise.resolve({ message: "Failed" }),
      } as Response);

      await expect(
        akeneoClient.getProducts({
          searchFilters: {
            families: ["family1"],
            completeness: "100",
            scope: "ecommerce",
          },
        })
      ).rejects.toThrow("Failed to fetch products");
    });

    it("should handle empty results", async () => {
      const emptyResponse = {
        _embedded: {
          items: [],
        },
        _links: {},
        items_count: 0,
      };

      (global.fetch as jest.MockedFunction<typeof fetch>).mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(emptyResponse),
      } as Response);

      const result = await akeneoClient.getProducts({
        searchFilters: {
          families: ["family1"],
          completeness: "100",
          scope: "ecommerce",
        },
      });

      expect(result).toEqual({
        searchAfter: null,
        products: [],
        total: 0,
      });
    });

    it("should handle custom limit parameter", async () => {
      await akeneoClient.getProducts({
        limit: 10,
        searchFilters: {
          families: ["family1"],
          completeness: "100",
          scope: "ecommerce",
        },
      });

      const fetchCall = (global.fetch as jest.MockedFunction<typeof fetch>).mock
        .calls[0][0];
      expect(fetchCall).toContain("limit=10");
    });

    it("should handle searchAfterParam for pagination", async () => {
      await akeneoClient.getProducts({
        searchAfterParam: "next-page-token",
        searchFilters: {
          families: ["family1"],
          completeness: "100",
          scope: "ecommerce",
        },
      });

      const fetchCall = (global.fetch as jest.MockedFunction<typeof fetch>).mock
        .calls[0][0];
      expect(fetchCall).toContain("search_after=next-page-token");
      expect(fetchCall).toContain("pagination_type=search_after");
    });

    it("should handle missing _embedded in response", async () => {
      const responseWithoutEmbedded = {
        _links: {},
        items_count: 0,
      };

      (global.fetch as jest.MockedFunction<typeof fetch>).mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(responseWithoutEmbedded),
      } as Response);

      const result = await akeneoClient.getProducts({
        searchFilters: {
          families: ["family1"],
          completeness: "100",
          scope: "ecommerce",
        },
      });

      expect(result).toEqual({
        searchAfter: null,
        products: [],
        total: 0,
      });
    });
  });

  describe("getAuthHeaders", () => {
    it("should throw error when access token is undefined", async () => {
      AkeneoAPI.resetInstance();
      const instance = await AkeneoAPI.getInstance();
      // @ts-ignore - Accessing private property for testing
      instance.accessToken = null;

      // @ts-ignore - Accessing private method for testing
      expect(() => instance.getAuthHeaders()).toThrow(
        "Access token is undefined"
      );
    });
  });

  describe("initializeAccessToken", () => {
    it("should throw error when token is undefined", async () => {
      AkeneoAPI.resetInstance();
      (
        getAccessToken as jest.MockedFunction<typeof getAccessToken>
      ).mockResolvedValueOnce(undefined as any);

      // Create a new instance and test the initialization directly
      await expect(AkeneoAPI.getInstance()).rejects.toThrow(
        "Access token is undefined"
      );
    });
  });

  describe("token expiration handling", () => {
    const mockExpiredTokenError = {
      message: "The access token provided has expired",
    };

    it("should handle token expiration and retry for getProducts", async () => {
      // First call fails with expired token
      (global.fetch as jest.MockedFunction<typeof fetch>)
        .mockResolvedValueOnce({
          ok: false,
          json: () => Promise.resolve(mockExpiredTokenError),
        } as Response)
        // Second call succeeds after token refresh
        .mockResolvedValueOnce({
          ok: true,
          json: () =>
            Promise.resolve({
              _embedded: { items: [{ id: 1 }] },
              _links: {},
              items_count: 1,
            }),
        } as Response);

      const result = await akeneoClient.getProducts({
        searchFilters: {
          families: ["family1"],
          completeness: "100",
          scope: "ecommerce",
        },
      });

      expect(getAccessToken).toHaveBeenCalledTimes(2);
      expect(result).toEqual({
        searchAfter: null,
        products: [{ id: 1 }],
        total: 1,
      });
    });

    it("should handle token expiration and retry for getProductModel", async () => {
      const mockCode = "test-product";
      const mockResponse = { id: 1, code: mockCode };

      (global.fetch as jest.MockedFunction<typeof fetch>)
        .mockResolvedValueOnce({
          ok: false,
          json: () => Promise.resolve(mockExpiredTokenError),
        } as Response)
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve(mockResponse),
        } as Response);

      const result = await akeneoClient.getProductModel(mockCode);

      expect(getAccessToken).toHaveBeenCalledTimes(2);
      expect(result).toEqual(mockResponse);
    });

    it("should handle token expiration and retry for getProductImageUrl", async () => {
      const mockAssetFamily = "images";
      const mockFileName = "test.jpg";
      const mockDownloadUrl = "https://download.url/image.jpg";
      const mockResponse = {
        values: {
          media: [{ _links: { download: { href: mockDownloadUrl } } }],
        },
      };

      (global.fetch as jest.MockedFunction<typeof fetch>)
        .mockResolvedValueOnce({
          ok: false,
          json: () => Promise.resolve(mockExpiredTokenError),
        } as Response)
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve(mockResponse),
        } as Response);

      const result = await akeneoClient.getProductImageUrl(
        mockAssetFamily,
        mockFileName
      );

      expect(getAccessToken).toHaveBeenCalledTimes(2);
      expect(result).toBe(mockDownloadUrl);
    });

    it("should handle token expiration and retry for getFileBufferFromUrl", async () => {
      const mockFileUrl = "https://example.com/file.pdf";
      const mockBuffer = Buffer.from("test");

      (axios.get as jest.MockedFunction<typeof axios.get>)
        .mockRejectedValueOnce(
          new Error("The access token provided has expired")
        )
        .mockResolvedValueOnce({ data: mockBuffer });

      const result = await akeneoClient.getFileBufferFromUrl(mockFileUrl);

      expect(getAccessToken).toHaveBeenCalledTimes(2);
      expect(Buffer.isBuffer(result)).toBe(true);
    });

    it("should not retry more than once on repeated token expiration", async () => {
      (global.fetch as jest.MockedFunction<typeof fetch>).mockResolvedValue({
        ok: false,
        json: () => Promise.resolve(mockExpiredTokenError),
      } as Response);

      await expect(
        akeneoClient.getProducts({
          searchFilters: {
            families: ["family1"],
            completeness: "100",
            scope: "ecommerce",
          },
        })
      ).rejects.toThrow("Failed to fetch products");

      expect(getAccessToken).toHaveBeenCalledTimes(3); // Initial + 2 retry
    });

    it("should throw original error if not token expiration", async () => {
      const errorMessage = "Network error";
      (global.fetch as jest.MockedFunction<typeof fetch>).mockResolvedValue({
        ok: false,
        json: () => Promise.resolve({ message: errorMessage }),
      } as Response);

      await expect(
        akeneoClient.getProducts({
          searchFilters: {
            families: ["family1"],
            completeness: "100",
            scope: "ecommerce",
          },
        })
      ).rejects.toThrow(`Failed to fetch products: ${errorMessage}`);

      expect(getAccessToken).toHaveBeenCalledTimes(1); // No retry
    });
  });
});
