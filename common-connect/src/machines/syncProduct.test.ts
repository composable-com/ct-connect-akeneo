import { createActor, toPromise } from "xstate";
import { syncProduct } from "./syncProduct";
import * as productsApi from "../commercetools/api/products";
import {
  Product,
  ProductProjection,
  ProductUpdateAction,
} from "@commercetools/platform-sdk";
import { CTAkeneoProduct } from "../commercetools/api/products";

// Mock the commercetools API
jest.mock("../commercetools/api/products", () => ({
  createProduct: jest.fn(),
  updateProduct: jest.fn(),
  getProduct: jest.fn(),
}));

// Mock the akeneo client
jest.mock("../akeneo/client/client", () => ({
  getAkeneoClient: jest.fn().mockResolvedValue({
    getProductImageUrl: jest.fn(),
    getFileBufferFromUrl: jest.fn(),
  }),
}));

describe("syncProduct actor", () => {
  const mockExistingProduct = {
    id: "test-id",
    version: 1,
    published: false,
    createdAt: "2023-01-01T00:00:00.000Z",
    lastModifiedAt: "2023-01-01T00:00:00.000Z",
    productType: { typeId: "product-type", id: "test-type" },
    name: { en: "Test Product" },
    slug: { en: "test-product" },
    masterVariant: {
      id: 1,
      sku: "test-sku",
      attributes: [],
    },
  } as unknown as ProductProjection;

  const mockProductPayload: CTAkeneoProduct = {
    name: { en: "Test Product" },
    description: { en: "Test Description" },
    slug: { en: "test-product" },
    productType: { typeId: "product-type", id: "test-type" },
    masterVariant: {
      sku: "test-sku",
      attributes: [],
    },
    categories: [],
  };

  const mockUpdateActions: ProductUpdateAction[] = [
    { action: "changeName", name: { en: "Updated Name" } },
  ];

  beforeEach(() => {
    jest.clearAllMocks();
    process.env.SET_PUBLISHED_TO_MODIFIED = "false";
  });

  it("should update an existing product when update actions are provided", async () => {
    const mockUpdatedProduct = {
      id: "test-id",
      version: 2,
      createdAt: "2023-01-01T00:00:00.000Z",
      lastModifiedAt: "2023-01-01T00:00:00.000Z",
      productType: { typeId: "product-type", id: "test-type" },
      masterData: {
        current: {
          name: { en: "Updated Name" },
          categories: [],
          slug: { en: "test-product" },
          masterVariant: {
            id: 1,
            sku: "test-sku",
            attributes: [],
          },
        },
        staged: {
          name: { en: "Updated Name" },
          categories: [],
          slug: { en: "test-product" },
          masterVariant: {
            id: 1,
            sku: "test-sku",
            attributes: [],
          },
        },
      },
    } as unknown as Product;

    (productsApi.updateProduct as jest.Mock).mockResolvedValueOnce(
      mockUpdatedProduct
    );

    const actor = createActor(syncProduct, {
      input: {
        productPayload: undefined,
        existingProduct: mockExistingProduct,
        updateActions: mockUpdateActions,
      },
    });
    actor.start();

    const result = await toPromise(actor);

    expect(productsApi.updateProduct).toHaveBeenCalledWith(
      "test-id",
      1,
      mockUpdateActions
    );
    expect(result).toEqual(mockUpdatedProduct);
  });

  it("should create a new product when no update actions but product payload exists", async () => {
    const mockCreatedProduct = {
      id: "new-id",
      version: 1,
      createdAt: "2023-01-01T00:00:00.000Z",
      lastModifiedAt: "2023-01-01T00:00:00.000Z",
      productType: { typeId: "product-type", id: "test-type" },
      masterData: {
        current: {
          name: { en: "Test Product" },
          categories: [],
          slug: { en: "test-product" },
          masterVariant: {
            id: 1,
            sku: "test-sku",
            attributes: [],
          },
        },
        staged: {
          name: { en: "Test Product" },
          categories: [],
          slug: { en: "test-product" },
          masterVariant: {
            id: 1,
            sku: "test-sku",
            attributes: [],
          },
        },
      },
    } as unknown as Product;

    (productsApi.createProduct as jest.Mock).mockResolvedValueOnce(
      mockCreatedProduct
    );

    const actor = createActor(syncProduct, {
      input: {
        productPayload: mockProductPayload,
        existingProduct: mockExistingProduct,
        updateActions: [],
      },
    });
    actor.start();

    const result = await toPromise(actor);

    expect(productsApi.createProduct).toHaveBeenCalledWith(mockProductPayload);
    expect(result).toEqual(mockCreatedProduct);
  });

  it("should call the getProduct function when no update actions and no product payload", async () => {
    const actor = createActor(syncProduct, {
      input: {
        productPayload: undefined,
        existingProduct: mockExistingProduct,
        updateActions: [],
      },
    });
    actor.start();

    await toPromise(actor);

    expect(productsApi.getProduct).toHaveBeenCalled();
    expect(productsApi.createProduct).not.toHaveBeenCalled();
    expect(productsApi.updateProduct).not.toHaveBeenCalled();
  });

  it("should include publish action when SET_PUBLISHED_TO_MODIFIED is false and product is published", async () => {
    const publishedProduct = { ...mockExistingProduct, published: true };
    const mockUpdatedProduct = {
      id: "test-id",
      version: 2,
      createdAt: "2023-01-01T00:00:00.000Z",
      lastModifiedAt: "2023-01-01T00:00:00.000Z",
      productType: { typeId: "product-type", id: "test-type" },
      masterData: {
        current: {
          name: { en: "Updated Name" },
          categories: [],
          slug: { en: "test-product" },
          masterVariant: {
            id: 1,
            sku: "test-sku",
            attributes: [],
          },
        },
        staged: {
          name: { en: "Updated Name" },
          categories: [],
          slug: { en: "test-product" },
          masterVariant: {
            id: 1,
            sku: "test-sku",
            attributes: [],
          },
        },
      },
    } as unknown as Product;

    (productsApi.updateProduct as jest.Mock).mockResolvedValueOnce(
      mockUpdatedProduct
    );

    const actor = createActor(syncProduct, {
      input: {
        productPayload: undefined,
        existingProduct: publishedProduct,
        updateActions: mockUpdateActions,
      },
    });
    actor.start();

    await toPromise(actor);

    expect(productsApi.updateProduct).toHaveBeenCalledWith("test-id", 1, [
      ...mockUpdateActions,
      { action: "publish" },
    ]);
  });

  it("should handle errors during product sync", async () => {
    const error = new Error("Sync failed");
    (productsApi.updateProduct as jest.Mock).mockRejectedValueOnce(error);

    const actor = createActor(syncProduct, {
      input: {
        productPayload: undefined,
        existingProduct: mockExistingProduct,
        updateActions: mockUpdateActions,
      },
    });
    actor.start();

    await expect(toPromise(actor)).rejects.toThrow("Sync failed");
  });
});
