import { ProductAddVariantAction } from "@commercetools/platform-sdk";
import { fromPromise } from "xstate";
import { AkeneoProduct, AkeneoProductModel } from "../../types/akeneo.types";
import { Config } from "../../types/config.types";
import { mapProductVariant } from "../../mappers/product";

export const mapForAddVariant = fromPromise<
  ProductAddVariantAction[],
  {
    productData: Omit<AkeneoProduct, "parent"> & {
      parent: AkeneoProductModel | null;
    };
    config: Config;
    sku?: string;
  }
>(async ({ input }) => {
  const { productData, config, sku } = input;
  const productVariantPayload = mapProductVariant({
    akeneoProduct: productData,
    sku,
    config,
  });

  return [
    {
      action: "addVariant",
      ...productVariantPayload,
    },
  ];
});
