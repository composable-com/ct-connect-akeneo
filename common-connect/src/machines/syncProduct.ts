import { fromPromise } from "xstate";
import {
  Product,
  ProductProjection,
  ProductUpdateAction,
} from "@commercetools/platform-sdk";
import {
  createProduct,
  CTAkeneoProduct,
  getProduct,
  updateProduct,
} from "../commercetools/api/products";
import { logger } from "../commercetools/utils/logger.utils";

const shouldPublish = (existingProduct: ProductProjection | undefined) => {
  if (existingProduct?.published) {
    return process.env.SET_PUBLISHED_TO_MODIFIED === "false";
  }

  return false;
};

export const syncProduct = fromPromise<
  Product | null,
  {
    productPayload: CTAkeneoProduct | undefined;
    updateActions: ProductUpdateAction[];
    existingProduct: ProductProjection | undefined;
  }
>(async ({ input }) => {
  const { productPayload, existingProduct, updateActions } = input;

  const publishAction = shouldPublish(existingProduct)
    ? ([{ action: "publish" }] as ProductUpdateAction[])
    : [];

  try {
    if (updateActions.length > 0 && existingProduct) {
      const productSyncedData = await updateProduct(
        existingProduct.id,
        existingProduct.version,
        [...updateActions, ...publishAction]
      );

      return productSyncedData;
    }

    if (productPayload) {
      // Product draft for creation
      const productSyncedData = await createProduct({
        ...productPayload,
        masterVariant: {
          ...productPayload.masterVariant,
          attributes: [...(productPayload.masterVariant.attributes || [])],
        },
      });

      if (publishAction.length > 0) {
        await updateProduct(
          productSyncedData.id,
          productSyncedData.version,
          publishAction
        );
      }

      return productSyncedData;
    }

    if (existingProduct) {
      const product = await getProduct(existingProduct.id);

      return product;
    }

    return null;
  } catch (error) {
    throw error;
  }
});
