import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import path from "path";

export default defineConfig({
  plugins: [react(), tailwindcss()],
  root: "src/renderer",
  base: "./",
  build: {
    outDir: "../../dist/renderer",
    emptyOutDir: true,
    rollupOptions: {
      input: {
        main: path.resolve(__dirname, "src/renderer/index.html"),
        indicator: path.resolve(__dirname, "src/renderer/indicator.html"),
      },
    },
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "src/renderer"),
    },
  },
  server: {
    port: 5173,
  },
});
