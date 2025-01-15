import { createActor, toPromise } from "xstate";
import { mapForSkuUpdate } from "./mapForUpdateSku";
import { ProductProjection } from "@commercetools/platform-sdk";
import { AkeneoProduct } from "../../types/akeneo.types";

describe("mapForSkuUpdate actor", () => {
  const mockProductData: AkeneoProduct = {
    identifier: "new-sku",
    uuid: "test-uuid",
    enabled: true,
    family: "test-family",
    categories: [],
    groups: [],
    parent: null,
    values: {},
    created: "2023-01-01",
    updated: "2023-01-01",
  };

  const mockExistingProduct: ProductProjection = {
    id: "test-id",
    version: 1,
    createdAt: "2023-01-01",
    lastModifiedAt: "2023-01-01",
    masterVariant: {
      id: 1,
      sku: "old-sku",
    },
    variants: [
      {
        id: 2,
        sku: "old-variant-sku",
      },
    ],
    productType: {
      typeId: "product-type",
      id: "product-type-1",
    },
    name: {},
    slug: {},
    categories: [],
    categoryOrderHints: {},
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should return empty array when variantId is not provided", async () => {
    const actor = createActor(mapForSkuUpdate, {
      input: {
        existingProduct: mockExistingProduct,
        sku: "new-sku",
        variantId: 0,
      },
    });

    actor.start();
    const result = await toPromise(actor);

    expect(result).toEqual([]);
  });

  it("should return empty array when variant is not found", async () => {
    const actor = createActor(mapForSkuUpdate, {
      input: {
        existingProduct: mockExistingProduct,
        variantId: 999,
        sku: "new-sku",
      },
    });

    actor.start();
    const result = await toPromise(actor);

    expect(result).toEqual([]);
  });

  it("should return empty array when SKUs are identical", async () => {
    const actor = createActor(mapForSkuUpdate, {
      input: {
        existingProduct: mockExistingProduct,
        variantId: 1,
        sku: "old-sku",
      },
    });

    actor.start();
    const result = await toPromise(actor);

    expect(result).toEqual([]);
  });

  it("should return setSku action for master variant when SKUs are different", async () => {
    const actor = createActor(mapForSkuUpdate, {
      input: {
        existingProduct: mockExistingProduct,
        variantId: 1,
        sku: "new-sku",
      },
    });

    actor.start();
    const result = await toPromise(actor);

    expect(result).toEqual([
      {
        action: "setSku",
        sku: "new-sku",
        variantId: 1,
      },
    ]);
  });

  it("should return setSku action for variant when SKUs are different", async () => {
    const actor = createActor(mapForSkuUpdate, {
      input: {
        existingProduct: mockExistingProduct,
        variantId: 2,
        sku: "new-sku",
      },
    });

    actor.start();
    const result = await toPromise(actor);

    expect(result).toEqual([
      {
        action: "setSku",
        sku: "new-sku",
        variantId: 2,
      },
    ]);
  });
});
