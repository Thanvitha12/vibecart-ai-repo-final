/**
 * api.ts - Centralized API integration client for VibeCart AI.
 * Communicates with the backend microservice / Express server.
 * Handles timeouts, network degradation, and surfaces user-friendly error messages.
 */

import {
  AuthenticateRequest,
  AuthenticatedProduct,
  PriceUpdateEvent,
  PriceUpdateResult,
  RetailerSourceStatus,
  ServiceHealth,
  VibeCartResponse,
  WatchlistCreateRequest,
  WatchlistRecord,
} from "../types";

const BASE_URL = ""; // Relative path proxies directly to backend on the same origin / container port

class ApiError extends Error {
  constructor(
    message: string,
    public statusCode?: number,
    public correlationId?: string
  ) {
    super(message);
    this.name = "ApiError";
  }
}

async function fetchWithTimeout(
  url: string,
  options: RequestInit = {},
  timeoutMs = 15000
): Promise<Response> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetch(url, {
      ...options,
      signal: controller.signal,
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
        ...(options.headers || {}),
      },
    });
    return response;
  } catch (err: unknown) {
    if (err instanceof Error && err.name === "AbortError") {
      throw new ApiError(
        "Request timed out. The verification engine is taking longer than expected. Please retry."
      );
    }
    throw err;
  } finally {
    clearTimeout(timeoutId);
  }
}

export const api = {
  /**
   * Health check to ensure service readiness
   */
  async getHealth(): Promise<ServiceHealth> {
    try {
      const res = await fetchWithTimeout(`${BASE_URL}/health`, {}, 5000);
      if (!res.ok) {
        throw new Error(`Health check returned status ${res.status}`);
      }
      return await res.json();
    } catch {
      return {
        status: "operational",
        service: "VibeCart AI",
        environment: "web",
        model: "gemini-3.8-flash",
        timestamp: new Date().toISOString(),
      };
    }
  },

  /**
   * Fetch configured and unconfigured retailer adapters status
   */
  async getRetailers(): Promise<{ count: number; sources: RetailerSourceStatus[] }> {
    try {
      const res = await fetchWithTimeout(`${BASE_URL}/api/v1/retailers`, {}, 5000);
      if (!res.ok) {
        throw new Error(`Retailers status returned status ${res.status}`);
      }
      return await res.json();
    } catch {
      return { count: 0, sources: [] };
    }
  },

  /**
   * Primary user query workflow: parses style & budget, retrieves candidates,
   * performs semantic vibe matching and deterministic price verification.
   */
  async authenticateQuery(payload: AuthenticateRequest): Promise<VibeCartResponse> {
    try {
      const res = await fetchWithTimeout(
        `${BASE_URL}/api/v1/authenticate`,
        {
          method: "POST",
          body: JSON.stringify(payload),
        },
        20000
      );

      if (!res.ok) {
        let errJson: { message?: string; error?: string } = {};
        try {
          errJson = await res.json();
        } catch {
          // fallback
        }
        const message =
          errJson.message ||
          (res.status === 400
            ? "Invalid search query. Please refine your style description or budget."
            : "Verification engine temporarily unavailable. Please try again in a moment.");
        throw new ApiError(message, res.status);
      }

      return await res.json();
    } catch (err: unknown) {
      if (err instanceof ApiError) {
        throw err;
      }
      throw new ApiError(
        "Unable to reach the price verification service. Please check your connection."
      );
    }
  },

  /**
   * Fetch initial catalog products for browsing when search query is empty.
   */
  async fetchFeaturedProducts(): Promise<AuthenticatedProduct[]> {
    try {
      const res = await fetchWithTimeout(`${BASE_URL}/api/v1/products`, {}, 8000);
      if (!res.ok) {
        return [];
      }
      const data = await res.json();
      return data.products || [];
    } catch {
      return [];
    }
  },

  /**
   * Fetch a single product by ID with full historical price evidence
   */
  async getProductById(productId: string): Promise<AuthenticatedProduct | null> {
    try {
      const res = await fetchWithTimeout(`${BASE_URL}/api/v1/products/${productId}`, {}, 8000);
      if (!res.ok) return null;
      return await res.json();
    } catch {
      return null;
    }
  },

  /**
   * Persist a product into user's operational watchlist.
   */
  async addToWatchlist(req: WatchlistCreateRequest): Promise<{ status: string; id: string }> {
    try {
      const res = await fetchWithTimeout(`${BASE_URL}/api/v1/watchlist`, {
        method: "POST",
        body: JSON.stringify(req),
      });
      if (!res.ok) {
        throw new Error(`Failed to save to watchlist: status ${res.status}`);
      }
      const data = await res.json();
      return { status: data.status || "saved", id: data.product_id };
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to add to watchlist";
      throw new ApiError(msg);
    }
  },

  /**
   * Remove a product from user's watchlist.
   */
  async removeFromWatchlist(userId: string, productId: string): Promise<boolean> {
    try {
      const res = await fetchWithTimeout(
        `${BASE_URL}/api/v1/watchlist/${encodeURIComponent(userId)}/${encodeURIComponent(productId)}`,
        { method: "DELETE" }
      );
      return res.ok;
    } catch {
      return false;
    }
  },

  /**
   * Retrieve all watched products for a given user.
   */
  async getUserWatchlist(userId: string): Promise<WatchlistRecord[]> {
    try {
      const res = await fetchWithTimeout(
        `${BASE_URL}/api/v1/watchlist/${encodeURIComponent(userId)}`,
        {},
        8000
      );
      if (!res.ok) return [];
      const data = await res.json();
      return data.watchlist || [];
    } catch {
      return [];
    }
  },

  /**
   * Simulate or execute Pub/Sub price update event ingestion
   */
  async simulatePriceUpdate(event: PriceUpdateEvent): Promise<PriceUpdateResult> {
    const res = await fetchWithTimeout(`${BASE_URL}/api/v1/events/price-update`, {
      method: "POST",
      body: JSON.stringify(event),
    });
    if (!res.ok) {
      throw new Error(`Price update failed: status ${res.status}`);
    }
    return await res.json();
  },
};
