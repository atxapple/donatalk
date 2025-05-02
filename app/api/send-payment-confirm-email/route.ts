// app/api/send-payment-confirm-email/route.ts

import { NextResponse } from 'next/server';
import sgMail from '@sendgrid/mail';

// ✅ Set your SendGrid API Key
sgMail.setApiKey(process.env.SENDGRID_API_KEY!);

export async function POST(req: Request) {

  // console.log('[Send Payment Confirm Email] :', req);

  try {
    const body = await req.json();
    // console.log('[body] :', body);
    const { pitcherName, pitcherEmail, amountPaid } = body;

    if (!pitcherName || !pitcherEmail || !amountPaid) {
      return NextResponse.json({ error: 'Missing required fields.' }, { status: 400 });
    }

    // Get current date in readable format (e.g., April 28, 2025)
    const paymentDate = new Date().toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });

    const msg = {
      to: [pitcherEmail],
      from: process.env.SENDGRID_FROM_EMAIL!,
      bcc: 'atxapplellc@gmail.com',
      subject: `✅ Payment Confirmed – Thank You, ${pitcherName}!`,
      html: `
        <!DOCTYPE html>
        <html lang="en">
        <head>
          <meta charset="UTF-8" />
          <title>Payment Confirmation - DonaTalk</title>
        </head>
        <body style="margin: 0; padding: 0; background-color: #f5f5f5;">
          <div style="font-family: Arial, sans-serif; background-color: #ffffff; padding: 30px; border-radius: 8px; max-width: 600px; margin: 5px auto; border: 1px solid #e0e0e0;">
            <div style="text-align: center; margin-bottom: 20px;">
              <img src="https://app.donatalk.com/DonaTalk_icon_88x77.png" alt="DonaTalk Logo" style="max-width: 88px; height: auto;">
            </div>
            <h2 style="color: #2C3E50; text-align: center; margin-bottom: 20px;">Payment Confirmed 🎉</h2>
            <p style="font-size: 16px; color: #333333;">
              Hi <strong>${pitcherName}</strong>,
            </p>
            <p style="font-size: 16px; color: #333333;">
               We have successfully received your payment of <strong>$${amountPaid}</strong> on <strong>${paymentDate}</strong>.
            </p>

            <p style="font-size: 16px; color: #333333;">
              Thank you for funding your account on <strong>DonaTalk</strong>. You can now continue sharing your pitch and scheduling meetings with listeners.
            </p>

            <div style="text-align: center; margin: 30px 0;">
              <a href="https://app.donatalk.com/pitcher/profile" 
                 style="background-color: #2C3E50; color: #ffffff; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold;">
                View Your Profile
              </a>
            </div>

            <p style="font-size: 16px; color: #333333;">
              If you have any questions, feel free to contact us at 
              <a href="mailto:support@donatalk.com" style="color: #2C3E50;">support@donatalk.com</a>.
            </p>

            <p style="font-size: 16px; color: #333333;">Best regards,</p>
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

    console.log('[Payment Confirmation Email]', msg);

    await sgMail.send(msg);
    return NextResponse.json({ success: true, message: 'Payment confirmation email sent successfully.' }, { status: 200 });
  } catch (error: any) {
    console.error('[Payment Confirmation Email Error]', error.response?.body || error.message);
    return NextResponse.json({ error: 'Failed to send payment confirmation email.' }, { status: 500 });
  }
}
