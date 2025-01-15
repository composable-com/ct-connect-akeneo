import { createActor } from "xstate";

import { AkeneoProduct } from "../types/akeneo.types";
import { Config } from "../types/config.types";
import { getAkeneoClient } from "../akeneo/client/client";
import { SyncError } from "../job-status";
import { akeneoMachine } from "../machines/akeneoMachine";
import { logger } from "../commercetools/utils/logger.utils";

export async function syncProduct(
  incomingProduct: AkeneoProduct,
  config: Config
): Promise<void> {
  return new Promise((resolve, reject) => {
    // Initialize the Akeneo machine with the product identifier
    const akeneoActor = createActor(akeneoMachine, {
      input: {
        incomingProduct,
        config,
      },
    });

    akeneoActor.subscribe((snapshot) => {
      switch (snapshot.status) {
        case "done":
          if (!snapshot.context.error) {
            logger.info(
              `Akeneo Product ${incomingProduct.uuid} synced successfully.`
            );

            akeneoActor.stop();
            resolve();
            break;
          }

          akeneoActor.stop();
          reject(new Error(snapshot.context.error));

          break;
        case "error":
          logger.error(
            `Error syncing Akeneo product ${incomingProduct.uuid}: ${String(
              snapshot.error
            )}`
          );

          akeneoActor.stop();
          reject(new Error(String(snapshot.error)));
          break;

        default:
          break;
      }
    });

    akeneoActor.start();
  });
}

interface SyncParams {
  isDelta?: boolean;
  lastSyncDate?: Date;
  lastCursor?: string;
  batchSize?: number;
  saveLastExecution: ({
    cursor,
    failedSyncs,
  }: {
    cursor: string | null;
    failedSyncs: SyncError[] | null;
  }) => Promise<void>;
  shouldContinue: () => Promise<boolean>;
  config: Config;
}

export async function startSyncProcess({
  isDelta,
  lastSyncDate,
  lastCursor,
  saveLastExecution,
  shouldContinue,
  batchSize = 5,
  config,
}: SyncParams) {
  const failedSyncs: SyncError[] = [];
  const akeneoClient = await getAkeneoClient();

  let searchAfterParam = lastCursor ?? null;

  while (true) {
    if (!(await shouldContinue())) break;

    const { products, searchAfter: cursor } = await akeneoClient.getProducts({
      searchAfterParam,
      limit: batchSize,
      searchFilters: {
        families: Object.entries(config.familyMapping).map(([key]) => key),
        completeness: "100",
        scope: config.akeneoScope,
      },
      isDelta,
      lastSyncDate,
    });

    if (!products.length) {
      await saveLastExecution({ cursor: null, failedSyncs: null });
      break;
    }

    for (const product of products) {
      await syncProduct(product, config).catch((error) => {
        failedSyncs.push({
          identifier: product.identifier,
          errorMessage: error.message,
          date: new Date().toISOString(),
        });
      });
    }

    if (!cursor) {
      await saveLastExecution({ cursor: null, failedSyncs });
      break;
    }

    searchAfterParam = cursor;
    await saveLastExecution({ cursor, failedSyncs });
  }
}
