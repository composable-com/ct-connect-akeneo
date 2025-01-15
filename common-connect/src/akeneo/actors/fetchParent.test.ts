import { createActor, toPromise } from "xstate";
import { fetchParent } from "./fetchParent";
import { getAkeneoClient } from "../client/client";
import { AkeneoProduct, AkeneoProductModel } from "../../types/akeneo.types";

// Mock the Akeneo client
jest.mock("../client/client", () => ({
  getAkeneoClient: jest.fn(),
}));

describe("fetchParent actor", () => {
  const mockProductModel: AkeneoProductModel = {
    code: "parent-code",
    family: "testFamily",
    family_variant: "testVariant",
    parent: null,
    categories: [],
    values: {},
    created: "2023-01-01",
    updated: "2023-01-01",
    groups: [],
  };

  const mockProduct: AkeneoProduct = {
    uuid: "test-uuid",
    identifier: "test-identifier",
    enabled: true,
    family: "testFamily",
    categories: [],
    values: {},
    parent: "parent-code",
    created: "2023-01-01",
    updated: "2023-01-01",
    groups: [],
  };

  const mockAkeneoClient = {
    getProductModel: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
    (getAkeneoClient as jest.Mock).mockResolvedValue(mockAkeneoClient);
  });

  it("should fetch parent product model when parent exists", async () => {
    mockAkeneoClient.getProductModel.mockResolvedValueOnce(mockProductModel);

    const actor = createActor(fetchParent, {
      input: {
        productData: mockProduct,
      },
    });
    actor.start();

    const result = await toPromise(actor);

    expect(mockAkeneoClient.getProductModel).toHaveBeenCalledWith("parent-code");
    expect(result).toEqual({
      ...mockProduct,
      parent: mockProductModel,
    });
  });

  it("should return original product when no parent exists", async () => {
    const productWithoutParent = { ...mockProduct, parent: null };

    const actor = createActor(fetchParent, {
      input: {
        productData: productWithoutParent,
      },
    });
    actor.start();

    const result = await toPromise(actor);

    expect(mockAkeneoClient.getProductModel).not.toHaveBeenCalled();
    expect(result).toEqual(productWithoutParent);
  });

  it("should throw error when fetching parent fails", async () => {
    const error = new Error("Failed to fetch parent");
    mockAkeneoClient.getProductModel.mockRejectedValueOnce(error);

    const actor = createActor(fetchParent, {
      input: {
        productData: mockProduct,
      },
    });
    actor.start();

    await expect(toPromise(actor)).rejects.toThrow("Failed to fetch parent");
    expect(mockAkeneoClient.getProductModel).toHaveBeenCalledWith("parent-code");
  });
}); 