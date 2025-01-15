import { createActor, toPromise } from "xstate";
import { mapForAddVariant } from "./mapForAddVariant";
import { AkeneoProduct, AkeneoProductModel } from "../../types/akeneo.types";
import { Config } from "../../types/config.types";
import * as productMapper from "../../mappers/product";

jest.mock("../../mappers/product", () => ({
  mapProductVariant: jest.fn(),
}));

describe("mapForAddVariant actor", () => {
  const mockConfig: Config = {
    familyMapping: {
      testFamily: {
        akeneoSkuField: "sku",
        commercetoolsProductTypeId: "test-product-type",
        akeneoImagesAttribute: "images",
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
    },
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

  it("should map product data to addVariant action", async () => {
    const mockVariantPayload = {
      sku: "test-sku",
      key: "test-key",
      attributes: [],
      prices: [],
    };

    (productMapper.mapProductVariant as jest.Mock).mockReturnValue(
      mockVariantPayload
    );

    const actor = createActor(mapForAddVariant, {
      input: {
        productData: mockProductData,
        config: mockConfig,
        sku: "test-sku",
      },
    });

    actor.start();
    const result = await toPromise(actor);

    expect(productMapper.mapProductVariant).toHaveBeenCalledWith({
      akeneoProduct: mockProductData,
      sku: "test-sku",
      config: mockConfig,
    });
    expect(result).toEqual([
      {
        action: "addVariant",
        ...mockVariantPayload,
      },
    ]);
  });

  it("should handle empty variant payload", async () => {
    const mockEmptyVariantPayload = {};

    (productMapper.mapProductVariant as jest.Mock).mockReturnValue(
      mockEmptyVariantPayload
    );

    const actor = createActor(mapForAddVariant, {
      input: {
        productData: mockProductData,
        config: mockConfig,
        sku: "test-sku",
      },
    });

    actor.start();
    const result = await toPromise(actor);

    expect(productMapper.mapProductVariant).toHaveBeenCalledWith({
      akeneoProduct: mockProductData,
      sku: "test-sku",
      config: mockConfig,
    });
    expect(result).toEqual([
      {
        action: "addVariant",
        ...mockEmptyVariantPayload,
      },
    ]);
  });

  it("should handle product data with null parent", async () => {
    const productDataWithNullParent = {
      ...mockProductData,
      parent: null,
      sku: "test-sku",
      config: mockConfig,
    };

    const mockVariantPayload = {
      sku: "test-sku",
      attributes: [],
    };

    (productMapper.mapProductVariant as jest.Mock).mockReturnValue(
      mockVariantPayload
    );

    const actor = createActor(mapForAddVariant, {
      input: {
        productData: productDataWithNullParent,
        config: mockConfig,
        sku: "test-sku",
      },
    });

    actor.start();
    const result = await toPromise(actor);

    expect(productMapper.mapProductVariant).toHaveBeenCalledWith({
      akeneoProduct: productDataWithNullParent,
      sku: "test-sku",
      config: mockConfig,
    });
    expect(result).toEqual([
      {
        action: "addVariant",
        ...mockVariantPayload,
      },
    ]);
  });
});
