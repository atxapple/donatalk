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
  listenerName: "Bob",
  listenerEmail: "bob@test.com",
  message: "I'm available Tuesday",
  donation: 100,
  source: "pitcherPage",
};

beforeEach(() => {
  mockSendMail.mockReset().mockResolvedValue({ messageId: "test-id" });
});

describe("POST /api/send-notification", () => {
  describe("validation", () => {
    const requiredFields = [
      "pitcherName",
      "pitcherEmail",
      "listenerName",
      "listenerEmail",
      "message",
      "donation",
      "source",
    ];

    for (const field of requiredFields) {
      it(`returns 400 when ${field} is missing`, async () => {
        const body = { ...validBody, [field]: "" };
        const res = await POST(createJsonRequest(body));
        expect(res.status).toBe(400);
        const data = await res.json();
        expect(data.error).toContain("Missing required fields");
      });
    }
  });

  describe("pitcherPage source", () => {
    it("uses correct subject and body text", async () => {
      await POST(createJsonRequest(validBody));
      const mailOptions = mockSendMail.mock.calls[0][0];
      expect(mailOptions.subject).toContain("Bob wants to hear your pitch!");
      expect(mailOptions.html).toContain("Listener");
      expect(mailOptions.html).toContain("hearing your pitch");
    });
  });

  describe("listenerPage source", () => {
    it("uses correct subject and body text", async () => {
      await POST(createJsonRequest({ ...validBody, source: "listenerPage" }));
      const mailOptions = mockSendMail.mock.calls[0][0];
      expect(mailOptions.subject).toContain("Alice wants to give you a pitch!");
      expect(mailOptions.html).toContain("Pitcher");
      expect(mailOptions.html).toContain("giving you a pitch");
    });
  });

  describe("email sending", () => {
    it("sends to both pitcher and listener with BCC", async () => {
      await POST(createJsonRequest(validBody));
      const mailOptions = mockSendMail.mock.calls[0][0];
      expect(mailOptions.to).toEqual(["alice@test.com", "bob@test.com"]);
      expect(mailOptions.from).toBe("support@donatalk.com");
      expect(mailOptions.bcc).toBe("atxapplellc@gmail.com");
    });

    it("includes donation amount in email body", async () => {
      await POST(createJsonRequest(validBody));
      const mailOptions = mockSendMail.mock.calls[0][0];
      expect(mailOptions.html).toContain("100 USD");
    });

    it("returns success", async () => {
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
      expect(data.success).toBe(false);
    });
  });
});
