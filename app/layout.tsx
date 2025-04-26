// app/layout.tsx
// import './globals.css'; // Optional: your global CSS if any
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'PayPal Checkout Example',
  description: 'A simple PayPal integration example with Next.js',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head />
      <body className="bg-gray-50 text-black">
        {children}
      </body>
    </html>
  );
}
