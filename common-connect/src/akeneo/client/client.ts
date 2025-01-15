import axios from "axios";
import { AkeneoProduct } from "../../types/akeneo.types";

import getAccessToken from "./auth";

class AkeneoAPI {
  private static instance: AkeneoAPI | null = null;
  private accessToken: string | null = null;
  private retryCount: number = 0;

  private constructor() {}

  public static async getInstance(): Promise<AkeneoAPI> {
    if (!this.instance) {
      this.instance = new AkeneoAPI();
      await this.instance.initializeAccessToken();
    }
    return this.instance;
  }

  public static resetInstance(): void {
    this.instance = null;
  }

  private async initializeAccessToken() {
    const token = await getAccessToken();
    if (!token) {
      throw new Error("Access token is undefined");
    }
    this.accessToken = token;
  }

  private getAuthHeaders() {
    if (!this.accessToken) {
      throw new Error("Access token is undefined");
    }
    return {
      Authorization: `Bearer ${this.accessToken}`,
      "Content-Type": "application/json",
    };
  }

  private formatDateForAkeneo(date: Date): string {
    const d = new Date(date);
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    const hours = String(d.getHours()).padStart(2, "0");
    const minutes = String(d.getMinutes()).padStart(2, "0");
    const seconds = String(d.getSeconds()).padStart(2, "0");

    return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
  }

  private async handleTokenExpiration<T>(
    apiCall: () => Promise<T>
  ): Promise<T> {
    try {
      const result = await apiCall();
      // Reset retry count after successful call
      this.retryCount = 0;
      return result;
    } catch (error) {
      if (
        error instanceof Error &&
        error.message.includes("access token") &&
        this.retryCount < 2
      ) {
        this.retryCount++;

        await this.initializeAccessToken();
        return this.handleTokenExpiration(apiCall);
      }

      this.retryCount = 0;
      throw error;
    }
  }

  public async getProductModel(code: string) {
    return this.handleTokenExpiration(async () => {
      const url = `${process.env.AKENEO_BASE_URL}/api/rest/v1/product-models/${code}`;
      const response = await fetch(url, {
        method: "GET",
        headers: this.getAuthHeaders(),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(`Failed to fetch product model: ${errorData.message}`);
      }

      return response.json();
    });
  }

  public async getProductImageUrl(assetFamily: string, assetsFileName: string) {
    return this.handleTokenExpiration(async () => {
      const url = `${process.env.AKENEO_BASE_URL}/api/rest/v1/asset-families/${assetFamily}/assets/${assetsFileName}`;
      const response = await fetch(url, {
        method: "GET",
        headers: this.getAuthHeaders(),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(`Failed to fetch product image: ${errorData.message}`);
      }

      const data = await response.json();
      return data.values.media[0]._links.download.href;
    });
  }

  public async getFileBufferFromUrl(fileUrl: string) {
    return this.handleTokenExpiration(async () => {
      const urlStream = await axios.get(fileUrl, {
        responseType: "arraybuffer",
        headers: this.getAuthHeaders(),
      });

      if (!urlStream.data) {
        throw new Error("Failed to fetch file stream");
      }

      return Buffer.from(urlStream.data);
    });
  }

  public async getProducts(params?: {
    limit?: number;
    searchAfterParam?: string | null;
    searchFilters: {
      families: string[];
      completeness: string;
      scope: string;
    };
    isDelta?: boolean;
    lastSyncDate?: Date;
  }): Promise<{
    searchAfter: string | null;
    products: AkeneoProduct[];
    total: number;
  }> {
    return this.handleTokenExpiration(async () => {
      const url = `${process.env.AKENEO_BASE_URL}/api/rest/v1/products`;
      const queryParams = new URLSearchParams({
        limit: params?.limit?.toString() ?? "5",
        ...(params?.searchAfterParam && {
          search_after: params?.searchAfterParam,
        }),
        ...(params?.searchAfterParam && {
          pagination_type: "search_after",
        }),
        with_count: "true",
        search: JSON.stringify({
          completeness: [
            {
              operator: ">=",
              value: params?.searchFilters.completeness,
              scope: params?.searchFilters.scope,
            },
          ],
          ...(params?.isDelta && {
            updated: [
              {
                operator: ">",
                value: params?.lastSyncDate
                  ? this.formatDateForAkeneo(params.lastSyncDate)
                  : "",
              },
            ],
          }),
          family: [{ operator: "IN", value: params?.searchFilters.families }],
        }),
      });

      const response = await fetch(`${url}?${queryParams.toString()}`, {
        method: "GET",
        headers: this.getAuthHeaders(),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(`Failed to fetch products: ${errorData.message}`);
      }

      const products = await response.json();

      return {
        searchAfter: products._links.next
          ? new URL(products._links.next.href).searchParams.get("search_after")
          : null,
        products: products._embedded?.items ?? [],
        total: products.items_count,
      };
    });
  }
}

export { AkeneoAPI };

export const getAkeneoClient = async () => {
  return AkeneoAPI.getInstance();
};
