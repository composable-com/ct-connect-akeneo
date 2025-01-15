import {
  Attribute,
  LocalizedString,
  ProductProjection,
  ProductVariant,
} from "@commercetools/platform-sdk";
import { Value, Values } from "../types/akeneo.types";
import { Config, FamilyConfig } from "../types/config.types";
import {
  mapAttributes,
  mapAttributesWithActions,
  CTAkeneoAttributes,
  CTAkeneoCommonFields,
} from "./attributes";

describe("attributes mapper", () => {
  const mockConfig: Config = {
    akeneoScope: "ecommerce",
    localeMapping: {
      en_US: "en-US",
      es_ES: "es-ES",
    },
    familyMapping: {},
    categoryMapping: {},
  };

  const mockFamilyConfig: FamilyConfig = {
    coreAttributeMapping: {
      name: "name",
      description: "description",
      url_key: "slug",
    },
    attributeMapping: {
      color: "color",
      size: "size",
      price: "price",
      is_active: {
        commercetoolsAttribute: "isActive",
        true: "true",
        false: "false",
      },
    },
    commercetoolsProductTypeId: "",
    akeneoImagesAttribute: "",
  };

  describe("mapAttributes", () => {
    it("should map common and specific attributes correctly", () => {
      const mockValues: Values = {
        name: [
          {
            locale: "en_US",
            scope: "ecommerce",
            data: "Test Product",
            attribute_type: "pim_catalog_text",
          },
          {
            locale: "es_ES",
            scope: "ecommerce",
            data: "Producto de Prueba",
            attribute_type: "pim_catalog_text",
          },
        ],
        color: [
          {
            locale: null,
            scope: "ecommerce",
            data: "red",
            attribute_type: "pim_catalog_text",
          },
        ],
        is_active: [
          {
            locale: null,
            scope: "ecommerce",
            data: "true",
            attribute_type: "pim_catalog_boolean",
          },
        ],
      };

      const result = mapAttributes(mockValues, mockConfig, mockFamilyConfig);

      expect(result.common.name).toEqual({
        "en-US": "Test Product",
        "es-ES": "Producto de Prueba",
      });

      expect(result.attributes).toContainEqual({
        name: "color",
        value: "red",
      });

      expect(result.attributes).toContainEqual({
        name: "isActive",
        value: true,
      });
    });

    it("should handle empty values", () => {
      const emptyValues: Values = {};
      const result = mapAttributes(emptyValues, mockConfig, mockFamilyConfig);

      expect(result.common).toEqual({});
      expect(result.attributes).toEqual([]);
    });

    it("should filter out invalid locales", () => {
      const valuesWithInvalidLocale: Values = {
        name: [
          {
            locale: "fr_FR", // Invalid locale not in config
            scope: "ecommerce",
            data: "Test Product",
            attribute_type: "pim_catalog_text",
          },
        ],
      };

      const result = mapAttributes(
        valuesWithInvalidLocale,
        mockConfig,
        mockFamilyConfig
      );

      expect(result.common.name).toEqual({});
    });
  });
  describe("mapAttributesWithActions", () => {
    const mockExistingProduct = {
      name: { "en-US": "Old Name" },
      description: { "en-US": "Old Description" },
      slug: { "en-US": "old-slug" },
      id: "existing-product-id",
      version: 1,
      createdAt: new Date().toISOString(),
      lastModifiedAt: new Date().toISOString(),
      masterVariant: {
        id: 1,
        attributes: [],
      },
      variants: [],
      productType: { id: "product-type-id", typeId: "product-type" },
      categories: [],
    } as ProductProjection;

    const mockVariant = {
      id: 1,
      attributes: [{ name: "color", value: "blue" }],
    } as ProductVariant;

    it("should generate update actions for changed attributes", () => {
      const mockValues: Values = {
        name: [
          {
            locale: "en_US",
            scope: "ecommerce",
            data: "New Name",
            attribute_type: "pim_catalog_text",
          },
        ],
        color: [
          {
            locale: null,
            scope: "ecommerce",
            data: "red",
            attribute_type: "pim_catalog_text",
          },
        ],
      };

      const actions = mapAttributesWithActions(
        mockValues,
        mockConfig,
        mockExistingProduct,
        mockVariant,
        mockFamilyConfig
      );

      expect(actions).toContainEqual({
        action: "changeName",
        name: { "en-US": "New Name" },
        value: undefined,
      });

      expect(actions).toContainEqual({
        action: "setAttribute",
        name: "color",
        value: "red",
      });
    });

    it("should not generate actions for unchanged attributes", () => {
      const mockValues: Values = {
        color: [
          {
            locale: null,
            scope: "ecommerce",
            data: "blue",
            attribute_type: "pim_catalog_text",
          },
        ],
      };

      const actions = mapAttributesWithActions(
        mockValues,
        mockConfig,
        mockExistingProduct,
        mockVariant,
        mockFamilyConfig
      );

      expect(actions).toHaveLength(0);
    });
  });

  describe("attribute type parsing", () => {
    it("should correctly parse boolean attributes", () => {
      const mockValues: Values = {
        is_active: [
          {
            locale: null,
            scope: "ecommerce",
            data: "true",
            attribute_type: "pim_catalog_boolean",
          },
        ],
      };

      const result = mapAttributes(mockValues, mockConfig, mockFamilyConfig);
      const isActiveAttr = result.attributes.find(
        (attr) => attr.name === "isActive"
      );
      expect(isActiveAttr?.value).toBe(true);
    });

    it("should correctly parse number attributes", () => {
      const mockValues: Values = {
        price: [
          {
            locale: null,
            scope: "ecommerce",
            data: "99.99",
            attribute_type: "pim_catalog_number",
          },
        ],
      };

      const result = mapAttributes(mockValues, mockConfig, mockFamilyConfig);
      const priceAttr = result.attributes.find((attr) => attr.name === "price");
      expect(priceAttr?.value).toBe(99.99);
    });

    it("should correctly parse multiselect attributes", () => {
      const mockValues: Values = {
        size: [
          {
            locale: null,
            scope: "ecommerce",
            data: "S,M,L",
            attribute_type: "pim_catalog_multiselect",
          },
        ],
      };

      const result = mapAttributes(mockValues, mockConfig, mockFamilyConfig);
      const sizeAttr = result.attributes.find((attr) => attr.name === "size");
      expect(sizeAttr?.value).toEqual(["S", "M", "L"]);
    });
  });
});
