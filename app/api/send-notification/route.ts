import { NextResponse } from 'next/server';
import sgMail from '@sendgrid/mail';

sgMail.setApiKey(process.env.SENDGRID_API_KEY!);

export async function POST(req: Request) {
  try {
    const { pitcherEmail, listenerName, listenerEmail, message } = await req.json();

    if (!pitcherEmail || !listenerName || !listenerEmail || !message) {
      return NextResponse.json({ success: false, error: 'Missing required fields.' }, { status: 400 });
    }

    const msg = {
      to: [pitcherEmail, listenerEmail], // sending to both pitcher and listener
      from: process.env.SENDGRID_FROM_EMAIL!,     // ✅ Your verified sender
      subject: 'DonaTalk Notification - New Sign-Up',
      html: `
        <h1 style="color: #E74C3C;">Welcome to DonaTalk!</h1>
        <p>Dear ${listenerName},</p>
        <p>Thank you for signing up and connecting with ${pitcherEmail} through DonaTalk.</p>
        <p><strong>Message:</strong> ${message}</p>
        <p>We are excited to be part of your journey!</p>
        <br />
        <p style="color: #888;">- DonaTalk Team</p>
      `,
    };

    await sgMail.send(msg);

    return NextResponse.json({ success: true, message: 'Email sent successfully!' });
  } catch (error: any) {
    console.error('[Send Notification Error]', error.response?.body || error.message);
    return NextResponse.json({ success: false, error: error.message || 'Failed to send email.' }, { status: 500 });
  }
}
