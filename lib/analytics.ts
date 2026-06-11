// lib/analytics.ts
// Client-side event helpers. Safe no-ops when gtag isn't loaded (SSR, ad
// blockers, missing env) so callers never need to guard.

type GtagWindow = Window & { gtag?: (...args: unknown[]) => void };

export function trackEvent(name: string, params?: Record<string, unknown>): void {
  if (typeof window === 'undefined') return;
  const w = window as GtagWindow;
  if (typeof w.gtag !== 'function') return;
  try {
    w.gtag('event', name, params || {});
  } catch {
    // analytics must never break the app
  }
}

/** GA4 standard sign_up event, tagged with our role + auth method. */
export function trackSignup(role: 'pitcher' | 'listener', method: 'email' | 'google'): void {
  trackEvent('sign_up', { method, role });
}

/** Fund deposit completed via PayPal — GA4 purchase event. */
export function trackAddFund(amountUsd: number, orderId: string): void {
  trackEvent('purchase', {
    transaction_id: orderId,
    value: amountUsd,
    currency: 'USD',
  });
}
