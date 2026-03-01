import { describe, it, expect, vi, beforeEach } from "vitest";
import { createJsonRequest } from "@/test/helpers";

const { mockAddDoc, mockCollection, mockTimestamp } = vi.hoisted(() => ({
  mockAddDoc: vi.fn().mockResolvedValue({ id: "meeting-123" }),
  mockCollection: vi.fn().mockReturnValue("meetings-ref"),
  mockTimestamp: { now: vi.fn().mockReturnValue({ seconds: 1234567890 }) },
}));

vi.mock("@/firebase/clientApp", () => ({
  firestore: {},
}));

vi.mock("firebase/firestore", () => ({
  collection: mockCollection,
  addDoc: mockAddDoc,
  Timestamp: mockTimestamp,
}));

import { POST } from "./route";

const validBody = {
  meetingsource: "pitcherPage",
  listenerId: "lid-1",
  listenerName: "Bob",
  listenerEmail: "bob@test.com",
  pitcherId: "pid-1",
  pitcherName: "Alice",
  pitcherEmail: "alice@test.com",
  availability: "Tuesday 3pm",
};

beforeEach(() => {
  mockAddDoc.mockReset().mockResolvedValue({ id: "meeting-123" });
});

describe("POST /api/create-meeting", () => {
  describe("validation", () => {
    const requiredFields = [
      "listenerId",
      "listenerName",
      "listenerEmail",
      "pitcherId",
      "pitcherName",
      "pitcherEmail",
      "availability",
    ];

    for (const field of requiredFields) {
      it(`returns 400 when ${field} is missing`, async () => {
        const body = { ...validBody, [field]: "" };
        const res = await POST(createJsonRequest(body));
        expect(res.status).toBe(400);
      });
    }
  });

  describe("meeting creation", () => {
    it("creates meeting document and returns meetingId", async () => {
      const res = await POST(createJsonRequest(validBody));
      expect(res.status).toBe(200);
      const data = await res.json();
      expect(data.success).toBe(true);
      expect(data.meetingId).toBe("meeting-123");
      expect(mockAddDoc).toHaveBeenCalled();
    });

    it("sets status to pending", async () => {
      await POST(createJsonRequest(validBody));
      const meetingData = mockAddDoc.mock.calls[0][1];
      expect(meetingData.status).toBe("pending");
    });
  });

  describe("known bugs (regression tests)", () => {
    it("BUG: hardcodes meetingsource to 'listenerPage'", async () => {
      await POST(createJsonRequest({ ...validBody, meetingsource: "pitcherPage" }));
      const meetingData = mockAddDoc.mock.calls[0][1];
      expect(meetingData.meetingsource).toBe("listenerPage");
    });

    it("BUG: overwrites listenerName, listenerEmail, pitcherId with empty strings", async () => {
      await POST(createJsonRequest(validBody));
      const meetingData = mockAddDoc.mock.calls[0][1];
      expect(meetingData.listenerName).toBe("");
      expect(meetingData.listenerEmail).toBe("");
      expect(meetingData.pitcherId).toBe("");
    });
  });

  describe("error handling", () => {
    it("returns 500 when addDoc throws", async () => {
      mockAddDoc.mockRejectedValue(new Error("Firestore error"));
      const res = await POST(createJsonRequest(validBody));
      expect(res.status).toBe(500);
      const data = await res.json();
      expect(data.error).toContain("Failed to create meeting");
    });
  });
});
