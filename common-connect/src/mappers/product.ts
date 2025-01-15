import {
  Attribute,
  CategoryReference,
  LocalizedString,
  ProductTypeReference,
} from "@commercetools/platform-sdk";
import {
  CTAkeneoProduct,
  CTAkeneoProductVariant,
} from "../commercetools/api/products";
import { AkeneoProduct, AkeneoProductModel } from "../types/akeneo.types";
import { Config } from "../types/config.types";
import {
  CTAkeneoAttributes,
  CTAkeneoCommonFields,
  mapAttributes,
} from "./attributes";
import { mapCategories } from "./categories";

export const mapProductModel = (
  akeneoProductModel: AkeneoProductModel,
  config: Config
): {
  common: CTAkeneoCommonFields;
  attributes: CTAkeneoAttributes[];
  categories: CategoryReference[];
} => {
  const { common, attributes } = mapAttributes(
    akeneoProductModel.values,
    config,
    config.familyMapping[akeneoProductModel.family]
  );

  return {
    common,
    attributes,
    categories: mapCategories(akeneoProductModel.categories, config),
  };
};

export const mapProduct = (
  akeneoProduct: Omit<AkeneoProduct, "parent"> & {
    parent: AkeneoProductModel | null;
  },
  sku: string,
  config: Config
): CTAkeneoProduct => {
  const familyConfig = config.familyMapping[akeneoProduct.family];

  if (!familyConfig) {
    throw new Error(
      `Family "${akeneoProduct.family}" is not defined in the config.`
    );
  }

  const { common, attributes } = mapAttributes(
    { ...akeneoProduct.parent?.values, ...akeneoProduct.values },
    config,
    familyConfig
  );

  const productDraft = {
    // if there is parent, use the parentCommon, otherwise use the variantCommon
    ...common,
    // key: akeneoProduct.parent?.code ?? akeneoProduct.uuid,
    productType: {
      id: familyConfig.commercetoolsProductTypeId,
      typeId: "product-type",
    } as ProductTypeReference,
    categories: mapCategories(akeneoProduct.categories, config),
    masterVariant: {
      sku: sku ?? akeneoProduct.identifier,
      attributes: [
        ...attributes,
        {
          name: "akeneo_id",
          value: akeneoProduct.uuid,
        },
        // if there is no parent, use the uuid as parent code
        {
          name: "akeneo_parent_code",
          value: akeneoProduct.parent?.code ?? akeneoProduct.uuid,
        },
      ],
    },
  };

  return productDraft;
};

export const mapProductVariant = ({
  akeneoProduct,
  sku,
  config,
}: {
  akeneoProduct: Omit<AkeneoProduct, "parent"> & {
    parent: AkeneoProductModel | null;
  };
  sku?: string;
  config: Config;
}): CTAkeneoProductVariant => {
  const familyConfig = config.familyMapping[akeneoProduct.family];

  if (!familyConfig) {
    throw new Error(
      `Family "${akeneoProduct.family}" is not defined in the config.`
    );
  }

  const { attributes } = mapAttributes(
    akeneoProduct.values,
    config,
    familyConfig
  );

  return {
    sku: sku ?? akeneoProduct.identifier,
    attributes: [
      ...attributes,
      {
        name: "akeneo_id",
        value: akeneoProduct.uuid,
      },
      {
        name: "akeneo_parent_code",
        value: akeneoProduct.parent?.code ?? akeneoProduct.uuid,
      },
    ],
  };
};
