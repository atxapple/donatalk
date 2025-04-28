import { createStitches } from '@stitches/react';

export const { styled, css, globalCss, theme, getCssText, } = createStitches({
  theme: {
    colors: {
      heart: '#E74C3C',
      coral: '#F8A5A5',
      dark: '#2C3E50',
      light: '#ECF0F1',
      accent: '#F1C40F',
      mediumgray: '#95A5A6',
      darkgray: '#656566',
      purple: '#9B59B6',
      white: '#ffffff',
    },
    fonts: {
      body: 'Segoe UI, Tahoma, Geneva, Verdana, sans-serif',
    },
    fontSizes: {
      base: '16px',
      md: '18px',
      xl: '24px',
      xxl: '32px',
    },
    space: {
      sm: '8px',
      md: '16px',
      lg: '32px',
    },
    radii: {
      sm: '4px',
      md: '8px',
      lg: '16px',
    },
  },
});

export type { CSS } from '@stitches/react';
