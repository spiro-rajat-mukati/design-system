import React from "react";
import ReactDOM from "react-dom/client";
import "./index.css";

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <div style={{ fontFamily: "var(--font-family-sans, sans-serif)", padding: "2rem" }}>
      <h1>Kijani Web</h1>
      <p>
        Run <code>npm run storybook</code> to explore components.
      </p>
    </div>
  </React.StrictMode>
);
