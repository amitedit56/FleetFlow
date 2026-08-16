const API_URL =
  import.meta.env.VITE_API_BASE_URL ||
  "http://127.0.0.1:8000";

export const API_BASE_URL = API_URL.replace(/\/$/, "");

export const WS_BASE_URL = API_BASE_URL.replace(/^http:/, "ws:").replace(
  /^https:/,
  "wss:"
);