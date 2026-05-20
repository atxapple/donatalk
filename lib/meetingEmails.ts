import { transporter, FROM_EMAIL, BCC_EMAIL } from '@/lib/mailer';

const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';
const YEAR = new Date().getFullYear();

type ReservationEmailParams = {
  meetingId: string;
  rawToken: string;
  pitcherName: string;
  listenerName: string;
  listenerEmail: string;
  amount: number;
  availability: string;
  donationAmount: number;
};

type PendingEmailParams = {
  meetingId: string;
  rawToken: string;
  pitcherName: string;
  pitcherEmail: string;
  listenerName: string;
  amount: number;
  availability: string;
  donationAmount: number;
};

type DeclineEmailParams = {
  recipientName: string;
  recipientEmail: string;
  otherPartyName: string;
  amountReleased: number | null;
};

type CancelEmailParams = {
  recipientName: string;
  recipientEmail: string;
  otherPartyName: string;
  visitorRole: 'pitcher' | 'listener';
};

type AcceptConfirmationParams = {
  recipientName: string;
  recipientEmail: string;
  otherPartyName: string;
  amount: number;
};

function acceptUrl(meetingId: string, token: string) {
  return `${BASE_URL}/api/meeting/${meetingId}/accept?token=${encodeURIComponent(token)}`;
}

function declineUrl(meetingId: string, token: string) {
  return `${BASE_URL}/api/meeting/${meetingId}/decline?token=${encodeURIComponent(token)}`;
}

function buttons(meetingId: string, token: string, acceptLabel: string, declineLabel: string) {
  return `
    <div style="text-align:center;margin:30px 0;">
      <a href="${acceptUrl(meetingId, token)}"
         style="display:inline-block;background-color:#27ae60;color:#ffffff;padding:12px 28px;text-decoration:none;border-radius:6px;font-weight:bold;margin:0 8px;">
        ${acceptLabel}
      </a>
      <a href="${declineUrl(meetingId, token)}"
         style="display:inline-block;background-color:#c0392b;color:#ffffff;padding:12px 28px;text-decoration:none;border-radius:6px;font-weight:bold;margin:0 8px;">
        ${declineLabel}
      </a>
    </div>
    <p style="font-size:13px;color:#888;text-align:center;">These links expire 14 days from now.</p>
  `;
}

function footer() {
  return `
    <hr style="margin-top:30px;border:none;border-top:1px solid #e0e0e0;">
    <p style="text-align:center;font-size:12px;color:#aaa;">© ${YEAR} DonaTalk. All rights reserved.</p>
  `;
}

export async function sendReservationEmailToListener(p: ReservationEmailParams) {
  const html = `
    <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;padding:20px;">
      <h2 style="color:#2C3E50;">${p.pitcherName} wants to pitch to you on DonaTalk</h2>
      <p style="font-size:16px;color:#333;">Hi ${p.listenerName},</p>
      <p style="font-size:16px;color:#333;">
        <strong>${p.pitcherName}</strong> has requested a meeting and reserved
        <strong>$${p.amount.toFixed(2)}</strong> from their DonaTalk balance.
        If you accept, <strong>$${p.donationAmount.toFixed(2)}</strong> will be sent to support
        a non-profit organization after the meeting.
      </p>
      <p style="font-size:16px;color:#333;"><strong>Their availability message:</strong></p>
      <blockquote style="border-left:3px solid #2C3E50;margin:0 0 16px;padding:8px 16px;background:#f7f7f7;">
        ${p.availability.replace(/</g, '&lt;')}
      </blockquote>
      ${buttons(p.meetingId, p.rawToken, '✓ Accept', '✗ Decline')}
      <p style="font-size:14px;color:#555;">If you accept, you'll receive the meeting link by email.</p>
      ${footer()}
    </div>
  `;
  await transporter.sendMail({
    from: FROM_EMAIL,
    to: p.listenerEmail,
    bcc: BCC_EMAIL,
    subject: `${p.pitcherName} wants to pitch to you on DonaTalk`,
    html,
  });
}

export async function sendPendingRequestEmailToPitcher(p: PendingEmailParams) {
  const html = `
    <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;padding:20px;">
      <h2 style="color:#2C3E50;">${p.listenerName} wants to hear your pitch</h2>
      <p style="font-size:16px;color:#333;">Hi ${p.pitcherName},</p>
      <p style="font-size:16px;color:#333;">
        <strong>${p.listenerName}</strong> has requested a meeting to hear your pitch.
        If you accept, <strong>$${p.amount.toFixed(2)}</strong> will be deducted from your balance
        and <strong>$${p.donationAmount.toFixed(2)}</strong> will be sent to support their non-profit.
      </p>
      <p style="font-size:16px;color:#333;"><strong>Their availability message:</strong></p>
      <blockquote style="border-left:3px solid #2C3E50;margin:0 0 16px;padding:8px 16px;background:#f7f7f7;">
        ${p.availability.replace(/</g, '&lt;')}
      </blockquote>
      ${buttons(p.meetingId, p.rawToken, '✓ Accept', '✗ Decline')}
      ${footer()}
    </div>
  `;
  await transporter.sendMail({
    from: FROM_EMAIL,
    to: p.pitcherEmail,
    bcc: BCC_EMAIL,
    subject: `${p.listenerName} wants to hear your pitch on DonaTalk`,
    html,
  });
}

