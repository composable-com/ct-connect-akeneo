import { createActor, toPromise } from "xstate";
import { syncProductImages } from "./syncProductImages";
import * as productsApi from "../commercetools/api/products";
import { AkeneoProduct, AkeneoProductModel } from "../types/akeneo.types";
import { Config } from "../types/config.types";
import { Product } from "@commercetools/platform-sdk";
import { getAkeneoClient } from "../akeneo/client/client";

// Mock the dependencies
jest.mock("../commercetools/api/products");
jest.mock("../akeneo/client/client");
jest.mock("../mappers/images", () => ({
  mapImages: jest.fn(),
}));

describe("syncProductImages actor", () => {
  const mockConfig: Config = {
    familyMapping: {
      testFamily: {
        akeneoSkuField: "sku",
        commercetoolsProductTypeId: "test-type",
        akeneoImagesAttribute: "images",
        coreAttributeMapping: {},
        attributeMapping: {},
      },
    },
    localeMapping: {},
    categoryMapping: {},
    akeneoScope: "scope",
  };

  const mockParent: AkeneoProductModel = {
    code: "parent-code",
    family: "testFamily",
    family_variant: "variant",
    parent: null,
    categories: [],
    created: "",
    updated: "",
    groups: [],
    values: {},
  };

  const mockIncomingProduct: AkeneoProduct = {
    uuid: "test-uuid",
    identifier: "test-identifier",
    family: "testFamily",
    values: {},
    enabled: true,
    categories: [],
    created: "",
    updated: "",
    groups: [],
    parent: mockParent.code,
  };

  const mockProductSyncedData: Product = {
    id: "test-product-id",
    version: 1,
    masterData: {
      staged: {
        masterVariant: {
          id: 1,
          sku: "test-sku",
          images: [],
        },
        variants: [],
        name: { en: "Test Product" },
        slug: { en: "test-product" },
        description: { en: "Test Description" },
      },
      current: {
        masterVariant: {
          id: 1,
          sku: "test-sku",
          images: [],
        },
        variants: [],
        name: { en: "Test Product" },
        slug: { en: "test-product" },
        description: { en: "Test Description" },
      },
      published: true,
      hasStagedChanges: false,
    },
    key: "test-key",
    productType: {
      typeId: "product-type",
      id: "test-type",
    },
    createdAt: new Date().toISOString(),
    lastModifiedAt: new Date().toISOString(),
  } as unknown as Product;

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should return success true when there are no images to sync", async () => {
    require("../mappers/images").mapImages.mockReturnValue([]);

    const actor = createActor(syncProductImages, {
      input: {
        incomingProduct: mockIncomingProduct,
        productSyncedData: mockProductSyncedData,
        config: mockConfig,
        sku: "test-sku",
      },
    });
    actor.start();

    const result = await toPromise(actor);
    expect(result).toEqual({ success: true });
  });

  it("should sync new images successfully", async () => {
    const mockImageUrls = [
      { assetFamily: "family1", assetsFileName: "image1" },
    ];
    require("../mappers/images").mapImages.mockReturnValue(mockImageUrls);

    const mockAkeneoClient = {
      getProductImageUrl: jest
        .fn()
        .mockResolvedValue("http://example.com/image1.jpeg"),
      getFileBufferFromUrl: jest.fn().mockResolvedValue(Buffer.from("test")),
    };
    (getAkeneoClient as jest.Mock).mockResolvedValue(mockAkeneoClient);
    (productsApi.addProductImage as jest.Mock).mockResolvedValue({});

    const actor = createActor(syncProductImages, {
      input: {
        incomingProduct: mockIncomingProduct,
        productSyncedData: mockProductSyncedData,
        config: mockConfig,
        sku: "test-sku",
      },
    });
    actor.start();

    const result = await toPromise(actor);
    expect(result).toEqual({ success: true });
    expect(productsApi.addProductImage).toHaveBeenCalledWith({
      productId: "test-product-id",
      file: expect.any(Buffer),
      filename: "image1",
      fileExtension: "jpeg",
      sku: "test-sku",
    });
  });

  it("should skip existing images", async () => {
    const mockImageUrls = [
      { assetFamily: "family1", assetsFileName: "existing" },
    ];
    require("../mappers/images").mapImages.mockReturnValue(mockImageUrls);

    const productWithExistingImage: Product = {
      ...mockProductSyncedData,
      masterData: {
        ...mockProductSyncedData.masterData,
        staged: {
          ...mockProductSyncedData.masterData.staged,
          masterVariant: {
            id: 1,
            sku: "test-sku",
            images: [
              {
                url: "http://example.com/existing-image.jpg",
                dimensions: {
                  h: 100,
                  w: 100,
                },
              },
            ],
          },
          variants: [],
        },
        current: {
          ...mockProductSyncedData.masterData.current,
          masterVariant: {
            id: 1,
            sku: "test-sku",
            images: [
              {
                url: "http://example.com/existing-imagel.jpg",
                dimensions: {
                  h: 100,
                  w: 100,
                },
              },
            ],
          },
          variants: [],
        },
      },
    };

    const actor = createActor(syncProductImages, {
      input: {
        incomingProduct: mockIncomingProduct,
        productSyncedData: productWithExistingImage,
        config: mockConfig,
        sku: "test-sku",
      },
    });
    actor.start();

    const result = await toPromise(actor);
    expect(result).toEqual({ success: true });
    expect(productsApi.addProductImage).not.toHaveBeenCalled();
  });

  it("should handle errors and return success false", async () => {
    require("../mappers/images").mapImages.mockImplementation(() => {
      throw new Error("Test error");
    });

    const actor = createActor(syncProductImages, {
      input: {
        incomingProduct: mockIncomingProduct,
        productSyncedData: mockProductSyncedData,
        config: mockConfig,
        sku: "test-sku",
      },
    });
    actor.start();

    const result = await toPromise(actor);
    expect(result).toEqual({ success: false });
  });
});
