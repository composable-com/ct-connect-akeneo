import { createActor, toPromise } from "xstate";
import { mapForCreation } from "./mapForCreation";
import * as productMapper from "../../mappers/product";
import { AkeneoProduct, AkeneoProductModel } from "../../types/akeneo.types";
import { Config } from "../../types/config.types";
import { CTAkeneoProduct } from "../../commercetools/api/products";

// Mock the product mapper
jest.mock("../../mappers/product", () => ({
  mapProduct: jest.fn(),
}));

describe("mapForCreation actor", () => {
  const mockConfig: Config = {
    familyMapping: {
      testFamily: {
        akeneoSkuField: "sku",
        commercetoolsProductTypeId: "test-product-type-id",
        akeneoImagesAttribute: "images",
        coreAttributeMapping: {},
        attributeMapping: {},
      },
    },
    localeMapping: {},
    categoryMapping: {},
    akeneoScope: "scope",
  };

  const mockProductData = {
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
  } as Omit<AkeneoProduct, "parent"> & { parent: AkeneoProductModel };

  const mockMappedProduct: CTAkeneoProduct = {
    productType: {
      id: "test-product-type-id",
      typeId: "product-type",
    },
    name: {
      "en-US": "Test Product",
    },
    slug: {
      "en-US": "test-product",
    },
    description: {
      "en-US": "Test product description",
    },
    masterVariant: {
      sku: "test-sku",
      attributes: [
        {
          name: "akeneo_id",
          value: "test-uuid",
        },
      ],
    },
    categories: [],
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should map product data correctly", async () => {
    (productMapper.mapProduct as jest.Mock).mockResolvedValueOnce(
      mockMappedProduct
    );

    const actor = createActor(mapForCreation, {
      input: {
        productData: mockProductData,
        config: mockConfig,
        sku: "test-sku",
      },
    });

    actor.start();
    const result = await toPromise(actor);

    expect(productMapper.mapProduct).toHaveBeenCalledWith(
      mockProductData,
      "test-sku",
      mockConfig
    );
    expect(result).toEqual(mockMappedProduct);
  });

  it("should propagate errors from mapProduct", async () => {
    const mockError = new Error("Mapping error");
    (productMapper.mapProduct as jest.Mock).mockRejectedValueOnce(mockError);

    const actor = createActor(mapForCreation, {
      input: {
        productData: mockProductData,
        config: mockConfig,
        sku: "test-sku",
      },
    });

    actor.start();
    await expect(toPromise(actor)).rejects.toThrow(mockError);
  });
});
