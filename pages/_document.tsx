import Document, { Html, Head, Main, NextScript } from "next/document";
import { getCssText } from "../styles/stitches.config";

export default class MyDocument extends Document {
  static async getInitialProps(ctx: any) {
    const initialProps = await Document.getInitialProps(ctx);
    return {
      ...initialProps,
      styles: (
        <>
          {initialProps.styles}
          <style id="stitches" dangerouslySetInnerHTML={{ __html: getCssText() }} />
        </>
      ),
    };
  }

  render() {
    return (
      <Html lang="en">
        <Head />
        <body>
          <Main />
          <NextScript />
        </body>
      </Html>
    );
  }
}
