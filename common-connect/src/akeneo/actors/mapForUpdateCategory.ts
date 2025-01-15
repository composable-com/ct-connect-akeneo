import { ProductProjection } from "@commercetools/platform-sdk";

import {
  ProductAddToCategoryAction,
  ProductRemoveFromCategoryAction,
} from "@commercetools/platform-sdk";
import { fromPromise } from "xstate";
import { AkeneoProduct } from "../../types/akeneo.types";
import { Config } from "../../types/config.types";
import { mapCategories } from "../../mappers/categories";

export const mapForCategoryUpdate = fromPromise<
  (ProductRemoveFromCategoryAction | ProductAddToCategoryAction)[],
  {
    productData: AkeneoProduct;
    config: Config;
    existingProduct: ProductProjection;
  }
>(async ({ input }) => {
  const { productData, config, existingProduct } = input;

  const currentCategories = existingProduct.categories.map(({ id }) => id);

  const incomingCategories = mapCategories(productData.categories, config).map(
    ({ id }) => id
  );

  if (
    currentCategories.length === incomingCategories.length &&
    currentCategories.every(
      (category, index) => category === incomingCategories[index]
    )
  ) {
    return [];
  }

  const categoriesToAdd = incomingCategories.filter(
    (category) => !currentCategories.includes(category)
  );

  const categoriesToRemove = currentCategories.filter(
    (category) => !incomingCategories.includes(category)
  );

  const addCategoryActions = categoriesToAdd.map((categoryId) => ({
    action: "addToCategory",
    category: {
      id: categoryId,
      typeId: "category",
    },
  })) as ProductAddToCategoryAction[];

  const removeCategoryActions = categoriesToRemove.map((categoryId) => ({
    action: "removeFromCategory",
    category: {
      id: categoryId,
      typeId: "category",
    },
  })) as ProductRemoveFromCategoryAction[];

  return [...addCategoryActions, ...removeCategoryActions];
});
