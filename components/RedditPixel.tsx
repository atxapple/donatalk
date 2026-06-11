// components/RedditPixel.tsx
'use client';

import Script from 'next/script';

// Reddit conversion pixel. Set NEXT_PUBLIC_REDDIT_PIXEL_ID in Vercel; skipped
// when absent so local dev stays clean. PageVisit fires on load; SignUp and
// Purchase are fired from lib/analytics.ts alongside the GA4 events.
export const REDDIT_PIXEL_ID = process.env.NEXT_PUBLIC_REDDIT_PIXEL_ID || '';

export default function RedditPixel() {
  if (!REDDIT_PIXEL_ID) return null;
  return (
    <Script id="reddit-pixel" strategy="afterInteractive">
      {`
      !function(w,d){if(!w.rdt){var p=w.rdt=function(){p.sendEvent?p.sendEvent.apply(p,arguments):p.callQueue.push(arguments)};p.callQueue=[];var t=d.createElement("script");t.src="https://www.redditstatic.com/ads/pixel.js";t.async=true;var s=d.getElementsByTagName("script")[0];s.parentNode.insertBefore(t,s)}}(window,document);
      rdt('init','${REDDIT_PIXEL_ID}');
      rdt('track','PageVisit');
    `}
    </Script>
  );
}
