import {
  Product,
  ProductProjection,
  ProductUpdateAction,
} from "@commercetools/platform-sdk";
import { createApiRoot } from "../client/create.client";
import {
  findProductByAkeneoId,
  getProductByAkeneoIdKey,
  getProductByAkeneoParentCode,
  addProductVariant,
  createProduct,
  updateProduct,
  addProductImage,
  CTAkeneoProduct,
  CTAkeneoProductVariant,
} from "./products";

// Mock the createApiRoot module
jest.mock("../client/create.client");

describe("Products API", () => {
  const mockExecute = jest.fn();
  const mockApiRoot = {
    products: jest.fn().mockReturnThis(),
    productProjections: jest.fn().mockReturnThis(),
    get: jest.fn().mockReturnThis(),
    post: jest.fn().mockReturnThis(),
    withId: jest.fn().mockReturnThis(),
    withKey: jest.fn().mockReturnThis(),
    images: jest.fn().mockReturnThis(),
    execute: mockExecute,
  };

  beforeEach(() => {
    jest.clearAllMocks();
    jest.spyOn(console, "error").mockImplementation(() => {});
    (createApiRoot as jest.Mock).mockReturnValue(mockApiRoot);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe("findProductByAkeneoId", () => {
    it("should find product by akeneo id when parent code is null", async () => {
      const mockProduct = { id: "123" };
      mockExecute.mockResolvedValueOnce({
        body: { results: [mockProduct] },
      });

      const result = await findProductByAkeneoId("uuid123", null);

      expect(result).toEqual(mockProduct);
      expect(mockApiRoot.products).toHaveBeenCalled();
      expect(mockApiRoot.get).toHaveBeenCalledWith({
        queryArgs: {
          filter: 'variants.attributes.akeneo_id:"uuid123"',
        },
      });
    });

    it("should find product by parent code when provided", async () => {
      const mockProduct = { id: "123" };
      mockExecute.mockResolvedValueOnce({
        body: { results: [mockProduct] },
      });

      const result = await findProductByAkeneoId("uuid123", "parent123");

      expect(result).toEqual(mockProduct);
      expect(mockApiRoot.get).toHaveBeenCalledWith({
        queryArgs: {
          filter: 'variants.attributes.akeneo_parent_code:"parent123"',
        },
      });
    });

    it("should return null when no product is found", async () => {
      mockExecute.mockResolvedValueOnce({
        body: { results: [] },
      });

      const result = await findProductByAkeneoId("uuid123", null);

      expect(result).toBeNull();
    });

    it("should throw error when API call fails", async () => {
      const error = new Error("API Error");
      mockExecute.mockRejectedValueOnce(error);

      await expect(findProductByAkeneoId("uuid123", null)).rejects.toThrow(
        "API Error"
      );
    });
  });

  describe("getProductByAkeneoIdKey", () => {
    it("should get product by key", async () => {
      const mockProduct = { id: "123" };
      mockExecute.mockResolvedValueOnce({
        body: mockProduct,
      });

      const result = await getProductByAkeneoIdKey("uuid123", null);

      expect(result).toEqual(mockProduct);
      expect(mockApiRoot.products).toHaveBeenCalled();
      expect(mockApiRoot.withKey).toHaveBeenCalledWith({ key: "uuid123" });
    });

    it("should use parentCode as key when provided", async () => {
      const mockProduct = { id: "123" };
      mockExecute.mockResolvedValueOnce({
        body: mockProduct,
      });

      const result = await getProductByAkeneoIdKey("uuid123", "parent123");

      expect(result).toEqual(mockProduct);
      expect(mockApiRoot.products).toHaveBeenCalled();
      expect(mockApiRoot.withKey).toHaveBeenCalledWith({ key: "parent123" });
    });

    it("should log error when API call fails", async () => {
      const error = new Error("API Error");
      mockExecute.mockRejectedValueOnce(error);

      const result = await getProductByAkeneoIdKey("uuid123", null);

      expect(result).toBeNull();
    });
  });

  describe("getProductByAkeneoParentCode", () => {
    it("should get product by parent code", async () => {
      const mockProduct = { id: "123" };
      mockExecute.mockResolvedValueOnce({
        body: { results: [mockProduct], total: 1 },
      });

      const result = await getProductByAkeneoParentCode("uuid123", "parent123");

      expect(result).toEqual(mockProduct);
      expect(mockApiRoot.productProjections).toHaveBeenCalled();
      expect(mockApiRoot.get).toHaveBeenCalledWith({
        queryArgs: {
          staged: true,
          where:
            'masterVariant(attributes(name="akeneo_parent_code" and value="parent123"))',
        },
      });
    });

    it("should use uuid when parent code is null", async () => {
      const mockProduct = { id: "123" };
      mockExecute.mockResolvedValueOnce({
        body: { results: [mockProduct], total: 1 },
      });

      const result = await getProductByAkeneoParentCode("uuid123", null);

      expect(result).toEqual(mockProduct);
      expect(mockApiRoot.get).toHaveBeenCalledWith({
        queryArgs: {
          staged: true,
          where:
            'masterVariant(attributes(name="akeneo_parent_code" and value="uuid123"))',
        },
      });
    });

    it("should return null when no product is found", async () => {
      mockExecute.mockResolvedValueOnce({
        body: { results: [], total: 0 },
      });

      const result = await getProductByAkeneoParentCode("uuid123", null);

      expect(result).toBeNull();
    });
  });

  describe("addProductVariant", () => {
    it("should add a product variant", async () => {
      const mockResponse = { id: "123", version: 2 };
      mockExecute.mockResolvedValueOnce({
        body: mockResponse,
      });

      const variant: CTAkeneoProductVariant = {
        sku: "SKU123",
        attributes: [],
      };

      const result = await addProductVariant("product123", 1, variant);

      expect(result).toEqual(mockResponse);
      expect(mockApiRoot.products).toHaveBeenCalled();
      expect(mockApiRoot.withId).toHaveBeenCalledWith({ ID: "product123" });
      expect(mockApiRoot.post).toHaveBeenCalledWith({
        body: {
          version: 1,
          actions: [
            {
              action: "addVariant",
              sku: "SKU123",
              attributes: [],
            },
          ],
        },
      });
    });
  });

  describe("createProduct", () => {
    it("should create a new product", async () => {
      const mockResponse = { id: "123" };
      mockExecute.mockResolvedValueOnce({
        body: mockResponse,
      });

      const product: CTAkeneoProduct = {
        name: { en: "Test Product" },
        slug: { en: "test-product" },
        description: { en: "Test Description" },
        categories: [],
        productType: { typeId: "product-type", id: "type123" },
        masterVariant: {
          sku: "SKU123",
          attributes: [],
        },
      };

      const result = await createProduct(product);

      expect(result).toEqual(mockResponse);
      expect(mockApiRoot.products).toHaveBeenCalled();
      expect(mockApiRoot.post).toHaveBeenCalledWith({
        body: product,
      });
    });
  });

  describe("updateProduct", () => {
    it("should update a product with given actions", async () => {
      const mockResponse = { id: "123", version: 2 };
      mockExecute.mockResolvedValueOnce({
        body: mockResponse,
      });

      const actions: ProductUpdateAction[] = [
        {
          action: "changeName",
          name: { en: "Updated Name" },
        },
      ];

      const result = await updateProduct("product123", 1, actions);

      expect(result).toEqual(mockResponse);
      expect(mockApiRoot.products).toHaveBeenCalled();
      expect(mockApiRoot.withId).toHaveBeenCalledWith({ ID: "product123" });
      expect(mockApiRoot.post).toHaveBeenCalledWith({
        body: {
          version: 1,
          actions,
        },
      });
    });
  });

  describe("addProductImage", () => {
    it("should add a product image", async () => {
      const mockResponse = { id: "123" };
      mockExecute.mockResolvedValueOnce({
        body: mockResponse,
      });

      const result = await addProductImage({
        productId: "product123",
        file: Buffer.from("test"),
        filename: "test.png",
        fileExtension: "png",
        sku: "SKU123",
      });

      expect(result.body).toEqual(mockResponse);
      expect(mockApiRoot.products).toHaveBeenCalled();
      expect(mockApiRoot.withId).toHaveBeenCalledWith({ ID: "product123" });
      expect(mockApiRoot.images).toHaveBeenCalled();
      expect(mockApiRoot.post).toHaveBeenCalledWith({
        body: Buffer.from("test"),
        queryArgs: {
          filename: "test.png",
          sku: "SKU123",
        },
        headers: {
          "Content-Type": "image/png",
        },
      });
    });

    it("should use default png extension when fileExtension is not provided", async () => {
      const mockResponse = { id: "123" };
      mockExecute.mockResolvedValueOnce({
        body: mockResponse,
      });

      const result = await addProductImage({
        productId: "product123",
        file: Buffer.from("test"),
        filename: "test.png",
        fileExtension: "png",
        sku: "SKU123",
      });

      expect(result.body).toEqual(mockResponse);
      expect(mockApiRoot.post).toHaveBeenCalledWith({
        body: Buffer.from("test"),
        queryArgs: {
          filename: "test.png",
          sku: "SKU123",
        },
        headers: {
          "Content-Type": "image/png",
        },
      });
    });

    it("should handle errors when adding product image", async () => {
      const error = new Error("Upload failed");
      mockExecute.mockRejectedValueOnce(error);

      const imageData = {
        productId: "product123",
        file: Buffer.from("test"),
        filename: "test.png",
        fileExtension: "png",
      };

      await expect(addProductImage(imageData)).rejects.toThrow("Upload failed");
    });
  });
});
