import { createActor, toPromise } from "xstate";
import { mapForUpdateVariant } from "./mapForUpdateVariant";
import { AkeneoProduct } from "../../types/akeneo.types";
import { Config } from "../../types/config.types";
import { ProductProjection, ProductUpdateAction } from "@commercetools/platform-sdk";
import * as attributeMappers from "../../mappers/attributes";

jest.mock("../../mappers/attributes", () => ({
  mapAttributesWithActions: jest.fn(),
}));

describe("mapForUpdateVariant actor", () => {
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

  const mockProductData: AkeneoProduct = {
    uuid: "test-uuid",
    identifier: "test-identifier",
    categories: [],
    groups: [],
    created: "2023-01-01",
    updated: "2023-01-01",
    family: "testFamily",
    parent: null,
    values: {
      name: [
        {
          data: "Test Product",
          locale: "en",
          scope: null,
          attribute_type: "pim_catalog_text",
        },
      ],
    },
    enabled: true,
  };

  const mockExistingProduct: ProductProjection = {
    id: "test-id",
    version: 1,
    createdAt: "2023-01-01",
    lastModifiedAt: "2023-01-01",
    masterVariant: {
      id: 1,
      sku: "master-sku",
      attributes: [],
    },
    variants: [
      {
        id: 2,
        sku: "variant-sku",
        attributes: [],
      },
    ],
    productType: {
      typeId: "product-type",
      id: "test-type",
    },
    name: { en: "Test Product" },
    slug: { en: "test-product" },
    categories: [],
    categoryOrderHints: {},
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should return empty array when variant is not found", async () => {
    const actor = createActor(mapForUpdateVariant, {
      input: {
        productData: mockProductData,
        config: mockConfig,
        variantId: 999, // Non-existent variant ID
        existingProduct: mockExistingProduct,
      },
    });

    actor.start();
    const result = await toPromise(actor);

    expect(result).toEqual([]);
  });

  it("should map attributes for master variant", async () => {
    const mockActions: ProductUpdateAction[] = [
      {
        action: "setAttribute",
        name: "name",
        value: "Test Product",
      },
    ];

    (attributeMappers.mapAttributesWithActions as jest.Mock).mockReturnValue(mockActions);

    const actor = createActor(mapForUpdateVariant, {
      input: {
        productData: mockProductData,
        config: mockConfig,
        variantId: 1,
        existingProduct: mockExistingProduct,
      },
    });

    actor.start();
    const result = await toPromise(actor);

    expect(attributeMappers.mapAttributesWithActions).toHaveBeenCalledWith(
      mockProductData.values,
      mockConfig,
      mockExistingProduct,
      mockExistingProduct.masterVariant,
      mockConfig.familyMapping[mockProductData.family]
    );

    expect(result).toEqual(
      mockActions.map(action => ({
        ...action,
        variantId: 1,
      }))
    );
  });

  it("should map attributes for specific variant", async () => {
    const mockActions: ProductUpdateAction[] = [
      {
        action: "setAttribute",
        name: "size",
        value: "L",
      },
    ];

    (attributeMappers.mapAttributesWithActions as jest.Mock).mockReturnValue(mockActions);

    const actor = createActor(mapForUpdateVariant, {
      input: {
        productData: mockProductData,
        config: mockConfig,
        variantId: 2,
        existingProduct: mockExistingProduct,
      },
    });

    actor.start();
    const result = await toPromise(actor);

    expect(attributeMappers.mapAttributesWithActions).toHaveBeenCalledWith(
      mockProductData.values,
      mockConfig,
      mockExistingProduct,
      mockExistingProduct.variants[0],
      mockConfig.familyMapping[mockProductData.family]
    );

    expect(result).toEqual(
      mockActions.map(action => ({
        ...action,
        variantId: 2,
      }))
    );
  });
}); 