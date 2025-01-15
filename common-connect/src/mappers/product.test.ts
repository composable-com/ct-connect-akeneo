import { AkeneoProduct, AkeneoProductModel } from "../types/akeneo.types";
import { Config } from "../types/config.types";
import { mapProduct, mapProductModel, mapProductVariant } from "./product";

describe("Product Mappers", () => {
  const mockConfig: Config = {
    familyMapping: {
      testFamily: {
        commercetoolsProductTypeId: "test-product-type-id",
        attributeMapping: {},
        akeneoImagesAttribute: "",
        coreAttributeMapping: {},
      },
    },
    categoryMapping: {},
    localeMapping: {},
    akeneoScope: "",
  };

  const mockAkeneoProductModel: AkeneoProductModel = {
    code: "test-model",
    family: "testFamily",
    categories: ["category1"],
    values: {
      name: [
        {
          locale: "en-US",
          data: "Test Product Model",
          scope: null,
          attribute_type: "text",
        },
      ],
    },
    family_variant: "",
    groups: [],
    parent: null,
    created: "",
    updated: "",
  };

  const mockAkeneoProduct: AkeneoProduct & {
    parent: AkeneoProductModel | null;
  } = {
    uuid: "test-uuid",
    identifier: "test-sku",
    family: "testFamily",
    categories: ["category1"],
    enabled: true,
    groups: [],
    created: "2021-01-01T00:00:00Z",
    updated: "2021-01-01T00:00:00Z",
    values: {
      name: [
        {
          locale: "en-US",
          data: "Test Product",
          scope: null,
          attribute_type: "text",
        },
      ],
    },
    parent: null,
  };

  describe("mapProductModel", () => {
    it("should map an Akeneo product model to CT format", () => {
      const result = mapProductModel(mockAkeneoProductModel, mockConfig);

      expect(result).toHaveProperty("common");
      expect(result).toHaveProperty("attributes");
      expect(result).toHaveProperty("categories");
      expect(Array.isArray(result.categories)).toBe(true);
    });
  });

  describe("mapProduct", () => {
    it("should map an Akeneo product to CT format", () => {
      const result = mapProduct(mockAkeneoProduct, "test-sku", mockConfig);

      expect(result).toHaveProperty("masterVariant");
      expect(result.masterVariant.sku).toBe(mockAkeneoProduct.identifier);
      expect(result.masterVariant.attributes).toContainEqual({
        name: "akeneo_id",
        value: mockAkeneoProduct.uuid,
      });
      expect(result.masterVariant.attributes).toContainEqual({
        name: "akeneo_parent_code",
        value: mockAkeneoProduct.uuid, // Since parent is null, it should use its own uuid
      });
      expect(result.productType).toEqual({
        id: mockConfig.familyMapping.testFamily.commercetoolsProductTypeId,
        typeId: "product-type",
      });
    });

    it("should throw error for undefined family", () => {
      const invalidProduct = {
        ...mockAkeneoProduct,
        family: "nonexistentFamily",
      };

      expect(() => mapProduct(invalidProduct, "test-sku", mockConfig)).toThrow(
        'Family "nonexistentFamily" is not defined in the config.'
      );
    });

    it("should map product with parent correctly", () => {
      const productWithParent = {
        ...mockAkeneoProduct,
        parent: mockAkeneoProductModel,
      };

      const result = mapProduct(productWithParent, "test-sku", mockConfig);

      expect(result.masterVariant.attributes).toContainEqual({
        name: "akeneo_parent_code",
        value: mockAkeneoProductModel.code,
      });
    });
  });

  describe("mapProductVariant", () => {
    it("should map an Akeneo product to CT variant format", () => {
      const result = mapProductVariant({
        akeneoProduct: mockAkeneoProduct,
        config: mockConfig,
      });

      expect(result.sku).toBe(mockAkeneoProduct.identifier);
      expect(result.attributes).toContainEqual({
        name: "akeneo_id",
        value: mockAkeneoProduct.uuid,
      });
      expect(result.attributes).toContainEqual({
        name: "akeneo_parent_code",
        value: mockAkeneoProduct.uuid,
      });
    });

    it("should throw error for undefined family", () => {
      const invalidProduct = {
        ...mockAkeneoProduct,
        family: "nonexistentFamily",
      };

      expect(() =>
        mapProductVariant({
          akeneoProduct: invalidProduct,
          config: mockConfig,
        })
      ).toThrow('Family "nonexistentFamily" is not defined in the config.');
    });

    it("should map variant with parent correctly", () => {
      const variantWithParent = {
        ...mockAkeneoProduct,
        parent: mockAkeneoProductModel,
      };

      const result = mapProductVariant({
        akeneoProduct: variantWithParent,
        config: mockConfig,
      });

      expect(result.attributes).toContainEqual({
        name: "akeneo_parent_code",
        value: mockAkeneoProductModel.code,
      });
    });
  });
});
