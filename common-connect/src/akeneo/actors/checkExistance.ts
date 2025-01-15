import { Attribute, ProductProjection } from "@commercetools/platform-sdk";
import { fromPromise } from "xstate";
import { AkeneoProduct, AkeneoProductModel } from "../../types/akeneo.types";
import { Config } from "../../types/config.types";
import { getProductByAkeneoParentCode } from "../../commercetools/api/products";

type CheckExistenceActorOutput = {
  productExists: boolean;
  skipUpdate?: boolean;
  variantExists?: boolean;
  variantId?: number;
  existingProduct?: ProductProjection;
  sku?: string | undefined;
};

export const checkExistence = fromPromise<
  CheckExistenceActorOutput,
  {
    productData: Omit<AkeneoProduct, "parent"> & { parent: AkeneoProductModel };
    config: Config;
  }
>(async ({ input }) => {
  const {
    productData: { uuid, parent, identifier, updated, family, values, enabled },
    config,
  } = input;

  const existingProduct = await getProductByAkeneoParentCode(
    uuid,
    parent?.code
  );

  const familyAttribute = config.familyMapping[family].akeneoSkuField;
  const sku = (
    familyAttribute ? values[familyAttribute]?.[0]?.data : identifier
  ) as string;

  if (!existingProduct)
    return {
      productExists: false,
      sku,
    };

  if (!enabled) {
    return { skipUpdate: true, productExists: true };
  }

  const variantExists = existingProduct.variants.find((variant) =>
    variant.attributes?.find(
      (attr: Attribute) => attr.name === "akeneo_id" && attr.value === uuid
    )
  );

  const existsAsMasterVariant = existingProduct.masterVariant.attributes?.find(
    (attr: Attribute) => attr.name === "akeneo_id" && attr.value === uuid
  );

  return {
    productExists: true,
    variantExists: Boolean(variantExists || existsAsMasterVariant),
    variantId: variantExists?.id ?? existingProduct.masterVariant.id,
    existingProduct,
    sku: (sku ?? identifier) as string,
    skipUpdate: false,
  };
});