export async function sendDeclineNoticeToVisitor(p: DeclineEmailParams) {
  const releaseLine = p.amountReleased
    ? `<p style="font-size:16px;color:#333;">Your <strong>$${p.amountReleased.toFixed(2)}</strong> reservation has been released back to your balance.</p>`
    : '';
  const html = `
    <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;padding:20px;">
      <h2 style="color:#2C3E50;">Update on your DonaTalk request</h2>
      <p style="font-size:16px;color:#333;">Hi ${p.recipientName},</p>
      <p style="font-size:16px;color:#333;">
        Unfortunately, <strong>${p.otherPartyName}</strong> declined your meeting request.
      </p>
      ${releaseLine}
      <p style="font-size:16px;color:#333;">There are plenty of other people on DonaTalk who'd love to chat with you.</p>
      ${footer()}
    </div>
  `;
  await transporter.sendMail({
    from: FROM_EMAIL,
    to: p.recipientEmail,
    bcc: BCC_EMAIL,
    subject: 'Update on your DonaTalk request',
    html,
  });
}

export async function sendCancellationNoticeToOwner(p: CancelEmailParams) {
  const html = `
    <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;padding:20px;">
      <h2 style="color:#2C3E50;">A DonaTalk request was withdrawn</h2>
      <p style="font-size:16px;color:#333;">Hi ${p.recipientName},</p>
      <p style="font-size:16px;color:#333;">
        The ${p.visitorRole} who sent you a meeting request (<strong>${p.otherPartyName}</strong>)
        has withdrawn it. No action is needed on your end.
      </p>
      ${footer()}
    </div>
  `;
  await transporter.sendMail({
    from: FROM_EMAIL,
    to: p.recipientEmail,
    bcc: BCC_EMAIL,
    subject: 'A DonaTalk request was withdrawn',
    html,
  });
}

export async function sendAcceptConfirmationEmail(p: AcceptConfirmationParams) {
  const html = `
    <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;padding:20px;">
      <h2 style="color:#2C3E50;">Meeting confirmed on DonaTalk</h2>
      <p style="font-size:16px;color:#333;">Hi ${p.recipientName},</p>
      <p style="font-size:16px;color:#333;">
        Your meeting with <strong>${p.otherPartyName}</strong> is confirmed.
        The <strong>$${p.amount.toFixed(2)}</strong> donation is now held in escrow.
      </p>
      <p style="font-size:14px;color:#555;background:#f7f7f7;padding:12px;border-radius:6px;">
        <strong>How escrow works:</strong> the donation stays in DonaTalk's hold until
        the meeting happens. Either side can mark the meeting as completed in their
        dashboard. If a no-show is reported, the donation is refunded to the pitcher.
        After 30 days with no reports, the donation is treated as fulfilled.
      </p>
      <p style="font-size:16px;color:#333;">
        Meeting link: <a href="https://us05web.zoom.us/j/8316023167">Join via Zoom</a>
      </p>
      ${footer()}
    </div>
  `;
  await transporter.sendMail({
    from: FROM_EMAIL,
    to: p.recipientEmail,
    bcc: BCC_EMAIL,
    subject: 'Meeting confirmed on DonaTalk',
    html,
  });
}

type CompletionEmailParams = {
  recipientName: string;
  recipientEmail: string;
  otherPartyName: string;
  amount: number;
  reason: 'mutual-confirm' | 'timeout-no-complaints';
};

export async function sendCompletionEmail(p: CompletionEmailParams) {
  const reasonCopy = p.reason === 'mutual-confirm'
    ? 'Both of you confirmed the meeting happened.'
    : '30 days passed with no reports of a problem, so the donation is treated as fulfilled.';
  const html = `
    <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;padding:20px;">
      <h2 style="color:#2C3E50;">Donation fulfilled on DonaTalk</h2>
      <p style="font-size:16px;color:#333;">Hi ${p.recipientName},</p>
      <p style="font-size:16px;color:#333;">
        Your meeting with <strong>${p.otherPartyName}</strong> is now complete.
        ${reasonCopy} The <strong>$${p.amount.toFixed(2)}</strong> donation has
        been released from escrow.
      </p>
      ${footer()}
    </div>
  `;
  await transporter.sendMail({
    from: FROM_EMAIL,
    to: p.recipientEmail,
    bcc: BCC_EMAIL,
    subject: 'Donation fulfilled on DonaTalk',
    html,
  });
}

type RefundEmailParams = {
  recipientName: string;
  recipientEmail: string;
  otherPartyName: string;
  amount: number;
  reason: 'no-show-by-pitcher' | 'no-show-by-listener';
  recipientRole: 'pitcher' | 'listener';
};

export async function sendRefundEmail(p: RefundEmailParams) {
  const body =
    p.recipientRole === 'pitcher'
      ? p.reason === 'no-show-by-listener'
        ? `A no-show was reported for your meeting with <strong>${p.otherPartyName}</strong>. The <strong>$${p.amount.toFixed(2)}</strong> donation has been refunded to your DonaTalk balance.`
        : `You reported a no-show for your meeting with <strong>${p.otherPartyName}</strong>. The <strong>$${p.amount.toFixed(2)}</strong> donation has been refunded to your DonaTalk balance.`
      : p.reason === 'no-show-by-pitcher'
        ? `A no-show was reported for your meeting with <strong>${p.otherPartyName}</strong>. The escrowed donation has been refunded to them. You can still receive donations from future meetings.`
        : `You reported a no-show for your meeting with <strong>${p.otherPartyName}</strong>. The escrowed donation has been refunded to them.`;
  const html = `
    <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;padding:20px;">
      <h2 style="color:#2C3E50;">Meeting refunded on DonaTalk</h2>
      <p style="font-size:16px;color:#333;">Hi ${p.recipientName},</p>
      <p style="font-size:16px;color:#333;">${body}</p>
      ${footer()}
    </div>
  `;
  await transporter.sendMail({
    from: FROM_EMAIL,
    to: p.recipientEmail,
    bcc: BCC_EMAIL,
    subject: 'Meeting refunded on DonaTalk',
    html,
  });
}
