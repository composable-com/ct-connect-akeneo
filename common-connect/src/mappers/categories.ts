import { CategoryReference } from '@commercetools/platform-sdk';
import { Config } from '../types/config.types';

export const mapCategories = (
  categories: string[],
  config: Config
): CategoryReference[] => {
  return categories
    .map((category) => config.categoryMapping[category])
    .filter(Boolean)
    .map((commercetoolsCategory) => ({
      id: commercetoolsCategory.commercetoolsCategoryid,
      typeId: 'category',
    }));
};
