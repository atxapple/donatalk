import type { AppProps } from 'next/app';
import Head from 'next/head';
import { globalCss } from '../styles/stitches.config';
import dynamic from 'next/dynamic';
import Footer from '../components/Footer';

// ✅ Use dynamic to disable SSR for Navbar if hydration mismatch persists
const Navbar = dynamic(() => import('../components/Navbar'), { ssr: false });

const globalStyles = globalCss({
  '*': { margin: 0, padding: 0, boxSizing: 'border-box' },
  body: {
    fontFamily: 'Arial, sans-serif',
    backgroundColor: '#fafafa',
    color: '#333',
    minHeight: '100vh',
    display: 'flex',
    flexDirection: 'column',
  },
  a: { textDecoration: 'none' },
});

export default function App({ Component, pageProps }: AppProps) {
  globalStyles();

  return (
    <>
      <Head>
        <title>DonaTalk</title>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </Head>
      <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
        <Navbar />
        <main style={{ flexGrow: 1 }}>
          <Component {...pageProps} />
        </main>
        <Footer />
      </div>
    </>
  );
}
