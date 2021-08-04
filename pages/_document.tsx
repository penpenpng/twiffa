import Document, { Html, Head, Main, NextScript } from "next/document";

type Props = {};

class AppDocument extends Document<Props> {
  render() {
    return (
      <Html>
        <Head>
          <link rel="preconnect" href="https://fonts.googleapis.com" />
          <link rel="preconnect" href="https://fonts.gstatic.com" />
          <link
            href="https://fonts.googleapis.com/css2?family=Titillium+Web:ital,wght@1,300&display=swap"
            rel="stylesheet"
          />
        </Head>
        <body className="bg-yellow-50">
          <Main />
          <NextScript />
        </body>
      </Html>
    );
  }
}

export default AppDocument;
