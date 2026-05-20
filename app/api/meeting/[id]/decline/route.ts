import { declineMeeting } from '@/lib/meetingActions';
import { sendDeclineNoticeToVisitor } from '@/lib/meetingEmails';

type RouteContext = { params: Promise<{ id: string }> };

function htmlPage(title: string, body: string, color = '#2C3E50'): string {
  return `<!DOCTYPE html><html><head><meta charset="utf-8"><title>${title} | DonaTalk</title></head>
<body style="font-family:Arial,sans-serif;background:#f7f7f7;margin:0;padding:40px;">
  <div style="max-width:600px;margin:0 auto;background:#fff;border-radius:8px;padding:40px;text-align:center;">
    <h1 style="color:${color};margin-top:0;">${title}</h1>
    ${body}
    <p style="margin-top:30px;"><a href="https://donatalk.com" style="color:${color};">Back to DonaTalk</a></p>
  </div>
</body></html>`;
}

function htmlResponse(status: number, html: string): Response {
  return new Response(html, { status, headers: { 'Content-Type': 'text/html; charset=utf-8' } });
}

export async function GET(req: Request, context: RouteContext) {
  const { id } = await context.params;
  const url = new URL(req.url);
  const rawToken = url.searchParams.get('token');

  if (!id || !rawToken) {
    return htmlResponse(400, htmlPage('Invalid Link', '<p>This link is missing required information.</p>', '#c0392b'));
  }

  try {
    const result = await declineMeeting(id, { mode: 'token', rawToken });

    switch (result.kind) {
      case 'not-found':
        return htmlResponse(404, htmlPage('Meeting not found', '<p>This meeting does not exist or has been removed.</p>', '#c0392b'));
      case 'invalid-auth':
        return htmlResponse(403, htmlPage('Invalid Link', '<p>The token in this link is invalid.</p>', '#c0392b'));
      case 'token-used':
        return htmlResponse(200, htmlPage('Already Used', '<p>This link has already been used.</p>'));
      case 'terminal-state':
        return htmlResponse(200, htmlPage(`Already ${result.status}`, `<p>This meeting was already ${result.status}.</p>`));
      case 'declined': {
        try {
          await sendDeclineNoticeToVisitor({
            recipientName: result.recipientName || 'there',
            recipientEmail: result.recipientEmail || '',
            otherPartyName: result.otherPartyName || 'the other party',
            amountReleased: result.wasReserved ? result.amount : null,
          });
        } catch (e) {
          console.error('[Decline Notice Failed]', e);
        }
        const releaseMsg = result.wasReserved
          ? `<p>The pitcher's <strong>$${result.amount.toFixed(2)}</strong> reservation has been released.</p>`
          : '';
        return htmlResponse(200, htmlPage(
          'Request declined',
          `<p>You've declined this meeting request. We've let them know.</p>${releaseMsg}`,
        ));
      }
    }
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    console.error('[Meeting Decline Error]', message);
    return htmlResponse(500, htmlPage('Error', '<p>Something went wrong. Please contact support@donatalk.com</p>', '#c0392b'));
  }
}
