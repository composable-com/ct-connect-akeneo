import { createActor, toPromise } from "xstate";
import { checkExistence } from "./checkExistance";
import * as productsApi from "../../commercetools/api/products";
import { AkeneoProduct, AkeneoProductModel } from "../../types/akeneo.types";
import { Config } from "../../types/config.types";
import { ProductProjection } from "@commercetools/platform-sdk";

// Mock the commercetools API
jest.mock("../../commercetools/api/products", () => ({
  getProductByAkeneoParentCode: jest.fn(),
}));
describe("checkExistence actor", () => {
  const mockConfig: Config = {
    familyMapping: {
      testFamily: {
        akeneoSkuField: "sku",
        commercetoolsProductTypeId: "",
        akeneoImagesAttribute: "",
        coreAttributeMapping: {},
        attributeMapping: {},
      },
    },
    localeMapping: {},
    categoryMapping: {},
    akeneoScope: "scope",
  };

  const mockProductData: Omit<AkeneoProduct, "parent"> & {
    parent: AkeneoProductModel;
  } = {
    uuid: "test-uuid",
    parent: {
      code: "parent-code",
      categories: [],
      groups: [],
      created: "2023-01-01",
      updated: "2023-01-01",
      family: "testFamily",
      family_variant: "testFamilyVariant",
      parent: null,
      values: {},
    } as AkeneoProductModel,
    identifier: "test-identifier",
    categories: [],
    groups: [],
    created: "2023-01-01",
    updated: "2023-01-01",
    family: "testFamily",
    values: {
      sku: [
        {
          data: "test-sku",
          locale: null,
          scope: null,
          attribute_type: "",
        },
      ],
    },
    enabled: true,
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should return productExists: false when product does not exist", async () => {
    (
      productsApi.getProductByAkeneoParentCode as jest.Mock
    ).mockResolvedValueOnce(null);

    const actor = createActor(checkExistence, {
      input: {
        productData: mockProductData,
        config: mockConfig,
      },
    });

    actor.start();

    const result = await toPromise(actor);

    expect(result).toEqual({ productExists: false, sku: "test-sku" });
  });
  it("should return skipUpdate: true when product exists but is disabled", async () => {
    const mockExistingProduct = {
      id: "test-id",
      version: 1,
      createdAt: "2023-01-01",
      lastModifiedAt: "2023-01-01",
      variants: [],
      productType: {
        id: "test-product-type-id",
        typeId: "product-type",
      },
      name: {
        en: "test-name",
        fr: "test-name",
      },
      slug: {
        en: "test-slug",
        fr: "test-slug",
      },
      categories: [],
      categoryOrderHints: {},
      masterVariant: {
        id: 1,
        attributes: [],
      },
    } as ProductProjection;

    (
      productsApi.getProductByAkeneoParentCode as jest.Mock
    ).mockResolvedValueOnce(mockExistingProduct);

    const actor = createActor(checkExistence, {
      input: {
        productData: { ...mockProductData, enabled: false },
        config: mockConfig,
      },
    });
    actor.start();

    const result = await toPromise(actor);

    expect(result).toEqual({
      skipUpdate: true,
      productExists: true,
    });
  });

  it("should detect existing master variant", async () => {
    const mockExistingProduct = {
      masterVariant: {
        id: 1,
        attributes: [{ name: "akeneo_id", value: "test-uuid" }],
      },
      variants: [],
    } as unknown as ProductProjection;

    (
      productsApi.getProductByAkeneoParentCode as jest.Mock
    ).mockResolvedValueOnce(mockExistingProduct);

    const actor = createActor(checkExistence, {
      input: {
        productData: mockProductData,
        config: mockConfig,
      },
    });
    actor.start();

    const result = await toPromise(actor);

    expect(result).toEqual({
      productExists: true,
      variantExists: true,
      variantId: 1,
      existingProduct: mockExistingProduct,
      sku: "test-sku",
      skipUpdate: false,
    });
  });

  it("should detect existing variant", async () => {
    const mockExistingProduct = {
      id: "product-id",
      version: 1,
      createdAt: new Date(),
      lastModifiedAt: new Date(),
      masterVariant: {
        id: 1,
        attributes: [],
      },
      variants: [
        {
          id: 2,
          attributes: [{ name: "akeneo_id", value: "test-uuid" }],
        },
      ],
    } as unknown as ProductProjection;

    (
      productsApi.getProductByAkeneoParentCode as jest.Mock
    ).mockResolvedValueOnce(mockExistingProduct);

    const actor = createActor(checkExistence, {
      input: {
        productData: mockProductData,
        config: mockConfig,
      },
    });
    actor.start();

    const result = await toPromise(actor);
    expect(result).toEqual({
      productExists: true,
      variantExists: true,
      variantId: 2,
      existingProduct: mockExistingProduct,
      sku: "test-sku",
      skipUpdate: false,
    });
  });

  it("should use identifier as SKU when family attribute is not found", async () => {
    const mockExistingProduct = {
      masterVariant: { attributes: [] },
      variants: [],
    } as unknown as ProductProjection;

    (
      productsApi.getProductByAkeneoParentCode as jest.Mock
    ).mockResolvedValueOnce(mockExistingProduct);

    const actor = createActor(checkExistence, {
      input: {
        productData: {
          ...mockProductData,
          values: {}, // No SKU value
        },
        config: mockConfig,
      },
    });
    actor.start();

    const result = await toPromise(actor);

    expect(result).toEqual({
      productExists: true,
      variantExists: false,
      existingProduct: mockExistingProduct,
      sku: "test-identifier",
      skipUpdate: false,
    });
  });
});
