const isLocalhost =
  window.location.hostname === "localhost" ||
  window.location.hostname === "127.0.0.1";

const API_URL =
  import.meta.env.VITE_API_BASE_URL ||
  (isLocalhost ? "http://127.0.0.1:8000" : "");

if (!API_URL) {
  throw new Error("Set VITE_API_BASE_URL to the deployed backend URL.");
}

export const API_BASE_URL = API_URL.replace(/\/$/, "");

export const WS_BASE_URL = API_BASE_URL
  .replace(/^http:/, "ws:")
  .replace(/^https:/, "wss:");