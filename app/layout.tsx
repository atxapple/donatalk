// /app/layout.tsx
import '../styles/globals.css';                      // ✅ Global styles
import Navbar from '../components/Navbar';           // ✅ Navbar component
import Footer from '../components/Footer';           // ✅ Footer component
import { Providers } from './providers';             // ✅ Added Theme Provider
import LoadingScreen from '../components/LoadingScreen'; // ✅ Added Loading Screen
import Script from 'next/script';

export const metadata = {
  title: 'DonaTalk',
  description: 'Share your cause and connect with supporters',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="light" suppressHydrationWarning>
      {/* G Tag Manager */}
      <Script
        src="https://www.googletagmanager.com/gtag/js?id=AW-17050482317"
        strategy="afterInteractive"
      />
      <Script id="gtag-init" strategy="afterInteractive">
        {`
        window.dataLayer = window.dataLayer || [];
        function gtag(){dataLayer.push(arguments);}
        gtag('js', new Date());
        gtag('config', 'AW-17050482317');
      `}
      </Script>

      <body>
        <Providers>
          <LoadingScreen>
            <Navbar />                               {/* ✅ Added Navbar */}
            <main style={{ flexGrow: 1 }}>{children}</main>
            <Footer />                               {/* ✅ Added Footer */}
          </LoadingScreen>
        </Providers>
      </body>
    </html>
  );
}