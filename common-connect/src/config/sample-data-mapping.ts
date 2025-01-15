import {Config} from "../types/config.types";

/**
 * This is an example of a data mapping config object. Modifying this object will have no impact on the logic of the connector.
 *
 * The connector uses a data mapping object stored in the SyncManager custom object in commercetools, and is managed via the Merchant Center App.
 */
const sampleConfig: Config = {
   familyMapping: {
      shirt: {
         commercetoolsProductTypeId: "67fe38ea-9d69-4382-bc18-32215e079a9f",
         commercetoolsProductTypeLabel: "akeneosync-shirt",
         akeneoImagesAttribute: "shirt_images",
         coreAttributeMapping: {
            custom_product_title: "name",
            custom_product_description: "description",
            slug: "slug",
         },
         attributeMapping: {
            shirt_size: {
               commercetoolsAttribute: "size",
               small: "S",
               medium: "M",
               large: "L",
            },
            material_type: "material",
            clothing_brand: "brand",
            text_localized_a: "text-localized-combination-unique",
            text_localized_b: "text-localized-sameforall",
         },
      },
      pants: {
         commercetoolsProductTypeId: "ea924170-d0f5-45cb-a1d9-15282b4177a9",
         commercetoolsProductTypeLabel: "akeneosync-pants",
         akeneoSkuField: "custom_sku_field",
         akeneoImagesAttribute: "pant_images",
         coreAttributeMapping: {
            custom_product_title: "name",
            custom_product_description: "description",
            slug: "slug",
         },
         attributeMapping: {
            pant_size: {
               commercetoolsAttribute: "size",
               small: "S",
               medium: "M",
               large: "L",
            },
            material_type: "material",
            clothing_brand: "brand",
         },
      },
      tie: {
         commercetoolsProductTypeId: "9f26ab5b-d7f7-4d3e-b0bf-e4fa4f2651cf",
         commercetoolsProductTypeLabel: "akeneosync-tie",
         akeneoImagesAttribute: "tie_images",
         coreAttributeMapping: {
            custom_product_title: "name",
            custom_product_description: "description",
            slug: "slug",
         },
         attributeMapping: {
            material_type: "material",
            clothing_brand: "brand",
         },
      },
   },
   categoryMapping: {
      clothing: {
         commercetoolsCategoryid: "60fc5c02-08b2-44b0-8d18-bd8e91634031",
         label: "akeneosync-clothing",
      },
      shirt: {
         commercetoolsCategoryid: "066d7124-45a2-4935-ad16-3ce3afd535e2",
         label: "akeneosync-tshirts",
      },
      tie: {
         commercetoolsCategoryid: "8f78c07e-50a1-4592-b0ab-3d2c6c795174",
         label: "akeneosync-tshirts",
      },
   },
   localeMapping: {
      en_US: "en-US",
      en_CA: "en-CA",
      fr_CA: "fr-CA",
   },
   akeneoScope: "ecommerce",
};
