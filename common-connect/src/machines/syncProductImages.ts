import { fromPromise } from "xstate";
import { mapImages } from "../mappers/images";
import { AkeneoProduct } from "../types/akeneo.types";
import { addProductImage } from "../commercetools/api/products";
import { Config } from "../types/config.types";
import { getAkeneoClient } from "../akeneo/client/client";
import sharp from "sharp";

export const syncProductImages = fromPromise<
  { success: boolean },
  {
    incomingProduct: AkeneoProduct;
    productSyncedData: any;
    config: Config;
    sku: string | undefined;
  }
>(async ({ input }) => {
  try {
    const { incomingProduct, productSyncedData, config, sku } = input;

    const akeneoImageUrls = mapImages(
      incomingProduct,
      config,
      config.familyMapping[incomingProduct.family].akeneoImagesAttribute
    );

    if (akeneoImageUrls.length === 0) {
      return { success: true };
    }

    const akeneoClient = await getAkeneoClient();

    const currentImages =
      [
        productSyncedData.masterData.staged.masterVariant,
        ...productSyncedData.masterData.staged.variants,
      ]
        ?.find((variant) => variant.sku === sku)
        ?.images?.map(
          (image: any) => image.url.split("/").pop()?.split("-")[0]
        ) ?? [];

    for (const { assetFamily, assetsFileName } of akeneoImageUrls) {
      // if the image exists in ct it will have their name truncated to 20 characters
      if (currentImages.includes(assetsFileName.substring(0, 20))) {
        continue;
      }
      const fileUrl = await akeneoClient.getProductImageUrl(
        assetFamily,
        assetsFileName
      );

      let imageBuffer = await akeneoClient.getFileBufferFromUrl(fileUrl);
      let fileExtension = fileUrl.split(".").pop();

      if (fileExtension === "jpg") {
        imageBuffer = await sharp(imageBuffer).toFormat("jpeg").toBuffer();
        fileExtension = "jpeg";
      }

      await addProductImage({
        productId: productSyncedData.id,
        file: imageBuffer,
        // When uploading to commercetools, the filename is truncated to 20 characters
        filename: assetsFileName.substring(0, 20),
        fileExtension,
        sku,
      });
    }

    return { success: true };
  } catch (error) {
    return { success: false };
  }
});
