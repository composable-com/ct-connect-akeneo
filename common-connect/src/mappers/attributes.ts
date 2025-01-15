import {
  Attribute,
  LocalizedString,
  ProductProjection,
  ProductUpdateAction,
  ProductVariant,
} from "@commercetools/platform-sdk";
import { Value, Values } from "../types/akeneo.types";
import { Config, FamilyConfig } from "../types/config.types";

// Mapping commercetools fields to their corresponding actions and payload format
const actionMap = {
  name: {
    action: "changeName",
    payload: (value: Record<string, string> | string) => ({ name: value }),
  },
  description: {
    action: "setDescription",
    payload: (value: Record<string, string> | string) => ({
      description: value,
    }),
  },
  slug: {
    action: "changeSlug",
    payload: (value: Record<string, string> | string) => ({ slug: value }),
  },
  default: {
    action: "setAttribute",
    payload: (value: Record<string, string> | string, field: string) => ({
      name: field,
      value,
    }),
  },
};

const attributeParser: Record<
  string,
  (value: any, attributeMapping: any) => any
> = {
  pim_catalog_boolean: (value: boolean) => Boolean(value),
  pim_catalog_number: (value: string) => Number(value),
  pim_catalog_text: (value: string) => value,
  pim_catalog_simpleselect: (value: string, ctAttr: any) => ctAttr[value],
  pim_catalog_multiselect: (value: string) => value.split(","),
};

// Helper function to map a single attribute based on locale configuration
const mapSingleAttribute = (
  attr: Value,
  configLocales: Record<string, string>,
  ctAttr: any
) => {
  const locale =
    attr.locale && configLocales[attr.locale]
      ? configLocales[attr.locale]
      : undefined;

  const parsedValue =
    attributeParser[attr.attribute_type]?.(attr.data, ctAttr) ?? attr.data;

  return { locale, value: parsedValue };
};

// Function to map attributes (common and specific) and apply locale mapping
const mapFamilyAttributes = (
  attributeData: Value[],
  config: Config,
  ctAttr: any
) => {
  return attributeData
    .filter((attr) => attr.scope === null || attr.scope === config.akeneoScope)
    .filter(
      (attr) =>
        attr.locale === null ||
        Object.keys(config.localeMapping).includes(attr.locale)
    ) // Filter valid locales
    .map((attr) => mapSingleAttribute(attr, config.localeMapping, ctAttr))
    .reduce((acc: any, { locale, value }: any) => {
      if (locale) {
        acc[locale] = value; // Localized attributes
      } else {
        return value; // Non-localized attributes
      }

      return acc;
    }, {}); // Accumulate into an object of localized values
};

// Function to dynamically generate the action and its payload
const generateAction = (field: string, value: any, actionMap: any) => {
  const actionType = actionMap[field] || actionMap.default;

  return actionType.action
    ? {
        action: actionType.action,
        ...actionType.payload(value, field), // Dynamically construct the payload
      }
    : null;
};

const getActions = (
  specificData: {
    field?: string;
    value: any;
    name?: string;
  }[],
  actionMap: any
) => {
  return specificData
    .map(({ field, value, name }) => {
      return generateAction(field ?? name ?? "", value, actionMap);
    })
    .filter(Boolean);
};

const attributeHasChanged = (
  existingProduct: ProductProjection,
  variantSelected: ProductVariant,
  attribute: CTAkeneoAttributes
) => {
  for (const attr of variantSelected.attributes ?? []) {
    if (attr.name === attribute.name) {
      // deep compare the value
      if (JSON.stringify(attr.value) !== JSON.stringify(attribute.value)) {
        return true;
      }
    }
  }

  return false;
};

const commonHasChanged = (
  existingProduct: ProductProjection,
  common: CTAkeneoCommonFields
) => {
  const commonToUpdate = Object.entries(common)
    .filter(
      ([key, value]) =>
        JSON.stringify(existingProduct[key as keyof ProductProjection]) !==
        JSON.stringify(value)
    )
    .map(([key, value]) => ({ field: key, value }));

  return commonToUpdate;
};

export const mapAttributesWithActions = (
  values: Values,
  config: Config,
  existingProduct: ProductProjection,
  variantSelected: ProductVariant,
  familyConfig: FamilyConfig
): ProductUpdateAction[] => {
  const { common, attributes } = mapAttributes(values, config, familyConfig);

  const attributesToUpdate = attributes.filter((attribute) =>
    attributeHasChanged(existingProduct, variantSelected, attribute)
  );
  const commonToUpdate = commonHasChanged(existingProduct, common);

  const actions = getActions(
    [...commonToUpdate, ...attributesToUpdate],
    actionMap
  );

  return actions;
};

export const mapAttributeEntries = (
  attributes: FamilyConfig["attributeMapping"],
  values: Values,
  config: Config
): { name: string; value: Attribute }[] => {
  return Object.entries(attributes)
    .map(([akeneoAttr, ctAttr]) => {
      const attributeData = values[akeneoAttr];
      if (!attributeData) return null;

      const mappedValue = mapFamilyAttributes(attributeData, config, ctAttr);
      if (typeof ctAttr === "string") {
        return mappedValue ? { name: ctAttr, value: mappedValue } : null;
      }

      const rawValue = attributeData[0].data;
      const parser = attributeParser[attributeData[0].attribute_type];
      const parsedValue = parser ? parser(rawValue, ctAttr) : rawValue;

      return mappedValue
        ? {
            name: ctAttr.commercetoolsAttribute,
            value: parsedValue,
          }
        : null;
    })
    .filter(Boolean) as { name: string; value: Attribute }[];
};

const mapCommonFieldsEntries = (
  attributes: Record<string, string>,
  values: Values,
  config: Config
) => {
  return Object.entries(attributes)
    .map(([akeneoAttr, ctAttr]) => {
      const attributeData = values[akeneoAttr];
      if (!attributeData) return null;

      const mappedValues = mapFamilyAttributes(attributeData, config, ctAttr);
      return mappedValues ? { [ctAttr]: mappedValues } : null;
    })
    .filter(Boolean)
    .reduce((acc: any, attr: any) => ({ ...acc, ...attr }), {});
};

// Core function to map Akeneo attributes to commercetools format
export type CTAkeneoCommonFields = {
  [key in "name" | "description" | "slug"]: LocalizedString;
};

export type CTAkeneoAttributes = {
  name: string;
  value: Attribute;
};

export const mapAttributes = (
  values: Values,
  config: Config,
  familyConfig: FamilyConfig
): {
  common: CTAkeneoCommonFields;
  attributes: CTAkeneoAttributes[];
} => {
  const commonAttributes = mapCommonFieldsEntries(
    familyConfig.coreAttributeMapping || {},
    values,
    config
  );

  const specificAttributes = mapAttributeEntries(
    familyConfig.attributeMapping || {},
    values,
    config
  );

  // Return both common and specific attributes, clearly separated
  return {
    common: commonAttributes,
    attributes: specificAttributes,
  };
};
