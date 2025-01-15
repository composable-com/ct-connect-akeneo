import { getAkeneoClient } from "../akeneo/client/client";
import { Config } from "../types/config.types";

export async function getTotalProductsCount(config: Config) {
  const akeneoClient = await getAkeneoClient();
  const { total } = await akeneoClient.getProducts({
    searchFilters: {
      families: Object.entries(config.familyMapping).map(([key]) => key),
      completeness: "100",
      scope: config.akeneoScope,
    },
  });

  return total;
}
