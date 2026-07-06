import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import BackgroundGears from "./components/BackgroundGears/BackgroundGears";
import "./index.css";

const root = ReactDOM.createRoot(document.getElementById('root'));
if (import.meta.env.DEV) {
  root.render(
    <>
      <BackgroundGears />
      <App />
    </>
  );
} else {
  root.render(
    <React.StrictMode>
      <BackgroundGears />
      <App />
    </React.StrictMode>
  );
}