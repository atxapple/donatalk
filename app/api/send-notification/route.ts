// app/api/send-notification/route.ts

import { NextResponse } from 'next/server';
import sgMail from '@sendgrid/mail';

sgMail.setApiKey(process.env.SENDGRID_API_KEY!);

export async function POST(req: Request) {
    try {
        const { pitcherName, pitcherEmail, listenerName, listenerEmail, message, donation, source } = await req.json();

        if (!pitcherName || !pitcherEmail || !listenerName || !listenerEmail || !message || !donation || !source) {
            return NextResponse.json({ error: 'Missing required fields.' }, { status: 400 });
        }

        console.log('[Send Notification]', pitcherName, pitcherEmail, listenerName, listenerEmail, message, donation, source);

        let subjectText = '';
        let bodyText1 = '';
        let bodyText2 = '';
        let bodyText3 = '';
        let bodyText4 = '';
        let bodyText5 = '';

        if (source === 'pitcherPage') {
          subjectText = `${listenerName} wants to hear your pitch! 🚀`;
          bodyText1 = 'Listener';          
          bodyText2 = pitcherName;
          bodyText3 = listenerName;
          bodyText4 = listenerEmail;
          bodyText5 = 'hearing your pitch';
        }
        
        if (source === 'listenerPage') {
          subjectText = `${pitcherName} wants to give you a pitch! 🚀`;
          bodyText1 = 'Pitcher';
          bodyText2 = listenerName;
          bodyText3 = pitcherName;
          bodyText4 = pitcherEmail;
          bodyText5 = 'giving you a pitch';
        }

        console.log('[Send Notification]', subjectText, bodyText1, bodyText2, bodyText3, bodyText4, bodyText5);

        const msg = {
            to: [pitcherEmail, listenerEmail], // sending to both pitcher and listener
            from: process.env.SENDGRID_FROM_EMAIL!, // ✅ Your verified sender
            bcc: 'atxapplellc@gmail.com',
            subject: `${subjectText}`,
            html: `
              <!DOCTYPE html>
              <html lang="en">
              <head>
                <meta charset="UTF-8" />
                <title>DonaTalk - New ${bodyText1} Interest</title>
              </head>
              <body style="margin: 0; padding: 0; background-color: #f5f5f5;">
                <div style="font-family: Arial, sans-serif; background-color: #ffffff; padding: 30px; border-radius: 8px; max-width: 600px; margin: 5px auto; border: 1px solid #e0e0e0;">
                  <div style="text-align: center; margin-bottom: 20px;">
                    <img src="https://app.donatalk.com/DonaTalk_icon_88x77.png" alt="DonaTalk Logo" style="max-width: 88px; height: auto;">
                  </div>
                  <h2 style="color: #2C3E50; text-align: center; margin-bottom: 20px;">New ${bodyText1} Interest on DonaTalk</h2>
                  <p style="font-size: 16px; color: #333333;">Dear <strong>${bodyText2}</strong>,</p>
          
                  <p style="font-size: 16px; color: #333333;">
                    We’re happy to let you know that <strong style="color: #2C3E50;">${bodyText3}</strong> 
                    (<a href="mailto:${bodyText4}" style="color: #2C3E50;">${bodyText4}</a>) is interested in ${bodyText5}.
                  </p>
          
                  <p style="font-size: 16px; color: #333333;">Here’s the availability information:</p>
                  <blockquote style="background-color:#f9f9f9; padding: 15px; font-size: 16px; border-left: 5px solid #2C3E50; border-radius: 6px; color: #2C3E50; white-space: pre-wrap;">
                    ${message}
                  </blockquote>
          
                  <p style="font-size: 16px; color: #333333;"><strong>Next steps:</strong></p>
                  <ul style="font-size: 16px; line-height: 1.6; color: #333333;">
                    <li>Reply to this email to coordinate the meeting time. Include 
                      <strong>support@donatalk.com</strong> in your response and calendar invite to confirm the meeting progress.
                    </li>
                    <li>Use this Zoom link for the meeting:<br/>
                      <a href="https://us06web.zoom.us/j/88318430995?pwd=TBQhuBCyMvPFbssAmmoyMpgnGbBpCh.1" 
                         style="color: #2C3E50; font-weight: bold;">
                         https://us06web.zoom.us/j/88318430995?pwd=TBQhuBCyMvPFbssAmmoyMpgnGbBpCh.1
                      </a>
                    </li>
                    <li> After the meeting, <strong> ${donation} USD </strong> will be sent to a non-profit organization.
                    </li>
                  </ul>
          
                  <p style="font-size: 16px; color: #333333;">
                    Thank you for using DonaTalk. We look forward to supporting your successful conversation.
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

        console.log('[Send Notification] :', msg);

        await sgMail.send(msg);

        return NextResponse.json({ success: true, message: 'Email sent successfully!' });
    } catch (error: any) {
        console.error('[Send Notification Error]', error.response?.body || error.message);
        return NextResponse.json({ success: false, error: error.message || 'Failed to send email.' }, { status: 500 });
    }
}