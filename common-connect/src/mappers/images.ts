import { AkeneoProduct } from "../types/akeneo.types";
import { Config } from "../types/config.types";

interface AkeneoAsset {
  assetFamily: string;
  assetsFileName: string;
}

export const mapImages = (
  akeneoProduct: AkeneoProduct,
  config: Config,
  familyProductAttribute: string
): AkeneoAsset[] => {
  const akeneoAssets: AkeneoAsset[] = [];

  const image = akeneoProduct.values[familyProductAttribute]?.filter(
    (attr) => attr.scope === config.akeneoScope || attr.scope === null
  );

  if (!image || !image?.length) return [];

  image.forEach((image) => {
    if (Array.isArray(image.data)) {
      image.data.forEach((assetName) => {
        akeneoAssets.push({
          assetFamily: image.reference_data_name!,
          assetsFileName: assetName as string,
        });
      });
    }
  });

  return akeneoAssets;
};
