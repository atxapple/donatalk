import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

const mockGet = vi.fn();
const mockUpdate = vi.fn();
const mockAdd = vi.fn();

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
        update: mockUpdate,
      }),
      add: mockAdd,
    }),
  }),
}));

let updateFunds: typeof import("@/lib/updateFunds").updateFunds;

beforeEach(async () => {
  vi.resetModules();
  mockGet.mockReset();
  mockUpdate.mockReset().mockResolvedValue(undefined);
  mockAdd.mockReset().mockResolvedValue({ id: "fund-doc-id" });

  // Default: pitcher exists with balance 100
  mockGet.mockResolvedValue({
    exists: true,
    data: () => ({
      fullName: "Test Pitcher",
      email: "pitcher@test.com",
      credit_balance: 100,
    }),
  });

  vi.stubGlobal(
    "fetch",
    vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ success: true }),
    })
  );

  const mod = await import("@/lib/updateFunds");
  updateFunds = mod.updateFunds;
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe("updateFunds", () => {
  describe("input validation", () => {
    it("returns error when pitcherId is empty", async () => {
      const result = await updateFunds({
        refID: "REF-1",
        pitcherId: "",
        amount: 50,
        eventType: "add_fund",
      });
      expect(result.success).toBe(false);
      expect(result.error).toContain("Invalid");
    });

    it("returns error when refID is empty", async () => {
      const result = await updateFunds({
        refID: "",
        pitcherId: "uid-1",
        amount: 50,
        eventType: "add_fund",
      });
      expect(result.success).toBe(false);
      expect(result.error).toContain("Invalid");
    });

    it("returns error when amount is not a number", async () => {
      const result = await updateFunds({
        refID: "REF-1",
        pitcherId: "uid-1",
        amount: "100" as unknown as number,
        eventType: "add_fund",
      });
      expect(result.success).toBe(false);
      expect(result.error).toContain("Invalid");
    });

    it("returns error when eventType is empty", async () => {
      const result = await updateFunds({
        refID: "REF-1",
        pitcherId: "uid-1",
        amount: 50,
        eventType: "",
      });
      expect(result.success).toBe(false);
      expect(result.error).toContain("Invalid");
    });
  });

  describe("pitcher lookup", () => {
    it("returns error when pitcher document does not exist", async () => {
      mockGet.mockResolvedValue({ exists: false });
      const result = await updateFunds({
        refID: "REF-1",
        pitcherId: "uid-missing",
        amount: 50,
        eventType: "add_fund",
      });
      expect(result.success).toBe(false);
      expect(result.error).toContain("not found");
    });
  });

  describe("balance calculation", () => {
    it("adds amount to existing credit_balance", async () => {
      const result = await updateFunds({
        refID: "REF-1",
        pitcherId: "uid-1",
        amount: 25,
        eventType: "add_fund",
      });
      expect(result.success).toBe(true);
      expect(result.newBalance).toBe(125);
      expect(mockUpdate).toHaveBeenCalledWith({ credit_balance: 125 });
    });

    it("treats missing credit_balance as 0", async () => {
      mockGet.mockResolvedValue({
        exists: true,
        data: () => ({ fullName: "No Balance", email: "nb@test.com" }),
      });
      const result = await updateFunds({
        refID: "REF-1",
        pitcherId: "uid-1",
        amount: 100,
        eventType: "add_fund",
      });
      expect(result.success).toBe(true);
      expect(result.newBalance).toBe(100);
      expect(mockUpdate).toHaveBeenCalledWith({ credit_balance: 100 });
    });

    it("handles decimal amounts correctly", async () => {
      mockGet.mockResolvedValue({
        exists: true,
        data: () => ({
          fullName: "Dec",
          email: "d@test.com",
          credit_balance: 10.5,
        }),
      });
      const result = await updateFunds({
        refID: "REF-1",
        pitcherId: "uid-1",
        amount: 5.75,
        eventType: "add_fund",
      });
      expect(result.success).toBe(true);
      expect(result.newBalance).toBe(16.25);
    });
  });

  describe("fund history logging", () => {
    it("logs correct fund_history document", async () => {
      await updateFunds({
        refID: "PAY-123",
        pitcherId: "uid-1",
        amount: 50,
        eventType: "add_fund",
      });
      expect(mockAdd).toHaveBeenCalledWith({
        amount: 50,
        eventType: "add_fund",
        paymentIntentRefId: "PAY-123",
        pitcherId: "uid-1",
        timestamp: expect.any(Date),
      });
    });
  });

  describe("email notification", () => {
    it("calls send-payment-confirm-email with correct payload", async () => {
      await updateFunds({
        refID: "REF-1",
        pitcherId: "uid-1",
        amount: 50,
        eventType: "add_fund",
      });
      const fetchMock = vi.mocked(global.fetch);
      expect(fetchMock).toHaveBeenCalledWith(
        expect.stringContaining("/api/send-payment-confirm-email"),
        expect.objectContaining({
          method: "POST",
          body: JSON.stringify({
            pitcherName: "Test Pitcher",
            pitcherEmail: "pitcher@test.com",
            amountPaid: 50,
          }),
        })
      );
    });

    it("succeeds even when email API fails", async () => {
      vi.stubGlobal(
        "fetch",
        vi.fn().mockResolvedValue({ ok: false })
      );
      const mod = await import("@/lib/updateFunds");
      const result = await mod.updateFunds({
        refID: "REF-1",
        pitcherId: "uid-1",
        amount: 50,
        eventType: "add_fund",
      });
      expect(result.success).toBe(true);
      expect(result.newBalance).toBe(150);
    });
  });

  describe("error handling", () => {
    it("catches Firestore update errors", async () => {
      mockUpdate.mockRejectedValue(new Error("Firestore write failed"));
      const result = await updateFunds({
        refID: "REF-1",
        pitcherId: "uid-1",
        amount: 50,
        eventType: "add_fund",
      });
      expect(result.success).toBe(false);
      expect(result.error).toContain("Firestore write failed");
    });
  });
});
