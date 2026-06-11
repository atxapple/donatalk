// components/GoogleTag.tsx
'use client';

import Script from 'next/script';

// Google Ads conversion tag (existing) + GA4 measurement id (set
// NEXT_PUBLIC_GA_MEASUREMENT_ID in Vercel; GA4 config is skipped when absent
// so local dev doesn't pollute analytics).
export const ADS_ID = 'AW-17050482317';
export const GA_ID = process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID || '';

export default function GoogleTag() {
  return (
    <>
      <Script
        src={`https://www.googletagmanager.com/gtag/js?id=${GA_ID || ADS_ID}`}
        strategy="afterInteractive"
      />
      <Script id="gtag-init" strategy="afterInteractive">
        {`
        window.dataLayer = window.dataLayer || [];
        function gtag(){dataLayer.push(arguments);}
        gtag('js', new Date());
        gtag('config', '${ADS_ID}');
        ${GA_ID ? `gtag('config', '${GA_ID}');` : ''}
      `}
      </Script>
    </>
  );
}
