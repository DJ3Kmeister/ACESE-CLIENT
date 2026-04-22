import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import App from "./App";

// Force Service Worker update on every new version
if ('serviceWorker' in navigator) {
  navigator.serviceWorker.getRegistrations().then(function(registrations) {
    registrations.forEach(function(reg) {
      reg.update();
    });
  });

  // Listen for new service worker waiting
  navigator.serviceWorker.addEventListener('controllerchange', function() {
    // New version detected — auto-reload once
    window.location.reload();
  });
}

// Auto-update: check every 5 minutes if a new version is available
setInterval(function() {
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.getRegistrations().then(function(registrations) {
      registrations.forEach(function(reg) {
        reg.update();
      });
    });
  }
}, 5 * 60 * 1000);

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <App />
  </StrictMode>
);
