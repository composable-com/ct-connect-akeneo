import {
  Attribute,
  CategoryReference,
  LocalizedString,
  Product,
  ProductProjection,
  ProductTypeReference,
  ProductUpdateAction,
} from "@commercetools/platform-sdk";
import { createApiRoot } from "../client/create.client";

export const findProductByAkeneoId = async (
  uuid: string,
  parentCode: string | null
): Promise<Product | null> => {
  try {
    const query = parentCode
      ? `variants.attributes.akeneo_parent_code:"${parentCode}"`
      : `variants.attributes.akeneo_id:"${uuid}"`;

    const response = await createApiRoot()
      .products()
      .get({
        queryArgs: {
          filter: query,
        },
      })
      .execute();

    return response.body.results[0] ?? null;
  } catch (error) {
    throw error;
  }
};

export const getProductByAkeneoIdKey = async (
  uuid: string,
  parentCode: string | null
) => {
  try {
    const { body } = await createApiRoot()
      .products()
      .withKey({ key: parentCode ?? uuid })
      .get()
      .execute();

    return body;
  } catch (error) {
    return null;
  }
};

export const getProductByAkeneoParentCode = async (
  uuid: string,
  parentCode: string | null
): Promise<ProductProjection | null> => {
  const {
    body: { results, total },
  } = await createApiRoot()
    .productProjections()
    .get({
      queryArgs: {
        staged: true,
        where: `masterVariant(attributes(name="akeneo_parent_code" and value="${
          parentCode ?? uuid
        }"))`,
      },
    })
    .execute();

  if (total === 0) return null;

  return results[0];
};

export interface CTAkeneoProductVariant {
  sku: string;
  attributes: Attribute[];
  // images: Image[];
}

export const addProductVariant = async (
  productId: string,
  version: number,
  variant: CTAkeneoProductVariant
) => {
  const { body } = await createApiRoot()
    .products()
    .withId({ ID: productId })
    .post({
      body: {
        version,
        actions: [
          {
            action: "addVariant",
            sku: variant.sku,
            attributes: variant.attributes,
          },
        ],
      },
    })
    .execute();

  return body;
};

export interface CTAkeneoProduct {
  name: LocalizedString;
  slug: LocalizedString;
  description: LocalizedString;
  categories: CategoryReference[];
  productType: ProductTypeReference;
  masterVariant: {
    sku: string;
    attributes: Attribute[];
  };
}

export const createProduct = async (product: CTAkeneoProduct) => {
  const { body } = await createApiRoot()
    .products()
    .post({
      body: product,
    })
    .execute();

  return body;
};

export const getProduct = async (id: string) => {
  const { body } = await createApiRoot()
    .products()
    .withId({ ID: id })
    .get()
    .execute();

  return body;
};

export const updateProduct = async (
  id: string,
  version: number,
  actions: ProductUpdateAction[]
): Promise<Product> => {
  const response = await createApiRoot()
    .products()
    .withId({ ID: id })
    .post({
      body: {
        version,
        actions,
      },
    })
    .execute();

  return response.body;
};

export const addProductImage = async ({
  productId,
  file,
  filename,
  fileExtension,
  sku,
}: {
  productId: string;
  file: Buffer;
  filename: string;
  fileExtension: string;
  sku?: string;
}) => {
  try {
    return await createApiRoot()
      .products()
      .withId({ ID: productId })
      .images()
      .post({
        body: file,
        queryArgs: {
          sku,
          filename,
        },
        headers: {
          "Content-Type": `image/${
            (fileExtension as "png" | "jpeg" | "gif") ?? "png"
          }`,
        },
      })
      .execute();
  } catch (error) {
    throw error;
  }
};
