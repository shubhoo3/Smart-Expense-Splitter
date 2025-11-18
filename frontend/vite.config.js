import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig(({ mode }) => ({
  plugins: [react()],

  // Only use proxy in development mode
  server: {
    proxy: mode === "development" ? {
      "/api": {
        target: "http://localhost:5000",  // your local backend
        changeOrigin: true,
        secure: false,
      }
    } : undefined
  },
}));
