import { fromPromise } from "xstate";
import { CTAkeneoProduct } from "../../commercetools/api/products";
import { AkeneoProduct, AkeneoProductModel } from "../../types/akeneo.types";
import { Config } from "../../types/config.types";
import { mapProduct } from "../../mappers/product";

export const mapForCreation = fromPromise<
  CTAkeneoProduct,
  {
    productData: Omit<AkeneoProduct, "parent"> & {
      parent: AkeneoProductModel;
    };
    config: Config;
    sku: string;
  }
>(async ({ input }) => {
  const { productData, config, sku } = input;

  return mapProduct(productData, sku, config);
});
