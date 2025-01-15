import {
  ProductProjection,
  ProductSetSkuAction,
} from "@commercetools/platform-sdk";

import { fromPromise } from "xstate";

export const mapForSkuUpdate = fromPromise<
  ProductSetSkuAction[] | [],
  {
    existingProduct: ProductProjection;
    variantId: number;
    sku: string;
  }
>(async ({ input }) => {
  const { existingProduct, variantId, sku } = input;

  if (!variantId) {
    return [];
  }

  const variants = [existingProduct.masterVariant, ...existingProduct.variants];
  const variantToUpdate = variants.find((variant) => variant.id === variantId);

  if (!variantToUpdate || variantToUpdate?.sku === sku) {
    return [];
  }

  return [
    {
      action: "setSku",
      sku,
      variantId,
    },
  ];
});
