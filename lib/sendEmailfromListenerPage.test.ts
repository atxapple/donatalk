import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

const mockGet = vi.fn();

vi.mock("firebase-admin/app", () => ({
  getApps: vi.fn().mockReturnValue(["app"]),
  initializeApp: vi.fn(),
  cert: vi.fn(),
}));

vi.mock("firebase-admin/firestore", () => ({
  getFirestore: vi.fn().mockReturnValue({
    collection: vi.fn().mockReturnValue({
      doc: vi.fn().mockReturnValue({
        get: mockGet,
      }),
    }),
  }),
}));

let sendEmailfromListenerPage: typeof import("@/lib/sendEmailfromListenerPage").sendEmailfromListenerPage;

beforeEach(async () => {
  vi.resetModules();
  mockGet.mockReset();

  // Default: listener exists
  mockGet.mockResolvedValue({
    exists: true,
    data: () => ({
      fullName: "Test Listener",
      email: "listener@test.com",
    }),
  });

  vi.stubGlobal(
    "fetch",
    vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ success: true }),
    })
  );

  const mod = await import("@/lib/sendEmailfromListenerPage");
  sendEmailfromListenerPage = mod.sendEmailfromListenerPage;
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe("sendEmailfromListenerPage", () => {
  describe("input validation", () => {
    it("returns error when pitcherEmail is empty", async () => {
      const result = await sendEmailfromListenerPage({
        pitcherName: "Alice",
        pitcherEmail: "",
        amountCaptured: 112.5,
        listenerId: "lid-1",
        message: "Hello",
      });
      expect(result.success).toBe(false);
      expect(result.error).toContain("Invalid input");
    });

    it("returns error when amountCaptured is not a number", async () => {
      const result = await sendEmailfromListenerPage({
        pitcherName: "Alice",
        pitcherEmail: "alice@test.com",
        amountCaptured: "100" as unknown as number,
        listenerId: "lid-1",
        message: "Hello",
      });
      expect(result.success).toBe(false);
      expect(result.error).toContain("Invalid input");
    });

    it("returns error when listenerId is empty", async () => {
      const result = await sendEmailfromListenerPage({
        pitcherName: "Alice",
        pitcherEmail: "alice@test.com",
        amountCaptured: 112.5,
        listenerId: "",
        message: "Hello",
      });
      expect(result.success).toBe(false);
      expect(result.error).toContain("Invalid input");
    });
  });

  describe("listener lookup", () => {
    it("returns error when listener doc does not exist", async () => {
      mockGet.mockResolvedValue({ exists: false });
      const result = await sendEmailfromListenerPage({
        pitcherName: "Alice",
        pitcherEmail: "alice@test.com",
        amountCaptured: 112.5,
        listenerId: "lid-missing",
        message: "Hello",
      });
      expect(result.success).toBe(false);
      expect(result.error).toContain("not found");
    });

    it("returns error when listener fullName is missing", async () => {
      mockGet.mockResolvedValue({
        exists: true,
        data: () => ({ fullName: "", email: "l@test.com" }),
      });
      const result = await sendEmailfromListenerPage({
        pitcherName: "Alice",
        pitcherEmail: "alice@test.com",
        amountCaptured: 112.5,
        listenerId: "lid-1",
        message: "Hello",
      });
      expect(result.success).toBe(false);
      expect(result.error).toContain("missing");
    });

    it("returns error when listener email is missing", async () => {
      mockGet.mockResolvedValue({
        exists: true,
        data: () => ({ fullName: "Bob", email: "" }),
      });
      const result = await sendEmailfromListenerPage({
        pitcherName: "Alice",
        pitcherEmail: "alice@test.com",
        amountCaptured: 112.5,
        listenerId: "lid-1",
        message: "Hello",
      });
      expect(result.success).toBe(false);
      expect(result.error).toContain("missing");
    });
  });

  describe("donation calculation", () => {
    it("correctly reverses the 12.5% fee (112.50 → 100.00)", async () => {
      await sendEmailfromListenerPage({
        pitcherName: "Alice",
        pitcherEmail: "alice@test.com",
        amountCaptured: 112.5,
        listenerId: "lid-1",
        message: "Hello",
      });
      const fetchMock = vi.mocked(global.fetch);
      const notificationCall = fetchMock.mock.calls.find((c) =>
        (c[0] as string).includes("/api/send-notification")
      );
      const body = JSON.parse(notificationCall![1]!.body as string);
      expect(body.donation).toBe(100);
    });

    it("rounds to 2 decimal places (56.25 → 50.00)", async () => {
      await sendEmailfromListenerPage({
        pitcherName: "Alice",
        pitcherEmail: "alice@test.com",
        amountCaptured: 56.25,
        listenerId: "lid-1",
        message: "Hello",
      });
      const fetchMock = vi.mocked(global.fetch);
      const notificationCall = fetchMock.mock.calls.find((c) =>
        (c[0] as string).includes("/api/send-notification")
      );
      const body = JSON.parse(notificationCall![1]!.body as string);
      expect(body.donation).toBe(50);
    });
  });

  describe("notification email", () => {
    it("calls send-notification with source 'listenerPage'", async () => {
      await sendEmailfromListenerPage({
        pitcherName: "Alice",
        pitcherEmail: "alice@test.com",
        amountCaptured: 112.5,
        listenerId: "lid-1",
        message: "I'm interested",
      });
      const fetchMock = vi.mocked(global.fetch);
      const notificationCall = fetchMock.mock.calls.find((c) =>
        (c[0] as string).includes("/api/send-notification")
      );
      const body = JSON.parse(notificationCall![1]!.body as string);
      expect(body.source).toBe("listenerPage");
      expect(body.pitcherName).toBe("Alice");
      expect(body.listenerName).toBe("Test Listener");
      expect(body.listenerEmail).toBe("listener@test.com");
      expect(body.message).toBe("I'm interested");
    });
  });

  describe("payment confirmation email", () => {
    it("sends amountCaptured (not reversed donation) as amountPaid", async () => {
      await sendEmailfromListenerPage({
        pitcherName: "Alice",
        pitcherEmail: "alice@test.com",
        amountCaptured: 112.5,
        listenerId: "lid-1",
        message: "Hello",
      });
      const fetchMock = vi.mocked(global.fetch);
      const paymentCall = fetchMock.mock.calls.find((c) =>
        (c[0] as string).includes("/api/send-payment-confirm-email")
      );
      const body = JSON.parse(paymentCall![1]!.body as string);
      expect(body.amountPaid).toBe(112.5);
    });
  });

  describe("success case", () => {
    it("returns success when all operations complete", async () => {
      const result = await sendEmailfromListenerPage({
        pitcherName: "Alice",
        pitcherEmail: "alice@test.com",
        amountCaptured: 112.5,
        listenerId: "lid-1",
        message: "Hello",
      });
      expect(result.success).toBe(true);
    });

    it("succeeds even when notification email fails", async () => {
      vi.stubGlobal(
        "fetch",
        vi.fn().mockResolvedValue({ ok: false })
      );
      const mod = await import("@/lib/sendEmailfromListenerPage");
      const result = await mod.sendEmailfromListenerPage({
        pitcherName: "Alice",
        pitcherEmail: "alice@test.com",
        amountCaptured: 112.5,
        listenerId: "lid-1",
        message: "Hello",
      });
      expect(result.success).toBe(true);
    });
  });

  describe("error handling", () => {
    it("catches Firestore errors", async () => {
      mockGet.mockRejectedValue(new Error("Firestore read failed"));
      const result = await sendEmailfromListenerPage({
        pitcherName: "Alice",
        pitcherEmail: "alice@test.com",
        amountCaptured: 112.5,
        listenerId: "lid-1",
        message: "Hello",
      });
      expect(result.success).toBe(false);
      expect(result.error).toContain("Firestore read failed");
    });
  });
});
