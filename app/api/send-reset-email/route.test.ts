import { describe, it, expect, vi, beforeEach } from 'vitest';

const { mockGeneratePasswordResetLink, mockSendMail } = vi.hoisted(() => ({
  mockGeneratePasswordResetLink: vi.fn(),
  mockSendMail: vi.fn(),
}));

vi.mock('@/lib/firebaseAdmin', () => ({
  adminAuth: { generatePasswordResetLink: mockGeneratePasswordResetLink },
}));

vi.mock('@/lib/mailer', () => ({
  transporter: { sendMail: mockSendMail },
  FROM_EMAIL: 'support@donatalk.com',
  BCC_EMAIL: 'atxapplellc@gmail.com',
}));

import { POST } from './route';
import { createJsonRequest } from '@/test/helpers';

beforeEach(() => {
  vi.clearAllMocks();
  mockGeneratePasswordResetLink.mockResolvedValue('https://example.com/reset?oobCode=abc123');
  mockSendMail.mockResolvedValue({ messageId: 'test-id' });
});

describe('POST /api/send-reset-email', () => {
  describe('validation', () => {
    it('returns 400 when email is missing', async () => {
      const res = await POST(createJsonRequest({}));
      expect(res.status).toBe(400);
      const data = await res.json();
      expect(data.error).toContain('Email is required');
    });

    it('returns 400 when email is empty string', async () => {
      const res = await POST(createJsonRequest({ email: '' }));
      expect(res.status).toBe(400);
    });

    it('returns 400 when email is not a string', async () => {
      const res = await POST(createJsonRequest({ email: 123 }));
      expect(res.status).toBe(400);
    });
  });

  describe('anti-enumeration', () => {
    it('returns success even when email does not exist in Firebase', async () => {
      mockGeneratePasswordResetLink.mockRejectedValue(new Error('User not found'));
      const res = await POST(createJsonRequest({ email: 'nonexistent@test.com' }));
      expect(res.status).toBe(200);
      const data = await res.json();
      expect(data.success).toBe(true);
    });

    it('does not send email when user does not exist', async () => {
      mockGeneratePasswordResetLink.mockRejectedValue(new Error('User not found'));
      await POST(createJsonRequest({ email: 'nonexistent@test.com' }));
      expect(mockSendMail).not.toHaveBeenCalled();
    });
  });

  describe('success', () => {
    it('returns 200 with success true', async () => {
      const res = await POST(createJsonRequest({ email: 'user@test.com' }));
      expect(res.status).toBe(200);
      const data = await res.json();
      expect(data.success).toBe(true);
    });

    it('generates reset link for the provided email', async () => {
      await POST(createJsonRequest({ email: 'user@test.com' }));
      expect(mockGeneratePasswordResetLink).toHaveBeenCalledWith('user@test.com');
    });

    it('sends email with correct recipient and subject', async () => {
      await POST(createJsonRequest({ email: 'user@test.com' }));
      expect(mockSendMail).toHaveBeenCalledWith(
        expect.objectContaining({
          to: 'user@test.com',
          bcc: 'atxapplellc@gmail.com',
          subject: 'Reset your DonaTalk password',
        })
      );
    });

    it('includes reset link in email HTML', async () => {
      await POST(createJsonRequest({ email: 'user@test.com' }));
      const call = mockSendMail.mock.calls[0][0];
      expect(call.html).toContain('https://example.com/reset?oobCode=abc123');
    });

    it('includes DonaTalk branding in email HTML', async () => {
      await POST(createJsonRequest({ email: 'user@test.com' }));
      const call = mockSendMail.mock.calls[0][0];
      expect(call.html).toContain('DonaTalk');
      expect(call.html).toContain('Reset Your Password');
      expect(call.html).toContain('DonaTalk_icon_88x77.png');
    });

    it('includes user email in email body', async () => {
      await POST(createJsonRequest({ email: 'user@test.com' }));
      const call = mockSendMail.mock.calls[0][0];
      expect(call.html).toContain('user@test.com');
    });
  });

  describe('error handling', () => {
    it('returns 500 when sendMail throws', async () => {
      mockSendMail.mockRejectedValue(new Error('SMTP error'));
      const res = await POST(createJsonRequest({ email: 'user@test.com' }));
      expect(res.status).toBe(500);
      const data = await res.json();
      expect(data.error).toContain('Failed to send reset email');
    });
  });
});
