type CommercetoolsCoreFields = 'name' | 'description' | 'slug';

/**
 * Used to map Akeneo Simple Select attributes to commercetools List (enum) attributes.
 */
type ListMapping = {
  /**
   * The name of the commercetools attribute, it must be a List (enum) type.
   */
  commercetoolsAttribute: string;
  /**
   * A key-value dictionary mapping each Akeneo Option code to the corresponding commercetools enumeration key.
   * Each key is an Akeneo Option code, and the value is the commercetools enumeration key.
   */
  [key: string]: string;
};

export interface FamilyConfig {
  /**
   * The ID of the commercetools product type to map an Akeneo family to
   */
  commercetoolsProductTypeId: string;
  /**
   * An optional label for the mapped commercetools product type to help identify it. If the ID is changed, this label should be updated to reflect the new commercetoold product type's name.
   */
  commercetoolsProductTypeLabel?: string;
  /**
   * The Akeneo attribute code that contains images for the products in this family
   */
  akeneoImagesAttribute: string;
  /**
   * An optional field that specifies the Akeneo attribute code that contains the SKU. By default, the SKU will be pulled from the "identifier" field from the Akeneo product record data.
   */
  akeneoSkuField?: string;
  /**
   * The mapping configuration of core product fields from Akeneo to commercetools, mapping to commercetools fields of: name, description, slug.
   * The key is the Akeneo attribute code, and the value is the commercetools attribute name.
   */
  coreAttributeMapping: {
    [key: string]: CommercetoolsCoreFields;
  };
  /**
   * The mapping configuration of Akeneo attributes to commercetools attributes. The key is the Akeneo attribute code, and the value is the commercetools attribute name. The value can also be a ListMapping object to map Akeneo Simple Select attributes to commercetools List (enum) attributes.
   */
  attributeMapping: {
    [key: string]: string | ListMapping;
  };
}

export interface Config {
  /**
   * The familyMapping is a key-value dictionary where each key represents a product family code in Akeneo, and each value is a FamilyConfig object that specifies the mapping configuration for that family. Only the families specified in this mapping will be synced to commercetools.
   */
  familyMapping: {
    [key: string]: FamilyConfig;
  };
  /**
   * This object maps Akeneo locales to commercetools locales, where each key is the Akeneo locale, and each value is the target commercetools locale to map to.
   *
   * This mapping should populate all available locales in commercetools, otherwise localized values in commercetools will be null.
   */
  localeMapping: {
    [key: string]: string;
  };
  /**
   * A mapping of Akeneo categories to commercetools categories. The key is the Akeneo category code, and commercetoolsCategoryid is the commercetools category ID.
   *
   * A human readable label can also be provided to help identify the commercetools category when maintaining the mapping configuration.
   */
  categoryMapping: {
    [key: string]: {
      commercetoolsCategoryid: string;
      label?: string;
    };
  };
  /**
   * This string defines Akeneo channel to be synchronized, such as "ecommerce".
   */
  akeneoScope: string;
}
