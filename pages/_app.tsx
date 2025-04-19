import type { AppProps } from 'next/app';
import { globalCss } from '../styles/stitches.config';

const globalStyles = globalCss({
  '*': { margin: 0, padding: 0, boxSizing: 'border-box' },
  body: {
    fontFamily: '$body',
    backgroundColor: '$light',
    color: '$dark',
  },
  button: {
    cursor: 'pointer',
  },
});

export default function MyApp({ Component, pageProps }: AppProps) {
  globalStyles();
  return <Component {...pageProps} />;
}
