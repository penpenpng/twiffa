import { AppComponent } from "next/dist/next-server/lib/router/router";
import React from "react";

import "../styles/global.css";

const app: AppComponent = ({ Component, pageProps }) => {
  return (
    <React.StrictMode>
      <Component {...pageProps} />
    </React.StrictMode>
  );
};

export default app;
