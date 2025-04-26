// lib/verify-webhook.ts
import paypal from '@paypal/paypal-server-sdk';

export async function verifyWebhookSignature(
  req: Request,
  body: any,
  webhookId: string
) {
  const transmissionId = req.headers.get('paypal-transmission-id')!;
  const timestamp = req.headers.get('paypal-transmission-time')!;
  const signature = req.headers.get('paypal-transmission-sig')!;
  const certUrl = req.headers.get('paypal-cert-url')!;
  const authAlgo = req.headers.get('paypal-auth-algo')!;

  const request = new paypal.notifications.VerifyWebhookSignatureRequest();
  request.requestBody({
    auth_algo: authAlgo,
    cert_url: certUrl,
    transmission_id: transmissionId,
    transmission_sig: signature,
    transmission_time: timestamp,
    webhook_id: webhookId,
    webhook_event: body,
  });

  try {
    const client = new paypal.core.PayPalHttpClient(
      new paypal.core.LiveEnvironment(
        process.env.PAYPAL_CLIENT_ID!,
        process.env.PAYPAL_CLIENT_SECRET!
      )
    );
    const response = await client.execute(request);
    return response.result.verification_status === 'SUCCESS';
  } catch (error) {
    console.error('Webhook verification failed:', error);
    return false;
  }
}
