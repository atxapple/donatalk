import { describe, it, expect, vi, beforeEach } from "vitest";
import { createJsonRequest } from "@/test/helpers";

const { mockSendMail } = vi.hoisted(() => ({
  mockSendMail: vi.fn().mockResolvedValue({ messageId: "test-id" }),
}));

vi.mock("@/lib/mailer", () => ({
  transporter: { sendMail: mockSendMail },
  FROM_EMAIL: "support@donatalk.com",
  BCC_EMAIL: "atxapplellc@gmail.com",
}));

import { POST } from "./route";

const validBody = {
  pitcherName: "Alice",
  pitcherEmail: "alice@test.com",
  amountPaid: 112.5,
};

beforeEach(() => {
  mockSendMail.mockReset().mockResolvedValue({ messageId: "test-id" });
});

describe("POST /api/send-payment-confirm-email", () => {
  describe("validation", () => {
    it("returns 400 when pitcherName is missing", async () => {
      const res = await POST(createJsonRequest({ ...validBody, pitcherName: "" }));
      expect(res.status).toBe(400);
    });

    it("returns 400 when pitcherEmail is missing", async () => {
      const res = await POST(createJsonRequest({ ...validBody, pitcherEmail: "" }));
      expect(res.status).toBe(400);
    });

    it("returns 400 when amountPaid is missing", async () => {
      const res = await POST(createJsonRequest({ ...validBody, amountPaid: 0 }));
      expect(res.status).toBe(400);
    });
  });

  describe("email content", () => {
    it("sends to pitcherEmail with BCC", async () => {
      await POST(createJsonRequest(validBody));
      const mailOptions = mockSendMail.mock.calls[0][0];
      expect(mailOptions.to).toEqual(["alice@test.com"]);
      expect(mailOptions.bcc).toBe("atxapplellc@gmail.com");
    });

    it("includes pitcher name in subject", async () => {
      await POST(createJsonRequest(validBody));
      const mailOptions = mockSendMail.mock.calls[0][0];
      expect(mailOptions.subject).toContain("Alice");
    });

    it("includes amount in email body", async () => {
      await POST(createJsonRequest(validBody));
      const mailOptions = mockSendMail.mock.calls[0][0];
      expect(mailOptions.html).toContain("$112.5");
    });
  });

  describe("success", () => {
    it("returns 200 with success message", async () => {
      const res = await POST(createJsonRequest(validBody));
      expect(res.status).toBe(200);
      const data = await res.json();
      expect(data.success).toBe(true);
    });
  });

  describe("error handling", () => {
    it("returns 500 when sendMail throws", async () => {
      mockSendMail.mockRejectedValue(new Error("SMTP error"));
      const res = await POST(createJsonRequest(validBody));
      expect(res.status).toBe(500);
      const data = await res.json();
      expect(data.error).toContain("Failed to send");
    });
  });
});
