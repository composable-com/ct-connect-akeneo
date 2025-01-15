import {
  ProductProjection,
  ProductUpdateAction,
} from "@commercetools/platform-sdk";
import { fromPromise } from "xstate";
import { AkeneoProduct } from "../../types/akeneo.types";
import { Config } from "../../types/config.types";
import { mapAttributesWithActions } from "../../mappers/attributes";

export const mapForUpdateVariant = fromPromise<
  ProductUpdateAction[],
  {
    productData: AkeneoProduct;
    config: Config;
    variantId: number;
    existingProduct: ProductProjection;
  }
>(async ({ input }) => {
  const { productData, config, variantId, existingProduct } = input;
  const familyConfig = config.familyMapping[productData.family];

  const variantSelected = [
    existingProduct.masterVariant,
    ...existingProduct.variants,
  ].find((variant) => variant.id === variantId);

  if (!variantSelected) {
    return [];
  }

  const actions = mapAttributesWithActions(
    productData.values,
    config,
    existingProduct,
    variantSelected,
    familyConfig
  ).map((action) => ({
    ...action,
    variantId: Number(variantId),
  }));

  return actions;
});
