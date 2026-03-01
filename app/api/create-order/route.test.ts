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
          Promise.resolve({ id: "ORDER-123", status: "CREATED" }),
      })
  );
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe("POST /api/create-order", () => {
  describe("amount validation", () => {
    it("returns 400 when amount is NaN", async () => {
      const res = await POST(createJsonRequest({ intent: "capture", amount: "abc" }));
      expect(res.status).toBe(400);
      const data = await res.json();
      expect(data.error).toContain("Invalid amount");
    });

    it("returns 400 when amount is 0", async () => {
      const res = await POST(createJsonRequest({ intent: "capture", amount: "0" }));
      expect(res.status).toBe(400);
    });

    it("returns 400 when amount is negative", async () => {
      const res = await POST(createJsonRequest({ intent: "capture", amount: "-10" }));
      expect(res.status).toBe(400);
    });
  });

  describe("PayPal authentication", () => {
    it("requests access token with correct Basic auth header", async () => {
      await POST(createJsonRequest({ intent: "capture", amount: "10" }));
      const fetchMock = vi.mocked(global.fetch);
      const [url, options] = fetchMock.mock.calls[0];
      expect(url).toContain("/v1/oauth2/token");
      const expectedAuth = Buffer.from("test-client-id:test-secret").toString("base64");
      expect((options as RequestInit).headers).toHaveProperty(
        "Authorization",
        `Basic ${expectedAuth}`
      );
    });
  });

  describe("order creation", () => {
    it("formats amount to 2 decimal places", async () => {
      await POST(createJsonRequest({ intent: "capture", amount: "10.5" }));
      const fetchMock = vi.mocked(global.fetch);
      const body = JSON.parse((fetchMock.mock.calls[1][1] as RequestInit).body as string);
      expect(body.purchase_units[0].amount.value).toBe("10.50");
    });

    it("uppercases the intent value", async () => {
      await POST(createJsonRequest({ intent: "capture", amount: "10" }));
      const fetchMock = vi.mocked(global.fetch);
      const body = JSON.parse((fetchMock.mock.calls[1][1] as RequestInit).body as string);
      expect(body.intent).toBe("CAPTURE");
    });

    it("uses USD currency code", async () => {
      await POST(createJsonRequest({ intent: "capture", amount: "10" }));
      const fetchMock = vi.mocked(global.fetch);
      const body = JSON.parse((fetchMock.mock.calls[1][1] as RequestInit).body as string);
      expect(body.purchase_units[0].amount.currency_code).toBe("USD");
    });

    it("returns PayPal order response", async () => {
      const res = await POST(createJsonRequest({ intent: "capture", amount: "10" }));
      const data = await res.json();
      expect(data.id).toBe("ORDER-123");
      expect(data.status).toBe("CREATED");
    });
  });
});
