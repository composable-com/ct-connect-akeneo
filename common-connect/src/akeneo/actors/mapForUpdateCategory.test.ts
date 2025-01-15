import { createActor, toPromise } from "xstate";
import { mapForCategoryUpdate } from "./mapForUpdateCategory";
import { AkeneoProduct } from "../../types/akeneo.types";
import { Config } from "../../types/config.types";
import { ProductProjection } from "@commercetools/platform-sdk";

describe("mapForCategoryUpdate actor", () => {
  const mockConfig: Config = {
    categoryMapping: {
      "akeneo-cat-1": { commercetoolsCategoryid: "ct-cat-1" },
      "akeneo-cat-2": { commercetoolsCategoryid: "ct-cat-2" },
      "akeneo-cat-3": { commercetoolsCategoryid: "ct-cat-3" },
    },
    familyMapping: {},
    localeMapping: {},
    akeneoScope: "scope",
  };

  const mockProductData: AkeneoProduct = {
    uuid: "test-uuid",
    identifier: "test-identifier",
    categories: ["akeneo-cat-1", "akeneo-cat-2"],
    enabled: true,
    family: "test-family",
    groups: [],
    created: "2023-01-01",
    updated: "2023-01-01",
    values: {},
    parent: null,
  };

  const mockExistingProduct: ProductProjection = {
    id: "test-id",
    version: 1,
    createdAt: "2023-01-01",
    lastModifiedAt: "2023-01-01",
    categories: [
      { id: "ct-cat-1", typeId: "category" },
      { id: "ct-cat-3", typeId: "category" },
    ],
    masterVariant: {
      id: 1,
      attributes: [],
    },
    variants: [],
    productType: {
      typeId: "product-type",
      id: "product-type-1",
    },
    name: {},
    slug: {},
    categoryOrderHints: {},
  };

  it("should return empty array when categories are identical", async () => {
    const productWithSameCategories = {
      ...mockProductData,
      categories: ["akeneo-cat-1", "akeneo-cat-3"],
    };

    const actor = createActor(mapForCategoryUpdate, {
      input: {
        productData: productWithSameCategories,
        config: mockConfig,
        existingProduct: mockExistingProduct,
      },
    });
    actor.start();

    const result = await toPromise(actor);
    expect(result).toEqual([]);
  });

  it("should generate add and remove category actions when categories differ", async () => {
    const actor = createActor(mapForCategoryUpdate, {
      input: {
        productData: mockProductData,
        config: mockConfig,
        existingProduct: mockExistingProduct,
      },
    });
    actor.start();

    const result = await toPromise(actor);
    expect(result).toEqual([
      {
        action: "addToCategory",
        category: {
          id: "ct-cat-2",
          typeId: "category",
        },
      },
      {
        action: "removeFromCategory",
        category: {
          id: "ct-cat-3",
          typeId: "category",
        },
      },
    ]);
  });

  it("should only generate add actions when existing product has no categories", async () => {
    const productWithNoCategories = {
      ...mockExistingProduct,
      categories: [],
    };

    const actor = createActor(mapForCategoryUpdate, {
      input: {
        productData: mockProductData,
        config: mockConfig,
        existingProduct: productWithNoCategories,
      },
    });
    actor.start();

    const result = await toPromise(actor);
    expect(result).toEqual([
      {
        action: "addToCategory",
        category: {
          id: "ct-cat-1",
          typeId: "category",
        },
      },
      {
        action: "addToCategory",
        category: {
          id: "ct-cat-2",
          typeId: "category",
        },
      },
    ]);
  });

  it("should only generate remove actions when incoming product has no categories", async () => {
    const productWithNoCategories = {
      ...mockProductData,
      categories: [],
    };

    const actor = createActor(mapForCategoryUpdate, {
      input: {
        productData: productWithNoCategories,
        config: mockConfig,
        existingProduct: mockExistingProduct,
      },
    });
    actor.start();

    const result = await toPromise(actor);
    expect(result).toEqual([
      {
        action: "removeFromCategory",
        category: {
          id: "ct-cat-1",
          typeId: "category",
        },
      },
      {
        action: "removeFromCategory",
        category: {
          id: "ct-cat-3",
          typeId: "category",
        },
      },
    ]);
  });
});
