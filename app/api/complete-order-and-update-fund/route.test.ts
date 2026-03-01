import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { createJsonRequest } from "@/test/helpers";

const { mockUpdateFunds } = vi.hoisted(() => ({
  mockUpdateFunds: vi.fn().mockResolvedValue({ success: true, newBalance: 150 }),
}));

vi.mock("@/lib/updateFunds", () => ({
  updateFunds: mockUpdateFunds,
}));

import { POST } from "./route";

const completedCaptureResponse = {
  id: "PAY-123",
  status: "COMPLETED",
  purchase_units: [
    {
      payments: {
        captures: [{ amount: { value: "112.50" } }],
      },
    },
  ],
};

beforeEach(() => {
  process.env.NEXT_PUBLIC_BASE_URL = "http://localhost:3000";
  mockUpdateFunds.mockReset().mockResolvedValue({ success: true, newBalance: 150 });

  vi.stubGlobal(
    "fetch",
    vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve(completedCaptureResponse),
    })
  );
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe("POST /api/complete-order-and-update-fund", () => {
  describe("validation", () => {
    it("returns 400 when orderID is missing", async () => {
      const res = await POST(
        createJsonRequest({ intent: "capture", pitcherId: "pid-1" })
      );
      expect(res.status).toBe(400);
    });

    it("returns 400 when intent is missing", async () => {
      const res = await POST(
        createJsonRequest({ orderID: "ORDER-123", pitcherId: "pid-1" })
      );
      expect(res.status).toBe(400);
    });

    it("returns 400 when pitcherId is missing", async () => {
      const res = await POST(
        createJsonRequest({ orderID: "ORDER-123", intent: "capture" })
      );
      expect(res.status).toBe(400);
    });
  });

  describe("payment check", () => {
    it("returns error when payment status is not COMPLETED", async () => {
      vi.stubGlobal(
        "fetch",
        vi.fn().mockResolvedValue({
          ok: true,
          json: () => Promise.resolve({ status: "PENDING" }),
        })
      );
      const res = await POST(
        createJsonRequest({ orderID: "ORDER-123", intent: "capture", pitcherId: "pid-1" })
      );
      const data = await res.json();
      expect(data.success).toBe(false);
      expect(data.message).toContain("not completed");
    });
  });

  describe("fund update", () => {
    it("extracts amount from capture result and calls updateFunds", async () => {
      await POST(
        createJsonRequest({ orderID: "ORDER-123", intent: "capture", pitcherId: "pid-1" })
      );
      expect(mockUpdateFunds).toHaveBeenCalledWith({
        refID: "PAY-123",
        pitcherId: "pid-1",
        amount: 112.5,
        eventType: "add_fund",
      });
    });

    it("returns success with newBalance", async () => {
      const res = await POST(
        createJsonRequest({ orderID: "ORDER-123", intent: "capture", pitcherId: "pid-1" })
      );
      const data = await res.json();
      expect(data.success).toBe(true);
      expect(data.newBalance).toBe(150);
    });

    it("returns 500 when updateFunds fails", async () => {
      mockUpdateFunds.mockResolvedValue({ success: false, error: "DB error" });
      const res = await POST(
        createJsonRequest({ orderID: "ORDER-123", intent: "capture", pitcherId: "pid-1" })
      );
      expect(res.status).toBe(500);
      const data = await res.json();
      expect(data.success).toBe(false);
    });
  });

  describe("error handling", () => {
    it("returns 500 when fetch throws", async () => {
      vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new Error("Network error")));
      const res = await POST(
        createJsonRequest({ orderID: "ORDER-123", intent: "capture", pitcherId: "pid-1" })
      );
      expect(res.status).toBe(500);
    });
  });
});
