import { NextResponse } from 'next/server';
import { adminAuth } from '@/lib/firebaseAdmin';
import { transporter, FROM_EMAIL, BCC_EMAIL } from '@/lib/mailer';

export async function POST(req: Request) {
  try {
    const { email } = await req.json();

    if (!email || typeof email !== 'string') {
      return NextResponse.json({ error: 'Email is required' }, { status: 400 });
    }

    let resetLink: string;
    try {
      resetLink = await adminAuth.generatePasswordResetLink(email);
    } catch {
      // Don't reveal whether the email exists (prevent enumeration)
      return NextResponse.json({ success: true });
    }

    const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <title>Reset Your Password - DonaTalk</title>
</head>
<body style="margin: 0; padding: 0; background-color: #f5f5f5;">
  <div style="font-family: Arial, sans-serif; background-color: #ffffff; padding: 30px; border-radius: 8px; max-width: 600px; margin: 5px auto; border: 1px solid #e0e0e0;">
    <div style="text-align: center; margin-bottom: 20px;">
      <img src="https://app.donatalk.com/DonaTalk_icon_88x77.png" alt="DonaTalk Logo" style="max-width: 88px; height: auto;">
    </div>
    <h2 style="color: #2C3E50; text-align: center; margin-bottom: 20px;">Reset Your Password</h2>
    <p style="font-size: 16px; color: #333333;">
      Hi there,
    </p>
    <p style="font-size: 16px; color: #333333;">
      We received a request to reset the password for your <strong>DonaTalk</strong> account (<strong>${email}</strong>).
    </p>
    <p style="font-size: 16px; color: #333333;">
      Click the button below to set a new password:
    </p>

    <div style="text-align: center; margin: 30px 0;">
      <a href="${resetLink}"
         style="background-color: #2C3E50; color: #ffffff; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold;">
        Reset Password
      </a>
    </div>

    <p style="font-size: 14px; color: #666666;">
      If the button doesn't work, copy and paste this link into your browser:
    </p>
    <p style="font-size: 14px; color: #2C3E50; word-break: break-all;">
      ${resetLink}
    </p>

    <p style="font-size: 16px; color: #333333;">
      If you didn't request a password reset, you can safely ignore this email. Your password will remain unchanged.
    </p>

    <p style="font-size: 16px; color: #333333;">Best regards,</p>
    <p style="color: #888888; font-size: 14px;">– The DonaTalk Team</p>

    <hr style="margin-top: 30px; border: none; border-top: 1px solid #e0e0e0;">
    <p style="text-align: center; font-size: 12px; color: #aaaaaa;">
      &copy; 2025 DonaTalk. All rights reserved.
    </p>
  </div>
</body>
</html>`;

    await transporter.sendMail({
      from: `"DonaTalk" <${FROM_EMAIL}>`,
      to: email,
      bcc: BCC_EMAIL,
      subject: 'Reset your DonaTalk password',
      html,
    });

    return NextResponse.json({ success: true });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    console.error('[Reset Email Error]', message);
    return NextResponse.json({ error: 'Failed to send reset email' }, { status: 500 });
  }
}
