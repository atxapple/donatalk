import type { NextApiRequest, NextApiResponse } from 'next';
import sendgrid from '@sendgrid/mail';

sendgrid.setApiKey(process.env.SENDGRID_API_KEY!);

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    const { pitcherEmail, listenerName, listenerEmail, message } = req.body;

    if (!pitcherEmail || !listenerName || !listenerEmail || !message) {
        return res.status(400).json({ error: 'Missing required fields' });
    }

    try {
        const emailContent = {
            to: [pitcherEmail, listenerEmail],
            from: process.env.SENDGRID_FROM_EMAIL!, // e.g., verified sender like "noreply@donatalk.com"
            subject: `New Listener Request from ${listenerName}`,
            text: `
Hi ${pitcherEmail},

${listenerName} (${listenerEmail}) wants to talk to you!

Message: ${message}

Please reply to them to arrange your meeting.

– DonaTalk
      `,
            html: `
        <p><strong>${listenerName}</strong> (<a href="mailto:${listenerEmail}">${listenerEmail}</a>) wants to talk to you!</p>
        <p><strong>Message:</strong><br/>${message}</p>
        <p>Please reply to them to arrange your meeting.</p>
        <p>– <strong>DonaTalk</strong></p>
      `,
        };

        await sendgrid.send(emailContent);
        console.log('[Email Debug] Email sent via SendGrid');
        console.log('[Email Debug] Sending email with content:', {
            to: pitcherEmail,
            from: process.env.SENDGRID_FROM_EMAIL,
            listenerName,
            listenerEmail,
            message
        });

        return res.status(200).json({ success: true });
    } catch (error: any) {
        console.error('[SendGrid Error]', error?.response?.body || error.message || error);
        return res.status(500).json({
            error: 'Email failed to send',
            details: error?.response?.body || error.message,
        });
    }
}
