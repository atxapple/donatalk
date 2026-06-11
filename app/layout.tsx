// /app/layout.tsx
import '../styles/globals.css';                      // ✅ Global styles
import Navbar from '../components/Navbar';           // ✅ Navbar component
import Footer from '../components/Footer';           // ✅ Footer component
import { Providers } from './providers';             // ✅ Added Theme Provider
import LoadingScreen from '../components/LoadingScreen'; // ✅ Added Loading Screen
import GoogleTag from '../components/GoogleTag';
import RedditPixel from '../components/RedditPixel';

export const metadata = {
  title: 'DonaTalk',
  description: 'Share your cause and connect with supporters',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="light" suppressHydrationWarning>
      {/* Google Ads + GA4 + Reddit */}
      <GoogleTag />
      <RedditPixel />

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