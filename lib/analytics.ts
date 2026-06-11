// lib/analytics.ts
// Client-side event helpers. Safe no-ops when gtag isn't loaded (SSR, ad
// blockers, missing env) so callers never need to guard.

type TagWindow = Window & {
  gtag?: (...args: unknown[]) => void;
  rdt?: (...args: unknown[]) => void;
};

export function trackEvent(name: string, params?: Record<string, unknown>): void {
  if (typeof window === 'undefined') return;
  const w = window as TagWindow;
  if (typeof w.gtag !== 'function') return;
  try {
    w.gtag('event', name, params || {});
  } catch {
    // analytics must never break the app
  }
}

function trackReddit(eventName: string, params?: Record<string, unknown>): void {
  if (typeof window === 'undefined') return;
  const w = window as TagWindow;
  if (typeof w.rdt !== 'function') return;
  try {
    w.rdt('track', eventName, params || {});
  } catch {
    // analytics must never break the app
  }
}

/** Real account creation — GA4 sign_up + Reddit SignUp. */
export function trackSignup(role: 'pitcher' | 'listener', method: 'email' | 'google'): void {
  trackEvent('sign_up', { method, role });
  trackReddit('SignUp');
}

/** Fund deposit completed via PayPal — GA4 purchase + Reddit Purchase. */
export function trackAddFund(amountUsd: number, orderId: string): void {
  trackEvent('purchase', {
    transaction_id: orderId,
    value: amountUsd,
    currency: 'USD',
  });
  trackReddit('Purchase', { value: amountUsd, currency: 'USD', transactionId: orderId });
}
