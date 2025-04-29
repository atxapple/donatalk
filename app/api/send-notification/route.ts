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
        const msg = {
            to: [pitcherEmail, listenerEmail], // sending to both pitcher and listener
            from: process.env.SENDGRID_FROM_EMAIL!, // ✅ Your verified sender
            subject: `[DonaTalk] ${listenerName} wants to hear your pitch! 🚀`,
            html: `
              <!DOCTYPE html>
              <html lang="en">
              <head>
                <meta charset="UTF-8" />
                <title>DonaTalk - New Listener Interest</title>
              </head>
              <body style="margin: 0; padding: 0; background-color: #f5f5f5;">
                <div style="font-family: Arial, sans-serif; background-color: #ffffff; padding: 30px; border-radius: 8px; max-width: 600px; margin: 5px auto; border: 1px solid #e0e0e0;">
                  <div style="text-align: center; margin-bottom: 20px;">
                    <img src="https://app.donatalk.com/DonaTalk_icon_88x77.png" alt="DonaTalk Logo" style="max-width: 88px; height: auto;">
                  </div>
                  <h2 style="color: #2C3E50; text-align: center; margin-bottom: 20px;">New Listener Interest on DonaTalk</h2>
                  <p style="font-size: 16px; color: #333333;">Dear <strong>${pitcherName}</strong>,</p>
          
                  <p style="font-size: 16px; color: #333333;">
                    We’re happy to let you know that <strong style="color: #2C3E50;">${listenerName}</strong> 
                    (<a href="mailto:${listenerEmail}" style="color: #2C3E50;">${listenerEmail}</a>) is interested in hearing your pitch.
                  </p>
          
                  <p style="font-size: 16px; color: #333333;">Here’s their availability information:</p>
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


        // const msg = {
        //   to: [pitcherEmail, listenerEmail], // sending to both pitcher and listener
        //   from: process.env.SENDGRID_FROM_EMAIL!,     // ✅ Your verified sender
        //   subject: `[DonaTalk] New Listener Interest, ${listenerName}!`,
        //   html: `
        //     <h3 style="color: #F8A5A5;"> Congrulations! We are ready to arrange a meeting! ❤️ </h2>
        //     <p>Dear ${pitcherName},</p>
        //     <p>${listenerName} is interested in listening to your pitch. Please use the following availability info to schedule a meeting:</p>
        //     <p> ${message}</p>
        //     <p>We are excited to be part of your journey!</p>
        //     <p> <strong> Important: </strong> </p>       
        //     <p> Use this Zoomlink for the meeting: https://us06web.zoom.us/j/88318430995?pwd=TBQhuBCyMvPFbssAmmoyMpgnGbBpCh.1 </p>
        //     <p> Also, when arranging the meeting, copy support@donatalk.com and invite support@donatalk.com for the confirmation of the meeting </p>
        //     <p> Then, Happy DonaTalk :)
        //     <br />
        //     <p style="color: #888;">- DonaTalk Team</p>
        //   `,
        // };

        await sgMail.send(msg);

        return NextResponse.json({ success: true, message: 'Email sent successfully!' });
    } catch (error: any) {
        console.error('[Send Notification Error]', error.response?.body || error.message);
        return NextResponse.json({ success: false, error: error.message || 'Failed to send email.' }, { status: 500 });
    }
}
