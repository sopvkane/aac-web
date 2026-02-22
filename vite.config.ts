import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      // Proxy API calls to Spring Boot
      "/api": {
        target: "http://localhost:8080",
        changeOrigin: true,
        secure: false,
      },

      // Useful for quickly checking health/info during dev
      "/actuator": {
        target: "http://localhost:8080",
        changeOrigin: true,
        secure: false,
      },
    },
  },
});