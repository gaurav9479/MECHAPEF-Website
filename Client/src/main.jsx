import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import BackgroundGears from "./components/BackgroundGears/BackgroundGears";
import { HelmetProvider } from 'react-helmet-async';
import "./index.css";

const root = ReactDOM.createRoot(document.getElementById('root'));
if (import.meta.env.DEV) {
  root.render(
    <HelmetProvider>
      <BackgroundGears />
      <App />
    </HelmetProvider>
  );
} else {
  root.render(
    <React.StrictMode>
      <HelmetProvider>
        <BackgroundGears />
        <App />
      </HelmetProvider>
    </React.StrictMode>
  );
}