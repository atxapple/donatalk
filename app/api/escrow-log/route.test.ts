import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { createJsonRequest } from "@/test/helpers";

const { mockSendEmail } = vi.hoisted(() => ({
  mockSendEmail: vi.fn().mockResolvedValue({ success: true }),
}));

vi.mock("@/lib/sendEmailfromListenerPage", () => ({
  sendEmailfromListenerPage: mockSendEmail,
}));

import { POST } from "./route";

const completedCaptureResponse = {
  id: "PAY-456",
  status: "COMPLETED",
  purchase_units: [
    {
      payments: {
        captures: [{ amount: { value: "112.50" } }],
      },
    },
  ],
};

const validBody = {
  orderID: "ORDER-123",
  intent: "capture",
  pitcherEmail: "alice@test.com",
  pitcherName: "Alice",
  listenerId: "lid-1",
  message: "I'm interested",
};

beforeEach(() => {
  process.env.NEXT_PUBLIC_BASE_URL = "http://localhost:3000";
  mockSendEmail.mockReset().mockResolvedValue({ success: true });

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

describe("POST /api/escrow-log", () => {
  describe("validation", () => {
    it("returns 400 when required fields are missing", async () => {
      const res = await POST(createJsonRequest({ orderID: "ORDER-123" }));
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
      const res = await POST(createJsonRequest(validBody));
      const data = await res.json();
      expect(data.success).toBe(false);
      expect(data.message).toContain("not completed");
    });
  });

  describe("email sending", () => {
    it("calls sendEmailfromListenerPage with correct args", async () => {
      await POST(createJsonRequest(validBody));
      expect(mockSendEmail).toHaveBeenCalledWith({
        pitcherName: "Alice",
        pitcherEmail: "alice@test.com",
        amountCaptured: 112.5,
        listenerId: "lid-1",
        message: "I'm interested",
      });
    });

    it("succeeds even when email throws", async () => {
      mockSendEmail.mockRejectedValue(new Error("Email failed"));
      const res = await POST(createJsonRequest(validBody));
      const data = await res.json();
      expect(data.success).toBe(true);
    });
  });

  describe("success", () => {
    it("returns success with COMPLETED status", async () => {
      const res = await POST(createJsonRequest(validBody));
      const data = await res.json();
      expect(data.success).toBe(true);
      expect(data.status).toBe("COMPLETED");
    });
  });

  describe("error handling", () => {
    it("returns 500 when fetch throws", async () => {
      vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new Error("Network error")));
      const res = await POST(createJsonRequest(validBody));
      expect(res.status).toBe(500);
      const data = await res.json();
      expect(data.success).toBe(false);
    });
  });
});
