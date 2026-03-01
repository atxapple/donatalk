import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("nodemailer", () => {
  const sendMail = vi.fn().mockResolvedValue({ messageId: "test-id" });
  const createTransport = vi.fn().mockReturnValue({ sendMail });
  return { default: { createTransport } };
});

describe("mailer", () => {
  beforeEach(() => {
    vi.resetModules();
  });

  it("creates transporter with correct SMTP config", async () => {
    const nodemailer = await import("nodemailer");
    await import("./mailer");

    expect(nodemailer.default.createTransport).toHaveBeenCalledWith({
      host: "mail.donatalk.com",
      port: 465,
      secure: true,
      auth: {
        user: "support@donatalk.com",
        pass: process.env.EMAIL_PASSWORD,
      },
    });
  });

  it("exports correct FROM_EMAIL constant", async () => {
    const { FROM_EMAIL } = await import("./mailer");
    expect(FROM_EMAIL).toBe("support@donatalk.com");
  });

  it("exports correct BCC_EMAIL constant", async () => {
    const { BCC_EMAIL } = await import("./mailer");
    expect(BCC_EMAIL).toBe("atxapplellc@gmail.com");
  });
});
