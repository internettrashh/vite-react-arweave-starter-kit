import crypto from "node:crypto";
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

const indexHtmlHash = {
  name: "html-hash",
  enforce: "post",
  generateBundle(_options, bundle) {
    const indexHtml = bundle["index.html"];
    indexHtml.fileName = `index-${crypto
      .createHash("sha256")
      .update(indexHtml.source)
      .digest("hex")
      .substring(0, 8)}.html`;
  },
};

export default defineConfig({
  plugins: [react(), indexHtmlHash],
  base: "./",
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          react: ["react", "react-dom"],
        },
      },
    },
  },
});
