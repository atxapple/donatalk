import { NextResponse } from 'next/server';
import sgMail from '@sendgrid/mail';

// Set your SendGrid API Key
sgMail.setApiKey(process.env.SENDGRID_API_KEY!);

export async function POST(req: Request) {
    try {
        const body = await req.json();
        const { pitcherName, pitcherEmail, pitcherId } = body;

        if (!pitcherName || !pitcherEmail || !pitcherId) {
            return NextResponse.json({ error: 'Missing required fields.' }, { status: 400 });
        }

        const msg = {
            to: [pitcherEmail],
            from: process.env.SENDGRID_FROM_EMAIL!,
            subject: `🎉 Welcome to DonaTalk, ${pitcherName}!`,
            html: `
        <!DOCTYPE html>
        <html lang="en">
        <head>
          <meta charset="UTF-8" />
          <title>Welcome to DonaTalk</title>
        </head>
        <body style="margin: 0; padding: 0; background-color: #f5f5f5;">
          <div style="font-family: Arial, sans-serif; background-color: #ffffff; padding: 30px; border-radius: 8px; max-width: 600px; margin: 40px auto; border: 1px solid #e0e0e0;">
            <div style="text-align: center; margin-bottom: 20px;">
              <img src="https://app.donatalk.com/DonaTalk_icon_88x77.png" alt="DonaTalk Logo" style="max-width: 88px; height: auto;">
            </div>
            <h2 style="color: #2C3E50; text-align: center; margin-bottom: 20px;">Welcome to DonaTalk, ${pitcherName}! 🎉</h2>
            <p style="font-size: 16px; color: #333333;">
              Thank you for signing up as a Pitcher on <strong>DonaTalk</strong>. We're excited to support you in sharing your story.
            </p>

            <p style="font-size: 16px; color: #333333;">
              Your personal pitch page has been created below. Please make sure to add funds to your account at <a href="https://app.donatalk.com/pitcher/profile"> your profile page</a>. Then, the page is ready to share!
            </p>

            <blockquote style="background-color:#F8A5A5; padding: 15px; font-size: 16px; border-left: 5px solid #E74C3C; border-radius: 6px; color: #000000; white-space: pre-wrap;">
                https://app.donatalk.com/pitcher/${pitcherId}
            </blockquote>

            <p style="font-size: 16px; color: #333333;">
              If you have any questions or need assistance, feel free to reach out to us at 
              <a href="mailto:support@donatalk.com" style="color: #2C3E50;">support@donatalk.com</a>.
            </p>

            <p style="font-size: 16px; color: #333333;">We’re thrilled to have you onboard. Let’s make a difference together!</p>

            <p style="font-size: 16px; color: #333333;">Warmly,</p>
            <p style="color: #888888; font-size: 14px;">– The DonaTalk Team</p>

            <hr style="margin-top: 30px; border: none; border-top: 1px solid #e0e0e0;">
            <p style="text-align: center; font-size: 12px; color: #aaaaaa;">
              © 2025 DonaTalk. All rights reserved.
            </p>
          </div>
        </body>
        </html>
      `,
        };

        await sgMail.send(msg);
        return NextResponse.json({ success: true, message: 'Signup email sent successfully.' }, { status: 200 });
    } catch (error: any) {
        console.error('[Signup Email Error]', error.response?.body || error.message);
        return NextResponse.json({ error: 'Failed to send signup email.' }, { status: 500 });
    }
}
