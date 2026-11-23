import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import App from "./App";
import { detectDevice } from "./lib/device";
import "./styles.css";

detectDevice();

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
