import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { createJsonRequest } from "@/test/helpers";
import { POST } from "./route";

beforeEach(() => {
  process.env.PAYPAL_API_URL = "https://api-m.sandbox.paypal.com";
  process.env.NEXT_PUBLIC_PAYPAL_CLIENT_ID = "test-client-id";
  process.env.PAYPAL_CLIENT_SECRET = "test-secret";

  vi.stubGlobal(
    "fetch",
    vi.fn()
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ access_token: "mock-token" }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: () =>
          Promise.resolve({ id: "ORDER-123", status: "COMPLETED" }),
      })
  );
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe("POST /api/complete-order", () => {
  describe("validation", () => {
    it("returns 400 when orderID is missing", async () => {
      const res = await POST(createJsonRequest({ intent: "capture" }));
      expect(res.status).toBe(400);
    });

    it("returns 400 when intent is missing", async () => {
      const res = await POST(createJsonRequest({ orderID: "ORDER-123" }));
      expect(res.status).toBe(400);
    });
  });

  describe("PayPal token", () => {
    it("returns 500 when access_token is missing", async () => {
      vi.stubGlobal(
        "fetch",
        vi.fn().mockResolvedValue({
          ok: true,
          json: () => Promise.resolve({}),
        })
      );
      const res = await POST(
        createJsonRequest({ orderID: "ORDER-123", intent: "capture" })
      );
      expect(res.status).toBe(500);
      const data = await res.json();
      expect(data.message).toContain("access token");
    });
  });

  describe("payment capture", () => {
    it("calls correct PayPal capture URL with orderID", async () => {
      await POST(createJsonRequest({ orderID: "ORDER-123", intent: "capture" }));
      const fetchMock = vi.mocked(global.fetch);
      const captureUrl = fetchMock.mock.calls[1][0] as string;
      expect(captureUrl).toContain("/v2/checkout/orders/ORDER-123/capture");
    });

    it("uses Bearer token from auth step", async () => {
      await POST(createJsonRequest({ orderID: "ORDER-123", intent: "capture" }));
      const fetchMock = vi.mocked(global.fetch);
      const options = fetchMock.mock.calls[1][1] as RequestInit;
      expect((options.headers as Record<string, string>)["Authorization"]).toBe(
        "Bearer mock-token"
      );
    });

    it("returns capture result", async () => {
      const res = await POST(
        createJsonRequest({ orderID: "ORDER-123", intent: "capture" })
      );
      expect(res.status).toBe(200);
      const data = await res.json();
      expect(data.status).toBe("COMPLETED");
    });
  });

  describe("error handling", () => {
    it("returns 500 when fetch throws", async () => {
      vi.stubGlobal(
        "fetch",
        vi.fn().mockRejectedValue(new Error("Network error"))
      );
      const res = await POST(
        createJsonRequest({ orderID: "ORDER-123", intent: "capture" })
      );
      expect(res.status).toBe(500);
      const data = await res.json();
      expect(data.success).toBe(false);
    });
  });
});
