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
  fullName: "Alice Smith",
  email: "alice@test.com",
  userId: "uid-123",
  role: "pitcher",
};

beforeEach(() => {
  mockSendMail.mockReset().mockResolvedValue({ messageId: "test-id" });
});

describe("POST /api/send-signup-email", () => {
  describe("validation", () => {
    it("returns 400 when fullName is missing", async () => {
      const res = await POST(createJsonRequest({ ...validBody, fullName: "" }));
      expect(res.status).toBe(400);
    });

    it("returns 400 when email is missing", async () => {
      const res = await POST(createJsonRequest({ ...validBody, email: "" }));
      expect(res.status).toBe(400);
    });

    it("returns 400 when userId is missing", async () => {
      const res = await POST(createJsonRequest({ ...validBody, userId: "" }));
      expect(res.status).toBe(400);
    });

    it("returns 400 when role is missing", async () => {
      const res = await POST(createJsonRequest({ ...validBody, role: "" }));
      expect(res.status).toBe(400);
    });
  });

  describe("pitcher role", () => {
    it("includes pitcher-specific welcome message", async () => {
      await POST(createJsonRequest(validBody));
      const mailOptions = mockSendMail.mock.calls[0][0];
      expect(mailOptions.html).toContain("sharing your story");
    });

    it("includes add-funds instruction", async () => {
      await POST(createJsonRequest(validBody));
      const mailOptions = mockSendMail.mock.calls[0][0];
      expect(mailOptions.html).toContain("add funds");
    });
  });

  describe("listener role", () => {
    it("includes listener-specific welcome message", async () => {
      await POST(createJsonRequest({ ...validBody, role: "listener" }));
      const mailOptions = mockSendMail.mock.calls[0][0];
      expect(mailOptions.html).toContain("discovering a new story");
    });

    it("includes update-info instruction", async () => {
      await POST(createJsonRequest({ ...validBody, role: "listener" }));
      const mailOptions = mockSendMail.mock.calls[0][0];
      expect(mailOptions.html).toContain("update your information");
    });
  });

  describe("email sending", () => {
    it("sends to user email with BCC", async () => {
      await POST(createJsonRequest(validBody));
      const mailOptions = mockSendMail.mock.calls[0][0];
      expect(mailOptions.to).toEqual(["alice@test.com"]);
      expect(mailOptions.bcc).toBe("atxapplellc@gmail.com");
    });

    it("includes user name in subject", async () => {
      await POST(createJsonRequest(validBody));
      const mailOptions = mockSendMail.mock.calls[0][0];
      expect(mailOptions.subject).toContain("Alice Smith");
    });

    it("includes profile link with role and userId", async () => {
      await POST(createJsonRequest(validBody));
      const mailOptions = mockSendMail.mock.calls[0][0];
      expect(mailOptions.html).toContain("/pitcher/uid-123");
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
