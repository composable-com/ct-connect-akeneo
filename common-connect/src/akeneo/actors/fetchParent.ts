import { fromPromise } from "xstate";
import { AkeneoProduct, AkeneoProductModel } from "../../types/akeneo.types";
import { getAkeneoClient } from "../client/client";

export const fetchParent = fromPromise<
  AkeneoProduct & { parent: AkeneoProductModel },
  { productData: AkeneoProduct }
>(async ({ input }) => {
  try {
    const { productData } = input;
    if (!productData.parent) return productData;

    const akeneoClient = await getAkeneoClient();
    const parent = await akeneoClient.getProductModel(productData.parent);

    return { ...productData, parent };
  } catch (error) {
    throw error;
  }
});
