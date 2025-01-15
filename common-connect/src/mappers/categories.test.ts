import { mapCategories } from "./categories";
import { Config } from "../types/config.types";
describe("mapCategories", () => {
  const mockConfig: Config = {
    categoryMapping: {
      "source-category-1": {
        commercetoolsCategoryid: "ct-category-1",
        label: "source-category-1",
      },
      "source-category-2": {
        commercetoolsCategoryid: "ct-category-2",
        label: "source-category-2",
      },
    },
    familyMapping: {},
    localeMapping: {},
    akeneoScope: "",
  };

  it("should map categories to commercetools category references", () => {
    const sourceCategories = ["source-category-1", "source-category-2"];

    const result = mapCategories(sourceCategories, mockConfig);

    expect(result).toEqual([
      { id: "ct-category-1", typeId: "category" },
      { id: "ct-category-2", typeId: "category" },
    ]);
  });

  it("should filter out unmapped categories", () => {
    const sourceCategories = ["source-category-1", "non-existent-category"];

    const result = mapCategories(sourceCategories, mockConfig);

    expect(result).toEqual([{ id: "ct-category-1", typeId: "category" }]);
  });

  it("should return empty array when no categories provided", () => {
    const sourceCategories: string[] = [];

    const result = mapCategories(sourceCategories, mockConfig);

    expect(result).toEqual([]);
  });

  it("should return empty array when no mappings exist", () => {
    const sourceCategories = ["category-1", "category-2"];
    const emptyConfig: Config = {
      categoryMapping: {},
    } as Config;

    const result = mapCategories(sourceCategories, emptyConfig);

    expect(result).toEqual([]);
  });
});
