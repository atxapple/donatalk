// /app/layout.tsx
import '@/styles/globals.css'; // if you also have Tailwind or global CSS
import { globalCss } from '../styles/stitches.config';  // ✅ Import your stitches config

export const metadata = {
  title: 'DonaTalk',
  description: 'Share your cause and connect with supporters',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        {children}
      </body>
    </html>
  );
}
