import { mapImages } from "./images";
import { AkeneoProduct } from "../types/akeneo.types";
import { Config } from "../types/config.types";

describe("mapImages", () => {
  const mockConfig: Config = {
    akeneoScope: "ecommerce",
    familyMapping: {},
    localeMapping: {},
    categoryMapping: {},
  };

  it("should map images with matching scope", () => {
    const mockProduct: AkeneoProduct = {
      values: {
        product_images: [
          {
            scope: "ecommerce",
            data: ["image1.jpg", "image2.jpg"],
            reference_data_name: "product_images",
            locale: null,
            attribute_type: "image",
          },
        ],
      },
      uuid: "",
      identifier: "",
      enabled: false,
      family: "",
      categories: [],
      groups: [],
      parent: null,
      created: "",
      updated: "",
    };

    const result = mapImages(mockProduct, mockConfig, "product_images");

    expect(result).toEqual([
      {
        assetFamily: "product_images",
        assetsFileName: "image1.jpg",
      },
      {
        assetFamily: "product_images",
        assetsFileName: "image2.jpg",
      },
    ]);
  });

  it("should map images with null scope", () => {
    const mockProduct: AkeneoProduct = {
      values: {
        product_images: [
          {
            scope: null,
            data: ["image1.jpg"],
            reference_data_name: "product_images",
            locale: null,
            attribute_type: "image",
          },
        ],
      },
      uuid: "",
      identifier: "",
      enabled: false,
      family: "",
      categories: [],
      groups: [],
      parent: null,
      created: "",
      updated: "",
    };

    const result = mapImages(mockProduct, mockConfig, "product_images");

    expect(result).toEqual([
      {
        assetFamily: "product_images",
        assetsFileName: "image1.jpg",
      },
    ]);
  });

  it("should return empty array when no images match scope", () => {
    const mockProduct: AkeneoProduct = {
      values: {
        product_images: [
          {
            scope: "different_scope",
            data: ["image1.jpg"],
            reference_data_name: "product_images",
            locale: null,
            attribute_type: "image",
          },
        ],
      },
      uuid: "",
      identifier: "",
      enabled: false,
      family: "",
      categories: [],
      groups: [],
      parent: null,
      created: "",
      updated: "",
    };

    const result = mapImages(mockProduct, mockConfig, "product_images");

    expect(result).toEqual([]);
  });

  it("should return empty array when image attribute is missing", () => {
    const mockProduct: AkeneoProduct = {
      values: {},
      uuid: "",
      identifier: "",
      enabled: false,
      family: "",
      categories: [],
      groups: [],
      parent: null,
      created: "",
      updated: "",
    };

    const result = mapImages(mockProduct, mockConfig, "product_images");

    expect(result).toEqual([]);
  });

  it("should handle multiple image entries with different scopes", () => {
    const mockProduct: AkeneoProduct = {
      values: {
        product_images: [
          {
            scope: "ecommerce",
            data: ["image1.jpg"],
            reference_data_name: "product_images",
            locale: null,
            attribute_type: "image",
          },
          {
            scope: "different_scope",
            data: ["image2.jpg"],
            reference_data_name: "product_images",
            locale: null,
            attribute_type: "image",
          },
          {
            scope: null,
            data: ["image3.jpg"],
            reference_data_name: "product_images",
            locale: null,
            attribute_type: "image",
          },
        ],
      },
      uuid: "",
      identifier: "",
      enabled: false,
      family: "",
      categories: [],
      groups: [],
      parent: null,
      created: "",
      updated: "",
    };

    const result = mapImages(mockProduct, mockConfig, "product_images");

    expect(result).toEqual([
      {
        assetFamily: "product_images",
        assetsFileName: "image1.jpg",
      },
      {
        assetFamily: "product_images",
        assetsFileName: "image3.jpg",
      },
    ]);
  });
});
