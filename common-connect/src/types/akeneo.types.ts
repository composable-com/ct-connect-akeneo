export interface AkeneoProduct {
  uuid: string;
  identifier: string;
  enabled: boolean;
  family: string;
  categories: string[];
  groups: any[];
  parent: string | null;
  values: Values;
  created: string;
  updated: string;
  associations?: Associations;
  quantified_associations?: QuantifiedAssociations;
  metadata?: Metadata;
}

export interface AkeneoProductModel {
  code: string;
  family: string;
  family_variant: string;
  categories: string[];
  groups: any[];
  parent: null;
  values: Values;
  created: string;
  updated: string;
  associations?: Associations;
  quantified_associations?: QuantifiedAssociations;
  metadata?: Metadata;
}

export interface Associations {
  PACK: Pack;
  UPSELL: Pack;
  X_SELL: Pack;
  SUBSTITUTION: Pack;
}

export interface Pack {
  products: string[];
  product_models: any[];
  groups: any[];
}

export interface Metadata {
  workflow_status: string;
}

export interface QuantifiedAssociations {}

export interface Values {
  [key: string]: Value[];
}

export interface Value {
  locale: string | null;
  scope: null | string;
  data: string | boolean | number | Datum[] | string[];
  reference_data_name?: string | null;
  attribute_type: string;
  _links?: Links;
}

export interface Links {
  download: Download;
}

export interface Download {
  href: string;
}

// export enum Locale {
//   EnCA = "en_CA",
//   EnUS = "en_US",
// }

export interface Price {
  locale: null;
  scope: null;
  data: Datum[];
  attribute_type: string;
}

export interface Datum {
  amount: string;
  currency: string;
}

export interface TestBoolean {
  locale: string;
  scope: string;
  data: boolean;
  attribute_type: string;
}
