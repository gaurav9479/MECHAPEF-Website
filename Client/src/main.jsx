import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import { Analytics } from "@vercel/analytics/react";
import { SpeedInsights } from "@vercel/speed-insights/react";
import BackgroundGears from "./components/BackgroundGears/BackgroundGears";
import { HelmetProvider } from 'react-helmet-async';
import "./index.css";

const root = ReactDOM.createRoot(document.getElementById('root'));
if (import.meta.env.DEV) {
  root.render(
    <HelmetProvider>
      <BackgroundGears />
      <App />
      <Analytics />
      <SpeedInsights />
    </HelmetProvider>
  );
} else {
  root.render(
    <React.StrictMode>
      <HelmetProvider>
        <BackgroundGears />
        <App />
        <Analytics />
        <SpeedInsights />
      </HelmetProvider>
    </React.StrictMode>
  );
}