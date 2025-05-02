//  app/api/send-signup-email/route.ts

import { NextResponse } from 'next/server';
import sgMail from '@sendgrid/mail';

// Set your SendGrid API Key
sgMail.setApiKey(process.env.SENDGRID_API_KEY!);

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { fullName, email, userId, role } = body;

    if (!fullName || !email || !userId || !role) {
      return NextResponse.json({ error: 'Missing required fields.' }, { status: 400 });
    }
    
    let customMsg1 = '';
    let customMsg2 = '';
    let customMsg3 = '';
    if (role === 'pitcher') {   
      customMsg1 = 'We are excited to support you in sharing your story.'
      customMsg2 = 'Please make sure to add funds to your account at '
      customMsg3 = 'Then, the page is ready to share!';
    }
    if (role === 'listener') {
      customMsg1 = 'We are excited to support you in discovering a new story.'
      customMsg2 = 'You can update your information at '
      customMsg3 = '';
    }

    const msg = {
      to: [email],
      from: process.env.SENDGRID_FROM_EMAIL!,
      bcc: 'atxapplellc@gmail.com',
      subject: `🎉 Welcome to DonaTalk, ${fullName}!`,
      html: `
        <!DOCTYPE html>
        <html lang="en">
        <head>
          <meta charset="UTF-8" />
          <title>Welcome to DonaTalk</title>
        </head>
        <body style="margin: 0; padding: 0; background-color: #f5f5f5;">
          <div style="font-family: Arial, sans-serif; background-color: #ffffff; padding: 30px; border-radius: 8px; max-width: 600px; margin: 5px auto; border: 1px solid #e0e0e0;">
            <div style="text-align: center; margin-bottom: 20px;">
              <img src="https://app.donatalk.com/DonaTalk_icon_88x77.png" alt="DonaTalk Logo" style="max-width: 88px; height: auto;">
            </div>
            <h2 style="color: #2C3E50; text-align: center; margin-bottom: 20px;">Welcome to DonaTalk, ${fullName}! 🎉</h2>
            <p style="font-size: 16px; color: #333333;">
              Thank you for signing up as a ${role} on <strong>DonaTalk</strong>. ${customMsg1}
            </p>

            <p style="font-size: 16px; color: #333333;">
              Your personal page has been created below. ${customMsg2} <a href="https://app.donatalk.com/pitcher/profile"> your profile page</a>. ${customMsg3}
            </p>

            <blockquote style="background-color: #F8A5A5; margin: 5px; padding-top: 30px; padding-bottom: 10px; font-size: 16px; border-left: 5px solid #E74C3C; border-radius: 6px; color: #000000; white-space: pre-wrap; text-align: center; display: flex; align-items: center; justify-content: center; min-height: 50px; width: 100%;">
              <a href="https://app.donatalk.com/pitcher/${userId}" style="color: #2C3E50; text-decoration: none; font-weight: bold;">
                https://app.donatalk.com/${role}/${userId} 
              </a>
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

    console.log('[Signup Email]', msg);
    
    await sgMail.send(msg);
    return NextResponse.json({ success: true, message: 'Signup email sent successfully.' }, { status: 200 });
  } catch (error: any) {
    console.error('[Signup Email Error]', error.response?.body || error.message);
    return NextResponse.json({ error: 'Failed to send signup email.' }, { status: 500 });
  }
}
