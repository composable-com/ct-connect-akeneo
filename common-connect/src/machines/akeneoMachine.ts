import { assign, setup } from "xstate";

import { AkeneoProduct, AkeneoProductModel } from "../types/akeneo.types";
import { CTAkeneoProduct } from "../commercetools/api/products";
import { syncProductImages } from "./syncProductImages";
import { syncProduct } from "./syncProduct";
import {
  Product,
  ProductAddToCategoryAction,
  ProductProjection,
  ProductRemoveFromCategoryAction,
  ProductSetSkuAction,
  ProductUpdateAction,
} from "@commercetools/platform-sdk";
import { Config } from "../types/config.types";

import {
  checkExistence,
  fetchParent,
  mapForCreation,
  mapForAddVariant,
  mapForUpdateVariant,
  mapForSkuUpdate,
  mapForCategoryUpdate,
} from "../akeneo/actors";
import { logger } from "../commercetools/utils/logger.utils";

export const akeneoMachine = setup({
  types: {} as {
    input: {
      incomingProduct: AkeneoProduct;
      config: Config;
    };
    context: {
      config: Config;
      productData: AkeneoProduct & { parent: AkeneoProductModel };
      mappedProductData: CTAkeneoProduct | null;
      mappedProductActions: ProductUpdateAction[] | null;
      mappedCategoryActions:
        | (ProductRemoveFromCategoryAction | ProductAddToCategoryAction)[]
        | []
        | null;
      productSyncedData: Product | null;
      existingProduct?: ProductProjection;
      variantId?: number;
      variantExists?: boolean;
      sku?: string;
      error?: string | null;
    };
  },
  actors: {
    checkExistence,
    fetchParent,
    syncProductImagesActor: syncProductImages,
    syncProductActor: syncProduct,
    mapForCreation,
    mapForAddVariant,
    mapForCategoryUpdate,
    mapForUpdateVariant,
    mapForSkuUpdate,
  },
}).createMachine({
  initial: "fetchParent",
  context: ({ input }) => ({
    productData: input.incomingProduct as AkeneoProduct & {
      parent: AkeneoProductModel;
    },
    config: input.config,
    productSyncedData: null,
    mappedProductData: null,
    mappedProductActions: null,
    mappedCategoryActions: null,
    error: null,
  }),
  states: {
    fetchParent: {
      invoke: {
        src: "fetchParent",
        input: ({ context }) => ({
          productData: context.productData,
        }),
        onDone: {
          target: "checkingExistence",
          actions: assign({
            productData: ({ event }) => event.output,
          }),
        },
        onError: {
          target: "failure",
        },
      },
    },
    checkingExistence: {
      invoke: {
        src: "checkExistence",
        input: ({ context }) => ({
          productData: context.productData,
          config: context.config,
        }),
        onDone: [
          {
            target: "success",
            guard: ({ event }) => {
              return Boolean(event.output?.skipUpdate);
            },
            actions: [
              ({ context }) =>
                logger.info(
                  `Akeneo Product "${context.productData.uuid}": already synced ... skipping \n`
                ),
            ],
          },
          {
            target: "mappingForUpdateVariant",
            guard: ({ event }) => {
              return Boolean(
                event.output?.productExists && event.output?.variantExists
              );
            },
            actions: [
              assign({
                existingProduct: ({ event }) => event.output?.existingProduct,
                variantExists: () => true,
                variantId: ({ event }) => event.output?.variantId,
                sku: ({ event }) => event.output.sku,
              }),
            ],
          },
          {
            target: "mappingForAddVariant",
            guard: ({ event }) =>
              Boolean(
                event.output?.productExists && !event.output?.variantExists
              ),
            actions: [
              assign({
                existingProduct: ({ event }) => event.output.existingProduct,
                sku: ({ event }) => event.output.sku,
                variantExists: () => false,
              }),
            ],
          },
          {
            target: "mappingForCreation",
            actions: assign({ sku: ({ event }) => event.output.sku }),
          },
        ],
        onError: "failure",
      },
    },

    mappingForCreation: {
      invoke: {
        src: mapForCreation,
        input: ({ context }) => ({
          productData: context.productData,
          config: context.config,
          sku: context.sku,
        }),
        onDone: {
          target: "syncingProduct",
          actions: assign({
            mappedProductData: ({ event }) => event.output as CTAkeneoProduct,
          }),
        },
        onError: "failure",
      },
    },

    mappingForAddVariant: {
      invoke: {
        src: "mapForAddVariant",
        input: ({ context }) => ({
          productData: context.productData,
          config: context.config,
          sku: context.sku,
        }),
        onDone: {
          target: "mappingForCategoryUpdate",
          actions: assign({
            mappedProductActions: ({ event }) => event.output,
          }),
        },
        onError: "failure",
      },
    },

    mappingForUpdateVariant: {
      invoke: {
        src: "mapForUpdateVariant",
        input: ({ context }) => ({
          productData: context.productData,
          existingProduct: context.existingProduct!,
          config: context.config,
          variantId: context.variantId!,
        }),
        onDone: {
          target: "mappingForCategoryUpdate",
          actions: assign({
            mappedProductActions: ({ event }) => event.output,
          }),
        },
        onError: {
          target: "failure",
          actions: ({ event }) => {
            logger.error("Error on mapping for update variant", event.error);
          },
        },
      },
    },

    mappingForCategoryUpdate: {
      invoke: {
        src: "mapForCategoryUpdate",
        input: ({ context }) => ({
          productData: context.productData,
          config: context.config,
          existingProduct: context.existingProduct!,
        }),
        onDone: {
          target: "mappingForSkuUpdate",
          actions: assign({
            mappedCategoryActions: ({ event }) => event.output,
          }),
        },
        onError: "failure",
      },
    },

    mappingForSkuUpdate: {
      invoke: {
        src: mapForSkuUpdate,
        input: ({ context }) => ({
          existingProduct: context.existingProduct!,
          variantId: context.variantId!,
          sku: context.sku,
        }),
        onDone: {
          target: "syncingProduct",
          actions: assign({
            mappedProductActions: ({ event, context }) => [
              ...(context.mappedProductActions ?? []),
              ...(event.output as ProductSetSkuAction[]),
            ],
          }),
        },
        onError: "failure",
      },
    },

    syncingProduct: {
      invoke: {
        src: "syncProductActor",
        input: ({ context }) => ({
          productPayload: context.mappedProductData!,
          updateActions: [
            ...(context.mappedProductActions ?? []),
            ...(context.mappedCategoryActions ?? []),
          ],
          existingProduct: context.existingProduct,
        }),
        onDone: {
          target: "syncingImages",
          actions: [
            assign({
              productSyncedData: ({ event }) => event.output,
            }),
          ],
        },
        onError: {
          target: "failure",
        },
      },
    },

    syncingImages: {
      invoke: {
        src: syncProductImages,
        input: ({ context }) => ({
          productSyncedData: context.productSyncedData,
          incomingProduct: context.productData,
          config: context.config,
          sku: context.sku,
        }),
        onDone: "success",
        onError: "failure",
      },
    },

    success: { type: "final" },

    failure: {
      entry: [
        assign({
          error: ({ event }) => event.error.message,
        }),
      ],
      type: "final",
    },
  },
});
